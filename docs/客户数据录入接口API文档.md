# 客户数据录入接口 API 文档

> 文档更新时间：2025-01-27  
> 接口版本：v2.0  
> 适用于：外部系统客户数据集成  
> 基础 URL：`https://your-domain.com/api/external`

---

## 📋 接口概览

客户数据录入接口用于外部系统向 CRM 系统录入或更新客户信息。该接口支持幂等性操作，相同 userId 的重复调用会自动更新现有客户信息。

- **接口地址**: `POST /api/external/customers`
- **功能描述**: 根据 userId 录入或更新客户信息
- **幂等性**: ✅ 支持重复调用
- **返回格式**: JSON

---

### 请求头要求

```
Content-Type: application/json
User-Agent: Your-System-Name/1.0
```

### 错误处理

接口遵循统一的错误响应格式：

```json
{
  "success": false,
  "error": "错误描述",
  "message": "错误信息"
}
```

---

## 📝 请求参数

### 请求体参数

| 参数名           | 类型   | 必填 | 默认值        | 说明                                                                            |
| ---------------- | ------ | ---- | ------------- | ------------------------------------------------------------------------------- |
| **基础信息**     |
| `userId`         | string | ✅   | -             | 用户第三方唯一标识 ID                                                           |
| `botId`          | string | ❌   | -             | 机器人/工作人员账号 ID                                                          |
| `nickname`       | string | ❌   | -             | 客户昵称                                                                        |
| `name`           | string | ❌   | -             | 客户真实姓名                                                                    |
| `phone`          | string | ❌   | -             | 主手机号（格式：1[3-9]xxxxxxxx）                                                |
| `backup_phone`   | string | ❌   | -             | 备用手机号                                                                      |
| `wechat`         | string | ❌   | -             | 微信号                                                                          |
| **业务信息**     |
| `status`         | number | ❌   | 1             | 客户状态（1-5：跟进中/不再回复/已约带看/已成交未结佣/已成交已结佣）             |
| `community`      | string | ❌   | -             | 咨询小区名称                                                                    |
| `business_type`  | string | ❌   | 'whole_rent'  | 业务类型（whole_rent/shared_rent/centralized）                                  |
| `room_type`      | string | ❌   | 'one_bedroom' | 房型（one_bedroom/two_bedroom/three_bedroom/four_plus/master_room/second_room） |
| `room_tags`      | string | ❌   | -             | 房型标签（JSON 格式数组字符串）                                                 |
| `move_in_date`   | string | ❌   | -             | 期望入住时间（YYYY-MM-DD 格式）                                                 |
| `lease_period`   | number | ❌   | -             | 租赁周期（月数）                                                                |
| `price_range`    | string | ❌   | -             | 可接受价格范围（如："5000-7000"）                                               |
| `source_channel` | string | ❌   | 'referral'    | 来源渠道（xianyu/xiaohongshu/beike/58tongcheng/shipinhao/douyin/referral）      |
| `creator`        | string | ❌   | '外部系统'    | 录入人标识                                                                      |
| `internal_notes` | string | ❌   | -             | 内部备注                                                                        |

---

## 📊 字段状态说明

### 客户状态 (status)

| 状态值 | 状态名称     | 说明               |
| ------ | ------------ | ------------------ |
| 1      | 跟进中       | 客户正在跟进中     |
| 2      | 客户不再回复 | 客户停止回复       |
| 3      | 已约带看     | 已预约带看时间     |
| 4      | 已成交未结佣 | 已成交但佣金未结算 |
| 5      | 已成交已结佣 | 已成交且佣金已结算 |

### 业务类型 (business_type)

| 类型值      | 类型名称 | 说明       |
| ----------- | -------- | ---------- |
| whole_rent  | 整租     | 整租业务   |
| shared_rent | 合租     | 合租业务   |
| centralized | 集中     | 集中式公寓 |

### 房型 (room_type)

| 类型值        | 类型名称   | 说明       |
| ------------- | ---------- | ---------- |
| one_bedroom   | 一室       | 一室一厅   |
| two_bedroom   | 两室       | 两室一厅   |
| three_bedroom | 三室       | 三室一厅   |
| four_plus     | 四室及以上 | 四室及以上 |
| master_room   | 主卧       | 主卧       |
| second_room   | 次卧       | 次卧       |

### 来源渠道 (source_channel)

| 渠道值      | 渠道名称 | 说明       |
| ----------- | -------- | ---------- |
| xianyu      | 闲鱼     | 闲鱼平台   |
| xiaohongshu | 小红书   | 小红书平台 |
| beike       | 贝壳     | 贝壳找房   |
| 58tongcheng | 58 同城  | 58 同城    |
| shipinhao   | 视频号   | 微信视频号 |
| douyin      | 抖音     | 抖音平台   |
| referral    | 推荐     | 推荐渠道   |

---

## 📤 响应结果

### 成功响应 - 创建新客户

```json
{
  "success": true,
  "data": {
    "id": 123,
    "userId": "agent_user_12345",
    "action": "created"
  },
  "message": "新客户创建成功"
}
```

### 成功响应 - 更新现有客户

