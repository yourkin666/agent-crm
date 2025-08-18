'use client';

import { useState, useCallback, useRef } from 'react';
import { Customer, CustomerFilterParams, ApiResponse, PaginatedResponse } from '@/types';
import { DEFAULT_PAGE_SIZE } from '@/utils/constants';

interface UseCustomerDataReturn {
    customers: Customer[];
    stats: {
        total: number;
        following: number;
        completed: number;
        totalCommission: number;
    };
    pagination: {
        current: number;
        pageSize: number;
        total: number;
        showSizeChanger: boolean;
        showQuickJumper: boolean;
        showTotal: (total: number) => string;
    };
    loading: boolean;
    statsLoading: boolean;
    loadCustomers: (params?: Partial<CustomerFilterParams>) => Promise<void>;
    loadStats: (params?: Partial<CustomerFilterParams>) => Promise<void>;
    updatePagination: (page: number, pageSize: number) => void;
}

export function useCustomerData(): UseCustomerDataReturn {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        following: 0,
        completed: 0,
        totalCommission: 0
    });
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total: number) => `共 ${total} 条记录`,
    });

    // 缓存机制
    const cacheRef = useRef<Map<string, { data: unknown; timestamp: number }>>(new Map());


    const getCacheKey = (url: string) => {
        return `customer_data_${url}`;
    };



    const setCachedData = (key: string, data: unknown) => {
        cacheRef.current.set(key, { data, timestamp: Date.now() });
    };

    const loadCustomers = useCallback(async (params?: Partial<CustomerFilterParams>) => {
        const getCachedData = (key: string) => {
            const cached = cacheRef.current.get(key);
            if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
                return cached.data;
            }
            return null;
        };
        setLoading(true);
        try {
            const searchParams = new URLSearchParams();
            const finalParams = { ...params };

            Object.entries(finalParams).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    if (Array.isArray(value)) {
                        searchParams.append(key, JSON.stringify(value));
                    } else {
                        searchParams.append(key, String(value));
                    }
                }
            });

            const url = `/api/customers?${searchParams.toString()}`;
            const cacheKey = getCacheKey(url);
            
            // 检查缓存
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cachedData = getCachedData(cacheKey) as any;
            if (cachedData) {
                setCustomers(cachedData.data);
                setPagination(prev => ({
                    ...prev,
                    current: cachedData.page,
                    total: cachedData.total,
                    pageSize: cachedData.pageSize,
                }));
                setLoading(false);
                return;
            }

            const response = await fetch(url);
            const result: ApiResponse<PaginatedResponse<Customer>> = await response.json();

            if (result.success && result.data) {
                setCustomers(result.data.data);
                setPagination(prev => ({
                    ...prev,
                    current: result.data!.page,
                    total: result.data!.total,
                    pageSize: result.data!.pageSize,
                }));

                // 缓存数据
                setCachedData(cacheKey, {
                    data: result.data.data,
                    page: result.data.page,
                    total: result.data.total,
                    pageSize: result.data.pageSize,
                });
            }
        } catch (error) {
            console.error('加载客户数据失败:', error);
            // 如果是网络错误，不显示错误消息，避免在开发环境产生大量错误
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                console.warn('网络连接失败，请检查开发服务器是否运行');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const loadStats = useCallback(async (params?: Partial<CustomerFilterParams>) => {
        const getCachedData = (key: string) => {
            const cached = cacheRef.current.get(key);
            if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
                return cached.data;
            }
            return null;
        };
        setStatsLoading(true);
        try {
            const searchParams = new URLSearchParams();
            const finalParams = { ...params };

            Object.entries(finalParams).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    if (Array.isArray(value)) {
                        searchParams.append(key, JSON.stringify(value));
                    } else {
                        searchParams.append(key, String(value));
                    }
                }
            });

            const url = `/api/customers/stats?${searchParams.toString()}`;
            const cacheKey = getCacheKey(url);
            
            // 检查缓存
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cachedData = getCachedData(cacheKey) as any;
            if (cachedData) {
                setStats(cachedData);
                setStatsLoading(false);
                return;
            }

            const response = await fetch(url);
            const result: ApiResponse<typeof stats> = await response.json();

            if (result.success && result.data) {
                setStats(result.data);
                setCachedData(cacheKey, result.data);
            }
        } catch (error) {
            console.error('加载统计数据失败:', error);
            // 如果是网络错误，不显示错误消息，避免在开发环境产生大量错误
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                console.warn('网络连接失败，请检查开发服务器是否运行');
            }
        } finally {
            setStatsLoading(false);
        }
    }, []);

    const updatePagination = useCallback((page: number, pageSize: number) => {
        setPagination(prev => ({
            ...prev,
            current: page,
            pageSize,
        }));
    }, []);

    return {
        customers,
        stats,
        pagination,
        loading,
        statsLoading,
        loadCustomers,
        loadStats,
        updatePagination,
    };
} 