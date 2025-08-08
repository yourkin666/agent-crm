import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { propertyAddrId: string } }
) {
  try {
    const { propertyAddrId } = params;
    const { searchParams } = request.nextUrl;

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
    const url = `https://ai-agent-test.quanfangtongvip.com/housing-push/api/housing/property-details/${propertyAddrId}${queryString ? `?${queryString}` : ''}`;

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
    const detailAddressList = [
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
        roomConfig: "床,衣柜,空调,热水器",
        insideSpace: 85.5,
        orientation: "南北",
        unitType: "两室一厅",
        floor: "3",
        totalFloor: "18",
        building: "1栋",
        unitName: "2单元",
        doorNumber: "301",
        roomNumber: "301-A",
        pricingMoney: 2500,
        depositMoney: 2500,
        lockFlag: 1,
        electricityFlag: 1,
        waterFlag: 1,
        shortRentFlag: 0,
        specialFlag: 0,
        bedroom: 2,
        livingRoom: 1,
        bathroom: 1,
        kitchen: 1,
        depositPayMethod: "押1付1",
        tags: "精装修,近地铁",
        vacantDays: 5,
        roomTypeName: "主卧",
        houseTypeName: "精装房",
        roomCount: 1,
        restRoomCount: 1,
        housingEndTime: "2025-12-31T23:59:59",
        propertyFee: 150.00,
        butlerPhone: "13800138000",
        priorityScore: 85,
        roomImageCount: 8,
        advisorId: 789,
        advisorName: "张三",
        companyName: "XX房产公司",
        companyAbbreviation: "XX房产",
        searchBusinessType: 3,
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
        roomConfig: "床,衣柜,空调,热水器",
        insideSpace: 75.5,
        orientation: "南",
        unitType: "一室一厅",
        floor: "4",
        totalFloor: "18",
        building: "1栋",
        unitName: "3单元",
        doorNumber: "401",
        roomNumber: "401-B",
        pricingMoney: 2200,
        depositMoney: 2200,
        lockFlag: 1,
        electricityFlag: 1,
        waterFlag: 1,
        shortRentFlag: 0,
        specialFlag: 1,
        bedroom: 1,
        livingRoom: 1,
        bathroom: 1,
        kitchen: 1,
        depositPayMethod: "押1付1",
        tags: "特价房,精装修",
        vacantDays: 3,
        roomTypeName: "次卧",
        houseTypeName: "精装房",
        roomCount: 1,
        restRoomCount: 1,
        housingEndTime: "2025-12-31T23:59:59",
        propertyFee: 150.00,
        butlerPhone: "13800138000",
        priorityScore: 90,
        roomImageCount: 6,
        advisorId: 789,
        advisorName: "张三",
        companyName: "XX房产公司",
        companyAbbreviation: "XX房产",
        searchBusinessType: 3,
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
        roomConfig: "床,衣柜,空调,热水器,洗衣机",
        insideSpace: 120.0,
        orientation: "南北",
        unitType: "三室两厅",
        floor: "1",
        totalFloor: "18",
        building: "2栋",
        unitName: "1单元",
        doorNumber: "101",
        roomNumber: "整套",
        pricingMoney: 4500,
        depositMoney: 4500,
        lockFlag: 1,
        electricityFlag: 1,
        waterFlag: 1,
        shortRentFlag: 0,
        specialFlag: 0,
        bedroom: 3,
        livingRoom: 2,
        bathroom: 2,
        kitchen: 1,
        depositPayMethod: "押1付3",
        tags: "整租,精装修,近地铁",
        vacantDays: 10,
        roomTypeName: "整套",
        houseTypeName: "精装房",
        roomCount: 1,
        restRoomCount: 1,
        housingEndTime: "2025-12-31T23:59:59",
        propertyFee: 300.00,
        butlerPhone: "13800138000",
        priorityScore: 95,
        roomImageCount: 12,
        advisorId: 789,
        advisorName: "张三",
        companyName: "XX房产公司",
        companyAbbreviation: "XX房产",
        searchBusinessType: 2,
        houseTypeId: 102
      }
    ];

    const mockData = {
      code: 200,
      message: "查询成功",
      data: {
        pageNo: 1,
        pageSize: 20,
        total: detailAddressList.length,
        totalPages: 1,
        list: detailAddressList
      },
      timestamp: Date.now()
    };

    console.log('返回模拟数据，数据量:', mockData.data.list.length);
    return NextResponse.json({
      success: true,
      data: mockData,
      isMockData: true
    });
  }
} 