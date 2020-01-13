import fetch from 'dva/fetch';
import { storageGet } from './utils';
import { stringify } from 'qs';

// 导出项目列表
export default function download({ url = '', params = {}, fileName = 'file', method = 'POST' }) {
  // header里加入x-auth-token信息，用于通过后台校验
  let token = storageGet('OperationToken');
  let newUrl = url;
  if (process.env.UMI_ENV !== 'dev') {
    let urlList = ['login', 'logout', 'image', 'file'];
    let path = url.split('/')[1];
    let flag = urlList.find(value => value == path);
    if (flag !== undefined) {
      newUrl = '/base/xhr' + newUrl;
    } else {
      newUrl = '/operation/xhr' + newUrl;
    }
  }
  let option = {
    method,
    credentials: 'include',
    headers: new Headers({
      ['Content-Type']: 'application/json',
      ['x-auth-token']: token,
    }),
  };
  if (method === 'GET' || method === 'get') {
    newUrl = `${newUrl}?${stringify(params)}`;
  } else {
    Object.assign(option, { body: JSON.stringify(params) });
  }
  //可以根据需求传特定的一些参数
  fetch(newUrl, option)
    .then(response => {
      response.blob().then(blob => {
        let blobUrl = window.URL.createObjectURL(blob);
        let a = document.createElement('a');
        // let a = document.getElementById('a_id');
        //无法从返回的文件流中获取文件名
        // let filename = response.headers.get('Content-Disposition');
        a.href = blobUrl;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        // document.removeChild(a);
      });
    })
    .catch(error => {
      console.log(error);
    });
}
