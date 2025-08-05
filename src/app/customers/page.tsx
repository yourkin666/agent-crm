'use client';

import React, { useState, useEffect } from 'react';
import {
    Table, Button, Space, Tag, Input, Select, Form, Row, Col,
    Card, Statistic, message, Pagination
} from 'antd';
import {
    PlusOutlined, SearchOutlined, EyeOutlined,
    EditOutlined, CalendarOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import MainLayout from '@/components/layout/MainLayout';
import CustomerDetailModal from '@/components/customers/CustomerDetailModal';
import AddViewingModal from '@/components/customers/AddViewingModal';
import AddCustomerModal from '@/components/customers/AddCustomerModal';
import EditCustomerModal from '@/components/customers/EditCustomerModal';
import { Customer, CustomerFilterParams, ApiResponse, PaginatedResponse } from '@/types';
import {
    CUSTOMER_STATUS_TEXT, CUSTOMER_STATUS_COLOR, SOURCE_CHANNEL_TEXT,
    BUSINESS_TYPE_TEXT, DEFAULT_PAGE_SIZE
} from '@/utils/constants';
import { formatPhone, formatDate, formatMoney, formatRequirement, formatBusinessTypes, formatRoomTypesDisplay, formatPriceRange } from '@/utils/helpers';

const { Option } = Select;

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCommission, setTotalCommission] = useState(0); // 总佣金
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total: number) => `共 ${total} 条记录`,
    });

    const [form] = Form.useForm();
    const [filters, setFilters] = useState<CustomerFilterParams>({
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
    });

    // 模态框状态
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [addViewingModalVisible, setAddViewingModalVisible] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

    // 加载客户数据
    const loadCustomers = async (params?: Partial<CustomerFilterParams>) => {
        setLoading(true);
        try {
            const searchParams = new URLSearchParams();
            const finalParams = { ...filters, ...params };

            Object.entries(finalParams).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    searchParams.append(key, String(value));
                }
            });

            const response = await fetch(`/api/customers?${searchParams.toString()}`);
            const result: ApiResponse<PaginatedResponse<Customer>> = await response.json();

            if (result.success && result.data) {
                setCustomers(result.data.data);
                setTotalCommission(result.data.totalCommission || 0); // 设置总佣金
                setPagination(prev => ({
                    ...prev,
                    current: result.data!.page,
                    total: result.data!.total,
                    pageSize: result.data!.pageSize,
                }));
            } else {
                message.error(result.error || '获取客户列表失败');
            }
        } catch (error) {
            console.error('加载客户数据失败:', error);
            message.error('网络请求失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCustomers();
    }, []);

    // 搜索处理
    const handleSearch = (values: any) => {
        const newFilters = {
            ...filters,
            ...values,
            page: 1, // 重置到第一页
        };
        setFilters(newFilters);
        loadCustomers(newFilters);
    };

    // 重置搜索
    const handleReset = () => {
        form.resetFields();
        const newFilters = {
            page: 1,
            pageSize: DEFAULT_PAGE_SIZE,
        };
        setFilters(newFilters);
        loadCustomers(newFilters);
    };

    // 分页处理
    const handleTableChange = (page: number, pageSize: number) => {
        const newFilters = {
            ...filters,
            page,
            pageSize,
        };
        setFilters(newFilters);
        loadCustomers(newFilters);
    };

    // 查看客户详情
    const handleViewCustomer = (customer: Customer) => {
        setCurrentCustomer(customer);
        setDetailModalVisible(true);
    };

    // 新增客户
    const handleAddCustomer = () => {
        setAddModalVisible(true);
    };

    // 新增客户成功回调
    const handleAddSuccess = () => {
        // 重新加载客户列表
        loadCustomers(filters);
    };

    // 编辑客户
    const handleEditCustomer = (customer: Customer) => {
        setCurrentCustomer(customer);
        setEditModalVisible(true);
    };

    // 编辑客户成功回调
    const handleEditSuccess = () => {
        // 重新加载客户列表
        loadCustomers(filters);
    };

    // 添加带看记录
    const handleAddViewing = (customer: Customer) => {
        setCurrentCustomer(customer);
        setAddViewingModalVisible(true);
    };

    // 添加带看记录成功回调
    const handleAddViewingSuccess = () => {
        // 重新加载客户列表以更新带看次数和佣金
        loadCustomers(filters);
    };

    // 查看带看记录详情 - 打开客户详情并切换到带看记录标签页
    const handleViewingDetails = (customer: Customer) => {
        setCurrentCustomer(customer);
        setDetailModalVisible(true);
    };

    // 表格列定义
    const columns: ColumnsType<Customer> = [
        {
            title: '租客',
            key: 'customer',
            width: 130,
            render: (_, record) => (
                <div className="customer-info">
                    <div className="customer-name">{record.name}</div>
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
                <Button type="link" size="small" onClick={() => handleViewingDetails(record)}>
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
            title: '录入',
            key: 'entry_info',
            width: 120,
            render: (_, record) => (
                <span className="entry-info">
                    {record.is_agent ? '[人工]' : '[agent]'} {record.creator}
                </span>
            ),
        },
        {
            title: '操作',
            key: 'actions',
            width: 160,
            fixed: 'right',
            render: (_, record) => (
                <div className="action-buttons compact">
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => handleViewCustomer(record)}
                        className="action-button primary"
                    >
                        查看
                    </Button>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleEditCustomer(record)}
                        className="action-button primary"
                    >
                        编辑
                    </Button>
                    <Button
                        type="text"
                        icon={<CalendarOutlined />}
                        size="small"
                        onClick={() => handleAddViewing(record)}
                        className="action-button success"
                    >
                        添加带看
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <MainLayout>
            <div className="content-spacing">
                {/* 统计卡片 */}
                <div className="stats-panel">
                    <Row gutter={[24, 24]}>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="stats-card hover-card">
                                <Statistic
                                    title="总客户数"
                                    value={pagination.total}
                                    valueStyle={{ color: '#3b82f6' }}
                                    prefix={<div className="w-2 h-2 bg-blue-500 rounded-full inline-block mr-2"></div>}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="stats-card hover-card">
                                <Statistic
                                    title="跟进中"
                                    value={customers.filter(c => c.status === 1).length}
                                    valueStyle={{ color: '#10b981' }}
                                    prefix={<div className="w-2 h-2 bg-green-500 rounded-full inline-block mr-2"></div>}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="stats-card hover-card">
                                <Statistic
                                    title="已成交"
                                    value={customers.filter(c => c.status === 4 || c.status === 5).length}
                                    valueStyle={{ color: '#8b5cf6' }}
                                    prefix={<div className="w-2 h-2 bg-purple-500 rounded-full inline-block mr-2"></div>}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="stats-card hover-card">
                                <Statistic
                                    title="总佣金"
                                    value={totalCommission}
                                    precision={2}
                                    suffix="元"
                                    valueStyle={{ color: '#f59e0b' }}
                                    prefix={<div className="w-2 h-2 bg-amber-500 rounded-full inline-block mr-2"></div>}
                                />
                            </Card>
                        </Col>
                    </Row>
                </div>

                {/* 页面标题 */}
                <div className="page-header-compact">
                    <div className="flex justify-between items-center">
                        <h1 className="page-title-compact">客户管理</h1>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="large"
                            onClick={handleAddCustomer}
                            className="shadow-md hover:shadow-lg transition-shadow"
                        >
                            新增客户
                        </Button>
                    </div>
                </div>

                {/* 筛选面板 */}
                <Card className="filter-panel">
                    <Form
                        form={form}
                        onFinish={handleSearch}
                        initialValues={filters}
                        className="filter-form"
                    >
                        <div className="filter-row">
                            <Form.Item name="name" label="客户姓名" className="flex-1 min-w-32">
                                <Input placeholder="客户姓名" allowClear />
                            </Form.Item>
                            <Form.Item name="phone" label="手机号" className="flex-1 min-w-32">
                                <Input placeholder="手机号" allowClear />
                            </Form.Item>
                            <Form.Item name="status" label="状态" className="min-w-28">
                                <Select placeholder="状态" allowClear>
                                    {Object.entries(CUSTOMER_STATUS_TEXT).map(([value, label]) => (
                                        <Option key={value} value={parseInt(value)}>
                                            {label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <Form.Item name="business_type" label="业务类型" className="min-w-28">
                                <Select placeholder="类型" allowClear>
                                    {Object.entries(BUSINESS_TYPE_TEXT).map(([value, label]) => (
                                        <Option key={value} value={value}>
                                            {label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <Form.Item name="community" label="小区" className="flex-1 min-w-32">
                                <Input placeholder="小区名称" allowClear />
                            </Form.Item>
                            <Form.Item className="ml-auto">
                                <Space size="small">
                                    <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                                        搜索
                                    </Button>
                                    <Button onClick={handleReset}>
                                        重置
                                    </Button>
                                </Space>
                            </Form.Item>
                        </div>
                    </Form>
                </Card>

                {/* 客户列表 */}
                <Card className="table-container">
                    <Table
                        columns={columns}
                        dataSource={customers}
                        rowKey="id"
                        loading={loading}
                        pagination={false}
                        size="middle"
                        className="custom-scrollbar"
                    />

                    <div className="pagination-container">
                        <div className="pagination-info">
                            显示第 {(pagination.current - 1) * pagination.pageSize + 1} - {Math.min(pagination.current * pagination.pageSize, pagination.total)} 条，共 {pagination.total} 条记录
                        </div>
                        <Pagination
                            current={pagination.current}
                            pageSize={pagination.pageSize}
                            total={pagination.total}
                            showSizeChanger
                            showQuickJumper
                            onChange={handleTableChange}
                            onShowSizeChange={handleTableChange}
                        />
                    </div>
                </Card>

                {/* 客户详情模态框 */}
                <CustomerDetailModal
                    visible={detailModalVisible}
                    customer={currentCustomer}
                    activeTab="viewing"
                    onCancel={() => {
                        setDetailModalVisible(false);
                        setCurrentCustomer(null);
                    }}
                    onEdit={() => {
                        if (currentCustomer) {
                            handleEditCustomer(currentCustomer);
                        }
                    }}
                />

                {/* 添加带看记录模态框 */}
                <AddViewingModal
                    visible={addViewingModalVisible}
                    customer={currentCustomer}
                    onCancel={() => {
                        setAddViewingModalVisible(false);
                        setCurrentCustomer(null);
                    }}
                    onSuccess={handleAddViewingSuccess}
                />

                {/* 新增客户模态框 */}
                <AddCustomerModal
                    visible={addModalVisible}
                    onCancel={() => setAddModalVisible(false)}
                    onSuccess={handleAddSuccess}
                />

                {/* 编辑客户模态框 */}
                <EditCustomerModal
                    visible={editModalVisible}
                    customer={currentCustomer}
                    onCancel={() => {
                        setEditModalVisible(false);
                        setCurrentCustomer(null);
                    }}
                    onSuccess={handleEditSuccess}
                />
            </div>
        </MainLayout>
    );
}