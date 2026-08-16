# 文档转换迁移至工具箱 PRD / 设计文档

> 日期：2026-08-15
>
> 状态：已按本文实施，待产品与代码审核
>
> 前端分支：`codex/fix-document-conversion-toolbox-guest`
>
> 后端分支：`codex/fix-document-converter-guest-quota`

## 1. 需求摘要

在不影响文章编辑器原有“转 Word”和 PPT 生成功能的前提下，将文档相关能力作为独立入口迁移到工具箱。迁移规则与视觉生成一致：原业务入口继续存在，工具箱提供可独立访问的入口。

工具箱承接 3 个真实入口：PPT 生成、Markdown 转 Word、PPT 转 Word。两个 Word 转换入口支持登录用户和游客；PPT 生成沿用现有文章与账户额度协议，登录后可粘贴内容或选择已有文章。

本次迁移是增量接入，不是从文章编辑器删除功能。

## 2. 目标与非目标

### 2.1 目标

- 保留文章编辑器“结构化输出 → 转 Word”卡片、自动预填、全屏弹窗、模板和下载流程。
- 保留文章编辑器现有 PPT 生成入口和流程。
- `/{locale}/tools/markdown-to-word` 提供独立 Markdown 转 Word 工作台。
- `/{locale}/tools/ppt-to-word` 提供独立 PPT 转 Word 工作台。
- `/{locale}/tools/ppt-generator` 支持粘贴 Markdown 或选择已有文章，并复用现有 Storycard、模板和 PPTX 生成流程。
- 粘贴 Markdown 时提供编辑、渲染预览和分栏三种显示方式，支持 GFM 标题、列表、任务清单、表格、引用、代码块和链接。
- 粘贴内容生成 PPT 时，前端先把 Markdown 转换为 HTML 并保存为新文章，再使用返回的文章 ID 启动原流程；标题为空时使用去除 Markdown 标记后的正文首行。
- 游客无需登录即可使用公共模板完成转换和下载。
- 游客转换消耗后端现有 Guest 全站每日总额度，不在前端硬编码次数。
- 游客额度耗尽时明确引导登录。
- 个人 Word 模板仍只对登录用户开放。
- 中文、英文和响应式行为一致。

### 2.2 非目标

- 不把 PPT 生成改造成游客接口；现有后端要求登录并关联文章 ID，粘贴内容会先保存为文章。
- 不新增 PDF 转 Word 工具箱卡片，PDF 能力继续由独立文件转换页承载。
- 不删除或重定向 `/{locale}/file-converter`；该页面仍承载 Markdown、PPT、PDF 三种模式。
- 不把文章正文通过 URL 传给工具箱。
- 不为文档转换新增独立的单游客次数规则或前端计数器。
- 不改变正式用户原有文档转换计费逻辑。

## 3. 双入口产品模型

| 入口 | 场景 | 输入 | 组件变体 | 是否保留 |
| --- | --- | --- | --- | --- |
| 文章编辑器“转 Word” | 当前文章导出 | 自动带入文章标题和 Markdown | `studio` | 是，行为不变 |
| 工具箱 Markdown 转 Word | 独立文档转换 | 用户输入或粘贴 Markdown | `toolbox` | 是，新增游客语义 |
| 工具箱 PPT 转 Word | 独立文档转换 | 用户上传 PPTX | `toolbox` | 是，新增游客语义 |
| 文章编辑器 PPT 生成 | 当前文章生成演示文稿 | 当前文章 ID | `PresentationFlowDialog` | 是，行为不变 |
| 工具箱 PPT 生成 | 从粘贴内容或已有文章生成演示文稿 | 粘贴标题与正文，或用户选择文章 ID | `ToolboxPptGenerator` | 是，需登录 |
| 独立文件转换页 | Markdown/PPT/PDF 转 Word | 用户输入或上传文件 | `page` | 是，行为不变 |

共享组件只复用转换、模板、预览和下载能力；文章上下文文案与游客交互通过变体隔离。

## 4. 用户流程

### 4.1 文章内原流程

