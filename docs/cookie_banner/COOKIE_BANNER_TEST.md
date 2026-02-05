# Cookie Banner 集成测试清单

## 实施完成状态

✅ Phase 1: 基础设施
- [x] 添加 TypeScript 类型定义 (`components/cookie-banner/types.ts`)
- [x] 添加 i18n 翻译 (zh.ts, en.ts)
- [x] 环境变量配置 (.env.example, .env.local)

✅ Phase 2: 核心组件
- [x] 创建 CookieBannerProvider (`components/cookie-banner/cookie-banner-provider.tsx`)
- [x] 集成到 AuthCard (`components/auth/auth-card.tsx`)
- [x] 静态文件部署到 `public/components/cookie-banner/`
- [x] 更新 middleware.ts 以允许访问 .css 和 .js 文件

## 测试步骤

### 1. 启动开发服务器

```bash
pnpm dev
```

服务器应运行在 http://localhost:3000

### 2. 访问登录页

打开浏览器访问: http://localhost:3000/auth/login

### 3. 验证 Cookie Banner 显示

**预期行为:**
- 首次访问时,页面底部应显示 Cookie Banner
- Banner 应显示中文文本(因为默认语言是中文)
- Banner 应包含三个按钮:
  - "全部接受" (Accept All)
  - "拒绝非必要 Cookie" (Reject Non-Essential)
  - "偏好设置" (Preferences)

### 4. 测试用户操作

#### 4.1 点击"全部接受"
- Banner 应消失
- 右下角应显示 Cookie Icon
- localStorage 应包含以下键:
  - `silktideCookieChoice_necessary_auth`
  - `silktideCookieChoice_analytics_auth`
  - `silktideCookieBanner_InitialChoice_auth`

#### 4.2 刷新页面
- Banner 不应再显示
- Cookie Icon 仍应显示在右下角

#### 4.3 点击 Cookie Icon
- 应打开偏好设置 Modal
- Modal 应显示两种 Cookie 类型:
  - "必要 Cookie" (Necessary) - 必选,已启用
  - "分析" (Analytics) - 可选

#### 4.4 修改选择并保存
- 取消 "分析" Checkbox
- 点击保存
- Modal 应关闭
- localStorage 中 `analytics` 的值应变为 "false"

### 5. 测试 i18n

#### 5.1 切换到英文
- 点击语言切换器中的 "EN" 按钮
- Cookie Icon 应保持显示
- 点击 Cookie Icon 打开 Modal
- Modal 文本应立即更新为英文

#### 5.2 切换回中文
- 点击 "ZH" 按钮
- Modal 文本应立即更新回中文

### 6. 重置选择记录

打开浏览器控制台,执行:

```javascript
localStorage.removeItem('silktideCookieChoice_necessary_auth')
localStorage.removeItem('silktideCookieChoice_analytics_auth')
localStorage.removeItem('silktideCookieBanner_InitialChoice_auth')
```

刷新页面,Banner 应重新显示。

### 7. 测试注册页

访问: http://localhost:3000/auth/signup

重复步骤 3-6,验证行为一致。

## 浏览器控制台检查

打开开发者工具,检查:

### Console 标签页

应看到以下调试日志:
```
[Cookie Banner] Assets loaded
[Cookie Banner] Configuration updated {locale: 'zh'}
```

点击按钮时:
```
[Cookie Banner] All cookies accepted
[Cookie Banner] Analytics cookies accepted
[Cookie Banner] Preferences modal opened
```

### Network 标签页

应看到以下请求成功:
- `silktide-consent-manager.css` (200 OK)
- `silktide-consent-manager.js` (200 OK)

### Application 标签页

#### Local Storage
应包含:
```
silktideCookieChoice_necessary_auth: "true"
silktideCookieChoice_analytics_auth: "true" (或 "false")
silktideCookieBanner_InitialChoice_auth: "true"
```

## 常见问题排查

### 问题 1: Cookie Banner 没有显示

**检查:**
1. 环境变量是否设置: `NEXT_PUBLIC_ENABLE_COOKIE_BANNER=true`
2. 浏览器控制台是否有错误
3. Network 标签页中 Silktide 文件是否成功加载 (200 OK)
4. localStorage 中是否已有选择记录

**解决方案:**
- 清除 localStorage 刷新页面
- 检查浏览器控制台的错误信息

### 问题 2: 语言切换后文本没有更新

**检查:**
1. 打开浏览器控制台,查看是否有 "Configuration updated" 日志
2. 确认 `locale` 参数是否正确传递

**解决方案:**
- 硬刷新页面 (Ctrl+Shift+R 或 Cmd+Shift+R)
- 检查 i18n 翻译文件中 `cookieBanner.*` 键是否存在

### 问题 3: Silktide 文件返回 404 或 307

**检查:**
1. `public/components/cookie-banner/` 目录是否存在
2. `middleware.ts` 是否正确排除了 .css 和 .js 文件

**解决方案:**
- 确保文件已复制到 `public/` 目录
- 检查 middleware.ts 中的 matcher 配置

## 当前状态

- ✅ 所有代码已实现
- ✅ 静态文件已部署
- ✅ middleware 已更新
- ⏳ 等待手动测试验证

## 下一步

请在浏览器中执行上述测试步骤,并报告结果。
