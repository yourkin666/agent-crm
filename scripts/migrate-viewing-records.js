const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '../data/crm.db');
const db = new sqlite3.Database(dbPath);

console.log('开始迁移带看记录表...');

// 迁移脚本
db.serialize(() => {
  // 1. 检查新字段是否已存在
  db.all("PRAGMA table_info(viewing_records)", (err, columns) => {
    if (err) {
      console.error('检查表结构失败:', err);
      return;
    }

    const columnNames = columns.map(col => col.name);
    console.log('当前字段:', columnNames);

    // 需要添加的新字段
    const newColumns = [
      { name: 'viewing_time', type: 'DATETIME', defaultValue: null },
      { name: 'property_name', type: 'TEXT', defaultValue: "'未知楼盘'" },
      { name: 'property_address', type: 'TEXT', defaultValue: null }
    ];

    // 添加缺失的字段
    newColumns.forEach(column => {
      if (!columnNames.includes(column.name)) {
        const defaultClause = column.defaultValue ? ` DEFAULT ${column.defaultValue}` : '';
        const sql = `ALTER TABLE viewing_records ADD COLUMN ${column.name} ${column.type}${defaultClause}`;
        
        db.run(sql, (err) => {
          if (err) {
            console.error(`添加字段 ${column.name} 失败:`, err);
          } else {
            console.log(`成功添加字段: ${column.name}`);
          }
        });
      } else {
        console.log(`字段 ${column.name} 已存在`);
      }
    });

    // 更新现有记录的 viewing_time 字段（如果为空）
    setTimeout(() => {
      db.run(`
        UPDATE viewing_records 
        SET viewing_time = created_at 
        WHERE viewing_time IS NULL OR viewing_time = ''
      `, (err) => {
        if (err) {
          console.error('更新viewing_time失败:', err);
        } else {
          console.log('已更新现有记录的viewing_time字段');
        }
      });

      // 更新现有记录的 property_name 字段（如果为空）
      db.run(`
        UPDATE viewing_records 
        SET property_name = '历史带看记录'
        WHERE property_name IS NULL OR property_name = ''
      `, (err) => {
        if (err) {
          console.error('更新property_name失败:', err);
        } else {
          console.log('已更新现有记录的property_name字段');
        }

        console.log('带看记录表迁移完成！');
        db.close();
      });
    }, 1000);
  });
});