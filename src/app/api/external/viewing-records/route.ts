import { NextRequest } from 'next/server';
import { dbManager } from '@/lib/database';
import { withErrorHandler, createSuccessResponse, createValidationError } from '@/lib/api-error-handler';
import { createRequestLogger } from '@/lib/logger';

// 生成请求ID的辅助函数
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 外部房源查询API接口
interface PropertyInfo {
  id: number;
  companyId: number;
  businessType: number;
  housingId: number;
  houseAreaId: number;
  houseAreaName: string;
  cityId: number;
  cityName: string;
  propertyAddrId: number;
  propertyAddr: string;
  detailAddr: string;
  peripheryKeyword?: string;
  longitude: string;
  latitude: string;
  roomId: number;
  insideSpace?: number;
  orientation?: string;
  unitType: string;
  floor?: string;
  totalFloor?: string;
  advisorId: number;
  advisorName: string;
  companyName: string;
  companyAbbreviation: string;
  searchBusinessType: number;
  houseTypeId: number;
}

interface ExternalPropertyResponse {
  code: number;
  message: string;
  data: PropertyInfo[];
  timestamp: number;
}

// 调用外部房源查询API
async function queryExternalPropertyInfo(propertyAddr: string, detailAddr?: string, requestLogger?: { info: (data: Record<string, unknown>, message: string) => void; error: (data: Record<string, unknown>, message: string) => void }): Promise<PropertyInfo | null> {
  const requestId = generateRequestId();
  
  try {
    const baseUrl = 'https://ai-agent-test.quanfangtongvip.com/housing-push';
    const searchParams = new URLSearchParams({
      propertyAddr: propertyAddr,
      limit: '10' // 限制返回10条结果
    });
    
    if (detailAddr) {
      searchParams.append('detailAddr', detailAddr);
    }
    
    // 正确的API路径已确认：/api/housing/search-properties
    const apiUrl = `${baseUrl}/api/housing/search-properties?${searchParams.toString()}`;
    
    requestLogger?.info({
      apiUrl,
      propertyAddr,
      detailAddr,
      requestId
    }, '开始调用外部房源查询API');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CRM-System/1.0'
      },
      // 设置超时时间
      signal: AbortSignal.timeout(10000) // 10秒超时
    });
    
    if (!response.ok) {
      requestLogger?.error({
        status: response.status,
        statusText: response.statusText,
        propertyAddr,
        detailAddr,
        requestId
      }, '外部房源查询API请求失败');
      return null;
    }
    
    const data: ExternalPropertyResponse = await response.json();
    
    requestLogger?.info({
      responseCode: data.code,
      dataLength: data.data?.length,
      propertyAddr,
      detailAddr,
      requestId
    }, '外部房源查询API响应成功');
    
    if (data.code === 200 && data.data && data.data.length > 0) {
      // 返回第一个匹配的房源信息
      const propertyInfo = data.data[0];
      
      requestLogger?.info({
        propertyAddrId: propertyInfo.propertyAddrId,
        housingId: propertyInfo.housingId,
        cityName: propertyInfo.cityName,
        houseAreaName: propertyInfo.houseAreaName,
        advisorName: propertyInfo.advisorName,
        companyName: propertyInfo.companyName,
        requestId
      }, '成功获取房源详细信息');
      
      return propertyInfo;
    } else {
      requestLogger?.error({
        responseCode: data.code,
        message: data.message,
        propertyAddr,
        detailAddr,
        requestId
      }, '外部房源查询API未找到匹配房源');
      return null;
    }
    
  } catch (error) {
    requestLogger?.error({
      error: error instanceof Error ? error.message : error,
      propertyAddr,
      detailAddr,
      requestId
    }, '调用外部房源查询API发生错误');
    // 返回null而不是抛出错误，让带看记录创建可以继续进行
    return null;
  }
}

