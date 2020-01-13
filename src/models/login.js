import { routerRedux } from 'dva/router';
import { stringify } from 'qs';
import { accountLogin, logout, retrieve, resetPassword } from '@/services/login';
import { setAuthority } from '@/utils/authority';
import { getPageQuery } from '@/utils/utils';
import { reloadAuthorized } from '@/utils/Authorized';

export default {
  namespace: 'login',

  state: {
    status: undefined,
  },

  effects: {
    *login({ payload, callback }, { call, put }) {
      const response = yield call(accountLogin, payload);
      const { code, data = '' } = response;
      if (callback) {
        callback(response);
      }
      if (code !== 200) {
        return;
      }
      yield put({
        type: 'changeLoginStatus',
        payload: {
          status: true,
          type: 'account',
          currentAuthority: 'admin',
        },
      });
      // Login successfully

      reloadAuthorized();
      // const urlParams = new URL(window.location.href);
      // const params = getPageQuery();
      // let { redirect } = params;
      // if (redirect) {
      //   const redirectUrlParams = new URL(redirect);
      //   if (redirectUrlParams.origin === urlParams.origin) {
      //     redirect = redirect.substr(urlParams.origin.length);
      //     if (redirect.match(/^\/.*#/)) {
      //       redirect = redirect.substr(redirect.indexOf('#') + 1);
      //     }
      //   } else {
      //     window.location.href = redirect;
      //     return;
      //   }
      // }
      // yield put(routerRedux.replace(redirect || '/'));
      yield put(routerRedux.replace('/'));
    },
    // 获取验证码
    // *getCaptcha({ payload }, { call }) {
    //   yield call(getFakeCaptcha, payload);
    // },

    *logout({ payload, callback }, { call, put }) {
      const response = yield call(logout, payload);
      const { code = 404, data = '' } = response;
      if (callback) {
        callback(response);
      }
      if (code !== 200) {
        return;
      }
      yield put({
        type: 'changeLoginStatus',
        payload: {
          status: false,
          currentAuthority: 'guest',
        },
      });
      reloadAuthorized();
      yield put(
        routerRedux.push({
          pathname: '/user/login',
          search: stringify({
            // redirect: window.location.href,
          }),
        })
      );
    },

    // 忘记密码
    *retrieve({ payload, callback }, { call }) {
      const response = yield call(retrieve, payload);
      if (callback) {
        callback(response);
      }
    },

    *resetPassword({ payload, callback }, { call }) {
      const response = yield call(resetPassword, payload);
      if (callback) {
        callback(response);
      }
    },
  },

  reducers: {
    changeLoginStatus(state, { payload }) {
      setAuthority(payload.currentAuthority);
      return {
        ...state,
        status: payload.status,
        type: payload.type,
      };
    },
  },
};
