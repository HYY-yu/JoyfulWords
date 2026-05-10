# Auth Session Bootstrap

## 目标

保证用户在以下场景仍能顺利进入系统：

- 浏览器里仍然持有有效的 `refresh_token` HttpOnly Cookie
- 前端本地 `access_token` 或 `auth_user` 丢失、过期或损坏
- 用户直接打开受保护页面，如 `/articles`

## 当前约定

认证状态分成两层：

1. **服务端准入**
   - `proxy.ts` 只认 `refresh_token` Cookie
   - 没有 Cookie 的请求会被重定向到 `/auth/login`

2. **客户端运行态**
   - `tokenStore` 持有 `access_token`
   - `AuthProvider` 持有当前 `user`
   - `authenticatedApiRequest` 在业务请求前确保 `access_token` 可用

只要两层不一致，就可能出现“服务端放行了，但客户端把用户踢回登录页”的问题。

## 启动恢复流程

实现位置：

- `/Volumes/GW/codes/frontendProject/JoyfulWords/lib/auth/auth-context.tsx`
- `/Volumes/GW/codes/frontendProject/JoyfulWords/lib/auth/session-policy.ts`

流程如下：

1. `AuthProvider` 启动时先读取本地 `auth_user` 和 `access_token`
2. 如果两者都存在，直接完成 hydration
3. 如果缺任意一项，按 `shouldAttemptSessionRestore()` 决定是否尝试恢复
4. 需要恢复时，调用 `/auth/token/refresh`
5. 刷新成功：
   - 写入新的 `access_token`
   - 用返回的 `user` 恢复 `AuthContext`
6. 刷新失败：
   - 清理本地认证状态
   - 保持未登录态

## 何时会尝试恢复

会恢复：

- 受保护页面首次加载，且本地没有完整 auth 状态
- 本地只有 `auth_user`，没有 `access_token`
- 本地只有 `access_token`，没有 `auth_user`

不会恢复：

- 当前是公开页面，且本地完全没有 auth 状态
- 本地已经同时拥有 `auth_user` 和 `access_token`

## 为什么这样设计

原因有两个：

1. 浏览器无法直接读取 HttpOnly `refresh_token` Cookie
2. 客户端是否“看起来已登录”不能只依赖 localStorage

因此，受保护页面的首次启动必须允许一次“用 refresh cookie 换回运行态”的恢复动作。

## 业务请求保护

页面组件的 effect 可能早于 `AuthProvider` 完成启动恢复。为了避免业务接口在这个窗口内裸发请求，`authenticatedApiRequest` 也承担一层保护：

1. 业务请求前先检查本地 `access_token`
2. 缺失或过期时，先调用 `/auth/token/refresh`
3. 刷新成功后，带 `Authorization` 发送原请求
4. 刷新失败时，不继续发送原业务请求，并跳转登录

这条链路解决的是“页面已经被 `proxy.ts` 放行，但客户端运行态尚未恢复”的竞态。

旧的显式 token helper `getValidAccessToken()` 也必须走同一套 refresh-cookie 恢复逻辑。支付等历史调用点不能只检查本地 `access_token`，否则会绕过 `authenticatedApiRequest` 的保护。

## 维护要求

- 不要让 `proxy.ts` 和 `AuthProvider` 使用不同的公开路由判定规则
- 新增 auth 页面或公开页面时，同时更新 `lib/auth/session-policy.ts`
- 如果后端修改 `/auth/token/refresh` 返回体，必须同步检查：
  - `lib/auth/auth-context.tsx`
  - `lib/api/client.ts`
  - `lib/tokens/refresh.ts`
  - `docs/api/AUTH_API.md`

## 观测建议

- `info`：记录 session restore 开始/成功
- `warn`：记录 restore 失败的 `status` 和错误消息
- `debug`：记录跳过 restore 的原因

后续可在这些节点补充 tracing 和 metrics 采集。
