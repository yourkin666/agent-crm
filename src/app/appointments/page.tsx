'use client';

import React, { useState, useEffect } from 'react';
import {
    Table, Button, Space, Tag, Input, Select, Form, Row, Col,
    Card, Statistic, message, Pagination, DatePicker, Modal
} from 'antd';
import {
    PlusOutlined, SearchOutlined, EyeOutlined,
    EditOutlined, CheckOutlined, CloseOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dynamic from 'next/dynamic';
import MainLayout from '@/components/layout/MainLayout';
import { Appointment, AppointmentFilterParams, ApiResponse, PaginatedResponse } from '@/types';
import {
    APPOINTMENT_STATUS_TEXT, APPOINTMENT_STATUS_COLOR, BUSINESS_TYPE_TEXT,
    DEFAULT_PAGE_SIZE
} from '@/utils/constants';
import { formatDateTime, formatDate } from '@/utils/helpers';

// 动态导入 Modal 组件以减少初始加载时间
const AddAppointmentModal = dynamic(() => import('@/components/appointments/AddAppointmentModal'), {
    ssr: false,
    loading: () => <div>加载中...</div>
});

const EditAppointmentModal = dynamic(() => import('@/components/appointments/EditAppointmentModal'), {
    ssr: false,
    loading: () => <div>加载中...</div>
});

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total: number) => `共 ${total} 条记录`,
    });

    const [form] = Form.useForm();
    const [filters, setFilters] = useState<AppointmentFilterParams>({
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
    });

    // 新增预约模态框状态
    const [addModalVisible, setAddModalVisible] = useState(false);

    // 编辑预约模态框状态
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);

    // 加载预约数据
    const loadAppointments = async (params?: Partial<AppointmentFilterParams>) => {
        setLoading(true);
        try {
            const searchParams = new URLSearchParams();
            const finalParams = { ...filters, ...params };

            Object.entries(finalParams).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    searchParams.append(key, String(value));
                }
            });

            const response = await fetch(`/api/appointments?${searchParams.toString()}`);
            const result: ApiResponse<PaginatedResponse<Appointment>> = await response.json();

            if (result.success && result.data) {
                setAppointments(result.data.data);
                setPagination(prev => ({
                    ...prev,
                    current: result.data!.page,
                    total: result.data!.total,
                    pageSize: result.data!.pageSize,
                }));
            } else {
                message.error(result.error || '获取预约列表失败');
            }
        } catch (error) {
            console.error('加载预约数据失败:', error);
            message.error('网络请求失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAppointments();
    }, []);

    // 搜索处理
    const handleSearch = (values: any) => {
        const newFilters = {
            ...filters,
            ...values,
            page: 1, // 重置到第一页
        };
        setFilters(newFilters);
        loadAppointments(newFilters);
    };

    // 重置搜索
    const handleReset = () => {
        form.resetFields();
        const newFilters = {
            page: 1,
            pageSize: DEFAULT_PAGE_SIZE,
        };
        setFilters(newFilters);
        loadAppointments(newFilters);
    };

    // 分页处理
    const handleTableChange = (page: number, pageSize: number) => {
        const newFilters = {
            ...filters,
            page,
            pageSize,
        };
        setFilters(newFilters);
        loadAppointments(newFilters);
    };

    // 查看预约详情
    const handleViewAppointment = (appointment: Appointment) => {
        Modal.info({
            title: `预约详情 - ${appointment.property_name}`,
            width: 800,
            content: (
                <div className="space-y-4 mt-4">
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <div><strong>预约ID：</strong>{appointment.id}</div>
                        </Col>
                        <Col span={12}>
                            <div><strong>物业名称：</strong>{appointment.property_name}</div>
                        </Col>
                        <Col span={12}>
                            <div><strong>房间地址：</strong>{appointment.property_address}</div>
                        </Col>
                        <Col span={12}>
                            <div><strong>客户姓名：</strong>{appointment.customer_name}</div>
                        </Col>
                        <Col span={12}>
                            <div><strong>客户电话：</strong>{appointment.customer_phone}</div>
                        </Col>
                        <Col span={12}>
                            <div><strong>经纪人：</strong>{appointment.agent_name}</div>
                        </Col>
                        <Col span={12}>
                            <div><strong>预约时间：</strong>{formatDateTime(appointment.appointment_time)}</div>
                        </Col>
                        <Col span={12}>
                            <div><strong>状态：</strong>
                                <Tag color={APPOINTMENT_STATUS_COLOR[appointment.status]}>
                                    {APPOINTMENT_STATUS_TEXT[appointment.status]}
                                </Tag>
                            </div>
                        </Col>
                        <Col span={12}>
                            <div><strong>类型：</strong>{BUSINESS_TYPE_TEXT[appointment.type]}</div>
                        </Col>
                        <Col span={12}>
                            <div><strong>创建时间：</strong>{formatDateTime(appointment.created_at)}</div>
                        </Col>
                        <Col span={12}>
                            <div><strong>更新时间：</strong>{formatDateTime(appointment.updated_at)}</div>
                        </Col>
                    </Row>
                </div>
            ),
        });
    };

    // 新增预约
    const handleAddAppointment = () => {
        setAddModalVisible(true);
    };

    // 新增预约成功回调
    const handleAddSuccess = () => {
        // 重新加载预约列表
        loadAppointments(filters);
    };

    // 编辑预约
    const handleEditAppointment = (appointment: Appointment) => {
        setCurrentAppointment(appointment);
        setEditModalVisible(true);
    };

    // 编辑预约成功回调
    const handleEditSuccess = () => {
        // 重新加载预约列表
        loadAppointments(filters);
    };

    // 完成预约
    const handleCompleteAppointment = async (appointment: Appointment) => {
        Modal.confirm({
            title: '确认完成预约？',
            content: `确定要完成预约 "${appointment.property_name}" 吗？完成后将自动转化为带看记录。`,
            okText: '确认',
            cancelText: '取消',
            onOk: async () => {
                try {
                    const response = await fetch(`/api/appointments/${appointment.id}/complete`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    const result = await response.json();
                    if (result.success) {
                        message.success('预约已完成，并自动转化为带看记录');
                        // 重新加载数据
                        loadAppointments(filters);
                    } else {
                        message.error(result.error || '完成预约失败');
                    }
                } catch (error) {
                    console.error('完成预约失败:', error);
                    message.error('网络请求失败');
                }
            }
        });
    };

    // 取消预约
    const handleCancelAppointment = async (appointment: Appointment) => {
        Modal.confirm({
            title: '确认取消预约？',
            content: `确定要取消预约 "${appointment.property_name}" 吗？`,
            okText: '确认',
            cancelText: '取消',
            onOk: async () => {
                try {
                    const response = await fetch(`/api/appointments/${appointment.id}/cancel`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    const result = await response.json();
                    if (result.success) {
                        message.success('预约已取消');
                        // 重新加载数据
                        loadAppointments(filters);
                    } else {
                        message.error(result.error || '取消预约失败');
                    }
                } catch (error) {
                    console.error('取消预约失败:', error);
                    message.error('网络请求失败');
                }
            }
        });
    };

    // 表格列定义
    const columns: ColumnsType<Appointment> = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: '物业名称',
            dataIndex: 'property_name',
            key: 'property_name',
            width: 150,
        },
        {
            title: '房间地址',
            dataIndex: 'property_address',
            key: 'property_address',
            width: 200,
            ellipsis: true,
        },
        {
            title: '客户姓名',
            dataIndex: 'customer_name',
            key: 'customer_name',
            width: 120,
        },
        {
            title: '客户电话',
            dataIndex: 'customer_phone',
            key: 'customer_phone',
            width: 130,
        },
        {
            title: '经纪人',
            dataIndex: 'agent_name',
            key: 'agent_name',
            width: 120,
        },
        {
            title: '预约时间',
            dataIndex: 'appointment_time',
            key: 'appointment_time',
            width: 160,
            render: (time: string) => formatDateTime(time),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: number) => (
                <Tag color={APPOINTMENT_STATUS_COLOR[status as keyof typeof APPOINTMENT_STATUS_COLOR]}>
                    {APPOINTMENT_STATUS_TEXT[status as keyof typeof APPOINTMENT_STATUS_TEXT]}
                </Tag>
            ),
        },
        {
            title: '类型',
            dataIndex: 'type',
            key: 'type',
            width: 100,
            render: (type: string) => BUSINESS_TYPE_TEXT[type as keyof typeof BUSINESS_TYPE_TEXT],
        },
        {
            title: '创建时间',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 140,
            render: (time: string) => formatDate(time),
        },
        {
            title: '操作',
            key: 'actions',
            width: 120,
            fixed: 'right',
            render: (_, record) => (
                <div className="action-buttons">
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => handleViewAppointment(record)}
                        className="action-button primary"
                    >
                        查看
                    </Button>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleEditAppointment(record)}
                        className="action-button primary"
                    >
                        编辑
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
                                    title="总预约数"
                                    value={pagination.total}
                                    valueStyle={{ color: '#3b82f6' }}
                                    prefix={<div className="w-2 h-2 bg-blue-500 rounded-full inline-block mr-2"></div>}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="stats-card hover-card">
                                <Statistic
                                    title="待确认"
                                    value={appointments.filter(a => a.status === 1).length}
                                    valueStyle={{ color: '#f59e0b' }}
                                    prefix={<div className="w-2 h-2 bg-amber-500 rounded-full inline-block mr-2"></div>}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="stats-card hover-card">
                                <Statistic
                                    title="已完成"
                                    value={appointments.filter(a => a.status === 4).length}
                                    valueStyle={{ color: '#10b981' }}
                                    prefix={<div className="w-2 h-2 bg-green-500 rounded-full inline-block mr-2"></div>}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="stats-card hover-card">
                                <Statistic
                                    title="已确认"
                                    value={appointments.filter(a => a.status === 2).length}
                                    valueStyle={{ color: '#8b5cf6' }}
                                    prefix={<div className="w-2 h-2 bg-purple-500 rounded-full inline-block mr-2"></div>}
                                />
                            </Card>
                        </Col>
                    </Row>
                </div>

                {/* 页面标题 */}
                <div className="page-header">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="page-title">预约带看</h1>
                            <p className="page-description">管理所有预约带看安排</p>
                        </div>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="large"
                            onClick={handleAddAppointment}
                            className="shadow-md hover:shadow-lg transition-shadow"
                        >
                            新增预约
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
                            <Form.Item name="customer_name" label="客户姓名" className="flex-1 min-w-32">
                                <Input placeholder="客户姓名" allowClear />
                            </Form.Item>
                            <Form.Item name="customer_phone" label="客户电话" className="flex-1 min-w-32">
                                <Input placeholder="客户电话" allowClear />
                            </Form.Item>
                            <Form.Item name="agent_name" label="经纪人" className="flex-1 min-w-32">
                                <Input placeholder="经纪人" allowClear />
                            </Form.Item>
                            <Form.Item name="status" label="状态" className="min-w-28">
                                <Select placeholder="状态" allowClear>
                                    {Object.entries(APPOINTMENT_STATUS_TEXT).map(([value, label]) => (
                                        <Option key={value} value={parseInt(value)}>
                                            {label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <Form.Item name="type" label="业务类型" className="min-w-28">
                                <Select placeholder="类型" allowClear>
                                    {Object.entries(BUSINESS_TYPE_TEXT).map(([value, label]) => (
                                        <Option key={value} value={value}>
                                            {label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <Form.Item name="city" label="城市" className="flex-1 min-w-32">
                                <Input placeholder="城市" allowClear />
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

                {/* 预约列表 */}
                <Card className="table-container">
                    <Table
                        columns={columns}
                        dataSource={appointments}
                        rowKey="id"
                        loading={loading}
                        pagination={false}
                        scroll={{ x: 1600 }}
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

                {/* 新增预约模态框 */}
                <AddAppointmentModal
                    visible={addModalVisible}
                    onCancel={() => setAddModalVisible(false)}
                    onSuccess={handleAddSuccess}
                />

                {/* 编辑预约模态框 */}
                <EditAppointmentModal
                    visible={editModalVisible}
                    appointment={currentAppointment}
                    onCancel={() => {
                        setEditModalVisible(false);
                        setCurrentAppointment(null);
                    }}
                    onSuccess={handleEditSuccess}
                />
            </div>
        </MainLayout>
    );
} 