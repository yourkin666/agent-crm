const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function testDedupLogic() {
  try {
    console.log('正在连接MySQL数据库...');

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: 'utf8mb4'
    });

    console.log('数据库连接成功');

    // 测试1: 简单的城市筛选（不去重）
    console.log('\n=== 测试1: 简单城市筛选（不去重） ===');
    const [simpleResult] = await connection.query(`
      SELECT * FROM qft_ai_customers 
      WHERE EXISTS (SELECT 1 FROM qft_ai_viewing_records vr WHERE vr.customer_id = id AND (vr.cityName LIKE '%北京%' OR vr.cityName LIKE '北京市' OR vr.cityName = '北京'))
    `);
    console.log('简单筛选结果数量:', simpleResult.length);
    console.table(simpleResult.map(r => ({ id: r.id, name: r.name, userId: r.userId, botId: r.botId })));

    // 测试2: 检查去重逻辑的NOT EXISTS部分
    console.log('\n=== 测试2: 检查去重逻辑的NOT EXISTS部分 ===');
    for (const customer of simpleResult) {
      const [duplicates] = await connection.query(`
        SELECT 1 FROM qft_ai_customers c2
        WHERE c2.userId IS NOT NULL
        AND c2.userId = ?
        AND COALESCE(c2.botId, '-1') = COALESCE(?, '-1')
        AND (c2.created_at > ? OR (c2.created_at = ? AND c2.id > ?))
      `, [customer.userId, customer.botId, customer.created_at, customer.created_at, customer.id]);
      
      console.log(`客户 ${customer.name} (ID: ${customer.id}, userId: ${customer.userId}):`);
      console.log(`  - userId IS NULL: ${customer.userId === null}`);
      console.log(`  - NOT EXISTS 结果: ${duplicates.length === 0}`);
      console.log(`  - 最终条件: ${customer.userId === null || duplicates.length === 0}`);
    }

    // 测试3: 修复后的去重逻辑
    console.log('\n=== 测试3: 修复后的去重逻辑 ===');
    const [fixedResult] = await connection.query(`
      SELECT c.* FROM (
        SELECT * FROM qft_ai_customers 
        WHERE EXISTS (SELECT 1 FROM qft_ai_viewing_records vr WHERE vr.customer_id = id AND (vr.cityName LIKE '%北京%' OR vr.cityName LIKE '北京市' OR vr.cityName = '北京'))
      ) AS c
      WHERE c.userId IS NULL OR NOT EXISTS (
        SELECT 1 FROM qft_ai_customers c2
        WHERE c2.userId IS NOT NULL
        AND c2.userId = c.userId
        AND COALESCE(c2.botId, '-1') = COALESCE(c.botId, '-1')
        AND (c2.created_at > c.created_at OR (c2.created_at = c.created_at AND c2.id > c.id))
      )
    `);
    console.log('修复后结果数量:', fixedResult.length);
    console.table(fixedResult.map(r => ({ id: r.id, name: r.name, userId: r.userId, botId: r.botId })));

    await connection.end();
    console.log('\n去重逻辑测试完成！');

  } catch (error) {
    console.error('去重逻辑测试失败:', error);
    process.exit(1);
  }
}

testDedupLogic(); 