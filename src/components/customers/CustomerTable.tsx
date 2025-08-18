'use client';

import React from 'react';
import { Table, Button, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    EyeOutlined, EditOutlined, CalendarOutlined, DeleteOutlined
} from '@ant-design/icons';
import { Customer } from '@/types';
import {
    CUSTOMER_STATUS_TEXT, CUSTOMER_STATUS_COLOR, SOURCE_CHANNEL_TEXT
} from '@/utils/constants';
import { formatPhone, formatDate, formatMoney, formatBusinessTypes, formatRoomTypesDisplay, formatDateTime } from '@/utils/helpers';

interface CustomerTableProps {
    customers: Customer[];
    loading: boolean;
    onViewCustomer: (customer: Customer) => void;
    onEditCustomer: (customer: Customer) => void;
    onAddViewing: (customer: Customer) => void;
    onDeleteCustomer: (customer: Customer) => void;
    onViewingDetails: (customer: Customer) => void;
}

export default function CustomerTable({
    customers,
    loading,
    onViewCustomer,
    onEditCustomer,
    onAddViewing,
    onDeleteCustomer,
    onViewingDetails
}: CustomerTableProps) {
    const columns: ColumnsType<Customer> = [
        {
            title: '租客',
            key: 'customer',
            width: 150,
            render: (_, record) => (
                <div className="customer-info">
                    <div className="customer-name">
                        {record.name}
                        {record.nickname && record.nickname !== record.name && (
                            <span className="customer-nickname">({record.nickname})</span>
                        )}
                    </div>
                    <div className="customer-phone">{formatPhone(record.phone)}</div>
                </div>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 90,
            render: (status: number) => (
                <Tag color={CUSTOMER_STATUS_COLOR[status as keyof typeof CUSTOMER_STATUS_COLOR]}>
                    {CUSTOMER_STATUS_TEXT[status as keyof typeof CUSTOMER_STATUS_TEXT]}
                </Tag>
            ),
        },
        {
            title: '咨询小区',
            dataIndex: 'community',
            key: 'community',
            width: 120,
        },
        {
            title: '需求房型',
            key: 'requirement',
            width: 160,
            render: (_, record) => {
                const businessTypes = formatBusinessTypes(record.business_type);
                const roomTypes = formatRoomTypesDisplay(record.room_type);
                return `${businessTypes} - ${roomTypes}`;
            },
        },
        {
            title: '入住时间',
            dataIndex: 'move_in_date',
            key: 'move_in_date',
            width: 90,
            render: (date: string) => date ? formatDate(date) : '-',
        },
        {
            title: '可接受价格',
            key: 'price_range',
            width: 100,
            render: (_, record) => record.price_range || '-',
        },
        {
            title: '线索佣金',
            dataIndex: 'total_commission',
            key: 'total_commission',
            width: 80,
            render: (commission: number) => formatMoney(commission),
        },
        {
            title: '带看次数',
            dataIndex: 'viewing_count',
            key: 'viewing_count',
            width: 70,
            render: (count: number, record: Customer) => (
                <Button type="link" size="small" onClick={() => onViewingDetails(record)}>
                    {count}
                </Button>
            ),
        },
        {
            title: '来源渠道',
            dataIndex: 'source_channel',
            key: 'source_channel',
            width: 80,
            render: (channel: string) => SOURCE_CHANNEL_TEXT[channel as keyof typeof SOURCE_CHANNEL_TEXT],
        },
        {
            title: '添加时间',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 160,
            render: (time: string) => formatDateTime(time),
        },
        {
            title: '录入',
            key: 'entry_info',
            width: 120,
            render: (_, record) => (
                <span className="entry-info">
                    {record.is_agent ? '[人工]' : '[agent]'} {record.creator === '外部Agent系统' ? 'Agent' : record.creator}
                </span>
            ),
        },
        {
            title: '操作',
            key: 'actions',
            width: 200,
            fixed: 'right',
            render: (_, record) => (
                <div className="action-buttons compact">
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => onViewCustomer(record)}
                        className="action-button primary"
                    >
                        查看
                    </Button>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => onEditCustomer(record)}
                        className="action-button primary"
                    >
                        编辑
                    </Button>
                    <Button
                        type="text"
                        icon={<CalendarOutlined />}
                        size="small"
                        onClick={() => onAddViewing(record)}
                        className="action-button success"
                    >
                        添加带看
                    </Button>
                    <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => onDeleteCustomer(record)}
                        className="action-button danger"
                        danger
                    >
                        删除
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={customers}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="middle"
            className="custom-scrollbar"
        />
    );
} 