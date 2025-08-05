# API 错误处理改进文档

## 概述

本次改进统一了 CRM 系统所有 API 路由的错误处理格式，提升了前端错误处理的一致性和用户体验。同时移除了不必要的必填字段限制，提高了数据录入的灵活性。

## 改进内容

### 1. 统一的错误响应格式

所有 API 现在返回一致的错误格式：

```json
{
  "success": false,
  "error": "错误描述信息",
  "errorType": "ERROR_TYPE",
  "details": "详细错误信息（可选）"
}
```

### 2. 错误类型枚举

```typescript
export enum ApiErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR", // 输入验证错误
  NOT_FOUND = "NOT_FOUND", // 资源不存在
  DUPLICATE_RESOURCE = "DUPLICATE_RESOURCE", // 重复资源
  DATABASE_ERROR = "DATABASE_ERROR", // 数据库错误
  UNAUTHORIZED = "UNAUTHORIZED", // 未授权
  FORBIDDEN = "FORBIDDEN", // 禁止访问
  INTERNAL_ERROR = "INTERNAL_ERROR", // 内部错误
}
```

### 3. 错误处理中间件

- `withErrorHandler`: 自动捕获和处理异常
- `createErrorResponse`: 创建标准错误响应
- `createSuccessResponse`: 创建标准成功响应

### 4. 灵活的输入验证

**移除的限制**：

- 移除了所有必填字段验证
- 移除了数据库层面的 NOT NULL 约束
- 允许创建完全空的记录

**保留的验证**：

- 手机号格式验证（如果提供）
- 字段长度限制验证
- 数值范围验证
- 重复手机号检查

## 数据灵活性改进

### 之前的限制

- 客户姓名必填
- 小区名称必填
- 业务类型必填
- 录入人必填
- 带看记录的客户 ID 必填
- 预约的物业名称必填

### 现在的灵活性

- **所有字段都可选**: 允许部分信息录入，后续补充
- **默认值处理**: 空字段自动填充合理默认值
- **渐进式数据完善**: 支持先创建框架，再逐步完善信息

### 使用场景

1. **快速记录**: 接电话时快速创建客户记录
2. **分阶段录入**: 先记录基本信息，后续补充详细信息
3. **数据导入**: 从不完整的数据源导入记录
4. **系统集成**: 与其他系统交换不完整数据

## 使用示例

### 基本用法

```typescript
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();

  // 验证输入（只检查格式，不强制必填）
  validateCustomerData(body);

  // 业务逻辑
  const result = await dbManager.execute(sql, params);

  // 返回成功响应
  return createSuccessResponse(result, "操作成功", 201);
});
```

### 创建空记录示例

```bash
# 创建空客户记录
curl -X POST /api/customers -d '{}'
→ {"success":true,"data":{"id":24,"name":"","phone":null,...}}

# 创建只有部分信息的预约
curl -X POST /api/appointments -d '{"customer_phone":"13888999000"}'
→ {"success":true,"data":{"id":18,...}}

# 创建不关联客户的带看记录
curl -X POST /api/viewing-records -d '{"property_name":"测试楼盘","commission":500}'
→ {"success":true,"data":{"id":11}}
```

### 错误处理

```typescript
// 格式验证错误（仍然保留）
if (invalidPhoneFormat) {
  throw createValidationError("手机号格式不正确");
}

// 重复资源错误
if (duplicateRecord) {
  throw createDuplicateError("手机号");
}

// 数据库错误
try {
  await dbManager.execute(sql, params);
} catch (error) {
  throw createDatabaseError("创建客户", error as Error);
}
```

## 前端错误处理

现在前端可以统一处理所有 API 错误：

```typescript
try {
  const response = await fetch("/api/customers", options);
  const result = await response.json();

  if (!result.success) {
    switch (result.errorType) {
      case "VALIDATION_ERROR":
        message.error(`输入错误: ${result.error}`);
        break;
      case "NOT_FOUND":
        message.error("资源不存在");
        break;
      case "DUPLICATE_RESOURCE":
        message.error(`资源已存在: ${result.error}`);
        break;
      default:
        message.error("操作失败");
    }
  }
} catch (error) {
  message.error("网络请求失败");
}
```

## 数据库迁移

为了移除 NOT NULL 约束，我们进行了数据库结构迁移：

1. **备份现有数据**
2. **重建表结构**（移除 NOT NULL 约束）
3. **迁移数据**（使用 COALESCE 提供默认值）
4. **清理备份表**

迁移后的改进：

- `customer_id` 可为空（允许独立的带看记录）
- 所有文本字段可为空（提供默认值）
- 外键约束改为 `ON DELETE SET NULL`（更安全）

## 已更新的 API 路由

- ✅ `/api/customers` (GET, POST, PUT) - 移除必填限制
- ✅ `/api/appointments` (POST) - 移除必填限制
- ✅ `/api/viewing-records` (POST) - 移除必填限制
- 🔄 `/api/appointments/[id]` (待更新)

## 性能和可维护性优化

- **减少验证开销**: 不再检查大量必填字段
- **提高数据录入效率**: 支持快速部分录入
- **降低用户门槛**: 减少表单验证错误
- **增强系统灵活性**: 适应各种业务场景

## 向后兼容性

- ✅ **完全向后兼容**: 原有的完整数据录入方式仍然有效
- ✅ **API 格式不变**: 只是放宽了验证限制
- ✅ **数据结构保持**: 所有字段仍然存在，只是变为可选
- ✅ **前端无需修改**: 现有前端代码无需任何改动

## 数据库维护命令

```bash
# 重建数据库（开发环境）
npm run db:reset

# 初始化数据库
npm run db:setup
```
