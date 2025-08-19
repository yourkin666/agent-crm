# 外部 API 接口文档

> 文档更新时间：2025-01-27  
> 接口版本：v2.0  
> 适用于：外部系统集成  
> 基础 URL：`https://your-domain.com/api/external`

---

## 📋 接口概览

本文档描述了为外部系统提供的数据录入和查询接口，支持客户数据管理、带看记录录入和查询功能。

| 接口             | 方法 | 路径                                     | 功能描述                       |
| ---------------- | ---- | ---------------------------------------- | ------------------------------ |
| 客户数据录入     | POST | `/api/external/customers`                | 录入或更新客户信息             |
| 带看记录录入     | POST | `/api/external/viewing-records`          | 录入带看记录并智能处理客户数据 |
| 用户带看记录查询 | GET  | `/api/external/viewing-records/[userId]` | 根据用户 ID 查询带看记录信息   |
| 统计数据查询     | GET  | `/api/external/statistics`               | 获取系统统计数据               |

---

## 🔐 错误处理

所有接口都遵循统一的错误响应格式：

```json
{
  "success": false,
  "error": "错误描述",
  "message": "错误信息"
}
```

---

## 🏢 1. 客户数据录入接口

### 基本信息

- **接口地址**: `POST /api/external/customers`
- **功能描述**: 根据 userId 录入或更新客户信息
- **幂等性**: ✅ 支持重复调用

### 请求参数

| 参数名           | 类型   | 必填 | 默认值        | 说明                                                                            |
| ---------------- | ------ | ---- | ------------- | ------------------------------------------------------------------------------- |
| `userId`         | string | ✅   | -             | 用户第三方唯一标识 ID                                                           |
| `botId`          | string | ❌   | -             | 机器人/工作人员账号 ID                                                          |
| `nickname`       | string | ❌   | -             | 客户昵称                                                                        |
| `name`           | string | ❌   | -             | 客户真实姓名                                                                    |
| `phone`          | string | ❌   | -             | 主手机号（格式：1[3-9]xxxxxxxx）                                                |
| `backup_phone`   | string | ❌   | -             | 备用手机号                                                                      |
| `wechat`         | string | ❌   | -             | 微信号                                                                          |
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

### 请求示例

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

### 响应结果

#### 成功响应 - 创建新客户

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

#### 成功响应 - 更新现有客户

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

---

## 👁️ 2. 带看记录录入接口

### 基本信息

- **接口地址**: `POST /api/external/viewing-records`
- **功能描述**: 录入带看记录数据，自动处理客户信息，并智能查询房源详细信息
- **核心功能**:
  - 智能客户处理：自动创建或更新客户信息
  - 外部房源信息自动查询：根据物业地址自动查询详细信息
  - 重复记录智能更新：自动检测并更新重复记录
  - 客户状态联动更新：根据带看反馈自动更新客户状态

### 请求参数

