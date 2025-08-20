#!/usr/bin/env node

/**
 * 为交集查询的客户插入带看记录
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

// 交集查询客户的带看记录数据
const intersectionViewingRecords = [
  // 客户30 (张三, userId=123, botId=bot1)
  {
    customer_id: 30,
    viewing_time: '2024-01-15 10:00:00',
    property_name: '万科星城A栋',
    property_address: '深圳市南山区科技园',
    room_type: 'one_bedroom',
    viewer_name: 'internal',
    viewing_status: 4, // 已带看
    commission: 5000.00,
    viewing_feedback: 1, // 已成交
    business_type: 'whole_rent',
    notes: '客户对房源很满意',
    customer_name: '张三',
    customer_phone: '13800138001',
    userId: '123',
    botId: 'bot1'
  },
  {
    customer_id: 30,
    viewing_time: '2024-01-20 14:00:00',
    property_name: '万科星城B栋',
    property_address: '深圳市南山区科技园',
    room_type: 'one_bedroom',
    viewer_name: 'external',
    viewing_status: 4, // 已带看
    commission: 3000.00,
    viewing_feedback: 0, // 未成交
    business_type: 'whole_rent',
    notes: '客户觉得价格偏高',
    customer_name: '张三',
    customer_phone: '13800138001',
    userId: '123',
    botId: 'bot1'
  },
  
  // 客户40 (李四, userId=123, botId=bot2)
  {
    customer_id: 40,
    viewing_time: '2024-01-18 16:00:00',
    property_name: '碧桂园一期',
    property_address: '深圳市宝安区西乡',
    room_type: 'two_bedroom',
    viewer_name: 'external_sales',
    viewing_status: 4, // 已带看
    commission: 8000.00,
    viewing_feedback: 1, // 已成交
    business_type: 'centralized',
    notes: '客户当场签约',
    customer_name: '李四',
    customer_phone: '13800138011',
    userId: '123',
    botId: 'bot2'
  },
  
  // 客户41 (赵六, userId=456, botId=bot1)
  {
    customer_id: 41,
    viewing_time: '2024-02-10 09:00:00',
    property_name: '保利城一期',
    property_address: '深圳市龙岗区布吉',
    room_type: 'one_bedroom',
    viewer_name: 'internal',
    viewing_status: 4, // 已带看
    commission: 6000.00,
    viewing_feedback: 1, // 已成交
    business_type: 'whole_rent',
    notes: '客户对位置很满意',
    customer_name: '赵六',
    customer_phone: '13800138012',
    userId: '456',
    botId: 'bot1'
  },
  {
    customer_id: 41,
    viewing_time: '2024-02-15 11:00:00',
    property_name: '保利城二期',
    property_address: '深圳市龙岗区布吉',
    room_type: 'one_bedroom',
    viewer_name: 'external',
    viewing_status: 4, // 已带看
    commission: 4000.00,
    viewing_feedback: 0, // 未成交
    business_type: 'whole_rent',
    notes: '客户觉得户型不够好',
    customer_name: '赵六',
    customer_phone: '13800138012',
    userId: '456',
    botId: 'bot1'
  },
  
  // 客户42 (钱七, userId=456, botId=bot2)
  {
    customer_id: 42,
    viewing_time: '2024-02-20 15:00:00',
    property_name: '龙湖天街一期',
    property_address: '深圳市福田区车公庙',
    room_type: 'two_bedroom',
    viewer_name: 'external_sales',
    viewing_status: 4, // 已带看
    commission: 12000.00,
    viewing_feedback: 1, // 已成交
    business_type: 'centralized',
    notes: '高端客户，对品质要求很高',
    customer_name: '钱七',
    customer_phone: '13800138013',
    userId: '456',
    botId: 'bot2'
  }
];

async function insertViewingRecordsForIntersection() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功\n');

    console.log('📝 开始为交集查询客户插入带看记录...\n');

    for (const record of intersectionViewingRecords) {
      try {
        const [result] = await connection.execute(
          `INSERT INTO qft_ai_viewing_records (
            customer_id, viewing_time, property_name, property_address, room_type,
            viewer_name, viewing_status, commission, viewing_feedback, business_type,
            notes, customer_name, customer_phone, userId, botId
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            record.customer_id, record.viewing_time, record.property_name,
            record.property_address, record.room_type, record.viewer_name,
            record.viewing_status, record.commission, record.viewing_feedback,
            record.business_type, record.notes, record.customer_name,
            record.customer_phone, record.userId, record.botId
          ]
        );
        console.log(`✅ 插入带看记录: ${record.customer_name} - ${record.property_name} (佣金: ${record.commission})`);
      } catch (error) {
        console.error(`❌ 插入带看记录失败: ${record.customer_name}`, error.message);
      }
    }

    console.log('\n📝 带看记录插入完成\n');

    // 验证交集查询的带看记录
    console.log('🔍 验证交集查询的带看记录:');
    const [intersectionRecords] = await connection.execute(`
      SELECT vr.id, vr.customer_id, vr.customer_name, vr.commission, 
             c.userId, c.botId, c.status
      FROM qft_ai_viewing_records vr
      LEFT JOIN qft_ai_customers c ON vr.customer_id = c.id
      WHERE c.userId IN ('123', '456') AND c.botId IN ('bot1', 'bot2')
      ORDER BY vr.id
    `);
    
    console.log('\n交集查询的带看记录:');
    intersectionRecords.forEach(record => {
      console.log(`带看ID: ${record.id}, 客户ID: ${record.customer_id}, 客户名: ${record.customer_name}, 佣金: ${record.commission}, userId: ${record.userId}, botId: ${record.botId}, 状态: ${record.status}`);
    });

    console.log(`\n交集查询的带看记录数: ${intersectionRecords.length}`);

    // 计算期望的统计结果
    const viewingCount = intersectionRecords.length;
    const totalCommission = intersectionRecords.reduce((sum, record) => sum + parseFloat(record.commission || 0), 0);
    
    console.log(`\n📈 期望的统计结果:`);
    console.log(`带看记录数: ${viewingCount}`);
    console.log(`总佣金: ${totalCommission}`);

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
      console.log(`viewing_count: ${response.data.viewing_count} (期望: ${viewingCount})`);
      console.log(`total_commission: ${response.data.total_commission} (期望: ${totalCommission})`);
      
      if (response.data.viewing_count === viewingCount && response.data.total_commission === totalCommission) {
        console.log('🎉 API结果与期望结果一致！');
      } else {
        console.log('⚠️  API结果与期望结果不一致！');
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
  insertViewingRecordsForIntersection().catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { insertViewingRecordsForIntersection }; 