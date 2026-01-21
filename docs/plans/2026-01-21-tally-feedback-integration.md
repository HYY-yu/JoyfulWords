# Tally.so 反馈收集功能实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 集成 Tally.so 反馈表单，为用户提供全局反馈入口，自动传递用户信息

**Architecture:** 使用 react-tally 库实现懒加载的悬浮按钮，通过 URL hidden fields 自动注入用户信息（user_id, email），无需跳转页面，在当前页面弹出模态框

**Tech Stack:**
- react-tally (npm 包)
- React Hooks (useState, useEffect)
- Tailwind CSS 4.x
- 项目现有的 AuthContext 和 i18n 系统

---

## 前置准备

### Task 0: 安装依赖

**Files:**
- Modify: `package.json` (通过 pnpm 命令)

**Step 1: 安装 react-tally 包**

Run: `pnpm add react-tally`

Expected: 包成功安装，package.json 中添加依赖

**Step 2: 验证安装**

Run: `cat package.json | grep react-tally`

Expected: `"react-tally": "^版本号"` 出现在 dependencies 中

**Step 3: 提交依赖安装**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: install react-tally dependency for feedback form integration"
```

---

## 国际化配置

### Task 1: 添加中文翻译

**Files:**
- Modify: `/lib/i18n/locales/zh.ts`

**Step 1: 在 zh.ts 中添加 feedback 翻译**

在 `common` 对象中添加 feedback 相关翻译（约在第 20 行后）：

```typescript
export const zh = {
    common: {
        // ... 现有翻译
        refresh: "刷新",
        feedback: "反馈",
        feedbackButton: "反馈",
        feedbackTitle: "意见反馈",
        feedbackLoading: "加载中...",
    },
    // ... 其余代码
}
```

**Step 2: 验证 TypeScript 编译**

Run: `pnpm run build`

Expected: 构建成功，无类型错误

**Step 3: 提交翻译**

```bash
git add lib/i18n/locales/zh.ts
git commit -m "feat: add Chinese translations for feedback feature"
```

### Task 2: 添加英文翻译

**Files:**
- Modify: `/lib/i18n/locales/en.ts`

**Step 1: 在 en.ts 中添加 feedback 翻译**

在 `common` 对象中添加 feedback 相关翻译（约在第 20 行后）：

```typescript
export const en = {
    common: {
        // ... 现有翻译
        refresh: "refresh",
        feedback: "Feedback",
        feedbackButton: "Feedback",
        feedbackTitle: "Send Feedback",
        feedbackLoading: "Loading...",
    },
    // ... 其余代码
}
```

**Step 2: 验证 TypeScript 编译**

Run: `pnpm run build`

Expected: 构建成功，无类型错误

**Step 3: 提交翻译**

```bash
git add lib/i18n/locales/en.ts
git commit -m "feat: add English translations for feedback feature"
```

---

## 核心组件实现

### Task 3: 创建 FeedbackButton 组件

**Files:**
- Create: `/components/feedback/tally-feedback-button.tsx`

**Step 1: 创建组件文件**

创建完整的 FeedbackButton 组件：

```typescript
'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useTranslation } from '@/lib/i18n/i18n-context'
import { useTally } from 'react-tally'

// Tally 表单配置
const TALLY_FORM_ID = 'Zj2jda' // 替换为实际的表单 ID

