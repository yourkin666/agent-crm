// 测试刷新按钮功能
const fetch = require('node-fetch');

async function testRefreshFunctionality() {
    console.log('🧪 测试刷新按钮功能...\n');
    
    const baseUrl = 'http://localhost:3000';
    
    try {
        // 测试1: 获取客户统计数据
        console.log('1. 测试获取客户统计数据...');
        const statsResponse = await fetch(`${baseUrl}/api/customers/stats`);
        const statsData = await statsResponse.json();
        
        if (statsResponse.ok && statsData.success) {
            console.log('✅ 统计数据获取成功:', statsData.data);
        } else {
            console.log('❌ 统计数据获取失败:', statsData);
        }
        
        // 测试2: 获取客户列表
        console.log('\n2. 测试获取客户列表...');
        const customersResponse = await fetch(`${baseUrl}/api/customers?page=1&pageSize=6`);
        const customersData = await customersResponse.json();
        
        if (customersResponse.ok && customersData.success) {
            console.log('✅ 客户列表获取成功，共', customersData.data.total, '条记录');
        } else {
            console.log('❌ 客户列表获取失败:', customersData);
        }
        
        // 测试3: 模拟刷新操作（重新请求相同数据）
        console.log('\n3. 模拟刷新操作...');
        const refreshStatsResponse = await fetch(`${baseUrl}/api/customers/stats`);
        const refreshStatsData = await refreshStatsResponse.json();
        
        if (refreshStatsResponse.ok && refreshStatsData.success) {
            console.log('✅ 刷新统计数据成功:', refreshStatsData.data);
        } else {
            console.log('❌ 刷新统计数据失败:', refreshStatsData);
        }
        
        console.log('\n🎉 所有测试完成！');
        console.log('\n如果上述测试都通过，说明刷新按钮的底层功能正常。');
        console.log('如果刷新按钮仍然不工作，可能是前端组件的问题。');
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        console.log('\n请确保开发服务器正在运行: npm run dev');
    }
}

// 运行测试
testRefreshFunctionality(); 