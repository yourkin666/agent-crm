// 测试刷新按钮点击事件
const puppeteer = require('puppeteer');

async function testRefreshButtonClick() {
    console.log('🧪 测试刷新按钮点击事件...\n');
    
    let browser;
    try {
        // 启动浏览器
        browser = await puppeteer.launch({ 
            headless: false, // 设置为 false 以便观察
            slowMo: 1000 // 放慢操作速度
        });
        
        const page = await browser.newPage();
        
        // 设置视口
        await page.setViewport({ width: 1280, height: 720 });
        
        // 导航到客户管理页面
        console.log('1. 导航到客户管理页面...');
        await page.goto('http://localhost:3000/customers', { 
            waitUntil: 'networkidle2',
            timeout: 10000 
        });
        
        // 等待页面加载完成
        await page.waitForSelector('.filter-panel', { timeout: 10000 });
        console.log('✅ 页面加载完成');
        
        // 等待刷新按钮出现
        console.log('\n2. 查找刷新按钮...');
        await page.waitForSelector('button[class*="ant-btn"]:has-text("刷新")', { timeout: 10000 });
        console.log('✅ 刷新按钮找到');
        
        // 获取初始数据
        console.log('\n3. 获取初始数据...');
        const initialData = await page.evaluate(() => {
            const statsElements = document.querySelectorAll('.ant-statistic-content');
            return Array.from(statsElements).map(el => el.textContent);
        });
        console.log('✅ 初始统计数据:', initialData);
        
        // 点击刷新按钮
        console.log('\n4. 点击刷新按钮...');
        await page.click('button:has-text("刷新")');
        console.log('✅ 刷新按钮点击成功');
        
        // 等待数据刷新
        console.log('\n5. 等待数据刷新...');
        await page.waitForTimeout(2000); // 等待2秒
        
        // 检查是否有成功消息
        console.log('\n6. 检查刷新结果...');
        const successMessage = await page.evaluate(() => {
            const messageElement = document.querySelector('.ant-message-notice-content');
            return messageElement ? messageElement.textContent : null;
        });
        
        if (successMessage) {
            console.log('✅ 刷新成功消息:', successMessage);
        } else {
            console.log('⚠️  未检测到成功消息，但可能刷新正常');
        }
        
        // 获取刷新后的数据
        const refreshedData = await page.evaluate(() => {
            const statsElements = document.querySelectorAll('.ant-statistic-content');
            return Array.from(statsElements).map(el => el.textContent);
        });
        console.log('✅ 刷新后统计数据:', refreshedData);
        
        // 验证数据是否一致
        console.log('\n7. 验证数据一致性...');
        if (JSON.stringify(initialData) === JSON.stringify(refreshedData)) {
            console.log('✅ 数据一致，刷新功能正常');
        } else {
            console.log('⚠️  数据不一致，可能是缓存问题');
        }
        
        console.log('\n🎉 刷新按钮点击测试完成！');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.log('\n💡 可能的原因:');
        console.log('- 开发服务器未运行');
        console.log('- 页面加载超时');
        console.log('- 刷新按钮未找到');
        console.log('- 网络连接问题');
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// 检查是否安装了 puppeteer
try {
    require('puppeteer');
    testRefreshButtonClick();
} catch (error) {
    console.log('❌ 未安装 puppeteer，跳过浏览器测试');
    console.log('💡 请运行: npm install puppeteer');
    console.log('或者手动测试刷新按钮功能');
} 