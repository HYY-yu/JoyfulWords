# Image Generator Component

图片生成模块组件，支持三种创作模式。

## 概述

Image Generator 提供三种图片创作模式：
- **创作模式** - 传统的图层编辑和图片生成
- **风格模式** - AI 驱动的图片风格迁移
- **反向模式** - AI 驱动的图片拆分功能

## 文件结构

```
image-generator/
├── index.tsx                    # 主入口组件
├── types.ts                     # TypeScript 类型定义
├── mode-tabs.tsx                # Tab 切换组件
├── toolbar.tsx                  # 创作模式工具栏
├── canvas.tsx                   # 创作模式画布区域
├── properties-panel.tsx         # 创作模式属性面板
├── style-mode.tsx               # 风格模式组件
├── inversion-mode.tsx           # 反向模式组件
└── demo.tsx                     # 演示组件
```

## 三种模式

### 1. 创作模式 (Creation Mode)

传统的图层编辑模式。

**核心功能**：
- 工具栏：选择、矩形、删除工具
- 画布：网格背景，图层绘制和编辑
- 属性面板：环境设置、图层属性、渲染控制

### 2. 风格模式 (Style Mode)

AI 驱动的图片风格迁移功能。

**核心功能**：
- 拖拽/点击上传图片
- 6种预设风格：
  - 赛博霓虹 (Cyber Neon) - 高饱和度霓虹色彩
  - 磨砂玻璃 (Frosted Glass) - 半透明质感
  - 极简白描 (Minimal Line) - 黑白线条
  - 温暖油画 (Warm Oil) - 厚重笔触
  - 二次元 (Anime) - 日式动画风格
  - 水彩晕染 (Watercolor) - 流动色彩
- 实时预览和下载渲染结果

**使用流程**：上传图片 → 选择风格 → 生成图片 → 下载结果

### 3. 反向模式 (Inversion Mode)

AI 驱动的图片拆分功能。

**核心功能**：
- 拖拽/点击上传图片
- AI 拆分为4种图层：
  - 主体层 - 图像的主要主体
  - 背景层 - 图像的背景部分
  - 细节层 - 图像的细节纹理
  - 光影层 - 光照和阴影效果
- 多选图层并批量下载

**使用流程**：上传图片 → 拆分图片 → 选择图层 → 下载保存

## 使用方式

### 完整集成

```tsx
import { ImageGeneration } from "@/components/image-generator"

export default function Page() {
  return <ImageGeneration />
}
```

### 独立测试

```tsx
import { StyleModeDemo } from "@/components/image-generator/demo"

export default function DemoPage() {
  return <StyleModeDemo />
}
```

## 技术栈

- React 18 + TypeScript
- Tailwind CSS 4.x
- Lucide React
- 自定义 i18n 方案

## 后续计划

- 集成实际的 AI API
- 批量处理多张图片
- 添加更多风格预设
- 历史记录功能
