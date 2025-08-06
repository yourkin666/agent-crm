'use client';

import React, { useState, useCallback, useRef } from 'react';
import { AutoComplete, Spin } from 'antd';

interface CommunityOption {
  value: string;
  label: string;
  id: number; // 添加ID字段
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
  const [allCommunities, setAllCommunities] = useState<CommunityOption[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取所有小区数据
  const fetchAllCommunities = async () => {
    try {
      const response = await fetch('/api/property', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        
        // 处理代理API返回的数据
        let communityList = [];
        if (result.success && result.data) {
          // 如果是外部接口成功返回的数据
          if (result.data.code === "200" && Array.isArray(result.data.data)) {
            communityList = result.data.data;
          }
          // 如果是模拟数据
          else if (result.isMockData && Array.isArray(result.data.data)) {
            communityList = result.data.data;
            console.log('使用模拟小区数据');
          }
        }

        const communityOptions: CommunityOption[] = communityList.map((item: any) => ({
          // 接口返回的字段是 id 和 addrName
          value: item.addrName,
          label: item.addrName,
          id: item.id, // 保存ID
        }));

        console.log('小区数据加载成功:', communityOptions.length, '条记录');
        setAllCommunities(communityOptions);
      } else {
        console.error('获取小区数据失败:', response.statusText);
      }
    } catch (error) {
      console.error('获取小区数据接口调用失败:', error);
    }
  };

  // 在组件加载时获取所有数据
  React.useEffect(() => {
    fetchAllCommunities();
  }, []);

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
      console.log('执行搜索，关键字:', searchText, '总数据量:', allCommunities.length);
      
      if (!searchText.trim()) {
        setOptions([]);
        return;
      }

      setLoading(true);
      
      // 在本地数据中搜索匹配的小区
      const filteredOptions = allCommunities.filter(community =>
        community.label.toLowerCase().includes(searchText.toLowerCase())
      );

      console.log('搜索结果:', filteredOptions.length, '条匹配记录');
      setOptions(filteredOptions.slice(0, 10)); // 限制显示最多10个结果
      setLoading(false);
    }, 300);
  }, [allCommunities]);

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