| 参数名                | 类型   | 必填 | 默认值        | 说明                                         |
| --------------------- | ------ | ---- | ------------- | -------------------------------------------- |
| `userId`              | string | ✅   | -             | 用户第三方唯一标识 ID                        |
| `botId`               | string | ❌   | -             | 机器人/工作人员账号 ID                       |
| `customer_name`       | string | ❌   | -             | 客户姓名                                     |
| `customer_phone`      | string | ❌   | -             | 客户电话                                     |
| `viewing_time`        | string | ❌   | 当前时间      | 带看时间（ISO 8601 格式）                    |
| `property_name`       | string | ✅   | -             | 带看楼盘名称                                 |
| `property_address`    | string | ❌   | -             | 楼盘详细地址                                 |
| `room_type`           | string | ❌   | 'one_bedroom' | 带看户型                                     |
| `room_tag`            | string | ❌   | -             | 房型标签                                     |
| `viewer_name`         | string | ❌   | 'external'    | 带看人                                       |
| `viewing_status`      | number | ❌   | 1             | 带看状态（1-4：待确认/已确认/已取消/已带看） |
| `commission`          | number | ❌   | 0             | 带看佣金                                     |
| `viewing_feedback`    | number | ❌   | -             | 带看反馈（0=未成交, 1=已成交）               |
| `business_type`       | string | ❌   | 'whole_rent'  | 业务类型                                     |
| `notes`               | string | ❌   | -             | 备注                                         |
| `housingId`           | number | ❌   | -             | 房源 ID                                      |
| `houseAreaId`         | number | ❌   | -             | 区域 ID                                      |
| `houseAreaName`       | string | ❌   | -             | 区域名称                                     |
| `cityId`              | number | ❌   | -             | 城市 ID                                      |
| `cityName`            | string | ❌   | -             | 城市名称                                     |
| `propertyAddrId`      | number | ❌   | -             | 物业地址 ID                                  |
| `unitType`            | string | ❌   | -             | 户型                                         |
| `longitude`           | string | ❌   | -             | 经度                                         |
| `latitude`            | string | ❌   | -             | 纬度                                         |
| `roomId`              | number | ❌   | -             | 房间 ID                                      |
| `advisorId`           | number | ❌   | -             | 顾问 ID                                      |
| `advisorName`         | string | ❌   | -             | 顾问名称                                     |
| `companyName`         | string | ❌   | -             | 公司名称                                     |
| `companyAbbreviation` | string | ❌   | -             | 公司简称                                     |
| `houseTypeId`         | number | ❌   | -             | 房型 ID                                      |

### 请求示例

```json
{
  "userId": "agent_user_67890",
  "botId": "bot_002",
  "customer_name": "李四",
  "customer_phone": "13900139000",
  "viewing_time": "2024-08-15T14:00:00.000Z",
  "property_name": "万科城",
  "property_address": "1栋2单元301室",
  "room_type": "two_bedroom",
  "room_tag": "loft",
  "viewer_name": "external",
  "viewing_status": 2,
  "commission": 3000,
  "viewing_feedback": 1,
  "business_type": "whole_rent",
  "notes": "客户很满意，准备签约"
}
```

### 响应结果

#### 成功响应 - 创建新记录

```json
{
  "success": true,
  "data": {
    "viewing_record_id": 456,
    "customer_id": 123,
    "customer_action": "created",
    "viewing_record_action": "created",
    "userId": "agent_user_67890",
    "external_property_enriched": true,
    "external_property_data": {
      "propertyAddrId": 789,
      "housingId": 101,
      "cityName": "深圳市",
      "houseAreaName": "南山区",
      "advisorName": "王顾问",
      "companyName": "万科地产"
    }
  },
  "message": "带看记录录入成功，客户已创建，已自动填入外部房源信息"
}
```

#### 成功响应 - 更新现有记录

```json
{
  "success": true,
  "data": {
    "viewing_record_id": 456,
    "customer_id": 123,
    "customer_action": "updated",
    "viewing_record_action": "updated",
    "userId": "agent_user_67890",
    "external_property_enriched": false
  },
  "message": "带看记录更新成功，客户已更新"
}
```

---

## 🔍 3. 用户带看记录查询接口

### 基本信息

- **接口地址**: `GET /api/external/viewing-records/[userId]`
- **功能描述**: 根据用户 ID 查询带看记录信息
- **支持功能**: 分页查询、多条件筛选

### 请求参数

#### 路径参数

| 参数名   | 类型   | 必填 | 说明                  |
| -------- | ------ | ---- | --------------------- |
| `userId` | string | ✅   | 用户第三方唯一标识 ID |

#### 查询参数

| 参数名           | 类型   | 必填 | 默认值 | 说明                   |
| ---------------- | ------ | ---- | ------ | ---------------------- |
| `page`           | number | ❌   | 1      | 页码（从 1 开始）      |
| `pageSize`       | number | ❌   | 20     | 每页数量（最大 100）   |
| `property_name`  | string | ❌   | -      | 楼盘名称（模糊匹配）   |
| `viewing_status` | number | ❌   | -      | 带看状态（1-4）        |
| `business_type`  | string | ❌   | -      | 业务类型               |
| `viewer_name`    | string | ❌   | -      | 带看人                 |
| `date_from`      | string | ❌   | -      | 开始日期（YYYY-MM-DD） |
| `date_to`        | string | ❌   | -      | 结束日期（YYYY-MM-DD） |

