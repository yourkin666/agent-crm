import { NextRequest, NextResponse } from 'next/server';
import { dbManager } from '@/lib/database';
import { withErrorHandler, createDatabaseError, createNotFoundError } from '@/lib/api-error-handler';
import { createRequestLogger } from '@/lib/logger';
import { validateViewingRecordData } from '@/lib/validation';
import { ErrorWithStatusCode } from '@/types';
export const dynamic = 'force-dynamic';

// 生成请求ID的辅助函数
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function normalizeCityName(name?: string | null): string | null {
  if (!name) return null;
  return name.endsWith('市') ? name : `${name}市`;
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
    userAgent: request.headers?.get('user-agent') || 'unknown',
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

// 将任意可解析的时间值格式化为 MySQL DATETIME 字符串
function toMySQLDateTime(input?: string | null): string | null {
  if (!input) return null;
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

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
    userAgent: request.headers?.get('user-agent') || 'unknown',
    recordId: id,
    requestId
  }, 'API请求开始 - 更新带看记录');

  // 记录请求数据（敏感信息脱敏）
  requestLogger.debug({
    updateData: {
      property_name: body.property_name,
      property_address: body.property_address,
      cityName: body.cityName,
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
    const existingRecord = await dbManager.queryOne<{ id: number; customer_id: number | null }>('SELECT id, customer_id FROM qft_ai_viewing_records WHERE id = ?', [id]);
    
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
      cityName,
      room_type,
      room_tag,
      viewer_name,
      viewing_status,
      commission,
      viewing_feedback,
      business_type,
      notes,
    } = body;

    const normalizedCityName = normalizeCityName(cityName);

    // 统一时间格式
    const formattedViewingTime = viewing_time ? toMySQLDateTime(viewing_time) : null;

    // 更新带看记录
    const updateSql = `
      UPDATE qft_ai_viewing_records SET
        viewing_time = COALESCE(?, viewing_time),
        property_name = COALESCE(?, property_name),
        property_address = COALESCE(?, property_address),
        cityName = COALESCE(?, cityName),
        room_type = COALESCE(?, room_type),
        room_tag = COALESCE(?, room_tag),
        viewer_name = COALESCE(?, viewer_name),
        viewing_status = COALESCE(?, viewing_status),
        commission = COALESCE(?, commission),
        viewing_feedback = COALESCE(?, viewing_feedback),
        business_type = COALESCE(?, business_type),
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const paramsArr = [
      formattedViewingTime,
      property_name || null,
      property_address || null,
      normalizedCityName || null,
      room_type || null,
      room_tag || null,
      viewer_name || null,
      viewing_status || null,
      commission || null,
      viewing_feedback || null,
      business_type || null,
      notes || null,
      id
    ];

    const result = await dbManager.execute(updateSql, paramsArr);

    if (result.changes === 0) {
      throw createDatabaseError('更新带看记录失败');
    }

    // 检查是否需要联动更新客户状态
    if (existingRecord.customer_id) {
      // 检查该客户是否有任何带看记录的反馈为'已成交'
      const hasDealFeedback = await dbManager.queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM qft_ai_viewing_records WHERE customer_id = ? AND viewing_feedback = 1',
        [existingRecord.customer_id]
      );
      
      if (hasDealFeedback && hasDealFeedback.count > 0) {
        // 当客户有任何带看记录的反馈为'已成交'时，将客户状态更新为'已成交未结佣'
        const customerUpdateSql = `
          UPDATE qft_ai_customers 
          SET status = 4, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ? AND status != 4
        `;
        
        const customerResult = await dbManager.execute(customerUpdateSql, [existingRecord.customer_id]);
        
        if (customerResult.changes > 0) {
          requestLogger.info({
            recordId: id,
            customerId: existingRecord.customer_id,
            dealCount: hasDealFeedback.count,
            requestId
          }, '客户状态已联动更新为已成交未结佣（基于所有带看记录）');
        }
      }
    }

    // 获取更新后的记录
    const updatedRecord = await dbManager.queryOne('SELECT * FROM qft_ai_viewing_records WHERE id = ?', [id]);

    requestLogger.info({
      recordId: id,
      requestId
    }, '带看记录更新成功');

    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: '带看记录更新成功'
    });
  } catch (error) {
    requestLogger.error({
      error: error instanceof Error ? error.message : error,
      recordId: id,
      requestId
    }, '更新带看记录失败');

    throw createDatabaseError('更新带看记录', error as Error);
  }
}); 

// DELETE /api/viewing-records/[id] - 删除带看记录
export const DELETE = withErrorHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const requestId = generateRequestId();
  const requestLogger = createRequestLogger(requestId);

  const id = params.id;

  // 记录请求开始
  requestLogger.info({
    method: 'DELETE',
    url: `/api/viewing-records/${id}`,
    userAgent: request.headers?.get('user-agent') || 'unknown',
    recordId: id,
    requestId
  }, 'API请求开始 - 删除带看记录');

  try {
    // 检查记录是否存在
    const existingRecord = await dbManager.queryOne<{ id: number; customer_id: number | null }>(
      'SELECT id, customer_id FROM qft_ai_viewing_records WHERE id = ?', 
      [id]
    );
    
    if (!existingRecord) {
      requestLogger.warn({
        recordId: id,
        requestId
      }, '要删除的带看记录不存在');
      throw createNotFoundError('带看记录');
    }

    // 删除带看记录
    const result = await dbManager.execute(
      'DELETE FROM qft_ai_viewing_records WHERE id = ?',
      [id]
    );

    if (result.changes === 0) {
      throw createDatabaseError('删除带看记录失败');
    }

    // 如果删除的记录关联了客户，需要重新计算客户的带看次数和佣金
    if (existingRecord.customer_id) {
      // 重新计算客户的带看次数
      const viewingCountResult = await dbManager.queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM qft_ai_viewing_records WHERE customer_id = ?',
        [existingRecord.customer_id]
      );

      // 重新计算客户的总佣金
      const commissionResult = await dbManager.queryOne<{ total: number }>(
        'SELECT COALESCE(SUM(commission), 0) as total FROM qft_ai_viewing_records WHERE customer_id = ?',
        [existingRecord.customer_id]
      );

      // 更新客户信息
      await dbManager.execute(
        'UPDATE qft_ai_customers SET viewing_count = ?, total_commission = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [
          viewingCountResult?.count || 0,
          commissionResult?.total || 0,
          existingRecord.customer_id
        ]
      );

      requestLogger.info({
        recordId: id,
        customerId: existingRecord.customer_id,
        newViewingCount: viewingCountResult?.count || 0,
        newTotalCommission: commissionResult?.total || 0,
        requestId
      }, '客户带看次数和佣金已重新计算');
    }

    requestLogger.info({
      recordId: id,
      requestId
    }, '带看记录删除成功');

    return NextResponse.json({
      success: true,
      message: '带看记录删除成功'
    });

  } catch (error) {
    requestLogger.error({
      error: error instanceof Error ? error.message : error,
      recordId: id,
      requestId
    }, '删除带看记录失败');

    // 如果已经是 ApiError，直接抛出
    if (error instanceof Error && (error as ErrorWithStatusCode).statusCode) {
      throw error;
    }
    
    throw createDatabaseError('删除带看记录', error as Error);
  }
}); 