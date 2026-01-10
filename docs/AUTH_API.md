# 认证接口 API 文档

基于邮箱和密码的用户认证系统，支持注册、登录、令牌刷新、密码管理和 Google OAuth 2.0 第三方登录。

**基础地址:** `http://localhost:8080`

**认证方式:** Bearer Token (JWT)

**登录方式:**
- 邮箱 + 密码登录
- Google OAuth 2.0 登录（需要配置环境变量）

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
9. [Google OAuth 登录](#9-google-oauth-登录)
10. [Google OAuth 回调](#10-google-oauth-回调)

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

## 9. Google OAuth 登录

发起 Google OAuth 2.0 登录流程，获取 Google 授权 URL。

### 接口信息

- **URL:** `/auth/google/login`
- **方法:** `POST`
- **需要认证:** 否

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| redirect_url | string | 否 | 登录成功后前端希望重定向的 URL（可选） |

### 请求示例

```bash
curl -X POST http://localhost:8080/auth/google/login \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -d '{
    "redirect_url": "https://yourdomain.com/dashboard"
  }'
```

或简化版本（不传 redirect_url）：

```bash
curl -X POST http://localhost:8080/auth/google/login \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 响应

**成功 (200 OK)**

```json
{
  "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fauth%2Fgoogle%2Fcallback&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile&state=...",
  "state": "base64_encoded_random_string"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| auth_url | string | Google 授权 URL，前端需要将用户重定向到此 URL |
| state | string | 用于 CSRF 保护的随机字符串（10 分钟有效） |

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 500 | 生成 state 参数失败 |
| 500 | 保存 state 参数失败 |

### 前端集成流程

1. 调用此接口获取 `auth_url` 和 `state`
2. 将用户浏览器重定向到 `auth_url`
3. 用户完成 Google 登录授权后，Google 会重定向回回调接口

**JavaScript 示例：**

```javascript
// 1. 请求 Google 登录 URL
const response = await fetch('/auth/google/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    redirect_url: window.location.origin + '/dashboard'
  })
});

const { auth_url } = await response.json();

// 2. 重定向到 Google
window.location.href = auth_url;
```

---

## 10. Google OAuth 回调

处理 Google OAuth 2.0 回调，完成登录并返回 JWT 令牌。

### 接口信息

- **URL:** `/auth/google/callback`
- **方法:** `GET`
- **需要认证:** 否
- **调用方:** Google OAuth 服务（重定向）

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | string | 是 | Google 授权码（由 OAuth 流程自动附加） |
| state | string | 是 | 状态参数（由 OAuth 流程自动附加） |

### 请求流程

1. 用户在 Google 授权页面同意授权
2. Google 自动重定向浏览器到此接口
3. URL 格式：`/auth/google/callback?code=...&state=...`
4. 后端处理完成后返回 JWT 令牌

### 响应

**成功 (200 OK)**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "rt_...",
  "expires_in": 900,
  "user": {
    "id": 123,
    "email": "user@gmail.com"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| access_token | string | JWT 访问令牌（15 分钟有效） |
| refresh_token | string | 刷新令牌（30 天有效） |
| expires_in | number | 访问令牌过期时间（秒） |
| user.id | number | 用户 ID |
| user.email | string | 用户 Google 邮箱 |

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 缺少 OAuth 参数（code 或 state） |
| 400 | 无效或已过期的 state 参数 |
| 400 | OAuth 令牌交换失败 |
| 400 | 无法获取用户信息 |
| 400 | 邮箱未验证 |
| 500 | 服务器内部错误 |

### 前端处理建议

前端需要处理两种情况：

**方式 1：直接在回调页面显示令牌**

```javascript
// 在 /auth/google/callback 页面
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

// 如果有 code 和 state，说明是 OAuth 回调
if (code && state) {
  // 后端已经处理完 OAuth，直接从响应中获取 token
  // 或者前端可以再次调用 API 获取 token
}
```

**方式 2：前端接收处理后跳转（推荐）**

前端无需直接处理此接口，只需：

1. 用户完成 Google 登录
2. Google 重定向到 `/auth/google/callback?code=...&state=...`
3. 后端返回 JSON 响应包含 JWT 令牌
4. 前端解析响应并保存令牌
5. 重定向到目标页面

### 完整登录流程示例

```javascript
// 步骤 1: 发起登录
async function loginWithGoogle() {
  const response = await fetch('/auth/google/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const { auth_url } = await response.json();

  // 保存预期的 state（用于后续验证）
  sessionStorage.setItem('oauth_state', state);

  // 重定向到 Google
  window.location.href = auth_url;
}

// 步骤 2: 处理回调（在回调页面）
// 当用户被重定向回来时，后端会自动处理 OAuth 流程
// 并返回包含 token 的 JSON 响应
```

### 账号关联逻辑

系统会自动处理以下情况：

1. **首次登录：** 创建新用户账号，关联 Google OAuth
2. **再次登录：** 使用现有账号，更新 OAuth token
3. **邮箱已存在：** 如果 Google 邮箱已通过邮箱注册，会自动关联到现有账号

### 安全特性

- **CSRF 保护：** 使用 state 参数防止跨站请求伪造
- **State 过期：** state 参数 10 分钟后失效
- **邮箱验证：** 只接受已验证的 Google 账号
- **Token 轮换：** 每次登录更新 OAuth 令牌

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

### Google OAuth 登录流程

```
1. POST /auth/google/login    → 获取 Google 授权 URL
2. 重定向到 Google            → 用户完成授权
3. GET /auth/google/callback  → Google 回调，返回 JWT 令牌
```

**特点：**
- 无需密码，使用 Google 账号登录
- 自动创建或关联用户账号
- 返回标准 JWT 令牌，与其他登录方式统一
- 支持账号关联（Google 邮箱与已注册邮箱自动绑定）

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
4. **Token 过期:** access_token 有效期较短（15 分钟），refresh_token 有效期较长（30 天）
5. **Token 轮换:** 刷新令牌时会自动轮换，旧的 refresh_token 会立即失效
6. **密码修改影响:** 修改密码后会撤销所有现有会话，需要在所有设备重新登录
7. **密码重置影响:** 密码重置后会撤销所有现有会话，需要在所有设备重新登录
8. **会话管理:** 每次登录会创建新会话，登出会撤销对应会话
9. **邮件速率限制:** 每个邮箱或 IP 地址每天最多发送 5 封验证邮件（包括注册和密码重置）
10. **防枚举保护:** 为防止邮箱枚举攻击，密码重置请求即使用户不存在也返回成功
11. **Google OAuth 环境变量:** Google OAuth 功能需要配置 `GOOGLE_OAUTH_CLIENT_ID`、`GOOGLE_OAUTH_CLIENT_SECRET` 和 `GOOGLE_OAUTH_REDIRECT_URL` 环境变量，未配置时相关接口不可用
12. **OAuth State 有效期:** Google OAuth 的 state 参数有效期为 10 分钟，超时需重新发起登录
13. **账号自动关联:** 如果 Google 邮箱已通过邮箱密码方式注册，使用 Google 登录会自动关联到现有账号
14. **OAuth 用户无密码:** 通过 Google OAuth 创建的用户没有设置密码，无法使用邮箱密码登录，只能通过 Google 或重置密码后登录
