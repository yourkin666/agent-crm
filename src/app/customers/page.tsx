'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Button, Card, Pagination, App, Modal, Form } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import MainLayout from '@/components/layout/MainLayout';
import { Customer, CustomerFilterParams } from '@/types';
import { DEFAULT_PAGE_SIZE } from '@/utils/constants';
import { useCustomerData } from '@/hooks/useCustomerData';

// 懒加载组件
const CustomerDetailModal = dynamic(() => import('@/components/customers/CustomerDetailModal'), {
    loading: () => <div>加载中...</div>,
    ssr: false
});

const AddViewingModal = dynamic(() => import('@/components/customers/AddViewingModal'), {
    loading: () => <div>加载中...</div>,
    ssr: false
});

const AddCustomerModal = dynamic(() => import('@/components/customers/AddCustomerModal'), {
    loading: () => <div>加载中...</div>,
    ssr: false
});

const EditCustomerModal = dynamic(() => import('@/components/customers/EditCustomerModal'), {
    loading: () => <div>加载中...</div>,
    ssr: false
});

const AdvancedFilterModal = dynamic(() => import('@/components/customers/AdvancedFilterModal'), {
    loading: () => <div>加载中...</div>,
    ssr: false
});

const StatsCards = dynamic(() => import('@/components/customers/StatsCards'), {
    loading: () => <div>统计卡片加载中...</div>
});

const FilterPanel = dynamic(() => import('@/components/customers/FilterPanel'), {
    loading: () => <div>筛选面板加载中...</div>
});

const CustomerTable = dynamic(() => import('@/components/customers/CustomerTable'), {
    loading: () => <div>表格加载中...</div>
});





