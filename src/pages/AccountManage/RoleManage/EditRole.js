import React, { Component } from 'react';
import Link from 'umi/link';
import { connect } from 'dva';
import router from 'umi/router';
import styles from './EditRole.less';
import {
    Button,
    Icon,
    Table,
    Input,
    Select,
    Row,
    Col,
    Switch,
    Form,
    message,
    Radio,
    Checkbox,
    Tree,
    Divider,
} from 'antd';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import withAuthControl, { compareAuth } from '@/utils/authControl';

const { Option } = Select;
const FormItem = Form.Item;
const { TextArea } = Input;
const { TreeNode } = Tree;
@connect(({ loading }) => ({
    loadingAdd: loading.effects['roleManage/addRole'],
    loadingEdit: loading.effects['roleManage/updateRole'],
}))
@Form.create()
class EditRole extends Component {
    constructor(props) {
        super(props);
        const {
            match: { params },
            route: { name },
        } = props;
        this.state = {
            id: params.id || 0,
            initValue: {
                roleDescription: '',
                roleName: '',
            },
            checkedList: [],
            authTree: [],
            disabled: name === 'viewRole',
            editable: 0,
        };
        this.pageType = name;
    }

    componentDidMount() {
        this.getAuthList();
        // 编辑角色时，请求数据
        if (this.pageType !== 'addRole') {
            this.getRoleDetail();
        }
    }
    getAuthList = () => {
        const { dispatch } = this.props;
        dispatch({
            type: 'roleManage/getAuthList',
            payload: {},
            callback: res => {
                const { code, data, msg } = res;
                if (code !== 200) {
                    message.error(msg);
                    return;
                }
                this.setState({
                    authTree: data || [],
                });
            },
        });
    };
    getRoleDetail = () => {
        const { dispatch } = this.props;
        const { id } = this.state;
        dispatch({
            type: 'roleManage/getRoleDetail',
            payload: id,
            callback: res => {
                const { code, data, msg } = res;
                if (code !== 200) {
                    message.error(msg);
                    return;
                }
                const { roleDescription, roleName, editable, authIds } = data;
                let checkedList = (authIds || []).map(item => {
                    return {
                        id: item,
                    };
                });
                this.setState({
                    initValue: {
                        roleDescription,
                        roleName,
                    },
                    checkedList,
                    editable
                });
            },
        });
    };
    // 返回列表页
    backList = () => {
        router.push('/accountManage/roleManage');
    };
    // 提交表单
    handleSubmit = e => {
        const { dispatch, form } = this.props;
        const { id, checkedList } = this.state;
        e.preventDefault();
        let url = this.pageType === 'editRole' ? 'roleManage/updateRole' : 'roleManage/addRole';
        form.validateFieldsAndScroll((err, values) => {
            //      console.log(values);
            if (!err) {
                const { roleName, roleDescription } = values;
                let params = {
                    roleName,
                    roleDescription,
                };
                if (this.pageType === 'editRole') {
                    params = Object.assign({}, params, { id });
                }
                if (checkedList.length <= 0) {
                    message.warning('请选择节点配置权限');
                    return;
                }
                let newCheckedList = checkedList.map(item => {
                    return item.id;
                })
                dispatch({
                    type: url,
                    payload: {
                        ...params,
                        authIds: newCheckedList,
                    },
                    callback: res => {
                        const { code, data, msg } = res;
                        if (code !== 200) {
                            message.error(msg);
                            return;
                        }
                        message.success('保存成功，返回角色列表页！');
                        // 刷新权限
                        this.reloadAuth();
                        this.backList();
                    },
                });
            }
        });
    };
    reloadAuth = () => {
        const {
            dispatch,
            location: { pathname },
        } = this.props;
        // 用户信息
        dispatch({
            type: 'menu/getUserInfo',
            payload: { pathname },
            callback: res => {
                const { code, data, msg } = res;
                if (code !== 200) {
                    message.error(msg);
                }
            },
        });
        // // 菜单和用户信息
        // dispatch({
        //   type: 'menu/getAuthData',
        //   payload: { pathname },
        //   callback: (res) => {
        //     const { code, data, msg } = res;
        //     if (code !== 200) {
        //       message.error(msg);
        //     }
        //   }
        // });
        // dispatch({
        //   type: 'menu/getRole',
        //   payload: {},
        //   callback: (res) => {
        //     const { code, data, msg } = res;
        //     if (code !== 200) {
        //       message.error(msg);
        //     }
        //   }
        // });
    };

