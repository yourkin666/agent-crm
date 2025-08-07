'use client';

import React, { useState, useCallback } from 'react';
import {
  Modal, Form, Input, Select, Row, Col, InputNumber, message, DatePicker, Spin, AutoComplete
} from 'antd';
import dayjs from 'dayjs';
import { Customer } from '@/types';
import {
  BUSINESS_TYPE_TEXT_BY_STRING, ROOM_TYPE_TEXT_BY_STRING, 
  ROOM_TAG_TEXT_BY_STRING, VIEWER_TYPE_TEXT_BY_STRING,
  VIEWING_STATUS_TEXT, VIEWING_FEEDBACK_TEXT
} from '@/utils/constants';
import CommunityAutoComplete from './CommunityAutoComplete';

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
  data: any; // 保存完整的详细地址数据
}

export default function AddViewingModal({ visible, customer, onCancel, onSuccess }: AddViewingModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [detailAddressOptions, setDetailAddressOptions] = useState<DetailAddressOption[]>([]);
  const [detailAddressLoading, setDetailAddressLoading] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);

  // 获取详细地址列表并自动填充
  const fetchDetailAddresses = useCallback(async (propertyAddrId: number) => {
    if (!propertyAddrId) return;

    setDetailAddressLoading(true);
    try {
      console.log('获取详细地址，propertyAddrId:', propertyAddrId);
      const response = await fetch(`/api/property/${propertyAddrId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        
        // 处理返回的数据
        let detailAddressList = [];
        if (result.success && result.data) {
          // 如果是外部接口成功返回的数据（新分页格式）
          if (result.data.code === 200 && result.data.data && Array.isArray(result.data.data.list)) {
            detailAddressList = result.data.data.list;
            console.log('使用外部接口详细地址数据（分页格式）');
          }
          // 如果是外部接口成功返回的数据（直接数组格式）
          else if (result.data.code === 200 && Array.isArray(result.data.data)) {
            detailAddressList = result.data.data;
            console.log('使用外部接口详细地址数据（数组格式）');
          }
          // 如果是模拟数据（新分页格式）
          else if (result.isMockData && result.data.data && Array.isArray(result.data.data.list)) {
            detailAddressList = result.data.data.list;
            console.log('使用模拟详细地址数据（分页格式）');
          }
          // 如果是模拟数据（直接数组格式）
          else if (result.isMockData && Array.isArray(result.data.data)) {
            detailAddressList = result.data.data;
            console.log('使用模拟详细地址数据（数组格式）');
          }
        }

        console.log('详细地址数据加载成功:', detailAddressList.length, '条记录');
        
        // 自动填充详细地址 - 可以是第一个地址或者组合显示
        if (detailAddressList.length > 0) {
          // 自动选择第一个详细地址
          const firstAddress = detailAddressList[0];
          form.setFieldsValue({ 
            property_address: firstAddress.detailAddr 
          });
          
          // 创建地址选项供后续可能的手动修改
          const addressOptions: DetailAddressOption[] = detailAddressList.map((item: any) => ({
            value: item.detailAddr,
            label: item.detailAddr,
            data: item,
          }));
          setDetailAddressOptions(addressOptions);
          
          console.log('已自动填充详细地址:', firstAddress.detailAddr);
        } else {
          form.setFieldsValue({ property_address: '暂无详细地址信息' });
          setDetailAddressOptions([]);
        }
      } else {
        console.error('获取详细地址数据失败:', response.statusText);
        message.error('获取详细地址失败');
        setDetailAddressOptions([]);
        form.setFieldsValue({ property_address: undefined });
      }
    } catch (error) {
      console.error('获取详细地址接口调用失败:', error);
      message.error('获取详细地址失败');
      setDetailAddressOptions([]);
      form.setFieldsValue({ property_address: undefined });
    } finally {
      setDetailAddressLoading(false);
    }
  }, [form]);

  // 处理物业地址选择变化
  const handlePropertyChange = useCallback((value: string, selectedOption?: any) => {
    console.log('物业地址变化:', value, selectedOption);
    
    if (selectedOption && selectedOption.propertyAddrId) {
      setSelectedPropertyId(selectedOption.propertyAddrId);
      // 获取对应的详细地址
      fetchDetailAddresses(selectedOption.propertyAddrId);
    } else {
      // 手动输入或清空时，清除详细地址选项
      setSelectedPropertyId(null);
      setDetailAddressOptions([]);
      form.setFieldsValue({ property_address: undefined });
    }
  }, [fetchDetailAddresses, form]);

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
          viewing_time: values.viewing_time ? values.viewing_time.toISOString() : new Date().toISOString(),
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
    // 清理状态
    setDetailAddressOptions([]);
    setSelectedPropertyId(null);
    setDetailAddressLoading(false);
    onCancel();
  };

  if (!customer) return null;

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