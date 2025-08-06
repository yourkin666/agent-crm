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

    return NextResponse.json({
      success: true,
      data: directViewingRecords
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