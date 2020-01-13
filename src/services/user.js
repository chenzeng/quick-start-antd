import request from '@/utils/request';

export async function query() {
  return request('/api/users');
}

export async function queryCurrent() {
  return request('/api/currentUser');
}

// 获取用户数据
export async function queryUserData() {
  return request('/login/user');
}
// 获取权限
export async function getAuth() {
  return request('/authority/user');
}
