import {
  queryAuthList,
  deleteAuth,
  getAuthDetail,
  addAuth,
  updateAuth,
  getAuthList,
} from '@/services/accountManage/pageConfig';

export default {
  namespace: 'pageConfig',

  state: {},

  effects: {
    *queryAuthList({ payload, callback }, { call, put }) {
      const response = yield call(queryAuthList, payload);
      let { code, data = [] } = response;
      if (callback) {
        callback(response);
      }
    },
    *deleteAuth({ payload, callback }, { call, put }) {
      const response = yield call(deleteAuth, payload);
      if (callback) {
        yield callback(response);
      }
    },
    *getAuthDetail({ payload, callback }, { call, put }) {
      const response = yield call(getAuthDetail, payload);
      if (callback) {
        yield callback(response);
      }
    },
    *addAuth({ payload, callback }, { call, put }) {
      const response = yield call(addAuth, payload);
      if (callback) {
        yield callback(response);
      }
    },
    *updateAuth({ payload, callback }, { call, put }) {
      const response = yield call(updateAuth, payload);
      if (callback) {
        yield callback(response);
      }
    },
    *getAuthList({ payload, callback }, { call, put }) {
      const response = yield call(getAuthList, payload);
      if (callback) {
        yield callback(response);
      }
    },
  },

  reducers: {},
};
