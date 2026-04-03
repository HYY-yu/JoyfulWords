# Article 编辑页 AI 思维导图功能设计

## 目标

- 在 `article/{id}/edit` 页面新增一个 AI Feature：`AI 思维导图`。
- 按文章维度维护导图：一篇文章仅一份导图，可持续编辑、保存、加载。
- 体验对齐现有 AIEdit：先校验文章存在，再弹窗，在弹窗初始化阶段后台请求。

## 交互流程

1. 用户在右侧 `AI FEATURES` 点击 `AI 思维导图`。
2. 前端校验：
   - 必须处于 edit 模式（create 模式提示先保存文章）。
   - 必须存在 `articleId`。
   - 文章正文必须非空。
3. 打开思维导图弹窗并进入 `loading`。
4. 弹窗初始化：
   - 优先加载历史导图，避免每次打开都覆盖用户已维护的结构。
   - 若不存在历史导图：按全文生成。
5. 用户在导图画布内直接完成核心操作：
   - 双击节点编辑文本
   - 拖拽调整结构
   - Tab / Enter 快捷新增节点
   - 画布基础能力由图库内建交互提供
6. 弹窗顶部只保留 `Rebuild from Article` 与保存动作。
7. 点击保存写入后端（当前为 mock route），返回新 revision。

## 数据结构

- 统一类型位于 `lib/api/articles/types.ts`：
  - `MindMapNode`
  - `MindMapDocument`
  - `GenerateMindMapRequest/Response`
  - `GetMindMapResponse`
  - `SaveMindMapRequest/Response`

## API 设计（Mock）

- `POST /api/article/mindmap/generate`
  - 输入：`article_id`, `article_text`
  - 输出：`MindMapDocument`
- `GET /api/article/:id/mindmap`
  - 存在：返回导图
  - 不存在：`404 + MINDMAP_NOT_FOUND`
- `PUT /api/article/:id/mindmap`
  - 输入：完整导图对象
  - 保存时校验 `revision`，冲突返回 `409 + MINDMAP_REVISION_CONFLICT`
  - 成功后 revision 自增

## 前端实现

- 新增 AI 按钮入口：`components/article/editor-ai-panel.tsx`
  - 新事件：`joyfulwords-open-ai-mindmap`
- 事件桥接与校验：`components/tiptap-editor.tsx`
  - 监听事件后打开 `AIMindMapDialog`
- 思维导图弹窗：`components/ui/ai/ai-mindmap-dialog.tsx`
  - 渲染框架：`mind-elixir`
  - 采用左右分支布局，接近 Xmind 的工作区交互
  - 通过适配层把 `MindMapDocument` 与第三方组件数据结构解耦
- 客户端请求：`lib/api/articles/mindmap-client.ts`
- 数据适配层：`lib/mindmap/mind-elixir-adapter.ts`

## 设计取舍

- 不再用通用流程图库模拟脑图。流程图的节点/边模型虽然能“画出来”，但交互与视觉都会偏向流程图，不适合作为长期维护的思维导图基础。
- 保持 `MindMapDocument` 作为业务协议不变，前端库升级仅落在适配层与 UI 组件内部，降低未来接后端或替换图库的成本。
- 历史导图优先加载。只有首次不存在导图时才自动生成；之后只有用户主动点击 `Rebuild from Article` 才重新生成，避免无感覆盖。
- 生成策略只保留“按全文生成”，不再支持按选区生成，减少产品和后端协议分叉。

## 可观测性约定

- Debug：初始化分支（选中/历史/全文）与节点编辑动作。
- Info：生成开始、保存成功。
- Warn：加载失败、生成失败、revision 冲突。
- Error：请求异常与解析失败。
- 预留注释：
  - `TODO(observability): add trace span...`
  - `TODO(metrics): record ...`

## i18n

- 新增命名空间：`aiMindmap`
- 新增按钮文案：`tiptapEditor.aiPanel.mindmap`
- 中英文文件同步更新：
  - `lib/i18n/locales/zh.ts`
  - `lib/i18n/locales/en.ts`

## 后续接入真实后端

1. 保持 `MindMapDocument` 协议不变。
2. 将 `mindMapClient` 的 URL 从 `/api/article/...` 切换到后端正式接口。
3. 保留 `revision` 机制，用于并发编辑冲突提示。
