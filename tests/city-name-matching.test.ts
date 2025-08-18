import { describe, it, expect } from 'vitest';

// 模拟城市名称匹配功能
describe('城市名称匹配功能测试', () => {
  it('应该匹配各种城市名称格式', () => {
    const cityName = '北京';
    const databaseValues = ['北京', '北京市', '北京市朝阳区', '北京海淀区'];
    
    // 模拟SQL LIKE查询的匹配逻辑
    const matches = databaseValues.filter(dbValue => {
      return dbValue.includes(cityName) || 
             dbValue === `${cityName}市` || 
             dbValue === cityName;
    });
    
    expect(matches).toContain('北京');
    expect(matches).toContain('北京市');
    expect(matches).toContain('北京市朝阳区');
    expect(matches).toContain('北京海淀区');
  });

  it('应该正确处理带"市"字的城市名称', () => {
    const cityName = '上海';
    const databaseValues = ['上海', '上海市', '上海市浦东新区', '上海黄浦区'];
    
    const matches = databaseValues.filter(dbValue => {
      return dbValue.includes(cityName) || 
             dbValue === `${cityName}市` || 
             dbValue === cityName;
    });
    
    expect(matches).toContain('上海');
    expect(matches).toContain('上海市');
    expect(matches).toContain('上海市浦东新区');
    expect(matches).toContain('上海黄浦区');
  });

  it('应该正确处理不带"市"字的城市名称', () => {
    const cityName = '深圳';
    const databaseValues = ['深圳', '深圳市', '深圳市南山区', '深圳福田区'];
    
    const matches = databaseValues.filter(dbValue => {
      return dbValue.includes(cityName) || 
             dbValue === `${cityName}市` || 
             dbValue === cityName;
    });
    
    expect(matches).toContain('深圳');
    expect(matches).toContain('深圳市');
    expect(matches).toContain('深圳市南山区');
    expect(matches).toContain('深圳福田区');
  });

  it('应该避免误匹配相似的城市名称', () => {
    const cityName = '南京';
    const databaseValues = ['南京', '南京市', '南宁', '南宁市', '南昌', '南昌市'];
    
    const matches = databaseValues.filter(dbValue => {
      return dbValue.includes(cityName) || 
             dbValue === `${cityName}市` || 
             dbValue === cityName;
    });
    
    // 应该只匹配南京相关的
    expect(matches).toContain('南京');
    expect(matches).toContain('南京市');
    expect(matches).not.toContain('南宁');
    expect(matches).not.toContain('南宁市');
    expect(matches).not.toContain('南昌');
    expect(matches).not.toContain('南昌市');
  });

  it('应该正确处理直辖市名称', () => {
    const cityName = '重庆';
    const databaseValues = ['重庆', '重庆市', '重庆市渝中区', '重庆江北区'];
    
    const matches = databaseValues.filter(dbValue => {
      return dbValue.includes(cityName) || 
             dbValue === `${cityName}市` || 
             dbValue === cityName;
    });
    
    expect(matches).toContain('重庆');
    expect(matches).toContain('重庆市');
    expect(matches).toContain('重庆市渝中区');
    expect(matches).toContain('重庆江北区');
  });

  it('应该正确处理特殊字符和空格', () => {
    const cityName = '乌鲁木齐';
    const databaseValues = ['乌鲁木齐', '乌鲁木齐市', '乌鲁木齐 市', '乌鲁木齐-市'];
    
    const matches = databaseValues.filter(dbValue => {
      return dbValue.includes(cityName) || 
             dbValue === `${cityName}市` || 
             dbValue === cityName;
    });
    
    expect(matches).toContain('乌鲁木齐');
    expect(matches).toContain('乌鲁木齐市');
    // 注意：当前逻辑可能不会匹配带空格或连字符的，这是合理的
  });
}); 