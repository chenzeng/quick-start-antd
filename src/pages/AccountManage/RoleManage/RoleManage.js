import React, { Component } from 'react';
import Link from 'umi/link';
import { connect } from 'dva';
import moment from 'moment';
import router from 'umi/router';
import styles from './RoleManage.less';
import {
    Button,
    Icon,
    Table,
    Input,
    Select,
    Row,
    Col,
    Switch,
    Modal,
    message,
    InputNumber,
    Divider,
} from 'antd';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import withAuthControl, { compareAuth } from '@/utils/authControl';

const { Option } = Select;
const { confirm } = Modal;
@connect(({ menu, loading }) => ({
    loading: loading.effects['roleManage/getRoleList'],
}))
class RoleManage extends Component {
    constructor(props) {
        super(props);
        const {
            match: { params = {} },
        } = props;
        this.state = {
            roleName: '', // 角色名称
            params: {
                roleName: '',
            },
            tableData: [],
            pagination: {
                pageNum: 1,
                pageSize: 10,
                total: 0,
            },
        };
        console.log(this.props);
    }

    componentDidMount() {
        let params = {
            roleName: '',
        };
        this.getTableData(params);
    }
    // 获取表格数据
    getTableData = (params = {}, pagination = {}) => {
        const { dispatch } = this.props;
        let newPagination = Object.assign({}, this.state.pagination, pagination);
        let newParams = Object.assign({}, this.state.params, params);
        dispatch({
            type: 'roleManage/getRoleList',
            payload: { ...newParams, ...newPagination },
            callback: res => {
                let { code, data, msg } = res;
                if (code !== 200) {
                    message.error(msg);
                    return;
                }
                const { list, ...pagination } = data;
                const { pageNum, pageSize, total } = pagination;
                let listArr = list.map((item, index) => {
                    const { pageNum, pageSize } = pagination;
                    let num = (pageNum - 1) * pageSize + index + 1;
                    return {
                        key: item.id,
                        index: num,
                        ...item,
                    };
                });
                this.setState({
                    tableData: listArr,
                    params: newParams,
                    pagination,
                });
            },
        });
    };
    // 搜索数据
    searchRole = e => {
        e.preventDefault();
        const { roleName } = this.state;
        this.getTableData({ roleName }, { pageNum: 1 });
    };
    // 分类名称改变的回调
    onChange = e => {
        let value = e.target.value;
        this.setState({
            roleName: value,
        });
    };
    // 翻页回调函数
    pageChange = (pageNum, pageSize) => {
        this.getTableData({}, { pageNum });
    };
    // pageSize改变的回调
    onShowSizeChange = (current, pageSize) => {
        //    console.log(current, pageSize);
        this.getTableData({}, { pageNum: current, pageSize: pageSize });
    };
    // 跳转新增角色页面
    addRole = e => {
        router.push('/accountManage/roleManage/addRole/0');
    };
    // 跳转编辑角色页面
    editRole = (e, id) => {
        e.preventDefault();
        router.push(`/accountManage/roleManage/editRole/${id}`);
    };
    // 查看角色
    viewRole = (e, id) => {
        e.preventDefault();
        router.push(`/accountManage/roleManage/viewRole/${id}`);
    };
    // 删除角色
    deleteRole = (e, id) => {
        e.preventDefault();
        const { dispatch } = this.props;
        let confirmModal = confirm({
            content: '确认删除该角色？',
            okText: '确认',
            cancelText: '取消',
            centered: true,
            onOk: () => {
                dispatch({
                    type: 'roleManage/deleteRole',
                    payload: { id },
                    callback: res => {
                        let { code, data, msg } = JSON.parse(res);
                        if (code !== 200) {
                            message.error(msg);
                            return;
                        }
                        message.success('角色删除成功！');
                        this.getTableData();
                        confirmModal.destroy();
                    },
                });
            },
            onCancel: () => {
                confirmModal.destroy();
            },
        });
    };

    render() {
        const { roleName, pagination, tableData } = this.state;
        const { loading, pageAuthData } = this.props;

        const columns = [
            {
                align: 'center',
                title: '序号',
                dataIndex: 'index',
                key: 'index',
            },
            {
                align: 'center',
                title: '角色名称',
                dataIndex: 'roleName',
                key: 'roleName',
            },
            {
                align: 'center',
                title: '创建时间',
                dataIndex: 'createTime',
                key: 'createTime',
                render: (text, record) => {
                    return <span>{moment(text || 0).format('YYYY-MM-DD HH:mm:ss')}</span>;
                },
            },
            {
                title: '操作',
                align: 'center',
                dataIndex: 'operation',
                key: 'operation',
                render: (text, record) => {
                    return (
                        <div className={styles.tableBtn}>
                            <a href="#" onClick={e => this.viewRole(e, record.id)}>查看</a>
                            {
                                // compareAuth('editRole', pageAuthData) &&
                                record.editable === 1 &&
                                <a href="#" onClick={e => this.editRole(e, record.id)}>编辑</a>
                            }
                            {
                                // compareAuth('deleteRole', pageAuthData) &&
                                record.editable === 1 &&
                                <a href="#" onClick={e => this.deleteRole(e, record.id)}>删除</a>
                            }
                        </div>
                    );
                },
            },
        ];
        return (
            <PageHeaderWrapper>
                <div className={styles.roleManage}>
                    <div className={styles.inputBar}>
                        <Row align="middle">
                            <Col span={12}>
                                <label>
                                    角色名称：
                                    <Input placeholder="" allowClear onChange={this.onChange} style={{ width: 210 }} />
                                </label>
                            </Col>
                            <Col span={12} style={{ textAlign: 'right' }}>
                                <Button type="primary" onClick={this.searchRole}>查询</Button>
                                {
                                    // compareAuth('addRole', pageAuthData) &&
                                    <Button onClick={this.addRole}>新建</Button>
                                }
                            </Col>
                        </Row>
                    </div>
                    <div className={styles.tableBox}>
                        <Table
                            dataSource={tableData}
                            columns={columns}
                            size="middle"
                            loading={loading}
                            pagination={{
                                current: pagination.pageNum,
                                total: pagination.total,
                                pageSize: pagination.pageSize,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                onChange: this.pageChange,
                                onShowSizeChange: this.onShowSizeChange,
                            }}
                        />
                    </div>
                </div>
            </PageHeaderWrapper>
        );
    }
}

export default withAuthControl(RoleManage);
