import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-error-handler';
import { createRequestLogger } from '@/lib/logger';
export const dynamic = 'force-dynamic';

// 生成请求ID的辅助函数
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const requestId = generateRequestId();
  const requestLogger = createRequestLogger(requestId);

  try {
    const { searchParams } = request.nextUrl;
    const keyword = searchParams.get('keyword');
    const limit = searchParams.get('limit') || '100';
    
    requestLogger.info({
      method: 'GET',
      url: '/api/housing/property-addresses',
      keyword,
      limit,
      userAgent: request.headers.get('user-agent'),
      requestId
    }, '调用物业地址查询API');
    
    // 构建查询参数
    const queryParams = new URLSearchParams();
    if (keyword) queryParams.append('keyword', keyword);
    queryParams.append('limit', limit);
    
    const queryString = queryParams.toString();
    const url = `https://ai-agent-test.quanfangtongvip.com/housing-push/api/housing/property-addresses${queryString ? `?${queryString}` : ''}`;
    
    // 调用外部物业地址查询接口
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      requestLogger.warn({ status: response.status, statusText: response.statusText, requestId }, '外部接口调用失败，返回模拟数据');
      throw new Error(`接口调用失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    requestLogger.info({ returnedCount: data?.data?.length || 0, requestId }, '外部接口调用成功');
    
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    requestLogger.error({ error: error instanceof Error ? error.message : error, requestId }, '物业地址查询接口调用失败');
    
    // 如果外部接口失败，返回一些模拟数据作为备用
    const keyword = request.nextUrl.searchParams.get('keyword') || '';
    
    // 模拟数据，根据关键词筛选
    const allMockData = [
      { propertyAddrId: 12345, propertyAddr: '碧桂园凤凰城' },
      { propertyAddrId: 12346, propertyAddr: '万科城市花园' },
      { propertyAddrId: 12347, propertyAddr: '龙湖春江郦城' },
      { propertyAddrId: 12348, propertyAddr: '华宇锦绣花城' },
      { propertyAddrId: 12349, propertyAddr: '绿地海域苏河源' },
      { propertyAddrId: 12350, propertyAddr: '保利西子湾' },
      { propertyAddrId: 12351, propertyAddr: '中海国际社区' },
      { propertyAddrId: 12352, propertyAddr: '万科翡翠滨江' },
      { propertyAddrId: 12353, propertyAddr: '龙湖天璞' },
      { propertyAddrId: 12354, propertyAddr: '华润橡树湾' },
      { propertyAddrId: 12355, propertyAddr: '融创滨江壹号' },
      { propertyAddrId: 12356, propertyAddr: '万达广场' },
      { propertyAddrId: 12357, propertyAddr: '绿地中央广场' },
      { propertyAddrId: 12358, propertyAddr: '保利祥泰国际' },
      { propertyAddrId: 12359, propertyAddr: '恒大名都' }
    ];
    
    // 根据关键词筛选
    let filteredData = allMockData;
    if (keyword) {
      filteredData = allMockData.filter(item => 
        item.propertyAddr.toLowerCase().includes(keyword.toLowerCase())
      );
    }
    
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');
    filteredData = filteredData.slice(0, limit);
    
    const mockData = {
      code: 200,
      message: '查询成功',
      data: filteredData,
      timestamp: Date.now()
    };
    
    requestLogger.info({ returnedCount: mockData.data.length, requestId }, '返回模拟数据');

    return NextResponse.json({
      success: true,
      data: mockData,
      isMockData: true
    });
  }
}); 