import { NextRequest, NextResponse } from 'next/server';
import { dbManager } from '@/lib/database';
import { withErrorHandler, createDatabaseError } from '@/lib/api-error-handler';
import { createRequestLogger } from '@/lib/logger';
export const dynamic = 'force-dynamic';

// 生成请求ID的辅助函数
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}



export const GET = withErrorHandler(async (request: NextRequest) => {
  const requestId = generateRequestId();
  const requestLogger = createRequestLogger(requestId);

  requestLogger.info({
    method: 'GET',
    url: '/api/viewing-records/stats',
          userAgent: request.headers?.get('user-agent') || 'unknown',
    requestId
  }, 'API请求开始 - 获取带看记录统计');

  const { searchParams } = request.nextUrl;
  
  // 解析查询参数（支持筛选条件下的统计）
  const customer_name = searchParams.get('customer_name') || '';
  const property_name = searchParams.get('property_name') || '';
  const cityName = searchParams.get('cityName') || '';
  const viewing_status = searchParams.get('viewing_status') || '';
  const business_type = searchParams.get('business_type') || '';
  const viewer_name = searchParams.get('viewer_name') || '';
  const date_from = searchParams.get('date_from') || '';
  const date_to = searchParams.get('date_to') || '';
  const botId = searchParams.get('botId') || '';

  try {
    // 构建WHERE条件（与列表接口保持一致）
    const whereConditions: string[] = [];
    const queryParams: (string | number | boolean)[] = [];

    if (customer_name) {
      whereConditions.push('customer_name LIKE ?');
      queryParams.push(`%${customer_name}%`);
    }

    if (property_name) {
      whereConditions.push('property_name LIKE ?');
      queryParams.push(`%${property_name}%`);
    }

    if (cityName) {
      whereConditions.push('cityName LIKE ?');
      queryParams.push(`${cityName}%`);
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

    if (botId) {
      whereConditions.push('botId = ?');
      queryParams.push(botId);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // 获取统计数据
    const statsQuery = `
      SELECT 
        COUNT(*) as total_records,
        COALESCE(SUM(CASE WHEN viewing_status = 4 THEN 1 ELSE 0 END), 0) as completed_records,
        COALESCE(SUM(CASE WHEN viewing_status = 1 THEN 1 ELSE 0 END), 0) as pending_records,
        COALESCE(SUM(commission), 0) as total_commission
      FROM qft_ai_viewing_records 
      ${whereClause}
    `;

    const stats = await dbManager.queryOne(statsQuery, queryParams);

    requestLogger.info({
      stats,
      requestId
    }, '带看记录统计查询完成');

    return NextResponse.json({
      success: true,
      data: {
        total_records: stats?.total_records || 0,
        completed_records: stats?.completed_records || 0,
        pending_records: stats?.pending_records || 0,
        total_commission: parseFloat(String(stats?.total_commission || 0))
      }
    });

  } catch (error) {
    requestLogger.error({
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      requestId
    }, '带看记录统计查询失败');

    throw createDatabaseError('获取带看记录统计', error as Error);
  }
}); 