```text
文章编辑器
  → 结构化输出
  → 转 Word
  → 自动带入当前文章 Markdown
  → 选择模板
  → 生成并下载 Word
```

### 4.2 工具箱 Word 转换

```text
工具箱
  → Markdown 转 Word / PPT 转 Word
  → 输入 Markdown / 上传 PPTX
  → 选择公共或个人模板
  → 生成并下载 Word
```

### 4.3 工具箱游客

```text
工具箱
  → Markdown 转 Word / PPT 转 Word
  → 后端签发或读取 jw_guest Cookie
  → 输入 Markdown / 上传 PPTX
  → 选择系统默认或公共模板
  → 预占 1 unit 游客总额度
  → 生成并下载 Word
```

游客上传个人模板时不展示无效上传表单，而是展示登录入口；登录链接带当前路径作为 `redirect`。

### 4.4 工具箱 PPT 生成

```text
工具箱 → PPT 生成 → 游客登录 / 登录用户选择内容来源
  ├─ 粘贴内容 → 保存为新文章 → 获取文章 ID
  └─ 选择包含正文且未归档的已有文章 → 获取文章 ID
      → 打开原 Storycard、模板和配图风格流程
      → 生成并下载 PPTX
```

PPT 生成不复用文档转换游客额度。当前后端 `/presentations/v2` 使用登录鉴权，并按账户积分检查生成任务。

## 5. 游客身份与额度设计

### 5.1 身份

- 前端请求使用 `credentials: "include"`。
- 有有效 access token 时附带 Bearer Token。
- 没有 token 时不强制刷新或跳登录，由后端签发/读取 HttpOnly `jw_guest` Cookie。
- 后端任务、列表和下载均按 `user_id` 或 `guest_id_hash` 校验归属。

### 5.2 额度

- scope：`document_conversion`
- 单次转换消耗：`1 unit`
- 来源：现有 `GUEST_DAILY_TOTAL_LIMIT_UNITS` 全站游客每日总池
- 统计日期：UTC
- 不新增文档转换专属单游客每日次数
- Markdown、PPT、PDF 三种有效转换均使用同一规则

额度预占发生在请求体、模板和文件校验之后，任务创建和 Python 转换调用之前。无效输入不消耗额度。

### 5.3 错误协议

额度耗尽返回 `401 Unauthorized`：

```json
{
  "error": "今日游客体验总额度已用完，请登录后继续。",
  "reason": "guest_global_quota_exceeded",
  "action": "login_required",
  "feature": "document_conversion",
  "limit_type": "global"
}
```

前端必须先按 `reason` 识别额度错误，不能把所有 401 都降级为普通“未登录”。额度服务不可用时返回 `reason: "login_required"`，引导登录后继续。

## 6. 界面设计

### 6.1 工具箱目录

- 文档转换分组和卡片顺序保持不变。
- PPT 生成、Markdown 转 Word、PPT 转 Word 均标记“可使用”。
- Markdown 转 Word、PPT 转 Word 卡片说明游客能力；PPT 生成详情页明确登录要求。

### 6.2 工具详情页

- 保留“返回工具箱”。
- Markdown 转 Word 和 PPT 转 Word 分别使用独立路由和固定模式，不显示 PDF 页签。
- 顶部状态：
  - 登录态检查中：`检查登录状态`
  - 游客：`游客模式 · 使用游客额度`
  - 正式用户：`已登录`
- 游客可选系统默认和公共模板。
- 游客个人模板区展示说明和登录按钮。
- 登录用户保留模板命名、上传和解析控件。
- 游客成功转换后提示结果与当前游客会话关联，建议及时下载。
- PPT 生成游客态展示登录入口；登录态默认展示 Markdown 编辑与实时预览工作区，也可切换到包含正文且未归档的文章选择器。
- Markdown 工作区桌面端默认分栏显示，用户可切换编辑、预览或分栏；移动端布局纵向折叠。
- 粘贴模式提交前先把 Markdown 转换为 HTML 并创建文章，创建成功后直接打开现有生成流程；失败时保留输入并展示可重试错误。
- 粘贴模式创建文章后保留该文章 ID。用户关闭生成弹窗时后台任务继续，入口按钮切换为“查看生成进度”，再次点击恢复同一 Storycard、模板和 PPT 生成会话，不重复创建文章或任务。

