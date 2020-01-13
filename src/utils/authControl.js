import React, { Component } from 'react';
import { connect } from 'dva';
import pathToRegexp from 'path-to-regexp';

function withAuthControl(WrappedComponent) {
  class Auth extends Component {
    
    // 获取当前路由对应的权限下所有的按钮权限
    getPageAuthData = (authData, path) => {
      let pathData = (authData || []).filter(value => value.path === path)[0] || {};
      // 如果该权限节点是按钮页面复合的节点，获取父节点的下的按钮权限，传入该页面
      if (pathData.authorityType === 3) {
        pathData = (authData || []).filter(value => value.id === pathData.authorityParentId)[0] || {};
      }
      let subAuthData = (authData || []).filter(value => value.authorityParentId === pathData.id);
      let pageAuthData = [];
      subAuthData.forEach(item => {
        let { path } = item;
        // 页面的路由以“/”开头，所有不以“/”开头的path都认为是按钮的标识
        if (path.indexOf('/') !== 0) {
          pageAuthData.push(path);
        }
      })
      return pageAuthData;
    }
    
    // 检测是否拥有某按钮权限
    compareAuth(auth, authList = []) {
      let data = authList.find(value => value === auth);
      if (data === undefined) {
        return false;
      } else {
        return true;
      }
    }

    // 检测是否拥有某页面权限
    comparePageAuth(path, authList = []) {
      let authorityFlag = false;
      authList.map(item => {
        if (item.path && pathToRegexp(item.path).test(path)) {
          authorityFlag = true;
        }
      })
      return authorityFlag;
    }

    render() {
      const {
        authData,
        route: { path },
        ...restProps
      } = this.props;
      let pageAuthData = this.getPageAuthData(authData, path);
      return (
        <WrappedComponent
          pageAuthData={pageAuthData}
          getPageAuthData={(path) => this.getPageAuthData(authData, path)}
          compareAuth={(auth) => this.compareAuth(auth, pageAuthData)}
          comparePageAuth={(path) => this.comparePageAuth(path, authData)}
          {...this.props}
        />
      );
    }
  }
  return connect(({ menu }) => ({
    authData: menu.authData,
  }))(Auth);
}

export default withAuthControl;

export function compareAuth(auth, authList = []) {
  let data = authList.find(value => value === auth);
  if (data === undefined) {
    return false;
  } else {
    return true;
  }
}

