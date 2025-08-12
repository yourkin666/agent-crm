import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { Writable } from 'stream';
import { NextRequest } from 'next/server';
import { ErrorWithStatusCode } from '../types';

/**
 * 日志级别配置
 */
export const LOG_LEVELS = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
} as const;

/**
 * 日志级别中文标签映射
 */
export const LOG_LEVEL_LABELS: Record<number, string> = {
  60: '严重错误',
  50: '错误',
  40: '警告', 
  30: '信息',
  20: '调试',
  10: '跟踪',
};

/**
 * 获取当前环境的日志级别
 */
function getLogLevel(): keyof typeof LOG_LEVELS {
  const env = process.env.NODE_ENV;
  const logLevel = process.env.LOG_LEVEL;

  // 如果明确设置了 LOG_LEVEL 环境变量，使用该值
  if (logLevel && logLevel in LOG_LEVELS) {
    return logLevel as keyof typeof LOG_LEVELS;
  }

  // 根据环境自动选择日志级别
  switch (env) {
    case 'production':
      return 'info';
    case 'test':
      return 'warn';
    case 'development':
    default:
      return 'debug';
  }
}

/**
 * 获取中文格式的时间戳字符串
 */
export function getChineseTimestamp(date?: Date): string {
  const now = date || new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  
  return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

/**
 * 简单日志文件写入与按天滚动
 */
const LOGS_DIR = path.join(process.cwd(), 'logs');

function ensureLogsDirExists(): void {
  try {
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
  } catch {
    // 忽略目录创建错误，避免影响请求
  }
}

function getDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getAppLogPath(dateStr: string): string {
  return path.join(LOGS_DIR, `app-${dateStr}.log`);
}

function getErrorLogPath(dateStr: string): string {
  return path.join(LOGS_DIR, `error-${dateStr}.log`);
}

let fileLogState: {
  date: string;
  appStream: fs.WriteStream;
  errorStream: fs.WriteStream;
} | null = null;

function openFileStreamsFor(dateStr: string) {
  ensureLogsDirExists();
  const appPath = getAppLogPath(dateStr);
  const errorPath = getErrorLogPath(dateStr);

  const appStream = fs.createWriteStream(appPath, { flags: 'a' });
  const errorStream = fs.createWriteStream(errorPath, { flags: 'a' });

  fileLogState = { date: dateStr, appStream, errorStream };
}

function closeFileStreams() {
  if (!fileLogState) return;
  try { fileLogState.appStream.end(); } catch {}
  try { fileLogState.errorStream.end(); } catch {}
  fileLogState = null;
}

function getActiveStreams() {
  const today = getDateString();
  if (!fileLogState || fileLogState.date !== today) {
    closeFileStreams();
    openFileStreamsFor(today);
  }
  return fileLogState!;
}

const multiDestination = new Writable({
  write(chunk, _encoding, callback) {
    try {
      const line = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);

      // 始终输出到控制台（stdout）
      try {
        // 避免在某些受限环境中抛错
        process.stdout.write(line);
      } catch {}

      // 写入日志文件
      try {
        const { appStream, errorStream } = getActiveStreams();
        const normalizedLine = line.endsWith('\n') ? line : `${line}\n`;

        // 所有日志写入 app 日志
        appStream.write(normalizedLine);

        // 错误及以上写入 error 日志
        try {
          const parsed = JSON.parse(line);
          const levelNum = typeof parsed.level === 'number' ? parsed.level : undefined;
          if (typeof levelNum === 'number' && levelNum >= LOG_LEVELS.error) {
            errorStream.write(normalizedLine);
          }
        } catch {
          // 如果无法解析JSON，保守起见不重复写入 error 日志
        }
      } catch {
        // 忽略文件写入错误
      }

      callback();
    } catch {
      // 兜底，防止写入异常阻塞
      try { callback(); } catch {}
    }
  },
});

/**
 * 创建 logger 实例
 */
