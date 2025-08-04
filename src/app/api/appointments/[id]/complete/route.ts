import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../../../lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDatabase();
    const appointmentId = parseInt(params.id);

    if (isNaN(appointmentId)) {
      return NextResponse.json(
        { success: false, error: '无效的预约ID' },
        { status: 400 }
      );
    }

    // 获取预约信息
    const appointment = await db.get(`
      SELECT * FROM appointments 
      WHERE id = ? AND status = 2 AND is_converted = 0
    `, [appointmentId]);

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: '预约不存在或已完成' },
        { status: 404 }
      );
    }

    // 根据客户手机号查找客户ID
    let customer = await db.get(`
      SELECT id FROM customers WHERE phone = ?
    `, [appointment.customer_phone]);

    let customerId = customer?.id;

    // 如果客户不存在，创建新客户
    if (!customerId) {
      const customerResult = await db.run(`
        INSERT INTO customers (
          name, phone, status, community, business_type, room_type, 
          room_tags, source_channel, creator, is_agent
        ) VALUES (?, ?, 1, '预约转化', ?, 'one_bedroom', '[]', 'referral', '系统', 1)
      `, [
        appointment.customer_name, 
        appointment.customer_phone,
        appointment.type
      ]);
      customerId = customerResult.lastID;
    }

    // 开始事务
    await db.run('BEGIN TRANSACTION');

    try {
      // 1. 创建带看记录
      const viewingResult = await db.run(`
        INSERT INTO viewing_records (
          customer_id, viewing_time, property_name, property_address,
          room_type, room_tag, viewer_name, viewer_type, 
          viewing_status, commission, viewing_feedback, business_type, notes
        ) VALUES (?, ?, ?, ?, 'one_bedroom', NULL, ?, 'internal', 4, 0, 1, ?, ?)
      `, [
        customerId,
        appointment.appointment_time,
        appointment.property_name,
        appointment.property_address,
        appointment.agent_name,
        appointment.type,
        `从预约 "${appointment.property_name}" 转化而来`
      ]);

      // 2. 更新预约状态
      await db.run(`
        UPDATE appointments 
        SET status = 4, is_converted = 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [appointmentId]);

      // 3. 更新客户统计信息
      await db.run(`
        UPDATE customers 
        SET 
          viewing_count = (SELECT COUNT(*) FROM viewing_records WHERE customer_id = ?),
          total_commission = (SELECT COALESCE(SUM(commission), 0) FROM viewing_records WHERE customer_id = ?),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [customerId, customerId, customerId]);

      // 提交事务
      await db.run('COMMIT');

      return NextResponse.json({
        success: true,
        message: '预约已完成并转化为带看记录',
        data: {
          appointmentId,
          viewingRecordId: viewingResult.lastID,
          customerId
        }
      });

    } catch (error) {
      // 回滚事务
      await db.run('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('完成预约失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 