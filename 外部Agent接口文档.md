# 外部 Agent 接口文档

> 文档更新时间：2025-08-06  
> 接口版本：v1.1 🆕  
> 适用于：外部 Agent 系统数据录入  
> 🆕 新增功能：外部房源信息自动查询

---

## 📋 接口概览

本文档描述了为外部 Agent 系统提供的数据录入和查询接口，用于向 CRM 系统录入客户数据、带看记录数据以及查询用户的带看记录。

| 接口             | 方法 | 路径                                     | 功能描述                       |
| ---------------- | ---- | ---------------------------------------- | ------------------------------ |
| 客户数据录入     | POST | `/api/external/customers`                | 录入或更新客户信息             |
| 带看记录录入     | POST | `/api/external/viewing-records`          | 录入带看记录并智能处理客户数据 |
| 用户带看记录查询 | GET  | `/api/external/viewing-records/[userId]` | 根据用户 ID 查询带看记录信息   |

---

## 🏢 1. 客户数据录入接口

### 基本信息

- **接口地址**: `POST /api/external/customers`
- **功能描述**: 根据 userId 录入或更新客户信息
- **业务逻辑**:
  - 如果 userId 对应的客户已存在，则更新客户信息
  - 如果客户不存在，则创建新客户
- **返回格式**: JSON

### 请求参数

#### 请求头

```
Content-Type: application/json
```

#### 请求体参数

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

#### 请求示例

```json
{
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
}
```

### 响应结果

#### 成功响应

```json
{
  "success": true,
  "data": {
    "id": 123,
    "userId": "agent_user_12345",
    "action": "created" // 或 "updated"
  },
  "message": "新客户创建成功" // 或 "客户数据更新成功"
}
```

#### 错误响应

```json
{
  "success": false,
  "error": "userId为必填字段",
  "message": "请求数据验证失败"
}
```

---

## 👁️ 2. 带看记录录入接口（智能客户处理 + 房源信息自动查询 + 重复记录智能更新）

### 基本信息

- **接口地址**: `POST /api/external/viewing-records`
- **功能描述**: 录入带看记录数据，自动处理客户信息，并智能查询房源详细信息
- **🆕 新功能**: **外部房源信息自动查询**
  - 根据 `property_name`（物业地址）和 `property_address`（详细地址）自动调用外部房源查询 API
  - 自动填充房源详细信息到带看记录中（如城市、区域、顾问、公司等信息）
  - 查询失败不影响带看记录的正常创建
- **🆕 智能重复检查与更新**:
  - **客户处理**: 根据 `userId` 检查客户是否存在，不存在则自动创建，存在则更新客户信息
  - **带看记录去重**: 根据 `userId + property_address` 组合检查是否已存在相同带看记录
    - 如果存在相同记录，则**更新现有记录**而不是创建新记录
    - 如果不存在，则创建新的带看记录
    - 如果没有 `property_address`，则使用 `userId + property_name` 组合进行检查
- **业务逻辑**:
  1. 接收带看记录数据
  2. 根据 userId 查找客户
  3. 如果客户存在，从带看数据中提取信息更新客户
  4. 如果客户不存在，从带看数据中提取信息创建客户
  5. **🆕 检查重复带看记录**（根据 userId + property_address 组合）
  6. **🆕 自动查询外部房源信息**（根据物业地址和详细地址）
  7. **🆕 合并房源信息**（优先使用外部查询到的数据）
  8. **🆕 智能创建或更新带看记录**
  9. 更新客户统计信息
- **返回格式**: JSON

### 请求参数

#### 请求头

```
Content-Type: application/json
```

#### 请求体参数

