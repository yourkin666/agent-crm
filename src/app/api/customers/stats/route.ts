import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-error-handler';
import { createRequestLogger } from '@/lib/logger';
import { dbManager } from '@/lib/database';
import { CustomerFilterParams, CustomerStatus, SourceChannel, BusinessType } from '@/types';

// 生成请求ID的辅助函数
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const requestId = generateRequestId();
  const requestLogger = createRequestLogger(requestId);

  try {
    const { searchParams } = request.nextUrl;
    
    requestLogger.info({
      method: 'GET',
      url: '/api/customers/stats',
      query: Object.fromEntries(searchParams.entries()),
      userAgent: request.headers?.get('user-agent') || 'unknown',
      requestId
    }, 'API请求开始 - 获取客户统计数据');

    // 解析筛选参数
    const filters: Partial<CustomerFilterParams> = {};
    
    // 处理搜索文本（支持姓名、昵称、电话搜索）
    const searchText = searchParams.get('name') || searchParams.get('searchText');
    if (searchText) {
      filters.name = searchText;
    }
    
    // 处理其他筛选参数
    const status = searchParams.get('status');
    if (status) {
      // 处理状态参数，支持单个值或数组
      const statusValues = status.split(',').map(s => parseInt(s.trim())).filter(s => !isNaN(s));
      if (statusValues.length === 1) {
        filters.status = statusValues[0] as CustomerStatus;
      } else if (statusValues.length > 1) {
        filters.status = statusValues as CustomerStatus[];
      }
    }
    
    const sourceChannel = searchParams.get('source_channel');
    if (sourceChannel) {
      // 处理来源渠道参数，支持单个值或数组
      const channelValues = sourceChannel.split(',').map(s => s.trim()).filter(s => s);
      if (channelValues.length === 1) {
        filters.source_channel = channelValues[0] as SourceChannel;
      } else if (channelValues.length > 1) {
        filters.source_channel = channelValues as SourceChannel[];
      }
    }
    
    const businessType = searchParams.get('business_type');
    if (businessType) {
      // 处理业务类型参数，支持单个值或数组
      const typeValues = businessType.split(',').map(s => s.trim()).filter(s => s);
      if (typeValues.length === 1) {
        filters.business_type = typeValues[0] as BusinessType;
      } else if (typeValues.length > 1) {
        filters.business_type = typeValues as BusinessType[];
      }
    }
    
    const community = searchParams.get('community');
    if (community) {
      filters.community = community;
    }
    
    const creator = searchParams.get('creator');
    if (creator) {
      // 处理录入人参数，支持单个值或数组
      const creatorValues = creator.split(',').map(s => s.trim()).filter(s => s);
      if (creatorValues.length === 1) {
        filters.creator = creatorValues[0];
      } else if (creatorValues.length > 1) {
        filters.creator = creatorValues;
      }
    }
    
    const isAgent = searchParams.get('is_agent');
    if (isAgent) {
      // 处理录入方式参数，支持单个值或数组
      const agentValues = isAgent.split(',').map(s => s.trim() === 'true').filter(s => s !== undefined);
      if (agentValues.length === 1) {
        filters.is_agent = agentValues[0];
      } else if (agentValues.length > 1) {
        filters.is_agent = agentValues;
      }
    }
    
    const city = searchParams.get('city');
    if (city) {
      // 处理城市参数，支持单个值或数组
      const cityValues = city.split(',').map(s => s.trim()).filter(s => s);
      if (cityValues.length === 1) {
        filters.city = cityValues[0];
      } else if (cityValues.length > 1) {
        filters.city = cityValues;
      }
    }
    
    const botId = searchParams.get('botId');
    if (botId) {
      filters.botId = botId;
    }

    // 构建WHERE条件
    const conditions: string[] = [];
    const params: (string | number | boolean)[] = [];

    if (filters.name) {
      conditions.push('(name LIKE ? OR nickname LIKE ? OR phone LIKE ? OR backup_phone LIKE ?)');
      params.push(`%${filters.name}%`, `%${filters.name}%`, `%${filters.name}%`, `%${filters.name}%`);
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        if (filters.status.length > 0) {
          const placeholders = filters.status.map(() => '?').join(', ');
          conditions.push(`status IN (${placeholders})`);
          params.push(...filters.status);
        }
      } else {
        conditions.push('status = ?');
        params.push(filters.status);
      }
    }

    if (filters.source_channel) {
      if (Array.isArray(filters.source_channel)) {
        if (filters.source_channel.length > 0) {
          const placeholders = filters.source_channel.map(() => '?').join(', ');
          conditions.push(`source_channel IN (${placeholders})`);
          params.push(...filters.source_channel);
        }
      } else {
        conditions.push('source_channel = ?');
        params.push(filters.source_channel);
      }
    }

    if (filters.business_type) {
      if (Array.isArray(filters.business_type)) {
        if (filters.business_type.length > 0) {
          const businessConditions = filters.business_type.map(() => 'business_type LIKE ?').join(' OR ');
          conditions.push(`(${businessConditions})`);
          filters.business_type.forEach(type => {
            params.push(`%"${type}"%`);
          });
        }
      } else {
        conditions.push('business_type LIKE ?');
        params.push(`%"${filters.business_type}"%`);
      }
    }

    if (filters.creator) {
      if (Array.isArray(filters.creator)) {
        if (filters.creator.length > 0) {
          const placeholders = filters.creator.map(() => '?').join(', ');
          conditions.push(`creator IN (${placeholders})`);
          params.push(...filters.creator);
        }
      } else {
        conditions.push('creator = ?');
        params.push(filters.creator);
      }
    }

    if (filters.is_agent !== undefined) {
      if (Array.isArray(filters.is_agent)) {
        if (filters.is_agent.length > 0) {
          const placeholders = filters.is_agent.map(() => '?').join(', ');
          conditions.push(`is_agent IN (${placeholders})`);
          params.push(...filters.is_agent.map(agent => agent ? 1 : 0));
        }
      } else {
        conditions.push('is_agent = ?');
        params.push(filters.is_agent ? 1 : 0);
      }
    }

    if (filters.city) {
      if (Array.isArray(filters.city)) {
        if (filters.city.length > 0) {
          const placeholders = filters.city.map(() => '?').join(', ');
          conditions.push(`city IN (${placeholders})`);
          params.push(...filters.city);
        }
      } else {
        conditions.push('city LIKE ?');
        params.push(`%${filters.city}%`);
      }
    }

    if (filters.community) {
      conditions.push('community LIKE ?');
      params.push(`%${filters.community}%`);
    }

    if (filters.botId) {
      conditions.push('botId = ?');
      params.push(filters.botId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 查询各状态的客户数量
    const statsQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM qft_ai_customers 
      ${whereClause}
      GROUP BY status
    `;

    const statsResult = await dbManager.query(statsQuery, params);
    
    // 初始化统计数据
    const stats = {
      total: 0,
      following: 0,    // 跟进中 (status = 1)
      completed: 0,    // 已成交 (status = 4, 5)
      totalCommission: 0
    };

    // 处理查询结果
    statsResult.forEach((row: Record<string, unknown>) => {
      const status = row.status as number;
      const count = row.count as number;
      stats.total += count;
      
      if (status === 1) {
        stats.following = count;
      } else if (status === 4 || status === 5) {
        stats.completed += count;
      }
    });

    // 查询总佣金
    const commissionQuery = `
      SELECT COALESCE(SUM(total_commission), 0) as total_commission 
      FROM qft_ai_customers
      ${whereClause}
    `;
    
    const commissionResult = await dbManager.queryOne<{ total_commission: number }>(commissionQuery, params);
    stats.totalCommission = commissionResult?.total_commission || 0;

    requestLogger.info({
      stats,
      requestId
    }, '客户统计数据查询完成');

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    requestLogger.error({
      error: error instanceof Error ? error.message : error,
      requestId
    }, '获取客户统计数据失败');

    throw error;
  }
}); 