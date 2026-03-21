# 文章编辑器三栏布局重构设计

## 概述

将现有的文章编辑页面重构为三栏布局的独立页面 (`/articles/[id]/edit`)，提供更高效的创作体验。

## 布局结构

```
┌─────────────────────────────────────────────────────────┐
│ 全局导航栏（创作者工具箱 + 反馈/计费管理/头像）            │
├─────────────────────────────────────────────────────────┤
│ 编辑器顶栏：← 返回 | 可编辑标题 | 状态Badge | 🗑 ⬇ [保存] │
├────────────┬─────────────────────────┬──────────────────┤
│ 左栏 ~22%  │ 中栏 (自适应)            │ 右栏 ~24%        │
│            │                         │                  │
│ 素材面板    │ Tiptap 工具栏            │ AI 功能          │
│ ┌────────┐ │ ─────────────           │ ┌──────┬──────┐  │
│ │搜索│素材库│ │                       │ │AI编辑│创作图片│ │
│ └────────┘ │ 编辑区域                 │ │AI生成│反向模式│ │
│            │                         │ │  图片风格    │  │
│ 搜索框      │                        │ └────────────┘  │
│ 素材卡片列表 │                        │                  │
│ (可拖拽)    │                         │ 任务进度          │
│            │                         │ [进行中/完成/失败] │
│            │ 底部状态栏(字数/保存状态)  │ (可删除记录)      │
├────────────┴─────────────────────────┴──────────────────┤
│                    可拖拽分隔条                           │
└─────────────────────────────────────────────────────────┘
```

## 设计决策

| 决策项 | 选择 | 原因 |
|--------|------|------|
| 页面方式 | 新建独立路由页面 `/articles/[id]/edit` | 三栏需要全屏宽度，代码解耦清晰 |
| AI功能交互 | 弹窗模式 | 保持现有行为，复杂表单适合弹窗 |
| 任务展示 | 所有异步任务 + 历史记录 | AI编辑 + 图片生成统一展示 |
| 三栏宽度 | 可拖拽调整 | 用户可根据需求灵活分配空间 |
| 素材插入 | 拖拽插入编辑器 | 直观的操作方式 |
| 收藏夹 | 前端 localStorage 存储 | 无需后端配合，快速实现 |
| 主题色 | 蓝色 (#2563eb) | 与网站现有主题一致 |

## 组件拆分

### 新增文件

1. **`app/articles/[id]/edit/page.tsx`** — 编辑页面路由，获取文章数据
2. **`components/article/article-editor-layout.tsx`** — 三栏布局容器，管理拖拽分隔条
3. **`components/article/editor-material-panel.tsx`** — 左栏素材面板（搜索Tab + 素材库Tab）
4. **`components/article/editor-ai-panel.tsx`** — 右栏 AI 功能面板
5. **`components/article/editor-task-progress.tsx`** — 任务进度列表组件
6. **`components/article/editor-top-bar.tsx`** — 编辑器顶栏（返回/标题编辑/保存）
7. **`lib/hooks/use-resizable-panels.ts`** — 可拖拽面板 Hook
8. **`lib/hooks/use-material-favorites.ts`** — 前端收藏夹 Hook (localStorage)

### 复用现有

- `components/tiptap-editor.tsx` — 编辑器主体
- `components/materials/material-search-bar.tsx` — 搜索栏
- `components/materials/material-table.tsx` — 素材列表（改造为卡片展示）
- `components/ui/ai/ai-rewrite-dialog.tsx` — AI 编辑弹窗
- `components/article/article-ai-help-dialog.tsx` — AI 生成文章弹窗
- `components/image-generator/index.tsx` — 图片生成（弹窗化）
- `lib/hooks/use-ai-edit-state.ts` — AI 任务状态管理
- `lib/hooks/use-multiple-ai-edit-pollers.ts` — 多任务轮询
- `lib/hooks/use-auto-save.ts` — 自动保存
- `lib/hooks/use-infinite-materials.ts` — 素材无限滚动

## 左栏：素材面板

### 搜索 Tab
- 搜索框 + 搜索结果列表
- 复用 `use-infinite-materials` Hook
- 素材以卡片形式展示（名称 + 预览 + 标签）
- 卡片支持 HTML5 drag & drop，拖拽到编辑器插入素材文本

### 素材库 Tab
- 展示全部素材列表（卡片形式，无限滚动）
- 收藏夹分组区域（localStorage 存储）
  - 支持创建/删除/重命名分组
  - 支持将素材添加到分组
  - 分组可折叠展开

## 中栏：编辑器

- 复用现有 `tiptap-editor.tsx`
- 编辑器工具栏保持现有功能
- 底部状态栏：字数统计 + 自动保存状态
- 支持从左侧拖入素材（drop 事件处理）

## 右栏：AI 功能 + 任务进度

### AI 功能区
- 2x2 + 1 网格布局的功能按钮
- 每个按钮点击弹出对应 Dialog
- hover 时蓝色边框 + 淡蓝背景

### 任务进度区
- 统一展示 AI 编辑和图片生成任务
- 任务状态：进行中（蓝色边框+进度条）、已完成（绿色）、失败（红色）
- 已完成/失败任务 hover 显示删除按钮
- 任务数据来源：扩展现有 `use-ai-edit-state.ts`，增加图片生成任务支持

## 编辑器顶栏

- ← 返回按钮：`router.push('/articles')`
- 可编辑标题：点击进入编辑，聚焦时蓝色边框，失焦自动保存
- 状态 Badge：草稿/已发布/已归档
- 操作按钮：清空 🗑 / 导出 ⬇ / 蓝色保存按钮

## 拖拽分隔条

- 使用 `mousedown` + `mousemove` + `mouseup` 实现
- 最小宽度限制：左栏 180px，中栏 400px，右栏 200px
- 拖拽时显示分隔条高亮
- 宽度比例持久化到 localStorage

## 数据流

```
ArticleEditPage (路由)
  → 获取文章数据 (articlesClient)
  → ArticleEditorLayout (三栏容器)
    → EditorTopBar (标题编辑/保存)
    → EditorMaterialPanel (左栏)
      → MaterialSearchTab (搜索)
      → MaterialLibraryTab (素材库+收藏夹)
    → TiptapEditor (中栏，复用)
    → EditorAIPanel (右栏)
      → AI功能按钮 → 各Dialog
      → EditorTaskProgress (任务列表)
```
