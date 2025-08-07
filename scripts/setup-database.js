const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function setupDatabase() {
  try {
    console.log('正在连接MySQL数据库...');

    // 检查环境变量
    if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
      console.error('错误：请确保已配置数据库环境变量 (DB_USER, DB_PASSWORD, DB_NAME)');
      console.log('请复制 .env.example 到 .env.local 并配置您的数据库信息');
      process.exit(1);
    }

    // 创建数据库连接
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: 'utf8mb4'
    });

    console.log('数据库连接成功');
    console.log('正在初始化数据库...');

    // 读取并执行 schema_qft_ai.sql
    const schemaPath = path.join(process.cwd(), 'src', 'lib', 'database', 'schema_qft_ai.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error(`错误：找不到schema文件: ${schemaPath}`);
      process.exit(1);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // 分割SQL语句并逐个执行
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      try {
        await connection.query(statement);
      } catch (error) {
        console.error(`执行SQL语句失败: ${statement.substring(0, 100)}...`);
        console.error(error.message);
      }
    }

    console.log('数据库表结构创建完成');

    // 插入示例数据
    console.log('正在插入示例数据...');

    // 插入示例客户数据
    const insertCustomerSQL = `
      INSERT INTO qft_ai_customers (
        name, phone, backup_phone, wechat, status, community, business_type, 
        room_type, room_tags, move_in_date, lease_period, price_range, 
        source_channel, creator, is_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const sampleCustomers = [
      ['张三', '13800138001', '13900139001', 'zhangsan_wx', 1, '万科城市花园', 'whole_rent', 'two_bedroom', '["flat","two_bath"]', '2024-02-01', 12, '8000-10000', 'beike', '李管家', 1],
      ['李四', '13800138002', null, 'lisi_wx', 3, '保利香槟国际', 'shared_rent', 'master_room', '["loft"]', '2024-01-15', 6, '3000-4000', 'xianyu', '王管家', 1],
      ['王五', '13800138003', '13900139003', null, 1, '绿地中央广场', 'centralized', 'one_bedroom', '["studio"]', '2024-03-01', 12, '6000-8000', 'xiaohongshu', '赵管家', 1],
      ['赵六', '13800138004', null, 'zhaoliu_wx', 2, '中海国际社区', 'whole_rent', 'three_bedroom', '["flat"]', null, 24, '12000-15000', '58tongcheng', '李管家', 1],
      ['钱七', '13800138005', '13900139005', 'qianqi_wx', 4, '万达广场', 'shared_rent', 'second_room', '["flat"]', '2024-01-20', 3, '2500-3500', 'douyin', '王管家', 1],
    ];

    for (const customer of sampleCustomers) {
      await connection.execute(insertCustomerSQL, customer);
    }

    console.log('客户示例数据插入完成');

    // 插入示例带看记录数据
    const insertViewingRecordSQL = `
      INSERT INTO qft_ai_viewing_records (
        customer_id, viewing_time, property_name, property_address,
        room_type, room_tag, viewer_name, viewing_status, viewing_feedback, commission, notes, business_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (let i = 1; i <= 20; i++) {
      const customerId = Math.ceil(Math.random() * 5); // 只有5个客户
      const viewingDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const viewerTypes = ['internal', 'external', 'external_sales', 'creator'];

      await connection.execute(insertViewingRecordSQL, [
        customerId,
        viewingDate.toISOString().slice(0, 19).replace('T', ' '), // MySQL DATETIME格式
        `测试楼盘${i}`,
        `测试地址${i}号`,
        ['one_bedroom', 'two_bedroom', 'three_bedroom'][Math.floor(Math.random() * 3)],
        ['studio', 'loft', 'flat', null][Math.floor(Math.random() * 4)],
        viewerTypes[Math.floor(Math.random() * viewerTypes.length)],
        Math.floor(Math.random() * 4) + 1,
        Math.floor(Math.random() * 2),
        Math.floor(Math.random() * 5000) + 1000,
        `测试备注${i}`,
        ['whole_rent', 'centralized', 'shared_rent'][Math.floor(Math.random() * 3)]
      ]);
    }

    console.log('带看记录示例数据插入完成');

    // 更新客户的统计数据（佣金总和、带看次数）
    await connection.query(`
      UPDATE qft_ai_customers SET 
        total_commission = (
          SELECT COALESCE(SUM(commission), 0) 
          FROM qft_ai_viewing_records 
          WHERE qft_ai_viewing_records.customer_id = qft_ai_customers.id
        ),
        viewing_count = (
          SELECT COUNT(*) 
          FROM qft_ai_viewing_records 
          WHERE qft_ai_viewing_records.customer_id = qft_ai_customers.id
        )
    `);

    console.log('客户统计数据更新完成');

    // 关闭数据库连接
    await connection.end();

    console.log('数据库初始化完成！');
    console.log(`数据库信息: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    console.log('可以运行 npm run dev 启动应用了。');

  } catch (error) {
    console.error('数据库初始化失败:', error);
    console.error('\n请检查：');
    console.error('1. MySQL服务是否已启动');
    console.error('2. 数据库连接信息是否正确（.env.local文件）');
    console.error('3. 数据库用户是否有足够权限');
    process.exit(1);
  }
}

// 运行脚本
setupDatabase(); 