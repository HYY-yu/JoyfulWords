# 搜索 Tab 重新设计 — 从浏览现有素材到搜索新素材

**日期**: 2026-03-22
**状态**: 已批准

## 背景

当前搜索 Tab 使用 `useInfiniteMaterials` 浏览已有素材，与素材库 Tab 功能重叠。需要将搜索 Tab 改造为"寻找新素材"的工具，用户可以触发异步搜索、预览结果、手动将结果加入素材库。同时在面板顶部添加上传入口。

参考产品：NotebookLM 左侧面板。

## 设计

### 面板整体布局

```
┌──────────────────────────┐
│  [+ 上传素材]  按钮       │  ← Tabs 上方，固定
├──────────────────────────┤
│  [搜索] [素材库]  tabs    │
├──────────────────────────┤
│  Tab 内容区               │
└──────────────────────────┘
```

- 上传按钮位于 Tabs 上方，不属于任何 Tab
- 点击弹出上传对话框（复用 `material-dialogs.tsx` 中已有的上传弹窗）
- 上传成功后素材自动标记 `is_collected = true`，出现在素材库 Tab

### 搜索 Tab

#### 布局

```
┌──────────────────────────┐
│ [资料] [新闻] [图片]      │  ← 类型选择器
├──────────────────────────┤
│ [搜索输入框......] [🔍]   │  ← 搜索框 + 按钮
├──────────────────────────┤
│  搜索中... / 搜索结果列表  │
│  ┌────────────────────┐  │
│  │ 标题               │  │
│  │ 内容摘要/缩略图     │  │
│  │ [加入素材库]        │  │
│  └────────────────────┘  │
└──────────────────────────┘
```

#### 交互流程

1. 用户选择素材类型（资料/新闻/图片），输入搜索词
2. 点击搜索 → 调用 `materialsClient.search(type, text)`
3. 显示搜索中状态（loading indicator）
4. 开始 3 秒轮询 `getSearchLogs`，检查搜索是否完成
5. 搜索完成后，调用 `getMaterials` 过滤 `material_logs_id` 等于最新搜索日志 ID 的素材
6. 展示结果列表：
   - 图片类型：缩略图 + 标题，支持点击预览大图
   - 文本类型：标题 + 内容摘要（line-clamp）
7. 每条结果有"加入素材库"按钮
8. 已加入的显示已采纳状态（按钮变灰 + 勾选图标）

#### 搜索结果过滤逻辑

搜索完成后通过最新 `MaterialLog.id` 关联结果：
```
GET /materials/list → 过滤 material_logs_id === latestLogId
```

#### 空状态

- 初始：提示用户输入关键词搜索素材
- 搜索无结果：显示"未找到相关素材"

### 素材库 Tab

#### 变更

- 过滤条件调整：仅展示 `is_collected === true` 或 `material_logs_id === 0`（用户上传）的素材
- 其余保持不变（类型筛选、收藏分组、拖拽）

### 采纳状态管理

#### 临时方案（后端加字段前）

- **localStorage key**: `joyfulwords-collected-materials`
- **存储格式**: `number[]`（已采纳的 material id 数组）
- **新 hook**: `useCollectedMaterials`

```typescript
interface UseCollectedMaterialsReturn {
  collectedIds: Set<number>
  collect: (id: number) => void
  uncollect: (id: number) => void
  isCollected: (id: number) => boolean
}
```

- 上传的素材（`material_logs_id === 0`）天然属于素材库，无需标记
- 素材库 Tab 展示逻辑：`material_logs_id === 0 || isCollected(material.id)`

#### 后端就绪后

- Material 类型新增 `is_collected: boolean` 字段
- 替换 localStorage 逻辑为 API 调用
- hook 接口不变，仅替换内部实现

## 涉及文件

### 新增

| 文件 | 说明 |
|------|------|
| `lib/hooks/use-collected-materials.ts` | 采纳状态管理 hook |

### 修改

| 文件 | 变更 |
|------|------|
| `components/article/editor-material-panel.tsx` | 重写 SearchTab、调整 EditorMaterialPanel 布局（加上传按钮）、LibraryTab 过滤逻辑 |

### 复用（不修改）

| 文件 | 说明 |
|------|------|
| `lib/api/materials/client.ts` | `search()`, `getSearchLogs()`, `getMaterials()`, `getPresignedUrl()`, `createMaterial()`, `uploadFileToPresignedUrl()` |
| `lib/hooks/use-materials.ts` | 搜索轮询逻辑参考（可能提取部分逻辑） |
| `components/materials/material-dialogs.tsx` | 上传对话框复用 |

## 不做的事

- 不修改后端 API
- 不修改 `material-dialogs.tsx`（直接复用）
- 不新增 i18n key（如现有 key 足够；不够时仅添加必要的）