    // 生成权限树
    renderAuthTree = ({ treeNodeData = [], checkedList = [], parentIds = [] }) => {
        return treeNodeData.map(item => {
            const { authorityName, id, childrenList } = item;
            let checked = checkedList.find(value => value.id === id);
            let renderNode = (
                <div
                    className={styles.treeNode}
                    onClick={e => this.onChangeNode({ key: id, checked, parentIds, e, nodeData: item })}
                >
                    <Checkbox checked={checked !== undefined} disabled={this.state.disabled}>
                        {authorityName}
                    </Checkbox>
                </div>
            );
            let newParentIds = [...parentIds];
            newParentIds.push(id);
            return (
                <TreeNode title={renderNode} key={id} selectable={false}>
                    {childrenList &&
                        this.renderAuthTree({ treeNodeData: childrenList, checkedList, parentIds: newParentIds })}
                </TreeNode>
            );
        });
    };
    // 勾选改变
    onChangeNode = ({ key, checked, parentIds, e, nodeData }) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.state.disabled) {
            return false;
        }
        //    console.log(key, parentIds);
        const { checkedList = [], authTree = [] } = this.state;
        let newCheckedList = [...checkedList];
        // 等于 undefined 为未选中
        if (checked !== undefined) {
            let unCheckedList = [];
            if (parentIds.length < 2) {
                let childrenNodesList = this.getChildrenNode(parentIds, authTree);
                if (childrenNodesList) {
                    childrenNodesList.forEach((item, index) => {
                        let itemChecked = [];
                        item.forEach(item2 => {
                            let flag = newCheckedList.find(value => value.id === item2.id);
                            if (flag) {
                                itemChecked.push(flag);
                            }
                        });
                        if (itemChecked.length === 1) {
                            unCheckedList.push({ id: parentIds[index] });
                        }
                    });
                }
            }
            unCheckedList = unCheckedList.concat(this.getAllNode(nodeData.childrenList, [{ id: key }]));
            unCheckedList.map(item => {
                newCheckedList = newCheckedList.filter(value => value.id !== item.id);
            });
        } else {
            newCheckedList.push({ id: key });
            newCheckedList = this.getAllNode(nodeData.childrenList, newCheckedList);
            parentIds.forEach(item => {
                let checked = newCheckedList.find(value => value.id === item);
                if (checked === undefined) {
                    newCheckedList.push({ id: item });
                }
            });
        }
        this.setState({
            checkedList: newCheckedList,
        });
    };
    // 获取节点的子节点
    getChildrenNode = (parentIds = [], authTree = []) => {
        if (parentIds.length <= 0) {
            return false;
        }
        let newParentIds = [...parentIds];
        let id = newParentIds.shift();
        let nodeList = [];
        let childrenNodesList = [];
        let nodeData = authTree.find(item => item.id === id);
        if (nodeData !== undefined) {
            nodeData.childrenList.map(item => {
                nodeList.push({ id: item.id });
            });
            let list = this.getChildrenNode(newParentIds, nodeData.childrenList);
            childrenNodesList.push(nodeList);
            if (list) {
                childrenNodesList = childrenNodesList.concat(list);
            }
        }
        return childrenNodesList;
    };
    // 获取节点下全部子节点
    getAllNode = (data = [], list = []) => {
        let newCheckedList = [...list];
        data.forEach(item => {
            let checked = newCheckedList.find(value => value.id === item.id);
            if (checked === undefined) {
                newCheckedList.push({ id: item.id });
            }
            if (item.childrenList) {
                newCheckedList = this.getAllNode(item.childrenList, newCheckedList);
            }
        });
        return newCheckedList;
    };
    // 校验是否选择了一个节点
    validatorAuth = (rule, value, callback) => {
        const { checkedList } = this.state;
        if (checkedList.length === 0) {
            callback('请选择节点，配置访问权限');
            return;
        }
        callback();
    };
    render() {
        const { initValue = {}, authTree = [], checkedList = [], disabled, editable } = this.state;
        const {
            form: { getFieldDecorator, getFieldValue },
            loadingAdd,
            loadingEdit,
            pageAuthData,
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
        const submitFormLayout = {
            wrapperCol: {
                xs: { span: 24, offset: 0 },
                sm: { span: 10, offset: 7 },
            },
        };
        return (
            <PageHeaderWrapper>
                <div className={styles.EditRole}>
                    <Form onSubmit={this.handleSubmit} style={{ marginTop: 8 }}>
                        <FormItem {...formItemLayout} label="角色名称">
                            {getFieldDecorator('roleName', {
                                initialValue: initValue.roleName,
                                rules: [
                                    {
                                        required: true,
                                        message: '请输入角色名称',
                                    },
                                    {
                                        max: 8,
                                        message: '角色名称长度8个字符以内',
                                    },
                                ],
                                // getValueFromEvent: (e) => {
                                //   let value = e.target.value;
                                //   value = value.substr(0,8);
                                //   return value;
                                // }
                            })(<Input placeholder="" disabled={disabled} />)}
                        </FormItem>
                        <FormItem {...formItemLayout} label="角色描述">
                            {getFieldDecorator('roleDescription', {
                                initialValue: initValue.roleDescription,
                                rules: [
                                    {
                                        required: false,
                                    },
                                    {
                                        max: 50,
                                        message: '角色描述长度50个字符以内',
                                    },
                                ],
                            })(
                                <TextArea style={{ minHeight: 32 }} placeholder={''} rows={4} disabled={disabled} />
                            )}
                        </FormItem>
                        <FormItem {...formItemLayout} label="角色权限" required={true}>
                            <div>
                                <Tree>{this.renderAuthTree({ treeNodeData: authTree || [], checkedList })}</Tree>
                            </div>
                        </FormItem>
                        <FormItem {...submitFormLayout} style={{ marginTop: 32 }}>
                            {
                                editable === 1 && !disabled &&
                                // ((this.pageType === 'editRole' && compareAuth("editRole", pageAuthData)) || (this.pageType === 'addRole' && compareAuth("addRole", pageAuthData))) &&
                                <Button type="primary" htmlType="submit" loading={this.pageType === 'editRole' ? loadingEdit : loadingAdd}>保存</Button>
                            }
                            <Button type="default" onClick={this.backList} style={{ marginLeft: 15 }}>返回</Button>
                        </FormItem>
                    </Form>
                </div>
            </PageHeaderWrapper>
        );
    }
}

export default withAuthControl(EditRole);
