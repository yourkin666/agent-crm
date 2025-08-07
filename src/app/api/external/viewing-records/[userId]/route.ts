import { NextRequest, NextResponse } from 'next/server';
import { dbManager } from '@/lib/database';
import { withErrorHandler, createDatabaseError, createSuccessResponse, createValidationError } from '@/lib/api-error-handler';
import { createRequestLogger } from '@/lib/logger';

// 生成请求ID的辅助函数
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 外部查询参数验证
function validateQueryParams(userId: string): void {
  if (!userId || userId.trim() === '') {
    throw createValidationError('userId为必填参数');
  }
}

// GET /api/external/viewing-records/[userId] - 根据用户ID查询带看记录
export const GET = withErrorHandler(async (request: NextRequest, { params }: { params: { userId: string } }) => {
  const requestId = generateRequestId();
  const requestLogger = createRequestLogger(requestId);

  const userId = params.userId;
  const { searchParams } = new URL(request.url);

  // 获取查询参数
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20', 10), 100); // 最大100条
  const property_name = searchParams.get('property_name');
  const viewing_status = searchParams.get('viewing_status');
  const business_type = searchParams.get('business_type');
  const viewer_name = searchParams.get('viewer_name');
  const date_from = searchParams.get('date_from');
  const date_to = searchParams.get('date_to');

  // 记录请求开始
  requestLogger.info({
    method: 'GET',
    url: `/api/external/viewing-records/${userId}`,
    userAgent: request.headers.get('user-agent'),
    userId,
    queryParams: {
      page,
      pageSize,
      property_name,
      viewing_status,
      business_type,
      viewer_name,
      date_from,
      date_to
    },
    requestId
  }, '外部API请求开始 - 查询用户带看记录');

  // 验证参数
  validateQueryParams(userId);

  try {
    // 构建WHERE条件
    const whereConditions: string[] = ['userId = ?'];
    const queryParams: any[] = [userId];

    if (property_name) {
      whereConditions.push('property_name LIKE ?');
      queryParams.push(`%${property_name}%`);
    }

    if (viewing_status) {
      whereConditions.push('viewing_status = ?');
      queryParams.push(parseInt(viewing_status));
    }

    if (business_type) {
      whereConditions.push('business_type = ?');
      queryParams.push(business_type);
    }

    if (viewer_name) {
      whereConditions.push('viewer_name = ?');
      queryParams.push(viewer_name);
    }

    if (date_from) {
      whereConditions.push('viewing_time >= ?');
      queryParams.push(date_from);
    }

    if (date_to) {
      whereConditions.push('viewing_time <= ?');
      queryParams.push(date_to + ' 23:59:59');
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    // 查询总数
    const countQuery = `SELECT COUNT(*) as total FROM qft_ai_viewing_records ${whereClause}`;
    const countResult = await dbManager.queryOne(countQuery, queryParams);
    const total = countResult?.total || 0;

    requestLogger.debug({
      userId,
      total,
      whereConditions: whereConditions.length,
      requestId
    }, '查询条件构建完成');

    // 计算分页
    const offset = (page - 1) * pageSize;

    // 查询数据 - 包含所有字段以支持外部系统使用
    const dataQuery = `
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
      ${whereClause}
      ORDER BY viewing_time DESC, created_at DESC
      LIMIT ? OFFSET ?
    `;

    const dataParams = [...queryParams, pageSize, offset];
    const records = await dbManager.query(dataQuery, dataParams);

    // 查询用户基本信息（如果存在客户记录）
    let customerInfo = null;
    if (records.length > 0 && records[0].customer_id) {
      customerInfo = await dbManager.queryOne(`
        SELECT 
          id,
          userId,
          nickname,
          name,
          phone,
          community,
          business_type,
          room_type,
          status,
          source_channel,
          viewing_count,
          total_commission,
          created_at,
          updated_at
        FROM qft_ai_customers 
        WHERE userId = ?
      `, [userId]);
    }

    requestLogger.info({
      statusCode: 200,
      userId,
      total,
      returnedCount: records.length,
      page,
      pageSize,
      hasCustomerInfo: !!customerInfo,
      requestId
    }, '外部API请求成功完成 - 用户带看记录查询成功');

    return createSuccessResponse({
      viewing_records: records,
      customer_info: customerInfo,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      },
      userId
    }, `查询成功，找到${total}条带看记录`);

  } catch (error) {
    requestLogger.error({
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      requestId
    }, '外部API请求失败 - 用户带看记录查询失败');

    throw error; // 重新抛出错误让错误处理器处理
  }
}); 