import { 
  CustomerStatus, SourceChannel, BusinessType, RoomType, RoomTag,
  ViewerType, ViewingStatus, ViewingFeedback, AppointmentStatus, LeasePeriod
} from '@/types';

// 客户状态显示文本
export const CUSTOMER_STATUS_TEXT = {
  [CustomerStatus.FOLLOWING]: '跟进中',
  [CustomerStatus.NO_RESPONSE]: '客户不再回复',
  [CustomerStatus.SCHEDULED]: '已约带看',
  [CustomerStatus.DEAL_PENDING]: '已成交未结佣',
  [CustomerStatus.DEAL_COMPLETED]: '已成交已结佣',
};

// 客户状态颜色
export const CUSTOMER_STATUS_COLOR = {
  [CustomerStatus.FOLLOWING]: 'blue',
  [CustomerStatus.NO_RESPONSE]: 'gray',
  [CustomerStatus.SCHEDULED]: 'orange',
  [CustomerStatus.DEAL_PENDING]: 'purple',
  [CustomerStatus.DEAL_COMPLETED]: 'green',
};

// 来源渠道显示文本
export const SOURCE_CHANNEL_TEXT = {
  [SourceChannel.XIANYU]: '闲鱼',
  [SourceChannel.XIAOHONGSHU]: '小红书',
  [SourceChannel.BEIKE]: '贝壳',
  [SourceChannel.CITY58]: '58同城',
  [SourceChannel.SHIPINHAO]: '视频号',
  [SourceChannel.DOUYIN]: '抖音',
  [SourceChannel.REFERRAL]: '转介绍',
};

// 业务类型显示文本
export const BUSINESS_TYPE_TEXT = {
  [BusinessType.WHOLE_RENT]: '整租',
  [BusinessType.CENTRALIZED]: '集中式',
  [BusinessType.SHARED_RENT]: '合租',
};

// 房型显示文本
export const ROOM_TYPE_TEXT = {
  [RoomType.ONE_BEDROOM]: '一居室',
  [RoomType.TWO_BEDROOM]: '两居室',
  [RoomType.THREE_BEDROOM]: '三居室',
  [RoomType.FOUR_PLUS_BEDROOM]: '四居及以上',
  [RoomType.MASTER_ROOM]: '主卧',
  [RoomType.SECOND_ROOM]: '次卧',
};

// 房型标签显示文本
export const ROOM_TAG_TEXT = {
  [RoomTag.STUDIO]: '开间',
  [RoomTag.LOFT]: 'loft',
  [RoomTag.FLAT]: '平层',
  [RoomTag.TWO_BATHROOM]: '两卫',
  [RoomTag.BUNGALOW]: '平房',
};

// 字符串键的业务类型显示文本 (用于数据库字符串值)
export const BUSINESS_TYPE_TEXT_BY_STRING = {
  'whole_rent': '整租',
  'centralized': '集中式',
  'shared_rent': '合租',
};

// 字符串键的房型显示文本 (用于数据库字符串值)
export const ROOM_TYPE_TEXT_BY_STRING = {
  'one_bedroom': '一居室',
  'two_bedroom': '两居室',
  'three_bedroom': '三居室',
  'four_plus_bedroom': '四居及以上',
  'master_room': '主卧',
  'second_room': '次卧',
};

// 字符串键的房型标签显示文本 (用于数据库字符串值)
export const ROOM_TAG_TEXT_BY_STRING = {
  'studio': '开间',
  'loft': 'loft',
  'flat': '平层',
  'two_bathroom': '两卫',
  'bungalow': '平房',
};

// 字符串键的来源渠道显示文本 (用于数据库字符串值)
export const SOURCE_CHANNEL_TEXT_BY_STRING = {
  'xianyu': '闲鱼',
  'xiaohongshu': '小红书',
  'beike': '贝壳',
  '58tongcheng': '58同城',
  'shipinhao': '视频号',
  'douyin': '抖音',
  'referral': '转介绍',
};

