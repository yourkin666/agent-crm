#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 需要修复的文件列表
const filesToFix = [
  'src/components/customers/AddCustomerModal.tsx',
  'src/components/customers/AddViewingModal.tsx',
  'src/components/customers/AdvancedFilterModal.tsx',
  'src/components/viewing-records/EditViewingModal.tsx'
];

// 修复函数
function fixDeprecatedAPIs(filePath) {
  console.log(`🔧 修复文件: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // 修复 Option 组件的导入
  if (content.includes('const { Option } = Select;')) {
    content = content.replace('const { Option } = Select;', '');
    modified = true;
    console.log('  ✅ 移除了废弃的 Option 导入');
  }
  
  // 修复 Option 组件的使用
  const optionRegex = /<Option\s+([^>]*)>/g;
  let match;
  while ((match = optionRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const attributes = match[1];
    
    // 将 <Option> 替换为对象形式
    const newOption = `{ label: '${getOptionLabel(content, match.index)}', value: ${getOptionValue(attributes)} }`;
    
    // 这里需要更复杂的逻辑来处理 Select 的 options 属性
    // 暂时跳过，因为需要重构整个 Select 组件的使用方式
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ 文件已更新`);
  } else {
    console.log(`  ℹ️  无需修改`);
  }
}

// 获取 Option 的标签文本（简化版本）
function getOptionLabel(content, index) {
  // 这是一个简化的实现，实际需要更复杂的解析
  const endTagIndex = content.indexOf('</Option>', index);
  if (endTagIndex !== -1) {
    return content.substring(index, endTagIndex).replace(/<Option[^>]*>/, '').trim();
  }
  return '';
}

// 获取 Option 的 value 属性（简化版本）
function getOptionValue(attributes) {
  const valueMatch = attributes.match(/value=["']([^"']+)["']/);
  return valueMatch ? valueMatch[1] : '""';
}

// 主函数
function main() {
  console.log('🚀 开始修复 Ant Design 废弃的 API...\n');
  
  filesToFix.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      fixDeprecatedAPIs(filePath);
    } else {
      console.log(`❌ 文件不存在: ${filePath}`);
    }
  });
  
  console.log('\n✅ 修复完成！');
  console.log('\n📝 注意事项:');
  console.log('- Option 组件的修复需要手动重构 Select 组件的使用方式');
  console.log('- 建议使用 options 属性传递选项数组');
  console.log('- 格式: options={[{ label: "选项1", value: "value1" }]}');
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { fixDeprecatedAPIs }; 