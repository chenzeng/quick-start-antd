import memoizeOne from 'memoize-one';
import isEqual from 'lodash/isEqual';
import { formatMessage } from 'umi/locale';
import Authorized from '@/utils/Authorized';
import { setAuthority } from '@/utils/authority';
import { stringify, parse } from 'qs';
import { routerRedux } from 'dva/router';
import { queryUserData, getAuth } from '@/services/user';
import { filterMenuList, expandAuthList } from '@/utils/utils';

const { check } = Authorized;

// Conversion router to menu.
function formatter(data, parentAuthority, parentName) {
  return data
    .map(item => {
      if (!item.name || !item.path) {
        return null;
      }

      let locale = 'menu';
      if (parentName) {
        locale = `${parentName}.${item.name}`;
      } else {
        locale = `menu.${item.name}`;
      }

      const result = {
        ...item,
        name: formatMessage({ id: locale, defaultMessage: item.name }),
        locale,
        authority: item.authority || parentAuthority,
      };
      if (item.routes) {
        const children = formatter(item.routes, item.authority, locale);
        // Reduce memory usage
        result.children = children;
      }
      delete result.routes;
      return result;
    })
    .filter(item => item);
}

const memoizeOneFormatter = memoizeOne(formatter, isEqual);

/**
 * get SubMenu or Item
 */
const getSubMenu = item => {
  // doc: add hideChildrenInMenu
  if (item.children && !item.hideChildrenInMenu && item.children.some(child => child.name)) {
    return {
      ...item,
      children: filterMenuData(item.children), // eslint-disable-line
    };
  }
  return item;
};

/**
 * filter menuData
 */
const filterMenuData = menuData => {
  if (!menuData) {
    return [];
  }
  return menuData
    .filter(item => item.name && !item.hideInMenu)
    .map(item => check(item.authority, getSubMenu(item)))
    .filter(item => item);
};


// /**
//  * 筛掉按钮权限
//  * @param {Object} menuData 初始权限树数据
//  */
// const filterMenu = menuData => {
//   let newMenuData = [];
//   menuData.map(item => {
//     let { authorityType, routes } = item;
//     if (authorityType !== 3) {
//       if (routes && routes.length > 0) {
//         routes = filterMenu(routes);
//       }
//       newMenuData.push({
//         ...item,
//         routes,
//       });
//     }
//   });
//   return newMenuData;
// };

/**
 * 获取初始展示的路由
 * @param {Object} menuData 初始权限树数据
 */
const getInitPath = menuData => {
  let initPath = '';
  menuData.forEach(item => {
    let { routes, path, component} = item;
    if (component) {
      if (!initPath) {
        initPath = path;
      }
    } else {
      if (!initPath) {
        initPath = getInitPath(routes || []);
      }
    }
  });
  return initPath;
};


export default {
  namespace: 'menu',

  state: {
    userData: {},
    authData: [],
    menuVO: [],
  },

  effects: {
    *getUserInfo({ payload, callback }, { call, put }) {
      const response = yield call(queryUserData, payload);
      if (callback) {
        callback(response);
      }
      if (response.code !== 200) {
        if (response.code === 401) {
          yield put({
            type: 'changeLoginStatus',
            payload: {
              status: false,
              currentAuthority: 'guest',
            },
          });
          // reloadAuthorized();
          yield put(
            routerRedux.push({
              pathname: '/user/login',
              // search: stringify({
              //   redirect: window.location.href,
              // }),
            })
          );
        }
        return;
      }
      let userData = response.data || {};
      yield put({
        type: 'save',
        payload: {
          userData,
        },
      });
    },
    *getAuthData({ payload, callback }, { call, put }) {
      const responseAuth = yield call(getAuth, {}) || {};
      if (callback) {
        callback(responseAuth);
      }
      if (responseAuth.code !== 200) {
        return;
      }

      let { pathname, routes } = payload;
      let authData = responseAuth.data || [];
      let authList = expandAuthList(authData);
      let menuVO = filterMenuList(authList, routes) || [];
      // 路由和角色
      yield put({
        type: 'save',
        payload: {
          authData: authList,
          menuVO,
        },
      });
      // 跳转左侧菜单栏第一个页面
      let nowPath = payload.pathname;
      console.log('nowPath', nowPath);
      console.log(menuVO);
      let initNodePath = getInitPath(menuVO);
      let hasHome = menuVO.find(item => item.path === '/home');
      let initPath = '';
      if (nowPath === '/') {
        initPath = initNodePath || '/';
        if (hasHome !== undefined) {
          initPath = '/home';
        }
      } else {
        initPath = '/';
      }
      if (initPath !== '/') {
        yield put(
          routerRedux.push({
            pathname: initPath,
          })
        );
      }
    },
  },

  reducers: {
    save(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    },
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
