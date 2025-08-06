-- 迁移脚本：更新客户表字段以支持多选和新的价格字段
-- 执行时间：根据数据量而定

BEGIN TRANSACTION;

-- 1. 添加新的价格字段
ALTER TABLE customers ADD COLUMN price_min INTEGER;
ALTER TABLE customers ADD COLUMN price_max INTEGER;

-- 2. 更新现有的price_range数据到新的price_min和price_max字段
UPDATE customers 
SET 
  price_min = CASE 
    WHEN price_range IS NOT NULL AND price_range LIKE '%-%' 
    THEN CAST(SUBSTR(price_range, 1, INSTR(price_range, '-')-1) AS INTEGER)
    ELSE NULL 
  END,
  price_max = CASE 
    WHEN price_range IS NOT NULL AND price_range LIKE '%-%' 
    THEN CAST(SUBSTR(price_range, INSTR(price_range, '-')+1) AS INTEGER)
    ELSE NULL 
  END
WHERE price_range IS NOT NULL AND price_range LIKE '%-%';

-- 3. 更新business_type字段：将单选格式转换为多选数组格式
UPDATE customers 
SET business_type = '["' || business_type || '"]'
WHERE business_type IS NOT NULL 
  AND business_type NOT LIKE '[%]'
  AND business_type != '';

-- 4. 更新room_type字段：将单选格式转换为多选数组格式
UPDATE customers 
SET room_type = '["' || room_type || '"]'
WHERE room_type IS NOT NULL 
  AND room_type NOT LIKE '[%]'
  AND room_type != '';

-- 5. 为空值设置默认值
UPDATE customers 
SET business_type = '["whole_rent"]'
WHERE business_type IS NULL OR business_type = '';

UPDATE customers 
SET room_type = '["one_bedroom"]'
WHERE room_type IS NULL OR room_type = '';

COMMIT; 