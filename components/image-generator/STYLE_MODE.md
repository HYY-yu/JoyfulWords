# 风格模式组件说明

## 概述

`StyleMode` 组件实现了图片生成的风格模式功能，允许用户上传图片并应用不同的 AI 风格效果。

## 功能特性

### 1. 左侧 - 图片上传区
- **拖拽上传**: 支持拖拽图片文件到上传区域
- **点击上传**: 点击上传区域选择本地图片
- **实时预览**: 上传后立即显示图片预览
- **重新上传**: 可随时更换图片

### 2. 中间 - 实时预览区
- **状态指示**: 显示当前渲染状态（空闲/生成中/完成）
- **动画效果**: AI 渲染时显示旋转加载动画
- **完成提示**: 渲染完成后显示成功标记
- **下载功能**: 一键下载渲染后的图片

### 3. 右侧 - 风格控制面板
- **预设风格库**: 6种精心设计的风格预设
  - 赛博霓虹 (Cyber Neon) - 高饱和度霓虹色彩
  - 磨砂玻璃 (Frosted Glass) - 半透明质感
  - 极简白描 (Minimal Line) - 黑白线条
  - 温暖油画 (Warm Oil) - 厚重笔触
  - 二次元 (Anime) - 日式动画风格
  - 水彩晕染 (Watercolor) - 流动色彩

- **高级选项**:
  - 风格强度滑块 (0-100%)

## 使用流程

1. **上传图片**: 在左侧上传区域拖拽或点击上传原始图片
2. **选择风格**: 在右侧风格面板中选择想要的风格预设
3. **调整强度**: 使用风格强度滑块微调效果强度
4. **生成图片**: 点击"生成图片"按钮，AI 开始渲染
5. **下载结果**: 渲染完成后，点击"下载图片"保存结果

## 技术实现

### 文件结构
```
components/image-generator/
├── style-mode.tsx       # 风格模式主组件
├── mode-tabs.tsx        # 模式切换标签
└── index.tsx            # 图片生成主入口
```

### 状态管理
- `uploadedImage`: 存储上传的原始图片 (base64)
- `selectedStyle`: 当前选中的风格 ID
- `renderStatus`: 渲染状态 ("idle" | "generating" | "completed" | "error")
- `renderedImage`: 渲染后的图片

### 事件处理
- `handleFileUpload`: 处理文件上传
- `handleDrop/handleDragOver/handleDragLeave`: 拖拽事件处理
- `handleStyleSelect`: 风格选择
- `handleGenerate`: 触发 AI 渲染
- `handleDownload`: 下载渲染结果
- `handleReset`: 重置所有状态

## 设计特点

### 视觉设计
- **深色渐变背景**: 中间预览区使用微妙的渐变背景
- **玻璃拟态**: 使用 backdrop-blur 和半透明背景
- **流畅动画**: 所有交互都有平滑的过渡动画
- **响应式布局**: 三栏布局自适应不同屏幕尺寸

### 用户体验
- **拖拽上传**: 直观的拖拽操作
- **实时反馈**: 即时的视觉反馈和状态指示
- **一键操作**: 简化的生成和下载流程
- **国际化支持**: 完整的中英文双语支持

## 后续扩展

### 计划功能
- [ ] 自定义风格参数调整
- [ ] 批量处理多张图片
- [ ] 风格预览图示例
- [ ] 历史记录功能
- [ ] 更多风格预设

### API 集成
需要集成实际的 AI 图片风格迁移 API：
```typescript
// 示例 API 调用
const response = await fetch('/api/image-style-transfer', {
  method: 'POST',
  body: JSON.stringify({
    image: uploadedImage,
    style: selectedStyle,
    strength: styleStrength
  })
})
const result = await response.json()
setRenderedImage(result.image)
```

## 依赖项

- React hooks: useState, useCallback
- Lucide React: Upload, Download, Sparkles, ImageIcon, Zap, CheckCircle2
- i18n: useTranslation hook
- Tailwind CSS: 所有样式类

## 注意事项

1. **图片大小**: 当前未限制上传图片大小，建议添加前端验证
2. **错误处理**: 需要增强网络错误和 API 错误的处理
3. **性能优化**: 大图片可能导致性能问题，考虑添加压缩
4. **存储**: uploadedImage 使用 base64 存储，大图片会占用较多内存