| 参数名                   | 类型   | 必填 | 默认值        | 说明                                                    |
| ------------------------ | ------ | ---- | ------------- | ------------------------------------------------------- |
| **基础信息**             |
| `userId`                 | string | ✅   | -             | 用户第三方唯一标识 ID                                   |
| `botId`                  | string | ❌   | -             | 机器人/工作人员账号 ID                                  |
| `customer_name`          | string | ❌   | -             | 客户姓名（同时用作客户昵称）                            |
| `customer_phone`         | string | ❌   | -             | 客户电话（格式：1[3-9]xxxxxxxx）                        |
| `viewing_time`           | string | ❌   | 当前时间      | 带看时间（ISO 格式）                                    |
| **房源信息**             |
| `property_name`          | string | ✅   | -             | 物业地址（同时作为客户咨询小区）**🆕 用于外部房源查询** |
| `property_address`       | string | ❌   | -             | 详细地址 **🆕 用于外部房源精确查询**                    |
| `room_type`              | string | ❌   | 'one_bedroom' | 房型                                                    |
| `room_tag`               | string | ❌   | -             | 房型标签                                                |
| **带看信息**             |
| `viewer_name`            | string | ❌   | 'external'    | 带看人类型（internal/external/external_sales/creator）  |
| `viewing_status`         | number | ❌   | 1             | 带看状态（1-4：待确认/已确认/已取消/已带看）            |
| `commission`             | number | ❌   | 0             | 佣金                                                    |
| `viewing_feedback`       | number | ❌   | -             | 带看反馈（0/1：未成交/已成交）                          |
| `business_type`          | string | ❌   | 'whole_rent'  | 业务类型                                                |
| `notes`                  | string | ❌   | -             | 带看备注                                                |
| **扩展信息（房源详情）** |        |      |               | **🆕 以下字段可被外部房源查询自动填充**                 |
| `housingId`              | number | ❌   | -             | 房源 ID                                                 |
| `houseAreaId`            | number | ❌   | -             | 区域 ID                                                 |
| `houseAreaName`          | string | ❌   | -             | 区域名称                                                |
| `cityId`                 | number | ❌   | -             | 城市 ID                                                 |
| `cityName`               | string | ❌   | -             | 城市名称                                                |
| `propertyAddrId`         | number | ❌   | -             | 物业地址 ID                                             |
| `unitType`               | string | ❌   | -             | 户型描述                                                |
| `longitude`              | string | ❌   | -             | 经度                                                    |
| `latitude`               | string | ❌   | -             | 纬度                                                    |
| `roomId`                 | number | ❌   | -             | 房间 ID                                                 |
| `advisorId`              | number | ❌   | -             | 顾问 ID                                                 |
| `advisorName`            | string | ❌   | -             | 顾问姓名                                                |
| `companyName`            | string | ❌   | -             | 公司名称                                                |
| `companyAbbreviation`    | string | ❌   | -             | 公司简称                                                |
| `houseTypeId`            | number | ❌   | -             | 房型 ID                                                 |

> **💡 智能填充说明**：
>
> - 如果您在请求中提供了上述房源详情字段，系统将直接使用您提供的数据
> - 如果您未提供某些字段，系统会根据 `property_name` 和 `property_address` 自动调用外部房源查询 API
> - 外部查询到的数据会自动填充到空字段中，已有数据不会被覆盖
> - 外部查询失败不影响带看记录的正常创建

#### 客户数据自动映射逻辑

| 客户表字段       | 来源（带看记录字段） | 映射逻辑                |
| ---------------- | -------------------- | ----------------------- |
| `userId`         | `userId`             | 直接映射                |
| `botId`          | `botId`              | 直接映射                |
| `nickname`       | `customer_name`      | 客户姓名作为昵称        |
| `name`           | `customer_name`      | 直接映射                |
| `phone`          | `customer_phone`     | 直接映射                |
| `community`      | `property_name`      | 物业地址作为咨询小区    |
| `business_type`  | `business_type`      | 直接映射                |
| `room_type`      | `room_type`          | 直接映射                |
| `room_tags`      | `room_tag`           | 转换为 JSON 数组格式    |
| `source_channel` | -                    | 固定为'referral'        |
| `creator`        | -                    | 固定为'外部 Agent 系统' |
| `internal_notes` | 多字段组合           | 自动生成备注信息        |

