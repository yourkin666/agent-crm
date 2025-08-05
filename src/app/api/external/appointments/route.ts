import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../../lib/database';

// 状态映射：中文转数字
const statusMap: { [key: string]: number } = {
  '待确认': 1,
  '已确认': 2,
  '进行中': 3,
  '已完成': 4,
  '已取消': 5
};

// 类型映射：中文转英文
const typeMap: { [key: string]: string } = {
  '整租': 'whole_rent',
  '集中': 'centralized', 
  '合租': 'shared_rent'
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const db = await getDatabase();
    
    // 处理状态转换
    let statusValue = 1; // 默认待确认
    if (body.status && statusMap[body.status]) {
      statusValue = statusMap[body.status];
    } else if (body.status && typeof body.status === 'number') {
      statusValue = body.status;
    }
    
    // 处理类型转换
    let typeValue = 'whole_rent'; // 默认整租
    if (body.type && typeMap[body.type]) {
      typeValue = typeMap[body.type];
    } else if (body.type && typeof body.type === 'string') {
      typeValue = body.type;
    }
    
    // 处理预约时间格式
    let appointmentTime = body.appointment_time || body.预约时间;
    if (appointmentTime) {
      // 如果是 "2025-08-22 00:00" 格式，转换为标准格式
      if (appointmentTime.includes(' ')) {
        appointmentTime = appointmentTime.replace(' ', 'T') + ':00.000Z';
      }
    } else {
      appointmentTime = new Date().toISOString();
    }
    
    // 插入预约记录，兼容中英文字段名
    const result = await db.run(`
      INSERT INTO appointments (
        property_name, property_address, customer_name, customer_phone,
        agent_name, appointment_time, status, type, city
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      body.property_name || body.物业名称 || '未填写',
      body.property_address || body.房间地址 || '未填写', 
      body.customer_name || body.客户姓名 || '未填写',
      body.customer_phone || body.客户电话 || null,
      body.agent_name || body.经纪人 || '未填写',
      appointmentTime,
      statusValue,
      typeValue,
      body.city || body.城市 || null
    ]);

    return NextResponse.json({
      success: true,
      data: {
        id: result.lastID,
        message: '预约记录创建成功'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('外部预约接口错误:', error);
    
    return NextResponse.json({
      success: false,
      error: '创建预约记录失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
} 