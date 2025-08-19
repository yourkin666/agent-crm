import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-error-handler';
import { createRequestLogger } from '@/lib/logger';
import { dbManager } from '@/lib/database';

// 生成请求ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}



// 统计数据响应接口
interface StatisticsData {
  viewing_count: number;
  completed_unpaid_count: number;
  completed_paid_count: number;
  total_commission: number;
  period: {
    date_from?: string;
    date_to?: string;
  };
}

// 验证日期格式
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// 计算时间范围
function calculateDateRange(dateFrom?: string, dateTo?: string): { date_from?: string; date_to?: string } {
  // 如果没有提供时间参数，返回空对象表示查询所有数据
  if (!dateFrom && !dateTo) {
    return {};
  }
  
  // 如果提供了时间参数，返回时间范围
  return { 
    date_from: dateFrom, 
    date_to: dateTo 
  };
}

// 获取统计数据
async function getStatistics(dateRange: { date_from?: string; date_to?: string }, requestLogger: { info: (data: Record<string, unknown>, message: string) => void; error: (data: Record<string, unknown>, message: string) => void }): Promise<StatisticsData> {
  const requestId = generateRequestId();
  
  requestLogger.info({
    dateRange,
    requestId
  }, '开始查询统计数据');
  
  try {
    let viewingStatsQuery: string;
    let viewingStatsParams: (string | number)[] = [];
    
    // 根据是否提供时间范围构建不同的查询
    if (dateRange.date_from && dateRange.date_to) {
      // 有时间范围筛选
      viewingStatsQuery = `
        SELECT 
          COUNT(*) as viewing_count,
          COALESCE(SUM(commission), 0) as total_commission
        FROM qft_ai_viewing_records 
        WHERE DATE(created_at) BETWEEN ? AND ?
      `;
      viewingStatsParams = [dateRange.date_from, dateRange.date_to];
    } else {
      // 查询所有数据
      viewingStatsQuery = `
        SELECT 
          COUNT(*) as viewing_count,
          COALESCE(SUM(commission), 0) as total_commission
        FROM qft_ai_viewing_records
      `;
    }
    
    const viewingStats = await dbManager.queryOne(viewingStatsQuery, viewingStatsParams) || {};
    
    requestLogger.info({
      viewing_count: viewingStats?.viewing_count || 0,
      total_commission: viewingStats?.total_commission || 0,
      requestId
    }, '带看记录统计查询完成');
    
    // 查询客户状态统计（已成交未结佣、已成交已结佣）
    const customerStatsQuery = `
      SELECT 
        SUM(CASE WHEN status = 4 THEN 1 ELSE 0 END) as completed_unpaid_count,
        SUM(CASE WHEN status = 5 THEN 1 ELSE 0 END) as completed_paid_count
      FROM qft_ai_customers
    `;
    
    const customerStats = await dbManager.queryOne(customerStatsQuery) || {};
    
    requestLogger.info({
      completed_unpaid_count: customerStats?.completed_unpaid_count || 0,
      completed_paid_count: customerStats?.completed_paid_count || 0,
      requestId
    }, '客户状态统计查询完成');
    
    return {
      viewing_count: Number(viewingStats?.viewing_count) || 0,
      completed_unpaid_count: Number(customerStats?.completed_unpaid_count) || 0,
      completed_paid_count: Number(customerStats?.completed_paid_count) || 0,
      total_commission: parseFloat(String(viewingStats?.total_commission || '0')),
      period: dateRange
    };
  } catch (error) {
    requestLogger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      dateRange,
      requestId
    }, '统计数据查询失败');
    throw error;
  }
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const requestId = generateRequestId();
  const requestLogger = createRequestLogger(requestId);

  try {
    requestLogger.info({
      method: 'GET',
      url: '/api/external/statistics',
      requestId
    }, '外部统计接口请求开始');

    // 获取查询参数
    const { searchParams } = request.nextUrl;
    const dateFrom = searchParams.get('date_from') || undefined;
    const dateTo = searchParams.get('date_to') || undefined;

    // 参数验证
    if (dateFrom && !isValidDate(dateFrom)) {
      requestLogger.warn({
        dateFrom,
        requestId
      }, '开始日期格式无效');
      return NextResponse.json({
        success: false,
        error: 'INVALID_DATE_FORMAT',
        message: '开始日期格式无效，请使用YYYY-MM-DD格式'
      }, { status: 400 });
    }

    if (dateTo && !isValidDate(dateTo)) {
      requestLogger.warn({
        dateTo,
        requestId
      }, '结束日期格式无效');
      return NextResponse.json({
        success: false,
        error: 'INVALID_DATE_FORMAT',
        message: '结束日期格式无效，请使用YYYY-MM-DD格式'
      }, { status: 400 });
    }

    // 计算时间范围
    const dateRange = calculateDateRange(dateFrom, dateTo);

    requestLogger.info({
      dateRange,
      requestId
    }, '时间范围计算完成');

    // 获取统计数据
    const statistics = await getStatistics(dateRange, requestLogger);

    requestLogger.info({
      viewing_count: statistics.viewing_count,
      completed_unpaid_count: statistics.completed_unpaid_count,
      completed_paid_count: statistics.completed_paid_count,
      total_commission: statistics.total_commission,
      requestId
    }, '统计数据查询完成');

    return NextResponse.json({
      success: true,
      data: statistics,
      message: '统计数据获取成功'
    });

  } catch (error) {
    requestLogger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    }, '外部统计接口处理失败');
    throw error;
  }
}); 