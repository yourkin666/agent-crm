import { NextRequest, NextResponse } from 'next/server';
import { dbManager } from '../../../lib/database';
import { Customer, CustomerFilterParams, ApiResponse, PaginatedResponse, SourceChannel, BusinessType } from '../../../types';
import { parseRoomTags } from '../../../utils/helpers';
import { DEFAULT_PAGE_SIZE } from '../../../utils/constants';
import { 
  withErrorHandler, 
  createSuccessResponse, 
  createValidationError, 
  createNotFoundError, 
  createDuplicateError,
  createDatabaseError 
} from '../../../lib/api-error-handler';
import { validateCustomerData } from '../../../lib/validation';
import { logApiRequest, businessLogger, createRequestLogger } from '../../../lib/logger';

// 生成请求ID的辅助函数
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// GET /api/customers - 获取客户列表
export const GET = withErrorHandler(async (request: NextRequest) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const requestLogger = createRequestLogger(requestId);
  
  const { searchParams } = new URL(request.url);

  // 记录请求开始
  requestLogger.info({
    method: 'GET',
    url: '/api/customers',
    query: Object.fromEntries(searchParams.entries()),
    userAgent: request.headers.get('user-agent')
  }, 'API请求开始 - 获取客户列表');

  // 解析查询参数
  const filters: CustomerFilterParams = {
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: parseInt(searchParams.get('pageSize') || DEFAULT_PAGE_SIZE.toString()),
    name: searchParams.get('name') || undefined,
    phone: searchParams.get('phone') || undefined,
    status: searchParams.get('status') ? parseInt(searchParams.get('status')!) : undefined,
    source_channel: searchParams.get('source_channel') as SourceChannel | undefined,
    business_type: searchParams.get('business_type') as BusinessType | undefined,
    price_min: searchParams.get('price_min') ? parseFloat(searchParams.get('price_min')!) : undefined,
    price_max: searchParams.get('price_max') ? parseFloat(searchParams.get('price_max')!) : undefined,
    community: searchParams.get('community') || undefined,
  };

  requestLogger.debug({
    filters,
    requestId
  }, '查询参数解析完成');

  // 构建 WHERE 条件
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.name) {
    conditions.push('name LIKE ?');
    params.push(`%${filters.name}%`);
  }

  if (filters.phone) {
    conditions.push('phone LIKE ?');
    params.push(`%${filters.phone}%`);
  }

  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }

  if (filters.source_channel) {
    conditions.push('source_channel = ?');
    params.push(filters.source_channel);
  }

  if (filters.business_type) {
    conditions.push('business_type = ?');
    params.push(filters.business_type);
  }

  if (filters.community) {
    conditions.push('community LIKE ?');
    params.push(`%${filters.community}%`);
  }

  // 价格范围筛选
  if (filters.price_min !== undefined || filters.price_max !== undefined) {
    if (filters.price_min !== undefined && filters.price_max !== undefined) {
      conditions.push(`(
        (price_range IS NOT NULL AND 
         CAST(SUBSTR(price_range, 1, INSTR(price_range, '-')-1) AS INTEGER) >= ? AND
         CAST(SUBSTR(price_range, INSTR(price_range, '-')+1) AS INTEGER) <= ?)
      )`);
      params.push(filters.price_min, filters.price_max);
    } else if (filters.price_min !== undefined) {
      conditions.push(`(
        price_range IS NOT NULL AND 
        CAST(SUBSTR(price_range, 1, INSTR(price_range, '-')-1) AS INTEGER) >= ?
      )`);
      params.push(filters.price_min);
    } else if (filters.price_max !== undefined) {
      conditions.push(`(
        price_range IS NOT NULL AND 
        CAST(SUBSTR(price_range, INSTR(price_range, '-')+1) AS INTEGER) <= ?
      )`);
      params.push(filters.price_max);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 构建基础查询和计数查询
  const baseQuery = `
    SELECT * FROM customers 
    ${whereClause}
    ORDER BY created_at DESC
  `;
  
  const countQuery = `SELECT COUNT(*) as count FROM customers ${whereClause}`;

  // 计算符合筛选条件的总佣金
  const totalCommissionQuery = `SELECT COALESCE(SUM(total_commission), 0) as total_commission FROM customers ${whereClause}`;

  try {
    // 记录查询开始
    requestLogger.debug({
      conditionsCount: conditions.length,
      requestId
    }, '开始执行数据库查询');

    // 使用分页查询助手
    const result = await dbManager.queryWithPagination<any>(
      baseQuery,
      countQuery,
      params,
      filters.page,
      filters.pageSize
    );

    // 获取总佣金
    const totalCommissionResult = await dbManager.queryOne<{ total_commission: number }>(
      totalCommissionQuery,
      params
    );

    // 处理客户数据
    const customers: Customer[] = result.data.map((row: any) => ({
      ...row,
      room_tags: parseRoomTags(row.room_tags),
      is_agent: Boolean(row.is_agent),
    }));

    const responseData: PaginatedResponse<Customer> = {
      ...result,
      data: customers,
      totalCommission: totalCommissionResult?.total_commission || 0,
    };

    const duration = Date.now() - startTime;

    // 记录业务操作成功
    businessLogger.customer('list_queried', undefined, {
      requestId,
      filters,
      resultCount: customers.length,
      totalRecords: result.total,
      totalCommission: responseData.totalCommission,
      duration
    });

    // 记录API请求完成
    logApiRequest('GET', '/api/customers', 200, duration);
    
    requestLogger.info({
      statusCode: 200,
      duration,
      resultCount: customers.length,
      totalRecords: result.total,
      requestId
    }, 'API请求成功完成 - 客户列表查询');

    return createSuccessResponse(responseData);
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // 记录API请求失败
    logApiRequest('GET', '/api/customers', 500, duration, error as Error);
    
    requestLogger.error({
      error: error instanceof Error ? error.message : error,
      duration,
      requestId
    }, 'API请求失败 - 客户列表查询');

    throw createDatabaseError('获取客户列表', error as Error);
  }
});

