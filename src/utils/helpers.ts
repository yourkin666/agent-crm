import dayjs from 'dayjs';
import { RoomTag, BusinessType, RoomType } from '@/types';
import {
  BUSINESS_TYPE_TEXT, ROOM_TYPE_TEXT, ROOM_TAG_TEXT,
  BUSINESS_TYPE_TEXT_BY_STRING, ROOM_TYPE_TEXT_BY_STRING, ROOM_TAG_TEXT_BY_STRING,
  PHONE_REGEX, PRICE_RANGE_REGEX
} from './constants';

/**
 * 格式化手机号显示
 * @param phone 手机号
 * @returns 格式化后的手机号 (如: 138****1234)
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  if (phone.length === 11) {
    return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
  }
  return phone;
}

/**
 * 格式化货币显示
 * @param amount 金额
 * @param currency 货币符号，默认为 ¥
 * @returns 格式化后的金额 (如: ¥1,234.56)
 */
export function formatCurrency(amount: number, currency: string = '¥'): string {
  if (amount === 0) return `${currency}0`;
  return `${currency}${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * 格式化手机号显示
 * @param phone 手机号
 * @returns 完整的手机号
 */
export function formatPhone(phone: string): string {
  if (!phone) return phone;
  return phone;
}

/**
 * 格式化日期显示
 * @param date 日期字符串
 * @param format 格式化模板，默认 YYYY-MM-DD
 * @returns 格式化后的日期
 */
export function formatDate(date: string | Date, format: string = 'YYYY-MM-DD'): string {
  if (!date) return '';
  return dayjs(date).format(format);
}

/**
 * 格式化日期时间显示
 * @param datetime 日期时间字符串
 * @returns 格式化后的日期时间
 */
export function formatDateTime(datetime: string | Date): string {
  return formatDate(datetime, 'YYYY-MM-DD HH:mm');
}

/**
 * 格式化金额显示
 * @param amount 金额
 * @param unit 单位，默认为元
 * @returns 格式化后的金额
 */
export function formatMoney(amount: number, unit: string = '元'): string {
  if (amount === 0) return `0${unit}`;
  return `${amount.toLocaleString()}${unit}`;
}

/**
 * 解析房型标签 JSON 字符串
 * @param tagsJson 房型标签 JSON 字符串
 * @returns 房型标签数组
 */
export function parseRoomTags(tagsJson: string | null): RoomTag[] {
  if (!tagsJson) return [];
  try {
    return JSON.parse(tagsJson);
  } catch {
    return [];
  }
}

/**
 * 格式化房型标签显示
 * @param tags 房型标签数组
 * @returns 格式化后的标签文本
 */
export function formatRoomTags(tags: RoomTag[]): string {
  if (!tags || tags.length === 0) return '';
  return tags.map(tag => ROOM_TAG_TEXT[tag]).join(', ');
}

/**
 * 格式化房型标签显示 (字符串版本)
 * @param tags 房型标签字符串数组
 * @returns 格式化后的标签文本
 */
export function formatRoomTagsByString(tags: string[]): string {
  if (!tags || tags.length === 0) return '';
  return tags.map(tag => (ROOM_TAG_TEXT_BY_STRING as Record<string, string>)[tag] || tag).join(', ');
}

/**
 * 组合需求房型显示文本
 * @param businessType 业务类型
 * @param roomType 房型
 * @param roomTags 房型标签
 * @returns 组合后的需求房型文本
 */
export function formatRequirement(
  businessType: BusinessType,
  roomType: RoomType,
  roomTags?: RoomTag[]
): string {
  const parts: string[] = [];

  parts.push(BUSINESS_TYPE_TEXT[businessType]);
  parts.push(ROOM_TYPE_TEXT[roomType]);

  if (roomTags && roomTags.length > 0) {
    parts.push(formatRoomTags(roomTags));
  }

  return parts.join(' - ');
}

/**
 * 组合需求房型显示文本 (字符串版本，用于数据库字符串值)
 * @param businessType 业务类型字符串
 * @param roomType 房型字符串
 * @param roomTags 房型标签字符串数组
 * @returns 组合后的需求房型文本
 */
export function formatRequirementByString(
  businessType: string,
  roomType: string,
  roomTags?: string[]
): string {
  const parts: string[] = [];

  parts.push((BUSINESS_TYPE_TEXT_BY_STRING as Record<string, string>)[businessType] || businessType);
  parts.push((ROOM_TYPE_TEXT_BY_STRING as Record<string, string>)[roomType] || roomType);

  if (roomTags && roomTags.length > 0) {
    parts.push(formatRoomTagsByString(roomTags));
  }

  return parts.join(' - ');
}

/**
 * 验证手机号格式
 * @param phone 手机号
 * @returns 是否有效
 */
export function validatePhone(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

/**
 * 验证价格区间格式
 * @param priceRange 价格区间字符串 (如 "5000-7000")
 * @returns 是否有效
 */
export function validatePriceRange(priceRange: string): boolean {
  return PRICE_RANGE_REGEX.test(priceRange);
}

/**
 * 解析价格区间
 * @param priceRange 价格区间字符串 (如 "5000-7000")
 * @returns {min: number, max: number} 或 null
 */
export function parsePriceRange(priceRange: string): { min: number; max: number } | null {
  if (!validatePriceRange(priceRange)) return null;

  const [minStr, maxStr] = priceRange.split('-');
  const min = parseFloat(minStr);
  const max = parseFloat(maxStr);

  return { min, max };
}

/**
 * 格式化录入信息显示
 * @param creator 录入人
 * @param isAgent 是否为人工录入
 * @returns 格式化后的录入信息
 */
export function formatCreator(creator: string, isAgent: boolean): string {
  const type = isAgent ? '人工' : 'agent';
  return `[${type}] ${creator}`;
}

/**
 * 安全解析 JSON
 * @param jsonStr JSON 字符串
 * @param defaultValue 默认值
 * @returns 解析后的对象或默认值
 */
export function safeParseJSON<T>(jsonStr: string | null, defaultValue: T): T {
  if (!jsonStr) return defaultValue;
  try {
    return JSON.parse(jsonStr);
  } catch {
    return defaultValue;
  }
}

/**
 * 生成唯一 ID
 * @returns 唯一 ID 字符串
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 延迟执行函数（防抖）
 * @param func 要执行的函数
 * @param wait 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 深拷贝对象
 * @param obj 要拷贝的对象
 * @returns 深拷贝后的对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      clonedObj[key] = deepClone(obj[key]);
    }
    return clonedObj;
  }
  return obj;
}

/**
 * 判断是否为空值
 * @param value 值
 * @returns 是否为空
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
} 