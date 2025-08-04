import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../../lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDatabase();
    const appointmentId = parseInt(params.id);
    const body = await request.json();

    if (isNaN(appointmentId)) {
      return NextResponse.json(
        { success: false, error: '无效的预约ID' },
        { status: 400 }
      );
    }

    const {
      property_name,
      property_address,
      customer_name,
      customer_phone,
      agent_name,
      appointment_time,
      status,
      type,
      city
    } = body;

    // 检查预约是否存在
    const existingAppointment = await db.get(`
      SELECT * FROM appointments WHERE id = ?
    `, [appointmentId]);

    if (!existingAppointment) {
      return NextResponse.json(
        { success: false, error: '预约不存在' },
        { status: 404 }
      );
    }

    // 更新预约信息，为空字段提供默认值
    await db.run(`
      UPDATE appointments 
      SET 
        property_name = ?,
        property_address = ?,
        customer_name = ?,
        customer_phone = ?,
        agent_name = ?,
        appointment_time = ?,
        status = ?,
        type = ?,
        city = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      property_name || existingAppointment.property_name || '未填写',
      property_address || existingAppointment.property_address || '未填写',
      customer_name || existingAppointment.customer_name || '未填写',
      customer_phone || existingAppointment.customer_phone,
      agent_name || existingAppointment.agent_name || '未填写',
      appointment_time || existingAppointment.appointment_time,
      status || existingAppointment.status,
      type || existingAppointment.type || 'whole_rent',
      city || existingAppointment.city,
      appointmentId
    ]);

    return NextResponse.json({
      success: true,
      message: '预约更新成功',
      data: { id: appointmentId }
    });

  } catch (error) {
    console.error('更新预约失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

export async function GET(
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

    const appointment = await db.get(`
      SELECT * FROM appointments WHERE id = ?
    `, [appointmentId]);

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: '预约不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: appointment
    });

  } catch (error) {
    console.error('获取预约详情失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 