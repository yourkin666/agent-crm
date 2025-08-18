const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function checkCustomerData() {
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

    // 检查客户表的完整数据
    console.log('\n=== 客户表完整数据 ===');
    const [customers] = await connection.query(`
      SELECT id, name, phone, userId, botId, created_at, updated_at
      FROM qft_ai_customers 
      ORDER BY id
    `);
    
    console.table(customers);

    // 检查去重逻辑的影响
    console.log('\n=== 测试API去重逻辑 ===');
    const [dedupedCustomers] = await connection.query(`
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
      ORDER BY c.created_at DESC
    `);
    
    console.log('去重后的客户数量:', dedupedCustomers.length);
    if (dedupedCustomers.length > 0) {
      console.table(dedupedCustomers.map(c => ({ id: c.id, name: c.name, phone: c.phone, userId: c.userId, botId: c.botId })));
    }

    // 检查每个客户的userId情况
    console.log('\n=== 每个客户的userId情况 ===');
    for (const customer of customers) {
      const [duplicates] = await connection.query(`
        SELECT id, userId, botId, created_at 
        FROM qft_ai_customers 
        WHERE userId = ? 
        ORDER BY created_at DESC
      `, [customer.userId]);
      
      if (duplicates.length > 1) {
        console.log(`客户 ${customer.name} (ID: ${customer.id}) 有 ${duplicates.length} 个重复记录:`);
        console.table(duplicates);
      }
    }

    await connection.end();
    console.log('\n客户数据检查完成！');

  } catch (error) {
    console.error('客户数据检查失败:', error);
    process.exit(1);
  }
}

checkCustomerData(); 