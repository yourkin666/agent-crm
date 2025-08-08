'use client';

import React from 'react';
import { Modal, Descriptions, Tag, Space } from 'antd';
import { ViewingRecord } from '@/types';
import {
    VIEWING_STATUS_TEXT, VIEWING_STATUS_COLOR, BUSINESS_TYPE_TEXT,
    VIEWER_TYPE_TEXT_BY_STRING, ROOM_TYPE_TEXT
} from '@/utils/constants';
import { formatDate, formatMoney } from '@/utils/helpers';

interface ViewingDetailModalProps {
    visible: boolean;
    record: ViewingRecord | null;
    onCancel: () => void;
}

export default function ViewingDetailModal({ visible, record, onCancel }: ViewingDetailModalProps) {
    if (!record) return null;

    const items = [
        {
            key: 'basic_info',
            label: '基本信息',
            children: (
                <Descriptions column={2} size="small">
                    <Descriptions.Item label="带看时间">
                        {formatDate(record.viewing_time)}
                    </Descriptions.Item>
                    <Descriptions.Item label="带看状态">
                        <Tag color={VIEWING_STATUS_COLOR[record.viewing_status as keyof typeof VIEWING_STATUS_COLOR]}>
                            {VIEWING_STATUS_TEXT[record.viewing_status as keyof typeof VIEWING_STATUS_TEXT]}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="业务类型">
                        <Tag color="blue">
                            {BUSINESS_TYPE_TEXT[record.business_type as keyof typeof BUSINESS_TYPE_TEXT] || record.business_type}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="带看人">
                        {VIEWER_TYPE_TEXT_BY_STRING[record.viewer_name as keyof typeof VIEWER_TYPE_TEXT_BY_STRING] || record.viewer_name}
                    </Descriptions.Item>
                </Descriptions>
            ),
        },
        {
            key: 'customer_info',
            label: '客户信息',
            children: (
                <Descriptions column={2} size="small">
                    <Descriptions.Item label="客户姓名">
                        {record.customer_name || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="客户电话">
                        {record.customer_phone || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="客户ID" span={2}>
                        {record.customer_id || '-'}
                    </Descriptions.Item>
                </Descriptions>
            ),
        },
        {
            key: 'property_info',
            label: '房源信息',
            children: (
                <Descriptions column={2} size="small">
                    <Descriptions.Item label="物业地址">
                        {record.property_name}
                    </Descriptions.Item>
                    <Descriptions.Item label="详细地址">
                        {record.property_address || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="户型">
                        {ROOM_TYPE_TEXT[record.room_type as keyof typeof ROOM_TYPE_TEXT] || record.room_type}
                    </Descriptions.Item>
                    <Descriptions.Item label="房型标签">
                        {record.room_tag || '-'}
                    </Descriptions.Item>
                </Descriptions>
            ),
        },
        {
            key: 'business_info',
            label: '业务信息',
            children: (
                <Descriptions column={2} size="small">
                    <Descriptions.Item label="佣金">
                        <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
                            {formatMoney(record.commission)}
                        </span>
                    </Descriptions.Item>
                    <Descriptions.Item label="带看反馈">
                        {record.viewing_feedback !== undefined && record.viewing_feedback !== null ? (
                            <Tag color={record.viewing_feedback === 1 ? 'green' : 'orange'}>
                                {record.viewing_feedback === 0 ? '未成交' : record.viewing_feedback === 1 ? '已成交' : '-'}
                            </Tag>
                        ) : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="备注" span={2}>
                        {record.notes || '-'}
                    </Descriptions.Item>
                </Descriptions>
            ),
        },
        {
            key: 'extended_info',
            label: '扩展信息',
            children: (
                <Descriptions column={2} size="small">
                    <Descriptions.Item label="用户ID">
                        {record.userId || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="机器人ID">
                        {record.botId || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="房源ID">
                        {record.housingId || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="区域信息">
                        {record.houseAreaName ? `${record.houseAreaName} (ID: ${record.houseAreaId})` : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="城市信息">
                        {record.cityName ? `${record.cityName} (ID: ${record.cityId})` : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="顾问信息">
                        {record.advisorName ? `${record.advisorName} (ID: ${record.advisorId})` : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="公司信息">
                        {record.companyName ? `${record.companyName}${record.companyAbbreviation ? ` (${record.companyAbbreviation})` : ''}` : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="地理位置">
                        {record.longitude && record.latitude ? `${record.longitude}, ${record.latitude}` : '-'}
                    </Descriptions.Item>
                </Descriptions>
            ),
        },
        {
            key: 'system_info',
            label: '系统信息',
            children: (
                <Descriptions column={2} size="small">
                    <Descriptions.Item label="创建时间">
                        {formatDate(record.created_at)}
                    </Descriptions.Item>
                    <Descriptions.Item label="更新时间">
                        {formatDate(record.updated_at)}
                    </Descriptions.Item>
                    <Descriptions.Item label="记录ID" span={2}>
                        {record.id}
                    </Descriptions.Item>
                </Descriptions>
            ),
        },
    ];

    return (
        <Modal
            title="带看记录详情"
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={800}
            destroyOnClose
        >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {items.map((item) => (
                    <div key={item.key}>
                        <h4 style={{ marginBottom: 16, color: '#1890ff', borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
                            {item.label}
                        </h4>
                        {item.children}
                    </div>
                ))}
            </Space>
        </Modal>
    );
} 