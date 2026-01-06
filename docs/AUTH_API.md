# 认证接口 API 文档

基于邮箱和密码的用户认证系统，支持注册、登录、令牌刷新和密码管理。

**基础地址:** `http://localhost:8080`

**认证方式:** Bearer Token (JWT)

---

## 目录

1. [发送验证码](#1-发送验证码)
2. [验证码注册](#2-验证码注册)
3. [用户登录](#3-用户登录)
4. [刷新令牌](#4-刷新令牌)
5. [用户登出](#5-用户登出)
6. [修改密码](#6-修改密码)
7. [请求密码重置](#7-请求密码重置)
8. [验证密码重置](#8-验证密码重置)

---

## 1. 发送验证码

向邮箱发送 6 位数字验证码，用于后续注册验证。

### 接口信息

- **URL:** `/auth/signup/request`
- **方法:** `POST`
- **限流:** 是（防止滥用）

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 有效的邮箱地址 |

### 请求示例
[handler.go](handler.go)
```bash
curl -X POST http://localhost:8080/auth/signup/request \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -d '{
    "email": "user2@example.com"
  }'
```

### 响应

**成功 (200 OK)**

```json
{
  "message": "验证码已发送至您的邮箱"
}
```

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 请求格式错误（邮箱格式不正确） |
| 429 | 请求过于频繁（触发限流） |
| 500 | 服务器内部错误 |

---

## 2. 验证码注册

使用邮箱收到的验证码完成用户注册。

### 接口信息

- **URL:** `/auth/signup/verify`
- **方法:** `POST`

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| code | string | 是 | 6 位验证码 |
| password | string | 是 | 密码（至少 8 位） |

### 请求示例

```bash
curl -X POST http://localhost:8080/auth/signup/verify \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -d '{
    "email": "user2@example.com",
    "code": "313238",
    "password": "MySecurePassword123"
  }'
```

### 响应

**成功 (200 OK)**

```json
{
  "message": "注册成功，请登录"
}
```

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 验证码无效或已过期 |
| 400 | 验证码错误 |
| 409 | 邮箱已被注册 |
| 500 | 注册失败 |

---

## 3. 用户登录

使用邮箱和密码登录，获取访问令牌。

### 接口信息

- **URL:** `/auth/login`
- **方法:** `POST`

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码 |

### 请求示例

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -d '{
    "email": "user@example.com",
    "password": "MySecurePassword123"
  }'
```

### 响应

**成功 (200 OK)**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| access_token | string | 访问令牌（用于 API 认证） |
| refresh_token | string | 刷新令牌（用于获取新的访问令牌） |
| expires_in | number | 访问令牌过期时间（秒） |
| user.id | number | 用户 ID |
| user.email | string | 用户邮箱 |

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 请求格式错误 |
| 401 | 邮箱或密码错误 |
| 403 | 账户已被禁用 |
| 500 | 令牌生成失败 |

---

## 4. 刷新令牌

使用刷新令牌获取新的访问令牌。

### 接口信息

- **URL:** `/auth/token/refresh`
- **方法:** `POST`
- **需要认证:** 是（需要有效的 access_token）

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| refresh_token | string | 是 | 刷新令牌 |

### 请求示例

```bash
curl -X POST http://localhost:8080/auth/token/refresh \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJleHAiOjE3NjY5OTM5MTMsIm5iZiI6MTc2Njk5MzAxMywiaWF0IjoxNzY2OTkzMDEzfQ.HNMLInJmtqrr-pzzAXfmU7J3vcWSrg1eQ12_2DDQqLo" \
  -d '{
    "refresh_token": "rt_eb1cb07ac9edf82225becf3b74d2ea9483a95b4f299f2692d0c52fa8d8f87f02"
  }'
```

### 响应

**成功 (200 OK)**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

**注意:** 刷新令牌会自动轮换（rotation），每次刷新都会返回新的 refresh_token。

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 请求格式错误 |
| 401 | 无效的刷新令牌 |
| 401 | 用户不存在 |
| 500 | 令牌生成失败 |

---

## 5. 用户登出

撤销当前会话，使刷新令牌失效。

### 接口信息

- **URL:** `/auth/logout`
- **方法:** `POST`
- **需要认证:** 是（需要有效的 access_token）

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| refresh_token | string | 是 | 要撤销的刷新令牌 |

### 请求示例

```bash
curl -X POST http://localhost:8080/auth/logout \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJleHAiOjE3NjY5OTQ1NzQsIm5iZiI6MTc2Njk5MzY3NCwiaWF0IjoxNzY2OTkzNjc0fQ.uYiqY2J2vESza-FvIDqhRpCAdOdjj4oq1PJeYP_cbJM" \
  -d '{
    "refresh_token": "rt_d9c05baa01b7c6dd4967c5aa433a664be4a8f737391c1c29c3a9bbc0ba705b6a"
  }'
```

### 响应

**成功 (200 OK)**

```json
{
  "message": "登出成功"
}
```

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 请求格式错误 |
| 401 | 未授权（token 无效或过期） |
| 500 | 登出失败 |

---

## 6. 修改密码

修改当前用户的密码。

### 接口信息

- **URL:** `/auth/change_password`
- **方法:** `POST`
- **需要认证:** 是（需要有效的 access_token）

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| old_password | string | 是 | 原密码 |
| new_password | string | 是 | 新密码（至少 8 位） |

### 请求示例

```bash
curl -X POST http://localhost:8080/auth/change_password \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJleHAiOjE3NjY5OTQ1NzQsIm5iZiI6MTc2Njk5MzY3NCwiaWF0IjoxNzY2OTkzNjc0fQ.uYiqY2J2vESza-FvIDqhRpCAdOdjj4oq1PJeYP_cbJM" \
  -d '{
    "old_password": "MySecurePassword123",
    "new_password": "MyNewSecurePassword456"
  }'
```

### 响应

**成功 (200 OK)**

```json
{
  "message": "密码已修改，请重新登录"
}
```

**注意:** 修改密码后，所有现有会话将被撤销，需要重新登录。

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 请求格式错误（新密码少于 8 位） |
| 400 | 原密码错误 |
| 401 | 未授权（token 无效或过期） |
| 401 | 用户不存在 |
| 500 | 密码加密失败 |
| 500 | 密码更新失败 |

---

## 7. 请求密码重置

向注册邮箱发送 6 位数字密码重置验证码。

### 接口信息

- **URL:** `/auth/password/reset/request`
- **方法:** `POST`
- **限流:** 是（5 封邮件/天/IP 或邮箱）
- **防枚举:** 是（即使用户不存在也返回成功）

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 注册时使用的邮箱地址 |

### 请求示例

```bash
curl -X POST http://localhost:8080/auth/password/reset/request \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -d '{
    "email": "user@example.com"
  }'
```

### 响应

**成功 (200 OK)**

```json
{
  "message": "如果该邮箱已注册，密码重置代码已发送"
}
```

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 请求格式错误（邮箱格式不正确） |
| 429 | 请求过于频繁（超过 5 封/天） |
| 500 | 发送邮件失败 |

**注意:** 为防止邮箱枚举攻击，即使邮箱未注册也会返回成功消息。

---

## 8. 验证密码重置

使用邮箱收到的验证码完成密码重置。

### 接口信息

- **URL:** `/auth/password/reset/verify`
- **方法:** `POST`

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| code | string | 是 | 6 位验证码 |
| password | string | 是 | 新密码（至少 8 位） |

### 请求示例

```bash
curl -X POST http://localhost:8080/auth/password/reset/verify \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -d '{
    "email": "user@example.com",
    "code": "123456",
    "password": "MyNewSecurePassword123"
  }'
```

### 响应

**成功 (200 OK)**

```json
{
  "message": "密码重置成功，请登录"
}
```

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 请求格式错误（新密码少于 8 位） |
| 400 | 验证码无效或已过期 |
| 400 | 验证码错误 |
| 404 | 用户不存在 |
| 500 | 密码重置失败 |

**注意:**
1. 验证码有效期为 15 分钟
2. 密码重置成功后，所有现有会话将被撤销，需要在所有设备重新登录
3. 每个验证码只能使用一次

---

## 国际化支持

所有接口支持通过 `Accept-Language` 请求头设置语言：

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -d '{
    "email": "user@example.com",
    "password": "MySecurePassword123"
  }'
```

支持的语言：
- `en` (English)
- `zh-CN` (简体中文)

---

## 认证流程

### 注册流程

```
1. POST /auth/signup/request  → 发送验证码到邮箱
2. POST /auth/signup/verify   → 验证码 + 密码 → 完成注册
3. POST /auth/login           → 使用邮箱和密码登录
```

### 密码重置流程

```
1. POST /auth/password/reset/request  → 请求密码重置（发送验证码到邮箱）
2. 检查邮箱获取 6 位验证码
3. POST /auth/password/reset/verify   → 验证码 + 新密码 → 完成重置
4. POST /auth/login                   → 使用新密码登录
```

**安全特性:**
- 防枚举：即使用户不存在也返回成功消息
- 限流保护：5 封邮件/天/IP 或邮箱
- 会话撤销：重置后所有设备需重新登录
- 验证码过期：15 分钟有效期
- 一次性使用：每个验证码只能使用一次

### 登录后使用流程

```
1. 获取 access_token 和 refresh_token
2. 使用 access_token 调用需要认证的接口（在 Authorization header 中）
3. access_token 过期前，使用 refresh_token 刷新
4. 刷新后会获得新的 access_token 和 refresh_token
```

### Token 使用示例

```bash
# 在需要认证的接口中使用 token
curl -X GET http://localhost:8080/api/protected \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 错误响应格式

所有错误响应遵循统一格式：

```json
{
  "error": "错误消息描述"
}
```

---

## 注意事项

1. **验证码有效期:** 验证码有过期时间（默认 15 分钟），超时需重新请求
2. **验证码一次性:** 每个验证码只能使用一次
3. **密码强度:** 密码至少 8 位字符
4. **Token 过期:** access_token 有效期较短（1 小时），refresh_token 有效期较长（30 天）
5. **Token 轮换:** 刷新令牌时会自动轮换，旧的 refresh_token 会立即失效
6. **密码修改影响:** 修改密码后会撤销所有现有会话，需要在所有设备重新登录
7. **密码重置影响:** 密码重置后会撤销所有现有会话，需要在所有设备重新登录
8. **会话管理:** 每次登录会创建新会话，登出会撤销对应会话
9. **邮件速率限制:** 每个邮箱或 IP 地址每天最多发送 5 封验证邮件（包括注册和密码重置）
10. **防枚举保护:** 为防止邮箱枚举攻击，密码重置请求即使用户不存在也返回成功
