-- MySQL标准语法版本的数据库Schema
-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 客户表
DROP TABLE IF EXISTS `qft_ai_customers`;
CREATE TABLE `qft_ai_customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '客户ID',
  `name` varchar(255) NOT NULL DEFAULT '' COMMENT '租客姓名',
  `nickname` varchar(255) DEFAULT NULL COMMENT '客户昵称',
  `phone` varchar(20) DEFAULT NULL COMMENT '主手机号 (唯一，但可为空)',
  `backup_phone` varchar(20) DEFAULT NULL COMMENT '备用手机',
  `wechat` varchar(255) DEFAULT NULL COMMENT '微信',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '状态 (1=跟进中, 2=客户不再回复, 3=已约带看, 4=已成交未结佣, 5=已成交已结佣)',
  `community` varchar(255) NOT NULL DEFAULT '' COMMENT '咨询小区',
  `business_type` varchar(50) NOT NULL DEFAULT 'whole_rent' COMMENT '业务类型 (whole_rent=整租, centralized=集中, shared_rent=合租)',
  `room_type` varchar(50) NOT NULL DEFAULT 'one_bedroom' COMMENT '居室 (one_bedroom, two_bedroom, three_bedroom, four_plus, master_room, second_room)',
  `room_tags` text DEFAULT NULL COMMENT '房型标签 (JSON数组: studio, loft, flat, two_bath, bungalow)',
  `move_in_date` varchar(10) DEFAULT NULL COMMENT '入住时间 (YYYY-MM-DD)',
  `lease_period` int(11) DEFAULT NULL COMMENT '租赁周期 (1-6月, 12年, 24两年, 36三年+)',
  `price_range` varchar(50) DEFAULT NULL COMMENT '可接受的价格 ("5000-7000")',
  `source_channel` varchar(50) NOT NULL DEFAULT 'referral' COMMENT '来源渠道 (xianyu, xiaohongshu, beike, 58tongcheng, shipinhao, douyin, referral)',
  `userId` varchar(255) DEFAULT NULL COMMENT '用户第三方账号ID',
  `botId` varchar(255) DEFAULT NULL COMMENT '用户聊的工作人员账号ID',
  `creator` varchar(255) NOT NULL DEFAULT '系统' COMMENT '录入人',
  `is_agent` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否为人工录入 (1=人工, 0=agent)',
  `internal_notes` text DEFAULT NULL COMMENT '内部备注 (最多300字)',
  `total_commission` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '线索佣金（计算字段）',
  `viewing_count` int(11) NOT NULL DEFAULT '0' COMMENT '带看次数（计算字段）',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_phone` (`phone`),
  KEY `idx_status` (`status`),
  KEY `idx_source_channel` (`source_channel`),
  KEY `idx_userId` (`userId`),
  KEY `idx_botId` (`botId`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户信息表';

-- 带看记录表
DROP TABLE IF EXISTS `qft_ai_viewing_records`;
CREATE TABLE `qft_ai_viewing_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '编号',
  `customer_id` int(11) DEFAULT NULL COMMENT '客户ID (外键，可为空)',
  `viewing_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '带看时间',
  `property_name` varchar(255) NOT NULL DEFAULT '未填写楼盘' COMMENT '带看楼盘',
  `property_address` text DEFAULT NULL COMMENT '楼盘地址',
  `room_type` varchar(50) NOT NULL DEFAULT 'one_bedroom' COMMENT '带看户型',
  `room_tag` text DEFAULT NULL COMMENT '房型标签',
  `viewer_name` varchar(50) NOT NULL DEFAULT 'internal' COMMENT '带看人 (internal, external, external_sales, creator)',
  `viewing_status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '带看状态 (1=待确认, 2=已确认, 3=已取消, 4=已带看)',
  `commission` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '带看佣金',
  `viewing_feedback` tinyint(4) DEFAULT NULL COMMENT '带看反馈 (0=未成交, 1=已成交)',
  `business_type` varchar(50) NOT NULL DEFAULT 'whole_rent' COMMENT '业务类型',
  `notes` text DEFAULT NULL COMMENT '备注',
  `customer_name` varchar(255) NOT NULL DEFAULT '' COMMENT '客户姓名 (历史字段，便于查询)',
  `customer_phone` varchar(20) NOT NULL DEFAULT '' COMMENT '客户电话 (历史字段，便于查询)',
  -- 第三方系统字段
  `userId` varchar(255) DEFAULT NULL COMMENT '用户第三方账号ID',
  `botId` varchar(255) DEFAULT NULL COMMENT '用户聊的工作人员账号ID',
  -- 房源相关字段
  `housingId` int(11) DEFAULT NULL COMMENT '房源ID',
  `houseAreaId` int(11) DEFAULT NULL COMMENT '区域ID',
  `houseAreaName` varchar(255) DEFAULT NULL COMMENT '区域名称',
  `cityId` int(11) DEFAULT NULL COMMENT '城市ID',
  `cityName` varchar(255) DEFAULT NULL COMMENT '城市名称',
  `propertyAddrId` int(11) DEFAULT NULL COMMENT '物业地址ID',
  `unitType` varchar(255) DEFAULT NULL COMMENT '户型',
  `longitude` varchar(50) DEFAULT NULL COMMENT '经度',
  `latitude` varchar(50) DEFAULT NULL COMMENT '纬度',
  `roomId` int(11) DEFAULT NULL COMMENT '房间ID',
  `advisorId` int(11) DEFAULT NULL COMMENT '顾问ID',
  `advisorName` varchar(255) DEFAULT NULL COMMENT '顾问名称',
  `companyName` varchar(255) DEFAULT NULL COMMENT '公司名称',
  `companyAbbreviation` varchar(255) DEFAULT NULL COMMENT '公司简称',
  `houseTypeId` int(11) DEFAULT NULL COMMENT '房型ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_viewing_status` (`viewing_status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_viewing_time` (`viewing_time`),
  CONSTRAINT `fk_viewing_records_customer` FOREIGN KEY (`customer_id`) REFERENCES `qft_ai_customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='带看记录表';

SET FOREIGN_KEY_CHECKS = 1; 