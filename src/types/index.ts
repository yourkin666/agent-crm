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

// 预约带看状态枚举
export enum AppointmentStatus {
  PENDING = 1,      // 待确认
  CONFIRMED = 2,    // 已确认
  IN_PROGRESS = 3,  // 进行中
  COMPLETED = 4,    // 已完成
  CANCELLED = 5,    // 已取消
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
  phone: string;                   // 主手机号
  backup_phone?: string;           // 备用手机
  wechat?: string;                 // 微信
  status: CustomerStatus;          // 状态
  community: string;               // 咨询小区
  business_type: BusinessType;     // 业务类型
  room_type: RoomType;             // 居室
  room_tags?: RoomTag[];           // 房型标签
  move_in_date?: string;           // 入住时间（具体日期）
  lease_period?: LeasePeriod;      // 租赁周期
  price_range?: string;            // 可接受的价格
  source_channel: SourceChannel;   // 来源渠道
  creator: string;                 // 录入人
  is_agent: boolean;               // 是否为人工录入
  total_commission: number;        // 线索佣金（计算字段）
  viewing_count: number;           // 带看次数（计算字段）
  created_at: string;
  updated_at: string;
}

// 带看记录接口
export interface ViewingRecord {
  id: number;
  customer_id: number;             // 客户ID
  business_type: BusinessType;     // 业务类型
  room_type: RoomType;             // 房型
  room_tag?: RoomTag;              // 房型标签
  viewer_name: string;             // 带看人
  viewer_type: ViewerType;         // 带看人类型
  viewing_status: ViewingStatus;   // 带看状态
  viewing_feedback?: ViewingFeedback; // 带看反馈
  commission: number;              // 佣金
  notes?: string;                  // 备注
  created_at: string;
  updated_at: string;
}

// 预约带看接口
export interface Appointment {
  id: number;
  property_name: string;           // 物业名称
  property_address: string;        // 房间地址
  customer_name: string;           // 客户姓名
  customer_phone: string;          // 客户电话
  agent_name: string;              // 经纪人
  appointment_time: string;        // 预约时间
  status: AppointmentStatus;       // 状态
  type: BusinessType;              // 类型
  city?: string;                   // 城市
  is_converted: boolean;           // 是否已转化为带看记录
  created_at: string;
  updated_at: string;
}

// API 响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
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
}

// 筛选参数接口
export interface CustomerFilterParams extends PaginationParams {
  name?: string;
  phone?: string;
  status?: CustomerStatus;
  source_channel?: SourceChannel;
  business_type?: BusinessType;
  price_min?: number;
  price_max?: number;
  community?: string;
}

export interface AppointmentFilterParams extends PaginationParams {
  customer_name?: string;
  customer_phone?: string;
  agent_name?: string;
  status?: AppointmentStatus;
  type?: BusinessType;
  city?: string;
  date_from?: string;
  date_to?: string;
} 