export default function CustomersPage() {
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const [filters, setFilters] = useState<CustomerFilterParams>({
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
    });

    // 使用自定义 Hook 管理数据
    const {
        customers,
        stats,
        pagination,
        loading,
        statsLoading,
        loadCustomers,
        loadStats,
        updatePagination,
        clearCache
    } = useCustomerData();

    // 模态框状态
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [addViewingModalVisible, setAddViewingModalVisible] = useState(false);
    const [advancedFilterModalVisible, setAdvancedFilterModalVisible] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

    // 处理数据加载
    const handleLoadData = useCallback(async (params?: Partial<CustomerFilterParams>) => {
        const finalParams = { ...filters, ...params };
        await Promise.all([
            loadCustomers(finalParams),
            loadStats(finalParams)
        ]);
    }, [filters, loadCustomers, loadStats]);

    // 处理高级筛选
    const handleAdvancedFilter = (advancedFilters: Partial<CustomerFilterParams>) => {
        const newFilters = {
            ...filters,
            ...advancedFilters,
            page: 1,
        };
        setFilters(newFilters as unknown as CustomerFilterParams);
        clearCache();
        handleLoadData(newFilters);
    };

    // 显示高级筛选模态框
    const showAdvancedFilter = () => {
        setAdvancedFilterModalVisible(true);
    };

    // 移除单个筛选条件
    const removeFilter = (filterKey: string, value?: unknown) => {
        const newFilters = { ...filters };
        
        if (value !== undefined && Array.isArray(newFilters[filterKey as keyof CustomerFilterParams])) {
            const currentArray = newFilters[filterKey as keyof CustomerFilterParams] as unknown[];
            const newArray = currentArray.filter(item => item !== value);
            if (newArray.length === 0) {
                delete newFilters[filterKey as keyof CustomerFilterParams];
            } else {
                (newFilters as Record<string, unknown>)[filterKey] = newArray;
            }
        } else {
            delete newFilters[filterKey as keyof CustomerFilterParams];
        }
        
        newFilters.page = 1;
        setFilters(newFilters as CustomerFilterParams);
        clearCache();
        handleLoadData(newFilters);
    };

    useEffect(() => {
        handleLoadData();
    }, [handleLoadData]);

    // 搜索处理
    const handleSearch = (values: Record<string, unknown>) => {
        const searchText = (values.searchText as string)?.trim();
        
        const newFilters: Record<string, unknown> = {
            ...filters,
            page: 1,
        };

        delete newFilters.name;
        delete newFilters.phone;

        if (searchText) {
            newFilters.name = searchText;
        }

        setFilters(newFilters as unknown as CustomerFilterParams);
        clearCache();
        handleLoadData(newFilters);
    };

    // 重置搜索
    const handleReset = () => {
        form.resetFields();
        const newFilters = {
            page: 1,
            pageSize: DEFAULT_PAGE_SIZE,
        };
        setFilters(newFilters as unknown as CustomerFilterParams);
        clearCache();
        handleLoadData(newFilters);
    };

    // 刷新数据
    const handleRefresh = async () => {
        console.log('🔄 开始刷新数据...', { filters });
        try {
            // 清除缓存并重新加载数据
            clearCache();
            const timestamp = Date.now();
            const paramsWithTimestamp = {
                ...filters,
                _t: timestamp // 添加时间戳参数来避免缓存
            };
            
            console.log('📡 发送刷新请求...', { paramsWithTimestamp });
            
            await Promise.all([
                loadCustomers(paramsWithTimestamp),
                loadStats(paramsWithTimestamp)
            ]);
            
            console.log('✅ 数据刷新完成');
            message.success('数据刷新成功');
        } catch (error) {
            console.error('❌ 刷新失败:', error);
            message.error('刷新失败，请重试');
        }
    };

    // 分页处理
    const handleTableChange = (page: number, pageSize: number) => {
        const newFilters = {
            ...filters,
            page,
            pageSize,
        };
        setFilters(newFilters as unknown as CustomerFilterParams);
        updatePagination(page, pageSize);
        clearCache();
        handleLoadData(newFilters);
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
        clearCache();
        handleLoadData(filters);
    };

    // 编辑客户
    const handleEditCustomer = (customer: Customer) => {
        setCurrentCustomer(customer);
        setEditModalVisible(true);
    };

    // 编辑客户成功回调
    const handleEditSuccess = () => {
        clearCache();
        handleLoadData(filters);
    };

    // 添加带看记录
    const handleAddViewing = (customer: Customer) => {
        setCurrentCustomer(customer);
        setAddViewingModalVisible(true);
    };

    // 添加带看记录成功回调
    const handleAddViewingSuccess = () => {
        clearCache();
        handleLoadData(filters);
    };

    // 查看带看记录详情 - 打开客户详情并切换到带看记录标签页
    const handleViewingDetails = (customer: Customer) => {
        setCurrentCustomer(customer);
        setDetailModalVisible(true);
    };

    // 删除客户
    const handleDeleteCustomer = async (customer: Customer) => {
        const { confirm } = Modal;
        confirm({
            title: '确认删除',
            content: `确定要删除客户"${customer.name}"吗？此操作不可恢复，将同时删除该客户的所有带看记录。`,
            okText: '确认删除',
            okType: 'danger',
            cancelText: '取消',
            onOk: async () => {
                try {
                    const response = await fetch(`/api/customers/${customer.id}`, {
                        method: 'DELETE',
                    });
                    const result = await response.json();

                    if (result.success) {
                        message.success('客户及相关带看记录删除成功');
                        // 清除缓存，确保获取最新数据
                        clearCache();
                        // 重新加载数据
                        handleLoadData(filters);
                    } else {
                        message.error(result.error || '删除客户失败');
                    }
                } catch (error) {
                    console.error('删除客户失败:', error);
                    message.error('网络请求失败');
                }
            },
        });
    };



    return (
        <MainLayout>
            <div className="space-y-3">
                {/* 统计卡片 */}
                <Suspense fallback={<div>统计卡片加载中...</div>}>
                    <StatsCards stats={stats} loading={statsLoading} />
                </Suspense>

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
                <Suspense fallback={<div>筛选面板加载中...</div>}>
                    <FilterPanel
                        form={form}
                        filters={filters}
                        onSearch={handleSearch}
                        onReset={handleReset}
                        onRefresh={handleRefresh}
                        onShowAdvancedFilter={showAdvancedFilter}
                        onRemoveFilter={removeFilter}
                    />
                </Suspense>

                {/* 客户列表 */}
                <Card className="table-container">
                    <Suspense fallback={<div>表格加载中...</div>}>
                        <CustomerTable
                            customers={customers}
                            loading={loading}
                            onViewCustomer={handleViewCustomer}
                            onEditCustomer={handleEditCustomer}
                            onAddViewing={handleAddViewing}
                            onDeleteCustomer={handleDeleteCustomer}
                            onViewingDetails={handleViewingDetails}
                        />
                    </Suspense>

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

                {/* 高级筛选模态框 */}
                <AdvancedFilterModal
                    visible={advancedFilterModalVisible}
                    onCancel={() => setAdvancedFilterModalVisible(false)}
                    onConfirm={handleAdvancedFilter}
                    initialFilters={filters}
                />
            </div>
        </MainLayout>
    );
}