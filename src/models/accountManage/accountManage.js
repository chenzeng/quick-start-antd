import {
  queryUserList,
  deleteUser,
  getUserDetail,
  addUser,
  updateUser,
  getAllRole,
  disableUser,
  enableUser,
} from '@/services/accountManage/accountManage';

export default {
  namespace: 'accountManage',

  state: {
    list: [],
    pagination: {
      page: 1,
      size: 10,
      total: 0,
      totalPage: 1,
    },
    detail: {},
  },

  effects: {
    *getUserList({ payload, callback }, { call, put }) {
      const response = yield call(queryUserList, payload);
      let { code, data = [] } = response;
      if (callback) {
        yield callback(response);
      }
    },
    *deleteUser({ payload, callback }, { call, put }) {
      const response = yield call(deleteUser, payload);
      if (callback) {
        yield callback(response);
      }
    },
    *getAllRole({ payload, callback }, { call, put }) {
      const response = yield call(getAllRole, payload);
      if (callback) {
        yield callback(response);
      }
    },
    *getUserDetail({ payload, callback }, { call, put }) {
      const response = yield call(getUserDetail, payload);
      if (callback) {
        yield callback(response);
      }
    },
    *addUser({ payload, callback }, { call, put }) {
      const response = yield call(addUser, payload);
      if (callback) {
        yield callback(response);
      }
    },
    *updateUser({ payload, callback }, { call, put }) {
      const response = yield call(updateUser, payload);
      if (callback) {
        yield callback(response);
      }
    },
    *disableUser({ payload, callback }, { call, put }) {
      const response = yield call(disableUser, payload);
      if (callback) {
        yield callback(response);
      }
    },
    *enableUser({ payload, callback }, { call, put }) {
      const response = yield call(enableUser, payload);
      if (callback) {
        yield callback(response);
      }
    },
  },

  reducers: {},
};
