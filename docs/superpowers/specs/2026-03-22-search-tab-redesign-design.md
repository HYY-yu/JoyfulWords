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
- 点击弹出上传对话框（在 `editor-material-panel.tsx` 内自建轻量上传弹窗，不复用 `material-dialogs.tsx`，因为它耦合了 edit/delete 对话框的 props）
- 上传成功后素材自动标记为已采纳（`material_logs_id === 0` 天然属于素材库）

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
3. 显示搜索中状态（loading indicator + "AI 搜索中..."文本）
4. 开始 3 秒轮询 `getSearchLogs`，检查搜索是否完成
5. 搜索完成后，调用 `getMaterials({ type, page_size: 100 })` 获取最新素材列表
6. **客户端过滤**：从返回结果中筛选 `material_logs_id === latestLogId` 的素材作为搜索结果
7. 展示结果列表：
   - 图片类型：缩略图 + 标题，支持点击预览大图
   - 文本类型：标题 + 内容摘要（line-clamp）
8. 每条结果有"加入素材库"按钮
9. 已加入的显示已采纳状态（按钮变灰 + 勾选图标）

#### 搜索日志关联策略

`POST /materials/search` 不返回日志 ID。关联策略：
1. 搜索前记录当前时间戳
2. 轮询 `getSearchLogs({ type, page_size: 5 })` 按 `created_at` 降序
3. 匹配条件：`log.material_type === type && log.query === searchText && log.status !== 'doing'`
4. 取第一个匹配的 log，其 `id` 即为 `latestLogId`

#### 错误处理

- `search()` API 调用失败 → toast 提示"搜索请求失败"，恢复按钮状态
- 轮询发现 `status === 'failed'` → toast 提示"搜索失败，请重试"，停止轮询
- 轮询超时（30 秒无完成状态）→ toast 提示"搜索超时"，停止轮询
- 网络错误 → 轮询容错（单次失败不终止，连续 3 次失败终止）

#### 空状态

- 初始：提示用户输入关键词搜索素材（图标 + 文案）
- 搜索无结果：显示"未找到相关素材"
- 搜索中：骨架屏 + loading 文案

### 素材库 Tab

#### 变更

- 过滤条件调整：获取全部素材后，客户端过滤仅展示 `isCollected(material.id) || material_logs_id === 0`
- 注意：客户端过滤会导致 `total` 计数与实际显示数量不一致，`hasMore` 使用"本页是否返回满页"判断
- 搜索结果中的素材在未被采纳前不出现在素材库
- 其余保持不变（类型筛选、收藏分组、拖拽）

### 上传对话框

在 `editor-material-panel.tsx` 中自建轻量上传弹窗，不复用 `material-dialogs.tsx`（因其 props 耦合了 edit/delete 对话框）。

功能：
- 素材标题输入
- 素材类型选择（资料/图片）
- 资料类型：文本输入框
- 图片类型：文件选择（MIME 校验、5MB 限制）、预览
- 提交流程：图片素材先获取预签名 URL → 上传到 R2 → 创建素材记录

直接调用 `materialsClient` 方法，上传逻辑参考 `useMaterials.handleUploadSubmit`。

### 采纳状态管理

#### 临时方案（后端加字段前）

- **localStorage key**: `joyfulwords-collected-materials-{userId}`（按用户隔离）
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

### 搜索结果卡片的拖拽行为

搜索结果卡片**不支持拖拽**到编辑器。用户必须先"加入素材库"，然后从素材库 Tab 拖拽使用。这简化了交互模型，也确保编辑器引用的素材都在素材库中。

### 轮询生命周期

- Tab 切换或组件卸载时**取消轮询**（cleanup interval）
- 新搜索触发时**取消上一次轮询**再开始新轮询

## 涉及文件

### 新增

| 文件 | 说明 |
|------|------|
| `lib/hooks/use-collected-materials.ts` | 采纳状态管理 hook（localStorage 临时方案） |

### 修改

| 文件 | 变更 |
|------|------|
| `components/article/editor-material-panel.tsx` | 重写 SearchTab、调整 EditorMaterialPanel 布局（加上传按钮和上传弹窗）、LibraryTab 客户端过滤逻辑 |
| i18n 翻译文件（`zh.ts`, `en.ts`） | 新增搜索类型选择器、加入素材库按钮、搜索状态、上传弹窗等翻译 key |

### 复用（不修改）

| 文件 | 说明 |
|------|------|
| `lib/api/materials/client.ts` | `search()`, `getSearchLogs()`, `getMaterials()`, `getPresignedUrl()`, `createMaterial()`, `uploadFileToPresignedUrl()` |

## 不做的事

- 不修改后端 API
- 不修改 `material-dialogs.tsx`
- 不修改 `lib/api/materials/` 下的任何文件
