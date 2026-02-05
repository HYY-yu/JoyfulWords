# 法律合规组件设计方案

**日期**: 2025-02-05
**作者**: Claude + User
**状态**: 设计阶段

---

## 需求概述

在 JoyfulWords 的登录和注册页面添加法律合规组件,集成 Termly 服务展示隐私政策和使用条款。

### 功能需求
- **登录页面**: 底部显示"隐私政策"和"使用条款"链接,点击后打开弹窗查看完整内容
- **注册页面**: 显示链接 + 勾选框,用户必须同意才能继续注册
- **第三方集成**: 使用 Termly 服务管理法律文档
- **国际化**: 支持中英文切换

---

## 技术方案

### 1. Termly 集成方式

**选择**: 代码片段 + URL 组合

**方案说明**:
- **链接**: 使用 Termly 提供的 URL(简单直接)
- **弹窗**: 使用 Termly 代码片段方式动态嵌入 iframe

**优势**:
- 链接简洁,不占用页面资源
- 弹窗提供更好的用户体验,无需离开当前页面
- Termly 负责法律文档的维护和更新
- 支持 GDPR/CCPA 等合规要求

### 2. 组件架构

```
components/legal/
├── legal-links.tsx          # 底部链接组件
├── policy-modal.tsx         # 法律文档弹窗组件
├── termly-embed.tsx         # Termly 嵌入组件
└── legal-checkbox.tsx       # 勾选框组件(注册页用)
```

**数据流**:
1. 用户点击"隐私政策"或"使用条款"链接
2. 打开 `policy-modal`,显示 `termly-embed` 组件
3. `termly-embed` 通过 `useEffect` 动态加载 Termly 脚本
4. 注册页面额外显示 `legal-checkbox` 组件,强制用户同意

---

## 组件详细设计

### 1. LegalLinks 组件

**文件**: `components/legal/legal-links.tsx`

**功能**: 显示法律文档链接

**Props**:
- `variant?: "default" | "inline"` - 布局变体
- `onPrivacyClick?: () => void` - 隐私政策点击回调
- `onTermsClick?: () => void` - 使用条款点击回调

**实现要点**:
- 使用 Shadcn/ui 的 Button 组件
- 支持居中(default)和内联(inline)两种布局
- 国际化文本支持

### 2. TermlyEmbed 组件

**文件**: `components/legal/termly-embed.tsx`

**功能**: 嵌入 Termly iframe

**Props**:
- `dataId: string` - Termly 文档 ID
- `type: "privacy-policy" | "terms-of-service"` - 文档类型

**实现要点**:
- 使用 `useEffect` 动态创建和加载 Termly 脚本
- 使用 `useRef` 追踪脚本加载状态,避免重复加载
- 清理函数移除脚本,防止内存泄漏
- 脚本来源: `https://app.termly.io/embed-policy.min.js`

### 3. PolicyModal 组件

**文件**: `components/legal/policy-modal.tsx`

**功能**: 弹窗展示法律文档

**Props**:
- `open: boolean` - 弹窗开关状态
- `onOpenChange: (open: boolean) => void` - 状态变更回调
- `type: "privacy-policy" | "terms-of-service"` - 文档类型
- `termlyDataId: string` - Termly 文档 ID

**实现要点**:
- 使用 Shadcn/ui 的 Dialog 组件
- 弹窗高度 80vh,最大宽度 max-w-4xl
- 内容区域可滚动
- 标题根据文档类型动态显示

### 4. LegalCheckbox 组件

**文件**: `components/legal/legal-checkbox.tsx`

**功能**: 注册页法律条款勾选框

**Props**:
- `checked: boolean` - 勾选状态
- `onChange: (checked: boolean) => void` - 状态变更回调
- `onPrivacyClick: () => void` - 隐私政策点击回调
- `onTermsClick: () => void` - 使用条款点击回调
- `error?: string` - 错误提示信息

