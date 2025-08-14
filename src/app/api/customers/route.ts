import { NextRequest } from 'next/server';
import { dbManager } from '../../../lib/database';
import { Customer, CustomerFilterParams, PaginatedResponse, CustomerRow } from '../../../types';
import { parseRoomTags, parseBusinessTypes, parseRoomTypes } from '../../../utils/helpers';
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
export const dynamic = 'force-dynamic';

// 生成请求ID的辅助函数
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 辅助函数：解析筛选参数，支持单值和多值
function parseFilterParam(value: string | null, type: 'string' | 'number' | 'boolean'): string | number | boolean | string[] | number[] | boolean[] | undefined {
  if (!value) return undefined;
  
  try {
    // 尝试解析为数组
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map(item => {
        switch (type) {
          case 'number': return parseInt(item);
          case 'boolean': return item === 'true' || item === true;
          default: return item;
        }
      });
    }
    // 单值情况
    switch (type) {
      case 'number': return parseInt(parsed);
      case 'boolean': return parsed === 'true' || parsed === true;
      default: return parsed;
    }
  } catch {
    // 解析失败，按单值处理
    switch (type) {
      case 'number': return parseInt(value);
      case 'boolean': return value === 'true';
      default: return value;
    }
  }
}

// GET /api/customers - 获取客户列表
export const GET = withErrorHandler(async (request: NextRequest) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const requestLogger = createRequestLogger(requestId);
  
  const { searchParams } = request.nextUrl;

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
    status: parseFilterParam(searchParams.get('status'), 'number') as CustomerFilterParams['status'],
    source_channel: parseFilterParam(searchParams.get('source_channel'), 'string') as CustomerFilterParams['source_channel'],
    business_type: parseFilterParam(searchParams.get('business_type'), 'string') as CustomerFilterParams['business_type'],
    price_min: searchParams.get('price_min') ? parseFloat(searchParams.get('price_min')!) : undefined,
    price_max: searchParams.get('price_max') ? parseFloat(searchParams.get('price_max')!) : undefined,
    community: searchParams.get('community') || undefined,
    creator: parseFilterParam(searchParams.get('creator'), 'string') as CustomerFilterParams['creator'],
    is_agent: parseFilterParam(searchParams.get('is_agent'), 'boolean') as CustomerFilterParams['is_agent'],
    city: parseFilterParam(searchParams.get('city'), 'string') as CustomerFilterParams['city'],
    move_in_days: searchParams.get('move_in_days') ? parseInt(searchParams.get('move_in_days')!) : undefined,
    viewing_today: searchParams.get('viewing_today') === 'true',
    my_entries: searchParams.get('my_entries') === 'true',
    botId: searchParams.get('botId') || undefined,
  };

  requestLogger.debug({
    filters,
    requestId
  }, '查询参数解析完成');

  // 构建 WHERE 条件
  const conditions: string[] = [];
  const params: (string | number | boolean)[] = [];

  if (filters.name) {
    conditions.push('name LIKE ?');
    params.push(`%${filters.name}%`);
  }

  if (filters.phone) {
    conditions.push('(phone LIKE ? OR backup_phone LIKE ?)');
    params.push(`%${filters.phone}%`, `%${filters.phone}%`);
  }

  // 状态筛选（支持多选）
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      const placeholders = filters.status.map(() => '?').join(', ');
      conditions.push(`status IN (${placeholders})`);
      params.push(...filters.status);
    } else {
      conditions.push('status = ?');
      params.push(filters.status);
    }
  }

  // 来源渠道筛选（支持多选）
  if (filters.source_channel) {
    if (Array.isArray(filters.source_channel)) {
      const placeholders = filters.source_channel.map(() => '?').join(', ');
      conditions.push(`source_channel IN (${placeholders})`);
      params.push(...filters.source_channel);
    } else {
      conditions.push('source_channel = ?');
      params.push(filters.source_channel);
    }
  }

  // 业务类型筛选（支持多选）
  if (filters.business_type) {
    if (Array.isArray(filters.business_type)) {
      const businessConditions = filters.business_type.map(() => 'business_type LIKE ?').join(' OR ');
      conditions.push(`(${businessConditions})`);
      filters.business_type.forEach(type => {
        params.push(`%"${type}"%`);
      });
    } else {
      conditions.push('business_type LIKE ?');
      params.push(`%"${filters.business_type}"%`);
    }
  }

  // 录入人筛选（支持多选）
  if (filters.creator) {
    if (Array.isArray(filters.creator)) {
      const placeholders = filters.creator.map(() => '?').join(', ');
      conditions.push(`creator IN (${placeholders})`);
      params.push(...filters.creator);
    } else {
      conditions.push('creator = ?');
      params.push(filters.creator);
    }
  }

  // 录入方式筛选（支持多选）
  if (filters.is_agent !== undefined) {
    if (Array.isArray(filters.is_agent)) {
      const placeholders = filters.is_agent.map(() => '?').join(', ');
      conditions.push(`is_agent IN (${placeholders})`);
      params.push(...filters.is_agent.map(val => val ? 1 : 0));
    } else {
      conditions.push('is_agent = ?');
      params.push(filters.is_agent ? 1 : 0);
    }
  }

  // 城市筛选（支持多选）
  if (filters.city) {
    if (Array.isArray(filters.city)) {
      const cityConditions = filters.city.map(() => 'community LIKE ?').join(' OR ');
      conditions.push(`(${cityConditions})`);
      filters.city.forEach(city => {
        params.push(`%${city}%`);
      });
    } else {
      conditions.push('community LIKE ?');
      params.push(`%${filters.city}%`);
    }
  }

  if (filters.community) {
    conditions.push('community LIKE ?');
    params.push(`%${filters.community}%`);
  }

  // 新增：按 botId 精确筛选
  if (filters.botId) {
    conditions.push('botId = ?');
    params.push(filters.botId);
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

  // 入住时间筛选（X日内入住）
  if (filters.move_in_days) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + filters.move_in_days);
    conditions.push('move_in_date <= ?');
    params.push(targetDate.toISOString().split('T')[0]);
  }

  // 今日看房筛选
  if (filters.viewing_today) {
    const today = new Date().toISOString().split('T')[0];
    conditions.push(`id IN (
      SELECT DISTINCT customer_id FROM qft_ai_viewing_records 
      WHERE DATE(created_at) = ?
    )`);
    params.push(today);
  }

  // 我录入的筛选（需要传入当前用户信息，这里暂时使用固定值）
  if (filters.my_entries) {
    // TODO: 从session或token中获取当前用户
    conditions.push('creator = ?');
    params.push('admin'); // 临时使用admin作为当前用户
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
 
  // 构建基础查询和计数查询
  const baseQuery = `
    SELECT c.* FROM (
      SELECT * FROM qft_ai_customers 
      ${whereClause}
    ) AS c
    LEFT JOIN (
      SELECT * FROM qft_ai_customers 
      ${whereClause}
    ) AS c2
      ON c.userId IS NOT NULL
     AND c.userId = c2.userId
     AND COALESCE(c.botId, '-1') = COALESCE(c2.botId, '-1')
     AND (c2.created_at > c.created_at OR (c2.created_at = c.created_at AND c2.id > c.id))
    WHERE c2.id IS NULL
    ORDER BY c.created_at DESC
  `;
  
  const countQuery = `
    SELECT COUNT(*) as count FROM (
      SELECT c.id FROM (
        SELECT * FROM qft_ai_customers 
        ${whereClause}
      ) AS c
      LEFT JOIN (
        SELECT * FROM qft_ai_customers 
        ${whereClause}
      ) AS c2
        ON c.userId IS NOT NULL
       AND c.userId = c2.userId
       AND COALESCE(c.botId, '-1') = COALESCE(c2.botId, '-1')
       AND (c2.created_at > c.created_at OR (c2.created_at = c.created_at AND c2.id > c.id))
      WHERE c2.id IS NULL
    ) AS deduped
  `;

  // 计算符合筛选条件并去重后的总佣金
  const totalCommissionQuery = `
    SELECT COALESCE(SUM(d.total_commission), 0) as total_commission FROM (
      SELECT c.* FROM (
        SELECT * FROM qft_ai_customers 
        ${whereClause}
      ) AS c
      LEFT JOIN (
        SELECT * FROM qft_ai_customers 
        ${whereClause}
      ) AS c2
        ON c.userId IS NOT NULL
       AND c.userId = c2.userId
       AND COALESCE(c.botId, '-1') = COALESCE(c2.botId, '-1')
       AND (c2.created_at > c.created_at OR (c2.created_at = c.created_at AND c2.id > c.id))
      WHERE c2.id IS NULL
    ) AS d
  `;

  try {
    // 记录查询开始
    requestLogger.debug({
      conditionsCount: conditions.length,
      requestId
    }, '开始执行数据库查询');

    // 使用分页查询助手（参数需要重复两次，因为子查询使用了两次 where 条件）
    const dedupeParams = [...params, ...params];
    const result = await dbManager.queryWithPagination<CustomerRow>(
      baseQuery,
      countQuery,
      dedupeParams,
      filters.page,
      filters.pageSize
    );

    // 获取总佣金（同样需要重复参数）
    const totalCommissionResult = await dbManager.queryOne<{ total_commission: number }>(
      totalCommissionQuery,
      dedupeParams
    );

    // 处理客户数据
    const customers: Customer[] = result.data.map((row: CustomerRow) => ({
      ...row,
      business_type: parseBusinessTypes(row.business_type),
      room_type: parseRoomTypes(row.room_type),
      room_tags: parseRoomTags(row.room_tags || null),
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
      'SELECT id FROM qft_ai_customers WHERE phone = ?',
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
    INSERT INTO qft_ai_customers (
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
    // 处理业务类型数组
    body.business_type && Array.isArray(body.business_type) && body.business_type.length > 0 
      ? JSON.stringify(body.business_type) 
      : JSON.stringify(['whole_rent']),      // 默认业务类型：整租
    // 处理户型需求数组
    body.room_type && Array.isArray(body.room_type) && body.room_type.length > 0 
      ? JSON.stringify(body.room_type) 
      : JSON.stringify(['one_bedroom']),     // 默认房型：一居室
    body.room_tags ? JSON.stringify(body.room_tags) : null,
    body.move_in_date || null,
    body.lease_period || null,
    body.price_range || null,               // 价格范围
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
      const newCustomer = await dbManager.queryOne<CustomerRow>(
        'SELECT * FROM qft_ai_customers WHERE id = ?',
        [result.lastInsertRowid]
      );

      if (!newCustomer) {
        throw createDatabaseError('获取新创建的客户信息');
      }

      const customer: Customer = {
        ...newCustomer,
        business_type: parseBusinessTypes(newCustomer.business_type),
        room_type: parseRoomTypes(newCustomer.room_type),
        room_tags: parseRoomTags(newCustomer.room_tags || null),
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
    'SELECT * FROM qft_ai_customers WHERE id = ?',
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
      'SELECT id FROM qft_ai_customers WHERE phone = ? AND id != ?',
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
    UPDATE qft_ai_customers SET 
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
    // 处理业务类型数组
    body.business_type && Array.isArray(body.business_type) && body.business_type.length > 0 
      ? JSON.stringify(body.business_type) 
      : JSON.stringify(['whole_rent']),      // 默认业务类型
    // 处理户型需求数组
    body.room_type && Array.isArray(body.room_type) && body.room_type.length > 0 
      ? JSON.stringify(body.room_type) 
      : JSON.stringify(['one_bedroom']),     // 默认房型
    body.room_tags ? JSON.stringify(body.room_tags) : null,
    body.move_in_date || null,
    body.lease_period || null,
    body.price_range || null,               // 价格范围
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
      const updatedCustomer = await dbManager.queryOne<CustomerRow>(
        'SELECT * FROM qft_ai_customers WHERE id = ?',
        [body.id]
      );

      if (!updatedCustomer) {
        throw createDatabaseError('获取更新后的客户信息');
      }

      const customer: Customer = {
        ...updatedCustomer,
        business_type: parseBusinessTypes(updatedCustomer.business_type),
        room_type: parseRoomTypes(updatedCustomer.room_type),
        room_tags: parseRoomTags(updatedCustomer.room_tags || null),
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