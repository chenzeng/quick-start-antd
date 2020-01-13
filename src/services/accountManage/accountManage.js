import request from '@/utils/request';
import { stringify } from 'qs';

export async function queryUserList(params) {
  return request('/user/list', {
    method: 'POST',
    body: params,
  });
}

export async function deleteUser(params) {
  return request(`/user/delete/${params}`, {
    method: 'DELETE',
  });
}

export async function getUserDetail(params) {
  return request(`/user/${params}`, {
    method: 'GET',
  });
}

export async function getAllRole(params) {
  return request('/role/briefList');
}

export async function addUser(params) {
  return request('/user/add', {
    method: 'POST',
    body: params,
  });
}

export async function updateUser(params) {
  return request('/user/update', {
    method: 'POST',
    body: params,
  });
}

export async function disableUser(params) {
  return request(`/user/disable/${params}`);
}

export async function enableUser(params) {
  return request(`/user/enable/${params}`);
}