function createLogger() {
  const level = getLogLevel();

  // 使用基础配置 + 自定义多路输出（stdout + 文件）
  const baseConfig = {
    level,
    // 让 time 字段为 ISO 字符串，并额外增加本地中文时间，便于直接阅读
    timestamp: () => {
      const now = new Date();
      const local = now.toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' });
      return `,"timeLocal":"${local}"`;
    },
    formatters: {
      level: (_label: string, number: number) => {
        return { 
          level: number,
          levelLabel: LOG_LEVEL_LABELS[number] || '未知'
        };
      },
      // 移除 pid 和 hostname
      bindings: () => ({}),
    },
  } as const;

  return pino(baseConfig, multiDestination as unknown as pino.DestinationStream);
}

/**
 * 全局 logger 实例
 */
export const logger = createLogger();

/**
 * 为特定模块创建子 logger
 */
export function createModuleLogger(module: string) {
  return logger.child({ module });
}

/**
 * 创建带有请求上下文的 logger
 */
export function createRequestLogger(requestId: string, userId?: string) {
  return logger.child({
    requestId,
    ...(userId && { userId }),
  });
}

/**
 * 记录 API 请求日志的中间件工具函数
 */
export function logApiRequest(
  method: string,
  url: string,
  statusCode?: number,
  duration?: number,
  error?: Error
) {
  const logData = {
    method,
    url,
    statusCode,
    duration,
    ...(error && {
      error: {
        message: error.message,
        stack: error.stack,
      },
    }),
  };

  if (error || (statusCode && statusCode >= 400)) {
    logger.error(logData, `API ${method} ${url} failed`);
  } else {
    logger.info(logData, `API ${method} ${url} completed`);
  }
}

/**
 * 记录数据库操作日志
 */
export function logDatabaseOperation(
  operation: string,
  table?: string,
  duration?: number,
  error?: Error
) {
  const logData = {
    operation,
    table,
    duration,
    ...(error && {
      error: {
        message: error.message,
        stack: error.stack,
      },
    }),
  };

  if (error) {
    logger.error(logData, `Database ${operation} failed`);
  } else {
    logger.debug(logData, `Database ${operation} completed`);
  }
}

/**
 * 业务逻辑日志记录器
 */
export const businessLogger = {
  /**
   * 记录客户相关操作
   */
  customer: (action: string, customerId?: string, data?: Record<string, unknown>) => {
    logger.info(
      {
        business: 'customer',
        action,
        customerId,
        data,
      },
      `Customer ${action}`
    );
  },

  /**
   * 记录带看相关操作
   */
  viewing: (action: string, viewingId?: string, data?: Record<string, unknown>) => {
    logger.info(
      {
        business: 'viewing',
        action,
        viewingId,
        data,
      },
      `Viewing ${action}`
    );
  },

  /**
   * 记录数据同步操作
   */
  sync: (action: string, data?: Record<string, unknown>) => {
    // 如果data中包含timestamp，转换为中文格式
    let processedData = data;
    if (data && data.timestamp) {
      processedData = {
        ...data,
        timestamp: getChineseTimestamp(new Date(data.timestamp as string | number))
      };
    } else if (action === 'started') {
      // 为started操作自动添加中文时间戳
      processedData = {
        ...data,
        timestamp: getChineseTimestamp()
      };
    }
    
    logger.info(
      {
        business: 'sync',
        action,
        data: processedData,
      },
      `Data sync ${action}`
    );
  },
};

/**
 * 日志管理工具函数
 */
