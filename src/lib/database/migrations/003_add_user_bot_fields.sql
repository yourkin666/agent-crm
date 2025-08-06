-- 003_add_user_bot_fields.sql
-- 为客户表添加userId和botId字段
-- 创建时间: 2025-08-06

-- 添加userId字段 - 用户第三方账号ID
ALTER TABLE customers ADD COLUMN userId TEXT;

-- 添加botId字段 - 用户聊的工作人员账号ID  
ALTER TABLE customers ADD COLUMN botId TEXT;

-- 为新字段创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_customers_userId ON customers(userId);
CREATE INDEX IF NOT EXISTS idx_customers_botId ON customers(botId);

-- 迁移说明：
-- userId: 存储用户在第三方平台的唯一标识ID
-- botId: 存储与用户对话的工作人员/机器人的账号ID
-- 两个字段都允许为空，支持现有数据的兼容性 