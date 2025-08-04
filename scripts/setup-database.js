const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');

// 数据库文件路径
const DB_PATH = path.join(process.cwd(), 'data', 'crm.db');
const DATA_DIR = path.dirname(DB_PATH);

async function setupDatabase() {
  try {
    // 确保数据目录存在
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // 如果数据库已存在，删除重建
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
      console.log('已删除旧数据库文件');
    }

    // 创建数据库连接
    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    await db.exec('PRAGMA foreign_keys = ON');

    console.log('正在初始化数据库...');

    // 读取并执行 schema.sql
    const schemaPath = path.join(process.cwd(), 'src', 'lib', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await db.exec(schema);

    console.log('数据库表结构创建完成');

    // 插入示例数据
    console.log('正在插入示例数据...');

    // 插入示例客户数据
    const insertCustomerSQL = `
      INSERT INTO customers (
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
      await db.run(insertCustomerSQL, customer);
    }

    // 插入示例带看记录数据
    const insertViewingRecordSQL = `
      INSERT INTO viewing_records (
        customer_id, viewing_time, property_name, property_address,
        room_type, room_tag, viewer_name, viewing_status, viewing_feedback, commission, notes, business_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const stmt = db.prepare(`
      INSERT INTO viewing_records (
        customer_id, viewing_time, property_name, property_address,
        room_type, room_tag, viewer_name, viewing_status, viewing_feedback, commission, notes, business_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 1; i <= 20; i++) {
      const customerId = Math.ceil(Math.random() * 30);
      const viewingDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const viewerTypes = ['internal', 'external', 'external_sales', 'creator'];
      
      stmt.run([
        customerId,
        viewingDate.toISOString(),
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

    // 插入示例预约带看数据
    const insertAppointmentSQL = `
      INSERT INTO appointments (
        property_name, property_address, customer_name, customer_phone, 
        agent_name, appointment_time, status, type, city, is_converted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const sampleAppointments = [
      ['华润城', '深圳市南山区华润城3期A座1201', '陈八', '13800138006', '李管家', '2024-01-25 14:00:00', 2, 'whole_rent', '深圳', 0],
      ['金地威新', '深圳市福田区金地威新花园2栋501', '周九', '13800138007', '王管家', '2024-01-26 10:30:00', 1, 'shared_rent', '深圳', 0],
      ['龙湖春江悦茗', '深圳市宝安区龙湖春江悦茗1期B座888', '吴十', '13800138008', '赵管家', '2024-01-26 16:00:00', 4, 'centralized', '深圳', 1],
      ['万科云城', '深圳市龙岗区万科云城二期C座1888', '郑十一', '13800138009', '李管家', '2024-01-27 09:00:00', 3, 'whole_rent', '深圳', 0],
      ['保利天汇', '深圳市南山区保利天汇3座2101', '孙十二', '13800138010', '王管家', '2024-01-28 15:30:00', 5, 'shared_rent', '深圳', 0],
    ];

    for (const appointment of sampleAppointments) {
      await db.run(insertAppointmentSQL, appointment);
    }

    // 更新客户的统计数据（佣金总和、带看次数）
    await db.exec(`
      UPDATE customers SET 
        total_commission = (
          SELECT COALESCE(SUM(commission), 0) 
          FROM viewing_records 
          WHERE viewing_records.customer_id = customers.id
        ),
        viewing_count = (
          SELECT COUNT(*) 
          FROM viewing_records 
          WHERE viewing_records.customer_id = customers.id
        )
    `);

    console.log('示例数据插入完成');

    // 关闭数据库连接
    await db.close();

    console.log('数据库初始化完成！');
    console.log(`数据库文件路径: ${DB_PATH}`);
    console.log('可以运行 npm run dev 启动应用了。');

  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

// 运行脚本
setupDatabase(); 