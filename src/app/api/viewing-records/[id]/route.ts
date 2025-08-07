import { NextRequest, NextResponse } from 'next/server';
import { dbManager } from '@/lib/database';
import { withErrorHandler, createDatabaseError, createSuccessResponse, createNotFoundError } from '@/lib/api-error-handler';
import { createRequestLogger } from '@/lib/logger';
import { validateViewingRecordData } from '@/lib/validation';

// 生成请求ID的辅助函数
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// GET /api/viewing-records/[id] - 获取单个带看记录详情
export const GET = withErrorHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const requestId = generateRequestId();
  const requestLogger = createRequestLogger(requestId);

  const id = params.id;

  // 记录请求开始
  requestLogger.info({
    method: 'GET',
    url: `/api/viewing-records/${id}`,
    userAgent: request.headers.get('user-agent'),
    recordId: id,
    requestId
  }, 'API请求开始 - 获取带看记录详情');

  try {
    // 查询带看记录详情
    const record = await dbManager.queryOne(`
      SELECT 
        id,
        customer_id,
        viewing_time,
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
        customer_name,
        customer_phone,
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
        houseTypeId,
        created_at,
        updated_at
      FROM qft_ai_viewing_records 
      WHERE id = ?
    `, [id]);

    if (!record) {
      requestLogger.warn({
        recordId: id,
        requestId
      }, '带看记录不存在');
      throw createNotFoundError('带看记录');
    }

    requestLogger.info({
      recordId: id,
      propertyName: record.property_name,
      customerName: record.customer_name,
      requestId
    }, '带看记录详情获取成功');

    return NextResponse.json({
      success: true,
      data: record
    });

  } catch (error) {
    requestLogger.error({
      error: error instanceof Error ? error.message : error,
      recordId: id,
      requestId
    }, '获取带看记录详情失败');

    throw createDatabaseError('获取带看记录详情', error as Error);
  }
});

// PUT /api/viewing-records/[id] - 更新带看记录
export const PUT = withErrorHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const requestId = generateRequestId();
  const requestLogger = createRequestLogger(requestId);

  const id = params.id;
  const body = await request.json();

  // 记录请求开始
  requestLogger.info({
    method: 'PUT',
    url: `/api/viewing-records/${id}`,
    userAgent: request.headers.get('user-agent'),
    recordId: id,
    requestId
  }, 'API请求开始 - 更新带看记录');

  // 记录请求数据（敏感信息脱敏）
  requestLogger.debug({
    updateData: {
      property_name: body.property_name,
      property_address: body.property_address,
      room_type: body.room_type,
      viewer_name: body.viewer_name,
      viewing_status: body.viewing_status,
      commission: body.commission,
      business_type: body.business_type,
      hasNotes: !!body.notes
    },
    recordId: id,
    requestId
  }, '带看记录更新请求数据解析完成');

  // 验证输入数据
  validateViewingRecordData(body);

  try {
    // 检查记录是否存在
    const existingRecord = await dbManager.queryOne('SELECT id, customer_id FROM qft_ai_viewing_records WHERE id = ?', [id]);
    
    if (!existingRecord) {
      requestLogger.warn({
        recordId: id,
        requestId
      }, '要更新的带看记录不存在');
      throw createNotFoundError('带看记录');
    }

    const {
      viewing_time,
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
      // 扩展字段
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
    } = body;

    requestLogger.debug({
      recordId: id,
      requestId
    }, '开始更新带看记录');

    // 更新带看记录
    const result = await dbManager.execute(`
      UPDATE qft_ai_viewing_records SET 
        viewing_time = COALESCE(?, viewing_time),
        property_name = COALESCE(?, property_name),
        property_address = ?,
        room_type = COALESCE(?, room_type),
        room_tag = ?,
        viewer_name = COALESCE(?, viewer_name),
        viewing_status = COALESCE(?, viewing_status),
        commission = COALESCE(?, commission),
        viewing_feedback = ?,
        business_type = COALESCE(?, business_type),
        notes = ?,
        userId = ?,
        botId = ?,
        housingId = ?,
        houseAreaId = ?,
        houseAreaName = ?,
        cityId = ?,
        cityName = ?,
        propertyAddrId = ?,
        unitType = ?,
        longitude = ?,
        latitude = ?,
        roomId = ?,
        advisorId = ?,
        advisorName = ?,
        companyName = ?,
        companyAbbreviation = ?,
        houseTypeId = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      viewing_time ? new Date(viewing_time).toISOString().slice(0, 19).replace('T', ' ') : null,
      property_name || null,
      property_address || null,
      room_type || null,
      room_tag || null,
      viewer_name || null,
      viewing_status || null,
      commission || null,
      viewing_feedback !== undefined && viewing_feedback !== null ? viewing_feedback : null,
      business_type || null,
      notes || null,
      userId || null,
      botId || null,
      housingId || null,
      houseAreaId || null,
      houseAreaName || null,
      cityId || null,
      cityName || null,
      propertyAddrId || null,
      unitType || null,
      longitude || null,
      latitude || null,
      roomId || null,
      advisorId || null,
      advisorName || null,
      companyName || null,
      companyAbbreviation || null,
      houseTypeId || null,
      id
    ]);

    if (result.changes === 0) {
      requestLogger.warn({
        recordId: id,
        requestId
      }, '没有记录被更新');
      throw createNotFoundError('带看记录');
    }

    // 如果有关联的客户，重新计算客户统计信息
    if (existingRecord.customer_id) {
      requestLogger.debug({
        customerId: existingRecord.customer_id,
        recordId: id,
        requestId
      }, '开始更新客户统计信息');

      await dbManager.execute(`
        UPDATE qft_ai_customers 
        SET 
          viewing_count = (SELECT COUNT(*) FROM qft_ai_viewing_records WHERE customer_id = ?),
          total_commission = (SELECT COALESCE(SUM(commission), 0) FROM qft_ai_viewing_records WHERE customer_id = ?),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [existingRecord.customer_id, existingRecord.customer_id, existingRecord.customer_id]);

      requestLogger.debug({
        customerId: existingRecord.customer_id,
        requestId
      }, '客户统计信息更新完成');
    }

    requestLogger.info({
      statusCode: 200,
      recordId: id,
      property_name,
      commission,
      requestId
    }, 'API请求成功完成 - 带看记录更新成功');

    return createSuccessResponse(
      { id: parseInt(id) },
      '带看记录更新成功'
    );

  } catch (error) {
    requestLogger.error({
      error: error instanceof Error ? error.message : error,
      recordId: id,
      requestId
    }, 'API请求失败 - 带看记录更新失败');

    throw error; // 重新抛出错误让错误处理器处理
  }
}); 