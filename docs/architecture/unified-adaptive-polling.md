# 前端统一自适应轮询

## 目标

前端异步任务只通过 HTTP GET 获取服务端状态，不再依赖 WebSocket 推送。通用业务组件使用
`lib/hooks/use-adaptive-polling.ts`；Materials Worker 使用后端合同专用的
`lib/api/materials/polling.ts`（1 秒起步、最大 5 秒、按 `poll_url` 查询）。业务组件不直接维护
`setInterval`、重试次数或请求取消循环。

## 统一策略

- 默认阶段：前 15 秒每 3 秒、15～60 秒每 5 秒、之后每 10 秒。
- 请求失败：指数退避，默认最多退避到 30 秒；下一次成功后恢复正常阶段。
- 页面隐藏：暂停定时请求；页面重新可见或窗口重新聚焦时立即刷新。
- 生命周期：同一轮询器只允许一个在途请求，停止或卸载时通过 `AbortController` 取消。
- 立即刷新：业务提交成功后通过 `notifyTaskCenterTaskSubmitted` 唤醒 TaskCenter；若已有请求在途，
  记录一次补偿刷新，请求结束后立即执行，不丢失提交信号。
- 超时：默认 5 分钟；业务可按任务特征覆盖。
- 抖动：默认在间隔上加入 10% 随机抖动，避免多个页面同时请求。
- 业务可返回明确的下一次间隔；TaskCenter 使用这一能力区分活跃和空闲状态。

纯 UI 定时器不属于业务轮询，例如防抖、复制提示、验证码倒计时、动画时钟和对象 URL
回收。

## 已接入业务

| 业务 | 状态读取 API | 说明 |
| --- | --- | --- |
| TaskCenter | `GET /api/taskcenter/tasks` | 有非终态任务时 5 秒，无活跃任务时 30 秒；文章列表和编辑器通过同一来源感知写作任务完成 |
| ECharts 文章提取 | `GET /echarts/requests/:id` | 跟踪请求及子任务，成功、失败或超时停止 |
| Toolbox ECharts | `GET /toolbox/echarts/tasks/:id` | 登录用户与访客共用同一轮询路径 |
| 图片生成 | `GET /image-generation/tasks/:id` | Creator、Style、Inversion、字体图、局部重绘及任务恢复统一接入 |
| 信息图 | `GET /infographics/logs/:id` | 单任务与文章批量任务共用统一策略 |
| PPT V2 | `GET /presentations/v2/storycards?article_id=...`、`GET /presentations/v2/generations/:id` | Storycard 与生成任务使用独立轮询实例 |
| 播客 | `GET /podcast/article-scripts/:id`、`GET /podcast/audio-tasks/:id` | 文稿与音频任务独立轮询，保留分段音频合并语义 |
| 素材搜索 | `GET /materials/search-logs/:id` | 支持恢复本地持久化的未完成搜索 |
| 素材 Worker 请求 | `GET /materials/requests/:id`（以提交响应 `poll_url` 为准） | 搜索结果导入、线索白板扩展、解析预览及数据文件解析共用；请求 ID 是 Materials request ID，不是 MinerU task ID |
| 素材库搜索状态 | 搜索日志列表 API | 活跃搜索结束后刷新日志和素材列表 |
| 支付回跳确认 | 订单状态查询 API | 固定 5 秒业务间隔，总超时 75 秒 |

## WebSocket 移除范围

- 根布局不再挂载 WebSocket Provider。
- 文章创建、文章编辑、图片生成、字体图、PPT V2 和 TaskCenter 不再注册推送监听。
- 删除前端 WebSocket Provider、服务实现及其专用测试。
- HTTP 状态接口是唯一事实来源；即时刷新由统一轮询器的 `pollNow`、页面聚焦恢复和业务提交后
  启动轮询完成。
- `joyfulwords-taskcenter-task-submitted` 仅是同一浏览器页面内的刷新提示，不携带任务状态，
  不替代 HTTP GET，也不是服务端推送通道。

## TaskCenter 详情刷新

- 首次选择或切换任务时显示 loading。
- 列表轮询导致所选任务状态变化时，详情使用后台刷新并保持现有内容挂载。
- 详情请求使用 `AbortController` 和请求序号，过期响应不能覆盖新任务详情。
- ECharts 详情只在任务 ID、版本、提示词或图表配置实质变化时重置编辑草稿，普通后台刷新不再
  销毁并重新初始化图表。

## 后端 API 缺口

本轮审计没有发现因缺少 GET 状态 API 而无法迁移的活动业务。此前直接消费 WebSocket 的业务
均已有业务状态 API 或 TaskCenter 列表 API，因此当前无需新增阻塞性接口。

若后续新增异步 Worker 业务，前端接入前至少需要：

1. 创建接口返回稳定任务 ID。
2. GET 状态接口返回明确的非终态与终态。
3. 失败响应包含可展示错误和稳定错误码。
4. 任务 GET 可在刷新页面后继续查询，并校验用户和业务资源归属。

## 已移除的旧实现

以下未被运行时代码引用的旧文章轮询 Hook 已删除，避免形成第二套调度策略：

- `use-ai-edit-status-poller.ts`
- `use-article-edit-polling.ts`
- `use-multiple-ai-edit-pollers.ts`

## 验收

```bash
rg -ni "websocket|web_socket|ws://|wss://" app components hooks lib
pnpm exec tsc --noEmit
pnpm lint
pnpm tsx --test lib/polling/adaptive-polling.test.ts
pnpm build
```
