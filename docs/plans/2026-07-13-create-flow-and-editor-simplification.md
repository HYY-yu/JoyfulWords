# 新建文章交互改造 + 编辑页心智成本审查

> 日期：2026-07-13
> 状态：批次 A 已完成（2026-07-13）；批次 B-E 待排期
> 关联页面：`/articles`（文章管理）、`/articles/[id]/edit`（编辑页）

---

## 一、新建文章交互改造

### 1.1 现状链路（问题）

```
「+ 新文章」→ 弹窗「选择创建方式」（创建新文章 / AI 帮写 二选一）
              ├─ 创建新文章 → POST 建空稿 → 跳 /articles/{id}/edit
              └─ AI 帮写   → 打开大表单弹窗（需求/风格/素材三件套）→ 提交后生成异步任务
```

问题：用户还没见过产品，第一步就被迫做「手动 vs AI」的策略选择（`components/article/article-create-mode-dialog.tsx`，调用于 `app/articles/page.tsx:856-862`）。此时用户既不知道 AI 帮写是什么、也不知道编辑器长什么样，属于**在信息最少的时刻做最大的决定**。

### 1.2 目标链路（定稿方向）

```
「+ 新文章」→ 直接建空稿 → 进入编辑器
              编辑器内（正文为空时）出现「AI 帮写」引导 → 用户自己决定
```

- 复用现有 `handleCreateManualArticle`（`app/articles/page.tsx:307-355`，本来就是建空稿+跳转），只是跳过弹窗直接调用；
- `ArticleCreateModeDialog` 组件下线删除；
- AI 帮写弹窗（`ArticleAIHelpDialog`）保留，入口移到编辑器内引导卡 + 右侧面板「AI 写作」按钮（已存在）。

### 1.3 编辑器内 AI 帮写引导设计

**推荐：空稿内嵌引导卡（第一期）**

正文为空时，编辑区 placeholder 下方渲染一张轻量引导卡：

```
┌────────────────────────────────────────────┐
│ ✨ 不知道从哪开始？                           │
│ 告诉 AI 你的选题和风格，先生成一版可编辑的初稿。 │
│ [ 让 AI 帮我写初稿 ]     直接开始写 ↵         │
└────────────────────────────────────────────┘
```

- 点主按钮 → 打开现有 `ArticleAIHelpDialog`（带当前 articleId）；
- 用户开始输入正文/点「直接开始写」→ 卡片消失；本次会话不再出现；
- 出现条件：`content` 为空（不做"仅首次"限制——空稿场景本来就该有引导，成本为零）。

**第二期（可选）：引导卡内嵌 15s Hyperframes 演示视频**

复用视频工程制作一条 `guide-ai-write-{zh,en}.mp4`（展示：填需求 → 选风格 → 任务生成 → 草稿出现），嵌在引导卡里点击播放。制作与托管走既有链路（R2 `home/video/`）。先上第一期看数据，`article_create_started → ai_write_submitted` 转化率不达预期再上视频。

**配套修正**：空稿场景从引导卡进入 AI 帮写时，跳过"覆盖正文"确认框（正文为空没有可覆盖的东西）——在 `article-ai-help-dialog.tsx` 的覆盖确认前加"正文非空"判断。

### 1.4 技术改动点

| # | 改动 | 文件 |
|---|------|------|
| 1 | 「新文章」onClick 直接调 `handleCreateManualArticle` | app/articles/page.tsx:605 |
| 2 | 移除 `ArticleCreateModeDialog` 引用与组件文件 | app/articles/page.tsx、article-create-mode-dialog.tsx |
| 3 | 列表页 `ArticleAIHelpDialog` 保留（供其他入口），或一并收敛 | app/articles/page.tsx:864-868 |
| 4 | 新建 `EmptyDraftAIGuide` 引导卡组件，编辑页正文为空时渲染 | components/article/ 新文件 + tiptap-editor 或 layout 接入 |
| 5 | 覆盖确认加"正文非空"前置条件 | article-ai-help-dialog.tsx |
| 6 | i18n：引导卡文案 zh/en 同批 | locales |
| 7 | 埋点：`article_create_started` 移除 mode 维度或恒为 direct；新增 `editor_ai_guide_shown / clicked / dismissed` | lib/analytics/events.ts |
| 8 | 创建方式弹窗相关 i18n（createModeDialog.*）确认无引用后清理；「AI 帮写」演示视频（feature-article）脚本中的"选择创建方式"场景后续重渲染更新 | locales、视频工程 |

---

## 二、编辑页心智成本审查（Top 10）

> 完整依据均已核对代码（文件:行号）。按对新用户的杀伤力排序。