export const logUtils = {
  /**
   * 获取日志目录路径
   */
  getLogDirectory(): string {
    return path.join(process.cwd(), 'logs');
  },

  /**
   * 获取所有日志文件列表
   */
  getLogFiles(): string[] {
    const logDir = this.getLogDirectory();
    if (!fs.existsSync(logDir)) {
      return [];
    }
    return fs.readdirSync(logDir)
      .filter(file => file.endsWith('.log'))
      .sort((a, b) => b.localeCompare(a)); // 按日期倒序
  },

  /**
   * 读取指定日志文件的内容
   */
  readLogFile(filename: string): string {
    const logDir = this.getLogDirectory();
    const filePath = path.join(logDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`日志文件不存在: ${filename}`);
    }
    return fs.readFileSync(filePath, 'utf-8');
  },

  /**
   * 获取最近N行日志
   */
  getTailLogs(filename: string, lines: number = 100): string[] {
    const content = this.readLogFile(filename);
    const allLines = content.split('\n').filter(line => line.trim());
    return allLines.slice(-lines);
  },

  /**
   * 清理旧的日志文件（保留最近N天）
   */
  cleanOldLogs(retainDays: number = 7): string[] {
    const logDir = this.getLogDirectory();
    const files = this.getLogFiles();
    const now = new Date();
    const deletedFiles: string[] = [];

    files.forEach(file => {
      const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const fileDate = new Date(dateMatch[1]);
        const daysDiff = Math.floor((now.getTime() - fileDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > retainDays) {
          const filePath = path.join(logDir, file);
          fs.unlinkSync(filePath);
          deletedFiles.push(file);
        }
      }
    });

    return deletedFiles;
  },

  /**
   * 获取日志文件统计信息
   */
  getLogStats(): { 
    totalFiles: number; 
    totalSize: string; 
    oldestFile: string | null; 
    newestFile: string | null; 
  } {
    const logDir = this.getLogDirectory();
    const files = this.getLogFiles();
    
    let totalSize = 0;
    files.forEach(file => {
      const filePath = path.join(logDir, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
    });

    const formatSize = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return {
      totalFiles: files.length,
      totalSize: formatSize(totalSize),
      oldestFile: files.length > 0 ? files[files.length - 1] : null,
      newestFile: files.length > 0 ? files[0] : null,
    };
  },
};

/**
 * 统一的API日志中间件
 * 用于简化各个接口的日志记录，提供一致的日志格式和流程
 */
export function withApiLogging<T extends unknown[], R>(
  apiName: string,
  handler: (request: NextRequest, requestId: string, requestLogger: ReturnType<typeof createRequestLogger>, ...args: T) => Promise<R>
) {
  return async (request: NextRequest, ...args: T): Promise<R> => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    const requestLogger = createRequestLogger(requestId);
    const url = request.nextUrl;

    // 记录请求开始
    requestLogger.info({
      method: request.method,
      url: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      userAgent: request.headers.get('user-agent'),
      requestId
    }, `API请求开始 - ${apiName}`);

    try {
      const result = await handler(request, requestId, requestLogger, ...args);
      
      const duration = Date.now() - startTime;
      
      // 记录API请求完成
      logApiRequest(request.method, url.pathname, 200, duration);
      
      requestLogger.info({
        statusCode: 200,
        duration,
        requestId
      }, `API请求成功完成 - ${apiName}`);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // 记录API请求失败
      const statusCode = error instanceof Error && 'statusCode' in error ? (error as ErrorWithStatusCode).statusCode : 500;
      logApiRequest(request.method, url.pathname, statusCode, duration, error as Error);
      
      requestLogger.error({
        error: error instanceof Error ? error.message : error,
        duration,
        requestId
      }, `API请求失败 - ${apiName}`);

      throw error;
    }
  };
}

/**
 * 简化的业务日志记录器 - 用于记录关键业务操作
 */
export const simpleBusinessLogger = {
  /**
   * 记录客户相关操作
   */
  customer: (action: string, requestId: string, data: Record<string, unknown>) => {
    businessLogger.customer(action, data.customerId?.toString(), {
      requestId,
      ...data
    });
  },

  /**
   * 记录带看相关操作
   */
  viewing: (action: string, requestId: string, data: Record<string, unknown>) => {
    businessLogger.viewing(action, data.viewingRecordId?.toString(), {
      requestId,
      ...data
    });
  },
};

export default logger; 