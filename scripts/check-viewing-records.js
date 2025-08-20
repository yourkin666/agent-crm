#!/usr/bin/env node

/**
 * 检查带看记录的详细信息
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

async function checkViewingRecords() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功\n');

    // 1. 检查所有带看记录
    console.log('📊 所有带看记录:');
    const [allViewingRecords] = await connection.execute(`
      SELECT vr.id, vr.customer_id, vr.customer_name, vr.commission, 
             c.userId, c.botId, c.status
      FROM qft_ai_viewing_records vr
      LEFT JOIN qft_ai_customers c ON vr.customer_id = c.id
      ORDER BY vr.id
    `);
    
    allViewingRecords.forEach(record => {
      console.log(`带看ID: ${record.id}, 客户ID: ${record.customer_id}, 客户名: ${record.customer_name}, 佣金: ${record.commission}, userId: ${record.userId}, botId: ${record.botId}, 状态: ${record.status}`);
    });

    console.log(`\n总带看记录数: ${allViewingRecords.length}\n`);

    // 2. 检查交集查询客户的带看记录
    console.log('🔍 交集查询客户的带看记录:');
    const [intersectionViewingRecords] = await connection.execute(`
      SELECT vr.id, vr.customer_id, vr.customer_name, vr.commission, 
             c.userId, c.botId, c.status
      FROM qft_ai_viewing_records vr
      LEFT JOIN qft_ai_customers c ON vr.customer_id = c.id
      WHERE c.userId IN ('123', '456') AND c.botId IN ('bot1', 'bot2')
      ORDER BY vr.id
    `);
    
    intersectionViewingRecords.forEach(record => {
      console.log(`带看ID: ${record.id}, 客户ID: ${record.customer_id}, 客户名: ${record.customer_name}, 佣金: ${record.commission}, userId: ${record.userId}, botId: ${record.botId}, 状态: ${record.status}`);
    });

    console.log(`\n交集查询的带看记录数: ${intersectionViewingRecords.length}\n`);

    // 3. 检查交集查询的客户ID
    console.log('🔍 交集查询的客户ID:');
    const [intersectionCustomers] = await connection.execute(`
      SELECT id, name, userId, botId, status 
      FROM qft_ai_customers 
      WHERE userId IN ('123', '456') AND botId IN ('bot1', 'bot2')
      ORDER BY id
    `);
    
    const customerIds = intersectionCustomers.map(c => c.id);
    console.log(`交集查询的客户ID: ${customerIds.join(', ')}\n`);

    // 4. 检查这些客户ID的带看记录
    console.log('🔍 交集查询客户ID的带看记录:');
    if (customerIds.length > 0) {
      const [customerViewingRecords] = await connection.execute(`
        SELECT vr.id, vr.customer_id, vr.customer_name, vr.commission, 
               c.userId, c.botId, c.status
        FROM qft_ai_viewing_records vr
        LEFT JOIN qft_ai_customers c ON vr.customer_id = c.id
        WHERE vr.customer_id IN (${customerIds.join(',')})
        ORDER BY vr.id
      `);
      
      customerViewingRecords.forEach(record => {
        console.log(`带看ID: ${record.id}, 客户ID: ${record.customer_id}, 客户名: ${record.customer_name}, 佣金: ${record.commission}, userId: ${record.userId}, botId: ${record.botId}, 状态: ${record.status}`);
      });

      console.log(`\n交集查询客户ID的带看记录数: ${customerViewingRecords.length}\n`);
    }

    // 5. 检查带看记录中的userId和botId字段
    console.log('🔍 带看记录中的userId和botId字段:');
    const [viewingRecordsWithUserBot] = await connection.execute(`
      SELECT id, customer_id, customer_name, commission, userId, botId
      FROM qft_ai_viewing_records
      WHERE userId IS NOT NULL OR botId IS NOT NULL
      ORDER BY id
    `);
    
    viewingRecordsWithUserBot.forEach(record => {
      console.log(`带看ID: ${record.id}, 客户ID: ${record.customer_id}, 客户名: ${record.customer_name}, 佣金: ${record.commission}, userId: ${record.userId}, botId: ${record.botId}`);
    });

    console.log(`\n带看记录中有userId或botId的记录数: ${viewingRecordsWithUserBot.length}\n`);

    // 6. 检查带看记录中符合交集条件的记录
    console.log('🔍 带看记录中符合交集条件的记录:');
    const [intersectionViewingRecordsDirect] = await connection.execute(`
      SELECT id, customer_id, customer_name, commission, userId, botId
      FROM qft_ai_viewing_records
      WHERE userId IN ('123', '456') AND botId IN ('bot1', 'bot2')
      ORDER BY id
    `);
    
    intersectionViewingRecordsDirect.forEach(record => {
      console.log(`带看ID: ${record.id}, 客户ID: ${record.customer_id}, 客户名: ${record.customer_name}, 佣金: ${record.commission}, userId: ${record.userId}, botId: ${record.botId}`);
    });

    console.log(`\n带看记录中符合交集条件的记录数: ${intersectionViewingRecordsDirect.length}\n`);

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
  checkViewingRecords().catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { checkViewingRecords }; 