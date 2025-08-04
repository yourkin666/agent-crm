'use client';

import React from 'react';
import {
  Modal, Form, Input, Select, DatePicker, Row, Col, message
} from 'antd';
import {
  CustomerStatus, SourceChannel, BusinessType, RoomType, RoomTag, LeasePeriod
} from '@/types';
import {
  CUSTOMER_STATUS_TEXT, SOURCE_CHANNEL_TEXT, BUSINESS_TYPE_TEXT,
  ROOM_TYPE_TEXT, ROOM_TAG_TEXT, LEASE_PERIOD_TEXT
} from '@/utils/constants';

const { Option } = Select;

interface AddCustomerModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function AddCustomerModal({ visible, onCancel, onSuccess }: AddCustomerModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          creator: '管理员', // 这里可以改为从用户上下文获取
          is_agent: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        message.success('客户创建成功');
        form.resetFields();
        onSuccess();
        onCancel();
      } else {
        message.error(result.error || '创建客户失败');
      }
    } catch (error) {
      console.error('创建客户失败:', error);
      message.error('网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="新增客户"
      open={visible}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={800}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: CustomerStatus.FOLLOWING,
          is_agent: true,
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="租客姓名"
              rules={[{ required: true, message: '请输入租客姓名' }]}
            >
              <Input placeholder="请输入租客姓名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="phone"
              label="手机号"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式' }
              ]}
            >
              <Input placeholder="请输入手机号" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="backup_phone" label="备用手机">
              <Input placeholder="请输入备用手机号" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="wechat" label="微信">
              <Input placeholder="请输入微信号" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="community"
              label="咨询小区"
              rules={[{ required: true, message: '请输入咨询小区' }]}
            >
              <Input placeholder="请输入咨询小区名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="status"
              label="客户状态"
              rules={[{ required: true, message: '请选择客户状态' }]}
            >
              <Select placeholder="请选择客户状态">
                {Object.entries(CUSTOMER_STATUS_TEXT).map(([value, label]) => (
                  <Option key={value} value={parseInt(value)}>
                    {label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="business_type"
              label="业务类型"
              rules={[{ required: true, message: '请选择业务类型' }]}
            >
              <Select placeholder="请选择业务类型">
                {Object.entries(BUSINESS_TYPE_TEXT).map(([value, label]) => (
                  <Option key={value} value={value}>
                    {label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="room_type"
              label="房型"
              rules={[{ required: true, message: '请选择房型' }]}
            >
              <Select placeholder="请选择房型">
                {Object.entries(ROOM_TYPE_TEXT).map(([value, label]) => (
                  <Option key={value} value={value}>
                    {label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="room_tags" label="房型标签">
              <Select
                mode="multiple"
                placeholder="请选择房型标签"
                allowClear
              >
                {Object.entries(ROOM_TAG_TEXT).map(([value, label]) => (
                  <Option key={value} value={value}>
                    {label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="move_in_date" label="入住时间">
              <DatePicker
                style={{ width: '100%' }}
                placeholder="请选择入住时间"
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="lease_period" label="租赁周期">
              <Select placeholder="请选择租赁周期" allowClear>
                {Object.entries(LEASE_PERIOD_TEXT).map(([value, label]) => (
                  <Option key={value} value={parseInt(value)}>
                    {label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="price_range" label="可接受价格">
              <Input placeholder="例如：5000-7000" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="source_channel"
              label="来源渠道"
              rules={[{ required: true, message: '请选择来源渠道' }]}
            >
              <Select placeholder="请选择来源渠道">
                {Object.entries(SOURCE_CHANNEL_TEXT).map(([value, label]) => (
                  <Option key={value} value={value}>
                    {label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
} 