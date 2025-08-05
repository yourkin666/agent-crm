const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/crm.db');

async function migrateCustomerFields() {
  const db = new sqlite3.Database(dbPath);
  
  console.log('开始迁移客户字段...');
  
  try {
    // 添加新的价格字段
    await new Promise((resolve, reject) => {
      db.run(`
        ALTER TABLE customers 
        ADD COLUMN price_min INTEGER DEFAULT NULL
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    
    await new Promise((resolve, reject) => {
      db.run(`
        ALTER TABLE customers 
        ADD COLUMN price_max INTEGER DEFAULT NULL
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    console.log('已添加 price_min 和 price_max 字段');

    // 迁移现有的 price_range 数据到新字段
    await new Promise((resolve, reject) => {
      db.all(`SELECT id, price_range FROM customers WHERE price_range IS NOT NULL AND price_range != ''`, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        const updates = [];
        rows.forEach(row => {
          if (row.price_range) {
            // 解析 "5000-7000" 格式
            const match = row.price_range.match(/(\d+)-(\d+)/);
            if (match) {
              const minPrice = parseInt(match[1]);
              const maxPrice = parseInt(match[2]);
              updates.push({ id: row.id, min: minPrice, max: maxPrice });
            }
          }
        });
        
        // 批量更新
        let completed = 0;
        if (updates.length === 0) {
          resolve();
          return;
        }
        
        updates.forEach(update => {
          db.run(`UPDATE customers SET price_min = ?, price_max = ? WHERE id = ?`, 
            [update.min, update.max, update.id], (err) => {
              if (err) {
                reject(err);
                return;
              }
              completed++;
              if (completed === updates.length) {
                resolve();
              }
            });
        });
      });
    });

    console.log('已迁移现有价格范围数据');

    // 迁移单个业务类型到数组格式
    await new Promise((resolve, reject) => {
      db.all(`SELECT id, business_type FROM customers WHERE business_type IS NOT NULL`, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        let completed = 0;
        if (rows.length === 0) {
          resolve();
          return;
        }
        
        rows.forEach(row => {
          if (row.business_type && !row.business_type.startsWith('[')) {
            // 将单个值转换为数组格式
            const arrayValue = JSON.stringify([row.business_type]);
            db.run(`UPDATE customers SET business_type = ? WHERE id = ?`, 
              [arrayValue, row.id], (err) => {
                if (err) {
                  reject(err);
                  return;
                }
                completed++;
                if (completed === rows.length) {
                  resolve();
                }
              });
          } else {
            completed++;
            if (completed === rows.length) {
              resolve();
            }
          }
        });
      });
    });

    console.log('已迁移业务类型数据格式');

    // 迁移单个户型需求到数组格式
    await new Promise((resolve, reject) => {
      db.all(`SELECT id, room_type FROM customers WHERE room_type IS NOT NULL`, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        let completed = 0;
        if (rows.length === 0) {
          resolve();
          return;
        }
        
        rows.forEach(row => {
          if (row.room_type && !row.room_type.startsWith('[')) {
            // 将单个值转换为数组格式
            const arrayValue = JSON.stringify([row.room_type]);
            db.run(`UPDATE customers SET room_type = ? WHERE id = ?`, 
              [arrayValue, row.id], (err) => {
                if (err) {
                  reject(err);
                  return;
                }
                completed++;
                if (completed === rows.length) {
                  resolve();
                }
              });
          } else {
            completed++;
            if (completed === rows.length) {
              resolve();
            }
          }
        });
      });
    });

    console.log('已迁移户型需求数据格式');
    console.log('客户字段迁移完成！');
    
  } catch (error) {
    console.error('迁移失败:', error);
    throw error;
  } finally {
    db.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateCustomerFields()
    .then(() => {
      console.log('迁移成功完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('迁移失败:', error);
      process.exit(1);
    });
}

module.exports = { migrateCustomerFields }; 