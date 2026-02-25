# Image Generator - 风格模式设计文档

## 设计理念

### 美学方向：现代专业 + 赛博未来

**设计哲学**: 融合专业图像处理工具的精确性与赛博朋克美学的前卫感，创造出既实用又令人印象深刻的用户界面。

### 核心设计原则

1. **功能优先**: 三栏布局遵循用户工作流，从左到右依次是：输入 → 预览 → 控制
2. **视觉层级**: 使用颜色、大小和间距建立清晰的信息层级
3. **即时反馈**: 每个操作都有视觉反馈，让用户时刻了解系统状态
4. **情感连接**: 通过动画和微交互创造愉悦的使用体验

## 布局结构

```
┌─────────────────────────────────────────────────────────────────┐
│                        Header + Mode Tabs                        │
├─────────────┬───────────────────────────────┬───────────────────┤
│             │                               │                   │
│   Upload    │         Preview               │    Style Panel    │
│   Zone      │         Zone                  │                   │
│             │                               │                   │
│   320px     │          Flex                 │       384px       │
│             │                               │                   │
└─────────────┴───────────────────────────────┴───────────────────┘
```

## 视觉设计元素

### 色彩系统

#### 主色调
- **Primary**: `oklch(0.45 0.22 264)` - 紫蓝色系，传达创新与科技感
- **Success**: `rgb(34, 197, 94)` - 绿色，用于完成状态
- **Warning**: `rgb(124, 58, 237)` - 紫色，用于加载状态

#### 背景层次
```
Level 0: base background (oklch(0.98 0 0))
Level 1: muted/30 (oklch(0.96 0 0) with 30% opacity)
Level 2: card background (oklch(1 0 0))
Level 3: overlay (backdrop-blur + opacity)
```

### 字体系统

```
Title:      text-2xl font-semibold (24px)
Subtitle:   text-sm text-muted-foreground (14px)
Body:       text-sm (14px)
Caption:    text-xs (12px)
```

### 间距系统

```
Container padding:    p-4  (16px)
Section gap:         gap-4 (16px)
Element spacing:     space-y-4 (16px)
Card padding:        p-3  (12px)
```

## 交互设计

### 状态管理

#### 1. 上传区状态
```typescript
// 空状态
{
  hasImage: false
  isDragging: false
}

// 拖拽中
{
  hasImage: false
  isDragging: true
  visual: scale(1.02) + primary border
}

// 已上传
{
  hasImage: true
  isDragging: false
  visual: show preview + reset button
}
```

#### 2. 预览区状态
```typescript
// 空闲
{
  status: "idle"
  visual: 空状态占位图
}

// 生成中
{
  status: "generating"
  visual: 旋转加载器 + 模糊背景
  duration: 3s (模拟)
}

// 完成
{
  status: "completed"
  visual: 清晰图片 + 成功标记 + 下载按钮
}
```

#### 3. 风格卡片状态
```typescript
// 未选中
{
  selected: false
  visual: 基础卡片样式
}

// 悬停
{
  selected: false
  hover: true
  visual: translateY(-4px) + scale(1.02) + shadow
}

// 选中
{
  selected: true
  visual: ring-2 primary + checkmark + "已选择" 标签
}
```

### 动画规范

#### 标准过渡
```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

#### 特殊动画
```css
/* 渲染加载 */
@keyframes spin {
  from: { transform: rotate(0deg); }
  to: { transform: rotate(360deg); }
}

/* 成功弹跳 */
@keyframes bounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
```

## 响应式设计

### 断点系统
```
sm:  640px  - 移动设备
md:  768px  - 平板设备
lg:  1024px - 桌面设备 (默认)
xl:  1280px - 大屏设备
```

### 响应式策略
- **lg+**: 三栏完整布局
- **md**: 左右栏折叠，预览区居中
- **sm**: 单栏堆叠布局

## 可访问性

### ARIA 标签
```tsx
<button aria-label="上传图片" />
<button aria-label="生成图片" aria-disabled={!canGenerate} />
<div role="img" aria-label="渲染结果" />
```

### 键盘导航
- `Tab`: 在可交互元素间切换
- `Enter/Space`: 激活按钮或选择卡片
- `Escape`: 取消拖拽操作

### 焦点管理
```tsx
className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
```

## 性能优化

### 图片处理
```typescript
// 压缩大图片
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const maxWidth = 1920
      const scale = Math.min(1, maxWidth / img.width)
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      // ... 压缩逻辑
    }
  })
}
```

### 懒加载
```tsx
// 风格预览图使用懒加载
<img loading="lazy" src={preview} alt={styleName} />
```

### 防抖/节流
```typescript
// 拖拽事件节流
const throttledDragHandler = useMemo(
  () => throttle(handleDrag, 100),
  [handleDrag]
)
```

## 未来扩展

### 计划功能
1. **批量处理**: 支持上传多张图片同时处理
2. **风格混合**: 允许用户混合多种风格
3. **参数微调**: 暴露更多 AI 参数给高级用户
4. **历史记录**: 保存用户的生成历史
5. **风格创建**: 允许用户创建并保存自定义风格

### 技术债务
1. **状态管理**: 考虑使用 Zustand 或 Jotai 管理复杂状态
2. **错误边界**: 添加错误边界组件防止崩溃
3. **测试覆盖**: 编写单元测试和集成测试
4. **性能监控**: 集成 Web Vitals 监控

## 设计资产

### 图标库
使用 Lucide React，保持图标风格一致性：
- `Upload` - 上传
- `Download` - 下载
- `Sparkles` - AI 生成
- `Image as ImageIcon` - 图片
- `Zap` - 渲染中
- `CheckCircle2` - 成功

### 渐变预设
```typescript
const gradients = {
  cyberNeon: "linear-gradient(135deg, #ff006e 0%, #8338ec 50%, #3a86ff 100%)",
  frostedGlass: "linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 50%, #818cf8 100%)",
  minimalLine: "linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 50%, #808080 100%)",
  // ... 更多预设
}
```

## 结语

这个设计旨在提供专业级的用户体验，同时保持视觉上的吸引力和创新性。通过精心设计的交互和动画，我们希望让每次使用都成为一种享受。

**设计目标**: 让 AI 图片风格转换变得简单、快速、有趣。
