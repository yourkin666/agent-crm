'use client';

import React, { useState, useCallback } from 'react';
import {
  Modal, Form, Input, Select, Row, Col, InputNumber, DatePicker, Spin, AutoComplete, App
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { Customer } from '@/types';
import {
  BUSINESS_TYPE_TEXT_BY_STRING, ROOM_TYPE_TEXT_BY_STRING, 
  ROOM_TAG_TEXT_BY_STRING, VIEWER_TYPE_TEXT_BY_STRING,
  VIEWING_STATUS_TEXT
} from '@/utils/constants';
import CommunityAutoComplete from './CommunityAutoComplete';

interface CommunityOption {
  value: string;
  label: string;
  propertyAddrId: number;
}

const { Option } = Select;
const { TextArea } = Input;

interface AddViewingModalProps {
  visible: boolean;
  customer: Customer | null;
  onCancel: () => void;
  onSuccess: () => void;
}

interface DetailAddressOption {
  value: string;
  label: string;
  data: Record<string, unknown>; // 保存完整的详细地址数据
}

export default function AddViewingModal(props: AddViewingModalProps) {
  const { customer } = props;
  if (!customer) return null;
  return <AddViewingModalInner {...props} customer={customer} />;
}

interface AddViewingInnerProps {
  visible: boolean;
  customer: Customer; // 非空
  onCancel: () => void;
  onSuccess: () => void;
}

function AddViewingModalInner({ visible, customer, onCancel, onSuccess }: AddViewingInnerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [detailAddressOptions, setDetailAddressOptions] = useState<DetailAddressOption[]>([]);
  const [detailAddressLoading, setDetailAddressLoading] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const { message } = App.useApp();

  const toISOString = (value?: Dayjs | null): string => {
    if (!value) return new Date().toISOString();
    const d = value.toDate();
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  };

  // 获取详细地址列表并自动填充
  const fetchDetailAddresses = useCallback(async (propertyAddrId: number) => {
    if (!propertyAddrId) return;

    setDetailAddressLoading(true);
    try {
      const response = await fetch(`/api/property/${propertyAddrId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        let detailAddressList: Array<{ detailAddr: string }> = [];
        if (result.success && result.data) {
          if (result.data.code === 200 && result.data.data && Array.isArray(result.data.data.list)) {
            detailAddressList = result.data.data.list as Array<{ detailAddr: string }>;
          } else if (result.data.code === 200 && Array.isArray(result.data.data)) {
            detailAddressList = result.data.data as Array<{ detailAddr: string }>;
          } else if (result.isMockData && result.data.data && Array.isArray(result.data.data.list)) {
            detailAddressList = result.data.data.list as Array<{ detailAddr: string }>;
          } else if (result.isMockData && Array.isArray(result.data.data)) {
            detailAddressList = result.data.data as Array<{ detailAddr: string }>;
          }
        }

        if (detailAddressList.length > 0) {
          const firstAddress = detailAddressList[0];
          form.setFieldsValue({ 
            property_address: firstAddress.detailAddr 
          });
          const addressOptions: DetailAddressOption[] = detailAddressList.map((item: Record<string, unknown>) => ({
            value: item.detailAddr as string,
            label: item.detailAddr as string,
            data: item,
          }));
          setDetailAddressOptions(addressOptions);
        } else {
          form.setFieldsValue({ property_address: '暂无详细地址信息' });
          setDetailAddressOptions([]);
        }
      } else {
        message.error('获取详细地址失败');
        setDetailAddressOptions([]);
        form.setFieldsValue({ property_address: undefined });
      }
    } catch {
      message.error('获取详细地址失败');
      setDetailAddressOptions([]);
      form.setFieldsValue({ property_address: undefined });
    } finally {
      setDetailAddressLoading(false);
    }
  }, [form, message]);

  // 处理物业地址选择变化
  const handlePropertyChange = useCallback((value: string, selectedOption?: CommunityOption) => {
    if (selectedOption && selectedOption.propertyAddrId) {
      setSelectedPropertyId(selectedOption.propertyAddrId);
      fetchDetailAddresses(selectedOption.propertyAddrId);
    } else {
      setSelectedPropertyId(null);
      setDetailAddressOptions([]);
      form.setFieldsValue({ property_address: undefined });
    }
  }, [fetchDetailAddresses, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      const response = await fetch('/api/viewing-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customer.id,
          ...values,
          viewing_time: toISOString(values.viewing_time as Dayjs | null),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        message.success('带看记录添加成功');
        form.resetFields();
        onSuccess();
        onCancel();
      } else {
        message.error(result.error || '添加带看记录失败');
      }
    } catch {
      message.error('网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setDetailAddressOptions([]);
    setSelectedPropertyId(null);
    setDetailAddressLoading(false);
    onCancel();
  };

  return (
    <Modal
      title="添加带看记录"
      open={visible}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={600}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          business_type: Array.isArray(customer.business_type) ? customer.business_type[0] : customer.business_type,
          room_type: Array.isArray(customer.room_type) ? customer.room_type[0] : customer.room_type,
          viewing_status: 1,
          commission: 0,
          viewing_time: dayjs(),
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="viewing_time"
              label="带看时间"
            >
              <DatePicker
                showTime
                style={{ width: '100%' }}
                placeholder="请选择带看时间"
                format="YYYY-MM-DD HH:mm"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="property_name"
              label="物业地址"
            >
              <CommunityAutoComplete 
                placeholder="请输入物业地址进行搜索" 
                onChange={handlePropertyChange}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="property_address"
          label="详细地址"
        >
          <AutoComplete
            placeholder={selectedPropertyId ? "已自动填充详细地址，可手动修改" : "请先选择物业地址"}
            options={detailAddressOptions}
            disabled={!selectedPropertyId}
            allowClear
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            notFoundContent={
              detailAddressLoading ? <Spin size="small" /> : 
              selectedPropertyId ? '暂无详细地址数据' : '请先选择物业地址'
            }
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="business_type"
              label="业务类型"
            >
              <Select placeholder="请选择业务类型">
                {Object.entries(BUSINESS_TYPE_TEXT_BY_STRING).map(([key, value]) => (
                  <Option key={key} value={key}>{value}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="room_type"
              label="带看户型"
            >
              <Select placeholder="请选择户型">
                {Object.entries(ROOM_TYPE_TEXT_BY_STRING).map(([key, value]) => (
                  <Option key={key} value={key}>{value}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="room_tag"
              label="房型标签"
            >
              <Select placeholder="请选择房型标签" allowClear>
                {Object.entries(ROOM_TAG_TEXT_BY_STRING).map(([key, value]) => (
                  <Option key={key} value={key}>{value}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="viewer_name"
              label="带看人"
            >
              <Select placeholder="请选择带看人">
                {Object.entries(VIEWER_TYPE_TEXT_BY_STRING).map(([key, value]) => (
                  <Option key={key} value={key}>{value}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="viewing_status"
              label="带看状态"
            >
              <Select placeholder="请选择带看状态">
                {Object.entries(VIEWING_STATUS_TEXT).map(([key, value]) => (
                  <Option key={parseInt(key)} value={parseInt(key)}>{value}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="commission"
              label="佣金"
              rules={[
                { required: true, message: '请输入佣金' },
                { type: 'number', min: 0, message: '佣金不能为负数' }
              ]}
            >
              <InputNumber
                placeholder="请输入佣金"
                style={{ width: '100%' }}
                min={0}
                precision={2}
                addonAfter="元"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="viewing_feedback"
              label="带看反馈"
            >
              <Select placeholder="请选择带看反馈" allowClear>
                <Option value={0}>未成交</Option>
                <Option value={1}>已成交</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="notes"
          label="备注"
        >
          <TextArea
            rows={3}
            placeholder="请输入备注信息"
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}