#### 请求示例

```json
{
  "userId": "agent_user_12345",
  "botId": "bot_001",
  "customer_name": "李四",
  "customer_phone": "13900139000",
  "viewing_time": "2024-08-15T14:00:00.000Z",
  "property_name": "阳光城市花园",
  "property_address": "南山区深南大道1001号",
  "room_type": "two_bedroom",
  "room_tag": "loft",
  "viewer_name": "external",
  "viewing_status": 2,
  "commission": 3000,
  "viewing_feedback": 1,
  "business_type": "whole_rent",
  "notes": "客户很满意，准备签约",
  "housingId": 10001,
  "houseAreaId": 5001,
  "houseAreaName": "南山中心区",
  "cityId": 1,
  "cityName": "深圳市",
  "longitude": "113.9298",
  "latitude": "22.5309",
  "advisorId": 2001,
  "advisorName": "王经理",
  "companyName": "深圳地产公司",
  "companyAbbreviation": "深地产"
}
```

### 响应结果

#### 成功响应

```json
{
  "success": true,
  "data": {
    "viewing_record_id": 456,
    "customer_id": 123,
    "customer_action": "created", // 或 "updated"
    "viewing_record_action": "created", // 🆕 或 "updated" - 表示带看记录是新建还是更新
    "userId": "agent_user_12345",
    "external_property_enriched": true, // 🆕 是否成功获取外部房源信息
    "external_property_data": {
      // 🆕 外部房源数据（仅在查询成功时返回）
      "propertyAddrId": 12345,
      "housingId": 5678,
      "cityName": "深圳市",
      "houseAreaName": "南山区",
      "advisorId": 2001,
      "advisorName": "王经理",
      "companyName": "XX房产公司"
    }
  },
  "message": "带看记录录入成功，客户已创建，已自动填入外部房源信息" // 🆕 动态消息反映实际操作
}
```

#### 🆕 外部房源查询状态说明

| 字段                         | 类型    | 说明                                 |
| ---------------------------- | ------- | ------------------------------------ |
| `external_property_enriched` | boolean | 是否成功从外部 API 获取到房源信息    |
| `external_property_data`     | object  | 外部查询到的房源数据（仅成功时返回） |

**查询状态示例：**

1. **查询成功**：`external_property_enriched: true`，包含 `external_property_data`
2. **查询失败/无数据**：`external_property_enriched: false`，`external_property_data: null`
3. **网络错误**：`external_property_enriched: false`，带看记录正常创建

#### 🆕 重复记录检查与更新逻辑

| 字段                    | 类型   | 说明                                         |
| ----------------------- | ------ | -------------------------------------------- |
| `customer_action`       | string | 客户操作类型：`"created"` 或 `"updated"`     |
| `viewing_record_action` | string | 带看记录操作类型：`"created"` 或 `"updated"` |

**重复检查逻辑：**

1. **客户检查**：根据 `userId` 检查是否已存在客户

   - 存在：更新客户信息，`customer_action: "updated"`
   - 不存在：创建新客户，`customer_action: "created"`

2. **带看记录检查**：根据 `userId + property_address` 组合检查重复记录
   - 如果提供了 `property_address`：使用 `userId + property_address` 检查
   - 如果未提供 `property_address`：使用 `userId + property_name + property_address IS NULL` 检查
   - 存在：更新现有记录，`viewing_record_action: "updated"`
   - 不存在：创建新记录，`viewing_record_action: "created"`

**示例场景：**

1. **全新用户首次录入**：`customer_action: "created"`, `viewing_record_action: "created"`
2. **现有用户新地址**：`customer_action: "updated"`, `viewing_record_action: "created"`
3. **现有用户相同地址**：`customer_action: "updated"`, `viewing_record_action: "updated"`

#### 错误响应

```json
{
  "success": false,
  "error": "userId为必填字段",
  "message": "请求数据验证失败"
}
```

---