export function TallyFeedbackButton() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const { openPopup } = useTally()

  const handleFeedbackClick = async () => {
    if (isLoading) return

    setIsLoading(true)

    try {
      // 构建带有用户信息的 URL
      const url = new URL(`https://tally.so/${TALLY_FORM_ID}`)

      // 添加 hidden fields（用户信息）
      if (user) {
        url.searchParams.append('user_id', String(user.id))
        url.searchParams.append('email', user.email)
      }

      // 打开 Tally 弹窗
      await openPopup({
        url: url.toString(),
        layout: 'popup',
        width: 600,
        emoji: {
          text: '👋',
          animation: 'wave',
        },
      })
    } catch (error) {
      console.error('Failed to open feedback form:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 如果用户未登录，不显示反馈按钮
  if (!user) {
    return null
  }

  return (
    <button
      onClick={handleFeedbackClick}
      disabled={isLoading}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary-foreground dark:text-primary"
      aria-label={t('common.feedbackButton')}
    >
      {isLoading ? (
        <>
          <span className="animate-spin">⏳</span>
          <span>{t('common.feedbackLoading')}</span>
        </>
      ) : (
        <>
          <span>💬</span>
          <span>{t('common.feedbackButton')}</span>
        </>
      )}
    </button>
  )
}
```

**Step 2: 验证 TypeScript 编译**

Run: `pnpm run build`

Expected: 构建成功，可能出现类型错误（如果 react-tally 类型定义缺失）

**Step 3: 提交组件**

```bash
git add components/feedback/tally-feedback-button.tsx
git commit -m "feat: implement TallyFeedbackButton component with user context"
```

### Task 4: 创建 TallyProvider 组件

**Files:**
- Create: `/components/feedback/tally-provider.tsx`

**Step 1: 创建 Provider 组件**

```typescript
'use client'

import { useEffect } from 'react'
import { TallyProvider as BaseTallyProvider } from 'react-tally'

export function TallyProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 懒加载策略：仅在组件挂载时注入 Tally 脚本
    // react-tally 会处理脚本去重
  }, [])

  return <BaseTallyProvider>{children}</BaseTallyProvider>
}
```

**Step 2: 验证 TypeScript 编译**

Run: `pnpm run build`

Expected: 构建成功

**Step 3: 提交 Provider**

```bash
git add components/feedback/tally-provider.tsx
git commit -m "feat: create TallyProvider wrapper component"
```

### Task 5: 创建导出索引文件

**Files:**
- Create: `/components/feedback/index.ts`

**Step 1: 创建索引文件**

```typescript
export { TallyProvider } from './tally-provider'
export { TallyFeedbackButton } from './tally-feedback-button'
```

**Step 2: 验证 TypeScript 编译**

Run: `pnpm run build`

Expected: 构建成功

**Step 3: 提交索引文件**

```bash
git add components/feedback/index.ts
git commit -m "feat: add feedback components index file"
```

---

## 集成到应用

### Task 6: 在 RootLayout 中集成 TallyProvider

**Files:**
- Modify: `/app/layout.tsx`

**Step 1: 导入 TallyProvider**

在文件顶部的导入区域添加：

```typescript
import { TallyProvider } from "@/components/feedback"
```

**Step 2: 包装现有 Provider**

修改 RootLayout 返回的 JSX 结构（约在第 50-63 行）：

将：
```typescript
<html lang="zh-CN" className="h-full" suppressHydrationWarning>
  <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased h-full`}>
    <I18nProvider>
      <AuthProvider>
        {children}
        <Analytics />
        <Toaster />
        <OpenTelemetryProvider />
      </AuthProvider>
    </I18nProvider>
  </body>
</html>
```

改为：
```typescript
<html lang="zh-CN" className="h-full" suppressHydrationWarning>
  <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased h-full`}>
    <I18nProvider>
      <TallyProvider>
        <AuthProvider>
          {children}
          <Analytics />
          <Toaster />
          <OpenTelemetryProvider />
        </AuthProvider>
      </TallyProvider>
    </I18nProvider>
  </body>
</html>
```

**Step 3: 验证构建**

Run: `pnpm run build`

Expected: 构建成功

**Step 4: 提交布局修改**

```bash
git add app/layout.tsx
git commit -m "feat: integrate TallyProvider into RootLayout"
```

### Task 7: 在 RootLayout 中添加反馈按钮

**Files:**
- Modify: `/app/layout.tsx`

**Step 1: 导入 FeedbackButton**

在文件顶部添加导入：

```typescript
import { TallyFeedbackButton } from "@/components/feedback"
```

**Step 2: 在 body 中添加按钮**

修改 RootLayout 返回的 JSX，在所有 Provider 和 Analytics 后添加 FeedbackButton：

将：
```typescript
<I18nProvider>
  <TallyProvider>
    <AuthProvider>
      {children}
      <Analytics />
      <Toaster />
      <OpenTelemetryProvider />
    </AuthProvider>
  </TallyProvider>
