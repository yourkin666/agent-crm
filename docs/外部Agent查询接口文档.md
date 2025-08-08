# 外部 Agent 查询接口文档

> 文档更新时间：2025-08-07  
> 接口版本：v1.0  
> 适用于：外部 Agent 系统带看记录查询

---

## 📋 接口概览

本文档专门描述外部 Agent 系统的用户带看记录查询接口，提供完整的查询功能和详细的字段说明。

| 接口名称         | 方法 | 路径                                     | 功能描述                     |
| ---------------- | ---- | ---------------------------------------- | ---------------------------- |
| 用户带看记录查询 | GET  | `/api/external/viewing-records/[userId]` | 根据用户 ID 查询带看记录信息 |

---

## 🔍 用户带看记录查询接口

### 基本信息

- **接口地址**: `GET /api/external/viewing-records/[userId]`
- **功能描述**: 根据用户 ID 查询该用户的所有带看记录信息
- **数据来源**: 同时包含外部 Agent 系统和内部管理界面创建的记录
- **支持功能**:
  - 分页查询
  - 多维度筛选（房源名称、带看状态、业务类型、带看人类型、时间范围）
  - 同时返回用户基本信息（如果存在客户记录）
  - 完整的房源信息（包含外部 API 自动查询的数据）
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

### 响应结果

#### 成功响应

