import { NextRequest, NextResponse } from 'next/server';
import { dbManager } from '../../../lib/database';
import { Customer, CustomerFilterParams, ApiResponse, PaginatedResponse, SourceChannel, BusinessType } from '../../../types';
import { parseRoomTags } from '../../../utils/helpers';

// GET /api/customers - 获取客户列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 解析查询参数
    const filters: CustomerFilterParams = {
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
      name: searchParams.get('name') || undefined,
      phone: searchParams.get('phone') || undefined,
      status: searchParams.get('status') ? parseInt(searchParams.get('status')!) : undefined,
      source_channel: searchParams.get('source_channel') as SourceChannel | undefined,
      business_type: searchParams.get('business_type') as BusinessType | undefined,
      price_min: searchParams.get('price_min') ? parseFloat(searchParams.get('price_min')!) : undefined,
      price_max: searchParams.get('price_max') ? parseFloat(searchParams.get('price_max')!) : undefined,
      community: searchParams.get('community') || undefined,
    };

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

    // 价格区间过滤（需要解析 price_range 字段）
    if (filters.price_min || filters.price_max) {
      // price_range 格式为 "最小价格-最大价格"，如 "8000-10000"
      if (filters.price_min) {
        // 筛选最大价格 >= price_min 的记录
        conditions.push(`
          CAST(
            CASE 
              WHEN price_range LIKE '%-%' 
              THEN SUBSTR(price_range, INSTR(price_range, '-') + 1)
              ELSE price_range
            END AS INTEGER
          ) >= ?
        `);
        params.push(filters.price_min);
      }
      
      if (filters.price_max) {
        // 筛选最小价格 <= price_max 的记录
        conditions.push(`
          CAST(
            CASE 
              WHEN price_range LIKE '%-%' 
              THEN SUBSTR(price_range, 1, INSTR(price_range, '-') - 1)
              ELSE price_range
            END AS INTEGER
          ) <= ?
        `);
        params.push(filters.price_max);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 查询数据
    const baseQuery = `
      SELECT 
        id, name, phone, backup_phone, wechat, status, community,
        business_type, room_type, room_tags, move_in_date, lease_period,
        price_range, source_channel, creator, is_agent,
        total_commission, viewing_count, created_at, updated_at
      FROM customers 
      ${whereClause}
      ORDER BY created_at DESC
    `;

    const countQuery = `SELECT COUNT(*) as count FROM customers ${whereClause}`;

    const result = await dbManager.queryWithPagination<any>(
      baseQuery,
      countQuery,
      params,
      filters.page,
      filters.pageSize
    );

    // 计算符合筛选条件的总佣金
    const totalCommissionQuery = `SELECT COALESCE(SUM(total_commission), 0) as total_commission FROM customers ${whereClause}`;
    const totalCommissionResult = await dbManager.queryOne<{ total_commission: number }>(totalCommissionQuery, params);

    // 处理数据格式
    const customers: Customer[] = result.data.map((row: any) => ({
      ...row,
      room_tags: parseRoomTags(row.room_tags),
      is_agent: Boolean(row.is_agent)
    }));

    const response: ApiResponse<PaginatedResponse<Customer>> = {
      success: true,
      data: {
        ...result,
        data: customers,
        totalCommission: totalCommissionResult?.total_commission || 0
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/customers error:', error);
    const response: ApiResponse = {
      success: false,
      error: '获取客户列表失败',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/customers - 创建新客户
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 如果提供了手机号，检查是否已存在
    if (body.phone) {
      const existingCustomer = await dbManager.queryOne(
        'SELECT id FROM customers WHERE phone = ?',
        [body.phone]
      );

      if (existingCustomer) {
        return NextResponse.json(
          { success: false, error: '该手机号已存在' },
          { status: 400 }
        );
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

    const result = await dbManager.execute(insertSql, params);

    if (result.changes > 0) {
      // 获取新插入的客户信息
      const newCustomer = await dbManager.queryOne<any>(
        'SELECT * FROM customers WHERE id = ?',
        [result.lastInsertRowid]
      );

      const customer: Customer = {
        ...newCustomer,
        room_tags: parseRoomTags(newCustomer.room_tags),
        is_agent: Boolean(newCustomer.is_agent),
      };

      const response: ApiResponse<Customer> = {
        success: true,
        data: customer,
        message: '客户创建成功',
      };

      return NextResponse.json(response, { status: 201 });
    } else {
      throw new Error('插入数据失败');
    }
  } catch (error) {
    console.error('POST /api/customers error:', error);
    const response: ApiResponse = {
      success: false,
      error: '创建客户失败',
    };
    return NextResponse.json(response, { status: 500 });
  }
} 

// PUT /api/customers - 更新客户信息
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // 只验证核心必填字段：客户ID
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: '客户ID是必填字段' },
        { status: 400 }
      );
    }

    // 检查客户是否存在
    const existingCustomer = await dbManager.queryOne(
      'SELECT id FROM customers WHERE id = ?',
      [body.id]
    );

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, error: '客户不存在' },
        { status: 404 }
      );
    }

    // 如果提供了手机号，检查是否被其他客户使用
    if (body.phone) {
      const phoneCheck = await dbManager.queryOne(
        'SELECT id FROM customers WHERE phone = ? AND id != ?',
        [body.phone, body.id]
      );

      if (phoneCheck) {
        return NextResponse.json(
          { success: false, error: '该手机号已被其他客户使用' },
          { status: 400 }
        );
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

    const result = await dbManager.execute(updateSql, params);

    if (result.changes > 0) {
      // 获取更新后的客户信息
      const updatedCustomer = await dbManager.queryOne<any>(
        'SELECT * FROM customers WHERE id = ?',
        [body.id]
      );

      const customer: Customer = {
        ...updatedCustomer,
        room_tags: parseRoomTags(updatedCustomer.room_tags),
        is_agent: Boolean(updatedCustomer.is_agent),
      };

      const response: ApiResponse<Customer> = {
        success: true,
        data: customer,
        message: '客户更新成功',
      };

      return NextResponse.json(response, { status: 200 });
    } else {
      throw new Error('更新数据失败');
    }
  } catch (error) {
    console.error('PUT /api/customers error:', error);
    const response: ApiResponse = {
      success: false,
      error: '更新客户失败',
    };
    return NextResponse.json(response, { status: 500 });
  }
} 