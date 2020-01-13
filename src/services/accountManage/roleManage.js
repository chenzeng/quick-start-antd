import request from '@/utils/request';
import { stringify } from 'qs';

export async function queryRoleList(params) {
  return request('/role/list', {
    method: 'POST',
    body: params,
  });
}

export async function deleteRole(params) {
  return request(`/role/delete?${stringify(params)}`, {
    method: 'DELETE',
  });
}

export async function getRoleDetail(params) {
  return request(`/role/${params}`);
}

export async function addRole(params) {
  return request('/role/insert', {
    method: 'PUT',
    body: params,
  });
}

export async function updateRole(params) {
  return request('/role/update', {
    method: 'POST',
    body: params,
  });
}

export async function getAuthList(params) {
  return request(`/authority/tree?${stringify(params)}`);
}
