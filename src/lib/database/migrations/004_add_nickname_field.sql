-- 004_add_nickname_field.sql
-- 为客户表添加nickname字段
-- 创建时间: 2025-08-06

-- 添加nickname字段 - 客户昵称
ALTER TABLE customers ADD COLUMN nickname TEXT;

-- 迁移说明：
-- nickname: 存储客户的昵称，用于更友好的显示客户信息
-- 字段允许为空，支持现有数据的兼容性
-- 不创建索引，因为昵称主要用于显示而非查询筛选 