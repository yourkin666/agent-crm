import { NextRequest, NextResponse } from 'next/server';
import { dbManager } from '../../../../lib/database';
import { createDatabaseError, createValidationError, createNotFoundError, withErrorHandler } from '../../../../lib/api-error-handler';
import { ErrorWithStatusCode } from '../../../../types';
import { createRequestLogger } from '../../../../lib/logger';
import { parseBusinessTypes, parseRoomTypes, parseRoomTags } from '../../../../utils/helpers';

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
    const customer = await dbManager.queryOne(
      'SELECT * FROM qft_ai_customers WHERE id = ?',
      [customerId]
    );

    if (!customer) {
      requestLogger.warn({
        customerId,
        requestId
      }, '客户不存在');
      throw createNotFoundError('客户');
    }

    const formattedCustomer = {
      ...customer,
      business_type: parseBusinessTypes(customer.business_type as string),
      room_type: parseRoomTypes(customer.room_type as string),
      room_tags: parseRoomTags(customer.room_tags as string),
      is_agent: Boolean(customer.is_agent),
    };

    requestLogger.info({
      customerId,
      requestId
    }, '成功获取客户信息');

    return NextResponse.json({
      success: true,
      data: formattedCustomer
    });

  } catch (error) {
    if (error instanceof Error && (error as ErrorWithStatusCode).statusCode) {
      throw error;
    }
    throw createDatabaseError('获取客户信息失败', error as Error);
  }
});

export const PUT = withErrorHandler(async (
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

  const body = await request.json();

  // 验证必填字段
  if (!body.name || !body.community) {
    throw createValidationError('客户姓名和咨询小区为必填项');
  }

  try {
    // 检查客户是否存在
    const existingCustomer = await dbManager.queryOne(
      'SELECT * FROM qft_ai_customers WHERE id = ?',
      [customerId]
    );

    if (!existingCustomer) {
      requestLogger.warn({
        customerId,
        requestId
      }, '要更新的客户不存在');
      throw createNotFoundError('客户');
    }

    // 如果提供了手机号，检查是否与其他客户重复
    if (body.phone) {
      const duplicateCustomer = await dbManager.queryOne(
        'SELECT id FROM qft_ai_customers WHERE phone = ? AND id != ?',
        [body.phone, customerId]
      );

      if (duplicateCustomer) {
        throw createValidationError('手机号已被其他客户使用');
      }
    }

    // 更新客户信息
    const updateSql = `
      UPDATE qft_ai_customers SET
        name = ?, nickname = ?, phone = ?, backup_phone = ?, wechat = ?,
        status = ?, community = ?, business_type = ?, room_type = ?, room_tags = ?,
        move_in_date = ?, lease_period = ?, price_range = ?, source_channel = ?,
        userId = ?, botId = ?, creator = ?, is_agent = ?, internal_notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const updateParams = [
      body.name,
      body.nickname || null,
      body.phone || null,
      body.backup_phone || null,
      body.wechat || null,
      body.status || 1,
      body.community,
      Array.isArray(body.business_type) 
        ? JSON.stringify(body.business_type) 
        : JSON.stringify(['whole_rent']),
      Array.isArray(body.room_type) 
        ? JSON.stringify(body.room_type) 
        : JSON.stringify(['one_bedroom']),
      body.room_tags ? JSON.stringify(body.room_tags) : null,
      body.move_in_date || null,
      body.lease_period || null,
      body.price_range || null,
      body.source_channel || 'referral',
      body.userId || null,
      body.botId || null,
      body.creator || '系统',
      body.is_agent !== undefined ? body.is_agent : true,
      body.internal_notes || null,
      customerId
    ];

    const result = await dbManager.execute(updateSql, updateParams);

    if (result.changes === 0) {
      throw createDatabaseError('更新客户信息失败');
    }

    // 获取更新后的客户信息
    const updatedCustomer = await dbManager.queryOne(
      'SELECT * FROM qft_ai_customers WHERE id = ?',
      [customerId]
    );

    if (!updatedCustomer) {
      throw createNotFoundError('更新后的客户信息');
    }

    const formattedCustomer = {
      ...updatedCustomer,
      business_type: parseBusinessTypes(updatedCustomer.business_type as string),
      room_type: parseRoomTypes(updatedCustomer.room_type as string),
      room_tags: parseRoomTags(updatedCustomer.room_tags as string),
      is_agent: Boolean(updatedCustomer.is_agent),
    };

    requestLogger.info({
      customerId,
      requestId
    }, '成功更新客户信息');

    return NextResponse.json({
      success: true,
      data: formattedCustomer,
      message: '客户信息更新成功'
    });

  } catch (error) {
    if (error instanceof Error && (error as ErrorWithStatusCode).statusCode) {
      throw error;
    }
    throw createDatabaseError('更新客户信息失败', error as Error);
  }
});

export const DELETE = withErrorHandler(async (
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
    // 检查客户是否存在
    const existingCustomer = await dbManager.queryOne(
      'SELECT * FROM qft_ai_customers WHERE id = ?',
      [customerId]
    );

    if (!existingCustomer) {
      requestLogger.warn({
        customerId,
        requestId
      }, '要删除的客户不存在');
      throw createNotFoundError('客户');
    }

    // 先删除与该客户相关的所有带看记录
    const viewingRecordsResult = await dbManager.execute(
      'DELETE FROM qft_ai_viewing_records WHERE customer_id = ?',
      [customerId]
    );

    requestLogger.info({
      customerId,
      requestId,
      deletedViewingRecords: viewingRecordsResult.changes
    }, '已删除客户相关的带看记录');

    // 删除客户
    const result = await dbManager.execute(
      'DELETE FROM qft_ai_customers WHERE id = ?',
      [customerId]
    );

    if (result.changes === 0) {
      throw createDatabaseError('删除客户失败');
    }

    requestLogger.info({
      customerId,
      requestId,
      deletedViewingRecords: viewingRecordsResult.changes
    }, '成功删除客户及相关带看记录');

    return NextResponse.json({
      success: true,
      message: '客户删除成功'
    });

  } catch (error) {
    if (error instanceof Error && (error as ErrorWithStatusCode).statusCode) {
      throw error;
    }
    throw createDatabaseError('删除客户失败', error as Error);
  }
}); 