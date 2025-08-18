const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function testSimpleCityFilter() {
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

    // 测试1: 直接查询带看记录表中的北京数据
    console.log('\n=== 测试1: 带看记录表中的北京数据 ===');
    const [beijingRecords] = await connection.query(`
      SELECT id, customer_id, cityName, property_name 
      FROM qft_ai_viewing_records 
      WHERE cityName LIKE '%北京%' OR cityName = '北京' OR cityName = '北京市'
    `);
    console.log('北京相关带看记录数量:', beijingRecords.length);
    console.table(beijingRecords);

    // 测试2: 通过customer_id关联查询客户
    console.log('\n=== 测试2: 通过customer_id关联查询客户 ===');
    if (beijingRecords.length > 0) {
      const customerIds = [...new Set(beijingRecords.map(r => r.customer_id))];
      console.log('相关的客户ID:', customerIds);
      
      const [customers] = await connection.query(`
        SELECT id, name, phone, userId, botId 
        FROM qft_ai_customers 
        WHERE id IN (${customerIds.map(() => '?').join(',')})
      `, customerIds);
      console.log('相关客户数量:', customers.length);
      console.table(customers);
    }

    // 测试3: 使用EXISTS查询（API逻辑）
    console.log('\n=== 测试3: 使用EXISTS查询（API逻辑） ===');
    const [existsResult] = await connection.query(`
      SELECT c.id, c.name, c.phone, c.userId, c.botId
      FROM qft_ai_customers c
      WHERE EXISTS (
        SELECT 1 FROM qft_ai_viewing_records vr 
        WHERE vr.customer_id = c.id 
        AND (vr.cityName LIKE '%北京%' OR vr.cityName LIKE '北京市' OR vr.cityName = '北京')
      )
    `);
    console.log('EXISTS查询结果数量:', existsResult.length);
    console.table(existsResult);

    // 测试4: 测试不同的城市筛选条件
    console.log('\n=== 测试4: 测试不同的城市筛选条件 ===');
    const testCities = ['北京', '北京市', '上海', '上海市', '广州', '广州市'];
    
    for (const city of testCities) {
      const [result] = await connection.query(`
        SELECT COUNT(*) as count
        FROM qft_ai_customers c
        WHERE EXISTS (
          SELECT 1 FROM qft_ai_viewing_records vr 
          WHERE vr.customer_id = c.id 
          AND (vr.cityName LIKE ? OR vr.cityName LIKE ? OR vr.cityName = ?)
        )
      `, [`%${city}%`, `${city}市`, city]);
      
      console.log(`筛选"${city}"的客户数量: ${result[0].count}`);
    }

    await connection.end();
    console.log('\n简单城市筛选测试完成！');

  } catch (error) {
    console.error('简单城市筛选测试失败:', error);
    process.exit(1);
  }
}

testSimpleCityFilter(); 