## 🔍 3. 用户带看记录查询接口

### 基本信息

- **接口地址**: `GET /api/external/viewing-records/[userId]`
- **功能描述**: 根据用户 ID 查询该用户的所有带看记录信息
- **支持功能**:
  - 分页查询
  - 多维度筛选（房源名称、带看状态、业务类型、带看人类型、时间范围）
  - 同时返回用户基本信息（如果存在客户记录）
- **返回格式**: JSON

### 请求参数

#### 路径参数

| 参数名   | 类型   | 必填 | 说明                  |
| -------- | ------ | ---- | --------------------- |
| `userId` | string | ✅   | 用户第三方唯一标识 ID |

#### 查询参数（URL 参数）

| 参数名           | 类型   | 必填 | 默认值 | 说明                                                   |
| ---------------- | ------ | ---- | ------ | ------------------------------------------------------ |
| `page`           | number | ❌   | 1      | 页码（从 1 开始）                                      |
| `pageSize`       | number | ❌   | 20     | 每页记录数（最大 100）                                 |
| `property_name`  | string | ❌   | -      | 房源名称（模糊匹配）                                   |
| `viewing_status` | number | ❌   | -      | 带看状态（1=待确认/2=已确认/3=已取消/4=已带看）        |
| `business_type`  | string | ❌   | -      | 业务类型（whole_rent/shared_rent/centralized）         |
| `viewer_name`    | string | ❌   | -      | 带看人类型（internal/external/external_sales/creator） |
| `date_from`      | string | ❌   | -      | 开始时间（YYYY-MM-DD 格式）                            |
| `date_to`        | string | ❌   | -      | 结束时间（YYYY-MM-DD 格式）                            |

#### 请求示例

```bash
# 基础查询
GET /api/external/viewing-records/agent_user_12345

# 分页查询
GET /api/external/viewing-records/agent_user_12345?page=2&pageSize=10

# 筛选查询
GET /api/external/viewing-records/agent_user_12345?property_name=万科城&viewing_status=4&date_from=2024-08-01&date_to=2024-08-31

# 复合查询
GET /api/external/viewing-records/agent_user_12345?business_type=whole_rent&viewer_name=external&page=1&pageSize=50
```

### 响应结果

#### 成功响应

```json
{
  "success": true,
  "data": {
    "viewing_records": [
      {
        "id": 456,
        "customer_id": 123,
        "viewing_time": "2024-08-15T14:00:00.000Z",
        "property_name": "万科城",
        "property_address": "1栋2单元301室",
        "room_type": "two_bedroom",
        "room_tag": "loft",
        "viewer_name": "external",
        "viewing_status": 4,
        "commission": 3000.0,
        "viewing_feedback": 1,
        "business_type": "whole_rent",
        "notes": "客户很满意，已签约",
        "customer_name": "李四",
        "customer_phone": "13900139000",
        "userId": "agent_user_12345",
        "botId": "bot_001",
        // 房源扩展信息
        "housingId": 10001,
        "houseAreaId": 5001,
        "houseAreaName": "南山中心区",
        "cityId": 1,
        "cityName": "深圳市",
        "propertyAddrId": 12345,
        "unitType": "两室一厅",
        "longitude": "113.9298",
        "latitude": "22.5309",
        "roomId": 20001,
        "advisorId": 3001,
        "advisorName": "王经理",
        "companyName": "深圳地产公司",
        "companyAbbreviation": "深地产",
        "houseTypeId": 101,
        "created_at": "2024-08-15T14:30:00.000Z",
        "updated_at": "2024-08-15T14:30:00.000Z"
      }
      // ... 更多记录
    ],
    "customer_info": {
      "id": 123,
      "userId": "agent_user_12345",
      "nickname": "李四",
      "name": "李四",
      "phone": "13900139000",
      "community": "万科城",
      "business_type": "whole_rent",
      "room_type": "two_bedroom",
      "status": 1,
      "source_channel": "referral",
      "viewing_count": 5,
      "total_commission": 15000.0,
      "created_at": "2024-08-01T10:00:00.000Z",
      "updated_at": "2024-08-15T14:30:00.000Z"
    },
    "pagination": {
      "total": 5,
      "page": 1,
      "pageSize": 20,
      "totalPages": 1
    },
    "userId": "agent_user_12345"
  },
  "message": "查询成功，找到5条带看记录"
}
```

