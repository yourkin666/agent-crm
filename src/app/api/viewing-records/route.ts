import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../lib/database';
import { 
  withErrorHandler, 
  createSuccessResponse, 
  createNotFoundError, 
  createDatabaseError 
} from '../../../lib/api-error-handler';
import { validateViewingRecordData } from '../../../lib/validation';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const db = await getDatabase();
  const body = await request.json();
  
  // 验证输入数据
  validateViewingRecordData(body);
  
  const {
    customer_id,
    viewing_time,
    property_name,
    property_address,
    room_type,
    room_tag,
    viewer_name,
    viewing_status = 1, // 默认为待确认
    commission = 0,
    viewing_feedback,
    business_type,
    notes
  } = body;

  // 如果提供了客户ID，检查客户是否存在
  if (customer_id) {
    const customer = await db.get(
      'SELECT id FROM customers WHERE id = ?',
      [customer_id]
    );

    if (!customer) {
      throw createNotFoundError('客户');
    }
  }

  try {
    // 插入带看记录，为必填字段提供默认值
    const result = await db.run(`
      INSERT INTO viewing_records (
        customer_id, viewing_time, property_name, property_address,
        room_type, room_tag, viewer_name, 
        viewing_status, commission, viewing_feedback, business_type, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      customer_id || null,                         // 允许为空
      viewing_time || new Date().toISOString(),    // 默认为当前时间
      property_name || '未填写楼盘',                // 默认楼盘名
      property_address || null,
      room_type || 'one_bedroom',                  // 默认房型
      room_tag || null, 
      viewer_name || 'internal',                   // 默认带看人类型
      viewing_status, 
      commission, 
      viewing_feedback || null, 
      business_type || 'whole_rent',               // 默认业务类型
      notes || null
    ]);

    if (result.lastID && customer_id) {
      // 如果有客户ID，更新客户的带看次数和总佣金
      await db.run(`
        UPDATE customers 
        SET 
          viewing_count = (SELECT COUNT(*) FROM viewing_records WHERE customer_id = ?),
          total_commission = (SELECT COALESCE(SUM(commission), 0) FROM viewing_records WHERE customer_id = ?),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [customer_id, customer_id, customer_id]);
    }

    return createSuccessResponse(
      { id: result.lastID },
      '带看记录添加成功',
      201
    );
  } catch (error) {
    throw createDatabaseError('创建带看记录', error as Error);
  }
}); 