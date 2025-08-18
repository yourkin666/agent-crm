const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function debugExistsQuery() {
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

    // 测试1: 检查EXISTS子查询的各个部分
    console.log('\n=== 测试1: 检查EXISTS子查询的各个部分 ===');
    
    // 检查客户ID为4的带看记录
    console.log('1.1 检查客户ID为4的带看记录');
    const [records4] = await connection.query(`
      SELECT id, customer_id, cityName, property_name 
      FROM qft_ai_viewing_records 
      WHERE customer_id = 4
    `);
    console.log('客户4的带看记录数量:', records4.length);
    console.table(records4);

    // 检查城市名称匹配
    console.log('\n1.2 检查城市名称匹配');
    for (const record of records4) {
      const matches = [];
      if (record.cityName.includes('北京')) matches.push('LIKE %北京%');
      if (record.cityName === '北京市') matches.push('= 北京市');
      if (record.cityName === '北京') matches.push('= 北京');
      
      console.log(`记录ID ${record.id}: cityName="${record.cityName}" 匹配: ${matches.join(', ')}`);
    }

    // 测试2: 逐步测试EXISTS查询
    console.log('\n=== 测试2: 逐步测试EXISTS查询 ===');
    
    // 测试2.1: 最简单的EXISTS查询
    console.log('2.1 最简单的EXISTS查询');
    const [exists1] = await connection.query(`
      SELECT * FROM qft_ai_customers 
      WHERE EXISTS (SELECT 1 FROM qft_ai_viewing_records vr WHERE vr.customer_id = id)
      AND id = 4
    `);
    console.log('结果数量:', exists1.length);
    console.table(exists1.map(r => ({ id: r.id, name: r.name })));

    // 测试2.2: 添加城市名称条件
    console.log('\n2.2 添加城市名称条件');
    const [exists2] = await connection.query(`
      SELECT * FROM qft_ai_customers 
      WHERE EXISTS (
        SELECT 1 FROM qft_ai_viewing_records vr 
        WHERE vr.customer_id = id 
        AND (vr.cityName LIKE '%北京%' OR vr.cityName = '北京市' OR vr.cityName = '北京')
      )
      AND id = 4
    `);
    console.log('结果数量:', exists2.length);
    console.table(exists2.map(r => ({ id: r.id, name: r.name })));

    // 测试2.3: 使用参数化查询
    console.log('\n2.3 使用参数化查询');
    const [exists3] = await connection.query(`
      SELECT * FROM qft_ai_customers 
      WHERE EXISTS (
        SELECT 1 FROM qft_ai_viewing_records vr 
        WHERE vr.customer_id = id 
        AND (vr.cityName LIKE ? OR vr.cityName LIKE ? OR vr.cityName = ?)
      )
      AND id = 4
    `, ['%北京%', '北京市', '北京']);
    console.log('结果数量:', exists3.length);
    console.table(exists3.map(r => ({ id: r.id, name: r.name })));

    // 测试3: 检查所有客户的EXISTS查询
    console.log('\n=== 测试3: 检查所有客户的EXISTS查询 ===');
    const [allExists] = await connection.query(`
      SELECT c.id, c.name, 
             EXISTS (
               SELECT 1 FROM qft_ai_viewing_records vr 
               WHERE vr.customer_id = c.id 
               AND (vr.cityName LIKE '%北京%' OR vr.cityName = '北京市' OR vr.cityName = '北京')
             ) as has_beijing_record
      FROM qft_ai_customers c
      ORDER BY c.id
    `);
    console.log('所有客户的北京记录检查:');
    console.table(allExists);

    await connection.end();
    console.log('\nEXISTS查询调试完成！');

  } catch (error) {
    console.error('EXISTS查询调试失败:', error);
    process.exit(1);
  }
}

debugExistsQuery(); 