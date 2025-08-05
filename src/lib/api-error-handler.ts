import { NextResponse } from 'next/server';
import { ApiResponse } from '@/types';

/**
 * API 错误类型枚举
 */
export enum ApiErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * API 错误类
 */
export class ApiError extends Error {
  public readonly type: ApiErrorType;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(
    type: ApiErrorType,
    message: string,
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * 创建统一的API错误响应
 */
export function createErrorResponse(
  error: string | Error | ApiError,
  statusCode: number = 500,
  details?: any
): NextResponse {
  let response: ApiResponse;

  if (error instanceof ApiError) {
    response = {
      success: false,
      error: error.message,
      errorType: error.type,
      details: error.details || details,
    };
    statusCode = error.statusCode;
  } else if (error instanceof Error) {
    response = {
      success: false,
      error: error.message,
      errorType: ApiErrorType.INTERNAL_ERROR,
      details,
    };
  } else {
    response = {
      success: false,
      error: error,
      errorType: ApiErrorType.INTERNAL_ERROR,
      details,
    };
  }

  // 记录错误日志
  console.error(`API Error [${response.errorType}]:`, {
    message: response.error,
    statusCode,
    details: response.details,
    stack: error instanceof Error ? error.stack : undefined,
  });

  return NextResponse.json(response, { status: statusCode });
}

/**
 * 创建成功响应
 */
export function createSuccessResponse<T = any>(
  data?: T,
  message?: string,
  statusCode: number = 200
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };

  return NextResponse.json(response, { status: statusCode });
}

/**
 * 验证错误便捷方法
 */
export function createValidationError(message: string, details?: any): ApiError {
  return new ApiError(ApiErrorType.VALIDATION_ERROR, message, 400, details);
}

/**
 * 资源不存在错误便捷方法
 */
export function createNotFoundError(resource: string): ApiError {
  return new ApiError(ApiErrorType.NOT_FOUND, `${resource}不存在`, 404);
}

/**
 * 重复资源错误便捷方法
 */
export function createDuplicateError(resource: string): ApiError {
  return new ApiError(ApiErrorType.DUPLICATE_RESOURCE, `${resource}已存在`, 400);
}

/**
 * 数据库错误便捷方法
 */
export function createDatabaseError(operation: string, originalError?: Error): ApiError {
  return new ApiError(
    ApiErrorType.DATABASE_ERROR,
    `${operation}失败`,
    500,
    originalError?.message
  );
}

/**
 * API路由错误处理装饰器
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<NextResponse | R> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ApiError) {
        return createErrorResponse(error);
      }
      
      // 处理常见的数据库错误
      if (error instanceof Error) {
        if (error.message.includes('UNIQUE constraint failed')) {
          return createErrorResponse(
            new ApiError(ApiErrorType.DUPLICATE_RESOURCE, '资源已存在', 400)
          );
        }
        
        if (error.message.includes('FOREIGN KEY constraint failed')) {
          return createErrorResponse(
            new ApiError(ApiErrorType.VALIDATION_ERROR, '关联数据不存在', 400)
          );
        }
        
        if (error.message.includes('NOT NULL constraint failed')) {
          return createErrorResponse(
            new ApiError(ApiErrorType.VALIDATION_ERROR, '必填字段不能为空', 400)
          );
        }
      }
      
      // 未知错误
      return createErrorResponse(
        new ApiError(ApiErrorType.INTERNAL_ERROR, '服务器内部错误', 500),
        500,
        error instanceof Error ? error.message : error
      );
    }
  };
}

/**
 * 输入验证装饰器
 */
export function validateInput(validator: (input: any) => void) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      try {
        // 假设第一个参数是 request
        const request = args[0];
        if (request && typeof request.json === 'function') {
          const body = await request.json();
          validator(body);
        }
        return await originalMethod.apply(this, args);
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }
        throw createValidationError(error instanceof Error ? error.message : '输入验证失败');
      }
    };
    
    return descriptor;
  };
} 