// 外部带看记录数据验证
function validateExternalViewingData(data: Record<string, unknown>): void {
  // 必填字段验证
  if (!data.userId) {
    throw createValidationError('userId为必填字段');
  }
  
  if (!data.property_name) {
    throw createValidationError('property_name为必填字段');
  }

  // 移除所有其他数据限制，允许接收任何格式的数据
}

// 从带看记录数据中提取客户信息
function extractCustomerDataFromViewing(viewingData: Record<string, unknown>) {
  // 确保客户姓名不为空，使用fallback值
  const customerName = viewingData.customer_name || `用户${viewingData.userId}`;
  
  return {
    userId: viewingData.userId,
    botId: viewingData.botId || null,
    nickname: viewingData.customer_name || null, // 使用原始customer_name作为nickname，可以为空
    name: customerName, // 确保name字段不为空
    phone: viewingData.customer_phone || null,
    community: viewingData.property_name || null, // 将物业地址作为咨询小区
    business_type: viewingData.business_type || 'whole_rent',
    room_type: viewingData.room_type || 'one_bedroom',
    room_tags: viewingData.room_tag ? JSON.stringify([viewingData.room_tag]) : null,
    source_channel: 'referral', // 外部来源默认为推荐
    creator: '外部Agent系统',
    internal_notes: `由带看记录自动创建/更新。房源：${viewingData.property_name}${viewingData.property_address ? `，地址：${viewingData.property_address}` : ''}${viewingData.cityName ? `，城市：${viewingData.cityName}` : ''}${viewingData.houseAreaName ? `，区域：${viewingData.houseAreaName}` : ''}`
  };
}

