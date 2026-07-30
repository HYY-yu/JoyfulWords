# Material API 使用指南

> **目标**：说明当前前端素材搜索与素材库 API 的实际调用链。
> **更新时间**：2026-07-30

## 当前搜索链路

前端仅使用 `POST /materials/search-v2` 发起素材搜索。旧的
`POST /materials/search` 自动导入流程已经从前端移除。

文章编辑页通过 `components/article/editor-material-panel.tsx` 完成以下流程：

1. 调用 `materialsClient.searchV2()`，获得搜索日志 ID。
2. 调用 `materialsClient.getSearchLogDetail(id)` 获取已经完成的同步搜索结果。
3. 展示搜索结果，由用户选择需要导入的条目。
4. 调用 `materialsClient.addFromAISearch()` 获得 Materials request ID 和 `poll_url`。
5. 轮询 `poll_url`，成功后读取 `result.ids/materials/failed_results`。

搜索卡片会按用户和文章保存到 `localStorage`。分页会重新调用 `searchV2()`，并使用返回的
新日志 ID 查询该页结果。`search-v2` 自身保持同步，不接入 Materials Worker 轮询。

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

`status` 类型兼容 `doing`、`success`、`failed` 或 `nodata`；当前 `search-v2` 返回 ID 时
DataForSEO 搜索已经完成，不要为提交接口增加 Worker 轮询。

### 导入所选结果

```typescript
const accepted = await materialsClient.addFromAISearch({
  article_id: articleId,
  material_log_id: detail.id,
  urls: selectedUrls,
})

if ("error" in accepted) return

const imported = await waitForMaterialRequest<MaterialImportResult>(accepted, {
  signal: abortController.signal,
})
```

`failed_results` 允许和成功的 `ids/materials` 同时存在。前端保留成功素材，并单独提示失败 URL。
具体请求结构以 `lib/api/materials/types.ts` 为准。

## Materials Worker 通用合同

以下接口成功提交时返回 `202 Accepted`：

- `POST /materials/add-from-ai-search`
- `POST /materials/clue-board/expand`
- `POST /materials/parse-preview`

提交响应统一为 `{ id, job_id, status: "pending", poll_url }`。`job_id` 必须按字符串处理，
状态读取必须使用服务端返回的 `poll_url`，不能自行拼接 MinerU 或 TaskCenter 地址。

`lib/api/materials/polling.ts` 负责：

- 首次等待 1 秒，随后退避到最大 5 秒；
- `pending/processing` 继续，`succeeded/failed` 停止；
- 临时网络错误重试，`401/404` 停止；
- 支持 `AbortSignal`，避免切换文章、关闭弹窗或重新提交时旧结果覆盖新状态；
- Worker 失败保留 `error_code` 用于日志，UI 使用 `error_message_id` 对应的本地化文案。

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

文章编辑页的素材线索白板调用 `POST /materials/clue-board/expand`，再按返回的 `poll_url`
等待 Worker 完成。只有 `succeeded` 后才替换节点内容；重新搜索根节点或卸载白板时会取消旧轮询。
成功结果中的 Markdown 链接会作为下一轮探索词，图片 URL 会显示在节点卡片中。

```typescript
type ExpandMaterialClueRequest = {
  query: string
}

type ClueBoardExpandResult = {
  query: string
  markdown: string
  images: string[]
}
```

## 文件解析预览

资料文件上传完成后调用 `POST /materials/parse-preview`。前端保存的是
`material_requests.id`，不再保存或轮询第三方 MinerU task ID；解析成功结果位于通用终态信封的
`result` 中。关闭上传弹窗或更换文件时必须取消旧轮询。

`POST /materials` 创建普通文本或图片素材仍同步返回 `201`。若调用方直接用受支持的数据文件
URL 和 `file_name` 创建 `info` 素材，响应可能额外包含
`request_id/job_id/poll_url/parse_status: "parsing"`；素材本身已经创建，后续解析失败不能展示为
“素材创建失败”。

## 维护要求

- 搜索相关变更应同时核对 `editor-material-panel.tsx`、API client、类型定义和中英文 i18n。
- 触发请求需要支持 `AbortSignal`，并忽略已经失效的异步响应。
- 搜索与 Worker 轮询必须保留关键路径 `Info`、失败 `Warn` 和状态变化 `Debug` 日志。
- Materials 状态只以 HTTP GET 为准，不注册或依赖 WebSocket。
- 后端 API 契约发生变化时，先更新对应 API 文档，再修改前端类型。
