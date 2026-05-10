# Local Run

## 模式选择

本地开发分两种模式，默认使用 `localhost`：

| 场景 | 前端地址 | API 地址 | 启动命令 |
|------|----------|----------|----------|
| 本地后端联调 | `http://localhost:3000` | `http://localhost:8080` | `pnpm dev` 或 `pnpm dev:local` |
| 线上 API / 线上 Cookie 合同验证 | `https://local.joyword.link:3000` | `https://api.joyword.link` | `pnpm dev:joyword` |

默认本地模式必须和本地 Go 后端保持同一个 host：前端用 `localhost:3000`，后端用 `localhost:8080`。这样浏览器 Cookie、CORS credentials、`proxy.ts` 的 Cookie 读取都落在 `localhost` 域名下，不会被 `local.joyword.link` 和 `localhost` 的域名差异拆开。

`local.joyword.link` 只用于直接连接线上 API、并复用 `.joyword.link` Cookie 合同的场景。

## 默认本地后端模式

### 环境变量

在前端项目根目录创建或修改 `.env.local`：

```env
PORT=3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

说明：

- `NEXT_PUBLIC_APP_URL` 必须和浏览器实际访问地址一致
- `NEXT_PUBLIC_API_BASE_URL` 必须和本地 Go 后端地址一致
- 本地后端的 refresh cookie 应绑定到 `localhost`，不要使用 `.joyword.link` 域

### 启动命令

在前端项目目录执行：

```bash
cd /Volumes/GW/codes/frontendProject/JoyfulWords
pnpm dev
```

启动后访问：

```text
http://localhost:3000
```

## 线上 API / Cookie 合同模式

这个模式用于让本地前端和线上 API 共享 `.joyword.link` 域下的认证 Cookie，从而验证：

- 浏览器请求 `api.joyword.link` 时能自动带上 `refresh_token`
- `proxy.ts` 在前端侧也能读到 `refresh_token`
- auth bootstrap / token refresh / protected route gating 行为尽量接近线上

### 一次性准备

### 1. 配置 hosts

把本地域名映射到 `127.0.0.1`：

```bash
echo '127.0.0.1 local.joyword.link' | sudo tee -a /etc/hosts
```

### 2. 安装 `mkcert`

macOS:

```bash
brew install mkcert
brew install nss
mkcert -install
```

说明：

- `mkcert -install` 会在本机安装一个本地受信任 CA
- 这不是公网证书，只用于本机开发

### 3. 生成 `local.joyword.link` 证书

在前端项目目录执行：

```bash
cd /Volumes/GW/codes/frontendProject/JoyfulWords
mkdir -p certificates
mkcert \
  -cert-file certificates/local.joyword.link.pem \
  -key-file certificates/local.joyword.link-key.pem \
  local.joyword.link
```

生成后会得到：

- `certificates/local.joyword.link.pem`
- `certificates/local.joyword.link-key.pem`

### 环境变量

在前端项目根目录创建或修改 `.env.local`：

```env
PORT=3000
NEXT_PUBLIC_APP_URL=https://local.joyword.link:3000
NEXT_PUBLIC_API_BASE_URL=https://api.joyword.link
```

说明：

- `NEXT_PUBLIC_APP_URL` 必须和本地实际访问地址一致
- `NEXT_PUBLIC_API_BASE_URL` 指向线上 API

### 启动命令

在前端项目目录执行：

```bash
cd /Volumes/GW/codes/frontendProject/JoyfulWords
pnpm dev:joyword
```

启动后访问：

```text
https://local.joyword.link:3000
```

### 推荐的后端 Cookie 条件

如果你要让本地前端复用线上认证 Cookie，线上 API 的 refresh cookie 应满足：

- `Domain=.joyword.link`
- `Path=/`
- `HttpOnly`
- `Secure`

当前前端 auth 链路默认就是围绕这个假设工作的。

## 验证方式

### 默认本地后端模式

页面域名必须是：

```text
http://localhost:3000
```

API 地址必须是：

```text
http://localhost:8080
```

不要混用：

- `https://local.joyword.link:3000` 前端 + `http://localhost:8080` API
- `http://localhost:3000` 前端 + `.joyword.link` Cookie

### 线上 API / Cookie 合同模式

页面域名必须是：


```text
https://local.joyword.link:3000
```

不要用：

- `http://local.joyword.link:3000`
- `http://localhost:3000`
- `https://localhost:3000`

### 看浏览器 Cookie

登录成功后，确认浏览器里存在：

- Cookie 名：`refresh_token`
- 默认本地后端模式：Domain 为 `localhost` 或 host-only
- 线上 API / Cookie 合同模式：Domain 为 `.joyword.link`
- Path：`/`
- `HttpOnly=true`
- 默认本地后端模式：本地 HTTP 可不带 `Secure`
- 线上 API / Cookie 合同模式：`Secure=true`

### 看前端受保护页面

如果 Cookie 正常：

- 打开 `/articles` 不应立即被 `proxy.ts` 重定向到 `/auth/login`
- `AuthProvider` 可以通过 `/auth/token/refresh` 恢复运行态

## 常见问题

### 1. 为什么默认要用 `localhost`

因为本地后端是 `http://localhost:8080`。前端如果跑在 `local.joyword.link`，浏览器会把页面域和 API 域分开，refresh cookie 不能按本地后端合同稳定匹配。

### 2. 为什么 `http://local.joyword.link` 不适合线上 API Cookie 合同验证

因为认证 Cookie 带 `Secure` 时，HTTP 页面无法稳定使用这套合同。

### 3. 为什么 `https://localhost` 不适合线上 API Cookie 合同验证

因为 `localhost` 不在 `.joyword.link` 域下，`proxy.ts` 无法读取目标 Cookie。

### 4. 为什么不推荐为了线上 API 调试把 Cookie 改成非 `Secure`

因为这样会让本地和生产的认证合同不一致，调试出来的问题和线上真实行为会偏离。

### 5. 为什么不建议走反代

这个文档的场景就是“不使用反代，直接连线上 API”。
如果未来要做更复杂的本地联调，再单独设计反代/网关方案。

## 相关代码位置

- `proxy.ts`
- `lib/auth/auth-context.tsx`
- `lib/auth/session-policy.ts`
- `lib/api/client.ts`
- `lib/tokens/refresh.ts`
- `lib/config.ts`

## 维护要求

- 如果本地开发域名或模式改了，必须同步更新：
  - `/etc/hosts`
  - `mkcert` 证书
  - `.env.local`
  - `package.json` 启动脚本中的 `--hostname`
- 如果后端修改了 refresh cookie 的 `Domain` / `Path` / `SameSite` / `Secure` 策略，必须重新验证这份文档是否仍然成立
