import React, { Component } from 'react';
import Link from 'umi/link';
import { connect } from 'dva';
import router from 'umi/router';
import Base64 from 'base-64';
import styles from './EditAccount.less';
import {
    Button,
    Icon,
    Table,
    Input,
    Select,
    Row,
    Col,
    Form,
    message,
    Radio,
    Checkbox,
    Divider,
} from 'antd';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import withAuthControl, { compareAuth } from '@/utils/authControl';

const { Option } = Select;
const FormItem = Form.Item;

@connect(({ loading }) => ({
    loadingAdd: loading.effects['accountManage/addUser'],
    loadingEdit: loading.effects['accountManage/updateUser'],
}))
@Form.create()
class EditAccount extends Component {
    constructor(props) {
        super(props);
        const {
            match: { params },
            route: { name },
        } = props;
        this.state = {
            id: params.id || 0,
            initValue: {
                realname: '',
                username: '',
                phone: '',
                status: 1,
                roleIds: [],
            },
            accountType: 2, // 账号类型 1：主账号，2：子账户
            roleList: [], // 角色列表
            disabled: name === 'view',
        };
        this.pageType = name;
        //    console.log(this.props);
    }

    componentDidMount() {
        this.getRoleList();
        // 编辑角色时，请求数据
        if (this.pageType !== 'add') {
            this.getDetail();
        }
    }
    getRoleList = () => {
        const { dispatch } = this.props;
        dispatch({
            type: 'accountManage/getAllRole',
            payload: {},
            callback: res => {
                const { code, data, msg } = res;
                if (code !== 200) {
                    message.error(msg);
                    return;
                }
                let roleList = data.map(item => {
                    return {
                        label: item.roleName,
                        value: item.id,
                        disabled: item.editable === 1, // 0 可编辑  1不可编辑
                    };
                });
                this.setState({
                    roleList,
                });
            },
        });
    };
    // 获取账号详情
    getDetail = () => {
        const { dispatch } = this.props;
        const { id } = this.state;
        dispatch({
            type: 'accountManage/getUserDetail',
            payload: id,
            callback: res => {
                const { code, data, msg } = res;
                if (code !== 200) {
                    message.error(msg);
                    return;
                }
                let { accountType, ...rest } = data;
                this.setState({
                    initValue: rest,
                    accountType,
                });
            },
        });
    };