**实现要点**:
- 使用 Shadcn/ui 的 Checkbox 组件
- 文本中嵌入可点击的链接按钮
- 支持错误提示显示
- 使用 i18n 的插值功能处理动态内容

---

## 页面集成

### 1. 登录页面

**文件**: `components/auth/login-form.tsx`

**修改内容**:
- 导入 `LegalLinks` 和 `PolicyModal` 组件
- 添加状态管理两个弹窗的开关
- 在表单底部(提交按钮前)添加 `LegalLinks`
- 添加两个 `PolicyModal` 实例

**布局**:
```
[登录表单]
[邮箱输入框]
[密码输入框]
[法律链接] ← 新增
[登录按钮]
[弹窗组件] ← 新增
```

### 2. 注册页面

**文件**: `components/auth/signup-form.tsx`

**修改内容**:
- 导入 `LegalCheckbox` 和 `PolicyModal` 组件
- 添加状态管理勾选框和弹窗
- 在表单验证中检查法律条款同意状态
- 在表单底部添加 `LegalCheckbox`

**验证逻辑**:
```typescript
if (!legalAgreed) {
  setLegalError("请同意隐私政策和使用条款")
  return
}
```

**布局**:
```
[注册表单]
[邮箱输入框]
[验证码输入框]
[密码输入框]
[法律勾选框] ← 新增
[注册按钮]
[弹窗组件] ← 新增
```

---

## 国际化配置

### 中文翻译

**文件**: `lib/i18n/locales/zh.ts`

```typescript
legal: {
  privacyPolicy: "隐私政策",
  termsOfService: "使用条款",
  agreeToTerms: "我已阅读并同意{privacy}和{terms}",
  agreeRequired: "请同意隐私政策和使用条款"
}
```

### 英文翻译

**文件**: `lib/i18n/locales/en.ts`

```typescript
legal: {
  privacyPolicy: "Privacy Policy",
  termsOfService: "Terms of Service",
  agreeToTerms: "I have read and agree to {privacy} and {terms}",
  agreeRequired: "Please agree to the Privacy Policy and Terms of Service"
}
```

---

## 环境配置

### 环境变量

**文件**: `.env.local`

```bash
# Termly 配置
# 在 Termly 创建文档后,从代码片段中获取 data-id
NEXT_PUBLIC_TERMLY_PRIVACY_ID=your-privacy-policy-data-id
NEXT_PUBLIC_TERMLY_TERMS_ID=your-terms-data-id
```

### Termly 设置步骤

1. **注册 Termly 账户**: 访问 https://termly.io
2. **创建文档**:
   - 创建 Privacy Policy(隐私政策)
   - 创建 Terms of Service(使用条款)
3. **获取 data-id**: 导出代码片段时复制 `data-id` 属性值
4. **配置环境变量**: 将 data-id 添加到 `.env.local`
5. **自定义内容** (可选): 在 Termly 控制台根据项目需求编辑条款内容

---

## 测试验证计划

### 功能测试
- [ ] 登录页显示法律链接
- [ ] 点击"隐私政策"链接打开对应弹窗
- [ ] 点击"使用条款"链接打开对应弹窗
- [ ] 弹窗内正确加载 Termly 内容
- [ ] 弹窗关闭功能正常
- [ ] 注册页显示勾选框
- [ ] 未勾选时提交表单显示错误提示
- [ ] 勾选后可以正常提交表单
- [ ] 中英文切换正常

### 边界测试
- [ ] Termly 脚本加载失败时的降级处理
- [ ] 环境变量缺失时的提示
- [ ] 快速连续打开/关闭弹窗
- [ ] 网络慢加载时的用户体验

### 视觉测试
- [ ] 移动端响应式布局(375px, 414px)
- [ ] 平板端布局(768px, 1024px)
- [ ] 桌面端大屏显示(1920px)
- [ ] 弹窗内容滚动正常
- [ ] 链接 hover 状态样式

