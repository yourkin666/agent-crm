import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

// GET /api/appointments - 获取预约列表（包含预约记录和带看记录）
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const offset = (page - 1) * pageSize;

    // 合并预约表和带看记录表的数据，统一显示
    const combinedQuery = `
      SELECT 
        'appointment' as source_type,
        id,
        property_name,
        property_address,
        customer_name,
        customer_phone,
        agent_name,
        appointment_time,
        status,
        type,
        city,
        is_converted,
        created_at,
        updated_at
      FROM appointments
      
      UNION ALL
      
      SELECT 
        'viewing_record' as source_type,
        v.id + 10000 as id,  -- 避免ID冲突，带看记录ID加10000
        COALESCE('直接带看 - ' || SUBSTR(v.notes, 1, 20), '直接带看') as property_name,
        c.community as property_address,
        c.name as customer_name,
        c.phone as customer_phone,
        v.viewer_name as agent_name,
        v.created_at as appointment_time,
        CASE 
          WHEN v.viewing_status = 1 THEN 1  -- 待确认
          WHEN v.viewing_status = 2 THEN 2  -- 已确认
          WHEN v.viewing_status = 3 THEN 5  -- 已取消
          WHEN v.viewing_status = 4 THEN 4  -- 已完成
          ELSE 1
        END as status,
        v.business_type as type,
        '直接带看' as city,
        1 as is_converted,  -- 带看记录默认已转化
        v.created_at,
        v.updated_at
      FROM viewing_records v
      LEFT JOIN customers c ON v.customer_id = c.id
      
      ORDER BY appointment_time DESC
      LIMIT ? OFFSET ?
    `;

    const appointments = await db.all(combinedQuery, [pageSize, offset]);

    // 获取总数（预约记录 + 带看记录）
    const countQuery = `
      SELECT 
        (SELECT COUNT(*) FROM appointments) + 
        (SELECT COUNT(*) FROM viewing_records) as total
    `;
    
    const totalResult = await db.get(countQuery);
    const total = totalResult?.total || 0;

    return NextResponse.json({
      success: true,
      data: {
        data: appointments,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });

  } catch (error) {
    console.error('获取预约/带看列表失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase();
    const body = await request.json();
    
    const {
      property_name,
      property_address,
      customer_name,
      customer_phone,
      agent_name,
      appointment_time,
      status = 1,
      type,
      city
    } = body;

    // 验证必填字段
    if (!property_name || !property_address || !customer_name || !customer_phone || !agent_name || !appointment_time || !type) {
      return NextResponse.json(
        { success: false, error: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    // 插入预约记录
    const result = await db.run(`
      INSERT INTO appointments (
        property_name, property_address, customer_name, customer_phone,
        agent_name, appointment_time, status, type, city, is_converted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `, [
      property_name, property_address, customer_name, customer_phone,
      agent_name, appointment_time, status, type, city
    ]);

    if (result.lastID) {
      return NextResponse.json({
        success: true,
        data: { id: result.lastID },
        message: '预约添加成功'
      });
    } else {
      return NextResponse.json(
        { success: false, error: '添加预约失败' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('添加预约失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 