</I18nProvider>
```

改为：
```typescript
<I18nProvider>
  <TallyProvider>
    <AuthProvider>
      {children}
      <Analytics />
      <Toaster />
      <OpenTelemetryProvider />
      <TallyFeedbackButton />
    </AuthProvider>
  </TallyProvider>
</I18nProvider>
```

**Step 3: 验证构建**

Run: `pnpm run build`

Expected: 构建成功

**Step 4: 提交按钮集成**

```bash
git add app/layout.tsx
git commit -m "feat: add TallyFeedbackButton to global layout"
```

---

## Tally 表单配置

### Task 8: 配置 Tally Hidden Fields（手动操作）

**Files:**
- N/A（Tally.so 后台操作）

**Step 1: 登录 Tally.so**

访问：https://tally.so/login

**Step 2: 打开表单编辑器**

选择表单 ID 为 `Zj2jda` 的表单，进入编辑模式

**Step 3: 添加 Hidden Fields**

1. 点击 "Add a question" 按钮
2. 选择 "Hidden field" 类型
3. 创建第一个 hidden field：
   - Field Key: `user_id`
   - Label: "User ID"
4. 创建第二个 hidden field：
   - Field Key: `email`
   - Label: "User Email"

**Step 4: 保存并发布表单**

点击右上角的 "Publish" 按钮

**Step 5: 验证 Hidden Fields 配置**

在浏览器中访问：`https://tally.so/Zj2jda?user_id=123&email=test@example.com`

检查表单是否自动填充了这些值（hidden fields 不会在表单中显示，但会在提交时包含）

**文档记录（可选）：**

如果需要记录配置，创建文档文件：

```bash
echo "# Tally.so Hidden Fields 配置

## 表单信息
- 表单 ID: Zj2jda
- 用途: 收集用户反馈和需求

## Hidden Fields
1. **user_id**: 用户 ID (来自 AuthContext.user.id)
2. **email**: 用户邮箱 (来自 AuthContext.user.email)

## URL 参数示例
\`\`\`
https://tally.so/Zj2jda?user_id=123&email=user@example.com
\`\`\`

## 修改日期
- 2026-01-21: 初始配置
" > docs/tally-hidden-fields-config.md
```

提交文档：

```bash
git add docs/tally-hidden-fields-config.md
git commit -m "docs: add Tally.so hidden fields configuration"
```

---

## 测试与验证

### Task 9: 本地开发测试

**Files:**
- N/A（运行和测试）

**Step 1: 启动开发服务器**

Run: `pnpm run dev`

Expected: 服务器成功启动，显示 URL（通常是 http://localhost:3000）

**Step 2: 登录应用**

1. 访问 http://localhost:3000
2. 使用 Google 或邮箱登录

**Step 3: 验证反馈按钮显示**

- 检查页面右下角是否显示"反馈"按钮
- 检查按钮样式（primary color, 圆角, shadow）
- 检查中英文切换（按钮文本应跟随语言变化）

**Step 4: 测试弹窗功能**

1. 点击"反馈"按钮
2. 验证：
   - Tally 弹窗在当前页面打开（不跳转）
   - 弹窗居中显示
   - 背景变暗
   - 可以通过 ESC 或关闭按钮关闭弹窗

**Step 5: 测试懒加载**

1. 打开浏览器开发者工具（F12）
2. 切换到 Network 标签
3. 刷新页面
4. 验证：页面加载时不应加载 `embed.js`
5. 点击"反馈"按钮
6. 验证：此时才加载 `https://tally.so/widgets/embed.js`

