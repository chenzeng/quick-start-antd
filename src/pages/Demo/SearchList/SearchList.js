import React, { Component } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import router from 'umi/router';
import styles from './SearchList.less';
import { Button, Col, Divider, Form, Icon, Input, message, Modal, Row, Select, Table, DatePicker, Popover } from 'antd';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import download from '@/utils/download';
// import DatePickerArea from '@/components/DatePickerArea/DatePickerArea';
// import ProductOption from '@/constants/ProductConstants';
import Utils from '@/utils/utils';

const { Option } = Select;
const FormItem = Form.Item;
const { confirm } = Modal;
@connect(() => ({}))
@Form.create()
class SearchList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      accountId: null,
      roleList: [],
      params: {
        cateId: 1,
        createTimeEnd: null,
        createTimeStart: null,
        failureStatus: 1,
        inventoryElectricity: null,
        // inventoryState: null,
        productCode: null,
        productName: null,
        productState: 0,
        searchAttr: {
          allowDefault: null,
          minusDeviationRules: null,
          plusDeviationRules: null,
          priceType: null,
          productType: null,
          setDeposit: null,
          setFixedFee: null
        },
      },
      pagination: {
        page: 1,
        size: 10,
      },
      priceTypeOption: [{ id: 1, typeName: '固定价格' }],
      tableData: [],
      selectList: [], // 选中的行
      timingDate: null, // 定时的时间
      timingList: [], // 选中的定时上架的套餐
      selectedRowKeys: [],
    };
    //    console.log(this.props);
  }

  componentDidMount() {
    this.getOptionList();
    this.getTableData({});
  }

  // 交易价格类型
  getOptionList = () => {
    const { dispatch } = this.props;
    const { priceTypeOption } = this.state;
    dispatch({
      type: 'standardSet/getTransactionOption',
      payload: { isEffect: false },
      callback: (res) => {
        if (res.code !== 200) {
          message.error(res.msg);
          return;
        }
        res.data.forEach(item => {
          const { id, typeName, ...rest } = item;
          const data = { id, typeName, ...rest };
          priceTypeOption.push(data);
        });
        this.setState({ priceTypeOption });
      },
    });
  }

  // 搜索数据
  handleSubmit = (e) => {
    const { form: { getFieldsValue } } = this.props;
    e.preventDefault();
    let values = getFieldsValue();
    let { createTimeEnd, createTimeStart, productName, productCode, productState, ...rest } = values;
    createTimeStart = createTimeStart !== null ? this._timeTranser(createTimeStart) : null;
    createTimeEnd = createTimeEnd !== null ? this._timeTranser(createTimeEnd) : null;
    productName = productName === '' ? null : productName;
    productCode = productCode === '' ? null : productCode;
    productState = productState === null ? 0 : productState;
    this.getTableData({ createTimeStart, createTimeEnd, productName, productCode, productState, ...rest }, { page: 1 });
  };

  getTableData = (params = {}, pagination = {}) => {
    const { dispatch } = this.props;
    let newPagination = Object.assign({}, this.state.pagination, pagination);
    let newParams = Object.assign({}, this.state.params, params);
    dispatch({
      type: 'shelfManagement/queryPackageList',
      payload: { ...newParams, ...newPagination },
      callback: (res) => {
        const { code, data, msg } = res;
        if (code !== 200) {
          message.error(msg);
          return;
        }
        const { result, pagination } = data;
        let newList = result.map((item, index) => {
          const { page, size } = pagination;
          // let num = (page - 1) * size + index + 1;
          return {
            key: item.id,
            ...item,
          };
        });
        this.setState({
          params: newParams,
          pagination: pagination,
          tableData: newList,
        })
      }
    });
  };

  // 翻页回调函数
  pageChange = (page, pageSize) => {
    this.getTableData({}, { page });
  };

  // pageSize改变的回调
  onShowSizeChange = (current, pageSize) => {
    // console.log(current, pageSize);
    this.getTableData({}, { page: current, size: pageSize });
  };

  // 查看详情
  viewDetail = (e, record) => {
    e.preventDefault();
    let { authData } = this.props;
    if (getRouterAuthority('/productManage/standardSet/view', authData)) {
      router.push({
        pathname: '/productManage/standardSet/view',
        query: {
          state: record.productState,
          id: record.id
        },
      });
    } else {
      message.warning("没有该页面的权限！")
    }
  };

  // 导出数据
  export = (e) => {
    e.preventDefault();
    const { dispatch } = this.props;
    const { selectList } = this.state;
    if (selectList.length > 0) {

    } else {

    }

  };

  // 下架请求
  productOffsale = (ids = []) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'shelfManagement/productOffsale',
      payload: ids,
      callback: (res) => {
        let { code, data, msg } = res;
        if (code !== 200) {
          message.error(msg);
          return;
        }
        message.success("下架成功！");
        this.setState({
          selectList: [],
          selectedRowKeys: [],
        })
        this.getTableData({});
      },
    });
  };

  // 上架请求
  productOnsale = (ids = []) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'shelfManagement/productOnsale',
      payload: ids,
      callback: (res) => {
        let { code, data, msg } = res;
        if (code !== 200) {
          message.error(msg);
        } else {
          message.success("上架成功！");
        }
        this.setState({
          selectList: [],
          selectedRowKeys: [],
        })
        this.getTableData({});
      },
    });
  };

  // 批量上架
  batchGrounding = (e) => {
    e.preventDefault();

    const { selectList } = this.state;
    if (selectList.length <= 0) {
      message.warning('请选择至少一条数据进行操作！');
      return;
    }
    // let flag = false;
    let flagState = false;
    let ids = [];
    selectList.forEach(item => {
      // if (item.inventoryState === 1) {
      //   flag = true;
      // }
      ids.push(item.id);
      if (item.productState === 3) {
        flagState = true;
      }
    });
    if (flagState) {
      message.warning('存在已上架套餐，请修改选择！');
      return;
    }
    // if (flag) {
    //   message.warning('存在库存不足的套餐，请修改选择！');
    //   return;
    // }
    this.productOnsale(ids);
  };

  // 批量下架
  batchUndercarriage = (e) => {
    e.preventDefault();
    const { dispatch } = this.props;
    const { selectList } = this.state;
    if (selectList.length <= 0) {
      message.warning('请选择至少一条数据进行操作！');
      return;
    }
    let flag = false;
    let ids = [];
    selectList.forEach(item => {
      if (item.productState === 2 || item.productState === 4) {
        flag = true;
      }
      ids.push(item.id);
    });
    if (flag) {
      message.warning('存在已下架或未上架套餐，请修改选择！');
      return;
    }
    this.productOffsale(ids);
  };

  // 修改上下架
  changeStatus = (e, record) => {
    e.preventDefault();
    let { productState, id, inventoryState } = record;
    const { dispatch } = this.props;
    if (productState === 2 || productState === 4) {
      // if (inventoryState === 1) {
      //   message.error('库存不足不能上架！');
      //   return;
      // }
      this.productOnsale([id]);
    } else if (productState === 3) {
      this.productOffsale([id]);
    }
  };

  // 定时上架
  changeStatusTiming = (e, record) => {
    e.preventDefault();
    const { selectList } = this.state;
    let { productState, id, inventoryState } = record;
    if (productState === 2 || productState === 4) {
      // if (inventoryState === 1) {
      //   message.error('库存不足不能上架！');
      //   return;
      // }
      this.setState({
        visible: true,
        timingList: [record],
        timingDate: record.timingTime ? moment(record.timingTime) : null,
      })
    }
  }

  reduceMonth = (date, reduceMonthNum = 0) => {
    let year = moment(date).year();
    let month = moment(date).month() + 1;
    let reduceResult = month - reduceMonthNum;
    if (reduceResult <= 0) {
      year -= 1;
      month = 12 + reduceResult;
    } else {
      month = reduceResult;
    }
    if (month < 10) {
      month = `0${month}`;
    }
    return `${year}-${month}`;
  }

  // 提交定时上架时间
  submitTiming = () => {
    const { dispatch } = this.props;
    let { timingList, timingDate } = this.state;
    // 预定的上架时间晚于套餐的最晚购买时间，不可以上架
    let overTimeList = [];
    let timingDateX = moment(timingDate || 0);
    // console.log(timingDate);
    timingList.forEach(item => {
      let productAttrVO = item.productAttrVO || {};
      let endTime = moment(this.reduceMonth(productAttrVO.validEndTime || 0, productAttrVO.durationTime)).endOf('month');
      if (timingDateX > endTime) {
        overTimeList.push(item.productCode)
      }
    });
    // console.log(overTimeList);
    if (overTimeList.length > 0) {
      let confirmModal = confirm({
        content: `套餐ID：${overTimeList.join('；')}晚于套餐的最晚可上架时间，请重新输入！`,
        onOk: () => {
          this.setState({
            timingDate: null,
          })
          confirmModal.destroy();
        },
        onCancel: () => {
          confirmModal.destroy();
        },
      });
      return;
    }
    let newTimingDate = timingDate === null ? null : this._timeTranser(timingDate);
    dispatch({
      type: 'shelfManagement/productOnsaleTiming',
      payload: {
        id: timingList[0].id,
        onSaleTime: newTimingDate,
      },
      callback: (res) => {
        let { code, data, msg } = res;
        if (code !== 200) {
          message.error(msg);
          return;
        }
        if (timingDate === null) {
          message.success("定时上架已取消！");
        } else {
          message.success("设置定时上架成功！");
        }
        // 刷新表格数据
        this.getTableData();
        this.handleCancel();
      },
    });
  }

  // 关闭编辑弹框
  handleCancel = () => {
    this.setState({
      visible: false,
      timingDate: null,
      timingList: [],
    })
  };

  changeTimingDate = (value) => {
    this.setState({
      timingDate: value,
    })
  };
  
  // 时间格式转化
  _timeTranser = (time, format = 'YYYY-MM-DD HH:mm:ss') => {
    return time ? moment(time).format(format) : '';
  };

  range = (start, end) => {
    const result = [];
    for (let i = start; i < end; i++) {
      result.push(i);
    }
    return result;
  }

  disabledNowDate = (current) => {
    // Can not select days before today
    if (!current) {
      return false;
    }
    return current < moment().startOf('day');
  }

  disabledDateTime = (current) => {
    let nowTime = new Date().getTime();
    let hours = moment(nowTime).get('hours');
    let minutes = moment(nowTime).get('minutes');
    let seconds = moment(nowTime).get('seconds');
    if (!current) {
      return false;
    }
    if (current < moment(nowTime)) {
      return {
        disabledHours: () => this.range(0, hours),
        disabledMinutes: () => this.range(0, minutes),
        disabledSeconds: () => this.range(0, seconds),
      };
    } else {
      return false;
    }
  }

  render() {
    const { initValue, visible, roleList, tableData, pagination, timingDate, priceTypeOption, inventoryElectricityEdit, selectedRowKeys } = this.state;
    const { form: { getFieldDecorator, }, pageAuthData, form, loading } = this.props;

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 10 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 },
      },
    };
    const formItemLayout2 = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 2 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 },
      },
    };
    // 套餐状态: 0-（上下架状态：未上架,已上架,已下架 三个状态）, 10-（交易中心：待上架、已上架、强制下架、已下架
    // 套餐状态: 1-已创建, 2-未上架, 3-已上架, 4-已下架, 5-强制下架, 6-已失效, 7-已发送, 8-已确认, 9-强制失效
    const statusList = {
      1: '已创建',
      2: '未上架',
      3: '已上架',
      4: '已下架',
      5: '强制下架',
      6: '已失效',
      7: '已发送',
      8: '已确认',
      9: '强制失效',
    };
    const productStatusOption = [
      {id:1, value:1, name:'已创建'},
      {id:2, value:2, name:'未上架'},
      {id:3, value:3, name:'已上架'},
      {id:4, value:4, name:'已下架'},
      {id:5, value:5, name:'强制下架'},
    ];
    // 库存状态: 1-库存不足, 2-库存充足, 3-库存预警
    const inventoryStateList = {
      1: '库存不足',
      2: '库存充足',
      3: '库存预警',
    };
    const columns = [
      {
        align: 'center',
        title: '套餐名称',
        dataIndex: 'productName',
        key: 'productName',
        width: 350,
        render: (text, record) => {
          return (
            <div>
              <div className={styles.leftSection}>
                <img src={record.picUrl.url} alt='pic' />
              </div>
              <div className={styles.rightSection}>
                <div><Popover content={text}><div className={styles.category}>{text}</div></Popover></div>
                <div>ID:{record.productCode}</div>
              </div>
            </div>
          )
        },
      }, {
        align: 'center',
        title: '创建时间',
        dataIndex: 'createTime',
        key: 'createTime',
        render: (text, record) => {
          return (<span>{this._timeTranser(text)}</span>)
        },
      }, {
        align: 'center',
        title: '最近上架时间',
        dataIndex: 'onSaleTime',
        key: 'onSaleTime',
        render: (text, record) => {
          return (<span>{this._timeTranser(text)}</span>)
        },
      }, {
        align: 'center',
        title: '有效交割时间',
        dataIndex: 'effectiveTime',
        key: 'effectiveTime',
        render: (text, record) => {
          let { validStartTime, validEndTime } = record.productAttrVO || {};
          return (
            <span>{this._timeTranser(validStartTime, 'YYYY-MM')}至{this._timeTranser(validEndTime, 'YYYY-MM')}</span>
          );
        },
      }, {
        align: 'center',
        title: '套餐持续时间',
        dataIndex: 'productAttrVO.durationTime',
        key: 'productAttrVO.durationTime',
        render: (text, record) => {
          return (
            <span>{text}个月</span>
          );
        },
      }, {
        align: 'center',
        title: '套餐状态',
        dataIndex: 'productState',
        key: 'productState',
        render: (text, record) => {
          return (<span>{statusList[text]}</span>)
        },
      }, {
        align: 'center',
        title: '预计上架时间',
        dataIndex: 'timingTime',
        key: 'timingTime',
        render: (text, record) => {
          return (<span>{this._timeTranser(text)}</span>)
        },
      }, {
        title: '操作',
        align: 'center',
        dataIndex: 'operation',
        key: 'operation',
        render: (text, record) => {
          let { productState } = record;
          return (
            <div className={styles.tableBtn}>
              <a href="#" onClick={(e) => this.viewDetail(e, record)}>查看</a>
              {
                compareAuth("shelf", pageAuthData) &&
                (productState === 2 || productState === 3 || productState === 4) &&
                <a href="#" onClick={(e) => this.changeStatus(e, record)}>{productState !== 3 ? '上架' : '下架'}</a>
              }
              {
                compareAuth("shelf", pageAuthData) &&
                (productState === 2 || productState === 4) &&
                <a href="#" onClick={(e) => this.changeStatusTiming(e, record)}>定时上架</a>
              }
            </div>
          )
        }
      }
    ];
    const roleOptions = roleList.map(item => {
      return (
        <Option value={item.id} key={item.id}>{item.name}</Option>
      )
    });
    const rowSelection = {
      selectedRowKeys,
      onChange: (selectedRowKeys, selectedRows) => {
        this.setState({
          selectedRowKeys,
          selectList: selectedRows,
        })
      },
    };
    return (
      <PageHeaderWrapper>
        <div className={styles.shelfManagement}>
          <Form onSubmit={this.handleSubmit} >
            <Row>
              <Col span={8}>
                <FormItem {...formItemLayout} label="套餐名称" required={false}>
                  {getFieldDecorator('productName', { initialValue: null, })(<Input placeholder="" allowClear />)}
                </FormItem>
              </Col>
              <Col span={8}>
                <FormItem {...formItemLayout} label="套餐ID" required={false}>
                  {getFieldDecorator('productCode', { initialValue: null, })(<Input placeholder="" allowClear />)}
                </FormItem>
              </Col>
              <Col span={8}>
                <FormItem {...formItemLayout} label="套餐状态" required={false} >
                  {getFieldDecorator('productState', {
                    initialValue: null,
                  })(
                    <Select style={{ width: '100%' }}>
                      {Utils.getOptionList(productStatusOption, true)}
                    </Select>
                  )}
                </FormItem>
              </Col>
              <Col span={8}>
                <FormItem {...formItemLayout} label="交易价格类型" required={false} >
                  {getFieldDecorator('searchAttr.priceType', {
                    initialValue: null,
                  })(
                    <Select style={{ width: '100%' }}>
                      <Option value={null}>全部</Option>
                      {
                        priceTypeOption && priceTypeOption.map((item) =>
                          <Option value={item.typeName} key={item.id}>{item.typeName}</Option>
                        )
                      }
                    </Select>
                  )}
                </FormItem>
              </Col>
              {/* <Col span={8}>
                <FormItem {...formItemLayout} label="正偏差规则" required={false}>
                  {getFieldDecorator('searchAttr.plusDeviationRules', {
                    initialValue: null,
                  })(
                    <Select style={{ width: '100%' }}>
                      {Utils.getOptionList(ProductOption.plusDeviationRulesOption, true)}
                    </Select>
                  )}
                </FormItem>
              </Col> */}
              {/* <Col span={8}>
                <FormItem {...formItemLayout} label="负偏差规则" required={false}>
                  {getFieldDecorator('searchAttr.minusDeviationRules', {
                    initialValue: null,
                  })(
                    <Select style={{ width: '100%' }}>
                      {Utils.getOptionList(ProductOption.minusDeviationRulesOption, true)}
                    </Select>
                  )}
                </FormItem>
              </Col>
              <Col span={8}>
                <FormItem {...formItemLayout} label="有无固定费用" required={false}>
                  {getFieldDecorator('searchAttr.setFixedFee', {
                    initialValue: null,
                  })(
                    <Select style={{ width: '100%' }}>
                      {Utils.getOptionList(ProductOption.judgeOption, true)}
                    </Select>
                  )}
                </FormItem>
              </Col>
              <Col span={8}>
                <FormItem {...formItemLayout} label="有无订金" required={false}>
                  {getFieldDecorator('searchAttr.setDeposit', {
                    initialValue: null,
                  })(
                    <Select style={{ width: '100%' }}>
                      {Utils.getOptionList(ProductOption.despositOption,true)}
                    </Select>
                  )}
                </FormItem>
              </Col> 
              <Col span={8}>
                <FormItem {...formItemLayout} label="是否允许单方解约" required={false}>
                  {getFieldDecorator('searchAttr.allowDefault', {
                    initialValue: null,
                  })(
                    <Select style={{ width: '100%' }}>
                      {Utils.getOptionList(ProductOption.allowDefaultOption, true)}
                    </Select>
                  )}
                </FormItem>
              </Col>
              <Col span={16}>
                <DatePickerArea form={form} label="创建时间" startKey="createTimeStart" endKey="createTimeEnd" layoutStart={formItemLayout} layoutEnd={formItemLayout2} />
              </Col> */}
              <Col span={8} className={styles.btnBar}>
                <FormItem>
                  <Button type="primary" htmlType="submit" >查询</Button>
                  {
              
                    <Button onClick={this.batchGrounding}>批量上架</Button>
                  }
                  {
                    <Button onClick={this.batchUndercarriage}>批量下架</Button>
                  }
                </FormItem>
              </Col>
            </Row>
          </Form>
          <div className={styles.tableBox}>
            <Table
              dataSource={tableData}
              rowSelection={rowSelection}
              loading={loading}
              columns={columns}
              size="middle"
              pagination={
                {
                  current: pagination.page,
                  total: pagination.total,
                  pageSize: pagination.size,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  onChange: this.pageChange,
                  onShowSizeChange: this.onShowSizeChange,
                }
              }
            />
          </div>
          <Modal
            title='定时上架'
            okText='保存'
            visible={visible}
            onCancel={this.handleCancel}
            footer={null}
            width={600}
          >
            <Form style={{ marginTop: 8 }}>
              <FormItem {...formItemLayout} label="定时上架时间" required={false}>
                <DatePicker
                  showTime={{ defaultValue: moment('00:00:00', 'HH:mm:ss') }}
                  disabledDate={this.disabledNowDate}
                  disabledTime={this.disabledDateTime}
                  format="YYYY-MM-DD HH:mm:ss"
                  style={{ width: '70%' }}
                  value={timingDate}
                  showToday={false}
                  onChange={this.changeTimingDate}
                />
              </FormItem>
              <FormItem style={{ textAlign: 'right', marginBottom: 0 }}>
                <Button type="primary" onClick={this.submitTiming} style={{ marginRight: 15 }}>保存</Button>
                <Button onClick={this.handleCancel}>取消</Button>
              </FormItem>
            </Form>
          </Modal>
        </div>
      </PageHeaderWrapper>
    )
  }
}

export default SearchList;