#### 数据字段说明

##### 带看记录字段 (viewing_records)

| 字段名                | 类型   | 说明                               |
| --------------------- | ------ | ---------------------------------- |
| `id`                  | number | 带看记录 ID                        |
| `customer_id`         | number | 客户 ID（可能为空）                |
| `viewing_time`        | string | 带看时间（ISO 格式）               |
| `property_name`       | string | 房源名称                           |
| `property_address`    | string | 房源地址                           |
| `room_type`           | string | 房型类型                           |
| `room_tag`            | string | 房型标签                           |
| `viewer_name`         | string | 带看人类型                         |
| `viewing_status`      | number | 带看状态（1-4）                    |
| `commission`          | number | 佣金金额                           |
| `viewing_feedback`    | number | 带看反馈（0=未成交/1=已成交）      |
| `business_type`       | string | 业务类型                           |
| `notes`               | string | 备注                               |
| `customer_name`       | string | 客户姓名（历史快照）               |
| `customer_phone`      | string | 客户电话（历史快照）               |
| `userId`              | string | 用户第三方 ID                      |
| `botId`               | string | 机器人/工作人员 ID                 |
| **房源扩展信息**      |        | **以下为房源详细信息（可能为空）** |
| `housingId`           | number | 房源 ID                            |
| `houseAreaId`         | number | 区域 ID                            |
| `houseAreaName`       | string | 区域名称                           |
| `cityId`              | number | 城市 ID                            |
| `cityName`            | string | 城市名称                           |
| `propertyAddrId`      | number | 物业地址 ID                        |
| `unitType`            | string | 户型描述                           |
| `longitude`           | string | 经度                               |
| `latitude`            | string | 纬度                               |
| `roomId`              | number | 房间 ID                            |
| `advisorId`           | number | 顾问 ID                            |
| `advisorName`         | string | 顾问姓名                           |
| `companyName`         | string | 公司名称                           |
| `companyAbbreviation` | string | 公司简称                           |
| `houseTypeId`         | number | 房型 ID                            |
| `created_at`          | string | 创建时间                           |
| `updated_at`          | string | 更新时间                           |

##### 客户信息字段 (customer_info)

| 字段名             | 类型   | 说明          |
| ------------------ | ------ | ------------- |
| `id`               | number | 客户 ID       |
| `userId`           | string | 用户第三方 ID |
| `nickname`         | string | 客户昵称      |
| `name`             | string | 客户姓名      |
| `phone`            | string | 客户电话      |
| `community`        | string | 咨询小区      |
| `business_type`    | string | 业务类型      |
| `room_type`        | string | 房型偏好      |
| `status`           | number | 客户状态      |
| `source_channel`   | string | 来源渠道      |
| `viewing_count`    | number | 带看次数统计  |
| `total_commission` | number | 总佣金统计    |
| `created_at`       | string | 客户创建时间  |
| `updated_at`       | string | 客户更新时间  |

#### 无数据响应

```json
{
  "success": true,
  "data": {
    "viewing_records": [],
    "customer_info": null,
    "pagination": {
      "total": 0,
      "page": 1,
      "pageSize": 20,
      "totalPages": 0
    },
    "userId": "agent_user_12345"
  },
  "message": "查询成功，找到0条带看记录"
}
```

#### 错误响应

```json
{
  "success": false,
  "error": "userId为必填参数",
  "message": "请求参数验证失败"
}
```

### curl 命令样例

