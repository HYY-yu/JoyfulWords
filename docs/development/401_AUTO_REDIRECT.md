# 401 自动跳转实现说明

## 功能概述

当 **已认证请求** 的 access token 过期时，系统会自动尝试刷新 token。如果刷新成功，会自动重试原请求；如果刷新失败，会自动跳转到登录页。

这个机制不应该影响登录、注册、重置密码等公开 auth 接口。

## 实现细节

### 1. `apiRequest` 函数增强 (lib/api/client.ts:74-139)

添加了第三个参数 `skipAuthRefresh`：

```typescript
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  skipAuthRefresh = false  // 🔥 新增参数
): Promise<T>
```

#### 401 处理流程

1. **收到 401 响应** → 检查 `skipAuthRefresh` 标志
2. **确认当前请求属于已认证请求**
   - 请求头里必须已有 `Authorization`
   - 公开 auth 接口不参与自动 refresh
3. **如果允许刷新** (`skipAuthRefresh = false`)：
   - 调用 `refreshAccessToken()` 尝试刷新 token
   - **刷新成功** → 使用新 token 重试原请求
   - **刷新失败** → 重定向到 `/auth/login?reason=token_expired`
4. **如果禁止刷新** (`skipAuthRefresh = true`)：
   - 直接返回错误，不做任何处理

### 2. 避免无限循环 (lib/api/client.ts:183-195)

在 `apiClient.refreshToken` 方法中：

```typescript
async refreshToken() {
  return apiRequest<AuthResponse | ErrorResponse>(
    '/auth/token/refresh',
    { /* options */ },
    true // 🔥 跳过 401 自动刷新，避免无限循环
  )
}
```

**为什么要这样做？**

- `refreshToken` 本身可能收到 401 响应（refresh token 也过期了）
- 如果不跳过 401 处理，会再次调用 `refreshAccessToken`
- 这会形成无限循环：`401 → refresh → 401 → refresh → ...`

## 使用示例

### 普通 API 调用（自动处理 401）

```typescript
// 只有 authenticatedApiRequest / 带 Authorization 的请求
// 才会进入自动 refresh 流程
const result = await authenticatedApiRequest('/api/user/profile')

// 如果 token 过期：
// 1. 自动刷新 token
// 2. 自动重试请求
// 3. 返回正确结果
```

### 不会触发 refresh 的场景

```typescript
// 登录失败返回 401 时，必须直接把错误透传给页面
await apiRequest('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
})
```

```typescript
// 注册、重置密码、OAuth 发起接口同理
await apiRequest('/auth/signup/request', {
  method: 'POST',
  body: JSON.stringify({ email }),
})
```

### 跳过 401 处理（内部使用）

```typescript
// 刷新 token 请求本身不触发 401 处理
await apiRequest('/auth/token/refresh', options, true)
```

## 流程图

```
┌─────────────────┐
│  API 调用       │
│  (401 错误)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ skipAuthRefresh?│
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
   NO        YES
    │         │
    ▼         ▼
┌─────────┐  ┌──────────┐
│ 尝试    │  │ 直接返回 │
│ 刷新    │  │ 错误     │
│ token   │  └──────────┘
└────┬────┘
     │
     ▼
┌─────────┐
│ 刷新    │
│ 成功?   │
└────┬────┘
     │
  ┌──┴──┐
  │     │
 YES    NO
  │     │
  ▼     ▼
┌─────┐ ┌──────┐
│ 重试 │ │ 跳转 │
│ 请求 │ │ 登录 │
└─────┘ └──────┘
```

## 测试场景

### 场景 1：Access token 过期，Refresh token 有效

1. 用户登录后，access token 过期
2. 发起 API 请求 → 收到 401
3. 自动刷新 token → 成功
4. 用新 token 重试请求 → 成功返回数据
5. ✅ 用户无感知，继续正常使用

### 场景 2：Refresh token 也过期

1. 用户长期未登录，refresh token 过期
2. 发起 API 请求 → 收到 401
3. 尝试刷新 token → 失败
4. 自动跳转到 `/auth/login?reason=token_expired`
5. ✅ 用户被引导到登录页重新登录

### 场景 3：登录失败不触发 refresh

1. 用户提交 `/auth/login`
2. 后端返回 401（账号或密码错误）
3. 前端直接返回错误消息
4. ✅ 不会误跳到 `token_expired`

### 场景 4：无限循环保护

1. Refresh token 请求收到 401
2. 因为 `skipAuthRefresh=true`，不会再次尝试刷新
3. 直接返回错误
4. ✅ 避免了无限循环

## 相关文件

- `lib/api/client.ts` - API 客户端核心实现
- `lib/auth/session-policy.ts` - 401 refresh 触发策略
- `lib/tokens/refresh.ts` - Token 刷新逻辑
- `docs/api/AUTH_API.md` - 完整的认证文档
- `docs/development/AUTH_SESSION_BOOTSTRAP.md` - 启动期会话恢复说明

## 注意事项

1. **只影响客户端请求**：这个机制只在浏览器中有效（检查 `typeof window !== 'undefined'`）
2. **不会影响服务端准入**：`proxy.ts` 仍然只认 `refresh_token` Cookie
3. **并发请求处理**：`refreshAccessToken` 使用 Promise 锁，多个并发请求只会触发一次刷新
4. **公开 auth 接口不能接入此流程**：否则会误伤登录、注册、重置密码
5. **启动期会话恢复是另一条链路**：详见 `AUTH_SESSION_BOOTSTRAP.md`
