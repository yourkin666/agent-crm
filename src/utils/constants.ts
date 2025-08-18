import { 
  CustomerStatus, SourceChannel, BusinessType, RoomType, RoomTag,
  ViewerType, ViewingStatus, ViewingFeedback, LeasePeriod
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

// 城市列表 - 全国主要城市
export const CITY_LIST = [
  // 直辖市
  '北京',
  '上海',
  '天津',
  '重庆',
  
  // 华北地区
  '石家庄',
  '唐山',
  '秦皇岛',
  '邯郸',
  '邢台',
  '保定',
  '张家口',
  '承德',
  '沧州',
  '廊坊',
  '衡水',
  '太原',
  '大同',
  '阳泉',
  '长治',
  '晋城',
  '朔州',
  '晋中',
  '运城',
  '忻州',
  '临汾',
  '吕梁',
  '呼和浩特',
  '包头',
  '乌海',
  '赤峰',
  '通辽',
  '鄂尔多斯',
  '呼伦贝尔',
  '巴彦淖尔',
  '乌兰察布',
  
  // 东北地区
  '沈阳',
  '大连',
  '鞍山',
  '抚顺',
  '本溪',
  '丹东',
  '锦州',
  '营口',
  '阜新',
  '辽阳',
  '盘锦',
  '铁岭',
  '朝阳',
  '葫芦岛',
  '长春',
  '吉林',
  '四平',
  '辽源',
  '通化',
  '白山',
  '松原',
  '白城',
  '延边',
  '哈尔滨',
  '齐齐哈尔',
  '鸡西',
  '鹤岗',
  '双鸭山',
  '大庆',
  '伊春',
  '佳木斯',
  '七台河',
  '牡丹江',
  '黑河',
  '绥化',
  '大兴安岭',
  
  // 华东地区
  '南京',
  '无锡',
  '徐州',
  '常州',
  '苏州',
  '南通',
  '连云港',
  '淮安',
  '盐城',
  '扬州',
  '镇江',
  '泰州',
  '宿迁',
  '杭州',
  '宁波',
  '温州',
  '嘉兴',
  '湖州',
  '绍兴',
  '金华',
  '衢州',
  '舟山',
  '台州',
  '丽水',
  '合肥',
  '芜湖',
  '蚌埠',
  '淮南',
  '马鞍山',
  '淮北',
  '铜陵',
  '安庆',
  '黄山',
  '滁州',
  '阜阳',
  '宿州',
  '六安',
  '亳州',
  '池州',
  '宣城',
  '福州',
  '厦门',
  '莆田',
  '三明',
  '泉州',
  '漳州',
  '南平',
  '龙岩',
  '宁德',
  '南昌',
  '景德镇',
  '萍乡',
  '九江',
  '新余',
  '鹰潭',
  '赣州',
  '吉安',
  '宜春',
  '抚州',
  '上饶',
  '济南',
  '青岛',
  '淄博',
  '枣庄',
  '东营',
  '烟台',
  '潍坊',
  '济宁',
  '泰安',
  '威海',
  '日照',
  '莱芜',
  '临沂',
  '德州',
  '聊城',
  '滨州',
  '菏泽',
  
  // 华中地区
  '郑州',
  '开封',
  '洛阳',
  '平顶山',
  '安阳',
  '鹤壁',
  '新乡',
  '焦作',
  '濮阳',
  '许昌',
  '漯河',
  '三门峡',
  '南阳',
  '商丘',
  '信阳',
  '周口',
  '驻马店',
  '济源',
  '武汉',
  '黄石',
  '十堰',
  '宜昌',
  '襄阳',
  '鄂州',
  '荆门',
  '孝感',
  '荆州',
  '黄冈',
  '咸宁',
  '随州',
  '恩施',
  '长沙',
  '株洲',
  '湘潭',
  '衡阳',
  '邵阳',
  '岳阳',
  '常德',
  '张家界',
  '益阳',
  '郴州',
  '永州',
  '怀化',
  '娄底',
  '湘西',
  
  // 华南地区
  '广州',
  '韶关',
  '深圳',
  '珠海',
  '汕头',
  '佛山',
  '江门',
  '湛江',
  '茂名',
  '肇庆',
  '惠州',
  '梅州',
  '汕尾',
  '河源',
  '阳江',
  '清远',
  '东莞',
  '中山',
  '潮州',
  '揭阳',
  '云浮',
  '南宁',
  '柳州',
  '桂林',
  '梧州',
  '北海',
  '防城港',
  '钦州',
  '贵港',
  '玉林',
  '百色',
  '贺州',
  '河池',
  '来宾',
  '崇左',
  '海口',
  '三亚',
  '三沙',
  '儋州',
  
  // 西南地区
  '成都',
  '自贡',
  '攀枝花',
  '泸州',
  '德阳',
  '绵阳',
  '广元',
  '遂宁',
  '内江',
  '乐山',
  '南充',
  '眉山',
  '宜宾',
  '广安',
  '达州',
  '雅安',
  '巴中',
  '资阳',
  '阿坝',
  '甘孜',
  '凉山',
  '贵阳',
  '六盘水',
  '遵义',
  '安顺',
  '毕节',
  '铜仁',
  '黔西南',
  '黔东南',
  '黔南',
  '昆明',
  '曲靖',
  '玉溪',
  '保山',
  '昭通',
  '丽江',
  '普洱',
  '临沧',
  '楚雄',
  '红河',
  '文山',
  '西双版纳',
  '大理',
  '德宏',
  '怒江',
  '迪庆',
  '拉萨',
  '日喀则',
  '昌都',
  '林芝',
  '山南',
  '那曲',
  '阿里',
  
  // 西北地区
  '西安',
  '铜川',
  '宝鸡',
  '咸阳',
  '渭南',
  '延安',
  '汉中',
  '榆林',
  '安康',
  '商洛',
  '兰州',
  '嘉峪关',
  '金昌',
  '白银',
  '天水',
  '武威',
  '张掖',
  '平凉',
  '酒泉',
  '庆阳',
  '定西',
  '陇南',
  '临夏',
  '甘南',
  '西宁',
  '海东',
  '海北',
  '黄南',
  '海南',
  '果洛',
  '玉树',
  '海西',
  '银川',
  '石嘴山',
  '吴忠',
  '固原',
  '中卫',
  '乌鲁木齐',
  '克拉玛依',
  '吐鲁番',
  '哈密',
  '昌吉',
  '博尔塔拉',
  '巴音郭楞',
  '阿克苏',
  '克孜勒苏',
  '喀什',
  '和田',
  '伊犁',
  '塔城',
  '阿勒泰',
  
  // 其他
  '其他'
]; 