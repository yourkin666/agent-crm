'use client';

import React, { useState, useCallback, useRef } from 'react';
import { AutoComplete, Spin } from 'antd';

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

  // 根据关键词搜索物业地址
  const fetchPropertyAddresses = async (keyword: string) => {
    if (!keyword.trim()) {
      setOptions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/housing/property-addresses?keyword=${encodeURIComponent(keyword)}&limit=20`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        
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

        const propertyOptions: CommunityOption[] = propertyList.map((item: any) => ({
          // 接口返回的字段是 propertyAddrId 和 propertyAddr
          value: item.propertyAddr,
          label: item.propertyAddr,
          propertyAddrId: item.propertyAddrId,
        }));

        console.log('物业地址搜索成功:', propertyOptions.length, '条记录');
        setOptions(propertyOptions);
      } else {
        console.error('获取物业地址失败:', response.statusText);
        setOptions([]);
      }
    } catch (error) {
      console.error('物业地址搜索接口调用失败:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // 使用防抖优化接口调用
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback((searchText: string) => {
    console.log('触发搜索，关键字:', searchText);
    // 清除之前的定时器
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // 设置新的定时器
    debounceTimer.current = setTimeout(() => {
      fetchPropertyAddresses(searchText);
    }, 300);
  }, []);

  const handleSelect = (selectedValue: string) => {
    console.log('AutoComplete 选择值:', selectedValue);
    // 查找选中的完整选项数据
    const selectedOption = options.find(option => option.value === selectedValue);
    onChange?.(selectedValue, selectedOption);
  };

  const handleChange = (currentValue: string) => {
    console.log('AutoComplete 输入变化:', currentValue);
    // 手动输入时不传递选项数据
    onChange?.(currentValue);
    // 如果用户手动输入，也触发搜索
    if (currentValue && currentValue !== value) {
      handleSearch(currentValue);
    }
  };

  return (
    <AutoComplete
      value={value}
      options={options}
      onSearch={handleSearch}
      onSelect={handleSelect}
      onChange={handleChange}
      placeholder={placeholder}
      style={style}
      notFoundContent={loading ? <Spin size="small" /> : '暂无数据'}
      allowClear
      filterOption={false}  // 禁用默认过滤，使用我们自己的搜索逻辑
    />
  );
} 