import { NextRequest, NextResponse } from 'next/server';
import { dbManager } from '@/lib/database';
import { Customer, CustomerFilterParams, ApiResponse, PaginatedResponse, SourceChannel, BusinessType } from '@/types';
import { parseRoomTags } from '@/utils/helpers';

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
      // 这里需要复杂的价格区间匹配逻辑
      // 暂时简化处理
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

    // 处理数据格式
    const customers: Customer[] = result.data.map((row: any) => ({
      ...row,
      room_tags: parseRoomTags(row.room_tags),
      is_agent: Boolean(row.is_agent),
    }));

    const response: ApiResponse<PaginatedResponse<Customer>> = {
      success: true,
      data: {
        ...result,
        data: customers,
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

    // 验证必填字段
    const requiredFields = ['name', 'phone', 'community', 'business_type', 'room_type', 'source_channel', 'creator'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `缺少必填字段: ${field}` },
          { status: 400 }
        );
      }
    }

    // 检查手机号是否已存在
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

    // 插入新客户
    const insertSql = `
      INSERT INTO customers (
        name, phone, backup_phone, wechat, status, community,
        business_type, room_type, room_tags, move_in_date, lease_period,
        price_range, source_channel, creator, is_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      body.name,
      body.phone,
      body.backup_phone || null,
      body.wechat || null,
      body.status || 1, // 默认为跟进中
      body.community,
      body.business_type,
      body.room_type,
      body.room_tags ? JSON.stringify(body.room_tags) : null,
      body.move_in_date || null,
      body.lease_period || null,
      body.price_range || null,
      body.source_channel,
      body.creator,
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

    // 验证必填字段
    const requiredFields = ['id', 'name', 'phone', 'community', 'business_type', 'room_type', 'source_channel'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `缺少必填字段: ${field}` },
          { status: 400 }
        );
      }
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

    // 检查手机号是否被其他客户使用
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

    // 更新客户信息
    const updateSql = `
      UPDATE customers SET 
        name = ?, phone = ?, backup_phone = ?, wechat = ?, status = ?, community = ?,
        business_type = ?, room_type = ?, room_tags = ?, move_in_date = ?, lease_period = ?,
        price_range = ?, source_channel = ?, is_agent = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const params = [
      body.name,
      body.phone,
      body.backup_phone || null,
      body.wechat || null,
      body.status || 1,
      body.community,
      body.business_type,
      body.room_type,
      body.room_tags ? JSON.stringify(body.room_tags) : null,
      body.move_in_date || null,
      body.lease_period || null,
      body.price_range || null,
      body.source_channel,
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