```json
{
  "success": true,
  "data": {
    "viewing_records": [
      {
        "id": 31,
        "customer_id": 9,
        "viewing_time": "2025-08-07T01:37:31.000Z",
        "property_name": "万科城",
        "property_address": "1栋2单元301室",
        "room_type": "two_bedroom",
        "room_tag": "loft",
        "viewer_name": "external",
        "viewing_status": 2,
        "commission": "3000.00",
        "viewing_feedback": 1,
        "business_type": "whole_rent",
        "notes": "客户很满意，准备签约",
        "customer_name": "李四",
        "customer_phone": "13900139000",
        "userId": "agent_user_12345",
        "botId": "bot_001",
        "housingId": 16351,
        "houseAreaId": 341,
        "houseAreaName": "雁塔区",
        "cityId": 2899,
        "cityName": "西安市",
        "propertyAddrId": 1097,
        "unitType": "3室2厅2卫1厨",
        "longitude": "108.983682",
        "latitude": "34.186379",
        "roomId": 61168,
        "advisorId": 6777,
        "advisorName": "耿金林",
        "companyName": "北京永晟嘉业房地产经纪集团有限公司",
        "companyAbbreviation": "永晟集团-椰壳公寓",
        "houseTypeId": 70461,
        "created_at": "2025-08-07T09:37:31.000Z",
        "updated_at": "2025-08-07T09:37:31.000Z"
      }
    ],
    "customer_info": {
      "id": 9,
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
      "total_commission": "15000.00",
      "created_at": "2025-08-01T10:00:00.000Z",
      "updated_at": "2025-08-07T09:37:31.000Z"
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

---

## 📖 字段详细说明

### 带看记录字段 (viewing_records)

#### 基础信息字段

| 字段名             | 类型   | 可为空 | 说明                      |
| ------------------ | ------ | ------ | ------------------------- |
| `id`               | number | ❌     | 带看记录唯一标识 ID       |
| `customer_id`      | number | ✅     | 关联的客户 ID（可能为空） |
| `viewing_time`     | string | ❌     | 带看时间（ISO 8601 格式） |
| `property_name`    | string | ❌     | 房源名称                  |
| `property_address` | string | ✅     | 房源详细地址              |
| `room_type`        | string | ❌     | 房型类型                  |
| `room_tag`         | string | ✅     | 房型标签                  |
| `customer_name`    | string | ❌     | 客户姓名（历史快照）      |
| `customer_phone`   | string | ❌     | 客户电话（历史快照）      |
| `userId`           | string | ✅     | 用户第三方 ID             |
| `botId`            | string | ✅     | 机器人/工作人员 ID        |
| `created_at`       | string | ❌     | 记录创建时间              |
| `updated_at`       | string | ❌     | 记录更新时间              |

#### 带看业务字段

| 字段名             | 类型   | 可为空 | 说明                           | 状态说明                                                                                       |
| ------------------ | ------ | ------ | ------------------------------ | ---------------------------------------------------------------------------------------------- |
| `viewer_name`      | string | ❌     | 带看人类型                     | `internal`=内部带看<br/>`external`=外部带看<br/>`external_sales`=外部销售<br/>`creator`=创建者 |
| `viewing_status`   | number | ❌     | 带看状态                       | `1`=待确认<br/>`2`=已确认<br/>`3`=已取消<br/>`4`=已带看                                        |
| `commission`       | string | ❌     | 佣金金额（Decimal 格式字符串） | 单位：元，保留 2 位小数                                                                        |
| `viewing_feedback` | number | ✅     | 带看反馈                       | `0`=未成交<br/>`1`=已成交<br/>`null`=未反馈                                                    |
| `business_type`    | string | ❌     | 业务类型                       | `whole_rent`=整租<br/>`shared_rent`=合租<br/>`centralized`=集中式公寓                          |
| `notes`            | string | ✅     | 带看备注                       | 自由文本，可为空                                                                               |

#### 房型字段说明

| `room_type` 值  | 说明       |
| --------------- | ---------- |
| `one_bedroom`   | 一居室     |
| `two_bedroom`   | 两居室     |
| `three_bedroom` | 三居室     |
| `four_plus`     | 四居室以上 |
| `master_room`   | 主卧       |
| `second_room`   | 次卧       |

#### 房源扩展信息字段

| 字段名                | 类型   | 可为空 | 说明                                | 数据来源                |
| --------------------- | ------ | ------ | ----------------------------------- | ----------------------- |
| `housingId`           | number | ✅     | 房源 ID                             | 外部 API 查询或手动录入 |
| `houseAreaId`         | number | ✅     | 区域 ID                             | 外部 API 查询或手动录入 |
| `houseAreaName`       | string | ✅     | 区域名称                            | 外部 API 查询或手动录入 |
| `cityId`              | number | ✅     | 城市 ID                             | 外部 API 查询或手动录入 |
| `cityName`            | string | ✅     | 城市名称                            | 外部 API 查询或手动录入 |
| `propertyAddrId`      | number | ✅     | 物业地址 ID                         | 外部 API 查询或手动录入 |
| `unitType`            | string | ✅     | 户型描述（如"3 室 2 厅 2 卫 1 厨"） | 外部 API 查询或手动录入 |
| `longitude`           | string | ✅     | 经度                                | 外部 API 查询或手动录入 |
| `latitude`            | string | ✅     | 纬度                                | 外部 API 查询或手动录入 |
| `roomId`              | number | ✅     | 房间 ID                             | 外部 API 查询或手动录入 |
| `advisorId`           | number | ✅     | 顾问 ID                             | 外部 API 查询或手动录入 |
| `advisorName`         | string | ✅     | 顾问姓名                            | 外部 API 查询或手动录入 |
| `companyName`         | string | ✅     | 公司名称                            | 外部 API 查询或手动录入 |
| `companyAbbreviation` | string | ✅     | 公司简称                            | 外部 API 查询或手动录入 |
| `houseTypeId`         | number | ✅     | 房型 ID                             | 外部 API 查询或手动录入 |

### 客户信息字段 (customer_info)

| 字段名             | 类型   | 可为空 | 说明          | 状态说明                                                                                                                                       |
| ------------------ | ------ | ------ | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | number | ❌     | 客户 ID       | 系统内部客户唯一标识                                                                                                                           |
| `userId`           | string | ✅     | 用户第三方 ID | 外部系统用户标识                                                                                                                               |
| `nickname`         | string | ✅     | 客户昵称      | 可为空                                                                                                                                         |
| `name`             | string | ✅     | 客户姓名      | 可为空                                                                                                                                         |
| `phone`            | string | ✅     | 客户电话      | 格式：1[3-9]xxxxxxxx                                                                                                                           |
| `community`        | string | ✅     | 咨询小区      | 客户感兴趣的小区                                                                                                                               |
| `business_type`    | string | ❌     | 业务类型      | 同带看记录 business_type                                                                                                                       |
| `room_type`        | string | ❌     | 房型偏好      | 同带看记录 room_type                                                                                                                           |
| `status`           | number | ❌     | 客户状态      | `1`=跟进中<br/>`2`=不再回复<br/>`3`=已约带看<br/>`4`=已成交未结佣<br/>`5`=已成交已结佣                                                         |
| `source_channel`   | string | ❌     | 来源渠道      | `xianyu`=闲鱼<br/>`xiaohongshu`=小红书<br/>`beike`=贝壳<br/>`58tongcheng`=58 同城<br/>`shipinhao`=视频号<br/>`douyin`=抖音<br/>`referral`=推荐 |
| `viewing_count`    | number | ❌     | 带看次数统计  | 该客户总带看次数                                                                                                                               |
| `total_commission` | string | ❌     | 总佣金统计    | 该客户产生的总佣金，Decimal 格式                                                                                                               |
| `created_at`       | string | ❌     | 客户创建时间  | ISO 8601 格式                                                                                                                                  |
| `updated_at`       | string | ❌     | 客户更新时间  | ISO 8601 格式                                                                                                                                  |

### 分页信息字段 (pagination)

| 字段名       | 类型   | 说明       |
| ------------ | ------ | ---------- |
| `total`      | number | 总记录数   |
| `page`       | number | 当前页码   |
| `pageSize`   | number | 每页记录数 |
| `totalPages` | number | 总页数     |

## 主要状态码

### 带看状态 (viewing_status)

- `1` = 待确认
- `2` = 已确认
- `3` = 已取消
- `4` = 已带看

### 带看反馈 (viewing_feedback)

- `0` = 未成交
- `1` = 已成交
- `null` = 未反馈

### 客户状态 (status)

- `1` = 跟进中
- `2` = 不再回复
- `3` = 已约带看
- `4` = 已成交未结佣
- `5` = 已成交已结佣

### 业务类型 (business_type)

- `whole_rent` = 整租
- `shared_rent` = 合租
- `centralized` = 集中式公寓

### 房型类型 (room_type)

- `one_bedroom` = 一居室
- `two_bedroom` = 两居室
- `three_bedroom` = 三居室
- `four_plus` = 四居室以上
- `master_room` = 主卧
- `second_room` = 次卧

### 带看人类型 (viewer_name)

- `internal` = 内部带看
- `external` = 外部带看
- `external_sales` = 外部销售
- `creator` = 创建者

### 来源渠道 (source_channel)

- `xianyu` = 闲鱼
- `xiaohongshu` = 小红书
- `beike` = 贝壳
- `58tongcheng` = 58 同城
- `shipinhao` = 视频号
- `douyin` = 抖音
- `referral` = 推荐

## 查询参数

- `page` - 页码 (默认 1)
- `pageSize` - 每页数量 (默认 20，最大 100)
- `property_name` - 房源名称筛选
- `viewing_status` - 带看状态筛选
- `business_type` - 业务类型筛选
- `viewer_name` - 带看人类型筛选
- `date_from` - 开始时间 (YYYY-MM-DD)
- `date_to` - 结束时间 (YYYY-MM-DD)

## 使用示例

```bash
# 查询所有记录
curl "http://localhost:3000/api/external/viewing-records/user123"

