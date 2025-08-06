-- 005_update_viewing_records_fields.sql
-- 为带看记录表添加客户信息字段
-- 创建时间: 2025-08-06

-- 添加customer_name字段 - 客户姓名（历史字段，便于查询）
ALTER TABLE viewing_records ADD COLUMN customer_name TEXT DEFAULT '';

-- 添加customer_phone字段 - 客户电话（历史字段，便于查询）
ALTER TABLE viewing_records ADD COLUMN customer_phone TEXT DEFAULT '';

-- 迁移说明：
-- customer_name: 存储客户姓名的历史快照，便于查询和报表生成
-- customer_phone: 存储客户电话的历史快照，便于查询和报表生成
-- 这两个字段都有默认值，支持现有数据的兼容性
-- 建议在创建/更新带看记录时同步填充这些字段

-- 可选：为历史数据填充客户信息（需要手动执行）
-- UPDATE viewing_records 
-- SET customer_name = (SELECT name FROM customers WHERE customers.id = viewing_records.customer_id),
--     customer_phone = (SELECT phone FROM customers WHERE customers.id = viewing_records.customer_id)
-- WHERE customer_id IS NOT NULL; 