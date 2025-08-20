#!/usr/bin/env node

/**
 * 插入测试数据脚本
 * 用于测试外部统计接口的 userId 和 botId 筛选功能
 */

// 加载环境变量
require('dotenv').config({ path: '.env.local' });

const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'qft_ai',
  charset: 'utf8mb4'
};

// 创建数据库连接
async function createConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    return connection;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    throw error;
  }
}

// 测试数据配置
const testData = {
  // 客户数据
  customers: [
    // userId: 123 的客户们
    {
      name: '张三',
      nickname: '小张',
      phone: '13800138001',
      status: 4, // 已成交未结佣
      community: '万科星城',
      business_type: 'whole_rent',
      room_type: 'one_bedroom',
      source_channel: 'xianyu',
      userId: '123',
      botId: 'bot1',
      creator: '测试系统',
      is_agent: 1,
      internal_notes: '测试客户1'
    },
    {
      name: '李四',
      nickname: '小李',
      phone: '13800138002',
      status: 5, // 已成交已结佣
      community: '碧桂园',
      business_type: 'centralized',
      room_type: 'two_bedroom',
      source_channel: 'xiaohongshu',
      userId: '123',
      botId: 'bot2',
      creator: '测试系统',
      is_agent: 1,
      internal_notes: '测试客户2'
    },
    {
      name: '王五',
      nickname: '小王',
      phone: '13800138003',
      status: 3, // 已约带看
      community: '恒大城',
      business_type: 'shared_rent',
      room_type: 'three_bedroom',
      source_channel: 'beike',
      userId: '123',
      botId: 'bot3',
      creator: '测试系统',
      is_agent: 1,
      internal_notes: '测试客户3'
    },
    
    // userId: 456 的客户们
    {
      name: '赵六',
      nickname: '小赵',
      phone: '13800138004',
      status: 4, // 已成交未结佣
      community: '保利城',
      business_type: 'whole_rent',
      room_type: 'one_bedroom',
      source_channel: '58tongcheng',
      userId: '456',
      botId: 'bot1',
      creator: '测试系统',
      is_agent: 1,
      internal_notes: '测试客户4'
    },
    {
      name: '钱七',
      nickname: '小钱',
      phone: '13800138005',
      status: 5, // 已成交已结佣
      community: '龙湖天街',
      business_type: 'centralized',
      room_type: 'two_bedroom',
      source_channel: 'shipinhao',
      userId: '456',
      botId: 'bot2',
      creator: '测试系统',
      is_agent: 1,
      internal_notes: '测试客户5'
    },
    {
      name: '孙八',
      nickname: '小孙',
      phone: '13800138006',
      status: 1, // 跟进中
      community: '华润城',
      business_type: 'shared_rent',
      room_type: 'four_plus',
      source_channel: 'douyin',
      userId: '456',
      botId: 'bot3',
      creator: '测试系统',
      is_agent: 1,
      internal_notes: '测试客户6'
    },
    
    // userId: 789 的客户们
    {
      name: '周九',
      nickname: '小周',
      phone: '13800138007',
      status: 4, // 已成交未结佣
      community: '融创城',
      business_type: 'whole_rent',
      room_type: 'master_room',
      source_channel: 'referral',
      userId: '789',
      botId: 'bot1',
      creator: '测试系统',
      is_agent: 1,
      internal_notes: '测试客户7'
    },
    {
      name: '吴十',
      nickname: '小吴',
      phone: '13800138008',
      status: 2, // 客户不再回复
      community: '绿地城',
      business_type: 'centralized',
      room_type: 'second_room',
      source_channel: 'xianyu',
      userId: '789',
      botId: 'bot2',
      creator: '测试系统',
      is_agent: 1,
      internal_notes: '测试客户8'
    },
    
    // userId: 999 的客户们
    {
      name: '郑十一',
      nickname: '小郑',
      phone: '13800138009',
      status: 4, // 已成交未结佣
      community: '中海城',
      business_type: 'whole_rent',
      room_type: 'one_bedroom',
      source_channel: 'xiaohongshu',
      userId: '999',
      botId: 'bot1',
      creator: '测试系统',
      is_agent: 1,
      internal_notes: '测试客户9'
    },
    {
      name: '王十二',
      nickname: '小王',
      phone: '13800138010',
      status: 5, // 已成交已结佣
      community: '招商城',
      business_type: 'shared_rent',
      room_type: 'two_bedroom',
      source_channel: 'beike',
      userId: '999',
      botId: 'bot3',
      creator: '测试系统',
      is_agent: 1,
      internal_notes: '测试客户10'
    }
  ],
  
  // 带看记录数据
  viewingRecords: [
    // 客户1 (userId=123, botId=bot1) 的带看记录
    {
      customer_id: 1,
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
      botId: 'bot1',
      housingId: 1001,
      houseAreaId: 101,
      houseAreaName: '南山区',
      cityId: 1,
      cityName: '深圳市',
      propertyAddrId: 2001,
      unitType: '一室一厅',
      longitude: '113.123456',
      latitude: '22.123456',
      roomId: 3001,
      advisorId: 401,
      advisorName: '李顾问',
      companyName: '深圳房产中介有限公司',
      companyAbbreviation: '深房中'
    },
    {
      customer_id: 1,
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
      botId: 'bot1',
      housingId: 1002,
      houseAreaId: 101,
      houseAreaName: '南山区',
      cityId: 1,
      cityName: '深圳市',
      propertyAddrId: 2002,
      unitType: '一室一厅',
      longitude: '113.123457',
      latitude: '22.123457',
      roomId: 3002,
      advisorId: 402,
      advisorName: '王顾问',
      companyName: '深圳房产中介有限公司',
      companyAbbreviation: '深房中'
    },
    
    // 客户2 (userId=123, botId=bot2) 的带看记录
    {
      customer_id: 2,
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
      customer_phone: '13800138002',
      userId: '123',
      botId: 'bot2',
      housingId: 1003,
      houseAreaId: 102,
      houseAreaName: '宝安区',
      cityId: 1,
      cityName: '深圳市',
      propertyAddrId: 2003,
      unitType: '两室一厅',
      longitude: '113.123458',
      latitude: '22.123458',
      roomId: 3003,
      advisorId: 403,
      advisorName: '张顾问',
      companyName: '深圳房产中介有限公司',
      companyAbbreviation: '深房中'
    },
    
    // 客户4 (userId=456, botId=bot1) 的带看记录
    {
      customer_id: 4,
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
      customer_phone: '13800138004',
      userId: '456',
      botId: 'bot1',
      housingId: 1004,
      houseAreaId: 103,
      houseAreaName: '龙岗区',
      cityId: 1,
      cityName: '深圳市',
      propertyAddrId: 2004,
      unitType: '一室一厅',
      longitude: '113.123459',
      latitude: '22.123459',
      roomId: 3004,
      advisorId: 404,
      advisorName: '刘顾问',
      companyName: '深圳房产中介有限公司',
      companyAbbreviation: '深房中'
    },
    {
      customer_id: 4,
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
      customer_phone: '13800138004',
      userId: '456',
      botId: 'bot1',
      housingId: 1005,
      houseAreaId: 103,
      houseAreaName: '龙岗区',
      cityId: 1,
      cityName: '深圳市',
      propertyAddrId: 2005,
      unitType: '一室一厅',
      longitude: '113.123460',
      latitude: '22.123460',
      roomId: 3005,
      advisorId: 405,
      advisorName: '陈顾问',
      companyName: '深圳房产中介有限公司',
      companyAbbreviation: '深房中'
    },
    
    // 客户5 (userId=456, botId=bot2) 的带看记录
    {
      customer_id: 5,
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
      customer_phone: '13800138005',
      userId: '456',
      botId: 'bot2',
      housingId: 1006,
      houseAreaId: 104,
      houseAreaName: '福田区',
      cityId: 1,
      cityName: '深圳市',
      propertyAddrId: 2006,
      unitType: '两室一厅',
      longitude: '113.123461',
      latitude: '22.123461',
      roomId: 3006,
      advisorId: 406,
      advisorName: '黄顾问',
      companyName: '深圳房产中介有限公司',
      companyAbbreviation: '深房中'
    },
    
    // 客户7 (userId=789, botId=bot1) 的带看记录
    {
      customer_id: 7,
      viewing_time: '2024-03-05 10:30:00',
      property_name: '融创城一期',
      property_address: '深圳市罗湖区东门',
      room_type: 'master_room',
      viewer_name: 'internal',
      viewing_status: 4, // 已带看
      commission: 7000.00,
      viewing_feedback: 1, // 已成交
      business_type: 'whole_rent',
      notes: '客户对主卧很满意',
      customer_name: '周九',
      customer_phone: '13800138007',
      userId: '789',
      botId: 'bot1',
      housingId: 1007,
      houseAreaId: 105,
      houseAreaName: '罗湖区',
      cityId: 1,
      cityName: '深圳市',
      propertyAddrId: 2007,
      unitType: '主卧',
      longitude: '113.123462',
      latitude: '22.123462',
      roomId: 3007,
      advisorId: 407,
      advisorName: '林顾问',
      companyName: '深圳房产中介有限公司',
      companyAbbreviation: '深房中'
    },
    {
      customer_id: 7,
      viewing_time: '2024-03-10 14:30:00',
      property_name: '融创城二期',
      property_address: '深圳市罗湖区东门',
      room_type: 'master_room',
      viewer_name: 'external',
      viewing_status: 4, // 已带看
      commission: 5000.00,
      viewing_feedback: 0, // 未成交
      business_type: 'whole_rent',
      notes: '客户觉得价格偏高',
      customer_name: '周九',
      customer_phone: '13800138007',
      userId: '789',
      botId: 'bot1',
      housingId: 1008,
      houseAreaId: 105,
      houseAreaName: '罗湖区',
      cityId: 1,
      cityName: '深圳市',
      propertyAddrId: 2008,
      unitType: '主卧',
      longitude: '113.123463',
      latitude: '22.123463',
      roomId: 3008,
      advisorId: 408,
      advisorName: '杨顾问',
      companyName: '深圳房产中介有限公司',
      companyAbbreviation: '深房中'
    },
    
    // 客户9 (userId=999, botId=bot1) 的带看记录
    {
      customer_id: 9,
      viewing_time: '2024-03-15 09:00:00',
      property_name: '中海城一期',
      property_address: '深圳市盐田区沙头角',
      room_type: 'one_bedroom',
      viewer_name: 'internal',
      viewing_status: 4, // 已带看
      commission: 9000.00,
      viewing_feedback: 1, // 已成交
      business_type: 'whole_rent',
      notes: '海景房，客户很喜欢',
      customer_name: '郑十一',
      customer_phone: '13800138009',
      userId: '999',
      botId: 'bot1',
      housingId: 1009,
      houseAreaId: 106,
      houseAreaName: '盐田区',
      cityId: 1,
      cityName: '深圳市',
      propertyAddrId: 2009,
      unitType: '一室一厅',
      longitude: '113.123464',
      latitude: '22.123464',
      roomId: 3009,
      advisorId: 409,
      advisorName: '吴顾问',
      companyName: '深圳房产中介有限公司',
      companyAbbreviation: '深房中'
    },
    
    // 客户10 (userId=999, botId=bot3) 的带看记录
    {
      customer_id: 10,
      viewing_time: '2024-03-20 16:00:00',
      property_name: '招商城一期',
      property_address: '深圳市光明区公明',
      room_type: 'two_bedroom',
      viewer_name: 'external_sales',
      viewing_status: 4, // 已带看
      commission: 15000.00,
      viewing_feedback: 1, // 已成交
      business_type: 'shared_rent',
      notes: '客户对合租很感兴趣',
      customer_name: '王十二',
      customer_phone: '13800138010',
      userId: '999',
      botId: 'bot3',
      housingId: 1010,
      houseAreaId: 107,
      houseAreaName: '光明区',
      cityId: 1,
      cityName: '深圳市',
      propertyAddrId: 2010,
      unitType: '两室一厅',
      longitude: '113.123465',
      latitude: '22.123465',
      roomId: 3010,
      advisorId: 410,
      advisorName: '孙顾问',
      companyName: '深圳房产中介有限公司',
      companyAbbreviation: '深房中'
    }
  ]
};

