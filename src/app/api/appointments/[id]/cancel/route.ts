import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../../../lib/database';

export async function PUT(
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
      
      // 获取带看记录信息
      const record = await db.get(`
        SELECT * FROM viewing_records WHERE id = ?
      `, [viewingRecordId]);

      if (!record) {
        return NextResponse.json(
          { success: false, error: '带看记录不存在' },
          { status: 404 }
        );
      }

      // 更新带看记录状态为已取消
      await db.run(`
        UPDATE viewing_records 
        SET viewing_status = 3, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [viewingRecordId]);

      return NextResponse.json({
        success: true,
        message: '带看记录已取消',
        data: { id: requestId }
      });

    } else {
      // 处理普通预约记录
      const appointmentId = requestId;

      // 获取预约信息
      const appointment = await db.get(`
        SELECT * FROM appointments WHERE id = ?
      `, [appointmentId]);

      if (!appointment) {
        return NextResponse.json(
          { success: false, error: '预约不存在' },
          { status: 404 }
        );
      }

      // 更新预约状态为已取消
      await db.run(`
        UPDATE appointments 
        SET status = 5, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [appointmentId]);

      return NextResponse.json({
        success: true,
        message: '预约已取消',
        data: { id: appointmentId }
      });
    }

  } catch (error) {
    console.error('取消预约失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 