**Step 6: 测试用户信息传递**

1. 在 Tally 弹窗中填写并提交表单
2. 登录 Tally.so 后台
3. 查看最新提交的反馈
4. 验证：是否包含 `user_id` 和 `email` 字段

**Step 7: 测试未登录状态**

1. 退出登录
2. 刷新页面
3. 验证：反馈按钮不应显示

**Step 8: 测试国际化**

1. 切换到英文
2. 验证：按钮显示"Feedback"
3. 切换回中文
4. 验证：按钮显示"反馈"

---

## 类型定义修复（可选）

### Task 10: 添加 react-tally 类型定义

**Files:**
- Create: `/types/react-tally.d.ts`

如果遇到 TypeScript 类型错误，创建类型定义文件：

```typescript
declare module 'react-tally' {
  export interface TallyPopupOptions {
    url: string
    layout?: 'popup' | 'modal' | 'side_panel'
    width?: number
    emoji?: {
      text: string
      animation: 'wave' | 'blink' | 'heart' | 'none'
    }
    openFromTrigger?: boolean
    autoClose?: number
    hiddenFields?: Record<string, string>
    customCloseUrl?: string
  }

  export interface TallyContextValue {
    openPopup: (options: TallyPopupOptions) => Promise<void>
    closePopup: () => void
  }

  export function useTally(): TallyContextValue

  export function TallyProvider({
    children,
  }: {
    children: React.ReactNode
  }): JSX.Element
}
```

**Step 2: 验证类型定义**

Run: `pnpm run build`

Expected: 构建成功，类型错误消失

**Step 3: 提交类型定义**

```bash
git add types/react-tally.d.ts
git commit -m "feat: add TypeScript type definitions for react-tally"
```

---

## 性能优化（可选）

### Task 11: 添加错误边界

**Files:**
- Create: `/components/feedback/feedback-error-boundary.tsx`

**Step 1: 创建错误边界组件**

```typescript
'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class FeedbackErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('Feedback button error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return null // 静默失败，不显示反馈按钮
    }

    return this.props.children
  }
}
```

**Step 2: 在 RootLayout 中使用**

修改 `/app/layout.tsx`，用 ErrorBoundary 包装 FeedbackButton：

将：
```typescript
<TallyFeedbackButton />
```

改为：
```typescript
<FeedbackErrorBoundary>
  <TallyFeedbackButton />
</FeedbackErrorBoundary>
```

同时添加导入：
```typescript
import { FeedbackErrorBoundary } from "@/components/feedback"
```

**Step 3: 提交错误边界**

```bash
git add components/feedback/feedback-error-boundary.tsx components/feedback/index.ts app/layout.tsx
git commit -m "feat: add error boundary for feedback button"
```

---

## 最终验收

### Task 12: 生产构建测试

**Files:**
- N/A（构建和测试）

**Step 1: 运行生产构建**

Run: `pnpm run build`

Expected: 构建成功，无错误

**Step 2: 检查构建输出**

Run: `ls -lh .next/static/chunks/`

Expected: 应该看到包含 Tally 相关的代码分割 chunk

**Step 3: 本地预览生产版本**

Run: `pnpm run start`

Expected: 生产服务器启动

**Step 4: 完整功能测试**

1. 访问 http://localhost:3000
2. 登录账号
3. 测试所有功能（按钮显示、弹窗打开、表单提交）
4. 验证中英文切换
5. 验证 light/dark 主题切换
6. 测试不同页面的按钮显示（应全局可见）

**Step 5: 性能检查**

1. 打开 Chrome DevTools Lighthouse
2. 运行 Performance audit
3. 检查：Initial load 不应包含 Tally 脚本
4. 检查：点击按钮后才加载 Tally

**Step 6: 代码审查清单**

