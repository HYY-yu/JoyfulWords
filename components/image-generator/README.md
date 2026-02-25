# Image Generator Component

图片生成模块组件，支持多种创作模式。

## 文件结构

```
image-generator/
├── index.tsx                    # 主入口组件，管理状态和逻辑
├── types.ts                     # TypeScript 类型定义
├── mode-tabs.tsx                # Tab 切换组件（创作/风格/反向模式）
├── toolbar.tsx                  # 左侧工具栏（选择/矩形/删除）
├── canvas.tsx                   # 中间画布区域
├── properties-panel.tsx         # 右侧属性面板
├── style-mode.tsx               # 风格模式组件 ⭐ 新增
├── inversion-mode.tsx           # 反向模式组件 ⭐ 新增
├── demo.tsx                     # 风格模式演示组件 ⭐ 新增
├── STYLE_MODE.md                # 风格模式详细文档 ⭐ 新增
├── INVERSION_MODE.md            # 反向模式详细文档 ⭐ 新增
├── DESIGN_DOC.md                # 设计文档 ⭐ 新增
├── IMPLEMENTATION_SUMMARY.md    # 实现总结 ⭐ 新增
└── README.md                    # 本文档
```

## 模式说明

### 1. 创作模式 (Creation Mode)
传统的图层编辑模式：
- 左侧工具栏：选择、矩形、删除工具
- 中间画布：网格背景，支持图层绘制和编辑
- 右侧面板：环境设置、图层属性、渲染控制

### 2. 风格模式 (Style Mode) ⭐ 新增
AI 风格迁移模式：
- **左侧**：图片上传区（拖拽/点击上传）
- **中间**：实时预览区（显示渲染状态和结果）
- **右侧**：风格控制面板（6种预设风格 + 高级选项）

**预设风格**：
- 赛博霓虹 - 高饱和度霓虹色彩
- 磨砂玻璃 - 半透明质感
- 极简白描 - 黑白线条
- 温暖油画 - 厚重笔触
- 二次元 - 日式动画风格
- 水彩晕染 - 流动色彩

### 3. 反向模式 (Inversion Mode) ⭐ 新增
AI 图片拆分模式：
- **左侧**：图片上传区（拖拽/点击上传）+ 拆分按钮
- **右侧**：图层列表区（网格展示、多选、批量下载）

**拆分层类型**：
- 主体层 - 图像的主要主体
- 背景层 - 图像的背景部分
- 细节层 - 图像的细节纹理
- 光影层 - 光照和阴影效果

## 组件说明

### index.tsx - 主入口
- 管理所有状态（工具、图层、环境设置、渲染设置、当前模式等）
- 处理用户交互逻辑
- 根据当前模式渲染对应的子组件
- 集成风格模式组件

### types.ts - 类型定义
- `Layer`: 图层数据结构
- `TabValue`: Tab 类型 ("creation" | "style" | "inversion")
- `ToolType`: 工具类型 ("select" | "rectangle" | "delete")
- `EnvironmentSettings`: 环境设置（宽度、高度、风格、光影）
- `RenderSettings`: 渲染设置（采样步数）
- `LayerProps`: 图层属性（标签、描述、层级）

### mode-tabs.tsx - Tab 切换
- 三个模式 Tab：创作模式、风格模式、反向模式
- 使用 localStorage 持久化选中状态
- 采用与 content-writing 相同的 TabBar 设计
- 支持受控组件模式（activeTab + onTabChange）

### toolbar.tsx - 工具栏（创作模式）
- 三种工具：选择、矩形、删除
- 激活状态视觉反馈（主色调高亮）
- 固定宽度 64px

### canvas.tsx - 画布区域（创作模式）
- 网格背景（20px 间隔）
- 顶部操作栏（预览 JSON、生成图片按钮）
- 图层渲染和选中状态
- 调整手柄（选中时显示）
- 空状态提示

### properties-panel.tsx - 属性面板（创作模式）
- **基础环境**：宽度、高度、风格、光影设置
- **选中图层属性**：标签、描述、层级（仅选中时显示）
- **渲染控制**：采样步数滑块
- 固定宽度 320px

