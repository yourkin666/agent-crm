'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal, Tabs, Row, Col, Tag, Table, Empty, Spin, message, Button
} from 'antd';
import { EditOutlined } from '@ant-design/icons';
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
  onEdit?: (customer: Customer) => void;
}

export default function CustomerDetailModal({ visible, customer, onCancel, onEdit }: CustomerDetailModalProps) {
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
      title: '带看时间',
      dataIndex: 'viewing_time',
      key: 'viewing_time',
      width: 100,
      render: (time: string) => formatDate(time),
    },
    {
      title: '带看楼盘',
      dataIndex: 'property_name',
      key: 'property_name',
      width: 120,
      render: (name: string) => name || '-',
    },
    {
      title: '户型',
      dataIndex: 'room_type',
      key: 'room_type',
      width: 80,
      render: (type: string) => (ROOM_TYPE_TEXT_BY_STRING as Record<string, string>)[type] || type,
    },
    {
      title: '带看人',
      dataIndex: 'viewer_name',
      key: 'viewer_name',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'viewing_status',
      key: 'viewing_status',
      width: 90,
      render: (status: number) => (
        <Tag color={(VIEWING_STATUS_COLOR as Record<number, string>)[status]}>
          {(VIEWING_STATUS_TEXT as Record<number, string>)[status]}
        </Tag>
      ),
    },
    {
      title: '佣金',
      dataIndex: 'commission',
      key: 'commission',
      width: 80,
      render: (commission: number) => formatMoney(commission),
    },
    {
      title: '反馈',
      dataIndex: 'viewing_feedback',
      key: 'viewing_feedback',
      width: 80,
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
      label: '客户详情',
      children: (
        <div className="customer-detail-content">
          {/* 客户信息部分 */}
          <div className="section-block">
            <div className="section-title">客户信息</div>
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <div className="info-item">
                  <div className="info-label">客户昵称</div>
                  <div className="info-value">{customer.name}</div>
                </div>
              </Col>
              <Col span={12}>
                <div className="info-item">
                  <div className="info-label">客户姓名</div>
                  <div className="info-value">{customer.name}</div>
                </div>
              </Col>
              <Col span={12}>
                <div className="info-item">
                  <div className="info-label">客户状态</div>
                  <div className="info-value">
                    <Tag color={CUSTOMER_STATUS_COLOR[customer.status]} size="small">
                      {CUSTOMER_STATUS_TEXT[customer.status]}
                    </Tag>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="info-item">
                  <div className="info-label">手机号</div>
                  <div className="info-value">{formatPhone(customer.phone)}</div>
                </div>
              </Col>
              <Col span={12}>
                <div className="info-item">
                  <div className="info-label">备用手机号</div>
                  <div className="info-value">{customer.backup_phone || '--'}</div>
                </div>
              </Col>
              <Col span={12}>
                <div className="info-item">
                  <div className="info-label">微信号</div>
                  <div className="info-value">{customer.wechat || '--'}</div>
                </div>
              </Col>
            </Row>
          </div>

          {/* 找房需求部分 */}
          <div className="section-block">
            <div className="section-title">找房需求</div>
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <div className="info-item">
                  <div className="info-label">咨询小区</div>
                  <div className="info-value">{customer.community}</div>
                </div>
              </Col>
              <Col span={12}>
                <div className="info-item">
                  <div className="info-label">需求户型</div>
                  <div className="info-value">
                    {formatRequirementByString(customer.business_type, customer.room_type, customer.room_tags)}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="info-item">
                  <div className="info-label">可接受价格</div>
                  <div className="info-value">{customer.price_range || '--'}</div>
                </div>
              </Col>
              <Col span={12}>
                <div className="info-item">
                  <div className="info-label">预计入住时间</div>
                  <div className="info-value">{customer.move_in_date ? formatDate(customer.move_in_date) : '--'}</div>
                </div>
              </Col>
              <Col span={12}>
                <div className="info-item">
                  <div className="info-label">预计租赁周期</div>
                  <div className="info-value">
                    {customer.lease_period ? 
                      (customer.lease_period === 1 ? '1-6月' : 
                       customer.lease_period === 12 ? '一年' : 
                       customer.lease_period === 24 ? '两年' : 
                       customer.lease_period === 36 ? '三年+' : `${customer.lease_period}月`) : '--'}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="info-item">
                  <div className="info-label">来源渠道</div>
                  <div className="info-value">{SOURCE_CHANNEL_TEXT_BY_STRING[customer.source_channel] || customer.source_channel}</div>
                </div>
              </Col>
            </Row>
          </div>

          {/* 内部备注部分 */}
          <div className="section-block">
            <div className="section-title">内部备注</div>
            <div className="info-textarea">
              <div className="remark-content">
                {customer.internal_notes || '暂无备注信息'}
              </div>
            </div>
          </div>
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

  // 自定义标题，包含编辑按钮
  const modalTitle = (
    <div className="flex justify-between items-center">
      <span>客户信息</span>
      {onEdit && (
        <Button 
          type="link" 
          icon={<EditOutlined />}
          onClick={() => onEdit(customer)}
          className="text-blue-600 hover:text-blue-700"
        >
          编辑信息
        </Button>
      )}
    </div>
  );

  return (
    <Modal
      title={modalTitle}
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