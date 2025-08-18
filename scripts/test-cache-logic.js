// 模拟缓存逻辑测试
class MockCache {
    constructor() {
        this.cache = new Map();
    }

    set(key, data) {
        this.cache.set(key, { data, timestamp: Date.now() });
        console.log(`📝 缓存已设置: ${key}`);
    }

    get(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
            console.log(`📖 从缓存读取: ${key}`);
            return cached.data;
        }
        console.log(`❌ 缓存未命中或已过期: ${key}`);
        return null;
    }

    clear() {
        this.cache.clear();
        console.log('🗑️ 缓存已清除');
    }

    size() {
        return this.cache.size;
    }
}

// 模拟测试
function testCacheLogic() {
    console.log('🧪 开始测试缓存逻辑...\n');

    const cache = new MockCache();

    // 测试1: 设置缓存
    console.log('📋 测试1: 设置缓存');
    cache.set('test_key_1', { data: 'test_data_1', count: 10 });
    cache.set('test_key_2', { data: 'test_data_2', count: 20 });
    console.log(`缓存大小: ${cache.size()}\n`);

    // 测试2: 读取缓存
    console.log('📋 测试2: 读取缓存');
    const data1 = cache.get('test_key_1');
    const data2 = cache.get('test_key_2');
    console.log(`读取结果1:`, data1);
    console.log(`读取结果2:`, data2);
    console.log(`缓存大小: ${cache.size()}\n`);

    // 测试3: 清除缓存
    console.log('📋 测试3: 清除缓存');
    cache.clear();
    console.log(`缓存大小: ${cache.size()}\n`);

    // 测试4: 清除后读取
    console.log('📋 测试4: 清除后读取');
    const data3 = cache.get('test_key_1');
    console.log(`清除后读取结果:`, data3);
    console.log(`缓存大小: ${cache.size()}\n`);

    // 测试5: 模拟删除操作流程
    console.log('📋 测试5: 模拟删除操作流程');
    
    // 设置初始缓存
    cache.set('customers_list', { data: ['customer1', 'customer2', 'customer3'], total: 3 });
    cache.set('customers_stats', { total: 3, following: 2, completed: 1 });
    console.log(`删除前缓存大小: ${cache.size()}`);

    // 模拟删除操作
    console.log('🗑️ 执行删除操作...');
    
    // 清除缓存（模拟我们的修复）
    cache.clear();
    console.log(`删除后缓存大小: ${cache.size()}`);

    // 模拟重新加载数据
    console.log('🔄 重新加载数据...');
    const newData = cache.get('customers_list');
    console.log(`重新加载结果:`, newData);

    console.log('\n✅ 缓存逻辑测试完成');
}

// 运行测试
testCacheLogic(); 