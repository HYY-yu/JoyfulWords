# Local Run

## 目标

在本地启动前端，并直接连接线上 API：

- 前端地址：`https://local.joyword.link:8190`
- API 地址：`https://api.joyword.link`
- 不使用反向代理

这个方案的核心目的，是让本地前端和线上 API 共享 `.joyword.link` 域下的认证 Cookie，从而让：

- 浏览器请求 `api.joyword.link` 时能自动带上 `refresh_token`
- `proxy.ts` 在前端侧也能读到 `refresh_token`
- auth bootstrap / token refresh / protected route gating 行为尽量接近线上

## 为什么不能用 `localhost`

当前认证模型依赖 `refresh_token` HttpOnly Cookie。

关键事实：

1. 后端 refresh cookie 在生产环境下会带 `Secure`
2. Cookie 的 `Domain` 预期是 `.joyword.link`
3. 前端 `proxy.ts` 会在当前页面域名上读取 `refresh_token`

因此：

- `http://localhost:*` 无法承载 `Secure` Cookie
- `https://localhost:*` 不属于 `.joyword.link`，前端侧也读不到该 Cookie

结论：如果本地前端要直接连线上 API，并复用线上 Cookie 合同，就必须使用 `https://local.joyword.link:*`

## 一次性准备

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

## 本地环境变量

在前端项目根目录创建或修改 `.env.local`：

```env
PORT=3000
NEXT_PUBLIC_APP_URL=https://local.joyword.link:3000
NEXT_PUBLIC_API_BASE_URL=https://api.joyword.link
```

说明：

- `PORT` 决定本地 Next dev 端口
- `NEXT_PUBLIC_APP_URL` 必须和本地实际访问地址一致
- `NEXT_PUBLIC_API_BASE_URL` 指向线上 API

## 启动命令

在前端项目目录执行：

```bash
cd /Volumes/GW/codes/frontendProject/JoyfulWords
pnpm dev -- \
  --hostname local.joyword.link \
  --port 3000 \
  --experimental-https \
  --experimental-https-key ./certificates/local.joyword.link-key.pem \
  --experimental-https-cert ./certificates/local.joyword.link.pem
```

启动后访问：

```text
https://local.joyword.link:3000
```

## 推荐的后端 Cookie 条件

如果你要让本地前端复用线上认证 Cookie，线上 API 的 refresh cookie 应满足：

- `Domain=.joyword.link`
- `Path=/`
- `HttpOnly`
- `Secure`

当前前端 auth 链路默认就是围绕这个假设工作的。

## 验证方式

### 1. 看页面域名

必须是：

```text
https://local.joyword.link:3000
```

不要用：

- `http://local.joyword.link:3000`
- `http://localhost:3000`
- `https://localhost:3000`

### 2. 看浏览器 Cookie

登录成功后，确认浏览器里存在：

- Cookie 名：`refresh_token`
- Domain：`.joyword.link` 
- Path：`/`
- `HttpOnly=true`
- `Secure=true`

### 3. 看前端受保护页面

如果 Cookie 正常：

- 打开 `/articles` 不应立即被 `proxy.ts` 重定向到 `/auth/login`
- `AuthProvider` 可以通过 `/auth/token/refresh` 恢复运行态

## 常见问题

### 1. 为什么 `http://local.joyword.link` 不行

因为认证 Cookie 带 `Secure` 时，HTTP 页面无法稳定使用这套合同。

### 2. 为什么 `https://localhost` 也不行

因为 `localhost` 不在 `.joyword.link` 域下，`proxy.ts` 无法读取目标 Cookie。

### 3. 为什么不推荐为了本地调试把 Cookie 改成非 `Secure`

因为这样会让本地和生产的认证合同不一致，调试出来的问题和线上真实行为会偏离。

### 4. 为什么不建议走反代

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

- 如果本地开发域名改了，必须同步更新：
  - `/etc/hosts`
  - `mkcert` 证书
  - `.env.local`
  - 启动命令中的 `--hostname`
- 如果后端修改了 refresh cookie 的 `Domain` / `Path` / `SameSite` / `Secure` 策略，必须重新验证这份文档是否仍然成立
