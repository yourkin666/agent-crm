'use client';

import React, { useEffect } from 'react';
import {
  Modal, Form, Input, Select, DatePicker, Row, Col, message
} from 'antd';
import {
  CustomerStatus, SourceChannel, BusinessType, RoomType, RoomTag, LeasePeriod, Customer
} from '@/types';
import {
  CUSTOMER_STATUS_TEXT, SOURCE_CHANNEL_TEXT, BUSINESS_TYPE_TEXT,
  ROOM_TYPE_TEXT, ROOM_TAG_TEXT, LEASE_PERIOD_TEXT
} from '@/utils/constants';
import dayjs from 'dayjs';

const { Option } = Select;

interface EditCustomerModalProps {
  visible: boolean;
  customer: Customer | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function EditCustomerModal({ visible, customer, onCancel, onSuccess }: EditCustomerModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  // 当模态框打开且有客户数据时，设置表单初始值
  useEffect(() => {
    if (visible && customer) {
      form.setFieldsValue({
        ...customer,
        move_in_date: customer.move_in_date ? dayjs(customer.move_in_date) : null,
      });
    }
  }, [visible, customer, form]);

  const handleSubmit = async (values: any) => {
    if (!customer) return;

    setLoading(true);
    try {
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          id: customer.id,
          move_in_date: values.move_in_date ? values.move_in_date.format('YYYY-MM-DD') : null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        message.success('客户更新成功');
        onSuccess();
        onCancel();
      } else {
        message.error(result.error || '更新客户失败');
      }
    } catch (error) {
      console.error('更新客户失败:', error);
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
      title="编辑客户信息"
      open={visible}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={800}
      destroyOnHidden
      styles={{
        body: { padding: '16px' },
        header: { paddingBottom: '12px' }
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="edit-customer-form"
      >
        {/* 客户信息部分 */}
        <div className="section-block">
          <div className="section-title">客户信息</div>
          <Row gutter={[12, 4]}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="客户姓名"
                rules={[{ required: true, message: '请输入客户姓名' }]}
              >
                <Input placeholder="请输入客户姓名" />
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
            <Col span={12}>
              <Form.Item name="backup_phone" label="备用手机号">
                <Input placeholder="请输入备用手机号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="wechat" label="微信号">
                <Input placeholder="请输入微信号" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* 找房需求部分 */}
        <div className="section-block">
          <div className="section-title">找房需求</div>
          <Row gutter={[12, 4]}>
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
                name="business_type"
                label="需求户型（业务类型）"
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
            <Col span={12}>
              <Form.Item name="price_range" label="可接受价格">
                <Input placeholder="例如：5000-7000" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="move_in_date" label="预计入住时间">
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="请选择入住时间"
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lease_period" label="预计租赁周期">
                <Select placeholder="请选择租赁周期" allowClear>
                  {Object.entries(LEASE_PERIOD_TEXT).map(([value, label]) => (
                    <Option key={value} value={parseInt(value)}>
                      {label}
                    </Option>
                  ))}
                </Select>
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
        </div>

        {/* 内部备注部分 */}
        <div className="section-block">
          <div className="section-title">内部备注</div>
          <Row gutter={[12, 4]}>
            <Col span={24}>
              <Form.Item 
                name="internal_notes" 
                label="内部备注 (最多300字)"
              >
                <Input.TextArea
                  placeholder="请输入内部备注信息..."
                  rows={3}
                  maxLength={300}
                  showCount
                  style={{ resize: 'none', fontSize: '14px' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* 房型配置（移到找房需求中） */}
        <div style={{ display: 'none' }}>
          <Form.Item
            name="room_type"
            rules={[{ required: true, message: '请选择房型' }]}
            initialValue="one_bedroom"
          >
            <Input type="hidden" />
          </Form.Item>
          <Form.Item name="room_tags">
            <Input type="hidden" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
} 