'use client';

import React, { useState } from 'react';
import {
  Modal, Form, Input, Select, Row, Col, InputNumber, message
} from 'antd';
import { Customer } from '@/types';
import {
  BUSINESS_TYPE_TEXT_BY_STRING, ROOM_TYPE_TEXT_BY_STRING, 
  ROOM_TAG_TEXT_BY_STRING, VIEWER_TYPE_TEXT_BY_STRING,
  VIEWING_STATUS_TEXT, VIEWING_FEEDBACK_TEXT
} from '@/utils/constants';

const { Option } = Select;
const { TextArea } = Input;

interface AddViewingModalProps {
  visible: boolean;
  customer: Customer | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function AddViewingModal({ visible, customer, onCancel, onSuccess }: AddViewingModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    if (!customer) return;

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
        }),
      });

      const result = await response.json();

      if (result.success) {
        message.success('带看记录添加成功');
        form.resetFields();
        onSuccess();
        onCancel();
      } else {
        message.error(result.error || '添加带看记录失败');
      }
    } catch (error) {
      console.error('添加带看记录失败:', error);
      message.error('网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  if (!customer) return null;

  return (
    <Modal
      title={`为客户 "${customer.name}" 添加带看记录`}
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
          business_type: customer.business_type,
          room_type: customer.room_type,
          viewing_status: 1,
          commission: 0,
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="business_type"
              label="业务类型"
              rules={[{ required: true, message: '请选择业务类型' }]}
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
              label="房型"
              rules={[{ required: true, message: '请选择房型' }]}
            >
              <Select placeholder="请选择房型">
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
              rules={[{ required: true, message: '请输入带看人姓名' }]}
            >
              <Input placeholder="请输入带看人姓名" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="viewer_type"
              label="带看人类型"
              rules={[{ required: true, message: '请选择带看人类型' }]}
            >
              <Select placeholder="请选择带看人类型">
                {Object.entries(VIEWER_TYPE_TEXT_BY_STRING).map(([key, value]) => (
                  <Option key={key} value={key}>{value}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="viewing_status"
              label="带看状态"
              rules={[{ required: true, message: '请选择带看状态' }]}
            >
              <Select placeholder="请选择带看状态">
                {Object.entries(VIEWING_STATUS_TEXT).map(([key, value]) => (
                  <Option key={parseInt(key)} value={parseInt(key)}>{value}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
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
          <Col span={12}>
            <Form.Item
              name="viewing_feedback"
              label="带看反馈"
            >
              <Select placeholder="请选择带看反馈" allowClear>
                {Object.entries(VIEWING_FEEDBACK_TEXT).map(([key, value]) => (
                  <Option key={parseInt(key)} value={parseInt(key)}>{value}</Option>
                ))}
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