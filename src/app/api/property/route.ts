import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('调用小区查询API...');
    
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
      console.log('外部接口调用失败，返回模拟数据');
      throw new Error(`接口调用失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('外部接口调用成功，返回数据量:', data?.data?.length || 0);
    
    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('代理接口调用失败:', error);
    
    // 如果外部接口失败，返回一些模拟数据作为备用
    const mockData = {
      code: "200",
      message: "操作成功",
      data: [
        { id: 1, addrName: "万科城市花园" },
        { id: 2, addrName: "龙湖春江郦城" },
        { id: 3, addrName: "华宇锦绣花城" },
        { id: 4, addrName: "绿地海域苏河源" },
        { id: 5, addrName: "保利西子湾" },
        { id: 6, addrName: "中海国际社区" },
        { id: 7, addrName: "万科翡翠滨江" },
        { id: 8, addrName: "龙湖天璞" },
        { id: 9, addrName: "华润橡树湾" },
        { id: 10, addrName: "融创滨江壹号" }
      ]
    };
    
    console.log('返回模拟数据，数据量:', mockData.data.length);
    return NextResponse.json({
      success: true,
      data: mockData,
      isMockData: true
    });
  }
} 