视觉继续使用现有 JoyfulWords 工具箱变量、边框、按钮和两栏布局，不引入新的设计语言。

## 7. 实施范围

### 7.1 前端

- `components/file-converter/file-converter-page-content.tsx`
  - 新增 `toolbox` 变体和初始转换模式，保留 `page` 和 `studio` 行为。
- `components/file-converter/toolbox-file-converter-page-content.tsx`
  - 读取登录态，构造回跳登录链接，并承接 Markdown/PPT 两种独立模式。
- `components/tools/toolbox-ppt-generator.tsx`
  - 登录态支持粘贴内容或选择可用文章，统一复用现有 `PresentationFlowDialog`。
- `components/tools/tools-page-content.tsx`
  - 3 个文档入口改用真实工作台，并统一标记可用。
- `lib/tools/catalog.ts`
  - 集中维护已发布工具状态，避免目录标签与详情能力不一致。
- `lib/api/file-converter/client.ts`
  - 保留游客 Cookie 请求；解析 `reason/action/feature/limit_type`。
- `lib/i18n/locales/zh.ts`、`en.ts`
  - 同步工具箱、游客和额度错误文案。
- `lib/api/file-converter/client.test.ts`
  - 覆盖匿名 Cookie 流、模板列表和额度错误协议。

`components/article/editor-ai-panel.tsx` 不在本次差异中，确保原入口未被删除或改写。

### 7.2 后端

- 文档转换 Handler 注入现有 Guest quota service。
- 三个转换入口在有效请求开始昂贵工作前预占额度。
- 增加结构化、可本地化的额度错误响应。
- 增加额度单元测试和 `internal/server/document_converter/API.md`。

## 8. 验收标准

### 8.1 原功能回归

- [ ] 文章编辑器继续显示“转 Word”卡片。
- [ ] 点击后自动带入当前标题和 Markdown。
- [ ] 原模板、生成、预览、下载流程不变。
- [ ] 文章编辑器原 PPT 生成入口和流程不变。
- [ ] `editor-ai-panel.tsx` 相对最新 `main` 无差异。

### 8.2 工具箱

- [ ] 中英文工具目录均显示 PPT 生成、Markdown 转 Word、PPT 转 Word 为可用。
- [ ] Markdown/PPT 转 Word 详情页分别进入正确的固定转换模式。
- [ ] PPT 生成游客态显示登录入口，登录态可粘贴内容或选择文章并打开原生成流程。
- [ ] 粘贴内容生成时创建一篇新文章，标题为空则取正文首行，保存失败不清空用户输入。
- [ ] 游客状态、登录状态和检查状态正确。
- [ ] 游客可列出公共模板，完成 Markdown/PPT 转 Word 并下载。
- [ ] 游客看不到可提交的个人模板上传表单。
- [ ] 登录后可上传个人模板。
- [ ] 额度耗尽显示专用本地化提示，而不是普通请求失败。

### 8.3 工程

- [ ] 前端 lint、TypeScript、目标测试和 production build 通过。
- [ ] 后端 document converter、guest 和 server 测试通过。
- [ ] `git diff --check` 通过。
- [ ] 前后端分支均直接基于执行时最新 `origin/main`。

## 9. 风险与回滚

| 风险 | 控制措施 |
| --- | --- |
| 共享组件改动回归文章导出 | 变体隔离；编辑器文件零差异；回归检查 `studio` 参数 |
| 无效请求消耗游客额度 | 后端在参数、模板、文件校验后才预占 |
| 所有 401 都被前端误报未登录 | 保留并优先解析额度 `reason` |
| 游客误以为能上传个人模板 | 工具箱游客态用登录说明替代上传表单 |
| 前后端发布顺序不一致 | 前端对普通 401 保持登录兜底；后端上线后自动启用精确额度提示 |

回滚时可分别回滚前端工具箱包装/变体和后端额度注入；文章编辑器原功能不依赖新增工具箱变体。