```bash
# 基础查询用户所有带看记录
curl -X GET "http://localhost:3000/api/external/viewing-records/agent_user_12345"

# 分页查询
curl -X GET "http://localhost:3000/api/external/viewing-records/agent_user_12345?page=1&pageSize=10"

# 按房源名称筛选
curl -X GET "http://localhost:3000/api/external/viewing-records/agent_user_12345?property_name=万科城"

# 按带看状态筛选（查询已完成带看的记录）
curl -X GET "http://localhost:3000/api/external/viewing-records/agent_user_12345?viewing_status=4"

# 按时间范围筛选
curl -X GET "http://localhost:3000/api/external/viewing-records/agent_user_12345?date_from=2024-08-01&date_to=2024-08-31"

# 复合筛选查询
curl -X GET "http://localhost:3000/api/external/viewing-records/agent_user_12345?business_type=whole_rent&viewing_status=4&property_name=万科&page=1&pageSize=20"

# 使用jq解析响应
curl -s -X GET "http://localhost:3000/api/external/viewing-records/agent_user_12345" | jq '.data.viewing_records | length'
```

---

## 🔧 接口使用指南

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

#### 方案三：纯查询场景

```
1. GET /api/external/viewing-records/[userId] (查询指定用户的带看记录)
```

### 数据一致性保证

1. **客户信息更新策略**: 使用`COALESCE`函数，只有新值不为空时才更新
2. **统计信息自动计算**: 带看记录创建后自动更新客户的带看次数和总佣金
3. **历史数据快照**: 带看记录中保存客户姓名和电话的快照

### 错误处理

#### 常见错误码

- `400`: 请求参数验证失败
- `500`: 服务器内部错误

#### 重试策略

- 建议指数退避重试
- 最大重试次数：3 次
- 重试间隔：1s, 2s, 4s

### 性能建议

1. **批量操作**: 如需录入大量数据，建议控制并发请求数量（不超过 10 个/秒）
2. **数据完整性**: 尽量提供完整的字段信息，避免频繁更新
3. **幂等性**: 相同的 userId 可以重复调用，系统会智能判断创建或更新

---

### curl 命令样例

#### 1. 客户数据录入接口

```bash
# 创建新客户
curl -X POST http://localhost:3000/api/external/customers \
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
curl -X POST http://localhost:3000/api/external/customers \
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

#### 2. 带看记录录入接口（智能客户处理 + 房源信息自动查询）

```bash
# 🆕 自动房源查询示例 - 只提供物业地址，系统自动查询详细信息
curl -X POST http://localhost:3000/api/external/viewing-records \
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

# 🆕 房源查询 + 手动数据混合 - 系统会优先使用外部查询数据
curl -X POST http://localhost:3000/api/external/viewing-records \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "agent_user_12345",
    "customer_name": "张三",
    "customer_phone": "13800138000",
    "viewing_time": "2024-08-16T10:00:00.000Z",
    "property_name": "华润城",
    "property_address": "3栋A座2001室",
    "room_type": "three_bedroom",
    "room_tag": "复式",
    "viewer_name": "internal",
    "viewing_status": 4,
    "commission": 5000,
    "viewing_feedback": 1,
    "business_type": "centralized",
    "notes": "已完成带看，客户满意度很高",
    "cityName": "深圳市",
    "advisorName": "李经理"
  }'

# 传统模式 - 手动提供所有房源信息（不会触发外部查询）
curl -X POST http://localhost:3000/api/external/viewing-records \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "agent_user_78901",
    "customer_name": "王五",
    "customer_phone": "13700137000",
    "property_name": "保利城",
    "property_address": "南山区科技路500号",
    "room_type": "one_bedroom",
    "commission": 2500,
    "housingId": 10001,
    "houseAreaId": 5001,
    "houseAreaName": "南山中心区",
    "cityId": 1,
    "cityName": "深圳市",
    "longitude": "113.9298",
    "latitude": "22.5309",
    "advisorId": 2001,
    "advisorName": "王经理",
    "companyName": "深圳地产公司",
    "companyAbbreviation": "深地产"
  }'