// POST /api/external/viewing-records - 外部带看记录录入（智能客户处理）
export const POST = withErrorHandler(async (request: NextRequest) => {
  const requestId = generateRequestId();
  const requestLogger = createRequestLogger(requestId);

  // 记录请求开始
  requestLogger.info({
    method: 'POST',
    url: '/api/external/viewing-records',
          userAgent: request.headers?.get('user-agent') || 'unknown',
    requestId
  }, '外部API请求开始 - 录入带看记录数据');

  const body = await request.json();

  // 记录请求数据（敏感信息脱敏）
  requestLogger.debug({
    viewingData: {
      userId: body.userId,
      customer_name: body.customer_name,
      hasCustomerPhone: !!body.customer_phone,
      property_name: body.property_name,
      business_type: body.business_type,
      room_type: body.room_type,
      viewing_status: body.viewing_status,
      commission: body.commission
    },
    requestId
  }, '外部带看记录录入请求解析完成');

  // 验证输入数据
  validateExternalViewingData(body);

  try {
    const {
      userId,
      botId,
      customer_name,
      customer_phone,
      viewing_time,
      property_name,
      property_address,
      room_type = 'one_bedroom',
      room_tag,
      viewer_name = 'external',
      viewing_status = 1,
      commission = 0,
      viewing_feedback,
      business_type = 'whole_rent',
      notes,
      // 扩展字段
      housingId,
      houseAreaId,
      houseAreaName,
      cityId,
      cityName,
      propertyAddrId,
      unitType,
      longitude,
      latitude,
      roomId,
      advisorId,
      advisorName,
      companyName,
      companyAbbreviation,
      houseTypeId
    } = body;

    let customerId = null;
    let customerAction = 'none';

    // 步骤1: 根据userId查找客户
    requestLogger.debug({
      userId,
      requestId
    }, '开始查找客户');

    const existingCustomer = await dbManager.queryOne(
      'SELECT id, name, phone, community FROM qft_ai_customers WHERE userId = ?',
      [userId]
    );

    if (existingCustomer) {
      // 步骤2a: 客户存在，更新客户数据
      customerId = existingCustomer.id;
      customerAction = 'updated';

      requestLogger.info({
        userId,
        customerId,
        existingCustomerName: existingCustomer.name,
        requestId
      }, '客户已存在，将更新客户数据');

      // 从带看数据中提取客户信息进行更新
      const customerUpdateData = extractCustomerDataFromViewing(body);

      // 构建更新SQL，避免手机号冲突
      const updateFields: string[] = [];
      const updateValues: (string | number | boolean)[] = [];
      
      // 非唯一性字段，安全更新
      if (customerUpdateData.botId !== null) {
        updateFields.push('botId = COALESCE(?, botId)');
        updateValues.push(customerUpdateData.botId as string);
      }
      if (customerUpdateData.nickname !== null) {
        updateFields.push('nickname = COALESCE(?, nickname)');
        updateValues.push(customerUpdateData.nickname as string);
      }
      if (customerUpdateData.name !== null) {
        updateFields.push('name = COALESCE(?, name)');
        updateValues.push(customerUpdateData.name as string);
      }
      if (customerUpdateData.community !== null) {
        updateFields.push('community = COALESCE(?, community)');
        updateValues.push(customerUpdateData.community as string);
      }
      if (customerUpdateData.business_type !== null) {
        updateFields.push('business_type = COALESCE(?, business_type)');
        updateValues.push(customerUpdateData.business_type as string);
      }
      if (customerUpdateData.room_type !== null) {
        updateFields.push('room_type = COALESCE(?, room_type)');
        updateValues.push(customerUpdateData.room_type as string);
      }
      if (customerUpdateData.room_tags !== null) {
        updateFields.push('room_tags = COALESCE(?, room_tags)');
        updateValues.push(customerUpdateData.room_tags as string);
      }
      if (customerUpdateData.source_channel !== null) {
        updateFields.push('source_channel = COALESCE(?, source_channel)');
        updateValues.push(customerUpdateData.source_channel as string);
      }
      if (customerUpdateData.creator !== null) {
        updateFields.push('creator = COALESCE(?, creator)');
        updateValues.push(customerUpdateData.creator as string);
      }
      if (customerUpdateData.internal_notes !== null) {
        updateFields.push('internal_notes = COALESCE(?, internal_notes)');
        updateValues.push(customerUpdateData.internal_notes as string);
      }
      
      // 手机号只在现有客户没有手机号的情况下才更新
      if (customerUpdateData.phone !== null && !existingCustomer.phone) {
        updateFields.push('phone = ?');
        updateValues.push(customerUpdateData.phone as string);
      }
      
      // 总是更新更新时间
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(customerId as number); // WHERE条件的参数
      
      if (updateFields.length > 1) { // 大于1是因为包含了updated_at
        await dbManager.execute(`
          UPDATE qft_ai_customers SET ${updateFields.join(', ')}
          WHERE id = ?
        `, updateValues);
      }

      requestLogger.debug({
        customerId,
        userId,
        requestId
      }, '客户数据更新完成');

    } else {
      // 步骤2b: 客户不存在，创建新客户
      customerAction = 'created';

      requestLogger.info({
        userId,
        customer_name,
        requestId
      }, '客户不存在，将创建新客户');

      // 从带看数据中提取客户信息进行创建
      const customerCreateData = extractCustomerDataFromViewing(body);

      const customerResult = await dbManager.execute(`
        INSERT INTO qft_ai_customers (
          userId, botId, nickname, name, phone,
          status, community, business_type, room_type, room_tags,
          source_channel, creator, is_agent, internal_notes
        ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, 0, ?)
      `, [
        customerCreateData.userId as string,
        customerCreateData.botId as string,
        customerCreateData.nickname as string,
        customerCreateData.name as string,
        customerCreateData.phone as string,
        customerCreateData.community as string,
        customerCreateData.business_type as string,
        customerCreateData.room_type as string,
        customerCreateData.room_tags as string,
        customerCreateData.source_channel as string,
        customerCreateData.creator as string,
        customerCreateData.internal_notes as string
      ]);

      if (customerResult.lastInsertRowid) {
        customerId = customerResult.lastInsertRowid;
        requestLogger.debug({
          customerId,
          userId,
          customer_name,
          requestId
        }, '新客户创建完成');
      }
    }

    // 步骤3: 查询外部房源信息（如果提供了物业地址）
    let externalPropertyInfo = null;
    if (property_name) {
      requestLogger.debug({
        customerId,
        userId,
        property_name,
        property_address,
        requestId
      }, '开始查询外部房源信息');

      externalPropertyInfo = await queryExternalPropertyInfo(
        property_name, 
        property_address, 
        requestLogger
      );

      if (externalPropertyInfo) {
        requestLogger.info({
          propertyAddrId: externalPropertyInfo.propertyAddrId,
          housingId: externalPropertyInfo.housingId,
          cityName: externalPropertyInfo.cityName,
          houseAreaName: externalPropertyInfo.houseAreaName,
          advisorName: externalPropertyInfo.advisorName,
          companyName: externalPropertyInfo.companyName,
          unitType: externalPropertyInfo.unitType,
          requestId
        }, '外部房源信息查询成功，将自动填入带看记录');
      } else {
        requestLogger.debug({
          property_name,
          property_address,
          requestId
        }, '未查询到外部房源信息，使用原始数据创建带看记录');
      }
    }

    // 合并外部查询的房源信息和原始传入的数据
    // 优先使用外部查询到的数据，如果没有则使用原始数据
    const finalHousingData = {
      housingId: externalPropertyInfo?.housingId || housingId,
      houseAreaId: externalPropertyInfo?.houseAreaId || houseAreaId,
      houseAreaName: externalPropertyInfo?.houseAreaName || houseAreaName,
      cityId: externalPropertyInfo?.cityId || cityId,
      cityName: externalPropertyInfo?.cityName || cityName,
      propertyAddrId: externalPropertyInfo?.propertyAddrId || propertyAddrId,
      unitType: externalPropertyInfo?.unitType || unitType,
      longitude: externalPropertyInfo?.longitude || longitude,
      latitude: externalPropertyInfo?.latitude || latitude,
      roomId: externalPropertyInfo?.roomId || roomId,
      advisorId: externalPropertyInfo?.advisorId || advisorId,
      advisorName: externalPropertyInfo?.advisorName || advisorName,
      companyName: externalPropertyInfo?.companyName || companyName,
      companyAbbreviation: externalPropertyInfo?.companyAbbreviation || companyAbbreviation,
      houseTypeId: externalPropertyInfo?.houseTypeId || houseTypeId
    };

    // 记录最终使用的房源数据
    requestLogger.debug({
      originalData: {
        housingId,
        cityName,
        houseAreaName,
        advisorName,
        companyName
      },
      externalData: externalPropertyInfo ? {
        housingId: externalPropertyInfo.housingId,
        cityName: externalPropertyInfo.cityName,
        houseAreaName: externalPropertyInfo.houseAreaName,
        advisorName: externalPropertyInfo.advisorName,
        companyName: externalPropertyInfo.companyName
      } : null,
      finalData: finalHousingData,
      requestId
    }, '房源数据合并完成');

    // 步骤4: 检查带看记录是否已存在 (userId + property_address 组合)
    let existingViewingRecord = null;
    let viewingRecordAction = 'created';
    
    // 查询现有记录（使用 userId 和 property_address 组合）
    if (property_address) {
      existingViewingRecord = await dbManager.queryOne(
        'SELECT id, customer_id FROM qft_ai_viewing_records WHERE userId = ? AND property_address = ?',
        [userId, property_address]
      );
    } else {
      // 如果没有详细地址，则使用 userId + property_name 组合查找
      existingViewingRecord = await dbManager.queryOne(
        'SELECT id, customer_id FROM qft_ai_viewing_records WHERE userId = ? AND property_name = ? AND property_address IS NULL',
        [userId, property_name]
      );
    }

    let viewingResult;
    if (existingViewingRecord) {
      // 步骤4a: 更新现有带看记录
      viewingRecordAction = 'updated';
      
      requestLogger.info({
        existingViewingRecordId: existingViewingRecord.id,
        userId,
        property_name,
        property_address,
        requestId
      }, '发现重复带看记录，将更新现有记录');

      await dbManager.execute(`
        UPDATE qft_ai_viewing_records SET
          customer_id = ?,
          viewing_time = ?,
          property_name = ?,
          property_address = ?,
          room_type = ?,
          room_tag = ?,
          viewer_name = ?,
          viewing_status = ?,
          commission = ?,
          viewing_feedback = ?,
          business_type = ?,
          notes = ?,
          customer_name = ?,
          customer_phone = ?,
          botId = ?,
          housingId = ?,
          houseAreaId = ?,
          houseAreaName = ?,
          cityId = ?,
          cityName = ?,
          propertyAddrId = ?,
          unitType = ?,
          longitude = ?,
          latitude = ?,
          roomId = ?,
          advisorId = ?,
          advisorName = ?,
          companyName = ?,
          companyAbbreviation = ?,
          houseTypeId = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        customerId,
        viewing_time ? new Date(viewing_time).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' '),
        property_name,
        property_address || null,
        room_type,
        room_tag || null,
        viewer_name,
        viewing_status,
        commission,
        viewing_feedback || null,
        business_type,
        notes || null,
        customer_name || '',
        customer_phone || '',
        botId || null,
        finalHousingData.housingId || null,
        finalHousingData.houseAreaId || null,
        finalHousingData.houseAreaName || null,
        finalHousingData.cityId || null,
        finalHousingData.cityName || null,
        finalHousingData.propertyAddrId || null,
        finalHousingData.unitType || null,
        finalHousingData.longitude || null,
        finalHousingData.latitude || null,
        finalHousingData.roomId || null,
        finalHousingData.advisorId || null,
        finalHousingData.advisorName || null,
        finalHousingData.companyName || null,
        finalHousingData.companyAbbreviation || null,
        finalHousingData.houseTypeId || null,
        existingViewingRecord.id
      ]);

      // 模拟 INSERT 结果的结构，用于后续处理
      viewingResult = {
        lastInsertRowid: existingViewingRecord.id
      };

    } else {
      // 步骤4b: 创建新的带看记录
      requestLogger.debug({
        customerId,
        userId,
        property_name,
        hasExternalPropertyInfo: !!externalPropertyInfo,
        requestId
      }, '开始创建新的带看记录');

      viewingResult = await dbManager.execute(`
        INSERT INTO qft_ai_viewing_records (
          customer_id, viewing_time, property_name, property_address,
          room_type, room_tag, viewer_name, viewing_status, commission,
          viewing_feedback, business_type, notes, customer_name, customer_phone,
          userId, botId, housingId, houseAreaId, houseAreaName, cityId, cityName,
          propertyAddrId, unitType, longitude, latitude, roomId, advisorId,
          advisorName, companyName, companyAbbreviation, houseTypeId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        customerId,
        viewing_time ? new Date(viewing_time).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' '),
        property_name,
        property_address || null,
        room_type,
        room_tag || null,
        viewer_name,
        viewing_status,
        commission,
        viewing_feedback || null,
        business_type,
        notes || null,
        customer_name || '',
        customer_phone || '',
        userId,
        botId || null,
        finalHousingData.housingId || null,
        finalHousingData.houseAreaId || null,
        finalHousingData.houseAreaName || null,
        finalHousingData.cityId || null,
        finalHousingData.cityName || null,
        finalHousingData.propertyAddrId || null,
        finalHousingData.unitType || null,
        finalHousingData.longitude || null,
        finalHousingData.latitude || null,
        finalHousingData.roomId || null,
        finalHousingData.advisorId || null,
        finalHousingData.advisorName || null,
        finalHousingData.companyName || null,
        finalHousingData.companyAbbreviation || null,
        finalHousingData.houseTypeId || null
      ]);
    }

    // 步骤5: 更新客户统计信息
    if (customerId && viewingResult.lastInsertRowid) {
      requestLogger.debug({
        customerId,
        requestId
      }, '开始更新客户统计信息');

      await dbManager.execute(`
        UPDATE qft_ai_customers 
        SET 
          viewing_count = (SELECT COUNT(*) FROM qft_ai_viewing_records WHERE customer_id = ?),
          total_commission = (SELECT COALESCE(SUM(commission), 0) FROM qft_ai_viewing_records WHERE customer_id = ?),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [customerId as number, customerId as number, customerId as number]);

      // 检查是否需要联动更新客户状态
      // 检查该客户是否有任何带看记录的反馈为'已成交'
      const hasDealFeedback = await dbManager.queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM qft_ai_viewing_records WHERE customer_id = ? AND viewing_feedback = 1',
        [customerId as number]
      );
      
      if (hasDealFeedback && hasDealFeedback.count > 0) {
        // 当客户有任何带看记录的反馈为'已成交'时，将客户状态更新为'已成交未结佣'
        const customerUpdateSql = `
          UPDATE qft_ai_customers 
          SET status = 4, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ? AND status != 4
        `;
        
        const customerResult = await dbManager.execute(customerUpdateSql, [customerId as number]);
        
        if (customerResult.changes > 0) {
          requestLogger.info({
            viewingRecordId: viewingResult.lastInsertRowid,
            customerId: customerId,
            dealCount: hasDealFeedback.count,
            requestId
          }, '客户状态已联动更新为已成交未结佣（基于所有带看记录）');
        }
      }

      requestLogger.info({
        statusCode: 201,
        customerId,
        customerAction,
        viewingRecordId: viewingResult.lastInsertRowid,
        viewingRecordAction,
        userId,
        customer_name,
        property_name,
        commission,
        externalPropertyFound: !!externalPropertyInfo,
        externalPropertyData: externalPropertyInfo ? {
          propertyAddrId: externalPropertyInfo.propertyAddrId,
          cityName: externalPropertyInfo.cityName,
          houseAreaName: externalPropertyInfo.houseAreaName,
          advisorName: externalPropertyInfo.advisorName
        } : null,
        requestId
      }, `外部API请求成功完成 - 带看记录${viewingRecordAction === 'created' ? '录入' : '更新'}成功（已自动填入外部房源信息）`);

              return createSuccessResponse(
          {
            viewing_record_id: viewingResult.lastInsertRowid,
          customer_id: customerId,
          customer_action: customerAction,
          viewing_record_action: viewingRecordAction,
          userId,
          external_property_enriched: !!externalPropertyInfo,
          external_property_data: externalPropertyInfo ? {
            propertyAddrId: externalPropertyInfo.propertyAddrId,
            housingId: externalPropertyInfo.housingId,
            cityName: externalPropertyInfo.cityName,
            houseAreaName: externalPropertyInfo.houseAreaName,
            advisorName: externalPropertyInfo.advisorName,
            companyName: externalPropertyInfo.companyName
          } : null
        },
        `带看记录${viewingRecordAction === 'created' ? '录入' : '更新'}成功，客户${customerAction === 'created' ? '已创建' : '已更新'}${externalPropertyInfo ? '，已自动填入外部房源信息' : ''}`,
        201
      );
    }

  } catch (error) {
    requestLogger.error({
      error: error instanceof Error ? error.message : error,
      userId: body.userId,
      property_name: body.property_name,
      requestId
    }, '外部API请求失败 - 带看记录录入失败');

    throw error; // 重新抛出错误让错误处理器处理
  }
}); 