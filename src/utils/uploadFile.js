import fetch from 'dva/fetch';
import { isAntdPro, storageSet, storageGet } from './utils';
import { message } from 'antd';
// 上传文件
export default function uploadFile({
  url = '',
  params = {},
  file,
  method = 'POST',
  success,
  errorCall,
  processFn,
}) {
  let formData = new FormData();
  formData.append('file ', file);
  // 添加其他参数
  for (let item in params) {
    if (item != 'file ' && params[item]) {
      formData.append(item, params[item]);
    }
  }
  let token = storageGet('OperationToken');
  fetch(url, {
    method,
    body: formData,
    credentials: 'include',
    headers: new Headers({
      // 'Content-Type': 'multipart/form-data',
      ['x-auth-token']: token,
    }),
  })
    .then(response => response.json())
    .then(res => {
      if (res.code === 301) {
        message.error('请登录');
        window.g_app._store.dispatch({
          type: 'login/logout',
        });
        return;
      }
      if (success && typeof success === 'function') {
        success(res);
      }
    })
    .catch(error => {
      if (errorCall && typeof errorCall === 'function') {
        errorCall(error);
      }
    });
}