# 查询已完成带看
curl "http://localhost:3000/api/external/viewing-records/user123?viewing_status=4"

# 查询成交记录
curl "http://localhost:3000/api/external/viewing-records/user123?viewing_feedback=1"
```

---

## 🎯 使用场景示例

### 场景 1：查询用户所有带看记录

```bash
curl -X GET "http://localhost:3000/api/external/viewing-records/agent_user_12345"
```

**适用于**: 获取用户完整带看历史

### 场景 2：查询用户最近的成交记录

```bash
curl -X GET "http://localhost:3000/api/external/viewing-records/agent_user_12345?viewing_feedback=1&page=1&pageSize=10"
```

**适用于**: 获取用户成交情况分析

### 场景 3：查询用户在指定时间段的带看活动

```bash
curl -X GET "http://localhost:3000/api/external/viewing-records/agent_user_12345?date_from=2024-08-01&date_to=2024-08-31"
```

**适用于**: 月度/季度活动统计

### 场景 4：查询用户特定状态的带看记录

```bash
curl -X GET "http://localhost:3000/api/external/viewing-records/agent_user_12345?viewing_status=4&business_type=whole_rent"
```

**适用于**: 筛选特定类型的已完成带看

---

## 📊 响应状态码

| HTTP 状态码 | 说明           | 响应示例                                          |
| ----------- | -------------- | ------------------------------------------------- |
| 200         | 查询成功       | `{"success": true, "data": {...}}`                |
| 400         | 请求参数错误   | `{"success": false, "error": "userId为必填参数"}` |
| 500         | 服务器内部错误 | `{"success": false, "error": "服务器内部错误"}`   |

---

## 🔄 数据更新说明

### 数据同步

- **实时同步**: 通过外部 Agent 接口创建的带看记录立即可查询
- **内部同步**: 通过内部管理界面创建的带看记录也会包含 userId，同样可查询
- **统计更新**: 客户统计信息（viewing_count、total_commission）在每次新增带看记录后自动更新

### 数据一致性

- **历史快照**: customer_name 和 customer_phone 保存创建时的快照，不随客户信息变更而变化
- **外部数据**: 房源扩展信息优先使用外部 API 查询结果，查询失败时使用手动录入数据
- **空值处理**: 所有可为空字段在响应中明确返回 null 而不是省略

---

## ⚠️ 注意事项

1. **用户标识**: userId 必须在创建客户或带看记录时提供，历史数据中可能存在 null 值
2. **分页限制**: 单次查询最多返回 100 条记录，建议根据实际需求调整 pageSize
3. **筛选性能**: 建议优先使用索引字段（viewing_status、viewing_time）进行筛选
4. **时间格式**: 所有时间字段均为 ISO 8601 格式，请注意时区处理
5. **金额格式**: commission 和 total_commission 为 Decimal 格式的字符串，请按字符串处理

---

## 🔗 相关接口

- [客户数据录入接口](./外部Agent接口文档.md#客户数据录入接口): `POST /api/external/customers`
- [带看记录录入接口](./外部Agent接口文档.md#带看记录录入接口): `POST /api/external/viewing-records`

---

**文档更新时间：2025-08-07**  
**如有疑问，请联系技术支持团队。**
