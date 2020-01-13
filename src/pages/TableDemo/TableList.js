import React, { Component } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import router from 'umi/router';
import styles from './TableList.less';
import { Button, Col, Divider, Form, Icon, Input, message, Modal, Row, Select, Table } from 'antd';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import withAuthControl, { compareAuth } from '@/utils/authControl';
import { Resizable } from 'react-resizable';

const { Option } = Select;
const FormItem = Form.Item;
const { confirm } = Modal;
@connect(({ loading }) => ({
  loading: loading.effects['accountManage/getUserList'],
}))
@Form.create()
class TableList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      accountId: null,
      roleList: [],
      params: {
        account: '',
        userName: '',
        phone: '',
        roleId: null,
        status: null,
      },
      pagination: {
        pageNum: 1,
        pageSize: 10,
        total: 0,
      },
      tableData: [],
      columnsWidth: [
        { width: 100 },
        { width: 200 },
        { width: 100 },
        { width: 100 },
        { width: 100 },
        { width: 100 },
        { width: 100 },
        { width: 100 },
        { width: 100 },
        {  },
        { width: 300 },
      ],
    };
    // console.log(this.props);
  }

  componentDidMount() {
    this.getRoleList();
    this.getTableData({});
  }

  tableComponents = {
    header: {
      cell: ResizeableTitle,
    },
  };

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
        this.setState({
          roleList: data,
        });
      },
    });
  };
  // 搜索数据
  handleSubmit = e => {
    const {
      form: { getFieldsValue },
    } = this.props;
    e.preventDefault();
    let values = getFieldsValue();
    this.getTableData({ ...values }, { pageNum: 1 });
  };
  getTableData = (params = {}, pagination = {}) => {
    const { dispatch } = this.props;
    let newPagination = Object.assign({}, this.state.pagination, pagination);
    let newParams = Object.assign({}, this.state.params, params);
    const { pageNum, pageSize } = newPagination;
    dispatch({
      type: 'accountManage/getUserList',
      payload: { ...newParams, pageNum, pageSize },
      callback: res => {
        const { code, data, msg } = res;
        if (code !== 200) {
          message.error(msg);
          return;
        }
        const { list, ...pagination } = data;
        let newList = list.map((item, index) => {
          const { pageNum, pageSize } = pagination;
          let num = (pageNum - 1) * pageSize + index + 1;
          return {
            key: item.id,
            index: num,
            ...item,
          };
        });
        this.setState({
          params: newParams,
          pagination: pagination,
          tableData: newList,
        });
      },
    });
  };
  // 翻页回调函数
  pageChange = (pageNum, pageSize) => {
    this.getTableData({}, { pageNum });
  };
  // pageSize改变的回调
  onShowSizeChange = (current, pageSize) => {
    // console.log(current, pageSize);
    this.getTableData({}, { pageNum: current, pageSize: pageSize });
  };

  // 跳转新增角色页面
  addAccount = e => {
    router.push('/accountManage/accountManage/addAccount/0');
  };
  // 跳转编辑角色页面
  editAccount = (e, id) => {
    e.preventDefault();
    router.push(`/accountManage/accountManage/editAccount/${id}`);
  };
  // 查看角色
  viewAccount = (e, id) => {
    e.preventDefault();
    router.push(`/accountManage/accountManage/viewAccount/${id}`);
  };
  // 更改账户状态
  handleUser = (e, record) => {
    e.preventDefault();
    const { dispatch } = this.props;
    const { id, status } = record;
    let url = status === 2 ? 'accountManage/enableUser' : 'accountManage/disableUser';
    let info = status === 2 ? '确定启用该账户？' : '确定禁用该账户？';
    let succInfo = status === 2 ? '该账户已经启用！' : '该账户已经禁用！';
    dispatch({
      type: url,
      payload: id,
      callback: res => {
        let { code, data, msg } = res;
        if (code !== 200) {
          message.error(data);
          return;
        }
        message.success(succInfo);
        //        confirmModal.destroy();
        this.getTableData();
      },
    });
    //    let confirmModal = confirm({
    //      content: info,
    //      onOk: () => {
    //
    //      },
    //      onCancel: () => {
    //        confirmModal.destroy();
    //      },
    //    });
  };
  // 删除用户
  deleteUser = (e, id) => {
    e.preventDefault();
    const { dispatch } = this.props;
    let confirmModal = confirm({
      content: '账号删除后，该账号将无法登录，确定删除当前账号？',
      okText: '确认',
      cancelText: '取消',
      centered: true,
      onOk: () => {
        dispatch({
          type: 'accountManage/deleteUser',
          payload: id,
          callback: res => {
            let { code, data, msg } = JSON.parse(res);
            if (code !== 200) {
              message.error(data);
              return;
            }
            message.success('账号删除成功！');
            confirmModal.destroy();
            this.getTableData();
          },
        });
      },
      onCancel: () => {
        confirmModal.destroy();
      },
    });
  };

  handleResize = index => (e, { size }) => {
    this.setState(({ columnsWidth }) => {
      const nextColumns = [...columnsWidth];
      nextColumns[index] = {
        ...nextColumns[index],
        width: size.width,
      };
      return { columnsWidth: nextColumns };
    });
  };

  render() {
    const { initValue, visible, roleList, tableData, pagination, columnsWidth } = this.state;
    const {
      form: { getFieldDecorator },
      pageAuthData,
      loading,
    } = this.props;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 18 },
      },
    };
    const formItemLayout2 = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 },
      },
    };
    const statusList = {
      1: '启用',
      2: '禁用',
      3: '删除',
    };
    const columns = [
      {
        align: 'center',
        title: '序号',
        dataIndex: 'index',
        key: 'index',
        fixed: 'left',
        width: 100,
      },
      {
        align: 'center',
        title: '用户名',
        dataIndex: 'username',
        key: 'username',
        fixed: 'left',
        width: 200,
      },
      {
        align: 'center',
        title: '姓名',
        dataIndex: 'realname',
        key: 'realname',
      },
      {
        align: 'center',
        title: '姓名1',
        dataIndex: 'realname',
        key: 'realname_1',
      },
      {
        align: 'center',
        title: '姓名2',
        dataIndex: 'realname',
        key: 'realname_2',
      },
      {
        align: 'center',
        title: '姓名3',
        dataIndex: 'realname',
        key: 'realname_3',
      },
      {
        align: 'center',
        title: '手机号',
        dataIndex: 'phone',
        key: 'phone',
      },
      {
        align: 'center',
        title: '角色',
        dataIndex: 'roleNames',
        key: 'roleNames',
      },
      {
        align: 'center',
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: (text, record) => {
          return <span>{statusList[text]}</span>;
        },
      },
      {
        align: 'center',
        title: '创建时间',
        dataIndex: 'createTime',
        key: 'createTime',
        render: (text, record) => {
          return <span>{text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : text}</span>;
        },
      },
      {
        title: '操作',
        align: 'center',
        dataIndex: 'operation',
        key: 'operation',
        fixed: 'right',
        width: 300,
        render: (text, record) => {
          return (
            <div className={styles.tableBtn}>
              <a href="#" onClick={e => this.viewAccount(e, record.id)}>
                查看
              </a>
              {
                // compareAuth('edit', pageAuthData) &&
                record.accountType !== 1 &&
                  <a href="#" onClick={e => this.editAccount(e, record.id)}>
                    编辑
                  </a>
              }
              {
                // compareAuth('disabled', pageAuthData) &&
                record.accountType !== 1 &&
                record.status !== 3 &&
                  <a href="#" onClick={e => this.handleUser(e, record)}>
                    {record.status === 2 ? '启用' : '禁用'}
                  </a>
              }
              {
                // compareAuth('delete', pageAuthData) &&
                record.accountType !== 1 &&
                  <a href="#" onClick={e => this.deleteUser(e, record.id)}>
                    删除
                  </a>
              }
            </div>
          );
        },
      },
    ];
    const roleOptions = roleList.map(item => {
      return (
        <Option value={item.id} key={item.id}>
          {item.roleName}
        </Option>
      );
    });
    let tableColumns = columns.map((col, index) => {
      let width = columnsWidth[index] || {};
      return {
        ...col,
        ...width,
        onHeaderCell: column => ({
          width: column.width,
          onResize: this.handleResize(index),
        }),
      }
    });
    return (
      <PageHeaderWrapper>
        <div className={styles.tableList}>
          <Form onSubmit={this.handleSubmit}>
            <Row>
              <Col span={6}>
                <FormItem {...formItemLayout} label="用户名" required={false}>
                  {getFieldDecorator('account', {})(<Input placeholder="" allowClear />)}
                </FormItem>
              </Col>
              <Col span={6}>
                <FormItem {...formItemLayout} label="姓名" required={false}>
                  {getFieldDecorator('userName', {})(<Input placeholder="" allowClear />)}
                </FormItem>
              </Col>
              <Col span={6}>
                <FormItem {...formItemLayout} label="手机号" required={false}>
                  {getFieldDecorator('phone', {})(<Input placeholder="" allowClear />)}
                </FormItem>
              </Col>
              <Col span={6}>
                <FormItem {...formItemLayout} label="状态" required={false}>
                  {getFieldDecorator('status', {
                    initialValue: null,
                  })(
                    <Select style={{ width: '100%' }}>
                      <Option value={null}>全部</Option>
                      <Option value={1}>启用</Option>
                      <Option value={2}>禁用</Option>
                    </Select>
                  )}
                </FormItem>
              </Col>
              <Col span={6}>
                <FormItem {...formItemLayout} label="角色" required={false}>
                  {getFieldDecorator('roleId', {
                    initialValue: null,
                  })(
                    <Select style={{ width: '100%' }}>
                      <Option value={null}>全部</Option>
                      {roleOptions}
                    </Select>
                  )}
                </FormItem>
              </Col>
              <Col span={6} className={styles.btnBar}>
                <FormItem>
                  <Button type="primary" htmlType="submit">
                    查询
                  </Button>
                  {
                    // compareAuth('add', pageAuthData) &&
                    <Button type="default" onClick={this.addAccount}>
                      新增
                    </Button>
                  }
                </FormItem>
              </Col>
            </Row>
          </Form>
          <div className={styles.tableBox}>
            <Table
              bordered
              components={this.tableComponents}
              scroll={{ y: 240, x: '140%' }}
              dataSource={tableData}
              loading={loading}
              columns={tableColumns}
              size="middle"
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

export default withAuthControl(TableList);

const ResizeableTitle = props => {
  const { onResize, width, ...restProps } = props;

  if (!width) {
    return <th {...restProps} />;
  }

  return (
    <Resizable
      width={width}
      height={0}
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  );
};
