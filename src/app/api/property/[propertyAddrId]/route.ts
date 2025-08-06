import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest, 
  { params }: { params: { propertyAddrId: string } }
) {
  try {
    const { propertyAddrId } = params;
    const { searchParams } = new URL(request.url);
    
    console.log('调用物业详细地址查询API，propertyAddrId:', propertyAddrId);
    
    // 构建查询参数
    const queryParams = new URLSearchParams();
    const detailKeyword = searchParams.get('detailKeyword');
    const businessType = searchParams.get('businessType');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    
    if (detailKeyword) queryParams.append('detailKeyword', detailKeyword);
    if (businessType) queryParams.append('businessType', businessType);
    if (minPrice) queryParams.append('minPrice', minPrice);
    if (maxPrice) queryParams.append('maxPrice', maxPrice);
    
    const queryString = queryParams.toString();
    const url = `https://ai-agent-test.quanfangtongvip.com/ai/api/housing/property-details/${propertyAddrId}${queryString ? `?${queryString}` : ''}`;
    
    // 调用外部物业详细地址查询接口
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

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
    console.error('详细地址查询接口调用失败:', error);
    
    // 如果外部接口失败，返回一些模拟数据作为备用
    const mockData = {
      code: 200,
      message: "查询成功",
      data: [
        {
          id: 10001,
          companyId: 1234,
          businessType: 3,
          housingId: 5678,
          houseAreaId: 456,
          houseAreaName: "天河区",
          cityId: 123,
          cityName: "广州市",
          propertyAddrId: parseInt(params.propertyAddrId),
          propertyAddr: "碧桂园凤凰城",
          detailAddr: "1栋2单元301室",
          longitude: "113.123456",
          latitude: "23.123456",
          roomId: 1001,
          advisorId: 789,
          advisorName: "张三",
          companyName: "XX房产公司",
          companyAbbreviation: "XX房产",
          houseTypeId: 101
        },
        {
          id: 10002,
          companyId: 1234,
          businessType: 3,
          housingId: 5679,
          houseAreaId: 456,
          houseAreaName: "天河区",
          cityId: 123,
          cityName: "广州市",
          propertyAddrId: parseInt(params.propertyAddrId),
          propertyAddr: "碧桂园凤凰城",
          detailAddr: "1栋3单元401室",
          longitude: "113.123456",
          latitude: "23.123456",
          roomId: 1002,
          advisorId: 789,
          advisorName: "张三",
          companyName: "XX房产公司",
          companyAbbreviation: "XX房产",
          houseTypeId: 101
        },
        {
          id: 10003,
          companyId: 1234,
          businessType: 2,
          housingId: 5680,
          houseAreaId: 456,
          houseAreaName: "天河区",
          cityId: 123,
          cityName: "广州市",
          propertyAddrId: parseInt(params.propertyAddrId),
          propertyAddr: "碧桂园凤凰城",
          detailAddr: "2栋1单元101室",
          longitude: "113.123456",
          latitude: "23.123456",
          roomId: 1003,
          advisorId: 789,
          advisorName: "张三",
          companyName: "XX房产公司",
          companyAbbreviation: "XX房产",
          houseTypeId: 102
        }
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