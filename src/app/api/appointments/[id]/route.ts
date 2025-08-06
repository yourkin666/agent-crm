import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../../lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDatabase();
    const requestId = parseInt(params.id);
    const body = await request.json();

    if (isNaN(requestId)) {
      return NextResponse.json(
        { success: false, error: '无效的预约ID' },
        { status: 400 }
      );
    }

    // 检查是否为带看记录（ID > 10000）
    if (requestId > 10000) {
      const viewingRecordId = requestId - 10000;
      
      const {
        property_name,
        property_address,
        customer_name,
        customer_phone,
        agent_name,
        appointment_time,
        status,
        type
      } = body;

      // 检查带看记录是否存在
      const existingRecord = await db.get(`
        SELECT v.*, c.name as customer_name, c.phone as customer_phone 
        FROM viewing_records v
        LEFT JOIN customers c ON v.customer_id = c.id
        WHERE v.id = ?
      `, [viewingRecordId]);

      if (!existingRecord) {
        return NextResponse.json(
          { success: false, error: '带看记录不存在' },
          { status: 404 }
        );
      }

      // 开始事务
      await db.run('BEGIN TRANSACTION');

      try {
        // 更新客户信息（如果有变化）
        if (customer_name || customer_phone) {
          await db.run(`
            UPDATE customers 
            SET 
              name = ?,
              phone = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [
            customer_name || existingRecord.customer_name,
            customer_phone || existingRecord.customer_phone,
            existingRecord.customer_id
          ]);
        }

        // 更新带看记录
        await db.run(`
          UPDATE viewing_records 
          SET 
            viewing_time = ?,
            viewer_name = ?,
            viewing_status = ?,
            business_type = ?,
            notes = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [
          appointment_time || existingRecord.viewing_time,
          agent_name || existingRecord.viewer_name,
          status !== undefined ? status : existingRecord.viewing_status,
          type || existingRecord.business_type,
          `编辑记录：${property_name || '直接带看'} - ${property_address || ''}`,
          viewingRecordId
        ]);

        // 提交事务
        await db.run('COMMIT');

        return NextResponse.json({
          success: true,
          message: '带看记录更新成功',
          data: { id: requestId }
        });

      } catch (error) {
        // 回滚事务
        await db.run('ROLLBACK');
        throw error;
      }

    } else {
      // 处理普通预约记录
      const appointmentId = requestId;
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
    }

  } catch (error) {
    console.error('更新失败:', error);
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
    const requestId = parseInt(params.id);

    if (isNaN(requestId)) {
      return NextResponse.json(
        { success: false, error: '无效的预约ID' },
        { status: 400 }
      );
    }

    // 检查是否为带看记录（ID > 10000）
    if (requestId > 10000) {
      const viewingRecordId = requestId - 10000;
      
      const record = await db.get(`
        SELECT 
          'viewing_record' as source_type,
          v.id + 10000 as id,
          COALESCE('直接带看 - ' || SUBSTR(v.notes, 1, 20), '直接带看') as property_name,
          c.community as property_address,
          c.name as customer_name,
          c.phone as customer_phone,
          v.viewer_name as agent_name,
          v.viewing_time as appointment_time,
          CASE 
            WHEN v.viewing_status = 1 THEN 1  -- 待确认
            WHEN v.viewing_status = 2 THEN 2  -- 已确认
            WHEN v.viewing_status = 3 THEN 5  -- 已取消
            WHEN v.viewing_status = 4 THEN 4  -- 已完成
            ELSE 1
          END as status,
          v.business_type as type,
          v.created_at,
          v.updated_at
        FROM viewing_records v
        LEFT JOIN customers c ON v.customer_id = c.id
        WHERE v.id = ?
      `, [viewingRecordId]);

      if (!record) {
        return NextResponse.json(
          { success: false, error: '带看记录不存在' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: record
      });

    } else {
      // 处理普通预约记录
      const appointment = await db.get(`
        SELECT * FROM appointments WHERE id = ?
      `, [requestId]);

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
    }

  } catch (error) {
    console.error('获取详情失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 