import React, { Component } from 'react';
import Link from 'umi/link';
import { connect } from 'dva';
import router from 'umi/router';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';
import styles from './PageConfig.less';
import {
  Button, Icon, Table, Input, Select, Row, Col, Switch, Form, message, Radio, Checkbox, Modal, Tree, Divider, Popover
} from 'antd';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import { stringify, parse } from 'qs';

const { Option } = Select;
const FormItem = Form.Item;
const { TextArea } = Input;
const { TreeNode } = Tree;
const { confirm } = Modal;
@connect()
@Form.create()
class PageConfig extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editType: 'edit',
      id: null,
      nodeData: {
        alias: '', // 前端英文名
        mark: '',
        seq: '',
        showStatus: 1,
        authorityLevel: '',
        authorityName: '',
        authorityType: 1,
        authorityParentId: '',
        backendUniqueKey: '',
        frontendUniqueKey: [],
      },
      authData: {},
      authTree: [],
      authType: 1,
      parentIds: [],
    };
    this.pageType = name;
    //    console.log(this.props);
  }

  componentDidMount() {
    this.getAuthList();
  }
  getAuthList = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'pageConfig/queryAuthList',
      payload: {},
      callback: res => {
        const { code, data, msg } = res;
        if (code !== 200) {
          message.error(msg);
          return;
        }
        this.setState({
          authTree: data,
        });
      },
    });
  };

  getAuthDetail = id => {
    const {
      form: { resetFields },
      dispatch,
    } = this.props;
    dispatch({
      type: 'pageConfig/getAuthDetail',
      payload: Number(id),
      callback: res => {
        const { code, data, msg } = res;
        if (code !== 200) {
          message.error(msg);
          return;
        }
        let { authorityType, frontendUniqueKey, ...rest } = data || {};
        let newFrontendUniqueKey = frontendUniqueKey === '' ? {} : parse(frontendUniqueKey);
        let list = [];
        for (let i in newFrontendUniqueKey) {
          list.push(newFrontendUniqueKey[i])
        }
        this.setState({
          nodeData: {
            frontendUniqueKey: list,
            authorityType,
            ...rest,
          },
          authType: authorityType,
        });
        resetFields();
      },
    });
  };

  // 提交表单
  handleSubmit = e => {
    const { dispatch, form } = this.props;
    let { id, checkedList, editType, nodeData } = this.state;
    e.preventDefault();
    let url = editType === 'edit' ? 'pageConfig/updateAuth' : 'pageConfig/addAuth';
    form.validateFieldsAndScroll((err, values) => {
      // console.log(values);
      if (!err) {
        let { frontendUniqueKey, seq, path, ...rest } = values;
        let newList = frontendUniqueKey.map((item, index) => {
          return {
            path: path[index],
          }
        })
        let params = {
          ...rest,
          seq: Number(seq),
          frontendUniqueKey: stringify(newList)
        };
        let { authorityLevel, authorityParentId } = nodeData;
        id = id === null ? id : Number(id);
        authorityLevel = authorityLevel === null ? authorityLevel : Number(authorityLevel);
        authorityParentId = authorityParentId === null ? authorityParentId : Number(authorityParentId);
        if (editType === 'edit') {
          params = Object.assign({}, params, {
            id,
            authorityLevel,
            authorityParentId,
          });
        } else {
          params = Object.assign({}, params, {
            authorityParentId: id,
            authorityLevel: authorityLevel + 1,
          });
        }
        dispatch({
          type: url,
          payload: params,
          callback: res => {
            const { code, data, msg } = res;
            if (code !== 200) {
              message.error(msg);
              return;
            }
            message.success('保存成功！');
            this.getAuthList();
            // if (editType === 'add') {
            this.clearData();
            // }
          },
        });
      }
    });
  };
  clearData = () => {
    const {
      form: { resetFields },
    } = this.props;
    this.setState(
      {
        editType: 'edit',
        id: null,
        nodeData: {
          alias: '',
          mark: '',
          seq: '',
          showStatus: 1,
          authorityLevel: '',
          authorityName: '',
          authorityType: 1,
          authorityParentId: '',
          backendUniqueKey: '',
          frontendUniqueKey: [],
        },
        authType: 1,
      },
      () => {
        resetFields();
      }
    );
  };

  // 生成权限树
  renderAuthTree = ({ treeNodeData = [], parentIds = [] }) => {
    return treeNodeData.map(item => {
      const { authorityName, id, childrenList } = item;
      let renderNode = (
        <ContextMenuTrigger id="pageNodeMenu">
          <div
            className={styles.treeNode}
            onMouseDown={e => this.rightClickNode({ key: id, data: item, e, parentIds })}
            onDoubleClick={e => this.dblClickNode({ key: id, data: item, e })}
          >
            {authorityName}
          </div>
        </ContextMenuTrigger>
      );
      let newParentIds = [...parentIds];
      newParentIds.push(id);
      return (
        <TreeNode title={renderNode} key={id}>
          {childrenList &&
            this.renderAuthTree({ treeNodeData: childrenList, parentIds: newParentIds })}
        </TreeNode>
      );
    });
  };
  // 右键点击节点
  rightClickNode = ({ key, data = {}, e, parentIds }) => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({
      parentIds,
      id: key,
      authData: data,
    });
    // console.log(data);
  };
  // 左键双击
  dblClickNode = ({ key, data = {}, e, parentIds }) => {
    e.preventDefault();
    e.stopPropagation();
    if (key === 0) {
      message.warning('根节点不可编辑');
      return ;
    }
    this.setState({
      parentIds,
      id: key,
      editType: 'edit',
    }, () => {
      this.getAuthDetail(key);
    });
  };
  // 编辑当前节点
  editNode = e => {
    e.preventDefault();
    e.stopPropagation();
    const { id } = this.state;
    this.setState({
      editType: 'edit',
    },() => {
      this.getAuthDetail(id);
    });
  };
  // 新增子节点
  addSubNode = e => {
    e.preventDefault();
    e.stopPropagation();
    const {
      form: { resetFields },
    } = this.props;
    const { id } = this.state;

    if (id === 0) {
      this.setState(
        {
          editType: 'add',
          id: 0,
          nodeData: {
            alias: '',
            mark: '',
            seq: '',
            showStatus: 1,
            authorityLevel: '',
            authorityName: '根节点',
            authorityType: 1,
            authorityParentId: '',
            backendUniqueKey: '',
            frontendUniqueKey: [],
          },
          authType: 1,
        },
        () => {
          resetFields();
        }
      );
      return ;
    }
    this.setState({
      editType: 'add',
    },() => {
      this.getAuthDetail(id);
    });
  };
  // 删除用户
  deleteNode = e => {
    e.preventDefault();
    e.stopPropagation();
    const { dispatch } = this.props;
    const { id } = this.state;
    let confirmModal = confirm({
      content: '确认删除该权限？',
      onOk: () => {
        dispatch({
          type: 'pageConfig/deleteAuth',
          payload: { id },
          callback: res => {
            let { code, data, msg } = JSON.parse(res);
            if (code !== 200) {
              message.error(msg);
              return;
            }
            confirmModal.destroy();
            this.getAuthList();
            this.clearData();
          },
        });
      },
      onCancel: () => {
        confirmModal.destroy();
      },
    });
  };
  // 选择权限类型
  authorityTypeChange = e => {
    let value = e.target.value;
    this.setState({
      authType: value,
    });
  };
  // 勾选改变
  //  onChangeNode = ({key, checked, parentIds, e, nodeData}) => {
  //    e.preventDefault();
  //    e.stopPropagation();
  //    console.log(key, parentIds);
  //    const { checkedList } = this.state;
  //    let newCheckedList = [...checkedList];
  //    if (checked !== undefined) {
  //      newCheckedList = newCheckedList.filter(value => value.id !== key);
  //
  //    } else {
  //      newCheckedList.push({id: key});
  //      newCheckedList = this.getAllNode(nodeData.childrenList, newCheckedList);
  //      parentIds.forEach(item => {
  //        let checked = newCheckedList.find(value => value.id === item);
  //        if (checked === undefined) {
  //          newCheckedList.push({id: item})
  //        }
  //      })
  //    }
  //    this.setState({
  //      checkedList: newCheckedList,
  //    })
  //  }
  // 在对应节点下添加子节点
  //  insertTreeNode = (data = [], list = [], node = {}) => {
  //    let newList = [...list];
  //    let id = newList.shift();
  //    return data.map(item => {
  //      if (item.id === id) {
  //        const { childrenList = [], ...rest } = item;
  //        let newRoutes = [...childrenList];
  //        if (newList.length > 0) {
  //          newRoutes = this.insertTreeNode(childrenList, newList, node);
  //        } else {
  //          newRoutes.push(node);
  //        }
  //        return {
  //          childrenList: newRoutes,
  //          ...rest,
  //        }
  //      } else {
  //        return item;
  //      }
  //    })
  //  }
  removeCallback = (indexNum) => {
    let { nodeData = {} } = this.state;
    let { frontendUniqueKey = [], ...rest } = nodeData || {};
    let newList = frontendUniqueKey.filter((value, index) => index !== indexNum);
    this.setState({
      nodeData: {
        frontendUniqueKey: newList,
        ...rest
      }
    })
  }
  render() {
    const { authTree = [], nodeData = {}, id, editType, authType, authData } = this.state;
    const {
      form: { getFieldDecorator, getFieldValue }, form
    } = this.props;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 7 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 12 },
        md: { span: 10 },
      },
    };
    const formItemLayout2 = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 },
        md: { span: 12 },
      },
    };
    const submitFormLayout = {
      wrapperCol: {
        xs: { span: 24, offset: 0 },
        sm: { span: 10, offset: 8 },
      },
    };
    const layout = {
      xs: 24,
      sm: 24,
      lg: 8,
    };
    const layout2 = {
      xs: 24,
      sm: 24,
      lg: 16,
    };
    const layout3 = {
      xs: {
        span: 24,
        offset: 0,
      },
      sm: {
        span: 16,
        offset: 8,
      },
      md: {
        span: 16,
        offset: 8,
      },
    };
    const content = (
      <div>
        <p>1.右键菜单栏，包含编辑节点、删除节点、新增子节点功能</p>
        <p>2.按钮节点不可新增子节点</p>
        <p>3.双击节点可以编辑节点</p>
      </div>
    );
    return (
      <PageHeaderWrapper>
        <div className={styles.pageConfig}>
          <Form style={{ marginTop: 8 }}>
            <Row>
              <Col {...layout}>
                <div className={styles.box}>
                  <div style={{ borderBottom: "1px solid #dddddd", padding: '0 10px 10px 10px' }}>
                    <span className={styles.statement}><Popover content={content} placement="topRight">操作说明 <Icon type="question-circle" /></Popover></span>
                  </div>
                  <Tree>{this.renderAuthTree({ treeNodeData: authTree })}</Tree>
                </div>
              </Col>
              <Col {...layout2}>
                <div className={styles.box}>
                  <FormItem {...formItemLayout2} label="操作类型">
                    <Input value={editType === 'edit' ? '编辑节点' : '新增子节点'} disabled />
                  </FormItem>
                  {editType === 'add' && (
                    <FormItem {...formItemLayout2} label="父节点名称">
                      <Input value={nodeData.authorityName} disabled />
                    </FormItem>
                  )}
                  <FormItem {...formItemLayout2} label="权限类型">
                    {getFieldDecorator('authorityType', {
                      initialValue: editType === 'edit' ? nodeData.authorityType : 1,
                      rules: [
                        {
                          required: true,
                          message: '',
                        },
                      ],
                    })(
                      <Radio.Group onChange={this.authorityTypeChange}>
                        <Radio value={1}>目录</Radio>
                        <Radio value={2}>页面</Radio>
                        <Radio value={3}>按钮</Radio>
                      </Radio.Group>
                    )}
                  </FormItem>
                  <Row><Col {...layout3}><p style={{ color: '#848484' }}>注：关联按钮路由的权限类型必须为按钮</p></Col></Row>
                  <FormItem {...formItemLayout2} label="是否显示">
                    {getFieldDecorator('showStatus', {
                      initialValue: editType === 'edit' ? nodeData.showStatus : 1,
                      rules: [
                        {
                          required: true,
                          message: '',
                        },
                      ],
                    })(
                      <Radio.Group>
                        <Radio value={1}>是</Radio>
                        <Radio value={0}>否</Radio>
                      </Radio.Group>
                    )}
                  </FormItem>
                  <FormItem {...formItemLayout2} label="权限英文名称">
                    {getFieldDecorator('alias', {
                      initialValue: editType === 'edit' ? nodeData.alias : '',
                      rules: [
                        {
                          required: true,
                          message: '请输入英文名称',
                        },
                      ],
                    })(<Input placeholder="" allowClear />)}
                  </FormItem>
                  <FormItem {...formItemLayout2} label="权限中文名称">
                    {getFieldDecorator('authorityName', {
                      initialValue: editType === 'edit' ? nodeData.authorityName : '',
                      rules: [
                        {
                          required: true,
                          message: '请输入中文名称',
                        },
                      ],
                    })(<Input placeholder="" allowClear />)}
                  </FormItem>
                  <FormItem {...formItemLayout2} label={
                    <span>前端权限标识</span>
                  }>
                    {getFieldDecorator('frontendUniqueKey', {
                      initialValue: editType === 'edit' ? nodeData.frontendUniqueKey : [],
                      rules: [
                        {
                          required: true,
                          message: '请输入前端路由',
                        },
                      ],
                    })(<MultiInput form={form} editType={editType} onRemove={this.removeCallback} nodeData= {nodeData} authType={authType}/>)}
                  </FormItem>
                  <FormItem {...formItemLayout2} label="后台权限标识">
                    {getFieldDecorator('backendUniqueKey', {
                      initialValue: editType === 'edit' ? nodeData.backendUniqueKey : '',
                      rules: [
                        {
                          required: false,
                          message: '请输入权限名称',
                        },
                      ],
                    })(<Input placeholder="" allowClear />)}
                  </FormItem>
                  <FormItem {...formItemLayout2} label="排序">
                    {getFieldDecorator('seq', {
                      initialValue: editType === 'edit' ? nodeData.seq : '',
                      rules: [
                        {
                          required: true,
                          message: '请输入排序',
                        },
                      ],
                    })(<Input placeholder="" allowClear />)}
                  </FormItem>
                  <FormItem {...formItemLayout2} label="描述">
                    {getFieldDecorator('mark', {
                      initialValue: editType === 'edit' ? nodeData.mark : '',
                      rules: [
                        {
                          required: false,
                        },
                      ],
                    })(<TextArea style={{ minHeight: 32 }} placeholder={''} rows={4} />)}
                  </FormItem>
                  <FormItem {...submitFormLayout} style={{ marginTop: 32 }}>
                    <Button type="primary" onClick={this.handleSubmit} style={{ marginRight: 14 }}>
                      保存
                    </Button>
                    <Button type="primary" onClick={this.clearData}>
                      取消
                    </Button>
                  </FormItem>
                </div>
              </Col>
            </Row>
          </Form>
          <ContextMenu id="pageNodeMenu" className={styles.rightContextMenu}>
            {authData.id !== 0 && (
              <MenuItem data={{ foo: 'bar' }} onClick={this.editNode}>
                编辑节点
              </MenuItem>
            )}
            {authData.authorityType !== 3 && (
              <MenuItem data={{ foo: 'bar' }} onClick={this.addSubNode}>
                新增子节点
              </MenuItem>
            )}
            {authData.id !== 0 && (
              <MenuItem data={{ foo: 'bar' }} onClick={this.deleteNode}>
                删除节点
              </MenuItem>
            )}
          </ContextMenu>
        </div>
      </PageHeaderWrapper>
    );
  }
}