| # | 问题 | 位置 | 改进建议 |
|---|------|------|----------|
| 1 | **「线索白板」系列自造概念且命名不统一**：白板/线索白板/素材线索白板/展开白板/打开线索白板深度探索 五种说法并存，点开是毫无预期的全屏画布；搜索空状态一进来就抛这个概念 | zh.ts:558-564、editor-material-panel.tsx:493-545,668-703 | 统一为动作式命名（如「顺着线索继续搜」），首用加一句说明；从空状态移除，改为搜索出结果后再出现 |
| 2 | **三栏零引导空屏**：新建空稿进入后同时面对素材管理器+空编辑器+AI 功能网格，无任何"从这里开始" | app/articles/[id]/edit/page.tsx:423-450 | §1.3 的空稿引导卡即为解法（一并解决） |
| 3 | **「发布」名实不符**：仅把 status 从 draft 改 published，不产生任何对外可访问的页面/链接，用户预期完全落空 | page.tsx:252-300、editor-top-bar.tsx:373-398 | 改名「标记为已发布」，或点击后明确告知"文章已归档为已发布状态" |
| 4 | **AI 改写无就近入口**：选中文字后没有浮动菜单/右键项，必须移到右侧面板点「AI 编辑」，未选中还会报错 | tiptap-editor.tsx:705-736（仅 link/image 有浮层 :963-970） | 选中文本时显示 BubbleMenu，内置「AI 改写」等高频动作 |
| 5 | **两种"保存"并存无解释**：后台 3 秒自动保存（page.tsx:57-67），顶栏「保存」实为"存为新版本"（editor-top-bar.tsx:199），用户不知道改动存没存 | 同左 | 顶栏常驻「已自动保存 HH:mm」状态文案；按钮改名「存为版本」 |
| 6 | **无可见字数统计**：`wordCount` 已计算（lib/editor-state.ts:129）但界面任何地方不显示 | tiptap-editor/工具栏 | 编辑器右下角常驻字数 |
| 7 | **素材分类三套体系不一致**：搜索子tab（资料/新闻/图片）、素材库子tab（同名异义）、上传类型（只有资料/图片，缺新闻）；外加「全局收藏」做成 TabsList 外的孤立心形图标，不像第三个视图 | editor-material-panel.tsx:2044-2081,2219-2274,2454-2468 | 统一类型体系；收藏并入 TabsList 成为显式第三 tab |
| 8 | **工程术语直接面向写作者**：「结构化输出」「任务进度/任务中心」不解释就不知所云 | zh.ts:1672,1701 | 「结构化输出」→「转换导出」；任务区首条空状态加一句"AI 生成都在这里排队与完成" |
| 9 | **顶栏图标语义弱**：保存版本用 BookLock（书+锁）、版本历史用 GitBranch（分叉）、面包屑"Article Canvas"是未翻译的英文自造词 | editor-top-bar.tsx:186,244,334 | 换 History/存档类图标+文字；删除或翻译 Article Canvas |
| 10 | **素材复选框选中后出口弱**：导入是纯图标 Inbox 按钮、无"已选 N 项"计数、与删除/查看来源挤在一起 | editor-material-panel.tsx:824-833 | 改为「导入 N 项」文字主按钮，贴近选区 |

**附带代码级问题**（用户不直接感知，顺手修）：
- 删除线快捷键误标为 `⌘S`（与保存冲突），tiptap-toolbar.tsx:117；
- 链接/图片插入用原生 `window.prompt`（tiptap-toolbar.tsx:52-56,250-255），与整体 UI 断裂；
- 编辑页 `mode` 恒为 "edit"（page.tsx:433），tiptap-editor 里大量 `mode==="create"` 分支实际不可达，属死代码概念；
- 主题切换（蓝白/黑金/纸感）占据写作顶栏高频位，属低频功能，建议降权。

### 高危自造概念清单（第一次见即无法理解）

线索白板（含 4 种变体）· 结构化输出 · Article Canvas · 发布（名实不符）· 全局收藏（"全局"相对什么不明）· AI 编辑 vs AI 写作（区别不明）

---

## 三、建议执行批次

**批次 A ✅ 已完成（2026-07-13）**：
- 「新文章」直调建稿并跳编辑器，`ArticleCreateModeDialog` 组件删除，列表页 AI 帮写弹窗一并收敛（编辑器内唯一入口）
- ~~横幅引导卡~~ → **悬浮指引（2026-07-13 两轮迭代定稿）**：正文为空时，引导卡浮在**面板左侧的编辑区留白**上（动态测量按钮到面板左缘的距离作偏移，不遮挡任何功能卡），箭头指向「AI 写作」按钮；带两个动效——卡片朝按钮方向轻推呼吸（jw-guide-nudge）+ 按钮外圈脉冲光环（jw-guide-pulse），reduced-motion 下自动关闭；锚点滚出面板可视区时 `hideWhenDetached` 自动隐藏（修复滑动后悬浮卡漂到顶栏的 bug）；点按钮/关闭后 sessionStorage 记忆本会话不再出现（editor-ai-panel.tsx + edit/page.tsx + globals.css）
- 覆盖确认增加 `getArticleHasContent` 前置：空稿直接放行，非空才确认
- 埋点：`editor_ai_guide_shown / click / dismiss`；创建事件 mode 改为 "direct"
- i18n：`contentWriting.emptyDraftGuide.*` 中英同批；`createModeDialog` 仅保留仍被建稿流程引用的 3 个 key
**批次 B（文案与命名，~0.5 天）**：Top10 #1/#3/#8/#9 的命名与文案修正（纯 i18n + 图标替换，风险低）
**批次 C（编辑器体验，~1-2 天）**：#4 选中浮层 AI 改写、#5 保存状态显性化、#6 字数统计、⌘S 快捷键修正
**批次 D（素材面板重构，~2 天）**：#7/#10 分类体系统一与选中出口，涉及 2500 行大组件，单独排期
**批次 E（可选）**：引导视频制作 + 接入

## 四、验收指标

- 新建到开始输入的时间（埋点 `article_created → 首次 keystroke`）应显著缩短；
- `editor_ai_guide_clicked / article_created` 转化率 ≥ 原弹窗里 AI 帮写的选择率（弹窗时代的基线可从 `article_create_started{mode}` 历史数据取）；
- 引导卡 dismiss 后不再打扰（会话内不复现）。
