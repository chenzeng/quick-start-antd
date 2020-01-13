import request from '@/utils/request';
import { stringify } from 'qs';

export async function accountLogin(params) {
  return request('/login', {
    method: 'POST',
    body: params,
    type: 'x-www-form-urlencoded',
  });
}

export async function logout(params) {
  return request('/logout', {
    method: 'POST',
    body: params,
  });
}

export async function retrieve(params) {
  return request(`/management/user/checkPhone?${stringify(params)}`);
}

export async function resetPassword(params) {
  return request('/management/user/updatePassword', {
    method: 'POST',
    body: params,
  });
}