export default PageConfig;

class MultiInput extends React.Component {
  state = {
  };

  addNewInput = (e) => {
    e.preventDefault();
    const { form: { setFieldsValue, getFieldValue } } = this.props;
    let inputList = getFieldValue('frontendUniqueKey');
    inputList.push({
      path: '',
    })
    setFieldsValue({
      'frontendUniqueKey': inputList,
    })
  }

  removeInput = (e, indexNum) => {
    e.preventDefault();
    const { onRemove, form: { setFieldsValue, getFieldValue } } = this.props;
    onRemove(indexNum);
    let inputList = getFieldValue('frontendUniqueKey') || [];
    let newInputList = inputList.filter((value, index) => index !== indexNum);
    setFieldsValue({
      'frontendUniqueKey': newInputList,
    })
  }

  // 校验
  handleConfirmOption = (rule, value, callback) => {
    let authType = this.props.authType;
    if (authType !== 3) {
      if (!value || value.length === 0) {
        callback('请添加至少一张图片！');
      } else {
        callback();
      }
    }
    // Note: 必须总是返回一个 callback，否则 validateFieldsAndScroll 无法响应
    callback();
  };

  render() {
    const { form: { getFieldDecorator, getFieldValue } } = this.props;
    const { maxLength = 5, editType, nodeData, disabled = false, authType, ...rest } = this.props;

    let initValue = nodeData.frontendUniqueKey || [];

    getFieldDecorator('frontendUniqueKey', {
      initialValue: editType === 'edit' ? initValue : [],
      rules: [
        {
          required: authType !== 3,
        },
        {
          validator: this.handleConfirmOption
        }
      ],
    })

    const defaultLayout1 = { xs: { span: 24 }, sm: { span: 20 } };
    const defaultLayout2 = { xs: { span: 24 }, sm: { span: 24 } };
    const defaultLayout3 = { xs: { span: 24 }, sm: { span: 4 } };

    const formItemLayout = {
      labelCol: {
        xs: { span: 0 },
        sm: { span: 0 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 24 },
        md: { span: 24 },
      },
    };
    
    let list = getFieldValue('frontendUniqueKey') || [];
    const inputList = list.map((item, index) => {
      let initIndex = (initValue || [])[index] || {};
      let initPath = initIndex.path || '';
      return (
        <Row key={index} className={styles.inputItem}>
          <Col {...defaultLayout1}>
            <FormItem {...formItemLayout} label="">
              {getFieldDecorator(`path[${index}]`, {
                initialValue: editType === 'edit' ? initPath : '',
                rules: [
                  {
                    required: true,
                    message: '请输入path',
                  },
                ],
              })(<Input placeholder="path" allowClear />)}
            </FormItem>
          </Col>
          <Col {...defaultLayout3}>
            <FormItem {...formItemLayout} label="">
              <Icon className={styles.removeButton} type="close-circle" onClick={(e) => this.removeInput(e, index)} />
            </FormItem>
          </Col>
        </Row>
      )
    })
    const content = (
      <div>
        <p>页面路由：填写需要控制的页面的路由，至少填写一条路由</p>
        <p>按钮路由：只能填写英文和数字</p>
      </div>
    );
    return (
      <div className={styles.multiBox}>
        {
          inputList.length > 0 &&
            <div className={styles.inputList}>
              {inputList}
            </div>
        }
        {
          disabled === false &&
          <div>
            {list.length >= maxLength ? null : <Button type="primary" onClick={this.addNewInput}>新增关联前端路由</Button>}
            <span className={styles.removeButton}><Popover content={content} placement="right"><Icon type="question-circle" /></Popover></span>
          </div>
        }
      </div>
    );
  }
}