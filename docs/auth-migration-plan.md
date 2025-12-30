# 迁移计划：从 Supabase Auth 到自定义认证服务

**项目：** JoyfulWords 认证系统迁移
**目标：** 将现有的 Supabase Auth 系统迁移到自定义后端认证服务
**后端 API：** http://localhost:8080
**用户决策：**
- ✅ Token 存储：localStorage + cookies
- ✅ 完全移除 OAuth（只保留邮箱密码登录）
- ✅ 用户资料：暂时只使用 email
- ✅ 无现有用户数据需要迁移

- 检查 API.md 获取后端文档

---

## 一、架构概览

### 当前架构（Supabase）
```
React Components → Supabase SDK → Supabase Auth Service
                      ↓
              HTTP-only cookies (managed by Supabase)
                      ↓
              Middleware auto-refresh
```

### 目标架构（自定义 API）
```
React Components → Custom API Client → Backend Auth API
                      ↓
         localStorage (access_token) + cookies (refresh_token)
                      ↓
              AuthContext + Token Manager (manual refresh)
```

---

## 二、关键文件清单

### 需要新增的文件（7个）
```
lib/
├── api/
│   ├── client.ts                     # 浏览器 API 客户端
│   ├── server.ts                     # 服务端 API 客户端
│   └── types.ts                      # API 类型定义
├── tokens/
│   ├── token-manager.ts              # Token 存储管理
│   └── refresh.ts                    # Token 自动刷新逻辑
└── config.ts                         # 环境配置

components/auth/
└── verify-code-form.tsx              # 验证码输入组件
```

### 需要修改的文件（10个）
```
lib/auth/
└── auth-context.tsx                  # 核心认证上下文

components/auth/
├── login-form.tsx                    # 登录表单
├── signup-form.tsx                   # 注册表单
├── forgot-password-form.tsx          # 密码重置表单
└── password-strength.tsx             # 密码强度组件

app/
├── auth/
│   ├── signup/page.tsx               # 注册页面
│   ├── forgot-password/page.tsx      # 密码重置页面
│   └── signout/actions.ts            # 登出 Action
└── layout.tsx                        # 根布局

middleware.ts                          # 路由保护中间件
lib/i18n/locales/{zh,en}.ts           # 国际化翻译
```

### 需要删除的文件（5个）
```
lib/supabase/                         # 整个目录
    ├── client.ts
    ├── server.ts
    └── middleware.ts

components/auth/
└── google-oauth-button.tsx           # Google OAuth 按钮

app/auth/callback/
└── route.ts                          # OAuth 回调路由
```

---

## 三、实施步骤

### Phase 1: 基础设施层（优先级：高）

#### 1.1 创建类型定义
**文件：** `/lib/api/types.ts`

定义所有 API 请求和响应类型：
```typescript
// 请求类型
export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequestCode {
  email: string
}

export interface SignupVerify {
  email: string
  code: string
  password: string
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface LogoutRequest {
  refresh_token: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetVerify {
  email: string
  code: string
  password: string
}

// 响应类型
export interface AuthResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  user: User
}

export interface User {
  id: number
  email: string
}

export interface MessageResponse {
  message: string
}

export interface ErrorResponse {
  error: string
}

export interface Tokens {
  access_token: string
  refresh_token: string
  expires_in: number
  user: User
}
```

#### 1.2 创建 API 配置
**文件：** `/lib/config.ts`

```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
```

#### 1.3 实现浏览器 API 客户端
**文件：** `/lib/api/client.ts`

核心功能：
- 封装所有认证 API 调用
- 自动添加 Authorization header
- 自动处理 Accept-Language header
- 统一错误处理
- 实现方法：
  - `login(email, password)` - 登录
  - `requestSignupCode(email)` - 请求注册验证码
  - `verifySignupCode(email, code, password)` - 验证码注册
  - `refreshToken(refresh_token)` - 刷新 token
  - `logout(refresh_token)` - 登出
  - `requestPasswordReset(email)` - 请求密码重置
  - `verifyPasswordReset(email, code, password)` - 验证码重置密码

#### 1.4 实现 Token 管理器
**文件：** `/lib/tokens/token-manager.ts`

