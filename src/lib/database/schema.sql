-- 客户表
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT DEFAULT '',                  -- 租客姓名
  nickname TEXT,                         -- 客户昵称
  phone TEXT UNIQUE,                     -- 主手机号 (唯一，但可为空)
  backup_phone TEXT,                     -- 备用手机
  wechat TEXT,                          -- 微信
  status INTEGER DEFAULT 1,             -- 状态 (1=跟进中, 2=客户不再回复, 3=已约带看, 4=已成交未结佣, 5=已成交已结佣)
  community TEXT DEFAULT '',            -- 咨询小区
  business_type TEXT DEFAULT 'whole_rent', -- 业务类型 (whole_rent=整租, centralized=集中, shared_rent=合租)
  room_type TEXT DEFAULT 'one_bedroom', -- 居室 (one_bedroom, two_bedroom, three_bedroom, four_plus, master_room, second_room)
  room_tags TEXT,                       -- 房型标签 (JSON数组: studio, loft, flat, two_bath, bungalow)
  move_in_date TEXT,                    -- 入住时间 (YYYY-MM-DD)
  lease_period INTEGER,                 -- 租赁周期 (1-6月, 12年, 24两年, 36三年+)
  price_range TEXT,                     -- 可接受的价格 ("5000-7000")
  source_channel TEXT DEFAULT 'referral', -- 来源渠道 (xianyu, xiaohongshu, beike, 58tongcheng, shipinhao, douyin, referral)
  userId TEXT,                          -- 用户第三方账号ID
  botId TEXT,                           -- 用户聊的工作人员账号ID
  creator TEXT DEFAULT '系统',           -- 录入人
  is_agent BOOLEAN DEFAULT 1,          -- 是否为人工录入 (1=人工, 0=agent)
  internal_notes TEXT,                  -- 内部备注 (最多300字)
  total_commission DECIMAL(10,2) DEFAULT 0, -- 线索佣金（计算字段）
  viewing_count INTEGER DEFAULT 0,     -- 带看次数（计算字段）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 带看记录表
CREATE TABLE IF NOT EXISTS viewing_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,    -- 编号
  customer_id INTEGER,                     -- 客户ID (外键，可为空)
  viewing_time DATETIME DEFAULT CURRENT_TIMESTAMP, -- 带看时间
  property_name TEXT DEFAULT '未填写楼盘',   -- 带看楼盘
  property_address TEXT,                   -- 楼盘地址
  room_type TEXT DEFAULT 'one_bedroom',    -- 带看户型
  room_tag TEXT,                          -- 房型标签
  viewer_name TEXT DEFAULT 'internal',    -- 带看人 (internal, external, external_sales, creator)
  viewing_status INTEGER DEFAULT 1,       -- 带看状态 (1=待确认, 2=已确认, 3=已取消, 4=已带看)
  commission DECIMAL(10,2) DEFAULT 0,     -- 带看佣金
  viewing_feedback INTEGER,               -- 带看反馈 (0=未成交, 1=已成交)
  business_type TEXT DEFAULT 'whole_rent', -- 业务类型
  notes TEXT,                             -- 备注
  customer_name TEXT DEFAULT '',          -- 客户姓名 (历史字段，便于查询)
  customer_phone TEXT DEFAULT '',         -- 客户电话 (历史字段，便于查询)
  -- 第三方系统字段
  userId TEXT,                            -- 用户第三方账号ID
  botId TEXT,                             -- 用户聊的工作人员账号ID
  -- 房源相关字段
  housingId INTEGER,                      -- 房源ID
  houseAreaId INTEGER,                    -- 区域ID
  houseAreaName TEXT,                     -- 区域名称
  cityId INTEGER,                         -- 城市ID
  cityName TEXT,                          -- 城市名称
  propertyAddrId INTEGER,                 -- 物业地址ID
  unitType TEXT,                          -- 户型
  longitude TEXT,                         -- 经度
  latitude TEXT,                          -- 纬度
  roomId INTEGER,                         -- 房间ID
  advisorId INTEGER,                      -- 顾问ID
  advisorName TEXT,                       -- 顾问名称
  companyName TEXT,                       -- 公司名称
  companyAbbreviation TEXT,               -- 公司简称
  houseTypeId INTEGER,                    -- 房型ID
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL
);



-- 创建索引
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_source_channel ON customers(source_channel);
CREATE INDEX IF NOT EXISTS idx_customers_userId ON customers(userId);
CREATE INDEX IF NOT EXISTS idx_customers_botId ON customers(botId);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

CREATE INDEX IF NOT EXISTS idx_viewing_records_customer_id ON viewing_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_viewing_records_status ON viewing_records(viewing_status);
CREATE INDEX IF NOT EXISTS idx_viewing_records_created_at ON viewing_records(created_at);



-- 创建触发器：自动更新 updated_at 字段
CREATE TRIGGER IF NOT EXISTS update_customers_updated_at 
  AFTER UPDATE ON customers
  BEGIN
    UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_viewing_records_updated_at 
  AFTER UPDATE ON viewing_records
  BEGIN
    UPDATE viewing_records SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

 