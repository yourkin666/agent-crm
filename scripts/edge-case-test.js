#!/usr/bin/env node

/**
 * 边界情况测试脚本
 * 测试外部统计接口的边界情况和异常处理
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const API_PATH = '/api/external/statistics';

// 边界情况测试用例
const edgeCases = [
  {
    name: '1. 测试大量userId参数',
    params: { userId: '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20' },
    expected: { statusCode: 200, hasFilters: true }
  },
  {
    name: '2. 测试大量botId参数',
    params: { botId: 'bot1,bot2,bot3,bot4,bot5,bot6,bot7,bot8,bot9,bot10' },
    expected: { statusCode: 200, hasFilters: true }
  },
  {
    name: '3. 测试空字符串参数',
    params: { userId: '   ', botId: '   ' },
    expected: { statusCode: 200, hasFilters: false }
  },
  {
    name: '4. 测试重复的userId',
    params: { userId: '123,123,456,456' },
    expected: { statusCode: 200, hasFilters: true }
  },
  {
    name: '5. 测试重复的botId',
    params: { botId: 'bot1,bot1,bot2,bot2' },
    expected: { statusCode: 200, hasFilters: true }
  },
  {
    name: '6. 测试特殊字符在参数中',
    params: { userId: 'user@123,user#456', botId: 'bot-1,bot_2' },
    expected: { statusCode: 200, hasFilters: true }
  },
  {
    name: '7. 测试中文字符',
    params: { userId: '用户123,用户456', botId: '机器人1,机器人2' },
    expected: { statusCode: 200, hasFilters: true }
  },
  {
    name: '8. 测试超长参数',
    params: { userId: 'a'.repeat(1000) },
    expected: { statusCode: 200, hasFilters: true }
  },
  {
    name: '9. 测试SQL注入尝试',
    params: { userId: "'; DROP TABLE users; --" },
    expected: { statusCode: 200, hasFilters: true }
  },
  {
    name: '10. 测试XSS尝试',
    params: { userId: '<script>alert("xss")</script>' },
    expected: { statusCode: 200, hasFilters: true }
  },
  {
    name: '11. 测试日期边界值',
    params: { date_from: '1900-01-01', date_to: '2100-12-31' },
    expected: { statusCode: 200, hasPeriod: true }
  },
  {
    name: '12. 测试无效日期范围',
    params: { date_from: '2024-12-31', date_to: '2024-01-01' },
    expected: { statusCode: 200, hasPeriod: true }
  },
  {
    name: '13. 测试所有参数组合',
    params: { 
      userId: '123,456,789',
      botId: 'bot1,bot2,bot3',
      date_from: '2024-01-01',
      date_to: '2024-12-31'
    },
    expected: { statusCode: 200, hasFilters: true, hasPeriod: true }
  },
  {
    name: '14. 测试URL编码字符',
    params: { userId: 'user%20123,user%20456' },
    expected: { statusCode: 200, hasFilters: true }
  },
  {
    name: '15. 测试数字和字符串混合',
    params: { userId: '123,abc,456,def' },
    expected: { statusCode: 200, hasFilters: true }
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
            response: response,
            url: url
          });
        } catch (error) {
          reject(new Error(`JSON解析失败: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`请求失败: ${error.message}`));
    });
    
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
  });
}

// 验证响应
function validateEdgeCase(testCase, result) {
  const { statusCode, response } = result;
  const expected = testCase.expected;
  
  console.log(`📊 响应状态码: ${statusCode}`);
  
  // 检查状态码
  if (expected.statusCode && statusCode !== expected.statusCode) {
    return {
      passed: false,
      message: `状态码错误: 期望${expected.statusCode}，实际${statusCode}`
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
        message: '期望有筛选条件但响应中缺少filters字段'
      };
    }
  } else {
    if (response.data.filters) {
      return {
        passed: false,
        message: '期望无筛选条件但响应中包含filters字段'
      };
    }
  }
  
  // 检查时间范围
  if (expected.hasPeriod) {
    if (!response.data.period || !response.data.period.date_from || !response.data.period.date_to) {
      return {
        passed: false,
        message: '期望有时间范围但响应中缺少period字段'
      };
    }
  }
  
  // 检查数值类型
  if (typeof response.data.viewing_count !== 'number') {
    return {
      passed: false,
      message: `viewing_count类型错误: 期望number，实际${typeof response.data.viewing_count}`
    };
  }
  
  if (typeof response.data.total_commission !== 'number') {
    return {
      passed: false,
      message: `total_commission类型错误: 期望number，实际${typeof response.data.total_commission}`
    };
  }
  
  return {
    passed: true,
    message: '✅ 边界情况测试通过'
  };
}

// 运行边界情况测试
async function runEdgeCaseTests() {
  console.log('🚀 开始边界情况测试...\n');
  console.log('='.repeat(80));
  
  let passedCount = 0;
  let totalCount = edgeCases.length;
  
  for (let i = 0; i < edgeCases.length; i++) {
    const testCase = edgeCases[i];
    
    console.log(`\n📋 边界测试 ${i + 1}: ${testCase.name}`);
    console.log(`🔧 测试参数:`, testCase.params);
    
    try {
      const result = await makeRequest(testCase.params);
      const validation = validateEdgeCase(testCase, result);
      
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
  console.log('\n📊 边界情况测试总结');
  console.log('='.repeat(80));
  console.log(`总测试用例: ${totalCount}`);
  console.log(`通过: ${passedCount}`);
  console.log(`失败: ${totalCount - passedCount}`);
  console.log(`通过率: ${((passedCount / totalCount) * 100).toFixed(1)}%`);
  
  if (passedCount === totalCount) {
    console.log('\n🎉 所有边界情况测试通过！');
  } else {
    console.log('\n⚠️  部分边界情况测试失败，请检查接口实现。');
  }
}

// 性能测试
async function performanceTest() {
  console.log('\n🚀 开始性能测试...\n');
  
  const testParams = [
    { userId: '123' },
    { botId: 'bot1' },
    { userId: '123,456,789', botId: 'bot1,bot2,bot3' },
    { date_from: '2024-01-01', date_to: '2024-12-31' },
    { userId: '123', botId: 'bot1', date_from: '2024-01-01', date_to: '2024-12-31' }
  ];
  
  const results = [];
  
  for (let i = 0; i < testParams.length; i++) {
    const params = testParams[i];
    console.log(`📊 性能测试 ${i + 1}:`, params);
    
    const startTime = Date.now();
    try {
      const result = await makeRequest(params);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      results.push({
        params,
        duration,
        statusCode: result.statusCode,
        success: result.response.success
      });
      
      console.log(`⏱️  响应时间: ${duration}ms`);
      console.log(`📊 状态码: ${result.statusCode}`);
      console.log(`✅ 成功: ${result.response.success}`);
      
    } catch (error) {
      console.log(`❌ 性能测试失败: ${error.message}`);
    }
    
    console.log('-'.repeat(40));
  }
  
  // 性能统计
  const successfulResults = results.filter(r => r.success);
  if (successfulResults.length > 0) {
    const avgDuration = successfulResults.reduce((sum, r) => sum + r.duration, 0) / successfulResults.length;
    const minDuration = Math.min(...successfulResults.map(r => r.duration));
    const maxDuration = Math.max(...successfulResults.map(r => r.duration));
    
    console.log('\n📈 性能统计:');
    console.log(`平均响应时间: ${avgDuration.toFixed(2)}ms`);
    console.log(`最短响应时间: ${minDuration}ms`);
    console.log(`最长响应时间: ${maxDuration}ms`);
    console.log(`成功请求数: ${successfulResults.length}/${results.length}`);
  }
}

// 主函数
async function main() {
  try {
    await runEdgeCaseTests();
    await performanceTest();
  } catch (error) {
    console.error('测试运行失败:', error);
  }
}

// 启动测试
if (require.main === module) {
  main().catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  edgeCases,
  makeRequest,
  validateEdgeCase,
  runEdgeCaseTests,
  performanceTest
}; 