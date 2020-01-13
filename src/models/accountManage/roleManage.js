import {
  queryRoleList,
  deleteRole,
  getRoleDetail,
  addRole,
  updateRole,
  getAuthList,
} from '@/services/accountManage/roleManage';

export default {
  namespace: 'roleManage',

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
    *getRoleList({ payload, callback }, { call, put }) {
      const response = yield call(queryRoleList, payload);
      let { code, data = [] } = response;
      if (callback) {
        callback(response);
      }
      if (code !== 200) {
        return;
      }
      yield put({
        type: 'queryRoleList',
        payload: data,
      });
    },
    *deleteRole({ payload, callback }, { call, put }) {
      const response = yield call(deleteRole, payload);
      if (callback) {
        yield callback(response);
      }
    },
    *getRoleDetail({ payload, callback }, { call, put }) {
      const response = yield call(getRoleDetail, payload);
      if (callback) {
        yield callback(response);
      }
    },
    *addRole({ payload, callback }, { call, put }) {
      const response = yield call(addRole, payload);
      if (callback) {
        yield callback(response);
      }
    },
    *updateRole({ payload, callback }, { call, put }) {
      const response = yield call(updateRole, payload);
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

  reducers: {
    queryRoleList(state, { payload }) {
      return {
        ...state,
        pagination: payload.pagination,
        list: payload.result,
      };
    },
  },
};
