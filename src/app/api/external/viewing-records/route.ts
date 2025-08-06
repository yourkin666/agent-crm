import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { withErrorHandler, createDatabaseError, createSuccessResponse, createValidationError } from '@/lib/api-error-handler';
import { createRequestLogger } from '@/lib/logger';

// 生成请求ID的辅助函数
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 外部带看记录数据验证
function validateExternalViewingData(data: any): void {
  // 必填字段验证
  if (!data.userId) {
    throw createValidationError('userId为必填字段');
  }
  
  if (!data.property_name) {
    throw createValidationError('property_name为必填字段');
  }

  // 移除所有其他数据限制，允许接收任何格式的数据
}

// 从带看记录数据中提取客户信息
function extractCustomerDataFromViewing(viewingData: any) {
  return {
    userId: viewingData.userId,
    botId: viewingData.botId,
    nickname: viewingData.customer_name || undefined, // 使用customer_name作为nickname
    name: viewingData.customer_name || undefined,
    phone: viewingData.customer_phone || undefined,
    community: viewingData.property_name || undefined, // 将物业地址作为咨询小区
    business_type: viewingData.business_type || 'whole_rent',
    room_type: viewingData.room_type || 'one_bedroom',
    room_tags: viewingData.room_tag ? JSON.stringify([viewingData.room_tag]) : undefined,
    source_channel: 'referral', // 外部来源默认为推荐
    creator: '外部Agent系统',
    internal_notes: `由带看记录自动创建/更新。房源：${viewingData.property_name}${viewingData.property_address ? `，地址：${viewingData.property_address}` : ''}${viewingData.cityName ? `，城市：${viewingData.cityName}` : ''}${viewingData.houseAreaName ? `，区域：${viewingData.houseAreaName}` : ''}`
  };
}

