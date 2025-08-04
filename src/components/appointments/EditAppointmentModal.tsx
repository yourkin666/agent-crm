'use client';

import React, { useEffect } from 'react';
import {
  Modal, Form, Input, Select, DatePicker, Row, Col, message
} from 'antd';
import {
  AppointmentStatus, BusinessType, Appointment
} from '@/types';
import {
  APPOINTMENT_STATUS_TEXT, BUSINESS_TYPE_TEXT
} from '@/utils/constants';
import dayjs from 'dayjs';

const { Option } = Select;

interface EditAppointmentModalProps {
  visible: boolean;
  appointment: Appointment | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function EditAppointmentModal({ visible, appointment, onCancel, onSuccess }: EditAppointmentModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  // 当模态框打开且有预约数据时，设置表单初始值
  useEffect(() => {
    if (visible && appointment) {
      form.setFieldsValue({
        ...appointment,
        appointment_time: appointment.appointment_time ? dayjs(appointment.appointment_time) : null,
      });
    }
  }, [visible, appointment, form]);

  const handleSubmit = async (values: any) => {
    if (!appointment) return;

    setLoading(true);
    try {
      const response = await fetch('/api/appointments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          id: appointment.id,
          appointment_time: values.appointment_time.toISOString(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        message.success('预约更新成功');
        onSuccess();
        onCancel();
      } else {
        message.error(result.error || '更新预约失败');
      }
    } catch (error) {
      console.error('更新预约失败:', error);
      message.error('网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  if (!appointment) return null;

  return (
    <Modal
      title={`编辑预约 - ${appointment.property_name}`}
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
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="property_name"
              label="物业名称"
              rules={[{ required: true, message: '请输入物业名称' }]}
            >
              <Input placeholder="请输入物业名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="property_address"
              label="房间地址"
              rules={[{ required: true, message: '请输入房间地址' }]}
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
              rules={[{ required: true, message: '请输入客户姓名' }]}
            >
              <Input placeholder="请输入客户姓名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="customer_phone"
              label="客户电话"
              rules={[
                { required: true, message: '请输入客户电话' },
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
              rules={[{ required: true, message: '请输入经纪人姓名' }]}
            >
              <Input placeholder="请输入经纪人姓名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="appointment_time"
              label="预约时间"
              rules={[{ required: true, message: '请选择预约时间' }]}
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
              name="status"
              label="预约状态"
              rules={[{ required: true, message: '请选择预约状态' }]}
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
      </Form>
    </Modal>
  );
} 