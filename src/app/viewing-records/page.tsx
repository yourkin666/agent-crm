'use client';

import React, { useState, useEffect } from 'react';
import {
    Table, Button, Space, Tag, Input, Select, Form, Row, Col,
    Card, Statistic, message, Pagination, DatePicker
} from 'antd';
import {
    PlusOutlined, SearchOutlined, EyeOutlined,
    EditOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import MainLayout from '@/components/layout/MainLayout';
import ViewingDetailModal from '@/components/viewing-records/ViewingDetailModal';
import EditViewingModal from '@/components/viewing-records/EditViewingModal';
import { ViewingRecord, ApiResponse, PaginatedResponse } from '@/types';
import {
    VIEWING_STATUS_TEXT, VIEWING_STATUS_COLOR, BUSINESS_TYPE_TEXT,
    VIEWER_TYPE_TEXT_BY_STRING, VIEWING_FEEDBACK_TEXT, DEFAULT_PAGE_SIZE,
    ROOM_TYPE_TEXT_BY_STRING, ROOM_TAG_TEXT_BY_STRING
} from '@/utils/constants';
import { formatDate, formatMoney } from '@/utils/helpers';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface ViewingRecordFilterParams {
    page?: number;
    pageSize?: number;
    customer_name?: string;
    property_name?: string;
    viewing_status?: number;
    business_type?: string;
    viewer_name?: string;
    date_from?: string;
    date_to?: string;
}

export default function ViewingRecordsPage() {
    const [viewingRecords, setViewingRecords] = useState<ViewingRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCommission, setTotalCommission] = useState(0); // 总佣金
    const [totalRecords, setTotalRecords] = useState(0); // 总记录数
    const [completedRecords, setCompletedRecords] = useState(0); // 已完成记录数
    const [pendingRecords, setPendingRecords] = useState(0); // 待处理记录数
    
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total: number) => `共 ${total} 条记录`,
    });

    const [form] = Form.useForm();
    const [filters, setFilters] = useState<ViewingRecordFilterParams>({
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
    });

    // 模态框状态
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<ViewingRecord | null>(null);

    // 获取带看记录数据
    const fetchViewingRecords = async (params: ViewingRecordFilterParams = {}) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            Object.entries({ ...filters, ...params }).forEach(([key, value]) => {
                if (value !== undefined && value !== '' && value !== null) {
                    queryParams.append(key, String(value));
                }
            });

            const response = await fetch(`/api/viewing-records?${queryParams}`);
            const result: ApiResponse<PaginatedResponse<ViewingRecord>> = await response.json();

            if (result.success && result.data) {
                const data = result.data;
                setViewingRecords(data.data);
                setPagination(prev => ({
                    ...prev,
                    current: data.page,
                    total: data.total,
                }));

                // 计算统计数据
                const records = data.data;
                setTotalRecords(data.total);
                setTotalCommission(records.reduce((sum, record) => sum + record.commission, 0));
                setCompletedRecords(records.filter(record => record.viewing_status === 4).length);
                setPendingRecords(records.filter(record => record.viewing_status === 1).length);
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

    // 获取单个带看记录详情
    const fetchViewingRecordDetail = async (id: number) => {
        try {
            const response = await fetch(`/api/viewing-records/${id}`);
            const result: ApiResponse<ViewingRecord> = await response.json();

            if (result.success && result.data) {
                return result.data;
            } else {
                message.error(result.error || '获取带看记录详情失败');
                return null;
            }
        } catch (error) {
            console.error('获取带看记录详情失败:', error);
            message.error('网络请求失败');
            return null;
        }
    };

    // 搜索处理
    const handleSearch = (values: any) => {
        const newFilters = {
            ...filters,
            ...values,
            page: 1,
        };
        setFilters(newFilters);
        fetchViewingRecords(newFilters);
    };

    // 重置搜索
    const handleReset = () => {
        form.resetFields();
        const resetFilters = {
            page: 1,
            pageSize: DEFAULT_PAGE_SIZE,
        };
        setFilters(resetFilters);
        fetchViewingRecords(resetFilters);
    };

    // 分页处理
    const handleTableChange = (page: number, pageSize?: number) => {
        const newFilters = {
            ...filters,
            page,
            pageSize: pageSize || DEFAULT_PAGE_SIZE,
        };
        setFilters(newFilters);
        fetchViewingRecords(newFilters);
    };

    // 查看详情
    const handleViewDetail = async (record: ViewingRecord) => {
        const detailRecord = await fetchViewingRecordDetail(record.id);
        if (detailRecord) {
            setSelectedRecord(detailRecord);
            setDetailModalVisible(true);
        }
    };

    // 编辑记录
    const handleEdit = async (record: ViewingRecord) => {
        const detailRecord = await fetchViewingRecordDetail(record.id);
        if (detailRecord) {
            setSelectedRecord(detailRecord);
            setEditModalVisible(true);
        }
    };

    // 编辑成功后刷新列表
    const handleEditSuccess = () => {
        fetchViewingRecords(filters);
    };

    // 表格列定义
    const columns: ColumnsType<ViewingRecord> = [
        {
            title: '带看时间',
            dataIndex: 'viewing_time',
            key: 'viewing_time',
            width: 150,
            render: (time: string) => formatDate(time),
            sorter: true,
        },
        {
            title: '物业地址',
            dataIndex: 'property_name',
            key: 'property_name',
            width: 150,
            ellipsis: true,
        },
        {
            title: '详细地址',
            dataIndex: 'property_address',
            key: 'property_address',
            width: 180,
            ellipsis: true,
            render: (address: string) => address || '-',
        },
        {
            title: '客户姓名',
            dataIndex: 'customer_name',
            key: 'customer_name',
            width: 100,
        },
        {
            title: '业务类型',
            dataIndex: 'business_type',
            key: 'business_type',
            width: 100,
            render: (type: string) => (
                <Tag color="blue">{BUSINESS_TYPE_TEXT[type as keyof typeof BUSINESS_TYPE_TEXT] || type}</Tag>
            ),
        },
        {
            title: '带看户型',
            dataIndex: 'room_type',
            key: 'room_type',
            width: 100,
            render: (type: string) => (
                <Tag color="cyan">{ROOM_TYPE_TEXT_BY_STRING[type as keyof typeof ROOM_TYPE_TEXT_BY_STRING] || type}</Tag>
            ),
        },
        {
            title: '房型标签',
            dataIndex: 'room_tag',
            key: 'room_tag',
            width: 100,
            render: (tag: string) => {
                if (!tag) return '-';
                return (
                    <Tag color="geekblue">{ROOM_TAG_TEXT_BY_STRING[tag as keyof typeof ROOM_TAG_TEXT_BY_STRING] || tag}</Tag>
                );
            },
        },
        {
            title: '带看人',
            dataIndex: 'viewer_name',
            key: 'viewer_name',
            width: 100,
            render: (name: string) => VIEWER_TYPE_TEXT_BY_STRING[name as keyof typeof VIEWER_TYPE_TEXT_BY_STRING] || name,
        },
        {
            title: '带看状态',
            dataIndex: 'viewing_status',
            key: 'viewing_status',
            width: 100,
            render: (status: number) => (
                <Tag color={VIEWING_STATUS_COLOR[status as keyof typeof VIEWING_STATUS_COLOR]}>
                    {VIEWING_STATUS_TEXT[status as keyof typeof VIEWING_STATUS_TEXT]}
                </Tag>
            ),
        },
        {
            title: '佣金',
            dataIndex: 'commission',
            key: 'commission',
            width: 100,
            render: (commission: number) => formatMoney(commission),
            sorter: true,
        },
        {
            title: '带看反馈',
            dataIndex: 'viewing_feedback',
            key: 'viewing_feedback',
            width: 100,
            render: (feedback: number) => {
                if (feedback === undefined || feedback === null) return '-';
                const feedbackText = feedback === 0 ? '未成交' : feedback === 1 ? '已成交' : '-';
                return (
                    <Tag color={feedback === 1 ? 'green' : 'orange'}>
                        {feedbackText}
                    </Tag>
                );
            },
        },
        {
            title: '操作',
            key: 'action',
            width: 150,
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => handleViewDetail(record)}
                        className="action-button"
                    >
                        查看
                    </Button>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleEdit(record)}
                        className="action-button warning"
                    >
                        编辑
                    </Button>
                </Space>
            ),
        },
    ];

    // 初始化数据
    useEffect(() => {
        fetchViewingRecords();
    }, []);

    return (
        <MainLayout>
            <div style={{ padding: '24px' }}>
                {/* 统计卡片 */}
                <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col span={6}>
                        <Card>
                            <Statistic 
                                title="总记录数" 
                                value={totalRecords}
                                prefix={<EyeOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic 
                                title="已完成" 
                                value={completedRecords}
                                valueStyle={{ color: '#3f8600' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic 
                                title="待处理" 
                                value={pendingRecords}
                                valueStyle={{ color: '#cf1322' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic 
                                title="总佣金" 
                                value={totalCommission}
                                precision={2}
                                suffix="元"
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* 搜索表单 */}
                <Card title="预约带看" style={{ marginBottom: 16 }}>
                    <Form
                        form={form}
                        layout="inline"
                        onFinish={handleSearch}
                        style={{ marginBottom: 16 }}
                    >
                        <Form.Item name="customer_name">
                            <Input 
                                placeholder="输入客户姓名" 
                                style={{ width: 150 }}
                            />
                        </Form.Item>
                        <Form.Item name="property_name">
                            <Input 
                                placeholder="输入物业地址" 
                                style={{ width: 150 }}
                            />
                        </Form.Item>
                        <Form.Item name="viewing_status">
                            <Select 
                                placeholder="带看状态" 
                                style={{ width: 120 }}
                                allowClear
                            >
                                <Option value={1}>待确认</Option>
                                <Option value={2}>已确认</Option>
                                <Option value={3}>已取消</Option>
                                <Option value={4}>已带看</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="business_type">
                            <Select 
                                placeholder="业务类型" 
                                style={{ width: 120 }}
                                allowClear
                            >
                                <Option value="whole_rent">整租</Option>
                                <Option value="shared_rent">合租</Option>
                                <Option value="centralized">集中</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="viewer_name">
                            <Select 
                                placeholder="带看人" 
                                style={{ width: 120 }}
                                allowClear
                            >
                                <Option value="internal">内部管家</Option>
                                <Option value="external">外部管家</Option>
                                <Option value="external_sales">外销管家</Option>
                                <Option value="creator">录入人</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item>
                            <Space>
                                <Button 
                                    type="primary" 
                                    htmlType="submit" 
                                    icon={<SearchOutlined />}
                                >
                                    搜索
                                </Button>
                                <Button onClick={handleReset}>
                                    重置
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>

                    {/* 表格 */}
                    <Table
                        columns={columns}
                        dataSource={viewingRecords}
                        rowKey="id"
                        loading={loading}
                        pagination={false}
                        scroll={{ x: 1400 }}
                        size="small"
                    />

                    {/* 分页 */}
                    <div style={{ marginTop: 16, textAlign: 'right' }}>
                        <Pagination
                            current={pagination.current}
                            pageSize={pagination.pageSize}
                            total={pagination.total}
                            showSizeChanger
                            showQuickJumper
                            showTotal={pagination.showTotal}
                            onChange={handleTableChange}
                            onShowSizeChange={handleTableChange}
                        />
                    </div>
                </Card>

                {/* 查看详情模态框 */}
                <ViewingDetailModal
                    visible={detailModalVisible}
                    record={selectedRecord}
                    onCancel={() => {
                        setDetailModalVisible(false);
                        setSelectedRecord(null);
                    }}
                />

                {/* 编辑模态框 */}
                <EditViewingModal
                    visible={editModalVisible}
                    record={selectedRecord}
                    onCancel={() => {
                        setEditModalVisible(false);
                        setSelectedRecord(null);
                    }}
                    onSuccess={handleEditSuccess}
                />
            </div>
        </MainLayout>
    );
} 