核心功能：
- `setTokens(tokens)` - 存储到 localStorage + cookies
- `getTokens()` - 获取所有 token
- `getAccessToken()` - 获取 access token
- `getRefreshToken()` - 优先从 localStorage，fallback 到 cookies
- `clearTokens()` - 清除所有 token
- `isTokenExpired()` - 检查是否需要刷新（提前 1 分钟）
- `getUser()` - 获取当前用户信息

存储策略：
- `access_token` → localStorage（方便客户端使用）
- `refresh_token` → localStorage + HTTP-only cookie（服务器可访问）
- `expires_at` → localStorage（过期时间戳）
- `user` → localStorage（用户信息）

#### 1.5 实现 Token 自动刷新
**文件：** `/lib/tokens/refresh.ts`

核心功能：
- `refreshAccessToken()` - 刷新 access token
  - 防止并发刷新（使用 Promise 锁）
  - 刷新失败时清除所有 token
- `setupTokenRefresh()` - 启动定时器
  - 每分钟检查一次 token 是否即将过期
  - 自动调用 refresh

#### 1.6 更新环境变量
**文件：** `.env.example`

```bash
# 移除
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

# 新增
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### Phase 2: 核心认证逻辑（优先级：高）

#### 2.1 重构 AuthContext
**文件：** `/lib/auth/auth-context.tsx`

完全重写，保持 useAuth hook 接口兼容：

```typescript
interface AuthContextType {
  user: User | null
  session: Tokens | null
  loading: boolean

  // 认证方法
  signInWithEmail(email, password)
  requestSignupCode(email)              // 新增
  verifySignupCode(email, code, password) // 新增
  signOut()
  requestPasswordReset(email)           // 新增
  verifyPasswordReset(email, code, password) // 新增