```json
{
  "success": true,
  "data": {
    "id": 123,
    "userId": "agent_user_12345"
  },
  "message": "客户信息已更新"
}
```

### 错误响应

```json
{
  "success": false,
  "error": "userId为必填字段",
  "message": "请求数据验证失败"
}
```



## 📋 业务场景示例

### 场景一：创建新客户

**请求示例**

```json
{
  "userId": "agent_user_12345",
  "botId": "bot_001",
  "nickname": "小张",
  "name": "张三",
  "phone": "13800138000",
  "backup_phone": "13900139000",
  "wechat": "zhangsan123",
  "status": 1,
  "community": "万科城",
  "business_type": "whole_rent",
  "room_type": "two_bedroom",
  "room_tags": "[\"loft\", \"two_bath\"]",
  "move_in_date": "2024-09-01",
  "lease_period": 12,
  "price_range": "5000-8000",
  "source_channel": "referral",
  "creator": "外部Agent系统",
  "internal_notes": "来自Agent系统推送"
}
```

**响应示例**

```json
{
  "success": true,
  "data": {
    "id": 123,
    "userId": "agent_user_12345",
    "action": "created"
  },
  "message": "新客户创建成功"
}
```

### 场景二：更新现有客户

**请求示例**

```json
{
  "userId": "agent_user_12345",
  "nickname": "张三丰",
  "phone": "13800138001",
  "community": "万科城二期",
  "business_type": "shared_rent",
  "price_range": "6000-9000"
}
```

**响应示例**

```json
{
  "success": true,
  "data": {
    "id": 123,
    "userId": "agent_user_12345"
  },
  "message": "客户信息已更新"
}
```

### 场景三：最小化数据录入

**请求示例**

```json
{
  "userId": "agent_user_67890",
  "name": "李四",
  "phone": "13900139000"
}
```

**响应示例**

```json
{
  "success": true,
  "data": {
    "id": 124,
    "userId": "agent_user_67890",
    "action": "created"
  },
  "message": "新客户创建成功"
}
```

---

## 🧪 测试示例

### curl 命令样例

#### 1. 创建新客户（完整数据）
```bash
curl -X POST http://localhost:3000/api/external/customers \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "agent_user_12345",
    "botId": "bot_001",
    "nickname": "小张",
    "name": "张三",
    "phone": "13800138000",
    "backup_phone": "13900139000",
    "wechat": "zhangsan123",
    "status": 1,
    "community": "万科城",
    "business_type": "whole_rent",
    "room_type": "two_bedroom",
    "room_tags": "[\"loft\", \"two_bath\"]",
    "move_in_date": "2024-09-01",
    "lease_period": 12,
    "price_range": "5000-8000",
    "source_channel": "referral",
    "creator": "外部Agent系统",
    "internal_notes": "来自Agent系统推送"
  }'
```

#### 2. 更新现有客户（部分数据）

```bash
curl -X POST https://your-domain.com/api/external/customers \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "agent_user_12345",
    "nickname": "张三丰",
    "phone": "13800138001",
    "community": "万科城二期",
    "business_type": "shared_rent",
    "price_range": "6000-9000"
  }'
```

#### 3. 最小化数据录入

```bash
curl -X POST https://your-domain.com/api/external/customers \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "agent_user_67890",
    "name": "李四",
    "phone": "13900139000"
  }'
```


---

## 🔧 使用指南

### 数据更新策略

系统使用 `COALESCE` 函数进行数据更新，确保：

- 只有新值不为空时才更新现有字段
- 空值不会覆盖现有数据
- 支持部分字段更新

### 幂等性保证

- 相同 `userId` 的重复调用不会创建重复记录
- 系统会自动判断是创建新客户还是更新现有客户
- 支持并发调用，数据一致性有保障

### 最佳实践

1. **提供完整的客户信息**：尽量提供完整的字段信息，便于后续业务处理
2. **合理使用 userId**：确保 userId 的唯一性和稳定性
3. **错误处理**：实现适当的重试机制和错误处理逻辑
4. **数据验证**：在调用接口前验证数据的完整性和格式

---

## ❓ 常见问题

### Q1: userId 是什么？

A: userId 是外部系统中用户的唯一标识，用于关联客户数据，确保同一用户在不同时间的数据能正确合并。

### Q2: 如果客户信息发生变化怎么办？

A: 系统支持数据更新，相同 userId 的后续请求会更新现有客户信息，不会创建重复记录。

### Q3: 支持哪些数据格式？

A:

- 时间格式：YYYY-MM-DD (如: "2024-09-01")
- 电话格式：中国大陆手机号 (如: "13800138000")
- 价格范围：字符串格式 (如: "5000-8000")
- 房型标签：JSON 数组字符串 (如: "[\"loft\", \"two_bath\"]")

### Q4: 如何处理并发请求？

A: 系统内置了请求日志和错误处理机制，支持适度并发，建议控制在 10 请求/秒以内。

### Q5: 手机号重复怎么办？

A: 系统会检查手机号的唯一性，如果手机号已存在，会返回相应的错误信息。

### Q6: 必填字段有哪些？

A: 只有 `userId` 是必填字段，其他字段都是可选的。

