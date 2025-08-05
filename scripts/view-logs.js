#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');

function getLogFiles() {
  if (!fs.existsSync(logsDir)) {
    console.log('❌ 日志目录不存在');
    return [];
  }
  return fs.readdirSync(logsDir)
    .filter(file => file.endsWith('.log'))
    .sort((a, b) => b.localeCompare(a));
}

function formatJsonLog(line) {
  try {
    const log = JSON.parse(line);
    const time = new Date(log.time).toLocaleString('zh-CN');
    const level = log.level === 30 ? 'INFO' : 
                  log.level === 40 ? 'WARN' : 
                  log.level === 50 ? 'ERROR' : 
                  log.level === 20 ? 'DEBUG' : 'LOG';
    const module = log.module ? `[${log.module}] ` : '';
    const business = log.business ? `[${log.business}:${log.action}] ` : '';
    
    return `[${time}] ${level}: ${module}${business}${log.msg}`;
  } catch (e) {
    return line;
  }
}

function showHelp() {
  console.log(`
📋 日志查看工具

用法:
  node scripts/view-logs.js [选项]

选项:
  list              显示所有日志文件
  tail [文件名]      显示最新日志 (默认最新的app日志)
  tail [文件名] -n N 显示最后N行日志
  follow [文件名]    实时跟踪日志文件
  error             显示错误日志
  help              显示此帮助信息

示例:
  node scripts/view-logs.js list
  node scripts/view-logs.js tail
  node scripts/view-logs.js tail app-2025-08-05.log -n 50
  node scripts/view-logs.js error
  `);
}

function listLogs() {
  const files = getLogFiles();
  if (files.length === 0) {
    console.log('📝 暂无日志文件');
    return;
  }

  console.log('\n📋 日志文件列表:');
  files.forEach(file => {
    const filePath = path.join(logsDir, file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024).toFixed(1);
    const modified = stats.mtime.toLocaleString('zh-CN');
    console.log(`  📄 ${file} (${size}KB, 修改于: ${modified})`);
  });
  console.log('');
}

function tailLog(filename, lines = 20) {
  const files = getLogFiles();
  
  if (!filename) {
    // 默认选择最新的app日志
    filename = files.find(f => f.includes('app-')) || files[0];
  }
  
  if (!filename) {
    console.log('❌ 没有找到日志文件');
    return;
  }

  const filePath = path.join(logsDir, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ 日志文件不存在: ${filename}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const allLines = content.split('\n').filter(line => line.trim());
  const tailLines = allLines.slice(-lines);

  console.log(`\n📖 ${filename} (最后 ${tailLines.length} 行):`);
  console.log('=' .repeat(80));
  
  tailLines.forEach(line => {
    console.log(formatJsonLog(line));
  });
  console.log('=' .repeat(80));
}

function showErrors() {
  const files = getLogFiles();
  const errorFile = files.find(f => f.includes('error-'));
  
  if (!errorFile) {
    console.log('📝 暂无错误日志文件');
    return;
  }

  const filePath = path.join(logsDir, errorFile);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    console.log('✅ 暂无错误日志');
    return;
  }

  console.log(`\n🚨 错误日志 (${errorFile}):`);
  console.log('=' .repeat(80));
  
  lines.forEach(line => {
    console.log(formatJsonLog(line));
  });
  console.log('=' .repeat(80));
}

// 主程序
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'list':
    listLogs();
    break;
    
  case 'tail':
    let filename = args[1];
    let lines = 20;
    
    // 查找 -n 参数
    const nIndex = args.indexOf('-n');
    if (nIndex !== -1 && args[nIndex + 1]) {
      lines = parseInt(args[nIndex + 1]) || 20;
      // 如果 -n 在第一个位置，说明没有指定文件名
      if (nIndex === 1) {
        filename = undefined;
      }
    }
    
    tailLog(filename, lines);
    break;
    
  case 'error':
    showErrors();
    break;
    
  case 'help':
    showHelp();
    break;
    
  default:
    if (!command) {
      showHelp();
    } else {
      console.log(`❌ 未知命令: ${command}`);
      showHelp();
    }
    break;
} 