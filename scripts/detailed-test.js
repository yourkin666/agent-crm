#!/usr/bin/env node

/**
 * 详细测试外部统计接口
 * 验证 userId 和 botId 筛选功能
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const API_PATH = '/api/external/statistics';

// 测试用例
const testCases = [
  {
    name: '1. 无参数查询（所有数据）',
    params: {},
    expected: {
      hasFilters: false,
      viewingCount: '> 0',
      commission: '> 0'
    }
  },
  {
    name: '2. 单个userId查询 - 123',
    params: { userId: '123' },
    expected: {
      hasFilters: true,
      userIds: ['123'],
      botIds: []
    }
  },
  {
    name: '3. 多个userId查询 - 123,456,789',
    params: { userId: '123,456,789' },
    expected: {
      hasFilters: true,
      userIds: ['123', '456', '789'],
      botIds: []
    }
  },
  {
    name: '4. 单个botId查询 - bot1',
    params: { botId: 'bot1' },
    expected: {
      hasFilters: true,
      userIds: [],
      botIds: ['bot1']
    }
  },
  {
    name: '5. 多个botId查询 - bot1,bot2,bot3',
    params: { botId: 'bot1,bot2,bot3' },
    expected: {
      hasFilters: true,
      userIds: [],
      botIds: ['bot1', 'bot2', 'bot3']
    }
  },
  {
    name: '6. 交集查询 - userId=123,456 & botId=bot1,bot2',
    params: { userId: '123,456', botId: 'bot1,bot2' },
    expected: {
      hasFilters: true,
      userIds: ['123', '456'],
      botIds: ['bot1', 'bot2']
    }
  },
  {
    name: '7. 时间范围查询 - 2024-01-01 到 2024-01-31',
    params: { date_from: '2024-01-01', date_to: '2024-01-31' },
    expected: {
      hasFilters: false,
      hasPeriod: true,
      period: { date_from: '2024-01-01', date_to: '2024-01-31' }
    }
  },
  {
    name: '8. 组合查询 - 时间+userId+botId',
    params: { 
      date_from: '2024-01-01', 
      date_to: '2024-01-31',
      userId: '123',
      botId: 'bot1'
    },
    expected: {
      hasFilters: true,
      hasPeriod: true,
      userIds: ['123'],
      botIds: ['bot1'],
      period: { date_from: '2024-01-01', date_to: '2024-01-31' }
    }
  },
  {
    name: '9. 空参数测试',
    params: { userId: '', botId: '' },
    expected: {
      hasFilters: false,
      viewingCount: '> 0'
    }
  },
  {
    name: '10. 无效日期格式测试',
    params: { date_from: 'invalid-date' },
    expected: {
      statusCode: 400,
      error: 'INVALID_DATE_FORMAT'
    }
  },
  {
    name: '11. 测试不存在的userId',
    params: { userId: '999999' },
    expected: {
      hasFilters: true,
      userIds: ['999999'],
      viewingCount: 0,
      commission: 0
    }
  },
  {
    name: '12. 测试不存在的botId',
    params: { botId: 'nonexistent' },
    expected: {
      hasFilters: true,
      botIds: ['nonexistent'],
      viewingCount: 0,
      commission: 0
    }
  },
  {
    name: '13. 测试特殊字符userId',
    params: { userId: 'test_user_001' },
    expected: {
      hasFilters: true,
      userIds: ['test_user_001']
    }
  },
  {
    name: '14. 测试特殊字符botId',
    params: { botId: 'xianyu_bot01' },
    expected: {
      hasFilters: true,
      botIds: ['xianyu_bot01']
    }
  }
];

// 构建查询字符串
function buildQueryString(params) {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value);
    }
  });
  return queryParams.toString();
}

// 发送HTTP请求
function makeRequest(params) {
  return new Promise((resolve, reject) => {
    const queryString = buildQueryString(params);
    const url = `${BASE_URL}${API_PATH}${queryString ? '?' + queryString : ''}`;
    
    console.log(`🌐 请求URL: ${url}`);
    
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            response: response
          });
        } catch (error) {
          reject(new Error(`JSON解析失败: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`请求失败: ${error.message}`));
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
  });
}

// 验证响应
function validateResponse(testCase, result) {
  const { statusCode, response } = result;
  const expected = testCase.expected;
  
  console.log(`📊 响应状态码: ${statusCode}`);
  console.log(`📄 响应数据:`, JSON.stringify(response, null, 2));
  
  // 检查状态码
  if (expected.statusCode && statusCode !== expected.statusCode) {
    return {
      passed: false,
      message: `状态码错误: 期望${expected.statusCode}，实际${statusCode}`
    };
  }
  
  // 检查错误响应
  if (expected.error) {
    if (statusCode !== 400) {
      return {
        passed: false,
        message: `期望错误响应，但状态码为${statusCode}`
      };
    }
    if (response.error !== expected.error) {
      return {
        passed: false,
        message: `错误代码错误: 期望${expected.error}，实际${response.error}`
      };
    }
    return {
      passed: true,
      message: '✅ 错误处理正确'
    };
  }
  
  // 检查成功响应
  if (statusCode !== 200) {
    return {
      passed: false,
      message: `状态码错误: 期望200，实际${statusCode}`
    };
  }
  
  if (!response.success) {
    return {
      passed: false,
      message: `请求失败: ${response.message || '未知错误'}`
    };
  }
  
  // 检查数据结构
  const requiredFields = ['viewing_count', 'completed_unpaid_count', 'completed_paid_count', 'total_commission', 'period'];
  for (const field of requiredFields) {
    if (!(field in response.data)) {
      return {
        passed: false,
        message: `缺少必需字段: ${field}`
      };
    }
  }
  
  // 检查筛选条件
  if (expected.hasFilters) {
    if (!response.data.filters) {
      return {
        passed: false,
        message: '有筛选条件但响应中缺少filters字段'
      };
    }
    
    if (expected.userIds) {
      if (!response.data.filters.userIds || !Array.isArray(response.data.filters.userIds)) {
        return {
          passed: false,
          message: 'userIds筛选条件格式错误'
        };
      }
      
      for (const userId of expected.userIds) {
        if (!response.data.filters.userIds.includes(userId)) {
          return {
            passed: false,
            message: `userIds中缺少期望的userId: ${userId}`
          };
        }
      }
    }
    
    if (expected.botIds) {
      if (!response.data.filters.botIds || !Array.isArray(response.data.filters.botIds)) {
        return {
          passed: false,
          message: 'botIds筛选条件格式错误'
        };
      }
      
      for (const botId of expected.botIds) {
        if (!response.data.filters.botIds.includes(botId)) {
          return {
            passed: false,
            message: `botIds中缺少期望的botId: ${botId}`
          };
        }
      }
    }
  } else {
    if (response.data.filters) {
      return {
        passed: false,
        message: '无筛选条件但响应中包含filters字段'
      };
    }
  }
  
  // 检查时间范围
  if (expected.hasPeriod) {
    if (!response.data.period || !response.data.period.date_from || !response.data.period.date_to) {
      return {
        passed: false,
        message: '期望时间范围但响应中缺少period字段'
      };
    }
    
    if (expected.period) {
      if (response.data.period.date_from !== expected.period.date_from || 
          response.data.period.date_to !== expected.period.date_to) {
        return {
          passed: false,
          message: `时间范围不匹配: 期望${JSON.stringify(expected.period)}，实际${JSON.stringify(response.data.period)}`
        };
      }
    }
  }
  
  // 检查数值
  if (expected.viewingCount === 0) {
    if (response.data.viewing_count !== 0) {
      return {
        passed: false,
        message: `viewing_count期望0，实际${response.data.viewing_count}`
      };
    }
  } else if (expected.viewingCount === '> 0') {
    if (response.data.viewing_count <= 0) {
      return {
        passed: false,
        message: `viewing_count期望大于0，实际${response.data.viewing_count}`
      };
    }
  }
  
  if (expected.commission === 0) {
    if (response.data.total_commission !== 0) {
      return {
        passed: false,
        message: `total_commission期望0，实际${response.data.total_commission}`
      };
    }
  } else if (expected.commission === '> 0') {
    if (response.data.total_commission <= 0) {
      return {
        passed: false,
        message: `total_commission期望大于0，实际${response.data.total_commission}`
      };
    }
  }
  
  return {
    passed: true,
    message: '✅ 测试通过'
  };
}

// 运行测试
async function runTests() {
  console.log('🚀 开始详细测试外部统计接口...\n');
  console.log('='.repeat(80));
  
  let passedCount = 0;
  let totalCount = testCases.length;
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    
    console.log(`\n📋 测试用例 ${i + 1}: ${testCase.name}`);
    console.log(`📝 期望结果:`, testCase.expected);
    console.log(`🔧 测试参数:`, testCase.params);
    
    try {
      const result = await makeRequest(testCase.params);
      const validation = validateResponse(testCase, result);
      
      if (validation.passed) {
        console.log(`✅ ${validation.message}`);
        passedCount++;
      } else {
        console.log(`❌ ${validation.message}`);
      }
      
    } catch (error) {
      console.log(`❌ 测试失败: ${error.message}`);
    }
    
    console.log('-'.repeat(80));
  }
  
  // 测试总结
  console.log('\n📊 测试总结');
  console.log('='.repeat(80));
  console.log(`总测试用例: ${totalCount}`);
  console.log(`通过: ${passedCount}`);
  console.log(`失败: ${totalCount - passedCount}`);
  console.log(`通过率: ${((passedCount / totalCount) * 100).toFixed(1)}%`);
  
  if (passedCount === totalCount) {
    console.log('\n🎉 所有测试用例通过！');
  } else {
    console.log('\n⚠️  部分测试用例失败，请检查接口实现。');
  }
  
  // 显示测试数据统计
  console.log('\n📈 测试数据统计:');
  try {
    const result = await makeRequest({});
    if (result.statusCode === 200 && result.response.success) {
      const data = result.response.data;
      console.log(`👥 客户总数: ${data.completed_unpaid_count + data.completed_paid_count}`);
      console.log(`💰 已成交未结佣: ${data.completed_unpaid_count}`);
      console.log(`✅ 已成交已结佣: ${data.completed_paid_count}`);
      console.log(`👁️ 带看记录数: ${data.viewing_count}`);
      console.log(`💵 总佣金: ${data.total_commission}`);
    }
  } catch (error) {
    console.log('无法获取测试数据统计');
  }
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 启动测试
if (require.main === module) {
  runTests().catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  testCases,
  makeRequest,
  validateResponse,
  runTests
}; 