### 兼容性测试
- [ ] Chrome 最新版
- [ ] Safari 最新版
- [ ] Firefox 最新版
- [ ] Edge 最新版
- [ ] iOS Safari
- [ ] Android Chrome

---

## 关键文件清单

### 需要创建的文件
- `components/legal/legal-links.tsx` - 法律链接组件
- `components/legal/legal-checkbox.tsx` - 勾选框组件
- `components/legal/policy-modal.tsx` - 弹窗组件
- `components/legal/termly-embed.tsx` - Termly 嵌入组件

### 需要修改的文件
- `components/auth/login-form.tsx` - 集成法律链接
- `components/auth/signup-form.tsx` - 集成勾选框和验证
- `lib/i18n/locales/zh.ts` - 添加中文翻译
- `lib/i18n/locales/en.ts` - 添加英文翻译

### 需要创建的配置
- `.env.local` - 添加 Termly IDs

---

## 设计决策记录

### Q1: 为什么选择 Termly 而不是其他服务?

**决策**: 选择 Termly

**理由**:
- 界面友好,易于定制
- 提供 cookie 同意管理(未来可能需要)
- 有免费套餐,适合个人项目起步
- 支持 GDPR/CCPA 等主流合规要求
- 提供完善的 React/Next.js 集成文档

**备选方案**:
- Iubenda: 功能更强大但价格较高
- Privacypolicies.com: 价格便宜但功能较简单

### Q2: 为什么使用弹窗而不是跳转到独立页面?

**决策**: 使用弹窗

**理由**:
- 用户不会离开当前页面,上下文不中断
- 更好的用户体验,无需等待页面加载
- 移动端友好,不需要在新标签页中切换
- Termly 的 iframe 嵌入方式成熟稳定

### Q3: 为什么注册页需要强制勾选,而登录页不需要?

**决策**: 注册强制勾选,登录仅展示链接

**理由**:
- 注册是建立用户关系的起点,需要法律确认
- 登录时用户已经同意过条款,无需重复确认
- 降低登录流程的阻力,提升用户体验
- 符合业界常见做法

### Q4: Termly 脚本加载失败如何处理?

**决策**: 添加错误边界和降级方案

**实现**:
- 使用 ref 追踪脚本加载状态
- 加载失败时显示错误提示和外部链接
- 不阻塞页面其他功能

---

## 实施注意事项

1. **TypeScript 严格模式**: 所有组件使用完整的类型定义
2. **无障碍访问**: 使用语义化 HTML 和 ARIA 属性
3. **性能优化**:
   - 脚本只加载一次
   - 弹窗关闭时不卸载组件,避免重复加载
4. **错误处理**:
   - Termly 脚本加载失败的降级方案
   - 环境变量缺失的友好提示
5. **测试覆盖**:
   - 单元测试: 组件渲染和交互
   - 集成测试: 表单提交流程
   - E2E 测试: 完整用户流程

---

## 后续优化方向

1. **Cookie 同意横幅**: 集成 Termly 的 Cookie Banner
2. **条款版本管理**: 记录用户同意的条款版本
3. **法律页面路由**: 创建独立的 `/privacy` 和 `/terms` 页面
4. **多语言条款**: Termly 支持多语言文档切换
5. **用户同意记录**: 在后端保存用户同意记录和时间戳

---

## 参考资料

- [Termly React 集成文档](https://support.termly.io/hc/en-us/articles/30710497428497-How-to-embed-a-policy-on-a-React-site)
- [Termly Next.js 指南](https://termly.io/resources/articles/privacy-policy-for-nextjs/)
- [Next.js Script 组件文档](https://nextjs.org/docs/app/api-reference/components/script)
- [Shadcn/ui Dialog 组件](https://ui.shadcn.com/docs/components/dialog)

---

**文档版本**: 1.0
**最后更新**: 2025-02-05
