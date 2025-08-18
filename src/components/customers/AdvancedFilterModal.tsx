'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Select, Tag, Input } from 'antd';
import { CustomerFilterParams } from '@/types';
import { 
  CUSTOMER_STATUS_TEXT, 
  SOURCE_CHANNEL_TEXT,
  CITY_LIST
} from '@/utils/constants';

const { Option } = Select;

interface AdvancedFilterModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (filters: Partial<CustomerFilterParams>) => void;
  initialFilters?: Partial<CustomerFilterParams>;
}

// 快捷筛选选项
const QUICK_FILTERS = [
  { key: 'move_in_7days', label: '7日内入住', value: { move_in_days: 7 } },
  { key: 'viewing_today', label: '今日看房', value: { viewing_today: true } },
  { key: 'beijing', label: '北京', value: { city: ['北京'] } },
  { key: 'shenzhen', label: '深圳', value: { city: ['深圳'] } },
];

// 录入账号选项（根据实际系统用户配置）
const ENTRY_ACCOUNTS = [
  { label: '张晴', value: '张晴' },
  { label: '夏嘉', value: '夏嘉' },
  { label: '王志', value: '王志' },
  { label: '安桐', value: '安桐' },
  { label: '孙星', value: '孙星' },
];

export default function AdvancedFilterModal({
  visible,
  onCancel,
  onConfirm,
  initialFilters = {}
}: AdvancedFilterModalProps) {
  const [form] = Form.useForm();
  const [selectedQuickFilters, setSelectedQuickFilters] = useState<string[]>([]);
  const [filters, setFilters] = useState<Partial<CustomerFilterParams>>(initialFilters);

  useEffect(() => {
    if (visible) {
      form.setFieldsValue(initialFilters);
      setFilters(initialFilters);
      // 根据当前筛选条件设置快捷筛选标签
      updateQuickFiltersFromFilters(initialFilters);
    }
  }, [visible, initialFilters, form]);

  // 根据筛选条件更新快捷筛选标签
  const updateQuickFiltersFromFilters = (currentFilters: Partial<CustomerFilterParams>) => {
    const selected: string[] = [];
    
    QUICK_FILTERS.forEach(quickFilter => {
      const { key, value } = quickFilter;
      let isSelected = true;
      
      Object.entries(value).forEach(([filterKey, filterValue]) => {
        if (currentFilters[filterKey as keyof CustomerFilterParams] !== filterValue) {
          isSelected = false;
        }
      });
      
      if (isSelected) {
        selected.push(key);
      }
    });
    
    setSelectedQuickFilters(selected);
  };

  // 处理快捷筛选点击
  const handleQuickFilterToggle = (quickFilterKey: string) => {
    console.log('快捷筛选点击:', quickFilterKey);
    const quickFilter = QUICK_FILTERS.find(f => f.key === quickFilterKey);
    if (!quickFilter) {
      console.log('未找到快捷筛选:', quickFilterKey);
      return;
    }

    const newFilters = { ...filters };
    let newSelectedQuickFilters = [...selectedQuickFilters];

    if (selectedQuickFilters.includes(quickFilterKey)) {
      // 取消选择
      console.log('取消选择快捷筛选:', quickFilterKey);
      newSelectedQuickFilters = newSelectedQuickFilters.filter(key => key !== quickFilterKey);
      
      // 移除对应的筛选条件
      Object.keys(quickFilter.value).forEach(key => {
        delete newFilters[key as keyof CustomerFilterParams];
      });
    } else {
      // 选择
      console.log('选择快捷筛选:', quickFilterKey, quickFilter.value);
      newSelectedQuickFilters.push(quickFilterKey);
      
      // 添加对应的筛选条件
      Object.entries(quickFilter.value).forEach(([key, value]) => {
        (newFilters as Record<string, unknown>)[key] = value;
      });
    }

    console.log('新的筛选条件:', newFilters);
    setSelectedQuickFilters(newSelectedQuickFilters);
    setFilters(newFilters);
    form.setFieldsValue(newFilters);
  };

  // 处理表单字段变化
  const handleFieldChange = (changedFields: Record<string, unknown>, allFields: Record<string, unknown>) => {
    const newFilters = { ...filters };
    
    Object.entries(allFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        (newFilters as Record<string, unknown>)[key] = value;
      } else {
        delete (newFilters as Record<string, unknown>)[key];
      }
    });
    
    setFilters(newFilters);
    updateQuickFiltersFromFilters(newFilters);
  };

  // 处理确认
  const handleConfirm = () => {
    onConfirm(filters);
    onCancel();
  };

  // 处理重置
  const handleReset = () => {
    form.resetFields();
    setFilters({});
    setSelectedQuickFilters([]);
  };

  return (
    <Modal
      title="更多筛选"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button key="reset" onClick={handleReset}>
          清空
        </Button>,
        <Button key="confirm" type="primary" onClick={handleConfirm}>
          确定
        </Button>,
      ]}
      width={600}
      className="advanced-filter-modal"
    >
      <div className="filter-content">
        {/* 快捷筛选 */}
        <div className="filter-section">
          <h4 className="filter-section-title">快捷筛选</h4>
          <div className="quick-filters">
            {QUICK_FILTERS.map(filter => (
              <Tag.CheckableTag
                key={filter.key}
                checked={selectedQuickFilters.includes(filter.key)}
                onChange={() => handleQuickFilterToggle(filter.key)}
                className="quick-filter-tag"
              >
                {filter.label}
              </Tag.CheckableTag>
            ))}
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleFieldChange}
          className="filter-form"
        >
          {/* 客户状态 */}
          <div className="filter-section">
            <h4 className="filter-section-title">客户状态</h4>
            <Form.Item name="status">
              <Select
                mode="multiple"
                placeholder="选择客户状态"
                allowClear
                className="multi-select"
              >
                {Object.entries(CUSTOMER_STATUS_TEXT).map(([value, label]) => (
                  <Option key={value} value={parseInt(value)}>
                    {label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* 客户来源渠道 */}
          <div className="filter-section">
            <h4 className="filter-section-title">客户来源渠道</h4>
            <Form.Item name="source_channel">
              <Select
                mode="multiple"
                placeholder="选择来源渠道"
                allowClear
                className="multi-select"
              >
                {Object.entries(SOURCE_CHANNEL_TEXT).map(([value, label]) => (
                  <Option key={value} value={value}>
                    {label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* 录入方式 */}
          <div className="filter-section">
            <h4 className="filter-section-title">录入方式</h4>
            <Form.Item name="is_agent">
              <Select
                mode="multiple"
                placeholder="选择录入方式"
                allowClear
                className="multi-select"
              >
                <Option value={true}>人工</Option>
                <Option value={false}>agent</Option>
              </Select>
            </Form.Item>
          </div>

          {/* 录入账号 */}
          <div className="filter-section">
            <h4 className="filter-section-title">录入账号</h4>
            <Form.Item name="creator">
              <Select
                mode="multiple"
                placeholder="选择录入账号"
                allowClear
                className="multi-select"
              >
                {ENTRY_ACCOUNTS.map(account => (
                  <Option key={account.value} value={account.value}>
                    {account.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* 城市 */}
          <div className="filter-section">
            <h4 className="filter-section-title">城市</h4>
            <Form.Item name="city">
              <Select
                mode="multiple"
                placeholder="选择城市"
                allowClear
                showSearch
                className="multi-select"
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {CITY_LIST.map(city => (
                  <Option key={city} value={city}>
                    {city}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* 托管ID */}
          <div className="filter-section">
            <h4 className="filter-section-title">托管ID</h4>
            <Form.Item name="botId">
              <Input placeholder="输入托管ID" allowClear />
            </Form.Item>
          </div>
        </Form>
      </div>

      <style jsx>{`
        .filter-content {
          max-height: 500px;
          overflow-y: auto;
        }
        
        .filter-section {
          margin-bottom: 20px;
        }
        
        .filter-section-title {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
          color: #262626;
        }
        
        .quick-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .quick-filter-tag {
          cursor: pointer;
          border: 1px solid #d9d9d9;
          border-radius: 4px;
          padding: 4px 8px;
        }
        
        .quick-filter-tag.ant-tag-checkable-checked {
          background-color: #1890ff;
          color: white;
          border-color: #1890ff;
        }
        
        .multi-select {
          width: 100%;
        }
        
        .filter-form .ant-form-item {
          margin-bottom: 0;
        }
      `}</style>
    </Modal>
  );
}