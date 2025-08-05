import { createValidationError } from './api-error-handler';

/**
 * 验证手机号格式
 */
export function validatePhoneNumber(phone: string): void {
  if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
    throw createValidationError('手机号格式不正确');
  }
}

/**
 * 验证数字范围
 */
export function validateNumberRange(value: number, min: number, max: number, fieldName: string): void {
  if (value !== undefined && value !== null && (value < min || value > max)) {
    throw createValidationError(`${fieldName}必须在${min}到${max}之间`);
  }
}

/**
 * 验证字符串长度
 */
export function validateStringLength(value: string, maxLength: number, fieldName: string): void {
  if (value && value.length > maxLength) {
    throw createValidationError(`${fieldName}长度不能超过${maxLength}个字符`);
  }
}

/**
 * 验证客户数据
 */
export function validateCustomerData(data: any): void {
  // 验证手机号格式（如果提供）
  if (data.phone) {
    validatePhoneNumber(data.phone);
  }
  
  // 验证备用手机号格式（如果提供）
  if (data.backup_phone) {
    validatePhoneNumber(data.backup_phone);
  }
  
  // 验证状态值（如果提供）
  if (data.status !== undefined) {
    validateNumberRange(data.status, 1, 5, '客户状态');
  }
  
  // 验证字段长度（如果提供）
  if (data.name) {
    validateStringLength(data.name, 50, '客户姓名');
  }
  if (data.wechat) {
    validateStringLength(data.wechat, 50, '微信号');
  }
  if (data.community) {
    validateStringLength(data.community, 100, '咨询小区');
  }
  if (data.price_range) {
    validateStringLength(data.price_range, 20, '价格区间');
  }
  if (data.creator) {
    validateStringLength(data.creator, 50, '录入人');
  }
  if (data.internal_notes) {
    validateStringLength(data.internal_notes, 300, '内部备注');
  }
}

/**
 * 验证预约数据
 */
export function validateAppointmentData(data: any): void {
  // 验证客户手机号格式（如果提供）
  if (data.customer_phone) {
    validatePhoneNumber(data.customer_phone);
  }
  
  // 验证状态值（如果提供）
  if (data.status !== undefined) {
    validateNumberRange(data.status, 1, 5, '预约状态');
  }
  
  // 验证字段长度（如果提供）
  if (data.property_name) {
    validateStringLength(data.property_name, 100, '物业名称');
  }
  if (data.property_address) {
    validateStringLength(data.property_address, 200, '房间地址');
  }
  if (data.customer_name) {
    validateStringLength(data.customer_name, 50, '客户姓名');
  }
  if (data.agent_name) {
    validateStringLength(data.agent_name, 50, '经纪人');
  }
  if (data.city) {
    validateStringLength(data.city, 50, '城市');
  }
}

/**
 * 验证带看记录数据
 */
export function validateViewingRecordData(data: any): void {
  // 客户ID是带看记录的关键字段，但也允许为空（由业务逻辑处理）
  
  // 验证佣金（如果提供）
  if (data.commission !== undefined) {
    validateNumberRange(data.commission, 0, 999999, '佣金');
  }
  
  // 验证状态值（如果提供）
  if (data.viewing_status !== undefined) {
    validateNumberRange(data.viewing_status, 1, 4, '带看状态');
  }
  
  // 验证反馈值（如果提供）
  if (data.viewing_feedback !== undefined) {
    validateNumberRange(data.viewing_feedback, 0, 1, '带看反馈');
  }
  
  // 验证字段长度（如果提供）
  if (data.property_name) {
    validateStringLength(data.property_name, 100, '带看楼盘');
  }
  if (data.property_address) {
    validateStringLength(data.property_address, 200, '楼盘地址');
  }
  if (data.notes) {
    validateStringLength(data.notes, 500, '备注');
  }
} 