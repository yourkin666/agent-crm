#!/usr/bin/env node

/**
 * 外部统计接口测试脚本
 * 测试新增的 userId 和 botId 参数功能
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const API_PATH = '/api/external/statistics';

// 测试用例配置
const testCases = [
  {
    name: '1. 无参数查询（保持原有行为）',
    params: {},
    expected: '返回所有数据的统计'
  },
  {
    name: '2. 单个userId查询',
    params: { userId: '123' },
    expected: '返回userId为123的客户统计数据'
  },
  {
    name: '3. 批量userId查询',
    params: { userId: '123,456,789' },
    expected: '返回userId为123,456,789的客户统计数据'
  },
  {
    name: '4. 单个botId查询',
    params: { botId: 'bot1' },
    expected: '返回botId为bot1的客户统计数据'
  },
  {
    name: '5. 批量botId查询',
    params: { botId: 'bot1,bot2,bot3' },
    expected: '返回botId为bot1,bot2,bot3的客户统计数据'
  },
  {
    name: '6. 交集查询（userId + botId）',
    params: { userId: '123,456', botId: 'bot1,bot2' },
    expected: '返回同时满足userId和botId条件的客户统计数据'
  },
  {
    name: '7. 时间范围查询',
    params: { date_from: '2024-01-01', date_to: '2024-01-31' },
    expected: '返回指定时间范围内的统计数据'
  },
  {
    name: '8. 组合查询（时间+客户筛选）',
    params: { 
      date_from: '2024-01-01', 
      date_to: '2024-01-31',
      userId: '123',
      botId: 'bot1'
    },
    expected: '返回指定时间范围和客户筛选条件下的统计数据'
  },
  {
    name: '9. 空参数测试',
    params: { userId: '', botId: '' },
    expected: '应该返回所有数据的统计（空参数被忽略）'
  },
  {
    name: '10. 无效日期格式测试',
    params: { date_from: 'invalid-date' },
    expected: '应该返回日期格式错误'
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
    
    console.log(`\n🌐 请求URL: ${url}`);
    
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
  
  console.log(`📊 响应状态码: ${statusCode}`);
  console.log(`📄 响应数据:`, JSON.stringify(response, null, 2));
  
  // 基本验证
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
  
  // 数据结构验证
  const requiredFields = ['viewing_count', 'completed_unpaid_count', 'completed_paid_count', 'total_commission', 'period'];
  for (const field of requiredFields) {
    if (!(field in response.data)) {
      return {
        passed: false,
        message: `缺少必需字段: ${field}`
      };
    }
  }
  
  // 筛选条件验证
  const hasUserFilter = testCase.params.userId && testCase.params.userId !== '';
  const hasBotFilter = testCase.params.botId && testCase.params.botId !== '';
  
  if (hasUserFilter || hasBotFilter) {
    if (!response.data.filters) {
      return {
        passed: false,
        message: '有筛选条件但响应中缺少filters字段'
      };
    }
    
    if (hasUserFilter && (!response.data.filters.userIds || !Array.isArray(response.data.filters.userIds))) {
      return {
        passed: false,
        message: 'userIds筛选条件格式错误'
      };
    }
    
    if (hasBotFilter && (!response.data.filters.botIds || !Array.isArray(response.data.filters.botIds))) {
      return {
        passed: false,
        message: 'botIds筛选条件格式错误'
      };
    }
  }
  
  // 数值类型验证
  const numericFields = ['viewing_count', 'completed_unpaid_count', 'completed_paid_count', 'total_commission'];
  for (const field of numericFields) {
    if (typeof response.data[field] !== 'number') {
      return {
        passed: false,
        message: `字段${field}类型错误: 期望number，实际${typeof response.data[field]}`
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
  console.log('🚀 开始测试外部统计接口...\n');
  console.log('=' * 60);
  
  let passedCount = 0;
  let totalCount = testCases.length;
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    
    console.log(`\n📋 测试用例 ${i + 1}: ${testCase.name}`);
    console.log(`📝 期望结果: ${testCase.expected}`);
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
    
    console.log('-'.repeat(60));
  }
  
  // 测试总结
  console.log('\n📊 测试总结');
  console.log('=' * 60);
  console.log(`总测试用例: ${totalCount}`);
  console.log(`通过: ${passedCount}`);
  console.log(`失败: ${totalCount - passedCount}`);
  console.log(`通过率: ${((passedCount / totalCount) * 100).toFixed(1)}%`);
  
  if (passedCount === totalCount) {
    console.log('\n🎉 所有测试用例通过！');
  } else {
    console.log('\n⚠️  部分测试用例失败，请检查接口实现。');
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