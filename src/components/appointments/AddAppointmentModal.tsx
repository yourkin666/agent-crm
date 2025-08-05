'use client';

import React from 'react';
import {
  Modal, Form, Input, Select, DatePicker, Row, Col, message, Checkbox, Divider, InputNumber
} from 'antd';
import {
  AppointmentStatus, BusinessType
} from '@/types';
import {
  APPOINTMENT_STATUS_TEXT, BUSINESS_TYPE_TEXT
} from '@/utils/constants';
import dayjs from 'dayjs';

const { Option } = Select;

interface AddAppointmentModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function AddAppointmentModal({ visible, onCancel, onSuccess }: AddAppointmentModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [createViewingRecord, setCreateViewingRecord] = React.useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          appointment_time: values.appointment_time ? values.appointment_time.toISOString() : null,
          create_viewing_record: createViewingRecord,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const successMsg = createViewingRecord ? '预约创建成功，带看记录已同步创建' : '预约创建成功';
        message.success(successMsg);
        form.resetFields();
        setCreateViewingRecord(false);
        onSuccess();
        onCancel();
      } else {
        message.error(result.error || '创建预约失败');
      }
    } catch (error) {
      console.error('创建预约失败:', error);
      message.error('网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setCreateViewingRecord(false);
    onCancel();
  };

  return (
    <Modal
      title="新增预约"
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
          status: AppointmentStatus.PENDING,
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="property_name"
              label="物业名称"
            >
              <Input placeholder="请输入物业名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="property_address"
              label="房间地址"
            >
              <Input placeholder="请输入详细地址" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="customer_name"
              label="客户姓名"
            >
              <Input placeholder="请输入客户姓名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="customer_phone"
              label="客户电话"
              rules={[
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式' }
              ]}
            >
              <Input placeholder="请输入客户电话" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="agent_name"
              label="经纪人"
            >
              <Input placeholder="请输入经纪人姓名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="appointment_time"
              label="预约时间"
            >
              <DatePicker
                showTime
                style={{ width: '100%' }}
                placeholder="请选择预约时间"
                format="YYYY-MM-DD HH:mm"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="type"
              label="业务类型"
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
              name="status"
              label="预约状态"
            >
              <Select placeholder="请选择预约状态">
                {Object.entries(APPOINTMENT_STATUS_TEXT).map(([value, label]) => (
                  <Option key={value} value={parseInt(value)}>
                    {label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="city" label="城市">
              <Input placeholder="请输入城市" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">带看记录同步</Divider>

        <Row>
          <Col span={24}>
            <Checkbox
              checked={createViewingRecord}
              onChange={(e) => setCreateViewingRecord(e.target.checked)}
            >
              同时创建带看记录（预约完成后会自动在客户的带看记录中显示）
            </Checkbox>
          </Col>
        </Row>

        {createViewingRecord && (
          <>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Form.Item
                  name="viewing_feedback"
                  label="带看反馈"
                  initialValue={0}
                >
                  <Select placeholder="请选择带看反馈">
                    <Option value={0}>未成交</Option>
                    <Option value={1}>已成交</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="commission"
                  label="佣金"
                  initialValue={0}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="请输入佣金金额"
                    min={0}
                    precision={2}
                    formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => (parseFloat(value!.replace(/¥\s?|(,*)/g, '')) || 0) as any}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Form.Item
                  name="notes"
                  label="备注"
                >
                  <Input.TextArea
                    placeholder="请输入带看备注"
                    rows={3}
                  />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}
      </Form>
    </Modal>
  );
} 