// 带看人类型显示文本
export const VIEWER_TYPE_TEXT = {
  [ViewerType.INTERNAL]: '内部管家',
  [ViewerType.EXTERNAL]: '外部管家',
  [ViewerType.EXTERNAL_SALES]: '外销管家',
  [ViewerType.CREATOR]: '录入人',
};

// 字符串键的带看人类型显示文本 (用于数据库字符串值)
export const VIEWER_TYPE_TEXT_BY_STRING = {
  'internal': '内部管家',
  'external': '外部管家',
  'external_sales': '外销管家',
  'creator': '录入人',
};

// 带看状态显示文本
export const VIEWING_STATUS_TEXT = {
  [ViewingStatus.PENDING]: '待确认',
  [ViewingStatus.CONFIRMED]: '已确认',
  [ViewingStatus.CANCELLED]: '已取消',
  [ViewingStatus.COMPLETED]: '已带看',
};

// 带看状态颜色
export const VIEWING_STATUS_COLOR = {
  [ViewingStatus.PENDING]: 'blue',
  [ViewingStatus.CONFIRMED]: 'orange',
  [ViewingStatus.CANCELLED]: 'red',
  [ViewingStatus.COMPLETED]: 'green',
};

// 带看反馈显示文本
export const VIEWING_FEEDBACK_TEXT = {
  [ViewingFeedback.NOT_DEAL]: '未成交',
  [ViewingFeedback.DEAL]: '已成交',
};

// 带看反馈颜色
export const VIEWING_FEEDBACK_COLOR = {
  [ViewingFeedback.NOT_DEAL]: 'red',
  [ViewingFeedback.DEAL]: 'green',
};

// 预约带看状态显示文本
export const APPOINTMENT_STATUS_TEXT = {
  [AppointmentStatus.PENDING]: '待确认',
  [AppointmentStatus.CONFIRMED]: '已确认',
  [AppointmentStatus.IN_PROGRESS]: '进行中',
  [AppointmentStatus.COMPLETED]: '已完成',
  [AppointmentStatus.CANCELLED]: '已取消',
};

// 预约带看状态颜色
export const APPOINTMENT_STATUS_COLOR = {
  [AppointmentStatus.PENDING]: 'blue',
  [AppointmentStatus.CONFIRMED]: 'orange',
  [AppointmentStatus.IN_PROGRESS]: 'purple',
  [AppointmentStatus.COMPLETED]: 'green',
  [AppointmentStatus.CANCELLED]: 'red',
};

// 租赁周期显示文本
export const LEASE_PERIOD_TEXT = {
  [LeasePeriod.ONE_MONTH]: '一个月',
  [LeasePeriod.TWO_MONTHS]: '两个月',
  [LeasePeriod.THREE_MONTHS]: '三个月',
  [LeasePeriod.FOUR_MONTHS]: '四个月',
  [LeasePeriod.FIVE_MONTHS]: '五个月',
  [LeasePeriod.SIX_MONTHS]: '六个月',
  [LeasePeriod.ONE_YEAR]: '一年',
  [LeasePeriod.TWO_YEARS]: '两年',
  [LeasePeriod.THREE_PLUS_YEARS]: '三年及以上',
};

// 默认分页大小
export const DEFAULT_PAGE_SIZE = 6;

// 表格列的默认宽度
export const DEFAULT_COLUMN_WIDTH = {
  id: 80,
  name: 120,
  phone: 130,
  status: 120,
  community: 150,
  price: 120,
  commission: 100,
  count: 80,
  source: 100,
  creator: 100,
  actions: 180,
  date: 140,
  datetime: 160,
};

// 价格输入正则表达式
export const PRICE_RANGE_REGEX = /^\d{1,9}(\.\d{1,2})?-\d{1,9}(\.\d{1,2})?$/;

// 手机号正则表达式
export const PHONE_REGEX = /^1[3-9]\d{9}$/; 