```

#### 3. 批量操作示例

```bash
# 批量录入多个带看记录
#!/bin/bash

# 数据数组
declare -a viewing_records=(
  '{"userId":"user_001","customer_name":"王五","property_name":"翠竹苑","commission":2000,"viewing_status":1}'
  '{"userId":"user_002","customer_name":"赵六","property_name":"海景花园","commission":3500,"viewing_status":2}'
  '{"userId":"user_003","customer_name":"钱七","property_name":"CBD商务区","commission":4000,"viewing_status":4}'
)

# 循环发送请求
for record in "${viewing_records[@]}"; do
  echo "发送请求: $record"
  curl -X POST http://localhost:3000/api/external/viewing-records \
    -H "Content-Type: application/json" \
    -d "$record"
  echo -e "\n---\n"
  sleep 1  # 控制请求频率
done
```

#### 4. 响应处理示例

```bash
# 处理响应并检查结果
response=$(curl -s -X POST http://localhost:3000/api/external/customers \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "name": "测试用户",
    "phone": "13800138888"
  }')

# 使用jq解析响应
if echo "$response" | jq -e '.success' > /dev/null; then
  echo "✅ 请求成功"
  customer_id=$(echo "$response" | jq -r '.data.id')
  action=$(echo "$response" | jq -r '.data.action')
  echo "客户ID: $customer_id, 操作: $action"
else
  echo "❌ 请求失败"
  error_msg=$(echo "$response" | jq -r '.error // "未知错误"')
  echo "错误信息: $error_msg"
fi
```

---

## 🆕 外部房源查询功能详解

### 功能概述

系统在处理带看记录时，会根据 `property_name`（物业地址）和 `property_address`（详细地址）自动调用外部房源查询 API，获取完整的房源信息并自动填充到带看记录中。

### 查询触发条件

房源查询在以下情况下自动触发：

1. 请求中包含 `property_name` 字段（必填）
2. 系统会使用 `property_name` 和 `property_address`（选填）进行查询

### 查询 API 详情

- **外部 API 地址**: `https://ai-agent-test.quanfangtongvip.com/housing-push/api/housing/search-properties`
- **查询方法**: GET
- **查询参数**:
  - `propertyAddr`: 物业地址名称（必填）
  - `detailAddr`: 详细地址（选填）
  - `limit`: 返回结果数量限制（默认 10 条）
- **超时设置**: 10 秒（防止接口阻塞）

### 数据填充规则

1. **优先级策略**: 手动提供的数据 > 外部查询数据 > 系统默认值
2. **自动填充字段**:
   ```
   housingId          房源ID
   houseAreaId        区域ID
   houseAreaName      区域名称
   cityId             城市ID
   cityName           城市名称
   propertyAddrId     物业地址ID
   unitType           户型描述
   longitude          经度
   latitude           纬度
   roomId             房间ID
   advisorId          顾问ID
   advisorName        顾问姓名
   companyName        公司名称
   companyAbbreviation 公司简称
   houseTypeId        房型ID
   ```

### 错误处理机制

- **网络错误**: 查询失败不影响带看记录创建
- **API 超时**: 10 秒后自动放弃查询，继续处理
- **数据不存在**: 外部 API 未找到匹配房源时，使用原始数据
- **响应异常**: 系统会记录错误日志，但不中断业务流程

### 响应状态说明

每次请求的响应中都会包含外部查询状态：

```json
{
  "external_property_enriched": true, // 是否成功获取外部房源信息
  "external_property_data": {
    // 外部查询到的具体数据
    "propertyAddrId": 12345,
    "housingId": 5678,
    "cityName": "深圳市",
    "houseAreaName": "南山区",
    "advisorName": "王经理",
    "companyName": "XX房产公司"
  }
}
```

### 使用建议

1. **提供准确地址**: 使用规范的物业地址名称可提高查询成功率
2. **检查查询状态**: 通过 `external_property_enriched` 字段监控查询效果
3. **混合数据策略**: 可以手动提供部分字段，让系统自动补充其他信息
4. **日志监控**: 建议监控外部查询的成功率和响应时间