- [ ] 所有组件使用 `'use client'` 指令
- [ ] TypeScript 类型定义完整
- [ ] 中英文翻译已添加
- [ ] 按钮样式适配 light/dark 主题
- [ ] 未登录用户不显示按钮
- [ ] 用户信息正确传递到 Tally
- [ ] 懒加载策略生效
- [ ] 错误处理完善
- [ ] 构建无错误和警告

**Step 7: 创建功能文档（可选）**

```bash
cat > docs/features/tally-feedback.md << 'EOF'
# Tally.so 反馈收集功能

## 功能描述

全局悬浮反馈按钮，用户可以在任何页面快速提交反馈和需求建议。

## 技术实现

- **库**: react-tally
- **加载策略**: 懒加载（首次点击时加载）
- **用户信息**: 自动通过 URL hidden fields 传递
- **国际化**: 支持中英文切换

## 使用方法

1. 登录后，页面右下角会显示"反馈"按钮
2. 点击按钮打开反馈表单弹窗
3. 填写并提交反馈

## Hidden Fields

表单自动包含以下用户信息（隐藏字段）：
- `user_id`: 用户 ID
- `email`: 用户邮箱

## 配置

- **表单 ID**: Zj2jda
- **组件位置**: `/components/feedback/`
- **集成位置**: `/app/layout.tsx`

## 修改日期

- 2026-01-21: 初始实现
EOF
```

提交文档：

```bash
git add docs/features/tally-feedback.md
git commit -m "docs: add Tally feedback feature documentation"
```

**Step 8: 最终提交所有更改**

```bash
git status
git add .
git commit -m "feat: complete Tally.so feedback integration implementation"
```

---

## 常见问题排查

### 问题 1: Tally 脚本加载失败

**症状**: 点击按钮无响应

**排查**:
1. 检查网络连接
2. 打开 DevTools Network 标签，查看 `embed.js` 是否加载成功
3. 检查控制台是否有 CORS 错误

**解决**:
- 确保可以访问 `https://tally.so/widgets/embed.js`
- 检查 Content Security Policy 设置

### 问题 2: 用户信息未传递

**症状**: Tally 后台提交记录中没有 user_id 和 email

**排查**:
1. 打开 DevTools Console
2. 在 `handleFeedbackClick` 函数中添加 `console.log(url)`
3. 检查 URL 参数是否正确拼接

**解决**:
- 确保 `user` 对象存在且有 `id` 和 `email` 字段
- 检查 Tally 表单中 hidden fields 的 key 是否正确

### 问题 3: TypeScript 类型错误

**症状**: 构建时提示 react-tally 类型缺失

**解决**: 执行 Task 10 添加类型定义

### 问题 4: 按钮样式问题

**症状**: 按钮显示不正确或主题不适配

**排查**:
1. 检查 Tailwind CSS 类名是否正确
2. 检查是否与全局样式冲突

**解决**:
- 调整 `/components/feedback/tally-feedback-button.tsx` 中的 className
- 参考 Shadcn/ui Button 组件的样式

---

## 完成标志

✅ 所有任务完成后，你应该有：

1. **新的组件**:
   - `/components/feedback/tally-provider.tsx`
   - `/components/feedback/tally-feedback-button.tsx`
   - `/components/feedback/feedback-error-boundary.tsx`
   - `/components/feedback/index.ts`

2. **修改的文件**:
   - `/app/layout.tsx` (集成 Provider 和 Button)
   - `/lib/i18n/locales/zh.ts` (中文翻译)
   - `/lib/i18n/locales/en.ts` (英文翻译)

3. **新的依赖**:
   - `package.json` 中添加了 `react-tally`

4. **可选的类型定义**:
   - `/types/react-tally.d.ts`

5. **文档**:
   - `/docs/tally-hidden-fields-config.md` (Hidden Fields 配置)
   - `/docs/features/tally-feedback.md` (功能文档)

6. **Git 提交**:
   - 多个小的 commit，每个对应一个独立的功能点
   - 清晰的 commit message

**下一步**: 准备部署到生产环境 🚀