// 插入客户数据
async function insertCustomers(connection) {
  console.log('📝 开始插入客户数据...');
  
  for (const customer of testData.customers) {
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
      console.error(`❌ 插入客户失败: ${customer.name}`, error.message);
    }
  }
  
  console.log('📝 客户数据插入完成\n');
}

// 插入带看记录数据
async function insertViewingRecords(connection) {
  console.log('📝 开始插入带看记录数据...');
  
  for (const record of testData.viewingRecords) {
    try {
      const [result] = await connection.execute(
        `INSERT INTO qft_ai_viewing_records (
          customer_id, viewing_time, property_name, property_address, room_type,
          viewer_name, viewing_status, commission, viewing_feedback, business_type,
          notes, customer_name, customer_phone, userId, botId, housingId,
          houseAreaId, houseAreaName, cityId, cityName, propertyAddrId, unitType,
          longitude, latitude, roomId, advisorId, advisorName, companyName, companyAbbreviation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.customer_id, record.viewing_time, record.property_name,
          record.property_address, record.room_type, record.viewer_name,
          record.viewing_status, record.commission, record.viewing_feedback,
          record.business_type, record.notes, record.customer_name,
          record.customer_phone, record.userId, record.botId, record.housingId,
          record.houseAreaId, record.houseAreaName, record.cityId,
          record.cityName, record.propertyAddrId, record.unitType,
          record.longitude, record.latitude, record.roomId, record.advisorId,
          record.advisorName, record.companyName, record.companyAbbreviation
        ]
      );
      console.log(`✅ 插入带看记录: ${record.customer_name} - ${record.property_name} (佣金: ${record.commission})`);
    } catch (error) {
      console.error(`❌ 插入带看记录失败: ${record.customer_name}`, error.message);
    }
  }
  
  console.log('📝 带看记录数据插入完成\n');
}

// 显示数据统计
async function showDataStats(connection) {
  console.log('📊 数据统计:');
  
  try {
    // 客户统计
    const [customerStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_customers,
        SUM(CASE WHEN status = 4 THEN 1 ELSE 0 END) as completed_unpaid_count,
        SUM(CASE WHEN status = 5 THEN 1 ELSE 0 END) as completed_paid_count,
        COUNT(DISTINCT userId) as unique_userIds,
        COUNT(DISTINCT botId) as unique_botIds
      FROM qft_ai_customers
    `);
    
    const stats = customerStats[0];
    console.log(`👥 客户总数: ${stats.total_customers}`);
    console.log(`💰 已成交未结佣: ${stats.completed_unpaid_count}`);
    console.log(`✅ 已成交已结佣: ${stats.completed_paid_count}`);
    console.log(`🆔 唯一userId数量: ${stats.unique_userIds}`);
    console.log(`🤖 唯一botId数量: ${stats.unique_botIds}`);
    
    // 带看记录统计
    const [viewingStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_viewings,
        COALESCE(SUM(commission), 0) as total_commission,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM qft_ai_viewing_records
    `);
    
    const viewing = viewingStats[0];
    console.log(`👁️ 带看记录总数: ${viewing.total_viewings}`);
    console.log(`💵 总佣金: ${viewing.total_commission}`);
    console.log(`👤 涉及客户数: ${viewing.unique_customers}`);
    
    // 按userId分组统计
    console.log('\n📈 按userId分组统计:');
    const [userIdStats] = await connection.execute(`
      SELECT 
        userId,
        COUNT(*) as customer_count,
        SUM(CASE WHEN status = 4 THEN 1 ELSE 0 END) as completed_unpaid_count,
        SUM(CASE WHEN status = 5 THEN 1 ELSE 0 END) as completed_paid_count
      FROM qft_ai_customers
      GROUP BY userId
      ORDER BY userId
    `);
    
    userIdStats.forEach(stat => {
      console.log(`  userId=${stat.userId}: ${stat.customer_count}个客户 (未结佣:${stat.completed_unpaid_count}, 已结佣:${stat.completed_paid_count})`);
    });
    
    // 按botId分组统计
    console.log('\n📈 按botId分组统计:');
    const [botIdStats] = await connection.execute(`
      SELECT 
        botId,
        COUNT(*) as customer_count,
        SUM(CASE WHEN status = 4 THEN 1 ELSE 0 END) as completed_unpaid_count,
        SUM(CASE WHEN status = 5 THEN 1 ELSE 0 END) as completed_paid_count
      FROM qft_ai_customers
      GROUP BY botId
      ORDER BY botId
    `);
    
    botIdStats.forEach(stat => {
      console.log(`  botId=${stat.botId}: ${stat.customer_count}个客户 (未结佣:${stat.completed_unpaid_count}, 已结佣:${stat.completed_paid_count})`);
    });
    
  } catch (error) {
    console.error('❌ 获取数据统计失败:', error.message);
  }
}

// 主函数
async function main() {
  console.log('🚀 开始插入测试数据...\n');
  
  let connection;
  try {
    // 创建数据库连接
    connection = await createConnection();
    
    // 插入客户数据
    await insertCustomers(connection);
    
    // 插入带看记录数据
    await insertViewingRecords(connection);
    
    // 显示数据统计
    await showDataStats(connection);
    
    console.log('\n🎉 测试数据插入完成！');
    console.log('\n📋 测试用例建议:');
    console.log('1. 测试单个userId: GET /api/external/statistics?userId=123');
    console.log('2. 测试多个userId: GET /api/external/statistics?userId=123,456');
    console.log('3. 测试单个botId: GET /api/external/statistics?botId=bot1');
    console.log('4. 测试多个botId: GET /api/external/statistics?botId=bot1,bot2');
    console.log('5. 测试交集查询: GET /api/external/statistics?userId=123,456&botId=bot1,bot2');
    console.log('6. 测试时间筛选: GET /api/external/statistics?date_from=2024-01-01&date_to=2024-01-31');
    console.log('7. 测试组合查询: GET /api/external/statistics?date_from=2024-01-01&date_to=2024-01-31&userId=123&botId=bot1');
    
  } catch (error) {
    console.error('❌ 插入测试数据失败:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
    process.exit(0);
  }
}

// 启动脚本
if (require.main === module) {
  main().catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  testData,
  insertCustomers,
  insertViewingRecords,
  showDataStats
}; 