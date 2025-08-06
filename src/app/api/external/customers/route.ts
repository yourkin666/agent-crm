import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { withErrorHandler, createDatabaseError, createSuccessResponse, createValidationError } from '@/lib/api-error-handler';
import { createRequestLogger } from '@/lib/logger';

// 生成请求ID的辅助函数
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 外部客户数据验证
function validateExternalCustomerData(data: any): void {
  // 必填字段验证
  if (!data.userId) {
    throw createValidationError('userId为必填字段');
  }

  // 移除所有其他数据限制，允许接收任何格式的数据
}

// POST /api/external/customers - 外部客户数据录入
export const POST = withErrorHandler(async (request: NextRequest) => {
  const requestId = generateRequestId();
  const requestLogger = createRequestLogger(requestId);

  // 记录请求开始
  requestLogger.info({
    method: 'POST',
    url: '/api/external/customers',
    userAgent: request.headers.get('user-agent'),
    requestId
  }, '外部API请求开始 - 录入客户数据');

  const body = await request.json();

  // 记录请求数据（敏感信息脱敏）
  requestLogger.debug({
    customerData: {
      userId: body.userId,
      nickname: body.nickname,
      name: body.name,
      hasPhone: !!body.phone,
      community: body.community,
      business_type: body.business_type,
      room_type: body.room_type,
      source_channel: body.source_channel,
      status: body.status
    },
    requestId
  }, '外部客户数据录入请求解析完成');

  // 验证输入数据
  validateExternalCustomerData(body);

  try {
    const db = await getDatabase();

    const {
      userId,
      botId,
      nickname,
      name,
      phone,
      backup_phone,
      wechat,
      status = 1,
      community,
      business_type = 'whole_rent',
      room_type = 'one_bedroom',
      room_tags,
      move_in_date,
      lease_period,
      price_range,
      source_channel = 'referral',
      creator = '外部系统',
      internal_notes
    } = body;

    // 检查是否已存在相同userId的客户
    const existingCustomer = await db.get(
      'SELECT id, name, phone FROM customers WHERE userId = ?',
      [userId]
    );

    if (existingCustomer) {
      requestLogger.info({
        userId,
        existingCustomerId: existingCustomer.id,
        existingCustomerName: existingCustomer.name,
        requestId
      }, '客户已存在，将进行更新操作');

      // 更新现有客户
      const result = await db.run(`
        UPDATE customers SET 
          botId = COALESCE(?, botId),
          nickname = COALESCE(?, nickname),
          name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          backup_phone = COALESCE(?, backup_phone),
          wechat = COALESCE(?, wechat),
          status = COALESCE(?, status),
          community = COALESCE(?, community),
          business_type = COALESCE(?, business_type),
          room_type = COALESCE(?, room_type),
          room_tags = COALESCE(?, room_tags),
          move_in_date = COALESCE(?, move_in_date),
          lease_period = COALESCE(?, lease_period),
          price_range = COALESCE(?, price_range),
          source_channel = COALESCE(?, source_channel),
          creator = COALESCE(?, creator),
          internal_notes = COALESCE(?, internal_notes),
          updated_at = CURRENT_TIMESTAMP
        WHERE userId = ?
      `, [
        botId, nickname, name, phone, backup_phone, wechat, status,
        community, business_type, room_type, room_tags, move_in_date,
        lease_period, price_range, source_channel, creator, internal_notes,
        userId
      ]);

      requestLogger.info({
        statusCode: 200,
        customerId: existingCustomer.id,
        userId,
        name: name || existingCustomer.name,
        requestId
      }, '外部API请求成功完成 - 客户数据更新成功');

      return createSuccessResponse(
        { 
          id: existingCustomer.id, 
          userId,
          action: 'updated'
        },
        '客户数据更新成功'
      );
    } else {
      requestLogger.debug({
        userId,
        requestId
      }, '客户不存在，将创建新客户');

      // 创建新客户
      const result = await db.run(`
        INSERT INTO customers (
          userId, botId, nickname, name, phone, backup_phone, wechat,
          status, community, business_type, room_type, room_tags,
          move_in_date, lease_period, price_range, source_channel,
          creator, is_agent, internal_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `, [
        userId, botId, nickname, name, phone, backup_phone, wechat,
        status, community, business_type, room_type, room_tags,
        move_in_date, lease_period, price_range, source_channel,
        creator, internal_notes
      ]);

      if (result.lastID) {
        requestLogger.info({
          statusCode: 201,
          customerId: result.lastID,
          userId,
          name,
          requestId
        }, '外部API请求成功完成 - 新客户创建成功');

        return createSuccessResponse(
          { 
            id: result.lastID, 
            userId,
            action: 'created'
          },
          '新客户创建成功',
          201
        );
      }
    }

  } catch (error) {
    requestLogger.error({
      error: error instanceof Error ? error.message : error,
      userId: body.userId,
      requestId
    }, '外部API请求失败 - 客户数据录入失败');

    throw error; // 重新抛出错误让错误处理器处理
  }
}); 