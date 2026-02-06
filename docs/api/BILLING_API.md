# 计费管理接口 API 文档

计费管理系统，基于 Lago 提供订阅和计费功能。

**基础地址:** `http://localhost:8080`

**认证方式:**
- 管理员接口：内部服务认证（SERVICE_NAME + IP 白名单）
- 用户接口：Bearer Token (JWT)

---

## 目录

### 管理员接口
1. [初始化 Lago 配置](#1-初始化-lago-配置)

### 用户积分接口
2. [查询余额](#2-查询余额)
3. [刷新余额](#3-刷新余额)
4. [查询充值记录](#4-查询充值记录)
5. [查询使用记录](#5-查询使用记录)

### 用户发票接口
6. [查询发票列表 (V2)](#6-查询发票列表-v2)
7. [查询发票详情](#7-查询发票详情)

---

## 1. 初始化 Lago 配置

初始化 Lago 计费系统配置，包括 Billable Metrics 和 Plan。

### 接口信息

- **URL:** `/billing/initLago`
- **方法:** `POST`
- **需要认证:** 是（内部服务认证：SERVICE_NAME + IP 白名单）
- **幂等性:** 是（可安全重复调用）

### 描述

此接口初始化 Lago 计费系统的核心配置：

1. **创建 Billable Metrics** - 计量指标（如 LLM Tokens）
2. **创建 Plan** - 订阅计划

操作是幂等的，资源已存在时跳过创建。

### 请求参数

无

### 请求示例

```bash
curl -X POST http://localhost:8080/billing/initLago \
  -H "Content-Type: application/json" \
  -H "X-Service-Name: joyful-words"
```

**认证说明:**
- 需要在请求头中提供 `X-Service-Name`
- 请求 IP 需要在白名单中

### 响应

**成功 (200 OK)**

```json
{
  "status": "success",
  "data": {
    "billable_metrics_created": 1,
    "plan_created": true,
    "plan_code": "default_plan",
    "metric_codes": [
      "llm_tokens"
    ],
    "duration": "1.234s"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| status | string | 操作状态：success |
| data | object | 初始化结果数据 |
| data.billable_metrics_created | number | 新创建的指标数量 |
| data.plan_created | boolean | Plan 是否被创建 |
| data.plan_code | string | Plan 代码 |
| data.metric_codes | array[string] | 指标代码列表 |
| data.duration | string | 执行耗时 |

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 401 | 认证失败（服务名无效或 IP 不在白名单） |
| 500 | 初始化失败或 Lago 服务不可用 |
| 503 | 计费服务未初始化 |

### 注意事项

- **幂等性**: 此接口可安全重复调用，已存在的资源不会重复创建
- **初始化内容**:
  - Billable Metric: `llm_tokens` - LLM Token 使用量
  - Plan: `default_plan` - 默认订阅计划
- **权限**: 仅限内部服务调用，需要配置服务认证和 IP 白名单

---

## 2. 查询余额

查询当前用户的积分余额，优先从本地缓存读取。

### 接口信息

- **URL:** `/billing/balance`
- **方法:** `GET`
- **需要认证:** 是（需要有效的 access_token）

### 请求示例

```bash
curl -X GET http://localhost:8080/billing/balance \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo4LCJlbWFpbCI6ImZlbmdAZXhhbXBsZS5jb20iLCJleHAiOjE3NzA0Mzk3MzgsIm5iZiI6MTc3MDM0OTczOCwiaWF0IjoxNzcwMzQ5NzM4fQ.pSZDvTG54Gf6pOR_rE37dxsJT0Cssw2N59kePDR3i54"
```

### 响应

**成功 (200 OK)**

```json
{
  "balance_cents": 1500,
  "currency": "USD",
  "updated_at": "2026-02-05T10:00:00Z",
  "is_cached": true
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| balance_cents | number | 余额（单位：分，100分 = 1积分） |
| currency | string | 货币类型，固定为 "USD" |
| updated_at | string | 余额更新时间（ISO 8601 格式） |
| is_cached | boolean | 是否来自本地缓存 |

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 401 | 未授权（token 无效或过期） |
| 404 | 用户未接入计费系统 |
| 500 | 刷新余额失败或服务器错误 |

**注意:**
- 缓存存在时返回缓存数据（`is_cached: true`）
- 缓存不存在时自动调用 Lago API 刷新（`is_cached: false`）
- 自动刷新机制确保用户始终能获取到最新余额

---

## 3. 刷新余额

手动触发余额刷新，从 Lago API 获取最新数据并更新本地缓存。

### 接口信息

- **URL:** `/billing/balance/refresh`
- **方法:** `POST`
- **需要认证:** 是（需要有效的 access_token）

### 请求示例

```bash
curl -X POST http://localhost:8080/billing/balance/refresh \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo4LCJlbWFpbCI6ImZlbmdAZXhhbXBsZS5jb20iLCJleHAiOjE3NzA0Mzk3MzgsIm5iZiI6MTc3MDM0OTczOCwiaWF0IjoxNzcwMzQ5NzM4fQ.pSZDvTG54Gf6pOR_rE37dxsJT0Cssw2N59kePDR3i54"
  
 ```

### 响应

**成功 (200 OK)**

```json
{
  "balance_cents": 2000,
  "currency": "USD",
  "updated_at": "2026-02-05T10:05:00Z",
  "is_cached": false
}
```

响应字段说明同"查询余额"接口。

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 401 | 未授权 |
| 404 | 用户未接入计费系统 |
| 503 | Lago 服务暂时不可用 |

**注意:**
- 此接口强制从 Lago API 获取最新余额
- 刷新成功后会自动更新本地缓存
- 建议在以下场景使用：
  - 用户怀疑余额数据不准确
  - 长时间未使用后首次查询
  - 充值/消费后确认余额

---

## 4. 查询充值记录

分页查询用户的积分充值记录（inbound 交易）。

### 接口信息

- **URL:** `/billing/recharges`
- **方法:** `GET`
- **需要认证:** 是（需要有效的 access_token）

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，从 1 开始，默认 1 |
| page_size | number | 否 | 每页数量，默认 20，最大 100 |
| status | string | 否 | 状态过滤：pending/settled |

**参数说明:**
- `page_size` 超过 100 时自动限制为 100
- `status` 为可选参数，不传则查询所有状态

### 请求示例

```bash
# 查询第 1 页，每页 20 条
curl -X GET "http://localhost:8080/billing/recharges?page=1&page_size=20" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo4LCJlbWFpbCI6ImZlbmdAZXhhbXBsZS5jb20iLCJleHAiOjE3NzA0Mzk3MzgsIm5iZiI6MTc3MDM0OTczOCwiaWF0IjoxNzcwMzQ5NzM4fQ.pSZDvTG54Gf6pOR_rE37dxsJT0Cssw2N59kePDR3i54"
```

### 响应

**成功 (200 OK)**

```json
{
  "transactions": [
    {
      "transaction_id": "123e4567-e89b-12d3-a456-426614174000",
      "type": "inbound",
      "amount": "10.00",
      "credits": "1000",
      "status": "settled",
      "description": "充值",
      "created_at": "2026-01-29T10:00:00Z",
      "failed_at": null,
      "settled_at": "2026-01-29T10:05:00Z",
      "metadata": {
        "source": "stripe",
        "invoice_id": "inv_123"
      }
    },
    {
      "transaction_id": "987fcdeb-51a2-43f1-a456-426614174999",
      "type": "inbound",
      "amount": "20.00",
      "credits": "2000",
      "status": "settled",
      "description": "充值",
      "created_at": "2026-01-15T14:30:00Z",
      "failed_at": null,
      "settled_at": "2026-01-15T14:35:00Z",
      "metadata": {}
    }
  ],
  "meta": {
    "total_count": 50,
    "page": 1,
    "per_page": 20,
    "total_pages": 3
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| transaction_id | string | 交易 ID（Lago UUID） |
| type | string | 交易类型，固定为 "inbound" |
| amount | string | 充值金额（美元，保留2位小数） |
| credits | string | 充值积分数量（整数） |
| status | string | 交易状态：pending(处理中)/settled(已结算)/failed(失败) |
| description | string | 交易描述 |
| created_at | string | 创建时间（ISO 8601 格式） |
| failed_at | string \| null | 失败时间（ISO 8601 格式），null 表示未失败 |
| settled_at | string \| null | 结算时间（ISO 8601 格式），null 表示未结算 |
| metadata | object | 元数据键值对 |
| total_count | number | 总记录数 |
| page | number | 当前页码 |
| per_page | number | 每页数量 |
| total_pages | number | 总页数 |

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 分页参数无效或时间格式错误 |
| 401 | 未授权 |
| 404 | 用户未接入计费系统 |
| 503 | Lago 服务暂时不可用 |

---

## 5. 查询使用记录

分页查询用户的积分使用记录（outbound 交易）。

### 接口信息

- **URL:** `/billing/usage`
- **方法:** `GET`
- **需要认证:** 是（需要有效的 access_token）

### 请求参数

参数格式与"查询充值记录"接口完全相同。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，从 1 开始，默认 1 |
| page_size | number | 否 | 每页数量，默认 20，最大 100 |
| status | string | 否 | 状态过滤：pending/settled |

### 请求示例

```bash
# 查询第 1 页，每页 20 条
curl -X GET "http://localhost:8080/billing/usage?page=1&page_size=20" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo4LCJlbWFpbCI6ImZlbmdAZXhhbXBsZS5jb20iLCJleHAiOjE3NzA0Mzk3MzgsIm5iZiI6MTc3MDM0OTczOCwiaWF0IjoxNzcwMzQ5NzM4fQ.pSZDvTG54Gf6pOR_rE37dxsJT0Cssw2N59kePDR3i54"

```

### 响应

**成功 (200 OK)**

```json
{
  "transactions": [
    {
      "transaction_id": "456e7890-e89b-12d3-a456-426614174111",
      "type": "outbound",
      "amount": "5.00",
      "credits": "500",
      "status": "settled",
      "description": "",
      "created_at": "2026-01-30T15:20:00Z",
      "failed_at": null,
      "settled_at": "2026-01-30T15:22:00Z",
      "metadata": {}
    },
    {
      "transaction_id": "789f0123-e89b-12d3-a456-426614174222",
      "type": "outbound",
      "amount": "3.50",
      "credits": "350",
      "status": "settled",
      "description": "",
      "created_at": "2026-01-28T09:15:00Z",
      "failed_at": null,
      "settled_at": "2026-01-28T09:17:00Z",
      "metadata": {}
    }
  ],
  "meta": {
    "total_count": 25,
    "page": 1,
    "per_page": 20,
    "total_pages": 2
  }
}
```

响应字段说明：
- `type`: 固定为 "outbound"，表示消费
- 其他字段说明同"查询充值记录"接口

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 分页参数无效或时间格式错误 |
| 401 | 未授权 |
| 404 | 用户未接入计费系统 |
| 503 | Lago 服务暂时不可用 |

---

## 6. 查询发票列表 (V2)

分页查询用户的发票列表（基于 Lago Invoice API）。

### 接口信息

- **URL:** `/billing/usage_v2`
- **方法:** `GET`
- **需要认证:** 是（需要有效的 access_token）

### 描述

此接口基于 Lago Invoice API 提供更丰富的计费信息：

1. **完整的费用明细** - 显示所有计费项的汇总
2. **支付状态** - 发票的支付状态（succeeded/pending/failed）
3. **发票状态** - draft/finalized/voided/failed/pending
4. **时间筛选** - 支持按签发日期范围筛选

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，从 1 开始，默认 1 |
| page_size | number | 否 | 每页数量，默认 20，最大 100 |
| status | string | 否 | 发票状态筛选：draft/finalized/voided/failed/pending |
| issuing_date_start | string | 否 | 开始日期（ISO 8601 格式） |
| issuing_date_end | string | 否 | 结束日期（ISO 8601 格式） |

**参数说明:**
- `page_size` 超过 100 时自动限制为 100
- `status` 为可选参数，不传则查询所有状态
- 日期参数必须成对使用或单独使用

### 请求示例

```bash
# 查询第 1 页，每页 20 条
curl -X GET "http://localhost:8080/billing/usage_v2?page=1&page_size=20" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 查询已支付的发票
curl -X GET "http://localhost:8080/billing/usage_v2?status=finalized" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 按日期范围查询
curl -X GET "http://localhost:8080/billing/usage_v2?issuing_date_start=2026-01-01T00:00:00Z&issuing_date_end=2026-01-31T23:59:59Z" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 响应

**成功 (200 OK)**

```json
{
  "invoices": [
    {
      "lago_id": "b7abd317-5c01-0000-0000-000000000000",
      "status": "finalized",
      "issuing_date": "2026-01-15T00:00:00Z",
      "number": "INV-2026-001",
      "payment_status": "succeeded",
      "fees_amount_cents": 1000,
      "prepaid_credit_amount_cents": 200,
      "total_amount_cents": 1200,
      "currency": "USD"
    },
    {
      "lago_id": "a8bce428-6d12-0000-0000-000000000001",
      "status": "finalized",
      "issuing_date": "2026-01-01T00:00:00Z",
      "number": "INV-2026-002",
      "payment_status": "succeeded",
      "fees_amount_cents": 500,
      "prepaid_credit_amount_cents": 100,
      "total_amount_cents": 600,
      "currency": "USD"
    }
  ],
  "meta": {
    "total_count": 45,
    "page": 1,
    "per_page": 20,
    "total_pages": 3
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| lago_id | string | Lago 发票唯一标识 |
| status | string | 发票状态：draft/finalized/voided/failed/pending |
| issuing_date | string | 签发日期（ISO 8601 格式，UTC） |
| number | string | 发票编号 |
| payment_status | string | 支付状态：succeeded/pending/failed |
| fees_amount_cents | number | 费用金额（分） |
| prepaid_credit_amount_cents | number | 预付费积分扣减金额（分） |
| total_amount_cents | number | 总金额（分） |
| currency | string | 货币类型：USD |
| total_count | number | 总发票数 |
| page | number | 当前页码 |
| per_page | number | 每页数量 |
| total_pages | number | 总页数 |

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 分页参数无效、时间格式错误或时间范围无效 |
| 401 | 未授权 |
| 503 | 计费服务暂时不可用 |

---

## 7. 查询发票详情

获取单个发票的详细信息，包含计费项明细和单价信息。

### 接口信息

- **URL:** `/billing/usage/:lago_id`
- **方法:** `GET`
- **需要认证:** 是（需要有效的 access_token）

### 描述

此接口返回发票的详细信息，包括：

1. **计费项分组** - 按 `filter_invoice_display_name` 分组显示
2. **单价信息** - 显示每个计费项的单价
3. **使用量统计** - 显示实际使用的数量
4. **金额计算** - 显示每个计费项的总金额

### URL 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| lago_id | string | 是 | 发票的 Lago ID |

### 请求示例

```bash
# 获取发票详情
curl -X GET "http://localhost:8080/billing/usage/b7abd317-5c01-0000-0000-000000000000" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 响应

**成功 (200 OK)**

```json
{
  "lago_id": "b7abd317-5c01-0000-0000-000000000000",
  "status": "finalized",
  "number": "INV-2026-001",
  "issuing_date": "2026-01-15T00:00:00Z",
  "payment_status": "succeeded",
  "fees_amount_cents": 1000,
  "prepaid_credit_amount_cents": 500,
  "fee_items": [
    {
      "name": "cheaper-llm-input-token",
      "code": "llm_tokens",
      "units": "5000",
      "unit_price": "0.01",
      "amount_cents": 50
    },
    {
      "name": "cheaper-llm-output-token",
      "code": "llm_tokens",
      "units": "2000",
      "unit_price": "0.03",
      "amount_cents": 60
    },
    {
      "name": "material-search-info",
      "code": "search_actions",
      "units": "10",
      "unit_price": "0.30",
      "amount_cents": 300
    },
    {
      "name": "material-search-image",
      "code": "search_actions",
      "units": "5",
      "unit_price": "0.40",
      "amount_cents": 200
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| lago_id | string | Lago 发票唯一标识 |
| status | string | 发票状态 |
| number | string | 发票编号 |
| issuing_date | string | 签发日期（ISO 8601 格式，UTC） |
| payment_status | string | 支付状态 |
| fees_amount_cents | number | 费用金额（分） |
| prepaid_credit_amount_cents | number | 预付费积分扣减金额（分） |
| fee_items | array | 计费项明细数组 |
| fee_items[].name | string | 计费项名称：cheaper-llm-input-token 等 |
| fee_items[].code | string | 计费编号：llm_tokens / search_actions |
| fee_items[].units | string | 使用量（字符串格式） |
| fee_items[].unit_price | string | 单价（美元，保留2位小数） |
| fee_items[].amount_cents | number | 总金额（分） |

**计费项说明:**

| 计费项名称 | 计费编号 | 单价 | 计费模型 | 说明 |
|-----------|---------|------|---------|------|
| cheaper-llm-input-token | llm_tokens | $0.01 | Package (1000 tokens) | 便宜模型输入 |
| cheaper-llm-output-token | llm_tokens | $0.03 | Package (1000 tokens) | 便宜模型输出 |
| stronger-llm-input-token | llm_tokens | $0.02 | Package (1000 tokens) | 强力模型输入 |
| stronger-llm-output-token | llm_tokens | $0.10 | Package (1000 tokens) | 强力模型输出 |
| material-search-info | search_actions | $0.30 | Standard (按次) | 信息搜索 |
| material-search-news | search_actions | $0.30 | Standard (按次) | 新闻搜索 |
| material-search-image | search_actions | $0.40 | Standard (按次) | 图片搜索 |
| post-crawler | search_actions | $0.01 | Standard (按次) | 文章爬取 |

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 无效的请求 |
| 401 | 未授权 |
| 404 | 发票不存在或无权访问 |
| 503 | 计费服务暂时不可用 |

**权限说明:**
- 用户只能查询自己的发票
- 访问其他用户的发票会返回 404 错误

---

## 国际化支持

所有接口支持通过 `Accept-Language` 请求头设置语言：

```bash
curl -X GET http://localhost:8080/billing/balance \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

支持的语言：
- `en` (English)
- `zh-CN` (简体中文)

错误消息会根据请求头返回对应语言版本。

---

## 业务流程

### 余额查询流程

```
1. GET /billing/balance → 优先返回缓存
2. 缓存不存在时自动刷新
3. 返回最新余额
```

### 手动刷新流程

```
1. POST /billing/balance/refresh → 强制从 Lago 获取
2. 更新本地缓存
3. 返回最新余额
```

### 交易记录查询流程

```
1. GET /billing/recharges → 查询充值记录
2. GET /billing/usage → 查询使用记录
3. 实时从 Lago API 获取，不做本地缓存
```

---

## 数据来源说明

| 数据类型 | 数据来源 | 缓存策略 |
|---------|---------|---------|
| 余额 | Lago API | 本地缓存（优先读取，不存在时自动刷新） |
| 充值记录 | Lago API | 不缓存，实时查询 |
| 使用记录 | Lago API | 不缓存，实时查询 |

**为什么交易记录不做缓存？**
- 数据量大，查询频率低
- 实时性要求高
- 避免数据冗余

---

## 注意事项

### 1. 认证要求
- 所有接口都需要有效的 JWT access_token
- Token 应放在 Authorization header 中：`Bearer YOUR_ACCESS_TOKEN`
- Token 过期后使用刷新接口更新

### 2. 用户权限
- 用户只能查询自己的余额和交易记录
- 所有查询自动基于 JWT token 中的 user_id 过滤

### 3. 分页参数
- `page` 从 1 开始，不是 0
- `page_size` 超过 100 时自动限制为 100
- 建议使用合理的分页大小提高性能

### 4. 时间格式
- 时间参数必须严格遵循 ISO 8601 格式（UTC 时区）
- 示例：`2026-01-01T00:00:00Z`
- 格式错误会返回 400 错误

### 5. 余额缓存策略
- 查询余额时优先返回缓存（如果存在）
- 缓存不存在时自动调用 Lago API 刷新
- 手动刷新接口强制从 Lago 获取最新数据

### 6. Lago 服务限制
- 交易记录查询依赖 Lago API 可用性
- Lago 服务异常时返回 503 错误
- 建议客户端实现重试机制

### 7. 交易描述
- 如果 Lago 提供了自定义描述，则使用 Lago 的描述

---

## 错误响应格式

所有错误响应遵循统一格式：

```json
{
  "error": "错误消息描述"
}
```

**常见错误消息：**

| 错误消息（中文） | 错误消息（英文） | 适用场景 |
|----------------|----------------|---------|
| 未认证 | Not authenticated | Token 无效或过期 |
| 用户未接入计费系统 | User not onboarded to billing system | 用户未创建 Lago 账户 |
| 无效的分页参数 | Invalid pagination parameters | page < 1 或 page_size > 100 |
| 无效的时间格式 | Invalid time format, use ISO 8601 | 时间格式错误 |
| 无效的时间范围 | Invalid time range | 开始时间晚于结束时间 |
| 刷新余额失败 | Failed to refresh balance, please try again later | Lago API 异常 |
| 获取交易记录失败 | Failed to fetch transactions | Lago API 异常 |
| 发票不存在或无权访问 | Invoice not found or access denied | 发票不存在或权限不足 |
| 无效的发票状态 | Invalid invoice status | 发票状态参数无效 |
| 计费服务暂时不可用 | Billing service temporarily unavailable | Lago 服务不可用 |
| 服务器内部错误，请稍后再试 | Internal server error | 未知错误 |

---

## 安全说明

1. **认证**: 所有接口都需要 JWT token 认证
2. **授权**: 用户只能访问自己的积分数据
3. **输入验证**: 所有输入参数都经过验证
4. **错误隐藏**: 不向客户端暴露 Lago 原始错误信息
5. **日志记录**: 所有操作记录详细的日志用于审计

---

## 相关文档

- [积分系统设计文档](../../../docs/plans/2026-02-05-credits-system-design.md)
- [Wallet 模块 README](../../wallet/README.md)
- [Lago API 文档](https://getlago.com/docs/api-reference)

---

**文档版本:** 1.1
**最后更新:** 2026-02-05
**作者:** joyful-words development team