  // 移除的方法
  // signUpWithEmail() → 改为两步流程
  // signInWithGoogle() → 完全移除
}
```

关键变更：
- 使用 `apiClient` 替代 `supabase.auth`
- 使用 `TokenManager` 管理会话
- 组件挂载时从 localStorage 恢复会话
- 自动设置 token 刷新定时器
- 错误处理使用 toast 通知

#### 2.2 实现服务端 API 客户端
**文件：** `/lib/api/server.ts`

用于 Server Components 和 Server Actions：
- 从 cookies 读取 refresh_token
- 创建请求时自动添加 Authorization header
- 提供 `getUser()` 方法获取当前用户

#### 2.3 更新中间件
**文件：** `/middleware.ts`

核心逻辑：
- 从 cookies 读取 refresh_token
- 判断用户是否已认证
- 未认证用户访问受保护路由 → 重定向到 `/auth/login`
- 已认证用户访问 `/auth/*` → 重定向到首页

移除：
- Supabase 的 `updateSession` 调用
- 复杂的 cookie 重写逻辑

---

### Phase 3: UI 组件改造（优先级：中）

#### 3.1 修改登录表单
**文件：** `/components/auth/login-form.tsx`

移除：
- Google OAuth 按钮和相关逻辑
- `signInWithGoogle()` 函数
- `GoogleOAuthButton` 组件引用

保持：
- 邮箱密码输入
- "记住我" 选项（使用 localStorage 实现）
- 密码显示/隐藏切换
- 忘记密码链接
- 表单验证逻辑

#### 3.2 重构注册表单
**文件：** `/components/auth/signup-form.tsx`

改为两步验证码流程：

**Step 1: 请求验证码**
- 只需要输入邮箱
- 点击"发送验证码"按钮
- 调用 `requestSignupCode(email)`
- 显示"验证码已发送"提示

**Step 2: 验证并注册**
- 显示验证码输入框（6位）
- 显示密码输入框（最小 8 位）
- 显示确认密码输入框
- 调用 `verifySignupCode(email, code, password)`
- 成功后重定向到 `/auth/login?signup=success`

移除：
- 全名输入框（用户资料暂时不需要）
- 服务条款复选框（简化流程）
- Google OAuth 按钮

#### 3.3 创建验证码输入组件
**文件：** `/components/auth/verify-code-form.tsx`

通用验证码输入组件：
- 6 位数字验证码输入
- 密码输入框
- 确认密码输入框（可选）
- 提交按钮
- 倒计时重发功能（60秒）

用于：
- 注册验证
- 密码重置验证

#### 3.4 修改密码重置表单
**文件：** `/components/auth/forgot-password-form.tsx`

改为两步验证码流程：

**Step 1: 请求重置**
- 只需要输入邮箱
- 点击"发送验证码"按钮
- 调用 `requestPasswordReset(email)`

**Step 2: 验证并重置**
- 输入 6 位验证码
- 输入新密码（最小 8 位）
- 调用 `verifyPasswordReset(email, code, password)`
- 成功后重定向到 `/auth/login?reset=success`

#### 3.5 修改密码强度组件
**文件：** `/components/auth/password-strength.tsx`

调整最小长度要求：
- 从 6 位改为 8 位
- 保持其他强度检查逻辑

---

### Phase 4: 页面和路由（优先级：中）

#### 4.1 更新注册页面
**文件：** `/app/auth/signup/page.tsx`

- 适配新的两步注册流程
- 更新页面文案和提示信息
- 添加步骤指示器

#### 4.2 更新密码重置页面
**文件：** `/app/auth/forgot-password/page.tsx`

- 适配新的两步重置流程
- 更新页面文案

#### 4.3 删除 OAuth 回调路由
**文件：** `/app/auth/callback/route.ts`

- 完全删除此文件

#### 4.4 更新登出 Action
**文件：** `/app/auth/signout/actions.ts`

修改为：
```typescript
'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function signOut() {
  const cookieStore = await cookies()

  // Clear refresh token cookie
  cookieStore.delete('refresh_token')

  // Clear localStorage tokens will be handled by client-side
  redirect('/auth/login')
}
```

#### 4.5 更新根布局
**文件：** `/app/layout.tsx`

确保 AuthProvider 正确包装应用（保持不变）

---

### Phase 5: 清理和优化（优先级：低）

#### 5.1 移除 Supabase 依赖
**文件：** `package.json`

```bash
pnpm remove @supabase/supabase-js @supabase/ssr
```

#### 5.2 删除 Supabase 文件
```bash
rm -rf /lib/supabase
rm -f /app/auth/callback/route.ts
rm -f /components/auth/google-oauth-button.tsx
```

#### 5.3 更新国际化
**文件：** `/lib/i18n/locales/zh.ts` 和 `/lib/i18n/locales/en.ts`

新增翻译键：
```typescript
auth: {
  requestVerificationCode: '请求验证码',
  verificationCode: '验证码',
  verificationCodeSent: '验证码已发送至您的邮箱',
  enterVerificationCode: '请输入6位验证码',
  invalidVerificationCode: '验证码无效或已过期',
  codeExpired: '验证码已过期',
  resendCode: '重新发送',
  signupComplete: '注册成功，请登录',
  passwordResetComplete: '密码重置成功，请登录',
}
```

#### 5.4 更新文档
**文件：** `/docs/auth.md`

- 移除所有 Supabase 相关内容
- 更新为自定义认证系统文档
- 更新 API 使用示例
- 更新环境配置说明

---

## 四、关键实现细节

### 4.1 Token 刷新流程

```
用户登录
    ↓
存储 tokens (access_token: 1h, refresh_token: 30d)
    ↓
setupTokenRefresh() 启动定时器
    ↓ 每 60 秒检查
isTokenExpired()? (提前 1 分钟)
    ↓ Yes
refreshAccessToken()
    ↓
POST /auth/token/refresh
    ↓
更新 localStorage 中的 tokens
    ↓
更新 AuthContext 状态
```

### 4.2 注册流程

```
用户访问 /auth/signup
    ↓
输入邮箱 → 点击"发送验证码"
    ↓
调用 requestSignupCode(email)
    ↓
POST /auth/signup/request
    ↓
显示验证码输入界面
    ↓
输入验证码 + 密码 → 点击"验证并注册"
    ↓
调用 verifySignupCode(email, code, password)
    ↓
POST /auth/signup/verify
    ↓
重定向到 /auth/login?signup=success
```

### 4.3 密码重置流程

```
用户访问 /auth/forgot-password
    ↓
输入邮箱 → 点击"发送验证码"
    ↓
调用 requestPasswordReset(email)
    ↓
POST /auth/password/reset/request
    ↓
显示验证码输入界面
    ↓
输入验证码 + 新密码 → 点击"重置密码"
    ↓
调用 verifyPasswordReset(email, code, password)
    ↓
POST /auth/password/reset/verify
    ↓
重定向到 /auth/login?reset=success
```

---

## 五、测试策略

### 5.1 手动测试清单

**注册流程：**
- [ ] 输入邮箱发送验证码
- [ ] 验证码发送成功提示
- [ ] 输入验证码和密码完成注册
- [ ] 注册成功后重定向到登录页
- [ ] 使用新账号登录成功

**登录流程：**
- [ ] 输入错误密码显示错误提示
- [ ] 输入正确凭据登录成功
- [ ] Token 正确存储到 localStorage 和 cookies
- [ ] 登录后重定向到首页
- [ ] 刷新页面保持登录状态

**Token 刷新：**
- [ ] 登录后等待接近 1 小时
- [ ] Token 自动刷新成功
- [ ] 用户无感知刷新过程

**密码重置：**
- [ ] 请求重置验证码
- [ ] 输入验证码和新密码
- [ ] 重置成功后可以使用新密码登录

**登出：**
- [ ] 点击登出按钮
- [ ] Token 被清除
- [ ] 重定向到登录页
- [ ] 无法访问受保护页面

**路由保护：**
- [ ] 未登录访问首页 → 重定向到登录页
- [ ] 已登录访问登录页 → 重定向到首页
- [ ] 未登录访问任何受保护路由 → 重定向到登录页

### 5.2 错误处理测试

- [ ] 网络错误时显示友好提示
- [ ] API 返回 429（限流）时提示用户
- [ ] 验证码过期时显示正确错误信息
- [ ] Token 刷新失败时自动登出

> 后端的信息会自动进行 i18n ，直接展示给用户看就行

---

## 六、风险和缓解措施

### 6.1 XSS 攻击风险
**风险：** access_token 存储在 localStorage 易受 XSS 攻击

**缓解：**
- 实施 CSP (Content Security Policy)
- 使用 HTTPS
- Refresh token 在 HTTP-only cookie（更安全）
- Access token 只有 1 小时有效期 (遵循后端设计)
- 定期审计前端依赖

### 6.2 Token 刷新失败
**风险：** 自动刷新失败导致用户突然登出

**缓解：**
- 提前 1 分钟刷新 token
- 刷新失败时保存当前页面路径
- 允许用户刷新页面重新登录
- 实现指数退避重试机制

### 6.3 并发请求
**风险：** 多个请求同时触发 token 刷新

**缓解：**
- 使用 Promise 锁防止并发刷新
- 只保留一个活跃的刷新请求

### 6.4 SSR 兼容性 (不需要 SSR 兼容性， 纯前端项目)

---

## 七、迁移后检查清单

### 功能验证
- [ ] 注册流程完整可用
- [ ] 登录功能正常
- [ ] Token 自动刷新工作正常
- [ ] 密码重置功能正常
- [ ] 登出功能正常
- [ ] 路由保护正常
- [ ] 国际化正常显示

### 依赖清理
- [ ] 移除所有 Supabase 依赖
- [ ] 删除所有 Supabase 相关文件
- [ ] 更新环境变量配置

### 文档更新
- [ ] 更新 `/docs/auth.md`
- [ ] 更新 API 文档
- [ ] 更新 CLAUDE.md

### 代码质量
- [ ] TypeScript 无编译错误
- [ ] ESLint 无警告
- [ ] 所有组件正常工作
- [ ] 无 console 错误

---

## 八、预估时间

| 阶段 | 任务 | 预估时间 |
|------|------|----------|
| Phase 1 | 基础设施（类型、API 客户端、Token 管理） | 4-6 小时 |
| Phase 2 | 核心逻辑（AuthContext、中间件） | 3-4 小时 |
| Phase 3 | UI 组件改造 | 4-5 小时 |
| Phase 4 | 页面和路由更新 | 2-3 小时 |
| Phase 5 | 清理和优化 | 2-3 小时 |
| 测试 | 完整测试所有功能 | 2-3 小时 |
| **总计** | | **17-24 小时** |

---

## 九、关键文件路径速查

**需要新增的文件（7个）：**
1. `/lib/api/types.ts` - API 类型定义
2. `/lib/api/client.ts` - 浏览器 API 客户端
3. `/lib/api/server.ts` - 服务端 API 客户端
4. `/lib/tokens/token-manager.ts` - Token 管理器
5. `/lib/tokens/refresh.ts` - Token 刷新逻辑
6. `/lib/config.ts` - 环境配置
7. `/components/auth/verify-code-form.tsx` - 验证码输入组件

**需要修改的文件（10个）：**
1. `/lib/auth/auth-context.tsx` - 核心认证上下文
2. `/middleware.ts` - 路由保护中间件
3. `/components/auth/login-form.tsx` - 登录表单
4. `/components/auth/signup-form.tsx` - 注册表单
5. `/components/auth/forgot-password-form.tsx` - 密码重置表单
6. `/components/auth/password-strength.tsx` - 密码强度组件
7. `/app/auth/signup/page.tsx` - 注册页面
8. `/app/auth/forgot-password/page.tsx` - 密码重置页面
9. `/app/auth/signout/actions.ts` - 登出 Action
10. `/lib/i18n/locales/{zh,en}.ts` - 国际化

**需要删除的文件（5个）：**
1. `/lib/supabase/client.ts`
2. `/lib/supabase/server.ts`
3. `/lib/supabase/middleware.ts`
4. `/components/auth/google-oauth-button.tsx`
5. `/app/auth/callback/route.ts`

**配置文件：**
1. `.env.example` - 环境变量
2. `package.json` - 移除 Supabase 依赖

---
---

**计划状态：** ✅ 已完成实施
**最后更新：** 2025-12-29

## 实施总结

所有5个阶段均已完成实施：

### ✅ Phase 1: 基础设施层 (已完成)
- ✅ `/lib/api/types.ts` - API 类型定义
- ✅ `/lib/api/client.ts` - 浏览器 API 客户端
- ✅ `/lib/api/server.ts` - 服务端 API 客户端
- ✅ `/lib/tokens/token-manager.ts` - Token 管理器
- ✅ `/lib/tokens/refresh.ts` - Token 刷新逻辑
- ✅ `/lib/config.ts` - 环境配置
- ✅ `.env.example` - 更新环境变量

### ✅ Phase 2: 核心认证逻辑 (已完成)
- ✅ `/lib/auth/auth-context.tsx` - 重构认证上下文
- ✅ `/middleware.ts` - 更新中间件

### ✅ Phase 3: UI 组件改造 (已完成)
- ✅ `/components/auth/login-form.tsx` - 修改登录表单（移除 OAuth）
- ✅ `/components/auth/signup-form.tsx` - 重构为两步验证码流程
- ✅ `/components/auth/verify-code-form.tsx` - 新建验证码输入组件
- ✅ `/components/auth/forgot-password-form.tsx` - 重构为两步验证码流程
- ✅ `/components/auth/password-strength.tsx` - 密码强度组件（已是8字符最小值）

### ✅ Phase 4: 页面和路由 (已完成)
- ✅ `/app/auth/callback/route.ts` - 删除 OAuth 回调路由
- ✅ `/app/auth/signout/actions.ts` - 更新登出 Action

### ✅ Phase 5: 清理和优化 (已完成)
- ✅ `package.json` - 移除 Supabase 依赖
- ✅ 删除 `/lib/supabase/` 目录
- ✅ 删除 `/components/auth/google-oauth-button.tsx`
- ✅ `/lib/i18n/locales/zh.ts` - 更新中文翻译
- ✅ `/lib/i18n/locales/en.ts` - 更新英文翻译

### 关键变更
1. **认证方式**: 从 Supabase Auth 改为自定义后端认证 API
2. **注册流程**: 改为两步验证码流程（邮箱 → 验证码+密码）
3. **密码重置**: 改为两步验证码流程（邮箱 → 验证码+新密码）
4. **Token 存储**: localStorage + cookies 混合存储
5. **OAuth**: 完全移除 Google OAuth

### 下一步
- 安装依赖: `pnpm install`
- 配置环境变量 (复制 `.env.example` 到 `.env.local`)
- 启动后端 API 服务 (`http://localhost:8080`)
- 启动开发服务器 (`pnpm dev`)
- 测试所有认证功能

---

**计划状态：** ✅ 已完成实施
**最后更新：** 2025-12-29
