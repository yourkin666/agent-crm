const fetch = require('node-fetch');

async function testDeleteAndRefresh() {
    const baseUrl = 'http://localhost:3000';
    
    try {
        console.log('🔍 开始测试删除和刷新功能...');

        // 1. 获取初始客户列表
        console.log('📊 获取初始客户列表...');
        const initialResponse = await fetch(`${baseUrl}/api/customers?page=1&pageSize=10`);
        const initialData = await initialResponse.json();
        
        if (!initialData.success) {
            console.error('❌ 获取初始客户列表失败:', initialData.error);
            return;
        }
        
        console.log(`📊 初始客户数量: ${initialData.data.total}`);
        console.log(`📋 当前页客户数: ${initialData.data.data.length}`);

        if (initialData.data.data.length === 0) {
            console.log('❌ 没有客户数据可供测试');
            return;
        }

        // 2. 获取第一个客户用于测试
        const testCustomer = initialData.data.data[0];
        console.log(`🎯 测试客户: ID=${testCustomer.id}, 姓名=${testCustomer.name}`);

        // 3. 删除测试客户
        console.log('🗑️ 删除测试客户...');
        const deleteResponse = await fetch(`${baseUrl}/api/customers/${testCustomer.id}`, {
            method: 'DELETE'
        });
        const deleteResult = await deleteResponse.json();

        if (!deleteResult.success) {
            console.error('❌ 删除客户失败:', deleteResult.error);
            return;
        }

        console.log('✅ 客户删除成功');

        // 4. 等待一秒，确保删除操作完成
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 5. 刷新数据（模拟前端刷新操作）
        console.log('🔄 刷新客户数据...');
        const refreshResponse = await fetch(`${baseUrl}/api/customers?page=1&pageSize=10&_t=${Date.now()}`);
        const refreshData = await refreshResponse.json();

        if (!refreshData.success) {
            console.error('❌ 刷新客户数据失败:', refreshData.error);
            return;
        }

        console.log(`📊 刷新后客户数量: ${refreshData.data.total}`);
        console.log(`📋 刷新后当前页客户数: ${refreshData.data.data.length}`);

        // 6. 验证删除的客户是否还在列表中
        const deletedCustomerStillExists = refreshData.data.data.some(
            (customer: any) => customer.id === testCustomer.id
        );

        if (deletedCustomerStillExists) {
            console.log('❌ 删除的客户仍然存在于列表中');
        } else {
            console.log('✅ 删除的客户已从列表中移除');
        }

        // 7. 验证客户总数是否正确减少
        const expectedTotal = initialData.data.total - 1;
        if (refreshData.data.total === expectedTotal) {
            console.log('✅ 客户总数正确减少');
        } else {
            console.log(`❌ 客户总数不正确: 期望 ${expectedTotal}, 实际 ${refreshData.data.total}`);
        }

        // 8. 测试统计数据
        console.log('📈 获取统计数据...');
        const statsResponse = await fetch(`${baseUrl}/api/customers/stats?_t=${Date.now()}`);
        const statsData = await statsResponse.json();

        if (statsData.success) {
            console.log('✅ 统计数据获取成功:', statsData.data);
        } else {
            console.log('❌ 统计数据获取失败:', statsData.error);
        }

        console.log('✅ 删除和刷新测试完成');

    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
}

// 运行测试
testDeleteAndRefresh().catch(console.error); 