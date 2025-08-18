const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function finalTest() {
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

    // 最终测试：完整的城市筛选查询
    console.log('\n=== 最终测试：完整的城市筛选查询 ===');
    
    // 测试1: 不使用参数化查询
    console.log('1. 不使用参数化查询');
    const [result1] = await connection.query(`
      SELECT * FROM qft_ai_customers 
      WHERE EXISTS (
        SELECT 1 FROM qft_ai_viewing_records vr 
        WHERE vr.customer_id = id 
        AND (vr.cityName LIKE '%北京%' OR vr.cityName = '北京市' OR vr.cityName = '北京')
      )
    `);
    console.log('结果数量:', result1.length);
    console.table(result1.map(r => ({ id: r.id, name: r.name, phone: r.phone })));

    // 测试2: 使用参数化查询
    console.log('\n2. 使用参数化查询');
    const [result2] = await connection.query(`
      SELECT * FROM qft_ai_customers 
      WHERE EXISTS (
        SELECT 1 FROM qft_ai_viewing_records vr 
        WHERE vr.customer_id = id 
        AND (vr.cityName LIKE ? OR vr.cityName LIKE ? OR vr.cityName = ?)
      )
    `, ['%北京%', '北京市', '北京']);
    console.log('结果数量:', result2.length);
    console.table(result2.map(r => ({ id: r.id, name: r.name, phone: r.phone })));

    // 测试3: 检查数据库字符集
    console.log('\n3. 检查数据库字符集');
    const [charset] = await connection.query('SHOW VARIABLES LIKE "character_set%"');
    console.log('字符集设置:');
    console.table(charset);

    // 测试4: 检查表字符集
    console.log('\n4. 检查表字符集');
    const [tableCharset] = await connection.query(`
      SELECT TABLE_NAME, TABLE_COLLATION 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('qft_ai_customers', 'qft_ai_viewing_records')
    `, [process.env.DB_NAME]);
    console.log('表字符集:');
    console.table(tableCharset);

    // 测试5: 检查字段字符集
    console.log('\n5. 检查字段字符集');
    const [fieldCharset] = await connection.query(`
      SELECT TABLE_NAME, COLUMN_NAME, CHARACTER_SET_NAME, COLLATION_NAME
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'qft_ai_viewing_records' 
      AND COLUMN_NAME = 'cityName'
    `, [process.env.DB_NAME]);
    console.log('cityName字段字符集:');
    console.table(fieldCharset);

    await connection.end();
    console.log('\n最终测试完成！');

  } catch (error) {
    console.error('最终测试失败:', error);
    process.exit(1);
  }
}

finalTest(); 