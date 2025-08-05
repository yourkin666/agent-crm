import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../lib/database';
import {
  withErrorHandler,
  createSuccessResponse,
  createNotFoundError,
  createDatabaseError
} from '../../../lib/api-error-handler';
import { validateViewingRecordData } from '../../../lib/validation';
import { logApiRequest, businessLogger, createRequestLogger } from '../../../lib/logger';

// 生成请求ID的辅助函数
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const requestLogger = createRequestLogger(requestId);

  // 记录请求开始
  requestLogger.info({
    method: 'POST',
    url: '/api/viewing-records',
    userAgent: request.headers.get('user-agent'),
    requestId
  }, 'API请求开始 - 创建带看记录');

  const body = await request.json();

  // 记录请求数据（敏感信息脱敏）
  requestLogger.debug({
    viewingData: {
      customer_id: body.customer_id,
      property_name: body.property_name,
      property_address: body.property_address,
      room_type: body.room_type,
      viewer_name: body.viewer_name,
      viewing_status: body.viewing_status,
      commission: body.commission,
      business_type: body.business_type,
      hasNotes: !!body.notes
    },
    requestId
  }, '带看记录创建请求数据解析完成');

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

  try {
    const db = await getDatabase();

    // 如果提供了客户ID，检查客户是否存在
    let customerInfo = null;
    if (customer_id) {
      const customer = await db.get(
        'SELECT id, name FROM customers WHERE id = ?',
        [customer_id]
      );

      if (!customer) {
        requestLogger.warn({
          customer_id,
          requestId
        }, '指定的客户不存在');
        throw createNotFoundError('客户');
      }

      customerInfo = customer;
      requestLogger.debug({
        customer_id,
        customerName: customer.name,
        requestId
      }, '客户验证通过');
    } else {
      requestLogger.debug({
        requestId
      }, '创建独立带看记录（未关联客户）');
    }

    requestLogger.debug({
      requestId
    }, '开始创建带看记录');

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
      requestLogger.debug({
        customer_id,
        requestId
      }, '开始更新客户统计信息');

      // 如果有客户ID，更新客户的带看次数和总佣金
      await db.run(`
        UPDATE customers 
        SET 
          viewing_count = (SELECT COUNT(*) FROM viewing_records WHERE customer_id = ?),
          total_commission = (SELECT COALESCE(SUM(commission), 0) FROM viewing_records WHERE customer_id = ?),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [customer_id, customer_id, customer_id]);

      requestLogger.debug({
        customer_id,
        commission,
        requestId
      }, '客户统计信息更新完成');
    }

    const duration = Date.now() - startTime;

    // 记录业务操作成功
    if (result.lastID) {
      businessLogger.viewing('created', result.lastID.toString(), {
        requestId,
        customer_id,
        customerName: customerInfo?.name,
        property_name: property_name || '未填写楼盘',
        property_address,
        viewer_name: viewer_name || 'internal',
        viewing_status,
        commission,
        business_type: business_type || 'whole_rent',
        duration
      });

      // 记录API请求完成
      logApiRequest('POST', '/api/viewing-records', 201, duration);

      requestLogger.info({
        statusCode: 201,
        duration,
        viewingRecordId: result.lastID,
        customer_id,
        customerName: customerInfo?.name,
        property_name: property_name || '未填写楼盘',
        commission,
        requestId
      }, 'API请求成功完成 - 带看记录创建成功');

      return createSuccessResponse(
        { id: result.lastID },
        '带看记录添加成功',
        201
      );
    }
  } catch (error) {
    const duration = Date.now() - startTime;

    // 记录API请求失败
    logApiRequest('POST', '/api/viewing-records', 500, duration, error as Error);

    requestLogger.error({
      error: error instanceof Error ? error.message : error,
      duration,
      customer_id,
      requestId
    }, 'API请求失败 - 带看记录创建失败');

    throw error; // 重新抛出错误让错误处理器处理
  }
}); 