### 请求示例

```bash
GET /api/external/viewing-records/agent_user_12345?page=1&pageSize=10&property_name=万科&viewing_status=2&date_from=2024-01-01&date_to=2024-12-31
```

### 响应结果

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 456,
        "customer_id": 123,
        "viewing_time": "2024-08-15T14:00:00.000Z",
        "property_name": "万科城",
        "property_address": "1栋2单元301室",
        "room_type": "two_bedroom",
        "room_tag": "loft",
        "viewer_name": "external",
        "viewing_status": 2,
        "commission": 3000,
        "viewing_feedback": 1,
        "business_type": "whole_rent",
        "notes": "客户很满意，准备签约",
        "customer_name": "李四",
        "customer_phone": "13900139000",
        "userId": "agent_user_67890",
        "botId": "bot_002",
        "housingId": 101,
        "houseAreaId": 201,
        "houseAreaName": "南山区",
        "cityId": 301,
        "cityName": "深圳市",
        "propertyAddrId": 789,
        "unitType": "2室1厅",
        "longitude": "114.0579",
        "latitude": "22.5431",
        "roomId": 401,
        "advisorId": 501,
        "advisorName": "王顾问",
        "companyName": "万科地产",
        "companyAbbreviation": "万科",
        "houseTypeId": 601,
        "created_at": "2024-08-15T10:00:00.000Z",
        "updated_at": "2024-08-15T10:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

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

### 带看状态 (viewing_status)

| 状态值 | 状态名称 | 说明           |
| ------ | -------- | -------------- |
| 1      | 待确认   | 带看时间待确认 |
| 2      | 已确认   | 带看时间已确认 |
| 3      | 已取消   | 带看已取消     |
| 4      | 已带看   | 已完成带看     |

### 带看反馈 (viewing_feedback)

| 状态值 | 状态名称 | 说明         |
| ------ | -------- | ------------ |
| 0      | 未成交   | 带看后未成交 |
| 1      | 已成交   | 带看后已成交 |

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

## 🧪 测试示例

### curl 命令样例

#### 1. 客户数据录入接口

```bash
# 创建新客户
curl -X POST https://your-domain.com/api/external/customers \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "agent_user_12345",
    "botId": "bot_001",
    "nickname": "小张",
    "name": "张三",
    "phone": "13800138000",
    "status": 1,
    "community": "万科城",
    "business_type": "whole_rent",
    "room_type": "two_bedroom",
    "room_tags": "[\"loft\", \"two_bath\"]",
    "move_in_date": "2024-09-01",
    "lease_period": 12,
    "price_range": "5000-8000",
    "source_channel": "referral",
    "internal_notes": "来自Agent系统推送"
  }'

# 更新现有客户（相同userId）
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

#### 2. 带看记录录入接口

```bash
# 自动房源查询示例
curl -X POST https://your-domain.com/api/external/viewing-records \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "agent_user_67890",
    "botId": "bot_002",
    "customer_name": "李四",
    "customer_phone": "13900139000",
    "viewing_time": "2024-08-15T14:00:00.000Z",
    "property_name": "万科城",
    "property_address": "1栋2单元301室",
    "room_type": "two_bedroom",
    "room_tag": "loft",
    "viewer_name": "external",
    "viewing_status": 2,
    "commission": 3000,
    "viewing_feedback": 1,
    "business_type": "whole_rent",
    "notes": "客户很满意，准备签约"
  }'
```

#### 3. 用户带看记录查询接口

```bash
# 基础查询
curl -X GET "https://your-domain.com/api/external/viewing-records/agent_user_12345"

# 带筛选条件的查询
curl -X GET "https://your-domain.com/api/external/viewing-records/agent_user_12345?page=1&pageSize=10&property_name=万科&viewing_status=2&date_from=2024-01-01&date_to=2024-12-31"

