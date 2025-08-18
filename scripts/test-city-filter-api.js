const fetch = require('node-fetch');

async function testCityFilterAPI() {
  const baseUrl = 'http://localhost:3000/api';
  
  console.log('=== 测试城市筛选API功能 ===\n');

  try {
    // 测试1: 筛选"北京"
    console.log('1. 测试筛选"北京"');
    const beijingResponse = await fetch(`${baseUrl}/customers?city=北京`);
    const beijingData = await beijingResponse.json();
    
    console.log('状态码:', beijingResponse.status);
    console.log('成功:', beijingData.success);
    console.log('数据条数:', beijingData.data?.data?.length || 0);
    if (beijingData.data?.data?.length > 0) {
      console.log('客户列表:', beijingData.data.data.map(c => ({ id: c.id, name: c.name, phone: c.phone })));
    }
    console.log('');

    // 测试2: 筛选"北京市"
    console.log('2. 测试筛选"北京市"');
    const beijingCityResponse = await fetch(`${baseUrl}/customers?city=北京市`);
    const beijingCityData = await beijingCityResponse.json();
    
    console.log('状态码:', beijingCityResponse.status);
    console.log('成功:', beijingCityData.success);
    console.log('数据条数:', beijingCityData.data?.data?.length || 0);
    if (beijingCityData.data?.data?.length > 0) {
      console.log('客户列表:', beijingCityData.data.data.map(c => ({ id: c.id, name: c.name, phone: c.phone })));
    }
    console.log('');

    // 测试3: 多城市筛选 JSON格式
    console.log('3. 测试多城市筛选 JSON格式 ["北京","上海"]');
    const multiCityResponse = await fetch(`${baseUrl}/customers?city=${encodeURIComponent('["北京","上海"]')}`);
    const multiCityData = await multiCityResponse.json();
    
    console.log('状态码:', multiCityResponse.status);
    console.log('成功:', multiCityData.success);
    console.log('数据条数:', multiCityData.data?.data?.length || 0);
    if (multiCityData.data?.data?.length > 0) {
      console.log('客户列表:', multiCityData.data.data.map(c => ({ id: c.id, name: c.name, phone: c.phone })));
    }
    console.log('');

    // 测试4: 多城市筛选 逗号分隔
    console.log('4. 测试多城市筛选 逗号分隔 北京,上海');
    const commaCityResponse = await fetch(`${baseUrl}/customers?city=北京,上海`);
    const commaCityData = await commaCityResponse.json();
    
    console.log('状态码:', commaCityResponse.status);
    console.log('成功:', commaCityData.success);
    console.log('数据条数:', commaCityData.data?.data?.length || 0);
    if (commaCityData.data?.data?.length > 0) {
      console.log('客户列表:', commaCityData.data.data.map(c => ({ id: c.id, name: c.name, phone: c.phone })));
    }
    console.log('');

    // 测试5: 筛选不存在的城市
    console.log('5. 测试筛选不存在的城市 "火星"');
    const marsResponse = await fetch(`${baseUrl}/customers?city=火星`);
    const marsData = await marsResponse.json();
    
    console.log('状态码:', marsResponse.status);
    console.log('成功:', marsData.success);
    console.log('数据条数:', marsData.data?.data?.length || 0);
    console.log('');

    // 测试6: 获取所有客户（无筛选）
    console.log('6. 测试获取所有客户（无筛选）');
    const allResponse = await fetch(`${baseUrl}/customers`);
    const allData = await allResponse.json();
    
    console.log('状态码:', allResponse.status);
    console.log('成功:', allData.success);
    console.log('数据条数:', allData.data?.data?.length || 0);
    console.log('');

    // 测试7: 统计数据API
    console.log('7. 测试统计数据API - 筛选"北京"');
    const statsResponse = await fetch(`${baseUrl}/customers/stats?city=北京`);
    const statsData = await statsResponse.json();
    
    console.log('状态码:', statsResponse.status);
    console.log('成功:', statsData.success);
    console.log('统计数据:', statsData.data);
    console.log('');

  } catch (error) {
    console.error('API测试失败:', error.message);
  }
}

testCityFilterAPI(); 