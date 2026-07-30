# Material API 使用指南

> **目标**：说明当前前端素材搜索与素材库 API 的实际调用链。
> **更新时间**：2026-07-30

## 当前搜索链路

前端仅使用 `POST /materials/search-v2` 发起素材搜索。旧的
`POST /materials/search` 自动导入流程已经从前端移除。

文章编辑页通过 `components/article/editor-material-panel.tsx` 完成以下流程：

1. 调用 `materialsClient.searchV2()`，获得搜索日志 ID。
2. 轮询 `materialsClient.getSearchLogDetail(id)`。
3. 展示搜索结果，由用户选择需要导入的条目。
4. 调用 `materialsClient.addFromAISearch()` 导入所选素材。

搜索任务会按用户和文章保存到 `localStorage`，页面恢复时继续轮询。分页会重新调用
`searchV2()`，并使用返回的新日志 ID 查询该页结果。

### 发起搜索

```typescript
const result = await materialsClient.searchV2(
  "news",
  "AI 技术",
  {
    page: 1,
    page_size: 10,
  },
  {
    signal: abortController.signal,
  }
)

if ("error" in result) {
  console.warn("[MaterialSearch] trigger failed", {
    error: result.error,
  })
  return
}

console.info("[MaterialSearch] search created", {
  logId: result.id,
})
```

### 查询搜索结果

```typescript
const detail = await materialsClient.getSearchLogDetail(
  result.id,
  abortController.signal
)

if ("error" in detail) {
  console.warn("[MaterialSearch] detail poll failed", {
    error: detail.error,
  })
  return
}
```

`status` 可能为 `doing`、`success`、`failed` 或 `nodata`。只有终态结果才能进入选择和导入流程。

### 导入所选结果

```typescript
const imported = await materialsClient.addFromAISearch({
  article_id: articleId,
  material_log_id: detail.id,
  urls: selectedUrls,
})
```

具体请求结构以 `lib/api/materials/types.ts` 为准。

## 素材库

素材列表及 CRUD 由 `lib/hooks/use-materials.ts` 和以下 API 负责：

- `GET /materials/list`
- `POST /materials`
- `PUT /materials/:id`
- `DELETE /materials/:id`
- `POST /materials/presigned-url`
- `POST /materials/upload-complete`

### 获取素材列表

```typescript
const result = await materialsClient.getMaterials({
  page: 1,
  page_size: 20,
  name: "AI",
  type: "info",
  article_id: articleId,
})
```

### 上传图片素材

1. 使用 `materialsClient.getPresignedUrl()` 获取上传地址。
2. 使用 `uploadFileToPresignedUrl()` 上传文件。
3. 使用 `materialsClient.completeUpload()` 完成上传校验。
4. 使用 `materialsClient.createMaterial()` 创建素材记录。

文件类型和大小必须先经过 `lib/upload-file.ts` 中的公共校验。

## 线索白板

文章编辑页的素材线索白板调用 `POST /materials/clue-board/expand`。返回的 Markdown
链接会作为下一轮探索词，图片 URL 会显示在节点卡片中。

```typescript
type ExpandMaterialClueRequest = {
  query: string
}

type ExpandMaterialClueResponse = {
  query: string
  markdown: string
  images?: string[]
}
```

## 维护要求

- 搜索相关变更应同时核对 `editor-material-panel.tsx`、API client、类型定义和中英文 i18n。
- 触发请求需要支持 `AbortSignal`，并忽略已经失效的异步响应。
- 搜索期间必须保留关键路径 `Info`、失败 `Warn` 和轮询 `Debug` 日志。
- 后端 API 契约发生变化时，先更新对应 API 文档，再修改前端类型。
