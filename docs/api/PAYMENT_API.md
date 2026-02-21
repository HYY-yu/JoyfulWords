# 支付接口 API 文档

支付订单管理系统，支持多个支付提供商（PayPal、Payin、OxaPay、Stripe），提供订单创建、查询和 Webhook 回调处理功能。

**基础地址:** `http://localhost:8080`

**认证方式:**
- 订单管理接口：Bearer Token (JWT) - 需要认证
- Webhook 接口：签名验证（不需要 JWT）

**支持的支付提供商:**
- `paypal` - PayPal 全球支付平台
- `payin` - 加密货币支付
- `oxapay` - OxaPay 支付服务提供商
- `stripe` - Stripe Checkout（官方托管支付页）

**汇率:** 100 积分 = 1 USD

**限流策略:**
- 创建订单：5 次/分钟
- 查询订单：20 次/分钟

---

## 目录

1. [创建支付订单](#1-创建支付订单)
2. [查询订单详情](#2-查询订单详情)
3. [查询订单状态](#3-查询订单状态)
4. [查询订单列表](#4-查询订单列表)
5. [Webhook 回调](#5-webhook-回调)

---

## 1. 创建支付订单

创建新的支付订单，返回支付页面 URL。

### 接口信息

- **URL:** `/payment/orders/create`
- **方法:** `POST`
- **需要认证:** 是（需要有效的 access_token）
- **限流:** 5 次/分钟

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| credits | int | 是 | 购买积分数（100 积分 = 1 USD） |
| provider | string | 是 | 支付提供商：paypal、payin、oxapay、stripe |
| return_url | string | 是 | 支付成功后返回的 URL |
| cancel_url | string | 是 | 支付取消后返回的 URL |
| timestamp | int64 | 是 | 请求时间戳（Unix 秒），用于防重放攻击 |
| metadata | object | 否 | 额外的元数据（如网络选择） |

### 请求示例

**PayPal 订单：**

```bash
curl -X POST http://localhost:8080/payment/orders/create \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "credits": 1000,
    "provider": "paypal",
    "return_url": "https://yourdomain.com/payment/success",
    "cancel_url": "https://yourdomain.com/payment/cancel",
    "timestamp": 1738000000
  }'
```

**Payin 订单（带网络选择）：**

```bash
curl -X POST http://localhost:8080/payment/orders/create \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "credits": 500,
    "provider": "payin",
    "return_url": "https://yourdomain.com/payment/success",
    "cancel_url": "https://yourdomain.com/payment/cancel",
    "timestamp": 1738000000,
    "metadata": {
      "network": "TRC20"
    }
  }'
```

**Stripe 订单：**

```bash
curl -X POST http://localhost:8080/payment/orders/create \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "credits": 1000,
    "provider": "stripe",
    "return_url": "https://yourdomain.com/payment/success",
    "cancel_url": "https://yourdomain.com/payment/cancel",
    "timestamp": 1738000000
  }'
```

### 响应

**成功 (200 OK)**

```json
{
  "order_no": "ORD2025012812345678901",
  "status": "pending",
  "provider": "paypal",
  "amount": 10.00,
  "currency": "USD",
  "credits": 1000,
  "approval_url": "https://www.sandbox.paypal.com/checkoutnow?token=...",
  "created_at": "2025-01-28T00:00:00Z"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| order_no | string | 订单号（格式：ORD{YYYYMMDD}{10位随机数}） |
| status | string | 订单状态：pending |
| provider | string | 支付提供商 |
| amount | float64 | 支付金额（USD） |
| currency | string | 币种（固定为 USD） |
| credits | int | 购买的积分数 |
| approval_url | string | 支付页面 URL，引导用户跳转 |
| created_at | string | 创建时间（ISO 8601 格式） |

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 请求参数错误（积分数量无效、提供商不支持） |
| 400 | 积分数量超出最大限制 |
| 400 | 请求已过期（timestamp 超过 5 分钟） |
| 400 | 重复请求（相同 request_hash） |
| 400 | return_url 或 cancel_url 无效 |
| 401 | 未授权（token 无效或过期） |
| 429 | 触发限流 |
| 500 | 创建订单失败 |

**注意:**
- 积分数量必须是 100 的倍数
- 积分数量范围：100 - 100,000
- 请求时间戳有效期：5 分钟
- 使用 request_hash 防止重放攻击
- 用户需要跳转到 `approval_url` 完成支付

---

## 2. 查询订单详情

根据订单号查询订单的完整信息。

### 接口信息

- **URL:** `/payment/orders/:orderNo`
- **方法:** `GET`
- **需要认证:** 是（需要有效的 access_token）

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderNo | string | 是 | 订单号 |

### 请求示例

```bash
curl -X GET http://localhost:8080/payment/orders/ORD2025012812345678901 \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 响应

**成功 (200 OK)**

```json
{
  "order_no": "ORD2025012812345678901",
  "status": "completed",
  "provider_status": "COMPLETED",
  "amount": 10.00,
  "currency": "USD",
  "credits": 1000,
  "credits_added": 1000,
  "provider": "paypal",
  "approval_url": "https://www.sandbox.paypal.com/checkoutnow?token=...",
  "created_at": "2025-01-28T00:00:00Z",
  "paid_at": "2025-01-28T00:05:00Z",
  "completed_at": "2025-01-28T00:05:05Z"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| order_no | string | 订单号 |
| status | string | 订单状态：pending、paid、completed、failed、cancelled、compensation_needed |
| provider_status | string | 支付提供商状态 |
| amount | float64 | 支付金额 |
| currency | string | 币种 |
| credits | int | 订单积分数 |
| credits_added | int | 实际充值成功的积分数（完成后才有值） |
| provider | string | 支付提供商 |
| approval_url | string | 支付页面 URL（仅 pending 状态有效） |
| created_at | string | 创建时间 |
| paid_at | string | 支付成功时间（可选） |
| completed_at | string | 订单完成时间（可选） |

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 401 | 未授权 |
| 403 | 无权访问此订单（不是订单所有者） |
| 404 | 订单不存在 |

---

## 3. 查询订单状态

主动查询支付提供商获取订单最新状态，可能触发充值。

### 接口信息

- **URL:** `/payment/orders/:orderNo/status`
- **方法:** `GET`
- **需要认证:** 是（需要有效的 access_token）
- **限流:** 20 次/分钟

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderNo | string | 是 | 订单号 |

### 请求示例

```bash
curl -X GET http://localhost:8080/payment/orders/ORD2025012812345678901/status \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 响应

**成功 (200 OK)**

```json
{
  "order_no": "ORD2025012812345678901",
  "status": "completed",
  "provider_status": "COMPLETED",
  "amount": 10.00,
  "currency": "USD",
  "credits": 1000,
  "credits_added": 1000,
  "provider": "paypal",
  "created_at": "2025-01-28T00:00:00Z",
  "paid_at": "2025-01-28T00:05:00Z",
  "completed_at": "2025-01-28T00:05:05Z"
}
```

**注意:**
- 此接口会主动调用支付提供商 API 查询最新状态
- 如果支付成功但未充值，会自动触发充值流程
- 适用于 Webhook 丢失或延迟的场景

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 401 | 未授权 |
| 404 | 订单不存在 |
| 429 | 触发限流 |

---

## 4. 查询订单列表

查询当前用户的订单列表，支持分页和状态过滤。

### 接口信息

- **URL:** `/payment/orders`
- **方法:** `GET`
- **需要认证:** 是（需要有效的 access_token）

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，从 1 开始，默认 1 |
| page_size | number | 否 | 每页数量，默认 20，最大 100 |
| status | string | 否 | 订单状态过滤：pending、paid、completed、failed、cancelled、compensation_needed |

### 请求示例

```bash
curl -X GET "http://localhost:8080/payment/orders?page=1&page_size=20&status=completed" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 响应

**成功 (200 OK)**

```json
{
  "orders": [
    {
      "order_no": "ORD2025012812345678901",
      "status": "completed",
      "provider_status": "COMPLETED",
      "amount": 10.00,
      "currency": "USD",
      "credits": 1000,
      "credits_added": 1000,
      "provider": "paypal",
      "created_at": "2025-01-28T00:00:00Z",
      "paid_at": "2025-01-28T00:05:00Z",
      "completed_at": "2025-01-28T00:05:05Z"
    }
  ],
  "total": 50,
  "page": 1,
  "page_size": 20
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| orders | array | 订单列表 |
| total | int64 | 总订单数 |
| page | int | 当前页码 |
| page_size | int | 每页数量 |

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 分页参数无效 |
| 401 | 未授权 |

---

## 5. Webhook 回调

接收支付提供商的 Webhook 回调通知。

### 接口信息

- **URL:** `/payment/webhooks/:provider`
- **方法:** `POST`
- **需要认证:** 否（使用签名验证）
- **调用方:** 支付提供商服务器

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| provider | string | 是 | 支付提供商：paypal、payin、paydify |

### 请求头

Webhook 请求包含签名验证所需的 headers：

**PayPal:**
- `PayPal-Transmission-Id`
- `PayPal-Transmission-Time`
- `PayPal-Cert-Id`
- `PayPal-Transmission-Sig`
- `PayPal-Auth-Algo`

**Payin:**
- `X-Signature`
- `X-Timestamp`

**Paydify:**
- `X-Signature`
- `X-Timestamp`

### 请求示例

**PayPal Webhook:**

```bash
curl -X POST http://localhost:8080/payment/webhooks/paypal \
  -H "Content-Type: application/json" \
  -H "PayPal-Transmission-Id: 123456" \
  -H "PayPal-Transmission-Time: 2025-01-28T00:00:00Z" \
  -H "PayPal-Cert-Id: ABC123" \
  -H "PayPal-Transmission-Sig: signature123" \
  -H "PayPal-Auth-Algo: SHA256withRSA" \
  -d '{
    "id": "EVENT_123456",
    "event_type": "PAYMENT.CAPTURE.COMPLETED",
    "resource": {
      "id": "PAYPAL_ORDER_ID",
      "status": "COMPLETED",
      "purchase_units": [
        {
          "amount": {
            "currency_code": "USD",
            "value": "10.00"
          }
        }
      ]
    }
  }'
```

### 响应

**成功 (200 OK)**

PayPal/Payin:
```json
{
  "status": "ok"
}
```

Paydify:
```
success
```

**失败 (200 OK - 返回 200 避免重复通知)**

PayPal/Payin:
```json
{
  "status": "error"
}
```

Paydify:
```
fail
```

**注意:**
- Paydify 要求返回纯文本 "success" 或 "fail"
- 即使处理失败也返回 200，避免支付提供商重试
- 使用 event_id 实现幂等性，防止重复处理
- 签名验证失败会记录错误日志

---

## 订单状态说明

| 状态 | 说明 | 下一步 |
|------|------|--------|
| pending | 订单已创建，等待用户支付 | 引导用户到 approval_url |
| paid | 用户已完成支付，等待充值 | 系统自动充值 |
| completed | 订单已完成，积分已充值 | 无 |
| failed | 支付失败或充值失败 | 用户可重新创建订单 |
| cancelled | 用户取消支付 | 用户可重新创建订单 |
| compensation_needed | 需要补偿（定时任务处理） | 等待自动补偿 |

---

## 国际化支持

所有接口支持通过 `Accept-Language` 请求头设置语言：

```bash
curl -X POST http://localhost:8080/payment/orders/create \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "credits": 1000,
    "provider": "paypal",
    "return_url": "https://yourdomain.com/payment/success",
    "cancel_url": "https://yourdomain.com/payment/cancel",
    "timestamp": 1738000000
  }'
```

支持的语言：
- `en` (English)
- `zh-CN` (简体中文)

---

## 业务流程

### 支付流程

```
1. POST /payment/orders/create → 创建订单，获取 approval_url
2. 引导用户跳转到 approval_url 完成支付
3. 用户在支付提供商页面完成支付
4. 支付提供商发送 Webhook 到 /payment/webhooks/:provider
5. 系统接收 Webhook，验证签名，更新订单状态
6. 系统自动调用 Lago API 充值积分
7. 订单状态更新为 completed
```

### 轮询查询流程（Webhook 失败场景）

```
1. 创建订单并完成支付
2. 前端定时调用 GET /payment/orders/:orderNo/status
3. 系统主动查询支付提供商状态
4. 如果支付成功但未充值，自动触发充值
5. 返回最新订单状态
```

### 补偿流程（定时任务）

```
1. 定时任务扫描状态为 compensation_needed 的订单
2. 调用支付提供商 API 查询订单状态
3. 如果已支付但未充值，执行充值
4. 更新订单状态为 completed 或 failed
5. 记录补偿结果
```

---

## 错误响应格式

所有错误响应遵循统一格式：

```json
{
  "error": "错误消息描述"
}
```

### 常见错误消息

| 错误消息 | i18n key | 说明 |
|---------|----------|------|
| 积分数量无效 | payment_credits_invalid | 积分数量必须是 100 的倍数 |
| 积分数量超出最大限制 | payment_credits_max_exceeded | 积分数量超过 100,000 |
| 请求已过期 | payment_request_expired | timestamp 超过 5 分钟 |
| 重复请求 | payment_duplicate_request | 相同 request_hash 的请求 |
| 订单不存在 | payment_order_not_found | 订单号不存在 |
| 无权访问此订单 | payment_order_not_owned | 不是订单所有者 |
| 不支持的支付提供商 | payment_provider_invalid | provider 参数错误 |
| return_url 或 cancel_url 无效 | payment_return_url_invalid | URL 格式错误 |
| 触发限流 | rate_limit_exceeded | 请求过于频繁 |

---

## 注意事项

### 1. 认证要求
- 除 Webhook 外，所有接口都需要 JWT access_token
- Token 应放在 Authorization header 中：`Bearer YOUR_ACCESS_TOKEN`
- Token 过期后使用 `/auth/token/refresh` 刷新

### 2. 用户权限
- 用户只能查看自己创建的订单
- 所有查询自动基于 user_id 过滤
- 订单详情查询会验证所有权

### 3. 安全防护
- **防重放攻击**：使用 request_hash（SHA256）确保请求唯一性
- **签名验证**：Webhook 必须通过支付提供商的签名验证
- **幂等性**：使用 PayPal event_id 确保事件只处理一次
- **请求过期**：timestamp 有效期 5 分钟

### 4. 积分规则
- 汇率：100 积分 = 1 USD
- 积分数量必须是 100 的倍数
- 积分范围：100 - 100,000

### 5. 支付提供商差异
- 不同提供商可能有不同的 metadata 要求
- Payin 支持网络选择（如 TRC20、ERC20）
- Webhook 响应格式不同（Paydify 使用纯文本）

### 6. 限流保护
- 创建订单：5 次/分钟
- 查询订单：20 次/分钟
- Webhook 无限流（信任支付提供商）

### 7. 补偿机制
- 状态为 `compensation_needed` 的订单会被定时任务补偿
- 最多重试 5 次
- 超过重试次数标记为 failed

### 8. 时间格式
- 所有时间使用 ISO 8601 格式（UTC）
- timestamp 使用 Unix 秒
- 示例：`2025-01-28T00:00:00Z`

### 9. Webhook 注意事项
- Webhook 必须公网可访问
- 建议使用 HTTPS 确保传输安全
- 即使处理失败也返回 200，避免重复通知
- 使用 event_id 实现幂等性

### 10. 支付页面重定向
- 创建订单后，引导用户跳转到 `approval_url`
- 用户完成支付后，支付提供商会重定向到 `return_url`
- 用户取消支付会重定向到 `cancel_url`
- 建议在 `return_url` 页面查询订单状态确认支付

---

## 安全说明

1. **认证**: 订单管理接口需要 JWT token 认证
2. **授权**: 用户只能访问自己的订单
3. **签名验证**: Webhook 必须通过支付提供商的签名验证
4. **防重放攻击**: 使用 request_hash 确保请求唯一性
5. **幂等性**: 使用 event_id 确保事件只处理一次
6. **输入验证**: 所有输入参数都经过验证
7. **限流保护**: 防止 API 滥用
8. **日志记录**: 所有关键操作都有日志记录（使用 slog）

---

## 支付提供商配置

### 环境变量

**PayPal:**
- `PAYPAL_CLIENT_ID` - PayPal 客户端 ID
- `PAYPAL_CLIENT_SECRET` - PayPal 客户端密钥
- `PAYPAL_MODE` - PayPal 模式（sandbox/live）
- `PAYPAL_WEBHOOK_ID` - PayPal Webhook ID

**Payin:**
- `PAYIN_API_KEY` - Payin API Key
- `PAYIN_WEBHOOK_SECRET` - Payin Webhook 密钥

**Paydify:**
- `PAYDIFY_API_KEY` - Paydify API Key
- `PAYDIFY_WEBHOOK_SECRET` - Paydify Webhook 密钥

---

**文档版本:** 1.0
**最后更新:** 2025-02-09
**作者:** joyful-words development team
