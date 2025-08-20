#!/usr/bin/env node

/**
 * 插入交集查询测试数据
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

// 交集查询测试数据
const intersectionTestData = [
  // userId=123, botId=bot1 (已存在)
  // userId=123, botId=bot2 (需要插入)
  {
    name: '李四',
    nickname: '小李',
    phone: '13800138011',
    status: 5, // 已成交已结佣
    community: '碧桂园',
    business_type: 'centralized',
    room_type: 'two_bedroom',
    source_channel: 'xiaohongshu',
    userId: '123',
    botId: 'bot2',
    creator: '测试系统',
    is_agent: 1,
    internal_notes: '交集测试客户1'
  },
  // userId=456, botId=bot1 (需要插入)
  {
    name: '赵六',
    nickname: '小赵',
    phone: '13800138012',
    status: 4, // 已成交未结佣
    community: '保利城',
    business_type: 'whole_rent',
    room_type: 'one_bedroom',
    source_channel: '58tongcheng',
    userId: '456',
    botId: 'bot1',
    creator: '测试系统',
    is_agent: 1,
    internal_notes: '交集测试客户2'
  },
  // userId=456, botId=bot2 (需要插入)
  {
    name: '钱七',
    nickname: '小钱',
    phone: '13800138013',
    status: 5, // 已成交已结佣
    community: '龙湖天街',
    business_type: 'centralized',
    room_type: 'two_bedroom',
    source_channel: 'shipinhao',
    userId: '456',
    botId: 'bot2',
    creator: '测试系统',
    is_agent: 1,
    internal_notes: '交集测试客户3'
  }
];

async function insertIntersectionTestData() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功\n');

    console.log('📝 开始插入交集查询测试数据...\n');

    for (const customer of intersectionTestData) {
      try {
        const [result] = await connection.execute(
          `INSERT INTO qft_ai_customers (
            name, nickname, phone, status, community, business_type, room_type,
            source_channel, userId, botId, creator, is_agent, internal_notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            customer.name, customer.nickname, customer.phone, customer.status,
            customer.community, customer.business_type, customer.room_type,
            customer.source_channel, customer.userId, customer.botId,
            customer.creator, customer.is_agent, customer.internal_notes
          ]
        );
        console.log(`✅ 插入客户: ${customer.name} (userId=${customer.userId}, botId=${customer.botId})`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  客户已存在: ${customer.name} (userId=${customer.userId}, botId=${customer.botId})`);
        } else {
          console.error(`❌ 插入客户失败: ${customer.name}`, error.message);
        }
      }
    }

    console.log('\n📝 交集查询测试数据插入完成\n');

    // 验证交集查询
    console.log('🔍 验证交集查询: userId IN (123,456) AND botId IN (bot1,bot2)');
    const [intersectionCustomers] = await connection.execute(`
      SELECT id, name, userId, botId, status 
      FROM qft_ai_customers 
      WHERE userId IN ('123', '456') AND botId IN ('bot1', 'bot2')
      ORDER BY userId, botId
    `);
    
    console.log('\n交集查询结果:');
    intersectionCustomers.forEach(customer => {
      console.log(`ID: ${customer.id}, 姓名: ${customer.name}, userId: ${customer.userId}, botId: ${customer.botId}, 状态: ${customer.status}`);
    });

    console.log(`\n交集查询结果数: ${intersectionCustomers.length}`);

    // 统计各状态的客户数
    const unpaidCount = intersectionCustomers.filter(c => c.status === 4).length;
    const paidCount = intersectionCustomers.filter(c => c.status === 5).length;
    
    console.log(`\n📊 交集查询统计:`);
    console.log(`已成交未结佣: ${unpaidCount}`);
    console.log(`已成交已结佣: ${paidCount}`);

    // 测试API接口
    console.log('\n🌐 测试API接口...');
    const http = require('http');
    
    const testUrl = 'http://localhost:3000/api/external/statistics?userId=123,456&botId=bot1,bot2';
    console.log(`请求URL: ${testUrl}`);
    
    const response = await new Promise((resolve, reject) => {
      http.get(testUrl, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', reject);
    });

    console.log('\nAPI响应:');
    console.log(JSON.stringify(response, null, 2));

    // 验证API结果
    if (response.success && response.data) {
      console.log('\n✅ API验证结果:');
      console.log(`completed_unpaid_count: ${response.data.completed_unpaid_count} (期望: ${unpaidCount})`);
      console.log(`completed_paid_count: ${response.data.completed_paid_count} (期望: ${paidCount})`);
      
      if (response.data.completed_unpaid_count === unpaidCount && response.data.completed_paid_count === paidCount) {
        console.log('🎉 API结果与数据库查询结果一致！');
      } else {
        console.log('⚠️  API结果与数据库查询结果不一致！');
      }
    }

  } catch (error) {
    console.error('❌ 操作失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 数据库连接已关闭');
    }
  }
}

// 启动脚本
if (require.main === module) {
  insertIntersectionTestData().catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { insertIntersectionTestData }; 