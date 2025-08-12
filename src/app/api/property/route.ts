import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-error-handler';
import { createRequestLogger } from '@/lib/logger';

// 生成请求ID的辅助函数
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const requestId = generateRequestId();
  const requestLogger = createRequestLogger(requestId);

  try {
    requestLogger.info({
      method: 'GET',
      url: '/api/property',
      userAgent: request.headers.get('user-agent'),
      requestId
    }, '调用小区查询API...');

    // 调用外部小区查询接口
    const response = await fetch(
      'https://ai-agent-test.quanfangtongvip.com/ai/api/property/search',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      requestLogger.warn({
        status: response.status,
        statusText: response.statusText,
        requestId
      }, '外部接口调用失败，返回模拟数据');
      throw new Error(`接口调用失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    requestLogger.info({
      returnedCount: data?.data?.length || 0,
      requestId
    }, '外部接口调用成功');
    
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    requestLogger.error({
      error: error instanceof Error ? error.message : error,
      requestId
    }, '代理接口调用失败');
    
    // 如果外部接口失败，返回一些模拟数据作为备用
    const mockData = {
      code: '200',
      message: '操作成功',
      data: [
        { id: 1, addrName: '万科城市花园' },
        { id: 2, addrName: '龙湖春江郦城' },
        { id: 3, addrName: '华宇锦绣花城' },
        { id: 4, addrName: '绿地海域苏河源' },
        { id: 5, addrName: '保利西子湾' },
        { id: 6, addrName: '中海国际社区' },
        { id: 7, addrName: '万科翡翠滨江' },
        { id: 8, addrName: '龙湖天璞' },
        { id: 9, addrName: '华润橡树湾' },
        { id: 10, addrName: '融创滨江壹号' }
      ]
    };
    
    requestLogger.info({
      returnedCount: mockData.data.length,
      requestId
    }, '返回模拟数据');

    return NextResponse.json({
      success: true,
      data: mockData,
      isMockData: true
    });
  }
}); 