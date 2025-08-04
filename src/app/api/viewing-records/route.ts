import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../lib/database';

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase();
    const body = await request.json();
    
    const {
      customer_id,
      viewing_time,
      property_name,
      property_address,
      room_type,
      room_tag,
      viewer_name,
      viewer_type,
      viewing_status = 1, // 默认为待确认
      commission = 0,
      viewing_feedback,
      business_type,
      notes
    } = body;

    // 验证必填字段
    if (!customer_id || !viewing_time || !property_name || !room_type || !viewer_name || !viewer_type || !business_type) {
      return NextResponse.json(
        { success: false, error: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    // 检查客户是否存在
    const customer = await db.get(
      'SELECT id FROM customers WHERE id = ?',
      [customer_id]
    );

    if (!customer) {
      return NextResponse.json(
        { success: false, error: '客户不存在' },
        { status: 404 }
      );
    }

    // 插入带看记录
    const result = await db.run(`
      INSERT INTO viewing_records (
        customer_id, viewing_time, property_name, property_address,
        room_type, room_tag, viewer_name, viewer_type, 
        viewing_status, commission, viewing_feedback, business_type, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      customer_id, viewing_time, property_name, property_address,
      room_type, room_tag, viewer_name, viewer_type,
      viewing_status, commission, viewing_feedback, business_type, notes
    ]);

    if (result.lastID) {
      // 更新客户的带看次数和总佣金
      await db.run(`
        UPDATE customers 
        SET 
          viewing_count = (SELECT COUNT(*) FROM viewing_records WHERE customer_id = ?),
          total_commission = (SELECT COALESCE(SUM(commission), 0) FROM viewing_records WHERE customer_id = ?),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [customer_id, customer_id, customer_id]);

      return NextResponse.json({
        success: true,
        data: { id: result.lastID },
        message: '带看记录添加成功'
      });
    } else {
      return NextResponse.json(
        { success: false, error: '添加带看记录失败' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('添加带看记录失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 