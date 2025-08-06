-- 006_add_viewing_records_extended_fields.sql
-- 为带看记录表添加第三方系统和房源相关字段
-- 创建时间: 2025-08-06

-- 第三方系统字段
ALTER TABLE viewing_records ADD COLUMN userId TEXT;              -- 用户第三方账号ID
ALTER TABLE viewing_records ADD COLUMN botId TEXT;               -- 用户聊的工作人员账号ID

-- 房源相关字段
ALTER TABLE viewing_records ADD COLUMN housingId INTEGER;        -- 房源ID
ALTER TABLE viewing_records ADD COLUMN houseAreaId INTEGER;      -- 区域ID
ALTER TABLE viewing_records ADD COLUMN houseAreaName TEXT;       -- 区域名称
ALTER TABLE viewing_records ADD COLUMN cityId INTEGER;           -- 城市ID
ALTER TABLE viewing_records ADD COLUMN cityName TEXT;            -- 城市名称
ALTER TABLE viewing_records ADD COLUMN propertyAddrId INTEGER;   -- 物业地址ID
ALTER TABLE viewing_records ADD COLUMN unitType TEXT;            -- 户型
ALTER TABLE viewing_records ADD COLUMN longitude TEXT;           -- 经度
ALTER TABLE viewing_records ADD COLUMN latitude TEXT;            -- 纬度
ALTER TABLE viewing_records ADD COLUMN roomId INTEGER;           -- 房间ID
ALTER TABLE viewing_records ADD COLUMN advisorId INTEGER;        -- 顾问ID
ALTER TABLE viewing_records ADD COLUMN advisorName TEXT;         -- 顾问名称
ALTER TABLE viewing_records ADD COLUMN companyName TEXT;         -- 公司名称
ALTER TABLE viewing_records ADD COLUMN companyAbbreviation TEXT; -- 公司简称
ALTER TABLE viewing_records ADD COLUMN houseTypeId INTEGER;      -- 房型ID

-- 迁移说明：
-- 这些字段扩展了带看记录表，支持与第三方系统集成
-- userId/botId: 关联第三方用户和工作人员账号
-- 房源相关字段: 提供详细的房源信息，包括地理位置、区域、顾问等
-- 所有新字段都允许为空，保持与现有数据的兼容性

-- 建议为常用查询字段创建索引（根据实际使用情况）：
-- CREATE INDEX IF NOT EXISTS idx_viewing_records_userId ON viewing_records(userId);
-- CREATE INDEX IF NOT EXISTS idx_viewing_records_housingId ON viewing_records(housingId);
-- CREATE INDEX IF NOT EXISTS idx_viewing_records_cityId ON viewing_records(cityId);
-- CREATE INDEX IF NOT EXISTS idx_viewing_records_advisorId ON viewing_records(advisorId); 