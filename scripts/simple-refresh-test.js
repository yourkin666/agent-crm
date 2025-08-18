// 简单测试刷新按钮功能
const fetch = require('node-fetch');

async function simpleRefreshTest() {
    console.log('🧪 简单测试刷新按钮功能...\n');
    
    const baseUrl = 'http://localhost:3000';
    
    try {
        // 测试1: 检查页面是否可访问
        console.log('1. 检查页面可访问性...');
        const pageResponse = await fetch(`${baseUrl}/customers`);
        
        if (pageResponse.ok) {
            console.log('✅ 客户管理页面可访问');
        } else {
            console.log('❌ 客户管理页面不可访问');
            return;
        }
        
        // 测试2: 检查API接口
        console.log('\n2. 检查API接口...');
        const apiResponse = await fetch(`${baseUrl}/api/customers?page=1&pageSize=6`);
        
        if (apiResponse.ok) {
            const apiData = await apiResponse.json();
            console.log('✅ API接口正常，数据条数:', apiData.data?.total || 0);
        } else {
            console.log('❌ API接口异常');
            return;
        }
        
        // 测试3: 测试刷新操作
        console.log('\n3. 测试刷新操作...');
        const timestamp = Date.now();
        const refreshResponse = await fetch(`${baseUrl}/api/customers?page=1&pageSize=6&_t=${timestamp}`);
        
        if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            console.log('✅ 刷新操作成功，数据条数:', refreshData.data?.total || 0);
        } else {
            console.log('❌ 刷新操作失败');
            return;
        }
        
        // 测试4: 检查统计数据
        console.log('\n4. 检查统计数据...');
        const statsResponse = await fetch(`${baseUrl}/api/customers/stats`);
        
        if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            console.log('✅ 统计数据正常:', statsData.data);
        } else {
            console.log('❌ 统计数据异常');
        }
        
        console.log('\n🎉 基础功能测试完成！');
        console.log('\n📝 如果上述测试都通过，说明后端功能正常');
        console.log('如果刷新按钮仍然不工作，可能是前端组件的问题');
        console.log('请检查浏览器控制台是否有错误信息');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.log('\n💡 可能的原因:');
        console.log('- 开发服务器未运行 (请运行 npm run dev)');
        console.log('- 网络连接问题');
        console.log('- 端口被占用');
    }
}

simpleRefreshTest(); 