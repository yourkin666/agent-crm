const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function checkCityData() {
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

    // 检查带看记录表中的城市数据
    console.log('\n=== 带看记录表中的城市数据 ===');
    const [viewingRecords] = await connection.query(`
      SELECT id, customer_id, cityName, property_name 
      FROM qft_ai_viewing_records 
      WHERE cityName IS NOT NULL 
      ORDER BY id 
      LIMIT 10
    `);
    
    console.table(viewingRecords);

    // 检查城市分布
    console.log('\n=== 城市分布统计 ===');
    const [cityStats] = await connection.query(`
      SELECT cityName, COUNT(*) as count 
      FROM qft_ai_viewing_records 
      WHERE cityName IS NOT NULL 
      GROUP BY cityName 
      ORDER BY count DESC
    `);
    
    console.table(cityStats);

    // 测试城市筛选查询
    console.log('\n=== 测试城市筛选查询 ===');
    const [beijingCustomers] = await connection.query(`
      SELECT c.id, c.name, c.phone, vr.cityName, vr.property_name
      FROM qft_ai_customers c
      INNER JOIN qft_ai_viewing_records vr ON c.id = vr.customer_id
      WHERE (vr.cityName LIKE '%北京%' OR vr.cityName LIKE '北京市' OR vr.cityName = '北京')
      ORDER BY c.id
    `);
    
    console.log('筛选"北京"的客户数量:', beijingCustomers.length);
    if (beijingCustomers.length > 0) {
      console.table(beijingCustomers);
    }

    // 测试EXISTS查询（与API相同的逻辑）
    console.log('\n=== 测试EXISTS查询（API逻辑） ===');
    const [existsCustomers] = await connection.query(`
      SELECT c.id, c.name, c.phone
      FROM qft_ai_customers c
      WHERE EXISTS (
        SELECT 1 FROM qft_ai_viewing_records vr 
        WHERE vr.customer_id = c.id 
        AND (vr.cityName LIKE '%北京%' OR vr.cityName LIKE '北京市' OR vr.cityName = '北京')
      )
      ORDER BY c.id
    `);
    
    console.log('EXISTS查询筛选"北京"的客户数量:', existsCustomers.length);
    if (existsCustomers.length > 0) {
      console.table(existsCustomers);
    }

    await connection.end();
    console.log('\n数据检查完成！');

  } catch (error) {
    console.error('数据检查失败:', error);
    process.exit(1);
  }
}

checkCityData(); 