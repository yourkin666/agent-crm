# 外部预约带看记录接口文档

## 接口概述

本接口供外部服务调用，用于录入预约带看记录到 CRM 系统中。

## 接口信息

- **接口地址**: `POST /api/external/appointments`
- **Content-Type**: `application/json`
- **身份验证**: 暂无（后续可添加 API 密钥验证）

## 请求参数

接口支持中文和英文字段名，可以混合使用。

### 中文字段名

```json
{
  "物业名称": "希望之家",
  "房间地址": "北京市朝阳区xxx小区",
  "客户姓名": "张三",
  "客户电话": "13800138000",
  "经纪人": "李四",
  "预约时间": "2025-08-22 14:30",
  "状态": "待确认",
  "类型": "整租",
  "城市": "北京"
}
```

### 英文字段名

```json
{
  "property_name": "Green Valley",
  "property_address": "123 Main Street",
  "customer_name": "John Doe",
  "customer_phone": "13800138000",
  "agent_name": "Agent Smith",
  "appointment_time": "2025-08-23T10:30:00",
  "status": 2,
  "type": "whole_rent",
  "city": "Beijing"
}
```

## 字段说明

| 中文字段名 | 英文字段名       | 类型          | 必填 | 说明                       |
| ---------- | ---------------- | ------------- | ---- | -------------------------- |
| 物业名称   | property_name    | string        | 否   | 默认值: "未填写"           |
| 房间地址   | property_address | string        | 否   | 默认值: "未填写"           |
| 客户姓名   | customer_name    | string        | 否   | 默认值: "未填写"           |
| 客户电话   | customer_phone   | string        | 否   | 可为空                     |
| 经纪人     | agent_name       | string        | 否   | 默认值: "未填写"           |
| 预约时间   | appointment_time | string        | 否   | 默认值: 当前时间           |
| 状态       | status           | string/number | 否   | 默认值: 1(待确认)          |
| 类型       | type             | string        | 否   | 默认值: "whole_rent"(整租) |
| 城市       | city             | string        | 否   | 可为空                     |

### 状态值映射

| 中文状态 | 数字值 | 英文值      | 说明       |
| -------- | ------ | ----------- | ---------- |
| 待确认   | 1      | pending     | 默认状态   |
| 已确认   | 2      | confirmed   | 已确认预约 |
| 进行中   | 3      | in_progress | 正在带看   |
| 已完成   | 4      | completed   | 带看完成   |
| 已取消   | 5      | cancelled   | 取消预约   |

### 类型值映射

| 中文类型 | 英文值      | 说明       |
| -------- | ----------- | ---------- |
| 整租     | whole_rent  | 整套出租   |
| 集中     | centralized | 集中式公寓 |
| 合租     | shared_rent | 合租房间   |

### 时间格式

支持以下时间格式：

- `"2025-08-22 14:30"` - 简单格式
- `"2025-08-23T10:30:00"` - ISO 格式
- `"2025-08-23T10:30:00.000Z"` - 完整 ISO 格式

## 响应格式

### 成功响应 (HTTP 201)

```json
{
  "success": true,
  "data": {
    "id": 24,
    "message": "预约记录创建成功"
  }
}
```

### 失败响应 (HTTP 500)

```json
{
  "success": false,
  "error": "创建预约记录失败",
  "details": "具体错误信息"
}
```

## 使用示例

### cURL 示例

```bash
curl -X POST http://localhost:3000/api/external/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "物业名称": "希望之家",
    "客户姓名": "张三",
    "经纪人": "李四",
    "预约时间": "2025-08-22 14:30",
    "状态": "待确认",
    "类型": "整租"
  }'
```

### JavaScript 示例

```javascript
const response = await fetch(
  "http://localhost:3000/api/external/appointments",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      物业名称: "希望之家",
      客户姓名: "张三",
      经纪人: "李四",
      预约时间: "2025-08-22 14:30",
      状态: "待确认",
      类型: "整租",
    }),
  }
);

const result = await response.json();
console.log(result);
```

## 特性说明

1. **无数据验证**: 接口不对输入数据进行严格验证，有多少数据写多少
2. **灵活的字段名**: 支持中文和英文字段名，可以混合使用
3. **默认值处理**: 未提供的字段会使用合理的默认值
4. **时间格式自动转换**: 自动处理多种时间格式
5. **状态值智能映射**: 自动转换中文状态到数字值

## 测试用例

接口已通过以下测试用例验证：

- ✅ 中文字段名测试
- ✅ 英文字段名测试
- ✅ 混合字段名测试
- ✅ 最少字段测试
- ✅ 不同类型测试

## 注意事项

1. 当前版本不包含身份验证，请确保接口部署在安全环境中
2. 建议在生产环境中添加适当的安全措施
3. 接口会将数据直接写入数据库，请确保数据来源可信
