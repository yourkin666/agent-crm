#!/usr/bin/env node

/**
 * 检查数据库中的实际数据
 */

require('dotenv').config({ path: '.env.local' });

const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'qft_ai',
  charset: 'utf8mb4'
};

async function checkData() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功\n');

    // 1. 检查所有客户数据
    console.log('📊 所有客户数据:');
    const [allCustomers] = await connection.execute(`
      SELECT id, name, userId, botId, status 
      FROM qft_ai_customers 
      ORDER BY id
    `);
    
    allCustomers.forEach(customer => {
      console.log(`ID: ${customer.id}, 姓名: ${customer.name}, userId: ${customer.userId}, botId: ${customer.botId}, 状态: ${customer.status}`);
    });

    console.log(`\n总客户数: ${allCustomers.length}\n`);

    // 2. 检查userId为123的客户
    console.log('🔍 userId=123的客户:');
    const [userId123Customers] = await connection.execute(`
      SELECT id, name, userId, botId, status 
      FROM qft_ai_customers 
      WHERE userId = '123'
      ORDER BY id
    `);
    
    userId123Customers.forEach(customer => {
      console.log(`ID: ${customer.id}, 姓名: ${customer.name}, userId: ${customer.userId}, botId: ${customer.botId}, 状态: ${customer.status}`);
    });

    console.log(`\nuserId=123的客户数: ${userId123Customers.length}\n`);

    // 3. 检查userId为456的客户
    console.log('🔍 userId=456的客户:');
    const [userId456Customers] = await connection.execute(`
      SELECT id, name, userId, botId, status 
      FROM qft_ai_customers 
      WHERE userId = '456'
      ORDER BY id
    `);
    
    userId456Customers.forEach(customer => {
      console.log(`ID: ${customer.id}, 姓名: ${customer.name}, userId: ${customer.userId}, botId: ${customer.botId}, 状态: ${customer.status}`);
    });

    console.log(`\nuserId=456的客户数: ${userId456Customers.length}\n`);

    // 4. 检查botId为bot1的客户
    console.log('🔍 botId=bot1的客户:');
    const [botIdBot1Customers] = await connection.execute(`
      SELECT id, name, userId, botId, status 
      FROM qft_ai_customers 
      WHERE botId = 'bot1'
      ORDER BY id
    `);
    
    botIdBot1Customers.forEach(customer => {
      console.log(`ID: ${customer.id}, 姓名: ${customer.name}, userId: ${customer.userId}, botId: ${customer.botId}, 状态: ${customer.status}`);
    });

    console.log(`\nbotId=bot1的客户数: ${botIdBot1Customers.length}\n`);

    // 5. 检查botId为bot2的客户
    console.log('🔍 botId=bot2的客户:');
    const [botIdBot2Customers] = await connection.execute(`
      SELECT id, name, userId, botId, status 
      FROM qft_ai_customers 
      WHERE botId = 'bot2'
      ORDER BY id
    `);
    
    botIdBot2Customers.forEach(customer => {
      console.log(`ID: ${customer.id}, 姓名: ${customer.name}, userId: ${customer.userId}, botId: ${customer.botId}, 状态: ${customer.status}`);
    });

    console.log(`\nbotId=bot2的客户数: ${botIdBot2Customers.length}\n`);

    // 6. 检查交集查询：userId IN ('123', '456') AND botId IN ('bot1', 'bot2')
    console.log('🔍 交集查询: userId IN (123,456) AND botId IN (bot1,bot2)');
    const [intersectionCustomers] = await connection.execute(`
      SELECT id, name, userId, botId, status 
      FROM qft_ai_customers 
      WHERE userId IN ('123', '456') AND botId IN ('bot1', 'bot2')
      ORDER BY id
    `);
    
    intersectionCustomers.forEach(customer => {
      console.log(`ID: ${customer.id}, 姓名: ${customer.name}, userId: ${customer.userId}, botId: ${customer.botId}, 状态: ${customer.status}`);
    });

    console.log(`\n交集查询结果数: ${intersectionCustomers.length}\n`);

    // 7. 检查带看记录
    console.log('🔍 带看记录统计:');
    const [viewingRecords] = await connection.execute(`
      SELECT COUNT(*) as total_count, 
             COUNT(DISTINCT customer_id) as unique_customers,
             COALESCE(SUM(commission), 0) as total_commission
      FROM qft_ai_viewing_records
    `);
    
    console.log(`总带看记录数: ${viewingRecords[0].total_count}`);
    console.log(`涉及客户数: ${viewingRecords[0].unique_customers}`);
    console.log(`总佣金: ${viewingRecords[0].total_commission}\n`);

    // 8. 检查交集查询的带看记录
    console.log('🔍 交集查询的带看记录:');
    const [intersectionViewingRecords] = await connection.execute(`
      SELECT vr.id, vr.customer_id, vr.customer_name, vr.commission, c.userId, c.botId
      FROM qft_ai_viewing_records vr
      LEFT JOIN qft_ai_customers c ON vr.customer_id = c.id
      WHERE c.userId IN ('123', '456') AND c.botId IN ('bot1', 'bot2')
      ORDER BY vr.id
    `);
    
    intersectionViewingRecords.forEach(record => {
      console.log(`带看ID: ${record.id}, 客户ID: ${record.customer_id}, 客户名: ${record.customer_name}, 佣金: ${record.commission}, userId: ${record.userId}, botId: ${record.botId}`);
    });

    console.log(`\n交集查询的带看记录数: ${intersectionViewingRecords.length}\n`);

    // 9. 手动计算期望的统计结果
    console.log('📈 手动计算期望的统计结果:');
    
    // 客户状态统计
    const unpaidCount = intersectionCustomers.filter(c => c.status === 4).length;
    const paidCount = intersectionCustomers.filter(c => c.status === 5).length;
    
    console.log(`已成交未结佣: ${unpaidCount}`);
    console.log(`已成交已结佣: ${paidCount}`);
    
    // 带看记录统计
    const viewingCount = intersectionViewingRecords.length;
    const totalCommission = intersectionViewingRecords.reduce((sum, record) => sum + parseFloat(record.commission || 0), 0);
    
    console.log(`带看记录数: ${viewingCount}`);
    console.log(`总佣金: ${totalCommission}`);

  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 数据库连接已关闭');
    }
  }
}

// 启动脚本
if (require.main === module) {
  checkData().catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { checkData }; 