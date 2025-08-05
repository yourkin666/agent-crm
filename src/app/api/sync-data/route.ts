import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../lib/database';
import { businessLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase();

    businessLogger.sync('started', { timestamp: new Date().toISOString() });

    // 开始事务
    await db.run('BEGIN TRANSACTION');

    try {
      let syncResults = {
        createdCustomers: 0,
        createdViewingRecords: 0,
        updatedStatistics: 0,
        errors: [] as string[]
      };

      // 1. 为没有客户记录的已完成预约创建客户和带看记录
      const orphanedCompletedAppointments = await db.all(`
        SELECT a.* FROM appointments a 
        WHERE a.status = 4 
        AND a.is_converted = 1 
        AND a.customer_phone NOT IN (SELECT phone FROM customers)
      `);

      for (const appointment of orphanedCompletedAppointments) {
        try {
          // 创建客户记录
          const customerResult = await db.run(`
            INSERT INTO customers (
              name, phone, status, community, business_type, room_type, 
              room_tags, source_channel, creator, is_agent
            ) VALUES (?, ?, 1, '预约转化', ?, 'one_bedroom', '[]', 'referral', '系统同步', 1)
          `, [
            appointment.customer_name,
            appointment.customer_phone,
            appointment.type
          ]);

          const customerId = customerResult.lastID;
          syncResults.createdCustomers++;

          // 检查是否已有对应的带看记录
          const existingViewing = await db.get(`
            SELECT id FROM viewing_records WHERE notes LIKE ?
          `, [`%${appointment.property_name}%`]);

          if (!existingViewing) {
            // 创建带看记录
            await db.run(`
              INSERT INTO viewing_records (
                customer_id, viewing_time, property_name, business_type, room_type, room_tag,
                viewer_name, viewing_status, viewing_feedback,
                commission, notes
              ) VALUES (?, ?, ?, ?, 'one_bedroom', NULL, ?, 4, 1, 0, ?)
            `, [
              customerId,
              appointment.appointment_time, // 使用预约时间作为带看时间
              appointment.property_name,    // 添加楼盘名称
              appointment.type,
              'internal',
              `从预约 "${appointment.property_name}" 同步转化`
            ]);
            syncResults.createdViewingRecords++;
          }

          businessLogger.customer('created_from_appointment', customerId.toString(), { 
            appointmentId: appointment.id,
            customerName: appointment.customer_name,
            source: 'sync_from_appointment'
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '未知错误';
          syncResults.errors.push(`预约${appointment.id}同步失败: ${errorMessage}`);
        }
      }

      // 2. 为存在但没有客户记录的预约创建客户（针对所有状态的预约）
      const orphanedAppointments = await db.all(`
        SELECT DISTINCT customer_name, customer_phone FROM appointments 
        WHERE customer_phone NOT IN (SELECT phone FROM customers)
      `);

      for (const appointment of orphanedAppointments) {
        try {
          // 获取该客户的第一个预约信息作为默认值
          const firstAppointment = await db.get(`
            SELECT * FROM appointments 
            WHERE customer_phone = ? 
            ORDER BY created_at ASC 
            LIMIT 1
          `, [appointment.customer_phone]);

          const customerResult = await db.run(`
            INSERT INTO customers (
              name, phone, status, community, business_type, room_type, 
              room_tags, source_channel, creator, is_agent
            ) VALUES (?, ?, 1, '预约客户', ?, 'one_bedroom', '[]', 'referral', '系统同步', 1)
          `, [
            appointment.customer_name,
            appointment.customer_phone,
            firstAppointment.type
          ]);

          syncResults.createdCustomers++;
          businessLogger.customer('created_from_orphaned_appointment', undefined, { 
            customerName: appointment.customer_name,
            customerPhone: appointment.customer_phone,
            source: 'sync_orphaned_appointment'
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '未知错误';
          syncResults.errors.push(`客户${appointment.customer_name}创建失败: ${errorMessage}`);
        }
      }

      // 3. 更新所有客户的统计信息
      await db.run(`
        UPDATE customers 
        SET 
          viewing_count = (SELECT COUNT(*) FROM viewing_records WHERE customer_id = customers.id),
          total_commission = (SELECT COALESCE(SUM(commission), 0) FROM viewing_records WHERE customer_id = customers.id),
          updated_at = CURRENT_TIMESTAMP
      `);

      const updatedCustomers = await db.get(`SELECT changes() as count`);
      syncResults.updatedStatistics = updatedCustomers.count;

      // 提交事务
      await db.run('COMMIT');

      businessLogger.sync('completed', syncResults);

      return NextResponse.json({
        success: true,
        message: '数据同步完成',
        data: syncResults
      });

    } catch (error) {
      // 回滚事务
      await db.run('ROLLBACK');
      throw error;
    }

  } catch (error) {
    businessLogger.sync('failed', { 
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined 
    });
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json(
      { success: false, error: '数据同步失败', details: errorMessage },
      { status: 500 }
    );
  }
} 