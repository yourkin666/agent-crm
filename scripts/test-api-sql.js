const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function testApiSQL() {
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

    // 测试API中使用的SQL查询
    console.log('\n=== 测试API中使用的SQL查询 ===');
    
    // 测试1: 单城市筛选（API逻辑）
    console.log('1. 测试单城市筛选"北京"');
    const [beijingResult] = await connection.query(`
      SELECT * FROM qft_ai_customers 
      WHERE EXISTS (SELECT 1 FROM qft_ai_viewing_records vr WHERE vr.customer_id = id AND (vr.cityName LIKE ? OR vr.cityName LIKE ? OR vr.cityName = ?))
      LIMIT 5
    `, ['%北京%', '北京市', '北京']);
    console.log('结果数量:', beijingResult.length);
    console.table(beijingResult.map(r => ({ id: r.id, name: r.name, phone: r.phone })));

    // 测试2: 多城市筛选（API逻辑）
    console.log('\n2. 测试多城市筛选["北京","上海"]');
    const [multiResult] = await connection.query(`
      SELECT * FROM qft_ai_customers 
      WHERE EXISTS (SELECT 1 FROM qft_ai_viewing_records vr WHERE vr.customer_id = id AND ((vr.cityName LIKE ? OR vr.cityName LIKE ? OR vr.cityName = ?) OR (vr.cityName LIKE ? OR vr.cityName LIKE ? OR vr.cityName = ?)))
      LIMIT 5
    `, ['%北京%', '北京市', '北京', '%上海%', '上海市', '上海']);
    console.log('结果数量:', multiResult.length);
    console.table(multiResult.map(r => ({ id: r.id, name: r.name, phone: r.phone })));

    // 测试3: 检查带看记录表中的实际数据
    console.log('\n3. 检查带看记录表中的北京相关数据');
    const [beijingRecords] = await connection.query(`
      SELECT id, customer_id, cityName, property_name 
      FROM qft_ai_viewing_records 
      WHERE cityName LIKE '%北京%' OR cityName = '北京' OR cityName = '北京市'
    `);
    console.log('北京相关带看记录数量:', beijingRecords.length);
    console.table(beijingRecords);

    // 测试4: 检查客户ID为4的数据
    console.log('\n4. 检查客户ID为4的数据');
    const [customer4] = await connection.query(`
      SELECT id, name, phone, userId, botId 
      FROM qft_ai_customers 
      WHERE id = 4
    `);
    console.log('客户4数据:');
    console.table(customer4);

    // 测试5: 检查客户4的所有带看记录
    console.log('\n5. 检查客户4的所有带看记录');
    const [customer4Records] = await connection.query(`
      SELECT id, customer_id, cityName, property_name 
      FROM qft_ai_viewing_records 
      WHERE customer_id = 4
    `);
    console.log('客户4的带看记录数量:', customer4Records.length);
    console.table(customer4Records);

    await connection.end();
    console.log('\nAPI SQL测试完成！');

  } catch (error) {
    console.error('API SQL测试失败:', error);
    process.exit(1);
  }
}

testApiSQL(); 