    validatorEn = (rule, value, callback) => {
        let reg = /[A-Za-z]+/;
        if (value === '') {
            callback();
            return;
        }
        if (!reg.test(value)) {
            callback('用户名必须包含英文字母');
        } else {
            callback();
        }
    };
    // 校验姓名是否为中文
    validatorCn = (rule, value, callback) => {
        let reg = /^[\u0391-\uFFE5]+$/;
        if (value === '') {
            callback();
            return;
        }
        if (!reg.test(value)) {
            callback('姓名只能输入汉字');
        } else {
            callback();
        }
    };
    // 校验密码
    validatorPassword = (rule, value, callback) => {
        let reg = /(?=.*?[a-z])(?=.*?[A-Z])(?=.*?\d)[a-zA-Z\d]*/;
        let regEn = /[`~!@#$%^&*()_+<>?:"{},.\/;'[\]\\]/im;
        let regCn = /[·！#￥（——）：；“”‘、，|《。》？、【】[\]]/im;
        if (value === '') {
            callback();
            return;
        }
        let flag = reg.test(value) && (regEn.test(value) || regCn.test(value));
        if (!flag) {
            callback('密码包含大写字母、小写字母、数字和特殊字符');
        } else {
            callback();
        }
    };
    // 校验手机号码
    validatorPhone = (rule, value, callback) => {
        // let reg = /^1[34578]\d{9}$/;
        let reg = /^1\d{10}$/;
        if (value === '') {
            callback();
            return;
        }
        if (!reg.test(value)) {
            callback('手机号码有误，请重填');
        } else {
            callback();
        }
    };
    // 清除字符串首尾的空字符
    trim = str => {
        return str.replace(/(^\s*)|(\s*$)/g, '');
    };
    // 校验中英文数字
    validateAccount = (rule, value, callback) => {
        let reg = /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/;
        if (value === '') {
            callback();
            return;
        }
        if (!reg.test(value)) {
            callback('只能输入中英文和数字');
        } else {
            callback();
        }
    };
    // 保存信息
    submitForm = e => {
        const {
            dispatch,
            form: { validateFieldsAndScroll },
        } = this.props;
        const { id, roleList } = this.state;
        e.preventDefault();
        let url = this.pageType === 'add' ? 'accountManage/addUser' : 'accountManage/updateUser';
        let info = this.pageType === 'add' ? '用户新增成功！' : '用户信息修改成功！';
        validateFieldsAndScroll((err, values) => {
            // console.log(values);
            if (err) {
                return false;
            }
            let { roleIds, realname, phone, username, password, status } = values;
            let params = {
                realname: this.trim(realname),
                phone,
                roleIds,
                status,
                username: this.trim(username),
            };
            if (this.pageType === 'edit') {
                params = Object.assign({}, params, { id: Number(id) });
                if (password !== '') {
                    params = Object.assign({}, params, { password: Base64.encode(password) });
                }
            } else {
                params = Object.assign({}, params, {
                    password: Base64.encode(password),
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
                    message.success(info);
                    this.reloadAuth();
                    this.backList();
                },
            });
        });
    };
    backList = () => {
        router.push(`/accountManage/accountManage`);
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
    render() {
        const { initValue = {}, disabled, roleList, accountType } = this.state;
        const {
            form: { getFieldDecorator, getFieldValue },
            loadingAdd,
            loadingEdit,
            pageAuthData,
        } = this.props;
        console.log(pageAuthData);
        const formItemLayout = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 4 },
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
                sm: { span: 10 },
            },
        };
        const submitFormLayout = {
            wrapperCol: {
                xs: { span: 24, offset: 0 },
                sm: { span: 10, offset: 7 },
            },
        };
        const statusOptions = [{ label: '禁用', value: 2 }, { label: '启用', value: 1 }];
        return (
            <PageHeaderWrapper>
                <div className={styles.editAccount}>
                    <Form onSubmit={this.submitForm} style={{ marginTop: 8 }}>
                        <Row>
                            <Col span={24} className={styles.headBar}>基础信息</Col>
                        </Row>
                        <Row className={styles.bodyContent}>
                            <Col span={12}>
                                <FormItem {...formItemLayout2} label="姓名">
                                    {getFieldDecorator('realname', {
                                        initialValue: initValue.realname,
                                        rules: [
                                            {
                                                required: true,
                                                message: '请填写姓名',
                                            },
                                            // {
                                            //   validator: this.validatorCn
                                            // }
                                        ],
                                        getValueFromEvent: e => {
                                            let value = e.target.value;
                                            value = value.substr(0, 20);
                                            return value;
                                        },
                                    })(<Input placeholder="" disabled={disabled} allowClear={!disabled} />)}
                                </FormItem>
                            </Col>
                            <Col span={12}>
                                <FormItem {...formItemLayout2} label="手机号码">
                                    {getFieldDecorator('phone', {
                                        initialValue: initValue.phone,
                                        rules: [
                                            {
                                                required: true,
                                                message: '请填写联系电话',
                                            },
                                            {
                                                validator: this.validatorPhone,
                                            },
                                        ],
                                    })(<Input placeholder="" disabled={disabled} allowClear={!disabled} />)}
                                </FormItem>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={12}>
                                <FormItem {...formItemLayout2} label="用户名">
                                    {getFieldDecorator('username', {
                                        initialValue: initValue.username,
                                        rules: [
                                            {
                                                required: true,
                                                message: '请填写用户名',
                                            },
                                            // {
                                            //   max: 20,
                                            //   message: '用户名长度最多20位',
                                            // },
                                            // {
                                            //     validator: this.validateAccount,
                                            // },
                                        ],
                                        getValueFromEvent: e => {
                                            let value = e.target.value;
                                            value = value.substr(0, 20);
                                            return value;
                                        },
                                    })(
                                        this.pageType === 'add' ? (
                                            <Input placeholder="" disabled={disabled} allowClear={!disabled} />
                                        ) : (
                                                <span style={{ display: 'inline-block', minHeight: 8 }}>
                                                    {initValue.username}
                                                </span>
                                            )
                                    )}
                                </FormItem>
                            </Col>
                            <Col span={12}>
                                <FormItem {...formItemLayout2} label="密码">
                                    {getFieldDecorator('password', {
                                        initialValue: '',
                                        rules: [
                                            {
                                                required: this.pageType === 'add',
                                                message: '请填写密码',
                                            },
                                            // {
                                            //     min: 12,
                                            //     message: '密码长度12位以上',
                                            // },
                                            {
                                                whitespace: true,
                                                message: '密码不能为空字符串',
                                            },
                                            // {
                                            //     validator: this.validatorPassword,
                                            // },
                                        ],
                                        getValueFromEvent: e => {
                                            let value = e.target.value;
                                            value = value.replace(/\s+/g, '');
                                            return value;
                                        },
                                    })(
                                        <Input.Password
                                            placeholder=""
                                            autoComplete="new-password"
                                            disabled={disabled}
                                            allowClear={!disabled}
                                        />
                                    )}
                                </FormItem>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={24} className={styles.headBar}>权限信息</Col>
                        </Row>
                        <Row className={styles.bodyContent}>
                            <Col span={24}>
                                <FormItem {...formItemLayout} label="选择角色">
                                    {getFieldDecorator('roleIds', {
                                        initialValue: initValue.roleIds,
                                        rules: [
                                            {
                                                required: true,
                                                message: '请选择至少一个角色',
                                            },
                                        ],
                                    })(
                                        <Checkbox.Group
                                            style={{ width: '100%' }}
                                            disabled={disabled}
                                            options={roleList}
                                        />
                                    )}
                                </FormItem>
                            </Col>
                            <Col span={24}>
                                <FormItem {...formItemLayout} label="选择状态">
                                    {getFieldDecorator('status', {
                                        initialValue: initValue.status,
                                        rules: [
                                            {
                                                required: true,
                                                message: '请选择状态',
                                            },
                                        ],
                                    })(
                                        <Radio.Group
                                            style={{ width: '100%' }}
                                            options={statusOptions}
                                            disabled={disabled}
                                        />
                                    )}
                                </FormItem>
                            </Col>
                        </Row>

                        <FormItem style={{ textAlign: 'center', marginBottom: 0 }}>
                            {
                                accountType !== 1 && this.pageType !== 'view' &&
                                // ((this.pageType === 'edit' && compareAuth('edit', pageAuthData)) || (this.pageType === 'add' && compareAuth('add', pageAuthData))) && 
                                <Button type="primary" htmlType="submit" style={{ marginRight: 15 }}>保存</Button>
                            }
                            <Button onClick={this.backList}>返回</Button>
                        </FormItem>
                    </Form>
                </div>
            </PageHeaderWrapper>
        );
    }
}

export default withAuthControl(EditAccount);
