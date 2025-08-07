# 带看记录录入接口 API 文档

## 📖 文档目录

- [📄 接口概述](#-接口概述)
- [🔄 核心业务逻辑](#-核心业务逻辑)
- [📝 请求参数](#-请求参数)
- [📊 字段状态说明](#-字段状态说明)
- [📤 响应结果](#-响应结果)
- [📋 业务场景示例](#-业务场景示例)
- [⚠️ 注意事项](#️-注意事项)
- [🧪 测试示例](#-测试示例)
- [❓ 常见问题](#-常见问题)
- [📊 状态码说明](#-状态码说明)

---

## 📄 接口概述

**接口名称**: 带看记录录入接口（智能客户处理 + 房源信息自动查询 + 重复记录智能更新）

**接口地址**: `POST /api/external/viewing-records`

**功能描述**:

- 录入带看记录数据，智能处理客户信息
- 自动查询外部房源详细信息并填充
- 智能检查重复记录并决定创建或更新
- 自动更新客户统计信息

**版本**: v1.0

**更新日期**: 2024-08-15

---

## 🔄 核心业务逻辑

### 1. 客户处理逻辑

- **检查用户**: 根据 `userId` 检查客户是否已存在
- **存在**: 更新客户信息，返回 `customer_action: "updated"`
- **不存在**: 创建新客户，返回 `customer_action: "created"`

### 2. 重复记录检查逻辑

- **有详细地址**: 使用 `userId + property_address` 组合检查
- **无详细地址**: 使用 `userId + property_name + property_address IS NULL` 组合检查
- **存在重复**: 更新现有记录，返回 `viewing_record_action: "updated"`
- **不存在**: 创建新记录，返回 `viewing_record_action: "created"`

### 3. 外部房源信息查询

- 根据 `property_name` 和 `property_address` 自动查询外部房源 API
- 成功获取房源信息时自动填充相关字段
- 查询失败不影响带看记录的正常创建

---

## 📝 请求参数

### 请求头

```
Content-Type: application/json
```

### 请求体参数

#### 基础信息字段

| 参数名           | 类型   | 必填 | 默认值   | 说明                             |
| ---------------- | ------ | ---- | -------- | -------------------------------- |
| `userId`         | string | ✅   | -        | 用户第三方唯一标识 ID            |
| `botId`          | string | ❌   | -        | 机器人/工作人员账号 ID           |
| `customer_name`  | string | ❌   | -        | 客户姓名（同时用作客户昵称）     |
| `customer_phone` | string | ❌   | -        | 客户电话（格式：1[3-9]xxxxxxxx） |
| `viewing_time`   | string | ❌   | 当前时间 | 带看时间（ISO 8601 格式）        |

#### 房源信息字段

| 参数名             | 类型   | 必填 | 默认值        | 说明                                       |
| ------------------ | ------ | ---- | ------------- | ------------------------------------------ |
| `property_name`    | string | ✅   | -             | 物业地址（用于外部房源查询和客户咨询小区） |
| `property_address` | string | ❌   | -             | 详细地址（用于外部房源精确查询和重复检查） |
| `room_type`        | string | ❌   | 'one_bedroom' | 房型类型                                   |
| `room_tag`         | string | ❌   | -             | 房型标签                                   |

#### 带看信息字段

| 参数名             | 类型   | 必填 | 默认值       | 说明             |
| ------------------ | ------ | ---- | ------------ | ---------------- |
| `viewer_name`      | string | ❌   | 'external'   | 带看人类型       |
| `viewing_status`   | number | ❌   | 1            | 带看状态         |
| `commission`       | number | ❌   | 0            | 佣金（单位：分） |
| `viewing_feedback` | number | ❌   | -            | 带看反馈         |
| `business_type`    | string | ❌   | 'whole_rent' | 业务类型         |
| `notes`            | string | ❌   | -            | 带看备注         |

#### 扩展房源字段（可被外部查询自动填充）

| 参数名                | 类型   | 必填 | 说明        |
| --------------------- | ------ | ---- | ----------- |
| `housingId`           | number | ❌   | 房源 ID     |
| `houseAreaId`         | number | ❌   | 区域 ID     |
| `houseAreaName`       | string | ❌   | 区域名称    |
| `cityId`              | number | ❌   | 城市 ID     |
| `cityName`            | string | ❌   | 城市名称    |
| `propertyAddrId`      | number | ❌   | 物业地址 ID |
| `unitType`            | string | ❌   | 户型描述    |
| `longitude`           | string | ❌   | 经度        |
| `latitude`            | string | ❌   | 纬度        |
| `roomId`              | number | ❌   | 房间 ID     |
| `advisorId`           | number | ❌   | 顾问 ID     |
| `advisorName`         | string | ❌   | 顾问姓名    |
| `companyName`         | string | ❌   | 公司名称    |
| `companyAbbreviation` | string | ❌   | 公司简称    |
| `houseTypeId`         | number | ❌   | 房型 ID     |

---

## 📊 字段状态说明

### room_type (房型类型)

| 值                  | 中文名称   | 说明           |
| ------------------- | ---------- | -------------- |
| `one_bedroom`       | 一居室     | 单独卧室       |
| `two_bedroom`       | 两居室     | 两个卧室       |
| `three_bedroom`     | 三居室     | 三个卧室       |
| `four_plus_bedroom` | 四居及以上 | 四个或更多卧室 |
| `master_room`       | 主卧       | 主卧室         |
| `second_room`       | 次卧       | 次卧室         |

### room_tag (房型标签)

| 值             | 中文名称 | 说明       |
| -------------- | -------- | ---------- |
| `studio`       | 开间     | 开放式房间 |
| `loft`         | Loft     | 复式结构   |
| `flat`         | 平层     | 平层结构   |
| `two_bathroom` | 两卫     | 两个卫生间 |
| `bungalow`     | 平房     | 单层建筑   |

### viewer_name (带看人类型)

| 值               | 中文名称 | 说明             |
| ---------------- | -------- | ---------------- |
| `internal`       | 内部管家 | 公司内部工作人员 |
| `external`       | 外部管家 | 外部合作管家     |
| `external_sales` | 外销管家 | 外部销售人员     |
| `creator`        | 录入人   | 数据录入人员     |

### viewing_status (带看状态)

| 值  | 中文名称 | 颜色 | 说明             |
| --- | -------- | ---- | ---------------- |
| `1` | 待确认   | 蓝色 | 已预约，等待确认 |
| `2` | 已确认   | 橙色 | 已确认带看安排   |
| `3` | 已取消   | 红色 | 带看已取消       |
| `4` | 已带看   | 绿色 | 带看已完成       |

### viewing_feedback (带看反馈)

| 值  | 中文名称 | 颜色 | 说明         |
| --- | -------- | ---- | ------------ |
| `0` | 未成交   | 红色 | 带看后未成交 |
| `1` | 已成交   | 绿色 | 带看后已成交 |

### business_type (业务类型)

| 值            | 中文名称 | 说明         |
| ------------- | -------- | ------------ |
| `whole_rent`  | 整租     | 整套房屋出租 |
| `centralized` | 集中式   | 集中式公寓   |
| `shared_rent` | 合租     | 合租房屋     |

### customer_action (客户操作类型)

| 值        | 说明         |
| --------- | ------------ |
| `created` | 新创建客户   |
| `updated` | 更新现有客户 |

### viewing_record_action (带看记录操作类型)

| 值        | 说明             |
| --------- | ---------------- |
| `created` | 新创建带看记录   |
| `updated` | 更新现有带看记录 |

---

## 📤 响应结果

### 成功响应格式

```json
{
  "success": true,
  "data": {
    "viewing_record_id": 456,
    "customer_id": 123,
    "customer_action": "created",
    "viewing_record_action": "created",
    "userId": "agent_user_12345",
    "external_property_enriched": true,
    "external_property_data": {
      "propertyAddrId": 12345,
      "housingId": 5678,
      "cityName": "深圳市",
      "houseAreaName": "南山区",
      "advisorId": 2001,
      "advisorName": "王经理",
      "companyName": "XX房产公司"
    }
  },
  "message": "带看记录录入成功，客户已创建，已自动填入外部房源信息"
}
```

### 响应字段说明

| 字段                              | 类型        | 说明                                |
| --------------------------------- | ----------- | ----------------------------------- |
| `success`                         | boolean     | 请求是否成功                        |
| `data.viewing_record_id`          | number      | 带看记录 ID                         |
| `data.customer_id`                | number      | 客户 ID                             |
| `data.customer_action`            | string      | 客户操作类型（created/updated）     |
| `data.viewing_record_action`      | string      | 带看记录操作类型（created/updated） |
| `data.userId`                     | string      | 用户 ID                             |
| `data.external_property_enriched` | boolean     | 是否成功获取外部房源信息            |
| `data.external_property_data`     | object/null | 外部房源数据（成功时返回）          |
| `message`                         | string      | 响应消息                            |

### 错误响应格式

```json
{
  "success": false,
  "error": "userId为必填字段",
  "message": "请求数据验证失败"
}
```

---

## 📋 业务场景示例

### 场景 1: 全新用户首次录入

**请求**:

```json
{
  "userId": "new_user_001",
  "customer_name": "张三",
  "customer_phone": "13800138000",
  "property_name": "阳光小区",
  "property_address": "南山区深南大道123号",
  "room_type": "two_bedroom",
  "viewing_status": 2,
  "commission": 3000
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "customer_action": "created",
    "viewing_record_action": "created",
    "external_property_enriched": true
  },
  "message": "带看记录录入成功，客户已创建，已自动填入外部房源信息"
}
```

### 场景 2: 现有用户新地址

**请求**:

```json
{
  "userId": "existing_user_001",
  "property_name": "新的小区",
  "property_address": "新的地址456号",
  "commission": 4000
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "customer_action": "updated",
    "viewing_record_action": "created",
    "external_property_enriched": false
  },
  "message": "带看记录录入成功，客户已更新"
}
```

### 场景 3: 现有用户相同地址（重复记录更新）

**请求**:

```json
{
  "userId": "existing_user_001",
  "property_name": "阳光小区",
  "property_address": "南山区深南大道123号",
  "viewing_status": 4,
  "viewing_feedback": 1,
  "commission": 5000
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "customer_action": "updated",
    "viewing_record_action": "updated",
    "external_property_enriched": true
  },
  "message": "带看记录更新成功，客户已更新，已自动填入外部房源信息"
}
```

---

## ⚠️ 注意事项

### 数据验证

1. **必填字段**: `userId` 和 `property_name` 为必填字段
2. **手机号格式**: 支持中国大陆手机号格式 `1[3-9]xxxxxxxx`
3. **时间格式**: `viewing_time` 支持 ISO 8601 格式
4. **数值范围**: `commission` 建议使用分为单位

### 重复检查逻辑

1. **客户重复检查**: 仅基于 `userId` 进行检查
2. **带看记录重复检查**: 基于 `userId + property_address` 组合
3. **无详细地址情况**: 使用 `userId + property_name` 且 `property_address IS NULL`

### 外部房源查询

1. **查询条件**: 需要提供 `property_name`，`property_address` 可选
2. **查询失败**: 不影响带看记录的正常创建
3. **数据优先级**: 外部查询数据优先于手动传入数据

### 错误处理

1. **数据验证失败**: 返回 400 状态码和具体错误信息
2. **数据库错误**: 返回 500 状态码和通用错误信息
3. **外部 API 错误**: 记录日志但不影响主流程

---

## 🧪 测试示例

### cURL 测试命令

```bash
# 基础测试 - 创建新用户和带看记录
curl -X POST http://localhost:3000/api/external/viewing-records \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_001",
    "customer_name": "测试用户",
    "customer_phone": "13800138000",
    "property_name": "测试小区",
    "property_address": "测试地址123号",
    "room_type": "two_bedroom",
    "viewing_status": 2,
    "commission": 3000,
    "notes": "测试创建新记录"
  }'

# 重复测试 - 更新现有记录
curl -X POST http://localhost:3000/api/external/viewing-records \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_001",
    "property_name": "测试小区",
    "property_address": "测试地址123号",
    "viewing_status": 4,
    "viewing_feedback": 1,
    "commission": 5000,
    "notes": "测试更新现有记录"
  }'
```

### JavaScript 测试代码

```javascript
// 测试函数
async function testViewingRecordAPI() {
  const baseUrl = 'http://localhost:3000';
  
  // 测试数据
  const testData = {
    userId: 'js_test_user_001',
    customer_name: '张三',
    customer_phone: '13900139000',
    property_name: '阳光花园',
    property_address: '南山区深南大道999号',
    room_type: 'two_bedroom',
    viewing_status: 2,
    commission: 4000,
    business_type: 'whole_rent',
    notes: 'JavaScript测试'
  };
  
  try {
    const response = await fetch(`${baseUrl}/api/external/viewing-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log('响应状态:', response.status);
    console.log('响应结果:', result);
    
    return result;
  } catch (error) {
    console.error('请求失败:', error);
  }
}

// 运行测试
testViewingRecordAPI();
```

---

## ❓ 常见问题

### Q1: 如何处理重复的带看记录？

**A**: 系统会根据 `userId + property_address` 组合自动检查重复记录：
- 如果发现重复，会更新现有记录而不是创建新记录
- 响应中的 `viewing_record_action` 字段会显示 `"updated"`
- 如果没有 `property_address`，会使用 `userId + property_name` 组合检查

### Q2: 外部房源查询失败会影响录入吗？

**A**: 不会影响。外部房源查询失败时：
- 带看记录仍会正常创建/更新
- `external_property_enriched` 字段会返回 `false`
- `external_property_data` 字段会返回 `null`
- 手动传入的房源字段仍会被保存

### Q3: 如何判断客户是新创建还是更新的？

**A**: 通过响应中的 `customer_action` 字段：
- `"created"`: 表示新创建了客户
- `"updated"`: 表示更新了现有客户

### Q4: 佣金字段应该使用什么单位？

**A**: 建议使用**分**为单位，例如：
- 30元 = 3000分
- 150元 = 15000分
- 这样可以避免浮点数精度问题

### Q5: viewing_time 字段支持哪些时间格式？

**A**: 支持 ISO 8601 格式，例如：
- `"2024-08-15T14:30:00.000Z"` (UTC时间)
- `"2024-08-15T14:30:00+08:00"` (带时区)
- 如果不提供，系统会使用当前时间

### Q6: 手机号格式有什么要求？

**A**: 支持中国大陆手机号：
- 格式：`1[3-9]xxxxxxxx`
- 例如：`13800138000`、`15900159000`
- 不支持：座机号、国外手机号

### Q7: 如何处理数据验证错误？

**A**: 系统会返回详细的错误信息：
```json
{
  "success": false,
  "error": "具体错误描述",
  "message": "请求数据验证失败"
}
```
常见验证错误：
- `userId为必填字段`
- `property_name为必填字段`
- `手机号格式不正确`

---

## 📊 状态码说明

| HTTP状态码 | 说明 | 示例场景 |
|-----------|------|---------|
| `200` | 成功 | 正常录入/更新 |
| `201` | 创建成功 | 新建带看记录 |
| `400` | 请求错误 | 参数验证失败 |
| `500` | 服务器错误 | 数据库连接失败 |

---

## 🔗 相关接口

- [客户管理接口](./客户管理接口文档.md)
- [带看记录查询接口](./带看记录查询接口文档.md)
- [外部房源查询接口](./外部房源查询接口文档.md)

---

## 📝 更新日志

### v1.0 (2024-08-15)
- ✅ 初始版本发布
- ✅ 支持智能客户处理
- ✅ 支持外部房源信息自动查询
- ✅ 支持重复记录智能检查和更新
- ✅ 完整的字段状态说明
- ✅ 详细的业务场景示例

---

## 📞 技术支持

如有疑问，请联系技术支持团队。

**接口负责人**: CRM系统开发团队  
**文档版本**: v1.0  
**最后更新**: 2024-08-15  
**下次更新**: 根据需求变更
