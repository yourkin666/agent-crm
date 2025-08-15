'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AutoComplete, Spin } from 'antd';

interface PropertyItem {
  propertyAddr: string;
  propertyAddrId: number;
}

interface CommunityOption {
  value: string;
  label: string;
  propertyAddrId: number; // 修改为propertyAddrId字段
}

interface CommunityAutoCompleteProps {
  value?: string;
  onChange?: (value: string, selectedOption?: CommunityOption) => void; // 修改onChange回调，添加选中的选项数据
  placeholder?: string;
  style?: React.CSSProperties;
}

export default function CommunityAutoComplete({
  value,
  onChange,
  placeholder = "请输入小区名称",
  style
}: CommunityAutoCompleteProps) {
  const [options, setOptions] = useState<CommunityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSearchKeyword, setLastSearchKeyword] = useState<string>('');
  
  // 添加请求控制器来避免竞态条件
  const abortControllerRef = useRef<AbortController | null>(null);

  // 根据关键词搜索物业地址（使用 useCallback 保持引用稳定）
  const fetchPropertyAddresses = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setOptions([]);
      setLastSearchKeyword('');
      return;
    }

    // 如果关键词与上次搜索相同，则不重复搜索
    if (keyword === lastSearchKeyword) {
      console.log('关键词未变化，跳过搜索:', keyword);
      return;
    }

    console.log('开始搜索:', keyword);
    
    // 取消之前未完成的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // 创建新的请求控制器
    abortControllerRef.current = new AbortController();
    const currentController = abortControllerRef.current;
    
    setLoading(true);
    setLastSearchKeyword(keyword);
    
    try {
      const response = await fetch(`/api/housing/property-addresses?keyword=${encodeURIComponent(keyword)}&limit=20`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: currentController.signal, // 添加取消信号
      });

      // 检查请求是否被取消
      if (currentController.signal.aborted) {
        console.log('搜索请求被取消:', keyword);
        return;
      }

      if (response.ok) {
        const result = await response.json();
        
        // 再次检查请求是否被取消（防止在请求完成后组件已卸载）
        if (currentController.signal.aborted) {
          console.log('搜索请求在处理结果时被取消:', keyword);
          return;
        }
        
        // 处理代理API返回的数据
        let propertyList = [];
        if (result.success && result.data) {
          // 如果是外部接口成功返回的数据
          if (result.data.code === 200 && Array.isArray(result.data.data)) {
            propertyList = result.data.data;
          }
          // 如果是模拟数据
          else if (result.isMockData && Array.isArray(result.data.data)) {
            propertyList = result.data.data;
            console.log('使用模拟物业地址数据');
          }
        }

        // 对数据进行去重处理，避免重复的地址名称导致key冲突
        const uniquePropertyMap = new Map<string, PropertyItem>();
        propertyList.forEach((item: PropertyItem) => {
          const addr = item.propertyAddr?.trim();
          if (addr && !uniquePropertyMap.has(addr)) {
            uniquePropertyMap.set(addr, item);
          }
        });

        const propertyOptions: CommunityOption[] = Array.from(uniquePropertyMap.values()).map((item: PropertyItem) => ({
          // 使用地址名称作为value和label，但现在已经去重了
          value: item.propertyAddr,
          label: item.propertyAddr,
          propertyAddrId: item.propertyAddrId,
        }));

        console.log('物业地址搜索成功:', propertyOptions.length, '条记录（去重后）');
        
        // 最终检查请求是否被取消
        if (!currentController.signal.aborted) {
          setOptions(propertyOptions);
        }
      } else {
        if (!currentController.signal.aborted) {
          console.error('获取物业地址失败:', response.statusText);
          setOptions([]);
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('搜索请求被主动取消:', keyword);
      } else {
        console.error('物业地址搜索接口调用失败:', error);
        if (!currentController.signal.aborted) {
          setOptions([]);
        }
      }
    } finally {
      if (!currentController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [lastSearchKeyword]);

  // 使用防抖优化接口调用
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // 简化的搜索逻辑
  const performSearch = useCallback((searchText: string) => {
    console.log('执行搜索:', searchText);
    
    // 清除之前的定时器
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // 设置新的定时器
    debounceTimer.current = setTimeout(() => {
      fetchPropertyAddresses(searchText);
    }, 300);
  }, [fetchPropertyAddresses]);

  const handleSelect = (selectedValue: string) => {
    console.log('选择了:', selectedValue);
    
    // 完全清除定时器
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    
    // 取消未完成的搜索请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // 查找选中的完整选项数据
    const selectedOption = options.find(option => option.value === selectedValue);
    onChange?.(selectedValue, selectedOption);
  };

  const handleChange = (currentValue: string) => {
    console.log('输入变化:', currentValue);
    onChange?.(currentValue);
    
    const trimmedValue = currentValue?.trim() || '';
    
    if (!trimmedValue) {
      // 清空时重置
      setOptions([]);
      setLastSearchKeyword('');
      // 清除定时器避免延迟搜索
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      // 取消未完成的搜索请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }
    // 注意：不在这里触发搜索，避免与onSearch冲突
    // 搜索逻辑完全由onSearch处理
  };

  // 清理定时器和未完成的请求
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <AutoComplete
      value={value}
      options={options}
      onSearch={performSearch}
      onSelect={handleSelect}
      onChange={handleChange}
      placeholder={placeholder}
      style={style}
      notFoundContent={loading ? <Spin size="small" /> : '暂无数据'}
      allowClear
      filterOption={false}  // 禁用默认过滤，使用我们自己的搜索逻辑
      dropdownStyle={{
        minWidth: '300px',
        maxWidth: '600px',
        width: 'auto'
      }}
      dropdownMatchSelectWidth={false}
    />
  );
} 