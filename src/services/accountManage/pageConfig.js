import request from '@/utils/request';
import { stringify } from 'qs';

export async function queryAuthList(params) {
  return request(`/authority/dev/tree?${stringify(params)}`);
}

export async function deleteAuth(params) {
  return request(`/authority/dev/delete?${stringify(params)}`, {
    method: 'DELETE',
  });
}

export async function getAuthDetail(params) {
  return request(`/authority/dev/${params}`);
}

export async function addAuth(params) {
  return request('/authority/dev/insert', {
    method: 'POST',
    body: params,
  });
}

export async function updateAuth(params) {
  return request('/authority/dev/update', {
    method: 'POST',
    body: params,
  });
}
