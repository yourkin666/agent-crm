'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal, Tabs, Row, Col, Tag, Table, Empty, Spin, message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TabsProps } from 'antd';
import { Customer, ViewingRecord } from '@/types';
import {
  CUSTOMER_STATUS_TEXT, CUSTOMER_STATUS_COLOR,
  SOURCE_CHANNEL_TEXT_BY_STRING, BUSINESS_TYPE_TEXT_BY_STRING,
  ROOM_TYPE_TEXT_BY_STRING, ROOM_TAG_TEXT_BY_STRING,
  VIEWER_TYPE_TEXT_BY_STRING, VIEWING_STATUS_TEXT, VIEWING_STATUS_COLOR,
  VIEWING_FEEDBACK_TEXT, VIEWING_FEEDBACK_COLOR
} from '@/utils/constants';
import { formatPhone, formatDate, formatMoney, formatRequirementByString } from '@/utils/helpers';

interface CustomerDetailModalProps {
  visible: boolean;
  customer: Customer | null;
  onCancel: () => void;
}

export default function CustomerDetailModal({ visible, customer, onCancel }: CustomerDetailModalProps) {
  const [viewingRecords, setViewingRecords] = useState<ViewingRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载客户的带看记录
  const loadViewingRecords = async (customerId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/customers/${customerId}/viewing-records`);
      const result = await response.json();

      if (result.success) {
        setViewingRecords(result.data || []);
      } else {
        message.error(result.error || '获取带看记录失败');
      }
    } catch (error) {
      console.error('获取带看记录失败:', error);
      message.error('网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  // 当弹窗打开且有客户数据时，加载带看记录
  useEffect(() => {
    if (visible && customer) {
      loadViewingRecords(customer.id);
    }
  }, [visible, customer]);

  // 带看记录表格列定义
  const viewingColumns: ColumnsType<ViewingRecord> = [
    {
      title: '编号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '带看时间',
      dataIndex: 'viewing_time',
      key: 'viewing_time',
      width: 140,
      render: (time: string) => formatDate(time),
    },
    {
      title: '带看楼盘',
      dataIndex: 'property_name',
      key: 'property_name',
      width: 150,
      render: (name: string) => name || '-',
    },
    {
      title: '带看户型',
      dataIndex: 'room_type',
      key: 'room_type',
      width: 100,
      render: (type: string) => (ROOM_TYPE_TEXT_BY_STRING as Record<string, string>)[type] || type,
    },
    {
      title: '带看人',
      dataIndex: 'viewer_name',
      key: 'viewer_name',
      width: 100,
    },
    {
      title: '带看状态',
      dataIndex: 'viewing_status',
      key: 'viewing_status',
      width: 100,
      render: (status: number) => (
        <Tag color={(VIEWING_STATUS_COLOR as Record<number, string>)[status]}>
          {(VIEWING_STATUS_TEXT as Record<number, string>)[status]}
        </Tag>
      ),
    },
    {
      title: '带看佣金',
      dataIndex: 'commission',
      key: 'commission',
      width: 100,
      render: (commission: number) => formatMoney(commission),
    },
    {
      title: '带看反馈',
      dataIndex: 'viewing_feedback',
      key: 'viewing_feedback',
      width: 100,
      render: (feedback: number) =>
        feedback !== null && feedback !== undefined ? (
          <Tag color={(VIEWING_FEEDBACK_COLOR as Record<number, string>)[feedback]}>
            {(VIEWING_FEEDBACK_TEXT as Record<number, string>)[feedback]}
          </Tag>
        ) : '-',
    },
  ];

  if (!customer) return null;

  // 定义Tab项
  const tabItems: TabsProps['items'] = [
    {
      key: 'info',
      label: '客户信息',
      children: (
        <div className="space-y-4 mt-4">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <div><strong>姓名：</strong>{customer.name}</div>
            </Col>
            <Col span={12}>
              <div><strong>手机号：</strong>{formatPhone(customer.phone)}</div>
            </Col>
            <Col span={12}>
              <div><strong>备用手机：</strong>{customer.backup_phone || '无'}</div>
            </Col>
            <Col span={12}>
              <div><strong>微信：</strong>{customer.wechat || '无'}</div>
            </Col>
            <Col span={12}>
              <div><strong>状态：</strong>
                <Tag color={CUSTOMER_STATUS_COLOR[customer.status]}>
                  {CUSTOMER_STATUS_TEXT[customer.status]}
                </Tag>
              </div>
            </Col>
            <Col span={12}>
              <div><strong>咨询小区：</strong>{customer.community}</div>
            </Col>
            <Col span={12}>
              <div><strong>需求房型：</strong>
                {formatRequirementByString(customer.business_type, customer.room_type, customer.room_tags)}
              </div>
            </Col>
            <Col span={12}>
              <div><strong>入住时间：</strong>{customer.move_in_date ? formatDate(customer.move_in_date) : '待定'}</div>
            </Col>
            <Col span={12}>
              <div><strong>价格区间：</strong>{customer.price_range || '待协商'}</div>
            </Col>
            <Col span={12}>
              <div><strong>来源渠道：</strong>{SOURCE_CHANNEL_TEXT_BY_STRING[customer.source_channel] || customer.source_channel}</div>
            </Col>
            <Col span={12}>
              <div><strong>录入人：</strong>{customer.creator}</div>
            </Col>
            <Col span={12}>
              <div><strong>带看次数：</strong>{customer.viewing_count}</div>
            </Col>
            <Col span={12}>
              <div><strong>线索佣金：</strong>{formatMoney(customer.total_commission)}</div>
            </Col>
            <Col span={12}>
              <div><strong>创建时间：</strong>{formatDate(customer.created_at)}</div>
            </Col>
            <Col span={12}>
              <div><strong>更新时间：</strong>{formatDate(customer.updated_at)}</div>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'viewing',
      label: `带看记录 (${viewingRecords.length})`,
      children: (
        <div className="mt-4">
          {loading ? (
            <div className="text-center py-8">
              <Spin size="large" />
              <p className="mt-4 text-gray-600">加载中...</p>
            </div>
          ) : viewingRecords.length > 0 ? (
            <Table
              columns={viewingColumns}
              dataSource={viewingRecords}
              rowKey="id"
              pagination={false}
              scroll={{ x: 1200 }}
              size="small"
            />
          ) : (
            <Empty
              description="暂无带看记录"
              style={{ padding: '40px 0' }}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={`客户详情 - ${customer.name}`}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1000}
      destroyOnHidden
    >
      <Tabs
        defaultActiveKey="info"
        size="large"
        items={tabItems}
      />
    </Modal>
  );
} 