### 实际测试样例

```bash
# 测试外部房源查询功能
curl -X POST http://localhost:3000/api/external/viewing-records \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_001",
    "customer_name": "测试客户",
    "customer_phone": "13800000001",
    "property_name": "万科城",
    "property_address": "1栋2单元301室",
    "room_type": "two_bedroom",
    "commission": 3000,
    "notes": "测试外部房源查询功能"
  }' | jq .

# 查看响应中的外部查询状态
# 成功时会看到 external_property_enriched: true
# 以及 external_property_data 包含查询到的房源信息
```

---

## ❓ 常见问题

### Q1: userId 是什么？

A: userId 是外部系统中用户的唯一标识，用于关联客户数据，确保同一用户在不同时间的数据能正确合并。

### Q2: 如果客户信息发生变化怎么办？

A: 系统支持数据更新，相同 userId 的后续请求会更新现有客户信息。

### Q3: 带看记录录入接口会如何处理客户数据？

A: 系统会自动从带看数据中提取客户相关信息，如客户姓名、电话、咨询小区等，实现智能的客户数据同步。

### Q4: 支持哪些数据格式？

A:

- 时间格式：ISO 8601 (如: "2024-08-15T14:00:00.000Z")
- 电话格式：中国大陆手机号 (如: "13800138000")
- 价格范围：字符串格式 (如: "5000-8000")

### Q5: 如何处理并发请求？

A: 系统内置了请求日志和错误处理机制，支持适度并发，建议控制在 10 请求/秒以内。

### Q6: 外部房源查询失败了怎么办？

A: 外部房源查询失败不会影响带看记录的正常创建。系统会：

- 使用您手动提供的房源信息
- 在响应中标明 `external_property_enriched: false`
- 记录详细的错误日志供排查

### Q7: 如何知道外部房源查询是否成功？

A: 检查响应中的 `external_property_enriched` 字段：

- `true`: 成功获取外部房源信息
- `false`: 未获取到外部房源信息

### Q8: 可以同时提供手动数据和触发外部查询吗？

A: 可以。系统的优先级是：手动提供的数据 > 外部查询数据。

- 如果您提供了某个字段，系统会使用您的数据
- 如果您未提供某个字段，系统会尝试从外部查询结果中获取

### Q9: 外部房源查询的响应时间如何？

A:

- 正常情况下响应时间在 100-500ms
- 设置了 10 秒超时保护
- 超时后自动放弃查询，继续处理带看记录

### Q10: 哪些房源地址比较容易查询成功？

A: 建议使用规范的物业/小区名称，如：

- "万科城"、"华润城"、"保利城" 等知名楼盘
- 避免使用非正式缩写或方言名称
- 详细地址越准确，查询匹配度越高

### Q11: 用户带看记录查询接口有什么限制？

A: 查询接口的限制包括：

- 单次查询最多返回 100 条记录（pageSize 最大值）
- 支持多维度筛选，但建议合理使用以提升查询性能
- 响应包含完整的房源信息和用户基本信息
- 查询结果按带看时间倒序排列

### Q12: 如何高效地使用用户带看记录查询接口？

A: 建议的最佳实践：

- **分页处理**: 对于数据量大的用户，使用合适的页面大小（建议 20-50 条）
- **筛选优化**: 优先使用索引字段筛选（viewing_status、viewing_time）
- **时间范围**: 限制查询时间范围可显著提升性能
- **字段使用**: 响应包含完整信息，可根据需要提取相关字段

### Q13: 查询接口返回的 customer_info 什么时候为空？

A: customer_info 在以下情况下可能为空：

- 该 userId 没有对应的客户记录
- 所有带看记录的 customer_id 字段都为空
- 客户记录已被删除但带看记录保留

---

**文档更新时间：2025-08-06**  
**如有疑问，请联系技术支持团队。**
