'use client';

import React, { useState, useEffect } from 'react';
import { Input } from 'antd';
import { InputRef } from 'antd/lib/input';

interface PriceRangeInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const PriceRangeInput: React.ForwardRefRenderFunction<InputRef, PriceRangeInputProps> = (
  { value, onChange, disabled = false }
) => {
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // 当外部value变化时，解析并设置内部状态
  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      setMinPrice(parts[0]?.trim() || '');
      setMaxPrice(parts[1]?.trim() || '');
    } else {
      setMinPrice('');
      setMaxPrice('');
    }
  }, [value]);

  // 处理最低价格变化
  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinPrice = e.target.value.replace(/[^\d]/g, ''); // 只允许数字
    setMinPrice(newMinPrice);
    
    const newValue = newMinPrice && maxPrice ? `${newMinPrice}-${maxPrice}` : 
                    newMinPrice ? newMinPrice : 
                    maxPrice ? `-${maxPrice}` : '';
    onChange?.(newValue);
  };

  // 处理最高价格变化
  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMaxPrice = e.target.value.replace(/[^\d]/g, ''); // 只允许数字
    setMaxPrice(newMaxPrice);
    
    const newValue = minPrice && newMaxPrice ? `${minPrice}-${newMaxPrice}` : 
                    minPrice ? minPrice : 
                    newMaxPrice ? `-${newMaxPrice}` : '';
    onChange?.(newValue);
  };

  return (
    <Input.Group compact>
      <Input
        style={{ width: 'calc(50% - 16px)', textAlign: 'right' }}
        placeholder="最低价格"
        value={minPrice}
        onChange={handleMinPriceChange}
        disabled={disabled}
      />
      <Input
        style={{ 
          width: '32px', 
          textAlign: 'center', 
          backgroundColor: '#f5f5f5',
          borderLeft: 0,
          borderRight: 0,
          pointerEvents: 'none'
        }}
        placeholder="-"
        value="-"
        disabled
      />
      <Input
        style={{ width: 'calc(50% - 16px)', borderLeft: 0 }}
        placeholder="最高价格"
        value={maxPrice}
        onChange={handleMaxPriceChange}
        disabled={disabled}
      />
    </Input.Group>
  );
};

export default React.forwardRef(PriceRangeInput); 