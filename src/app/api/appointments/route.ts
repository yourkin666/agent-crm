import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../lib/database';
import { Appointment, AppointmentFilterParams, PaginatedResponse, ApiResponse } from '../../../types';
import { DEFAULT_PAGE_SIZE } from '../../../utils/constants';
import { 
  withErrorHandler, 
  createSuccessResponse, 
  createValidationError, 
  createNotFoundError, 
  createDatabaseError 
} from '../../../lib/api-error-handler';
import { validateAppointmentData } from '../../../lib/validation';
import { logApiRequest, businessLogger, createRequestLogger } from '../../../lib/logger';

// 生成请求ID的辅助函数
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// GET /api/appointments - 获取预约列表（包含预约记录和带看记录）
export const GET = withErrorHandler(async (request: NextRequest) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const requestLogger = createRequestLogger(requestId);

  const { searchParams } = new URL(request.url);

  // 记录请求开始
  requestLogger.info({
    method: 'GET',
    url: '/api/appointments',
    query: Object.fromEntries(searchParams.entries()),
    userAgent: request.headers.get('user-agent')
  }, 'API请求开始 - 获取预约列表');
  
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || DEFAULT_PAGE_SIZE.toString());
  const offset = (page - 1) * pageSize;

  // 获取筛选参数
  const customerName = searchParams.get('customer_name');
  const customerPhone = searchParams.get('customer_phone');
  const agentName = searchParams.get('agent_name');
  const status = searchParams.get('status') ? parseInt(searchParams.get('status')!) : null;
  const type = searchParams.get('type');

  // 记录查询条件
  requestLogger.debug({
    filters: {
      page,
      pageSize,
      customerName,
      customerPhone,
      agentName,
      status,
      type
    },
    requestId
  }, '查询参数解析完成');

  // 构建筛选条件
  const conditions: string[] = [];
  const params: any[] = [];

  if (customerName) {
    conditions.push('customer_name LIKE ?');
    params.push(`%${customerName}%`);
  }
  if (customerPhone) {
    conditions.push('customer_phone LIKE ?');
    params.push(`%${customerPhone}%`);
  }
  if (agentName) {
    conditions.push('agent_name LIKE ?');
    params.push(`%${agentName}%`);
  }
  if (status !== null) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const db = await getDatabase();

    requestLogger.debug({
      conditionsCount: conditions.length,
      requestId
    }, '开始执行数据库查询');

    // 合并预约表和带看记录表的数据，统一显示
    const combinedQuery = `
      SELECT * FROM (
        SELECT 
          'appointment' as source_type,
          id,
          property_name,
          property_address,
          customer_name,
          customer_phone,
          agent_name,
          appointment_time,
          status,
          type,
          created_at,
          updated_at
        FROM appointments
        
        UNION ALL
        
        SELECT 
          'viewing_record' as source_type,
          v.id + 10000 as id,  -- 避免ID冲突，带看记录ID加10000
          COALESCE('直接带看 - ' || SUBSTR(v.notes, 1, 20), '直接带看') as property_name,
          c.community as property_address,
          c.name as customer_name,
          c.phone as customer_phone,
          v.viewer_name as agent_name,
          v.created_at as appointment_time,
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
      ) combined_data
      ${whereClause}
      ORDER BY appointment_time DESC
      LIMIT ? OFFSET ?
    `;

    const appointments = await db.all(combinedQuery, [...params, pageSize, offset]);

    // 获取总数（预约记录 + 带看记录，应用相同的筛选条件）
    const countQuery = `
      SELECT COUNT(*) as total FROM (
        SELECT 
          'appointment' as source_type,
          id,
          property_name,
          property_address,
          customer_name,
          customer_phone,
          agent_name,
          appointment_time,
          status,
          type,
          created_at,
          updated_at
        FROM appointments
        
        UNION ALL
        
        SELECT 
          'viewing_record' as source_type,
          v.id + 10000 as id,  -- 避免ID冲突，带看记录ID加10000
          COALESCE('直接带看 - ' || SUBSTR(v.notes, 1, 20), '直接带看') as property_name,
          c.community as property_address,
          c.name as customer_name,
          c.phone as customer_phone,
          v.viewer_name as agent_name,
          v.created_at as appointment_time,
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
      ) combined_data
      ${whereClause}
    `;
    
    const totalResult = await db.get(countQuery, params);
    const total = totalResult?.total || 0;

    const duration = Date.now() - startTime;

    // 记录业务操作成功
    businessLogger.appointment('list_queried', undefined, {
      requestId,
      filters: {
        customerName,
        customerPhone,
        agentName,
        status,
        type
      },
      resultCount: appointments.length,
      totalRecords: total,
      duration
    });

    // 记录API请求完成
    logApiRequest('GET', '/api/appointments', 200, duration);
    
    requestLogger.info({
      statusCode: 200,
      duration,
      resultCount: appointments.length,
      totalRecords: total,
      requestId
    }, 'API请求成功完成 - 预约列表查询');

    return NextResponse.json({
      success: true,
      data: {
        data: appointments,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    // 记录API请求失败
    logApiRequest('GET', '/api/appointments', 500, duration, error as Error);
    
    requestLogger.error({
      error: error instanceof Error ? error.message : error,
      duration,
      requestId
    }, 'API请求失败 - 预约列表查询');

    throw createDatabaseError('获取预约列表', error as Error);
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const requestLogger = createRequestLogger(requestId);

  // 记录请求开始
  requestLogger.info({
    method: 'POST',
    url: '/api/appointments',
    userAgent: request.headers.get('user-agent'),
    requestId
  }, 'API请求开始 - 创建新预约');

  const body = await request.json();

  // 记录请求数据（敏感信息脱敏）
  requestLogger.debug({
    appointmentData: {
      property_name: body.property_name,
      hasCustomerPhone: !!body.customer_phone,
      customer_name: body.customer_name,
      agent_name: body.agent_name,
      type: body.type,
      create_viewing_record: body.create_viewing_record
    },
    requestId
  }, '预约创建请求数据解析完成');
  
  // 验证输入数据
  validateAppointmentData(body);
  
  const {
    property_name,
    property_address,
    customer_name,
    customer_phone,
    agent_name,
    appointment_time,
    status = 1,
    type,
    city,
    create_viewing_record = false, // 新增：是否同时创建带看记录
    viewing_feedback = 0,
    commission = 0,
    notes = ''
  } = body;

  try {
    const db = await getDatabase();

    requestLogger.debug({
      willCreateViewing: create_viewing_record,
      requestId
    }, '开始创建预约记录');

    // 开始事务
    await db.run('BEGIN TRANSACTION');

    try {
      // 插入预约记录，为必填字段提供默认值
      const appointmentResult = await db.run(`
        INSERT INTO appointments (
          property_name, property_address, customer_name, customer_phone,
          agent_name, appointment_time, status, type, city
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        property_name || '未填写',                                    // 默认物业名称
        property_address || '未填写',                                 // 默认地址
        customer_name || '未填写',                                    // 默认客户姓名
        customer_phone || null,                                      // 客户电话可为空
        agent_name || '未填写',                                       // 默认经纪人
        appointment_time || new Date().toISOString(),                // 默认为当前时间
        status,
        type || 'whole_rent',                                        // 默认业务类型
        city || null
      ]);

      let viewingRecordId = null;
      let customerId = null;

      // 如果需要同时创建带看记录
      if (create_viewing_record) {
        requestLogger.debug({
          requestId
        }, '开始创建关联的客户和带看记录');

        // 查找或创建客户记录
        let customer = await db.get(
          'SELECT * FROM customers WHERE phone = ?',
          [customer_phone]
        );

        if (!customer) {
          // 创建新客户
          const customerResult = await db.run(`
            INSERT INTO customers (
              name, phone, status, community, business_type, 
              room_type, source_channel, creator, is_agent
            ) VALUES (?, ?, 3, ?, ?, 'one_bedroom', 'beike', ?, 1)
          `, [
            customer_name,
            customer_phone,
            property_address || '未知小区',
            type,
            agent_name
          ]);
          
          customerId = customerResult.lastID;

          requestLogger.debug({
            customerId,
            customerName: customer_name,
            requestId
          }, '创建了新客户记录');
        } else {
          customerId = customer.id;
          requestLogger.debug({
            customerId,
            customerName: customer.name,
            requestId
          }, '使用了现有客户记录');
        }

        // 创建带看记录
        const viewingResult = await db.run(`
          INSERT INTO viewing_records (
            customer_id, viewing_time, property_name, property_address,
            room_type, room_tag, viewer_name,
            viewing_status, commission, viewing_feedback, business_type, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 4, ?, ?, ?, ?)
        `, [
          customerId,
          appointment_time,
          property_name,
          property_address,
          'one_bedroom', // 默认房型
          null,
          'internal', // 默认内部经纪人
          commission,
          viewing_feedback,
          type,
          notes || `预约带看：${property_name} - ${property_address}`
        ]);

        viewingRecordId = viewingResult.lastID;

        // 更新客户的带看次数和总佣金
        await db.run(`
          UPDATE customers 
          SET 
            viewing_count = (SELECT COUNT(*) FROM viewing_records WHERE customer_id = ?),
            total_commission = (SELECT COALESCE(SUM(commission), 0) FROM viewing_records WHERE customer_id = ?),
            status = CASE 
              WHEN ? = 1 THEN 4  -- 如果成交，更新状态为已成交未结佣
              ELSE status 
            END,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [customerId, customerId, viewing_feedback, customerId]);

        requestLogger.debug({
          viewingRecordId,
          commission,
          requestId
        }, '创建了带看记录并更新了客户统计');
      }

      // 提交事务
      await db.run('COMMIT');

      const duration = Date.now() - startTime;

      // 记录业务操作成功
      if (create_viewing_record && appointmentResult.lastID) {
        businessLogger.appointment('created_with_viewing', appointmentResult.lastID.toString(), {
          requestId,
          property_name,
          customer_name,
          customer_phone,
          agent_name,
          customerId,
          viewingRecordId,
          commission,
          duration
        });
      } else if (appointmentResult.lastID) {
        businessLogger.appointment('created', appointmentResult.lastID.toString(), {
          requestId,
          property_name,
          customer_name,
          customer_phone,
          agent_name,
          type,
          duration
        });
      }

      // 记录API请求完成
      logApiRequest('POST', '/api/appointments', 201, duration);
      
      requestLogger.info({
        statusCode: 201,
        duration,
        appointmentId: appointmentResult.lastID,
        customerId,
        viewingRecordId,
        requestId
      }, `API请求成功完成 - ${create_viewing_record ? '预约和带看记录创建成功' : '预约创建成功'}`);

      return createSuccessResponse({ 
        id: appointmentResult.lastID,
        viewing_record_id: viewingRecordId,
        customer_id: customerId
      }, create_viewing_record ? '预约和带看记录添加成功' : '预约添加成功', 201);

    } catch (error) {
      // 回滚事务
      await db.run('ROLLBACK');
      
      requestLogger.error({
        error: error instanceof Error ? error.message : error,
        requestId
      }, '事务执行失败，已回滚');

      throw createDatabaseError('创建预约', error as Error);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // 记录API请求失败
    logApiRequest('POST', '/api/appointments', 500, duration, error as Error);
    
    requestLogger.error({
      error: error instanceof Error ? error.message : error,
      duration,
      requestId
    }, 'API请求失败 - 预约创建失败');

    throw error; // 重新抛出错误让错误处理器处理
  }
}); 