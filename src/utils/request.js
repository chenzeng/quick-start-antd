import fetch from 'dva/fetch';
import { notification } from 'antd';
import router from 'umi/router';
import hash from 'hash.js';
import { isAntdPro, storageSet, storageGet } from './utils';
import { stringify } from 'qs';

const codeMessage = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '验证已过期，请重新登录。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。',
};

const checkStatus = response => {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  if (response.status === 401) {
    return response;
  }
  const errortext = codeMessage[response.status] || response.statusText;
  notification.error({
    message: `请求错误 ${response.status}: ${response.url}`,
    description: errortext,
  });
  const error = new Error(errortext);
  error.name = response.status;
  error.response = response;
  throw error;
};

const cachedSave = (response, hashcode) => {
  /**
   * Clone a response data and store it in sessionStorage
   * Does not support data other than json, Cache only json
   */
  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.match(/application\/json/i)) {
    // All data is saved as text
    response
      .clone()
      .text()
      .then(content => {
        sessionStorage.setItem(hashcode, content);
        sessionStorage.setItem(`${hashcode}:timestamp`, Date.now());
      });
  }
  return response;
};

const saveStorage = (response, url) => {
  /**
   * Clone a response data and store it in sessionStorage
   * Does not support data other than json, Cache only json
   */
  if (url && url === '/login') {
    const token = response.headers.get('x-auth-token');
    storageSet('demo', token);
  } else if (url && url === '/logout') {
    sessionStorage.removeItem('demo');
  }
  return response;
};

/**
 * Requests a URL, returning a promise.
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [option] The options we want to pass to "fetch"
 * @return {object}           An object containing either "data" or "err"
 */
export default function request(url, option) {
  const options = {
    expirys: isAntdPro(),
    ...option,
  };
  /**
   * Produce fingerprints based on url and parameters
   * Maybe url has the same parameters
   */
  let newUrl = url;
  if (process.env.UMI_ENV !== 'dev') {
    // let urlList = ['login', 'logout', 'image', 'file'];
    // let path = url.split('/')[1];
    // let flag = urlList.find(value => value == path);
    // if (flag === undefined) {
      newUrl = '/operation' + newUrl;
    // }
  }
  let fingerprint = newUrl + (options.body ? JSON.stringify(options.body) : '');
  const hashcode = hash
    .sha256()
    .update(fingerprint)
    .digest('hex');

  const defaultOptions = {
    credentials: 'include',
  };
  const { type, ...rest } = options;
  const newOptions = { ...defaultOptions, ...rest };
  // header里加入x-auth-token信息，用于通过后台校验
  let token = storageGet('demo');
  if (token) {
    newOptions.headers = {
      ...newOptions.headers,
      ['x-auth-token']: token,
    };
  }
  if (
    newOptions.method === 'POST' ||
    newOptions.method === 'PUT' ||
    newOptions.method === 'DELETE'
  ) {
    if (!(newOptions.body instanceof FormData)) {
      newOptions.headers = {
        Accept: 'application/json',
        'Content-Type': `application/${
          type === 'x-www-form-urlencoded' ? type : 'json'
        }; charset=utf-8`,
        ...newOptions.headers,
      };
      if (type === 'x-www-form-urlencoded') {
        newOptions.body = stringify(newOptions.body);
      } else {
        newOptions.body = JSON.stringify(newOptions.body);
      }
    } else {
      // newOptions.body is FormData
      newOptions.headers = {
        Accept: 'application/json',
        ...newOptions.headers,
      };
    }
  }

  const expirys = options.expirys && 60;
  // options.expirys !== false, return the cache,
  if (options.expirys !== false) {
    const cached = sessionStorage.getItem(hashcode);
    const whenCached = sessionStorage.getItem(`${hashcode}:timestamp`);
    if (cached !== null && whenCached !== null) {
      const age = (Date.now() - whenCached) / 1000;
      if (age < expirys) {
        const response = new Response(new Blob([cached]));
        return response.json();
      }
      sessionStorage.removeItem(hashcode);
      sessionStorage.removeItem(`${hashcode}:timestamp`);
    }
  }
  return (
    fetch(newUrl, newOptions)
      // .then(checkStatus) // 抛出报错信息
      // .then(response => cachedSave(response, hashcode)) // 登录缓存
      .then(response => saveStorage(response, url))
      .then(response => {
        // DELETE and 204 do not return data by default
        // using .json will report an error.
        if (newOptions.method === 'DELETE' || response.status === 204) {
          return response.text();
        }
        if (response.status === 401) {
          window.g_app._store.dispatch({
            type: 'login/logout',
          });
        }
        return response.json();
      })
      .catch(e => {
        const status = e.name;
        if (status === 401) {
          // @HACK
          /* eslint-disable no-underscore-dangle */
          window.g_app._store.dispatch({
            type: 'login/logout',
          });
          return;
        }
        // environment should not be used
        // if (status === 403) {
        //   router.push('/exception/403');
        //   return;
        // }
        // if (status <= 504 && status >= 500) {
        //   router.push('/exception/500');
        //   return;
        // }
        // if (status >= 404 && status < 422) {
        //   router.push('/exception/404');
        // }
      })
  );
}
