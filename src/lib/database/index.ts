import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import fs from 'fs';
import path from 'path';

// 数据库文件路径
const DB_PATH = path.join(process.cwd(), 'data', 'crm.db');

// 确保数据目录存在
const DATA_DIR = path.dirname(DB_PATH);
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 创建数据库连接
let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (!db) {
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });
    
    // 启用外键约束
    await db.exec('PRAGMA foreign_keys = ON');
    
    // 初始化数据库表
    await initializeDatabase();
  }
  return db;
}

// 初始化数据库表结构
async function initializeDatabase() {
  if (!db) return;
  
  const schemaPath = path.join(process.cwd(), 'src', 'lib', 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // 执行 SQL 语句创建表
  await db.exec(schema);
  
  console.log('数据库初始化完成');
}

// 关闭数据库连接
export async function closeDatabase() {
  if (db) {
    await db.close();
    db = null;
  }
}

// 数据库操作工具函数
export class DatabaseManager {
  private db: Database | null = null;

  async init(): Promise<void> {
    this.db = await getDatabase();
  }

  private async ensureDb(): Promise<Database> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // 执行查询并返回所有结果
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      const db = await this.ensureDb();
      return await db.all(sql, params) as T[];
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // 执行查询并返回第一个结果
  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    try {
      const db = await this.ensureDb();
      const result = await db.get(sql, params) as T | undefined;
      return result || null;
    } catch (error) {
      console.error('Database queryOne error:', error);
      throw error;
    }
  }

  // 执行插入/更新/删除操作
  async execute(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid: number }> {
    try {
      const db = await this.ensureDb();
      const result = await db.run(sql, params);
      return {
        changes: result.changes || 0,
        lastInsertRowid: result.lastID || 0
      };
    } catch (error) {
      console.error('Database execute error:', error);
      throw error;
    }
  }

  // 批量执行操作（事务）
  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    const db = await this.ensureDb();
    await db.exec('BEGIN TRANSACTION');
    try {
      const result = await callback();
      await db.exec('COMMIT');
      return result;
    } catch (error) {
      await db.exec('ROLLBACK');
      throw error;
    }
  }

  // 分页查询助手
  async queryWithPagination<T = any>(
    baseQuery: string,
    countQuery: string,
    params: any[] = [],
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ data: T[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const offset = (page - 1) * pageSize;
    
    // 获取总数
    const totalResult = await this.queryOne<{ count: number }>(countQuery, params);
    const total = totalResult?.count || 0;
    
    // 获取分页数据
    const dataQuery = `${baseQuery} LIMIT ? OFFSET ?`;
    const data = await this.query<T>(dataQuery, [...params, pageSize, offset]);
    
    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }
}

// 导出单例实例
export const dbManager = new DatabaseManager(); 