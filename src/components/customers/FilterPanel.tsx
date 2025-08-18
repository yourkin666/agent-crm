'use client';

import React from 'react';
import { Card, Form, Input, Button, Space } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { CustomerFilterParams } from '@/types';
import { CUSTOMER_STATUS_TEXT, SOURCE_CHANNEL_TEXT } from '@/utils/constants';

interface FilterPanelProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form: any;
    filters: CustomerFilterParams;
    onSearch: (values: Record<string, unknown>) => void;
    onReset: () => void;
    onRefresh: () => void;
    onShowAdvancedFilter: () => void;
    onRemoveFilter: (filterKey: string, value?: unknown) => void;
}

export default function FilterPanel({
    form,
    filters,
    onSearch,
    onReset,
    onRefresh,
    onShowAdvancedFilter,
    onRemoveFilter
}: FilterPanelProps) {
    return (
        <Card className="filter-panel">
            <Form
                form={form}
                onFinish={onSearch}
                initialValues={filters}
                className="filter-form"
            >
                <div className="filter-row">
                    <Form.Item name="searchText" className="w-64">
                        <Input 
                            placeholder="输入客户姓名、昵称、电话" 
                            allowClear 
                            onPressEnter={() => form.submit()}
                            prefix={<SearchOutlined className="text-gray-400" />}
                        />
                    </Form.Item>
                    <Form.Item className="ml-auto">
                        <Space size="small">
                            <Button 
                                icon={<SearchOutlined />}
                                onClick={onShowAdvancedFilter}
                                className="filter-more-btn"
                            >
                                更多筛选
                            </Button>
                            <Button onClick={onReset}>
                                清空
                            </Button>
                            <Button 
                                icon={<ReloadOutlined />} 
                                onClick={() => {
                                    console.log('🖱️ 刷新按钮被点击');
                                    onRefresh();
                                }}
                                type="default"
                                size="middle"
                            >
                                刷新
                            </Button>
                            
                            {/* 筛选条件标签 */}
                            {filters.city && Array.isArray(filters.city) && filters.city.map(city => (
                                <span key={city} className="filter-tag">
                                    {city} <span className="remove-tag" onClick={() => onRemoveFilter('city', city)}>×</span>
                                </span>
                            ))}
                            {filters.city && !Array.isArray(filters.city) && (
                                <span className="filter-tag">
                                    {filters.city} <span className="remove-tag" onClick={() => onRemoveFilter('city')}>×</span>
                                </span>
                            )}
                            {filters.status && Array.isArray(filters.status) && filters.status.map(status => (
                                <span key={status} className="filter-tag">
                                    {CUSTOMER_STATUS_TEXT[status as keyof typeof CUSTOMER_STATUS_TEXT]} 
                                    <span className="remove-tag" onClick={() => onRemoveFilter('status', status)}>×</span>
                                </span>
                            ))}
                            {filters.source_channel && Array.isArray(filters.source_channel) && filters.source_channel.map(channel => (
                                <span key={channel} className="filter-tag">
                                    {SOURCE_CHANNEL_TEXT[channel as keyof typeof SOURCE_CHANNEL_TEXT]} 
                                    <span className="remove-tag" onClick={() => onRemoveFilter('source_channel', channel)}>×</span>
                                </span>
                            ))}
                            {filters.move_in_days && (
                                <span className="filter-tag">
                                    {filters.move_in_days}日内入住 
                                    <span className="remove-tag" onClick={() => onRemoveFilter('move_in_days')}>×</span>
                                </span>
                            )}
                            {filters.botId && (
                                <span className="filter-tag">
                                    托管ID: {filters.botId}
                                   <span className="remove-tag" onClick={() => onRemoveFilter('botId')}>×</span>
                               </span>
                           )}
                            {filters.viewing_today && (
                                <span className="filter-tag">
                                    今日看房 
                                    <span className="remove-tag" onClick={() => onRemoveFilter('viewing_today')}>×</span>
                                </span>
                            )}
                        </Space>
                    </Form.Item>
                </div>
            </Form>
        </Card>
    );
} 