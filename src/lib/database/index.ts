import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { createModuleLogger, logDatabaseOperation } from "../logger";

// 全局数据库连接池和初始化状态
let pool: mysql.Pool | null = null;
let isInitialized: boolean = false;

// 数据库模块日志记录器
const dbLogger = createModuleLogger("database");

export async function getDatabase(): Promise<mysql.Pool> {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
    });

    // 只初始化一次数据库表结构
    if (!isInitialized) {
      await initializeDatabase();
      isInitialized = true;
    }
  }
  return pool;
}

// 初始化数据库表结构
async function initializeDatabase() {
  if (!pool) return;

  // 既然远程数据库已经有现有表结构，我们只需要验证连接
  const connection = await pool.getConnection();
  try {
    // 简单的连接验证
    await connection.ping();
    dbLogger.info("数据库连接验证成功");
    
    // 可选：验证关键表是否存在
    try {
      const [tables] = await connection.query("SHOW TABLES");
      dbLogger.info(`发现 ${tables.length} 个数据表`);
    } catch (error) {
      dbLogger.warn("无法查看表列表，但连接正常", error);
    }
    
  } catch (error) {
    dbLogger.error("数据库连接验证失败", error);
    throw error;
  } finally {
    connection.release();
  }

  dbLogger.info("数据库初始化完成（跳过表创建，使用现有表结构）");
}

// 关闭数据库连接
export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
    isInitialized = false; // 重置初始化状态
  }
}

// 数据库操作工具函数
export class DatabaseManager {
  private pool: mysql.Pool | null = null;

  async init(): Promise<void> {
    this.pool = await getDatabase();
  }

  private async ensureDb(): Promise<mysql.Pool> {
    if (!this.pool) {
      await this.init();
    }
    return this.pool!;
  }

  // 执行查询并返回所有结果
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const startTime = Date.now();
    try {
      const db = await this.ensureDb();
      const [rows] = await db.query(sql, params);
      const duration = Date.now() - startTime;
      logDatabaseOperation("query", undefined, duration);
      return rows as T[];
    } catch (error) {
      const duration = Date.now() - startTime;
      logDatabaseOperation("query", undefined, duration, error as Error);
      throw error;
    }
  }

  // 执行查询并返回第一个结果
  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const startTime = Date.now();
    try {
      const db = await this.ensureDb();
      const [rows] = await db.query(sql, params);
      const duration = Date.now() - startTime;
      logDatabaseOperation("queryOne", undefined, duration);
      return (rows as T[])[0] || null;
    } catch (error) {
      const duration = Date.now() - startTime;
      logDatabaseOperation("queryOne", undefined, duration, error as Error);
      throw error;
    }
  }

  // 执行插入/更新/删除操作
  async execute(
    sql: string,
    params: any[] = []
  ): Promise<{ changes: number; lastInsertRowid: number }> {
    const startTime = Date.now();
    try {
      const db = await this.ensureDb();
      const [result] = (await db.execute(sql, params)) as mysql.OkPacket[];
      const duration = Date.now() - startTime;
      logDatabaseOperation("execute", undefined, duration);
      return {
        changes: result.affectedRows || 0,
        lastInsertRowid: result.insertId || 0,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logDatabaseOperation("execute", undefined, duration, error as Error);
      throw error;
    }
  }

  // 批量执行操作（事务）
  async transaction<T>(
    callback: (dbManager: DatabaseManager) => Promise<T>
  ): Promise<T> {
    const db = await this.ensureDb();
    const connection = await db.getConnection();
    await connection.beginTransaction();

    // 创建一个临时的数据库管理器，使用同一个连接
    const transactionDbManager = new DatabaseManager();
    (transactionDbManager as any).pool = {
      getConnection: () => Promise.resolve(connection),
      query: (sql: string, params: any[]) => connection.query(sql, params),
      execute: (sql: string, params: any[]) => connection.execute(sql, params),
    };

    try {
      const result = await callback(transactionDbManager);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 分页查询助手
  async queryWithPagination<T = any>(
    baseQuery: string,
    countQuery: string,
    params: any[] = [],
    page: number = 1,
    pageSize: number = 6
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * pageSize;

    // 获取总数
    const totalResult = await this.queryOne<{ count: number }>(
      countQuery,
      params
    );
    const total = totalResult?.count || 0;

    // 获取分页数据
    const dataQuery = `${baseQuery} LIMIT ? OFFSET ?`;
    const data = await this.query<T>(dataQuery, [...params, pageSize, offset]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 检查连接状态
  async healthCheck(): Promise<boolean> {
    try {
      const db = await this.ensureDb();
      const connection = await db.getConnection();
      await connection.ping();
      connection.release();
      dbLogger.debug("数据库健康检查通过");
      return true;
    } catch (error) {
      dbLogger.error(
        { error: error instanceof Error ? error.message : error },
        "数据库健康检查失败"
      );
      return false;
    }
  }
}

// 导出单例实例
export const dbManager = new DatabaseManager(); 