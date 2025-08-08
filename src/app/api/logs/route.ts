import { NextRequest } from 'next/server';
import { logUtils } from '@/lib/logger';
import { createSuccessResponse, createErrorResponse, withErrorHandler } from '@/lib/api-error-handler';
export const dynamic = 'force-dynamic';

/**
 * 获取日志文件列表和统计信息
 */
async function handleGetLogs(request: NextRequest) {
  const url = request.nextUrl;
  const action = url.searchParams.get('action');
  const filename = url.searchParams.get('file');
  const lines = parseInt(url.searchParams.get('lines') || '100');

  switch (action) {
    case 'list':
      // 获取日志文件列表
      const files = logUtils.getLogFiles();
      const stats = logUtils.getLogStats();
      return createSuccessResponse({
        files,
        stats,
      });

    case 'read':
      // 读取指定日志文件
      if (!filename) {
        return createErrorResponse('请指定日志文件名', 400);
      }
      try {
        const content = logUtils.readLogFile(filename);
        return createSuccessResponse({
          filename,
          content,
        });
      } catch (error) {
        return createErrorResponse(
          error instanceof Error ? error.message : '读取日志文件失败',
          404
        );
      }

    case 'tail':
      // 获取日志文件尾部内容
      if (!filename) {
        return createErrorResponse('请指定日志文件名', 400);
      }
      try {
        const tailContent = logUtils.getTailLogs(filename, lines);
        return createSuccessResponse({
          filename,
          lines: tailContent.length,
          content: tailContent,
        });
      } catch (error) {
        return createErrorResponse(
          error instanceof Error ? error.message : '读取日志文件失败',
          404
        );
      }

    default:
      // 默认返回文件列表
      const defaultFiles = logUtils.getLogFiles();
      const defaultStats = logUtils.getLogStats();
      return createSuccessResponse({
        files: defaultFiles,
        stats: defaultStats,
      });
  }
}

/**
 * 清理旧日志文件
 */
async function handleDeleteLogs(request: NextRequest) {
  const { retainDays = 7 } = await request.json();
  
  try {
    const deletedFiles = logUtils.cleanOldLogs(retainDays);
    return createSuccessResponse({
      message: `成功清理 ${deletedFiles.length} 个旧日志文件`,
      deletedFiles,
      retainDays,
    });
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : '清理日志文件失败',
      500
    );
  }
}

export const GET = withErrorHandler(handleGetLogs);
export const DELETE = withErrorHandler(handleDeleteLogs); 