### style-mode.tsx - 风格模式组件 ⭐ 新增
- **左侧上传区**：拖拽上传、点击上传、实时预览
- **中间预览区**：渲染状态展示、动画效果、下载功能
- **右侧风格面板**：6种预设风格、风格强度调节

详细文档请参考 [STYLE_MODE.md](./STYLE_MODE.md)

## 使用方式

### 完整集成
```tsx
import { ImageGeneration } from "@/components/image-generator"

// 在页面中使用
<ImageGeneration />
```

### 独立测试风格模式
```tsx
import { StyleModeDemo } from "@/components/image-generator/demo"

export default function DemoPage() {
  return <StyleModeDemo />
}
```

## 状态管理

所有状态由 `index.tsx` 统一管理，通过 props 传递给子组件：

### 创作模式状态
- `selectedTool`: 当前选中的工具
- `selectedLayer`: 当前选中的图层
- `layers`: 所有图层数组
- `envSettings`: 环境设置
- `renderSettings`: 渲染设置
- `layerProps`: 选中图层的属性

### 风格模式状态
- `uploadedImage`: 上传的图片（base64）
- `selectedStyle`: 选中的风格 ID
- `renderStatus`: 渲染状态（idle | generating | completed | error）
- `renderedImage`: 渲染后的图片

### 反向模式状态
- `uploadedImage`: 上传的图片（base64）
- `splitStatus`: 拆分状态（idle | uploading | splitting | completed | error）
- `layerImages`: 拆分后的图层数组
- `selectedLayers`: 选中的图层 ID 集合
- `isProcessing`: 是否正在处理

## 交互流程

### 创作模式流程
1. **选择工具**：点击左侧工具栏选择工具
2. **添加图层**：选择矩形工具，点击画布添加矩形图层
3. **编辑图层**：选择工具下点击图层，在右侧面板编辑属性
4. **删除图层**：选择删除工具点击图层，或选中后点击删除工具
5. **生成**：点击顶部"预览 JSON"或"生成图片"按钮

### 风格模式流程
1. **上传图片**：在左侧上传区拖拽或点击上传图片
2. **选择风格**：在右侧风格面板选择预设风格
3. **调整强度**：（可选）使用风格强度滑块调整效果
4. **生成图片**：点击"生成图片"按钮，AI 开始渲染
5. **下载结果**：渲染完成后，点击"下载图片"保存结果

### 反向模式流程
1. **上传图片**：在左侧上传区拖拽或点击上传图片
2. **点击拆分**：点击"拆分图片"按钮，AI 开始分析
3. **查看图层**：等待拆分完成，右侧显示拆分结果
4. **选择图层**：勾选需要保存的图层（支持多选）
5. **批量下载**：点击"下载选中"保存所有选中的图层

## 设计规范

- 使用项目统一的 CSS 变量
- Shadcn/ui 组件库
- TabBar 采用与 content-writing 相同的设计
- 圆角、阴影、间距保持项目一致性
- 风格模式和反向模式采用现代化、专业的设计语言
- 所有动画和过渡效果遵循 Tailwind CSS 规范

## 国际化

完整支持中英文双语：
- 创作模式：使用项目现有的翻译键
- 风格模式：新增翻译键（已集成到现有 i18n 系统）
- 反向模式：新增翻译键（已集成到现有 i18n 系统）

## 文档索引

- [STYLE_MODE.md](./STYLE_MODE.md) - 风格模式详细使用说明
- [INVERSION_MODE.md](./INVERSION_MODE.md) - 反向模式详细使用说明 ⭐ 新增
- [DESIGN_DOC.md](./DESIGN_DOC.md) - 设计文档和设计理念
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - 实现总结和技术细节

## 技术栈

- **React 18**: Hooks（useState, useCallback, useEffect）
- **TypeScript**: 严格类型检查
- **Tailwind CSS 4.x**: 所有样式
- **Lucide React**: 图标库
- **i18n**: 自定义国际化方案

## 后续计划

- [ ] 集成实际的 AI 图片风格迁移 API
- [ ] 集成实际的 AI 图片拆分 API
- [ ] 支持批量处理多张图片
- [ ] 添加更多风格预设
- [ ] 支持自定义拆分参数（图层数量、精度）
- [ ] 添加历史记录功能
