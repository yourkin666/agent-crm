// 测试刷新按钮功能
const fetch = require('node-fetch');

async function testRefreshButton() {
    console.log('🧪 测试刷新按钮功能...\n');
    
    const baseUrl = 'http://localhost:3000';
    
    try {
        // 测试1: 获取初始数据
        console.log('1. 获取初始数据...');
        const initialStats = await fetch(`${baseUrl}/api/customers/stats`);
        const initialStatsData = await initialStats.json();
        
        if (!initialStats.ok || !initialStatsData.success) {
            throw new Error('初始数据获取失败');
        }
        
        console.log('✅ 初始统计数据:', initialStatsData.data);
        
        // 测试2: 模拟刷新操作（清除缓存并重新请求）
        console.log('\n2. 模拟刷新操作...');
        
        // 添加时间戳参数来避免缓存
        const timestamp = Date.now();
        const refreshStats = await fetch(`${baseUrl}/api/customers/stats?t=${timestamp}`);
        const refreshStatsData = await refreshStats.json();
        
        if (!refreshStats.ok || !refreshStatsData.success) {
            throw new Error('刷新数据获取失败');
        }
        
        console.log('✅ 刷新后统计数据:', refreshStatsData.data);
        
        // 测试3: 验证数据一致性
        console.log('\n3. 验证数据一致性...');
        if (JSON.stringify(initialStatsData.data) === JSON.stringify(refreshStatsData.data)) {
            console.log('✅ 数据一致，刷新功能正常');
        } else {
            console.log('⚠️  数据不一致，可能是缓存问题');
        }
        
        // 测试4: 测试带筛选条件的刷新
        console.log('\n4. 测试带筛选条件的刷新...');
        const filteredStats = await fetch(`${baseUrl}/api/customers/stats?page=1&pageSize=6`);
        const filteredStatsData = await filteredStats.json();
        
        if (filteredStats.ok && filteredStatsData.success) {
            console.log('✅ 带筛选条件的统计数据:', filteredStatsData.data);
        } else {
            console.log('❌ 带筛选条件的数据获取失败');
        }
        
        console.log('\n🎉 刷新按钮功能测试完成！');
        console.log('\n📝 测试结果说明:');
        console.log('- 如果所有测试都通过，说明刷新按钮的底层功能正常');
        console.log('- 如果前端刷新按钮仍然不工作，请检查浏览器控制台的错误信息');
        console.log('- 可以尝试清除浏览器缓存或硬刷新页面');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.log('\n🔧 故障排除建议:');
        console.log('1. 确保开发服务器正在运行: npm run dev');
        console.log('2. 检查网络连接');
        console.log('3. 查看服务器日志');
    }
}

// 运行测试
testRefreshButton(); 