// POST /api/customers - 创建新客户
export const POST = withErrorHandler(async (request: NextRequest) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const requestLogger = createRequestLogger(requestId);

  // 记录请求开始
  requestLogger.info({
    method: 'POST',
    url: '/api/customers',
    userAgent: request.headers.get('user-agent'),
    requestId
  }, 'API请求开始 - 创建新客户');

  const body = await request.json();

  // 记录请求数据（敏感信息脱敏）
  requestLogger.debug({
    customerData: {
      name: body.name,
      hasPhone: !!body.phone,
      community: body.community,
      business_type: body.business_type,
      source_channel: body.source_channel
    },
    requestId
  }, '客户创建请求数据解析完成');

  // 验证输入数据
  validateCustomerData(body);

  // 如果提供了手机号，检查是否已存在
  if (body.phone) {
    const existingCustomer = await dbManager.queryOne(
      'SELECT id FROM customers WHERE phone = ?',
      [body.phone]
    );

    if (existingCustomer) {
      requestLogger.warn({
        phone: body.phone,
        existingCustomerId: existingCustomer.id,
        requestId
      }, '客户手机号已存在');
      throw createDuplicateError('手机号');
    }
  }

  // 插入新客户，为必填字段提供默认值
  const insertSql = `
    INSERT INTO customers (
      name, phone, backup_phone, wechat, status, community,
      business_type, room_type, room_tags, move_in_date, lease_period,
      price_range, source_channel, creator, is_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    body.name || '未填写',                    // 默认姓名
    body.phone || null,                       // 手机号可以为空
    body.backup_phone || null,
    body.wechat || null,
    body.status || 1,                        // 默认为跟进中
    body.community || '未填写',               // 默认小区
    body.business_type || 'whole_rent',       // 默认业务类型：整租
    body.room_type || 'one_bedroom',          // 默认房型：一居室
    body.room_tags ? JSON.stringify(body.room_tags) : null,
    body.move_in_date || null,
    body.lease_period || null,
    body.price_range || null,
    body.source_channel || 'referral',       // 默认来源：转介绍
    body.creator || '系统',                   // 默认录入人
    body.is_agent !== undefined ? body.is_agent : true,
  ];

  try {
    requestLogger.debug({
      requestId
    }, '开始创建客户记录');

    const result = await dbManager.execute(insertSql, params);

    if (result.changes > 0) {
      // 获取新插入的客户信息
      const newCustomer = await dbManager.queryOne<any>(
        'SELECT * FROM customers WHERE id = ?',
        [result.lastInsertRowid]
      );

      if (!newCustomer) {
        throw createDatabaseError('获取新创建的客户信息');
      }

      const customer: Customer = {
        ...newCustomer,
        room_tags: parseRoomTags(newCustomer.room_tags),
        is_agent: Boolean(newCustomer.is_agent),
      };

      const duration = Date.now() - startTime;

      // 记录业务操作成功
      businessLogger.customer('created', customer.id.toString(), {
        requestId,
        customerName: customer.name,
        customerPhone: customer.phone,
        community: customer.community,
        business_type: customer.business_type,
        source_channel: customer.source_channel,
        creator: customer.creator,
        duration
      });

      // 记录API请求完成
      logApiRequest('POST', '/api/customers', 201, duration);
      
      requestLogger.info({
        statusCode: 201,
        duration,
        customerId: customer.id,
        customerName: customer.name,
        requestId
      }, 'API请求成功完成 - 客户创建成功');

      return createSuccessResponse(customer, '客户创建成功', 201);
    } else {
      throw createDatabaseError('创建客户');
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // 记录API请求失败
    logApiRequest('POST', '/api/customers', 500, duration, error as Error);
    
    requestLogger.error({
      error: error instanceof Error ? error.message : error,
      duration,
      requestId
    }, 'API请求失败 - 客户创建失败');

    throw createDatabaseError('创建客户', error as Error);
  }
});

// PUT /api/customers - 更新客户信息
export const PUT = withErrorHandler(async (request: NextRequest) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const requestLogger = createRequestLogger(requestId);

  // 记录请求开始
  requestLogger.info({
    method: 'PUT',
    url: '/api/customers',
    userAgent: request.headers.get('user-agent'),
    requestId
  }, 'API请求开始 - 更新客户信息');

  const body = await request.json();

  // 验证ID字段（如果进行更新操作）
  if (!body.id) {
    requestLogger.error({
      requestId
    }, '更新客户请求缺少客户ID');
    throw createValidationError('更新操作需要提供客户ID');
  }

  // 记录请求数据（敏感信息脱敏）
  requestLogger.debug({
    customerId: body.id,
    updateData: {
      name: body.name,
      hasPhone: !!body.phone,
      community: body.community,
      business_type: body.business_type,
      status: body.status
    },
    requestId
  }, '客户更新请求数据解析完成');

  // 验证输入数据
  validateCustomerData(body);

  // 检查客户是否存在
  const existingCustomer = await dbManager.queryOne(
    'SELECT * FROM customers WHERE id = ?',
    [body.id]
  );

  if (!existingCustomer) {
    requestLogger.warn({
      customerId: body.id,
      requestId
    }, '要更新的客户不存在');
    throw createNotFoundError('客户');
  }

  // 如果提供了手机号，检查是否被其他客户使用
  if (body.phone) {
    const phoneCheck = await dbManager.queryOne(
      'SELECT id FROM customers WHERE phone = ? AND id != ?',
      [body.phone, body.id]
    );

    if (phoneCheck) {
      requestLogger.warn({
        phone: body.phone,
        customerId: body.id,
        conflictCustomerId: phoneCheck.id,
        requestId
      }, '客户手机号与其他客户冲突');
      throw createDuplicateError('手机号');
    }
  }

  // 更新客户信息
  const updateSql = `
    UPDATE customers SET 
      name = ?, phone = ?, backup_phone = ?, wechat = ?, status = ?, community = ?,
      business_type = ?, room_type = ?, room_tags = ?, move_in_date = ?, lease_period = ?,
      price_range = ?, source_channel = ?, is_agent = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const params = [
    body.name || '未填写',                    // 默认姓名
    body.phone || null,                       // 手机号可以为空
    body.backup_phone || null,
    body.wechat || null,
    body.status || 1,
    body.community || '未填写',               // 默认小区
    body.business_type || 'whole_rent',       // 默认业务类型
    body.room_type || 'one_bedroom',          // 默认房型
    body.room_tags ? JSON.stringify(body.room_tags) : null,
    body.move_in_date || null,
    body.lease_period || null,
    body.price_range || null,
    body.source_channel || 'referral',       // 默认来源
    body.is_agent !== undefined ? body.is_agent : true,
    body.id,
  ];

  try {
    requestLogger.debug({
      customerId: body.id,
      requestId
    }, '开始更新客户记录');

    const result = await dbManager.execute(updateSql, params);

    if (result.changes > 0) {
      // 获取更新后的客户信息
      const updatedCustomer = await dbManager.queryOne<any>(
        'SELECT * FROM customers WHERE id = ?',
        [body.id]
      );

      if (!updatedCustomer) {
        throw createDatabaseError('获取更新后的客户信息');
      }

      const customer: Customer = {
        ...updatedCustomer,
        room_tags: parseRoomTags(updatedCustomer.room_tags),
        is_agent: Boolean(updatedCustomer.is_agent),
      };

      const duration = Date.now() - startTime;

      // 记录业务操作成功
      businessLogger.customer('updated', customer.id.toString(), {
        requestId,
        customerName: customer.name,
        customerPhone: customer.phone,
        previousData: {
          name: existingCustomer.name,
          status: existingCustomer.status,
          community: existingCustomer.community
        },
        newData: {
          name: customer.name,
          status: customer.status,
          community: customer.community
        },
        duration
      });

      // 记录API请求完成
      logApiRequest('PUT', '/api/customers', 200, duration);
      
      requestLogger.info({
        statusCode: 200,
        duration,
        customerId: customer.id,
        customerName: customer.name,
        requestId
      }, 'API请求成功完成 - 客户更新成功');

      return createSuccessResponse(customer, '客户更新成功');
    } else {
      throw createDatabaseError('更新客户');
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // 记录API请求失败
    logApiRequest('PUT', '/api/customers', 500, duration, error as Error);
    
    requestLogger.error({
      error: error instanceof Error ? error.message : error,
      duration,
      customerId: body.id,
      requestId
    }, 'API请求失败 - 客户更新失败');

    throw createDatabaseError('更新客户', error as Error);
  }
}); 