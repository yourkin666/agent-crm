import { NextRequest, NextResponse } from 'next/server';
import { dbManager } from '@/lib/database';
import { withErrorHandler, createDatabaseError, createSuccessResponse, createNotFoundError } from '@/lib/api-error-handler';
import { createRequestLogger } from '@/lib/logger';
import { validateViewingRecordData } from '@/lib/validation';

// 生成请求ID的辅助函数
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const dynamic = 'force-dynamic';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const requestId = generateRequestId();
  const requestLogger = createRequestLogger(requestId);

  // 记录请求开始
  requestLogger.info({
    method: 'GET',
    url: '/api/viewing-records',
    userAgent: request.headers.get('user-agent'),
    requestId
  }, 'API请求开始 - 获取带看记录列表');

  const { searchParams } = request.nextUrl;
  
  // 解析查询参数
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const customer_name = searchParams.get('customer_name') || '';
  const property_name = searchParams.get('property_name') || '';
  const viewing_status = searchParams.get('viewing_status') || '';
  const business_type = searchParams.get('business_type') || '';
  const viewer_name = searchParams.get('viewer_name') || '';
  const date_from = searchParams.get('date_from') || '';
  const date_to = searchParams.get('date_to') || '';

  requestLogger.debug({
    page, pageSize, customer_name, property_name, viewing_status,
    business_type, viewer_name, date_from, date_to, requestId
  }, '查询参数解析完成');

  try {
    // 构建WHERE条件
    const whereConditions: string[] = [];
    const queryParams: (string | number | boolean)[] = [];

    if (customer_name) {
      whereConditions.push('customer_name LIKE ?');
      queryParams.push(`%${customer_name}%`);
    }

    if (property_name) {
      whereConditions.push('property_name LIKE ?');
      queryParams.push(`%${property_name}%`);
    }

    if (viewing_status) {
      whereConditions.push('viewing_status = ?');
      queryParams.push(parseInt(viewing_status));
    }

    if (business_type) {
      whereConditions.push('business_type = ?');
      queryParams.push(business_type);
    }

    if (viewer_name) {
      whereConditions.push('viewer_name = ?');
      queryParams.push(viewer_name);
    }

    if (date_from) {
      whereConditions.push('viewing_time >= ?');
      queryParams.push(date_from);
    }

    if (date_to) {
      whereConditions.push('viewing_time <= ?');
      queryParams.push(date_to + ' 23:59:59');
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // 查询总数
    const countQuery = `SELECT COUNT(*) as total FROM qft_ai_viewing_records ${whereClause}`;
    const countResult = await dbManager.queryOne(countQuery, queryParams);
    const total = Number(countResult?.total || 0);

    // 计算分页
    const offset = (page - 1) * pageSize;

    // 查询数据
    const dataQuery = `
      SELECT 
        id,
        customer_id,
        viewing_time,
        property_name,
        property_address,
        room_type,
        room_tag,
        viewer_name,
        viewing_status,
        commission,
        viewing_feedback,
        business_type,
        notes,
        customer_name,
        customer_phone,
        created_at,
        updated_at
      FROM qft_ai_viewing_records 
      ${whereClause}
      ORDER BY viewing_time DESC, created_at DESC
      LIMIT ? OFFSET ?
    `;

    const dataParams = [...queryParams, pageSize, offset];
    const records = await dbManager.query(dataQuery, dataParams);

    requestLogger.info({
      total,
      returnedCount: records.length,
      page,
      pageSize,
      requestId
    }, '带看记录查询完成');

         return NextResponse.json({
       success: true,
       data: {
         data: records,
         total,
         page,
         pageSize,
         totalPages: Math.ceil(total / pageSize)
       }
     });

  } catch (error) {
    requestLogger.error({
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      requestId
    }, '带看记录查询失败');

         throw createDatabaseError('获取带看记录列表', error as Error);
   }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const requestId = generateRequestId();
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
    // 如果提供了客户ID，检查客户是否存在并获取客户信息
    let customerInfo = null;
    if (customer_id) {
      const customer = await dbManager.queryOne(
        'SELECT id, name, phone, userId, botId FROM qft_ai_customers WHERE id = ?',
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
    const result = await dbManager.execute(`
      INSERT INTO qft_ai_viewing_records (
        customer_id, viewing_time, property_name, property_address,
        room_type, room_tag, viewer_name, 
        viewing_status, commission, viewing_feedback, business_type, notes,
        customer_name, customer_phone, userId, botId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      customer_id || null,                         // 允许为空
      viewing_time ? new Date(viewing_time).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' '),    // 转换为MySQL datetime格式
      property_name || '未填写楼盘',                // 默认楼盘名
      property_address || null,
      room_type || 'one_bedroom',                  // 默认房型
      room_tag || null,
      viewer_name || 'internal',                   // 默认带看人类型
      viewing_status,
      commission,
      viewing_feedback !== undefined && viewing_feedback !== null ? viewing_feedback : null,
      business_type || 'whole_rent',               // 默认业务类型
      notes || null,
      customerInfo?.name || '',                    // 客户姓名快照
      customerInfo?.phone || '',                   // 客户电话快照
      customerInfo?.userId || null,                // 客户第三方userId
      customerInfo?.botId || null                  // 客户botId
    ]);

    if (result.lastInsertRowid && customer_id) {
      requestLogger.debug({
        customer_id,
        requestId
      }, '开始更新客户统计信息');

      // 如果有客户ID，更新客户的带看次数和总佣金
      await dbManager.execute(`
        UPDATE qft_ai_customers 
        SET 
          viewing_count = (SELECT COUNT(*) FROM qft_ai_viewing_records WHERE customer_id = ?),
          total_commission = (SELECT COALESCE(SUM(commission), 0) FROM qft_ai_viewing_records WHERE customer_id = ?),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [customer_id, customer_id, customer_id]);

      requestLogger.debug({
        customer_id,
        commission,
        requestId
      }, '客户统计信息更新完成');
    }

    // 记录业务操作成功
    if (result.lastInsertRowid) {
      requestLogger.info({
        statusCode: 201,
        viewingRecordId: result.lastInsertRowid,
        customer_id,
        customerName: customerInfo?.name,
        property_name: property_name || '未填写楼盘',
        commission,
        requestId
      }, 'API请求成功完成 - 带看记录创建成功');

      return createSuccessResponse(
        { id: result.lastInsertRowid },
        '带看记录添加成功',
        201
      );
    }

  } catch (error) {
    requestLogger.error({
      error: error instanceof Error ? error.message : error,
      customer_id,
      requestId
    }, 'API请求失败 - 带看记录创建失败');

    throw error; // 重新抛出错误让错误处理器处理
  }
}); 