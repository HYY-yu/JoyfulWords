# AI 按钮心跳动画设计方案

**日期：** 2026-02-01
**功能：** 为 AI 改写按钮添加心跳动画效果，提升用户点击欲望

## 需求背景

当前 AI 改写按钮使用静态的 SparklesIcon，需要添加动画效果来吸引用户注意力，增加点击欲望。选择心跳脉冲效果作为动画方案。

## 设计方案

### 动画效果

- **动画类型：** 脉冲缩放效果（心跳节奏）
- **缩放范围：** 1.0 → 1.2 → 1.0 → 1.15 → 1.0
- **动画周期：** 1.4 秒
- **循环方式：** 无限循环
- **时间函数：** ease-in-out

### 实现方式

使用 Tailwind CSS 的 @keyframes 动画 + CSS 类实现。

#### 1. 动画关键帧定义

在 `app/globals.css` 中添加：

```css
@keyframes heartbeat {
  0%, 100% {
    transform: scale(1);
  }
  10% {
    transform: scale(1.2);
  }
  20% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.15);
  }
  40% {
    transform: scale(1);
  }
}
```

动画节奏说明：
- 0-20%: 第一次跳动（较强）
- 20-40%: 第二次跳动（稍弱）
- 40-100%: 停顿等待下一次循环

#### 2. Tailwind 配置

在 `tailwind.config.ts` 的 `theme.extend.animation` 中注册：

```typescript
animation: {
  heartbeat: 'heartbeat 1.4s ease-in-out infinite',
}
```

#### 3. 应用到组件

在 `components/ui/editor/tiptap-toolbar.tsx` 第 262 行的 SparklesIcon 添加动画类：

```tsx
<SparklesIcon className="h-4 w-4 animate-heartbeat" />
```

## 技术优势

1. **性能优秀：** CSS transform 动画由 GPU 加速
2. **代码简洁：** 不需要额外的 JavaScript 库
3. **易于维护：** 动画参数集中在一处，方便调整
4. **跨平台兼容：** 支持所有现代浏览器和移动端

## 视觉设计

- 保持现有的渐变背景 `bg-gradient-to-r from-purple-500/10 to-blue-500/10`
- 只对图标应用动画，不影响按钮容器
- hover 状态保持现有的背景色增强效果

## 测试要点

- [ ] Chrome 浏览器动画流畅度
- [ ] Firefox 浏览器兼容性
- [ ] Safari 浏览器兼容性
- [ ] 移动端表现
- [ ] 动画不干扰用户编辑体验

## 实施步骤

1. 修改 `app/globals.css` - 添加 @keyframes
2. 修改 `tailwind.config.ts` - 注册动画
3. 修改 `components/ui/editor/tiptap-toolbar.tsx` - 应用动画类
4. 测试验证

## 预期效果

用户在编辑器工具栏中会看到 AI 改写按钮的图标以心跳节奏持续脉动，自然吸引用户注意力，提升功能发现率和使用率。
