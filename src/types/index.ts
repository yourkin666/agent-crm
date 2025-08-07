// 客户状态枚举
export enum CustomerStatus {
  FOLLOWING = 1,        // 跟进中
  NO_RESPONSE = 2,      // 客户不再回复
  SCHEDULED = 3,        // 已约带看
  DEAL_PENDING = 4,     // 已成交未结佣
  DEAL_COMPLETED = 5,   // 已成交已结佣
}

// 来源渠道枚举
export enum SourceChannel {
  XIANYU = 'xianyu',           // 闲鱼
  XIAOHONGSHU = 'xiaohongshu', // 小红书
  BEIKE = 'beike',             // 贝壳
  CITY58 = '58tongcheng',      // 58同城
  SHIPINHAO = 'shipinhao',     // 视频号
  DOUYIN = 'douyin',           // 抖音
  REFERRAL = 'referral',       // 转介绍
}

// 业务类型枚举
export enum BusinessType {
  WHOLE_RENT = 'whole_rent',    // 整租
  CENTRALIZED = 'centralized',  // 集中
  SHARED_RENT = 'shared_rent',  // 合租
}

// 房型枚举
export enum RoomType {
  ONE_BEDROOM = 'one_bedroom',       // 一居室
  TWO_BEDROOM = 'two_bedroom',       // 两居室
  THREE_BEDROOM = 'three_bedroom',   // 三居室
  FOUR_PLUS_BEDROOM = 'four_plus',   // 四居及以上
  MASTER_ROOM = 'master_room',       // 主卧
  SECOND_ROOM = 'second_room',       // 次卧
}

// 房型标签枚举
export enum RoomTag {
  STUDIO = 'studio',           // 开间
  LOFT = 'loft',              // loft
  FLAT = 'flat',              // 平层
  TWO_BATHROOM = 'two_bath',   // 两卫
  BUNGALOW = 'bungalow',      // 平房
}

// 带看人类型枚举
export enum ViewerType {
  INTERNAL = 'internal',       // 内部管家
  EXTERNAL = 'external',       // 外部管家
  EXTERNAL_SALES = 'external_sales', // 外销管家
  CREATOR = 'creator',         // 录入人
}

// 带看状态枚举
export enum ViewingStatus {
  PENDING = 1,     // 待确认
  CONFIRMED = 2,   // 已确认
  CANCELLED = 3,   // 已取消
  COMPLETED = 4,   // 已带看
}

// 带看反馈枚举
export enum ViewingFeedback {
  NOT_DEAL = 0,    // 未成交
  DEAL = 1,        // 已成交
}



// 租赁周期枚举
export enum LeasePeriod {
  ONE_MONTH = 1,
  TWO_MONTHS = 2,
  THREE_MONTHS = 3,
  FOUR_MONTHS = 4,
  FIVE_MONTHS = 5,
  SIX_MONTHS = 6,
  ONE_YEAR = 12,
  TWO_YEARS = 24,
  THREE_PLUS_YEARS = 36,
}

// 客户基础信息接口
export interface Customer {
  id: number;
  name: string;                    // 租客姓名
  nickname?: string;               // 客户昵称
  phone: string;                   // 主手机号
  backup_phone?: string;           // 备用手机
  wechat?: string;                 // 微信
  status: CustomerStatus;          // 状态
  community: string;               // 咨询小区
  business_type: BusinessType[];   // 业务类型（多选）
  room_type: RoomType[];           // 居室（多选）
  room_tags?: RoomTag[];           // 房型标签
  move_in_date?: string;           // 入住时间（具体日期）
  lease_period?: LeasePeriod;      // 租赁周期
  price_range?: string;            // 可接受的价格（兼容性保留）
  price_min?: number;              // 最低价格
  price_max?: number;              // 最高价格
  source_channel: SourceChannel;   // 来源渠道
  userId?: string;                 // 用户第三方账号ID
  botId?: string;                  // 用户聊的工作人员账号ID
  creator: string;                 // 录入人
  is_agent: boolean;               // 是否为人工录入
  internal_notes?: string;         // 内部备注（最多300字）
  total_commission: number;        // 线索佣金（计算字段）
  viewing_count: number;           // 带看次数（计算字段）
  created_at: string;
  updated_at: string;
}

// 带看记录接口
export interface ViewingRecord {
  id: number;
  customer_id?: number;            // 客户ID (外键，可为空)
  viewing_time: string;            // 带看时间
  property_name: string;           // 物业地址
  property_address?: string;       // 详细地址
  room_type: string;               // 带看户型
  room_tag?: string;               // 房型标签
  viewer_name: string;             // 带看人 (internal, external, external_sales, creator)
  viewing_status: number;          // 带看状态 (1=待确认, 2=已确认, 3=已取消, 4=已带看)
  commission: number;              // 带看佣金
  viewing_feedback?: number;       // 带看反馈 (0=未成交, 1=已成交)
  business_type: string;           // 业务类型
  notes?: string;                  // 备注
  customer_name: string;           // 客户姓名 (历史字段，便于查询)
  customer_phone: string;          // 客户电话 (历史字段，便于查询)
  // 第三方系统字段
  userId?: string;                 // 用户第三方账号ID
  botId?: string;                  // 用户聊的工作人员账号ID
  // 房源相关字段
  housingId?: number;              // 房源ID
  houseAreaId?: number;            // 区域ID
  houseAreaName?: string;          // 区域名称
  cityId?: number;                 // 城市ID
  cityName?: string;               // 城市名称
  propertyAddrId?: number;         // 物业地址ID
  unitType?: string;               // 户型
  longitude?: string;              // 经度
  latitude?: string;               // 纬度
  roomId?: number;                 // 房间ID
  advisorId?: number;              // 顾问ID
  advisorName?: string;            // 顾问名称
  companyName?: string;            // 公司名称
  companyAbbreviation?: string;    // 公司简称
  houseTypeId?: number;            // 房型ID
  created_at: string;
  updated_at: string;
}



// 带看记录统计数据接口
export interface ViewingRecordStats {
  total_records: number;      // 总记录数
  completed_records: number;  // 已完成记录数
  pending_records: number;    // 待处理记录数
  total_commission: number;   // 总佣金
}

// API 响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errorType?: string;
  details?: any;
}

// 分页接口
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  totalCommission?: number; // 符合筛选条件的总佣金
}

// 筛选参数接口
export interface CustomerFilterParams extends PaginationParams {
  name?: string;
  phone?: string;
  status?: CustomerStatus | CustomerStatus[]; // 支持多选
  source_channel?: SourceChannel | SourceChannel[]; // 支持多选
  business_type?: BusinessType | BusinessType[]; // 支持多选
  price_min?: number;
  price_max?: number;
  community?: string;
  creator?: string | string[]; // 录入人，支持多选
  is_agent?: boolean | boolean[]; // 录入方式，支持多选
  city?: string | string[]; // 城市，支持多选
  move_in_days?: number; // 入住天数范围（如7日内）
  viewing_today?: boolean; // 今日看房
  my_entries?: boolean; // 我录入的
}

 