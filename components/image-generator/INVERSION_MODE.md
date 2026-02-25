# 反向模式组件说明

## 概述

`InversionMode` 组件实现了图片反向拆分功能，允许用户上传一张图片，AI 将其拆分成多个图层，用户可以选择性保存需要的图层。

## 功能特性

### 1. 左侧 - 图片上传和拆分控制
- **拖拽上传**: 支持拖拽图片文件到上传区域
- **点击上传**: 点击上传区域选择本地图片
- **拆分按钮**: 一键触发 AI 拆分功能
- **状态展示**: 实时显示拆分状态（空闲/拆分中/完成）
- **进度提示**: 拆分过程中显示动画加载效果

### 2. 右侧 - 图层列表展示
- **网格布局**: 响应式网格展示拆分后的图层
- **多选功能**: 支持单选和全选图层
- **预览功能**: 每个图层卡片显示缩略图和描述
- **批量下载**: 一键下载所有选中的图层
- **统计信息**: 实时显示已选图层数量

## 拆分流程

```
上传图片 → 点击拆分 → AI 处理 → 显示图层 → 选择图层 → 下载保存
```

## 图层类型

系统将图片拆分为以下图层：

| 图层 | 英文名 | 描述 |
|------|--------|------|
| 主体层 | Main Subject | 图像的主要主体 |
| 背景层 | Background | 图像的背景部分 |
| 细节层 | Details | 图像的细节纹理 |
| 光影层 | Lighting | 光照和阴影效果 |

## 技术实现

### 文件结构
```
components/image-generator/
├── inversion-mode.tsx    # 反向模式主组件 ⭐ 新增
└── index.tsx             # 集成反向模式
```

### 状态管理
```typescript
// 上传状态
uploadedImage: string | null

// 拆分状态
splitStatus: "idle" | "uploading" | "splitting" | "completed" | "error"

// 拆分结果
layerImages: LayerImage[]

// 选择状态
selectedLayers: Set<string>

// 处理状态
isProcessing: boolean
```

### 核心功能

#### 1. 图片上传
```typescript
const handleFileUpload = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    setUploadedImage(e.target?.result as string)
  }
  reader.readAsDataURL(file)
}
```

#### 2. 触发拆分
```typescript
const handleSplit = () => {
  setSplitStatus("splitting")
  // 调用 API 进行拆分
  // ...
  setLayerImages(result)
  setSplitStatus("completed")
}
```

#### 3. 图层选择
```typescript
const handleToggleLayer = (layerId: string) => {
  setSelectedLayers(prev => {
    const newSet = new Set(prev)
    if (newSet.has(layerId)) {
      newSet.delete(layerId)
    } else {
      newSet.add(layerId)
    }
    return newSet
  })
}
```

#### 4. 批量下载
```typescript
const handleDownloadSelected = async () => {
  for (const layerId of selectedLayers) {
    const layer = layerImages.find(l => l.id === layerId)
    if (layer) {
      // 下载图层
      const link = document.createElement("a")
      link.href = layer.imageUrl
      link.download = `${layer.nameEn}.png`
      link.click()
    }
  }
}
```

## UI 细节

### 上传区
- **尺寸**: 384px 宽，4:3 比例
- **样式**: 虚线边框，支持拖拽高亮
- **反馈**: 拖拽时有脉冲动画效果

### 拆分按钮
- **位置**: 上传区下方
- **样式**: 主色调按钮，带图标
- **状态**: 拆分中时禁用

### 加载状态
- **动画**: 旋转圆环加载器
- **文本**: "AI 正在拆分图片..."
- **时长**: 3秒（模拟）

### 图层卡片
- **布局**: 响应式网格（1/2/3列）
- **尺寸**: 正方形缩略图
- **信息**: 图层编号、名称、描述
- **选择**: 复选框样式指示器
- **悬停**: 显示预览按钮

## 使用场景

1. **设计素材提取**: 从现有作品中提取独立的图层元素
2. **图片编辑准备**: 为后续编辑工作准备分层素材
3. **素材库构建**: 批量提取和收集设计元素
4. **学习分析**: 分析优秀作品的图层结构

## 后续扩展

### 计划功能
- [ ] 自定义拆分参数（图层数量、拆分精度）
- [ ] 支持更多图片格式
- [ ] 图层预览放大功能
- [ ] 图层编辑功能（调整、合并）
- [ ] 导出为 PSD 等专业格式

### API 集成
需要集成实际的 AI 图片拆分 API：
```typescript
const response = await fetch('/api/image-split', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image: uploadedImage,
    layerCount: 4,
    precision: 'high'
  })
})
const result = await response.json()
setLayerImages(result.layers)
```

## 性能优化

### 图片处理
- 限制上传图片大小（建议 < 10MB）
- 压缩大图片
- 使用 Web Worker 处理图片

### 下载优化
- 批量下载添加延迟（避免浏览器阻止）
- 支持打包下载（ZIP 格式）
- 添加下载进度提示

## 注意事项

1. **图片格式**: 当前支持所有浏览器支持的图片格式
2. **文件大小**: 建议添加文件大小限制和验证
3. **错误处理**: 需要增强网络错误和 API 错误的处理
4. **浏览器兼容**: 批量下载功能在不同浏览器表现可能不同
5. **内存占用**: 多个图层可能占用较多内存，考虑虚拟滚动

## 可访问性

- 所有按钮都有明确的标签
- 键盘导航支持（Tab 键切换）
- 选中状态有视觉和文字提示
- 加载状态有明确说明

## 国际化

完整支持中英文双语：
- 所有文本都已国际化
- 图层名称支持中英文
- 动态切换语言

## 依赖项

- React hooks: useState, useCallback
- Lucide React: Upload, Split, Download, CheckCircle2, Layers
- i18n: useTranslation hook
- Tailwind CSS: 所有样式类