// POST /api/external/viewing-records - 外部带看记录录入（智能客户处理）
export const POST = withErrorHandler(async (request: NextRequest) => {
  const requestId = generateRequestId();
  const requestLogger = createRequestLogger(requestId);

  // 记录请求开始
  requestLogger.info({
    method: 'POST',
    url: '/api/external/viewing-records',
    userAgent: request.headers.get('user-agent'),
    requestId
  }, '外部API请求开始 - 录入带看记录数据');

  const body = await request.json();

  // 记录请求数据（敏感信息脱敏）
  requestLogger.debug({
    viewingData: {
      userId: body.userId,
      customer_name: body.customer_name,
      hasCustomerPhone: !!body.customer_phone,
      property_name: body.property_name,
      business_type: body.business_type,
      room_type: body.room_type,
      viewing_status: body.viewing_status,
      commission: body.commission
    },
    requestId
  }, '外部带看记录录入请求解析完成');

  // 验证输入数据
  validateExternalViewingData(body);

  try {
    const db = await getDatabase();

    const {
      userId,
      botId,
      customer_name,
      customer_phone,
      viewing_time,
      property_name,
      property_address,
      room_type = 'one_bedroom',
      room_tag,
      viewer_name = 'external',
      viewing_status = 1,
      commission = 0,
      viewing_feedback,
      business_type = 'whole_rent',
      notes,
      // 扩展字段
      housingId,
      houseAreaId,
      houseAreaName,
      cityId,
      cityName,
      propertyAddrId,
      unitType,
      longitude,
      latitude,
      roomId,
      advisorId,
      advisorName,
      companyName,
      companyAbbreviation,
      houseTypeId
    } = body;

    let customerId = null;
    let customerAction = 'none';

    // 步骤1: 根据userId查找客户
    requestLogger.debug({
      userId,
      requestId
    }, '开始查找客户');

    const existingCustomer = await db.get(
      'SELECT id, name, phone, community FROM customers WHERE userId = ?',
      [userId]
    );

    if (existingCustomer) {
      // 步骤2a: 客户存在，更新客户数据
      customerId = existingCustomer.id;
      customerAction = 'updated';

      requestLogger.info({
        userId,
        customerId,
        existingCustomerName: existingCustomer.name,
        requestId
      }, '客户已存在，将更新客户数据');

      // 从带看数据中提取客户信息进行更新
      const customerUpdateData = extractCustomerDataFromViewing(body);

      await db.run(`
        UPDATE customers SET 
          botId = COALESCE(?, botId),
          nickname = COALESCE(?, nickname),
          name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          community = COALESCE(?, community),
          business_type = COALESCE(?, business_type),
          room_type = COALESCE(?, room_type),
          room_tags = COALESCE(?, room_tags),
          source_channel = COALESCE(?, source_channel),
          creator = COALESCE(?, creator),
          internal_notes = COALESCE(?, internal_notes),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        customerUpdateData.botId,
        customerUpdateData.nickname,
        customerUpdateData.name,
        customerUpdateData.phone,
        customerUpdateData.community,
        customerUpdateData.business_type,
        customerUpdateData.room_type,
        customerUpdateData.room_tags,
        customerUpdateData.source_channel,
        customerUpdateData.creator,
        customerUpdateData.internal_notes,
        customerId
      ]);

      requestLogger.debug({
        customerId,
        userId,
        requestId
      }, '客户数据更新完成');

    } else {
      // 步骤2b: 客户不存在，创建新客户
      customerAction = 'created';

      requestLogger.info({
        userId,
        customer_name,
        requestId
      }, '客户不存在，将创建新客户');

      // 从带看数据中提取客户信息进行创建
      const customerCreateData = extractCustomerDataFromViewing(body);

      const customerResult = await db.run(`
        INSERT INTO customers (
          userId, botId, nickname, name, phone,
          status, community, business_type, room_type, room_tags,
          source_channel, creator, is_agent, internal_notes
        ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, 0, ?)
      `, [
        customerCreateData.userId,
        customerCreateData.botId,
        customerCreateData.nickname,
        customerCreateData.name,
        customerCreateData.phone,
        customerCreateData.community,
        customerCreateData.business_type,
        customerCreateData.room_type,
        customerCreateData.room_tags,
        customerCreateData.source_channel,
        customerCreateData.creator,
        customerCreateData.internal_notes
      ]);

      if (customerResult.lastID) {
        customerId = customerResult.lastID;
        requestLogger.debug({
          customerId,
          userId,
          customer_name,
          requestId
        }, '新客户创建完成');
      }
    }

    // 步骤3: 创建带看记录
    requestLogger.debug({
      customerId,
      userId,
      property_name,
      requestId
    }, '开始创建带看记录');

    const viewingResult = await db.run(`
      INSERT INTO viewing_records (
        customer_id, viewing_time, property_name, property_address,
        room_type, room_tag, viewer_name, viewing_status, commission,
        viewing_feedback, business_type, notes, customer_name, customer_phone,
        userId, botId, housingId, houseAreaId, houseAreaName, cityId, cityName,
        propertyAddrId, unitType, longitude, latitude, roomId, advisorId,
        advisorName, companyName, companyAbbreviation, houseTypeId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      customerId,
      viewing_time || new Date().toISOString(),
      property_name,
      property_address,
      room_type,
      room_tag,
      viewer_name,
      viewing_status,
      commission,
      viewing_feedback,
      business_type,
      notes,
      customer_name || '',
      customer_phone || '',
      userId,
      botId,
      housingId,
      houseAreaId,
      houseAreaName,
      cityId,
      cityName,
      propertyAddrId,
      unitType,
      longitude,
      latitude,
      roomId,
      advisorId,
      advisorName,
      companyName,
      companyAbbreviation,
      houseTypeId
    ]);

    // 步骤4: 更新客户统计信息
    if (customerId && viewingResult.lastID) {
      requestLogger.debug({
        customerId,
        requestId
      }, '开始更新客户统计信息');

      await db.run(`
        UPDATE customers 
        SET 
          viewing_count = (SELECT COUNT(*) FROM viewing_records WHERE customer_id = ?),
          total_commission = (SELECT COALESCE(SUM(commission), 0) FROM viewing_records WHERE customer_id = ?),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [customerId, customerId, customerId]);

      requestLogger.info({
        statusCode: 201,
        customerId,
        customerAction,
        viewingRecordId: viewingResult.lastID,
        userId,
        customer_name,
        property_name,
        commission,
        requestId
      }, '外部API请求成功完成 - 带看记录录入成功');

      return createSuccessResponse(
        {
          viewing_record_id: viewingResult.lastID,
          customer_id: customerId,
          customer_action: customerAction,
          userId
        },
        `带看记录录入成功，客户${customerAction === 'created' ? '已创建' : '已更新'}`,
        201
      );
    }

  } catch (error) {
    requestLogger.error({
      error: error instanceof Error ? error.message : error,
      userId: body.userId,
      property_name: body.property_name,
      requestId
    }, '外部API请求失败 - 带看记录录入失败');

    throw error; // 重新抛出错误让错误处理器处理
  }
}); 