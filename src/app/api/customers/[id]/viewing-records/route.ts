import { NextRequest, NextResponse } from 'next/server';
import { dbManager } from '../../../../../lib/database';
import { createDatabaseError, createValidationError, createNotFoundError, withErrorHandler } from '../../../../../lib/api-error-handler';
import { ErrorWithStatusCode } from '../../../../../types';
import { createRequestLogger } from '../../../../../lib/logger';

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const requestLogger = createRequestLogger(requestId);
  
  const customerId = parseInt(params.id);

  if (isNaN(customerId)) {
    requestLogger.warn({
      customerId: params.id,
      requestId
    }, '无效的客户ID');
    throw createValidationError('无效的客户ID');
  }

  try {
    // 先验证客户是否存在
    const customer = await dbManager.queryOne(
      'SELECT id, name, phone FROM qft_ai_customers WHERE id = ?', 
      [customerId]
    );
    
    if (!customer) {
      requestLogger.warn({
        customerId,
        requestId
      }, '客户不存在');
      throw createNotFoundError('客户');
    }

    // 获取该客户的所有带看记录
    const viewingRecords = await dbManager.query(`
      SELECT 
        'viewing_record' as source_type,
        vr.id,
        vr.customer_id,
        vr.viewing_time,
        vr.property_name,
        vr.property_address,
        vr.cityName,
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
        c.name as customer_name,
        c.phone as customer_phone
      FROM qft_ai_viewing_records vr
      LEFT JOIN qft_ai_customers c ON vr.customer_id = c.id
      WHERE vr.customer_id = ?
      ORDER BY vr.viewing_time DESC, vr.created_at DESC
    `, [customerId]);

    requestLogger.info({
      customerId,
      recordCount: viewingRecords.length,
      requestId
    }, '成功获取客户带看记录');

    return NextResponse.json({
      success: true,
      data: viewingRecords
    });

  } catch (error) {
    if (error instanceof Error && (error as ErrorWithStatusCode).statusCode) {
      throw error;
    }
    throw createDatabaseError('获取客户带看记录失败', error as Error);
  }
}); 