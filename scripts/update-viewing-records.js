#!/usr/bin/env node

/**
 * 更新带看记录中的userId和botId字段
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

async function updateViewingRecords() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功\n');

    // 1. 检查需要更新的带看记录
    console.log('🔍 检查需要更新的带看记录:');
    const [recordsToUpdate] = await connection.execute(`
      SELECT vr.id, vr.customer_id, vr.customer_name, vr.userId as vr_userId, vr.botId as vr_botId,
             c.userId as c_userId, c.botId as c_botId
      FROM qft_ai_viewing_records vr
      LEFT JOIN qft_ai_customers c ON vr.customer_id = c.id
      WHERE (vr.userId IS NULL OR vr.botId IS NULL) 
         OR (vr.userId != c.userId OR vr.botId != c.botId)
         OR (c.userId IS NOT NULL AND vr.userId IS NULL)
         OR (c.botId IS NOT NULL AND vr.botId IS NULL)
      ORDER BY vr.id
    `);
    
    console.log(`需要更新的带看记录数: ${recordsToUpdate.length}\n`);
    
    recordsToUpdate.forEach(record => {
      console.log(`带看ID: ${record.id}, 客户ID: ${record.customer_id}, 客户名: ${record.customer_name}`);
      console.log(`  带看记录: userId=${record.vr_userId}, botId=${record.vr_botId}`);
      console.log(`  客户表: userId=${record.c_userId}, botId=${record.c_botId}\n`);
    });

    // 2. 更新带看记录中的userId和botId字段
    console.log('📝 开始更新带看记录...\n');
    
    let updatedCount = 0;
    for (const record of recordsToUpdate) {
      try {
        const [result] = await connection.execute(`
          UPDATE qft_ai_viewing_records 
          SET userId = ?, botId = ?
          WHERE id = ?
        `, [record.c_userId, record.c_botId, record.id]);
        
        if (result.affectedRows > 0) {
          console.log(`✅ 更新带看记录ID ${record.id}: userId=${record.c_userId}, botId=${record.c_botId}`);
          updatedCount++;
        }
      } catch (error) {
        console.error(`❌ 更新带看记录ID ${record.id} 失败:`, error.message);
      }
    }

    console.log(`\n📊 更新完成: ${updatedCount}/${recordsToUpdate.length} 条记录已更新\n`);

    // 3. 验证更新结果
    console.log('🔍 验证更新结果:');
    const [intersectionViewingRecords] = await connection.execute(`
      SELECT vr.id, vr.customer_id, vr.customer_name, vr.commission, 
             c.userId, c.botId, c.status
      FROM qft_ai_viewing_records vr
      LEFT JOIN qft_ai_customers c ON vr.customer_id = c.id
      WHERE c.userId IN ('123', '456') AND c.botId IN ('bot1', 'bot2')
      ORDER BY vr.id
    `);
    
    console.log('\n交集查询的带看记录:');
    intersectionViewingRecords.forEach(record => {
      console.log(`带看ID: ${record.id}, 客户ID: ${record.customer_id}, 客户名: ${record.customer_name}, 佣金: ${record.commission}, userId: ${record.userId}, botId: ${record.botId}, 状态: ${record.status}`);
    });

    console.log(`\n交集查询的带看记录数: ${intersectionViewingRecords.length}`);

    // 4. 计算期望的统计结果
    const viewingCount = intersectionViewingRecords.length;
    const totalCommission = intersectionViewingRecords.reduce((sum, record) => sum + parseFloat(record.commission || 0), 0);
    
    console.log(`\n📈 期望的统计结果:`);
    console.log(`带看记录数: ${viewingCount}`);
    console.log(`总佣金: ${totalCommission}`);

    // 5. 测试API接口
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
  updateViewingRecords().catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { updateViewingRecords }; 