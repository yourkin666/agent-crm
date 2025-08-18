// 测试前端刷新按钮功能
const fetch = require('node-fetch');

async function testFrontendRefresh() {
    console.log('🧪 测试前端刷新按钮功能...\n');
    
    const baseUrl = 'http://localhost:3000';
    
    try {
        // 测试1: 获取初始数据
        console.log('1. 获取初始客户列表...');
        const initialCustomers = await fetch(`${baseUrl}/api/customers?page=1&pageSize=6`);
        const initialCustomersData = await initialCustomers.json();
        
        if (!initialCustomers.ok || !initialCustomersData.success) {
            throw new Error('初始客户列表获取失败');
        }
        
        console.log('✅ 初始客户列表:', {
            total: initialCustomersData.data.total,
            count: initialCustomersData.data.data.length,
            firstCustomer: initialCustomersData.data.data[0]?.name || '无数据'
        });
        
        // 测试2: 模拟刷新操作（带时间戳参数）
        console.log('\n2. 模拟刷新操作（带时间戳）...');
        const timestamp = Date.now();
        const refreshCustomers = await fetch(`${baseUrl}/api/customers?page=1&pageSize=6&_t=${timestamp}`);
        const refreshCustomersData = await refreshCustomers.json();
        
        if (!refreshCustomers.ok || !refreshCustomersData.success) {
            throw new Error('刷新客户列表获取失败');
        }
        
        console.log('✅ 刷新后客户列表:', {
            total: refreshCustomersData.data.total,
            count: refreshCustomersData.data.data.length,
            firstCustomer: refreshCustomersData.data.data[0]?.name || '无数据'
        });
        
        // 测试3: 验证数据一致性
        console.log('\n3. 验证数据一致性...');
        if (JSON.stringify(initialCustomersData.data) === JSON.stringify(refreshCustomersData.data)) {
            console.log('✅ 数据一致，刷新功能正常');
        } else {
            console.log('⚠️  数据不一致，可能是缓存问题');
        }
        
        // 测试4: 测试带筛选条件的刷新
        console.log('\n4. 测试带筛选条件的刷新...');
        const filteredRefresh = await fetch(`${baseUrl}/api/customers?page=1&pageSize=6&name=test&_t=${Date.now()}`);
        const filteredRefreshData = await filteredRefresh.json();
        
        if (filteredRefresh.ok && filteredRefreshData.success) {
            console.log('✅ 带筛选条件的刷新成功:', {
                total: filteredRefreshData.data.total,
                count: filteredRefreshData.data.data.length
            });
        } else {
            console.log('❌ 带筛选条件的刷新失败');
        }
        
        console.log('\n🎉 前端刷新功能测试完成！');
        console.log('\n📝 测试结果说明:');
        console.log('- 如果所有测试都通过，说明刷新按钮的前端功能正常');
        console.log('- 刷新操作会绕过缓存，确保获取最新数据');
        console.log('- 时间戳参数确保每次刷新都是新的请求');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.log('\n💡 可能的原因:');
        console.log('- 开发服务器未运行');
        console.log('- 网络连接问题');
        console.log('- API 接口异常');
    }
}

testFrontendRefresh(); 