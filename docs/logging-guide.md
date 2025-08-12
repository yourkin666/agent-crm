# CRM 系统日志使用指南

## 概述

本项目现在使用 `pino` 作为主要的日志记录库，替代了之前简单的 `console.log` 方式。新的日志系统提供了结构化日志、日志级别控制、性能监控等功能。

## 日志配置

### 环境变量

可以通过以下环境变量配置日志行为：

```bash
# 设置日志级别（可选值：fatal, error, warn, info, debug, trace）
LOG_LEVEL=debug

# 设置运行环境
NODE_ENV=development  # 开发环境会启用彩色输出和格式化
```

### 自动日志级别

如果没有设置 `LOG_LEVEL`，系统会根据 `NODE_ENV` 自动选择：

- `production`: `info` 级别
- `test`: `warn` 级别
- `development`: `debug` 级别

## 日志类型

### 1. 通用日志

```typescript
import { logger } from "@/lib/logger";

logger.info("操作成功");
logger.error({ error: error.message }, "操作失败");
logger.debug({ userId: "123" }, "调试信息");
```

### 2. 模块特定日志

```typescript
import { createModuleLogger } from "@/lib/logger";

const moduleLogger = createModuleLogger("auth");
moduleLogger.info("用户登录成功");
```

### 3. 请求相关日志

```typescript
import { createRequestLogger } from "@/lib/logger";

const requestLogger = createRequestLogger("req-123", "user-456");
requestLogger.info("处理用户请求");
```

### 4. 业务日志

系统提供了预定义的业务日志记录器：

```typescript
import { businessLogger } from "@/lib/logger";

// 客户相关操作
businessLogger.customer("created", customerId, {
  name: "张三",
  phone: "123456",
});

// 预约相关操作
businessLogger.appointment("completed", appointmentId, { result: "success" });

// 带看相关操作
businessLogger.viewing("added", viewingId, { property: "阳光小区" });

// 数据同步操作
businessLogger.sync("started", { timestamp: new Date() });
```

## 数据库日志

数据库操作会自动记录性能指标：

```typescript
import { logDatabaseOperation } from "@/lib/logger";

// 会自动记录操作类型、耗时、是否出错
logDatabaseOperation("query", "customers", 150, error);
```

## API 请求日志

API 请求可以使用统一的日志记录：

```typescript
import { logApiRequest } from "@/lib/logger";

logApiRequest("GET", "/api/customers", 200, 150);
logApiRequest("POST", "/api/customers", 500, 300, error);
```

## 日志级别说明

- **fatal (60)**: 致命错误，系统无法继续运行
- **error (50)**: 错误，需要关注但不影响系统运行
- **warn (40)**: 警告，潜在问题
- **info (30)**: 信息，重要的业务操作
- **debug (20)**: 调试信息，开发时有用
- **trace (10)**: 跟踪信息，最详细的日志

## 日志输出格式

### 开发环境

```
[2025-01-08 15:30:45] INFO: Customer created
    customerId: "123"
    customerName: "张三"
    source: "api"
```

### 生产环境

```json
{
  "level": 30,
  "time": "2025-01-08T07:30:45.123Z",
  "msg": "Customer created",
  "customerId": "123",
  "customerName": "张三",
  "source": "api"
}
```

## 最佳实践

### 1. 选择合适的日志级别

- 使用 `error` 记录需要立即关注的错误
- 使用 `warn` 记录潜在问题
- 使用 `info` 记录重要的业务操作
- 使用 `debug` 记录调试信息

### 2. 提供结构化数据

```typescript
// ✅ 好的做法
logger.info(
  {
    userId: "123",
    action: "login",
    timestamp: new Date(),
  },
  "用户登录成功"
);

// ❌ 避免这样做
logger.info("用户123登录成功");
```

### 3. 记录关键业务操作

- 用户注册/登录
- 重要数据的创建/更新/删除
- 支付相关操作
- 数据同步操作

### 4. 错误日志包含足够信息

```typescript
// ✅ 好的做法
logger.error(
  {
    error: error.message,
    stack: error.stack,
    userId: "123",
    operation: "createCustomer",
  },
  "创建客户失败"
);
```

## 性能考虑

- `pino` 是高性能的日志库，在生产环境中影响很小
- 开发环境启用了格式化输出，可能稍慢
- 避免在日志中记录敏感信息（密码、密钥等）

## 查看日志文件

### 1. 日志文件位置

所有日志文件都保存在 `logs/` 目录中：

- `app-YYYY-MM-DD.log`: 应用日志（JSON 格式）
- `error-YYYY-MM-DD.log`: 错误日志（JSON 格式）

### 2. 使用命令行工具查看

系统提供了便捷的命令行工具来查看日志：

```bash
# 查看所有日志文件
npm run logs:list

# 查看最新日志（默认20行）
npm run logs:tail

# 查看最后N行日志
node scripts/view-logs.js tail -n 50

# 查看错误日志
npm run logs:error

# 查看帮助
npm run logs help
```

### 5. 直接查看文件

你也可以直接查看日志文件：

```bash
# 查看最新应用日志
tail -f logs/app-$(date +%Y-%m-%d).log

# 查看错误日志
cat logs/error-$(date +%Y-%m-%d).log

# 格式化查看JSON日志
cat logs/app-$(date +%Y-%m-%d).log | jq '.'
```

## 未来扩展

可以考虑集成以下服务来增强日志功能：

- **Sentry**: 错误监控和告警
- **Datadog**: 日志聚合和分析
- **ELK Stack**: 日志搜索和可视化
- **Logtail**: 云端日志管理