# 使用jq解析响应
curl -s -X GET "https://your-domain.com/api/external/viewing-records/agent_user_12345" | jq '.data.data | length'
```

---

## 🔧 使用指南

### 推荐使用流程

#### 方案一：先录入客户，再录入带看记录

```
1. POST /api/external/customers (录入客户基础信息)
2. POST /api/external/viewing-records (录入带看记录)
3. GET /api/external/viewing-records/[userId] (查询用户带看记录)
```

#### 方案二：直接录入带看记录（推荐）

```
1. POST /api/external/viewing-records (一次性处理客户和带看记录)
2. GET /api/external/viewing-records/[userId] (查询用户带看记录)
```

### 数据一致性保证

1. **客户信息更新策略**: 使用`COALESCE`函数，只有新值不为空时才更新
2. **统计信息自动计算**: 带看记录创建后自动更新客户的带看次数和总佣金
3. **历史数据快照**: 带看记录中保存客户姓名和电话的快照
4. **客户状态联动**: 根据带看反馈自动更新客户状态

### 错误处理

- **常见错误码**: 400 (参数验证失败), 500 (服务器内部错误)
- **重试策略**: 建议指数退避重试，最大重试次数 3 次，重试间隔 1s, 2s, 4s

### 性能建议

1. **批量操作**: 控制并发请求数量（不超过 10 个/秒）
2. **数据完整性**: 尽量提供完整的字段信息，避免频繁更新
3. **幂等性**: 相同的 userId 可以重复调用，系统会智能判断创建或更新

---

## ❓ 常见问题

### Q1: 如何处理重复的客户数据？

A: 系统使用 `userId` 作为唯一标识，相同 `userId` 的请求会自动更新现有客户信息，不会创建重复记录。

### Q2: 带看记录重复录入会怎样？

A: 系统会检查 `userId + property_address` 组合，如果发现重复记录会自动更新现有记录，不会创建重复数据。

### Q3: 外部房源查询失败会影响带看记录创建吗？

A: 不会。外部房源查询失败时，系统会使用原始传入的数据创建带看记录，确保业务连续性。

### Q4: 如何确保数据一致性？

A: 系统使用数据库事务和 `COALESCE` 函数确保数据一致性，同时提供详细的日志记录便于问题排查。

### Q5: 支持批量操作吗？

A: 目前接口设计为单条记录操作，建议控制并发请求数量（不超过 10 个/秒）以确保系统稳定性。

### Q6: 如何获取系统统计数据？

A: 使用 `GET /api/external/statistics` 接口可以获取约看数量、客户成交状态统计和佣金总金额等关键业务指标。详细文档请参考《外部统计接口文档》。

---

## 📊 4. 统计数据查询接口

### 基本信息

- **接口地址**: `GET /api/external/statistics`
- **功能描述**: 获取系统统计数据，包括约看数量、客户成交状态统计和佣金总金额
- **数据来源**: 带看记录表和客户表

### 请求参数

| 参数名      | 类型   | 必填 | 默认值 | 说明                       |
| ----------- | ------ | ---- | ------ | -------------------------- |
| `date_from` | string | ❌   | -      | 开始日期，格式：YYYY-MM-DD |
| `date_to`   | string | ❌   | -      | 结束日期，格式：YYYY-MM-DD |

### 响应示例

```json
{
  "success": true,
  "data": {
    "viewing_count": 150,
    "completed_unpaid_count": 25,
    "completed_paid_count": 10,
    "total_commission": 125000.0,
    "period": {
      "date_from": "2024-01-01",
      "date_to": "2024-01-31"
    }
  },
  "message": "统计数据获取成功"
}
```

### 使用示例

```bash
# 查询所有数据（默认）
curl -X GET "http://localhost:3000/api/external/statistics"

# 查询指定时间范围
curl -X GET "http://localhost:3000/api/external/statistics?date_from=2024-01-01&date_to=2024-01-31"
```

> 📖 **详细文档**: 更多详细信息请参考 [外部统计接口文档](./外部统计接口文档.md)

---

## 📞 技术支持

如有技术问题或需要支持，请联系开发团队。

---

_文档版本：v2.0 | 最后更新：2025-01-27_
