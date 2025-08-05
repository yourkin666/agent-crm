-- 客户表
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT DEFAULT '',                  -- 租客姓名
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL
);

-- 预约带看表
CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_name TEXT DEFAULT '未填写',      -- 物业名称
  property_address TEXT,                   -- 房间地址
  customer_name TEXT DEFAULT '未填写',      -- 客户姓名
  customer_phone TEXT,                     -- 客户电话
  agent_name TEXT DEFAULT '未填写',         -- 经纪人
  appointment_time DATETIME,               -- 预约时间
  status INTEGER DEFAULT 1,               -- 状态 (1=待确认, 2=已确认, 3=进行中, 4=已完成, 5=已取消)
  type TEXT DEFAULT 'whole_rent',         -- 类型 (whole_rent, centralized, shared_rent)
  city TEXT,                              -- 城市
  is_converted BOOLEAN DEFAULT 0,         -- 是否已转化为带看记录
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_source_channel ON customers(source_channel);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

CREATE INDEX IF NOT EXISTS idx_viewing_records_customer_id ON viewing_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_viewing_records_status ON viewing_records(viewing_status);
CREATE INDEX IF NOT EXISTS idx_viewing_records_created_at ON viewing_records(created_at);

CREATE INDEX IF NOT EXISTS idx_appointments_customer_phone ON appointments(customer_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_time ON appointments(appointment_time);
CREATE INDEX IF NOT EXISTS idx_appointments_city ON appointments(city);
CREATE INDEX IF NOT EXISTS idx_appointments_is_converted ON appointments(is_converted);

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

CREATE TRIGGER IF NOT EXISTS update_appointments_updated_at 
  AFTER UPDATE ON appointments
  BEGIN
    UPDATE appointments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END; 