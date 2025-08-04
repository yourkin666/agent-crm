import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../../../lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDatabase();
    const customerId = parseInt(params.id);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { success: false, error: '无效的客户ID' },
        { status: 400 }
      );
    }

    // 先获取客户电话号码
    const customer = await db.get('SELECT phone FROM customers WHERE id = ?', [customerId]);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: '客户不存在' },
        { status: 404 }
      );
    }

    // 获取直接添加的带看记录
    const directViewingRecords = await db.all(`
      SELECT 
        'viewing_record' as source_type,
        vr.id,
        vr.customer_id,
        vr.viewing_time,
        vr.property_name,
        vr.property_address,
        vr.room_type,
        vr.room_tag,
        vr.viewer_name,
        vr.viewing_status,
        vr.commission,
        vr.viewing_feedback,
        vr.business_type,
        vr.notes,
        'direct' as source_channel,
        vr.created_at,
        vr.updated_at,
        c.name as customer_name
      FROM viewing_records vr
      LEFT JOIN customers c ON vr.customer_id = c.id
      WHERE vr.customer_id = ?
      ORDER BY vr.viewing_time DESC, vr.created_at DESC
    `, [customerId]);

    // 获取该客户的所有预约记录（包括未转化的）
    const appointmentRecords = await db.all(`
      SELECT 
        'appointment' as source_type,
        a.id + 20000 as id,
        ? as customer_id,
        a.appointment_time as viewing_time,
        a.property_name,
        a.property_address,
        'unknown' as room_type,
        'unknown' as room_tag,
        a.agent_name as viewer_name,
        CASE 
          WHEN a.status = 4 THEN 4  -- 已完成
          WHEN a.status = 3 THEN 3  -- 已取消
          WHEN a.status = 2 THEN 2  -- 已确认
          ELSE 1  -- 待确认
        END as viewing_status,
        0 as commission,
        0 as viewing_feedback,
        a.type as business_type,
        CASE 
          WHEN a.is_converted = 1 THEN '从预约"' || a.property_name || '"转化而来'
          ELSE '预约记录："' || a.property_name || '"'
        END as notes,
        'appointment' as source_channel,
        a.created_at,
        a.updated_at,
        a.customer_name
      FROM appointments a
      WHERE a.customer_phone = ?
      ORDER BY a.appointment_time DESC
    `, [customerId, customer.phone]);

    // 合并两个数组并按带看时间排序
    const allRecords = [...directViewingRecords, ...appointmentRecords];
    allRecords.sort((a, b) => new Date(b.viewing_time).getTime() - new Date(a.viewing_time).getTime());

    return NextResponse.json({
      success: true,
      data: allRecords
    });

  } catch (error) {
    console.error('获取客户带看记录失败:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json(
      { success: false, error: `服务器内部错误: ${errorMessage}` },
      { status: 500 }
    );
  }
} 