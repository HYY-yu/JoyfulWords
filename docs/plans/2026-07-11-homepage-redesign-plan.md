# 首页改造方案：三段式叙事 + Hyperframes 功能视频

> 日期：2026-07-11
> 状态：**已实施上线（2026-07-12）**。决策记录：① 功能区按「快速生成文章 / 生成信息图 / 生成 PPT / 生成思维导图」四大能力写；② mp4 缓存头已补齐；③ 注册送积分：初定 3000，2026-07-12 调整为 **200 积分**；④ 2026-07-12 积分表述改为动态计费口径（见 §4.4 修正说明）
> 涉及页面：`https://joyword.link/zh`（`app/[locale]/page.tsx` → `components/home/home-page-content.tsx`）

---

## 一、背景与目标

当前首页视觉完成度较高（衬线大标题、飞升学者 sprite、CTA 展示卡），但**叙事结构不清晰**：访客从上往下滑，很难在 10 秒内回答三个问题——

1. **这是什么网站？**（What）
2. **它有什么功能？**（Features）
3. **用了它我能得到什么？**(Outcome)

本次改造目标：

- 将首页信息架构重组为「**是什么 → 有什么 → 带来什么效果**」三段式叙事；
- 使用 **HeyGen Hyperframes**（HTML/CSS/JS 写视频、渲染为 MP4 的开源框架）为核心功能制作演示视频，替代现在纯静态的功能文字区；
- 不推翻现有设计语言（纸感配色、衬线标题、`--jw-*` CSS 变量体系），在其之上做结构性升级。

---

## 二、现状诊断

### 2.1 当前页面结构（代码梳理）

`components/home/home-page-content.tsx`（728 行）目前的分区：

| # | 区块 | 内容 | 问题 |
|---|------|------|------|
| 1 | Hero | 标题「让你的灵感/更快更好地/孕育成稿」+ 描述 + 双 CTA + 3 个统计数字 + 右侧「创作工作台」模拟卡片 | 标题偏抒情，**没有说清楚"这是一个什么产品"**；统计数字（10×/6合1/实时）缺乏支撑，说服力弱 |
| 2 | Features（#features） | 6 个功能纯文字滚动展示（超大序号 + 标题 + 一句描述），配 sprite 跳跃动画 | 只有文字和图标，**看不到产品长什么样**；每屏信息密度低（一个功能占近一屏），滑完 6 个功能成本高 |
| 3 | CTA band（#start-writing） | 「开始你的第一篇文章」+ 模拟进度卡 | 与 Hero 的 CTA 高度重复，且中间**缺失"效果/证明"层**，转化理由不足 |
| 4 | Footer | logo + 隐私/条款 + 版本号 | 过于单薄，缺少产品导航（价格、博客、免费工具都有独立页面但页脚没有入口） |

### 2.2 关键问题清单

1. **叙事断层**：Hero（情绪）→ Features（罗列）→ CTA（行动），缺少「为什么值得用」的证据层（效果、成本、对比、场景）。
2. **无产品实感**：全页没有一张真实产品截图或演示视频，右侧"工作台卡片"是抽象模拟，访客无法建立"用起来是什么样"的预期。
3. **移动端/桌面端双实现**：`MobileHomeExperience`/`MobileHomeFeatures` 与桌面版是两套 JSX，文案 key 复用但结构重复，后续每次改版都要改两处（本次改造建议一并收敛，见 §6.4）。
4. **文案 key 与实际功能错位**（历史遗留）：`landing.features.seoGeo` 的中文文案已改成「自动 PPT 生成」、`competitors` 已改成「任务中心」，但 key 名未变；且 `docs/architecture/key-patterns.md` 标注 image-generation / knowledge-cards / seo-geo 模块含 mock 数据未达生产状态——**首页宣传的功能与实际可用功能需要对齐**（见 §8.2 风险）。
5. **页脚信息不足**：`/pricing`、`/blog`、`/tools`、`/file-converter`、`/mcp` 都是已上线的 SEO 页面，页脚没有内链，浪费权重传递。

### 2.3 可用的真实卖点（来自代码与价格页）

改造"效果层"时可以直接引用的**真实**数据（来自 `lib/i18n/locales/zh.ts` pricing 部分）：

- 按量付费，**0 订阅费**，积分随内容难度动态消耗；
- 写一篇优质文章约 **20–80 积分**（≈ ¥1.5–6）；
- 文章、信息图、PPT、思维导图均按实际消耗计费，用多少花多少；
- 生图单张 3.5–10 积分；
- 素材、写作、配图、PPT、任务中心在**同一工作流**内完成，无需在多个工具间粘贴。

---

## 三、新信息架构（三段式叙事）

```
┌─────────────────────────────────────────────┐
│ S0 LandingHeader（保持现状，微调锚点）           │
├─────────────────────────────────────────────┤
│ S1 Hero —— 「是什么」                          │
│    一句话定位 + 副标题 + CTA                    │
│    ⬇ 右侧/下方：Hero 总览视频（Hyperframes）     │
├─────────────────────────────────────────────┤
│ S2 How it works —— 「是什么」的补充             │
│    4 步工作流：快速找寻素材→梳理大纲→生成成稿→多态导出│
├─────────────────────────────────────────────┤
│ S3 Features —— 「有什么」                      │
│    4 大生成能力 = 文案 + 各自的功能演示视频        │
│    （视频左右交替排布，替代现在的纯文字滚动）       │
├─────────────────────────────────────────────┤
│ S4 Outcomes —— 「带来什么效果」 ★ 全新区块       │
│    效果数字 + 成本对账卡 + 3 个使用场景           │
├─────────────────────────────────────────────┤
│ S5 FAQ（可选，利好 SEO）                       │
├─────────────────────────────────────────────┤
│ S6 Final CTA（收敛现有 CTA band）              │
├─────────────────────────────────────────────┤
│ S7 Footer（扩充产品/资源内链）                   │
└─────────────────────────────────────────────┘
```

三段式与区块的对应关系：**是什么 = S1+S2；有什么 = S3；带来什么效果 = S4**。S5–S7 服务转化与 SEO。

---

## 四、分区详细设计（含文案初稿）

> 所有文案需同时写入 `lib/i18n/locales/zh.ts` 与 `en.ts`（项目规则：两个文件必须同步加 key）。以下给出中文初稿，英文翻译在实施时补齐。

### S1 Hero ——「是什么」

**目标**：3 秒内让访客知道这是「一个把 AI 写作、配图、素材、PPT 串起来的内容创作工作台」。

**布局**：保留现有左文右卡的栅格，但右侧「模拟工作台卡片」替换为 **Hero 总览视频**（`hero-overview.mp4`，见 §5），带浏览器窗口样式外框（沿用 `jw-workspace-card` 卡片样式即可）。

**文案初稿**：

| 元素 | 现文案 | 建议文案 | 理由 |
|------|--------|----------|------|
| badge | AI 内容创作工作台 | AI 内容创作工作台（保留） | 定位准确 |
| 主标题 | 让你的灵感/更快更好地/孕育成稿 | 一个想法，**生成文章、信息图、PPT 和思维导图** | 从"抒情"改为"结果承诺"，直接点出四大产出，回答"是什么" |
| 副标题 | 在 JoyfulWords 里收集灵感、整理素材…… | JoyfulWords 是 AI 内容创作工作台：快速找寻素材、生成成稿，再一键把文章转换成信息图、演示 PPT 和思维导图——一个工作流，四种产出。 | 一句话覆盖"是什么+有什么"总纲 |
| 主 CTA | 立即开始创作 | 免费开始创作 · 注册送 200 积分 | 降低行动门槛（量化注册即得的诚意） |
| 次 CTA | 查看我的文章 | 看 60 秒演示 ▶（锚点滚动到 Hero 视频/或打开视频弹层） | "查看我的文章"对新访客无意义 |
| 统计条 | 10× / 6合1 / 实时 | 改为可信版本：`0 订阅费`、`4 大生成能力 · 1 个工作流`、`按量计费（积分随内容难度动态消耗）` | 用真实计费模型替代无出处的 10× |

### S2 How it works ——「是什么」的具象化

**目标**：用一行四步说明产品的使用方式，承接 Hero。

复用现有 `workflowSteps`（collect/draft/visual/publish）的文案与图标，从"藏在 Hero 右侧卡片里"提升为**独立横向区块**：

```
① 快速找寻素材      ② 梳理大纲        ③ 生成成稿          ④ 一键多态导出
全网实时搜索入库 →  观点结构成型   →  正文流式生成      →  文章、信息图、PPT、导图就绪
```

（2026-07-11 定稿：第一步文案由「收集素材」改为「快速找寻素材」，突出全网实时搜索的速度感。）

- 桌面端：4 列卡片 + 连接箭头；移动端：竖排时间线。
- 每步可配一张小截图或 Hyperframes 渲染的单帧 poster（不必是视频，控制页面重量）。

### S3 Features ——「有什么」（视频化改造核心）

**目标**：每个功能"看得见"。将现有 6 个纯文字功能区收敛为**四大生成能力**（已定稿）：**快速生成文章、生成信息图、生成 PPT、生成思维导图**，改为「文案 + 视频」左右交替布局。四项均对应仓库中的真实模块（`app/articles` + Tiptap、`lib/api/infographics` + `components/tools/toolbox-infographic.tsx`、`lib/api/presentations`、`lib/mindmap` + mind-elixir），不存在宣传错位问题。

原 6 个功能中的「素材仓库」「任务中心」不再作为一级功能位，降级为 S2 工作流步骤和 S4 场景文案中的支撑元素（素材是"收集素材"步骤的主体，任务中心在 S4 场景中顺带露出）。

**布局**（桌面端，左右交替）：

```
┌──────────────────────┬──────────────────────┐
│ 01 快速生成文章        │ [feature-article.mp4]  │
│ eyebrow / 标题 / 描述  │  视频卡片（圆角+边框）    │
│ + 3 个要点 bullet     │  滚动进入视口后自动播放    │
│ + 「试试写作 →」链接    │                       │
├──────────────────────┼──────────────────────┤
│ [feature-infographic] │ 02 生成信息图           │
│                      │ …（03 PPT、04 思维导图   │
│                      │    继续左右交替）         │
└──────────────────────┴──────────────────────┘
```

**四大功能的视频与文案规划**（已定稿）：

| # | key | 标题 | 描述（初稿） | 视频文件 | 视频演示内容（脚本要点） |
|---|-----|------|--------------|----------|--------------------------|
| 01 | article | 快速生成文章 | 从一个选题出发，大纲、正文、配图一次生成结构完整的初稿，支持续写、改写、风格切换 | `feature-article.mp4` | 输入选题 → 大纲逐条展开 → 正文流式生成 → 选中段落改写 → 定格完整成稿 |
| 02 | infographic | 生成信息图 | 把文字要点一键转成可分享的信息图，长文拆解、数据表达、社媒分发都适用 | `feature-infographic.mp4` | 粘贴一段要点文字 → 选择风格模板 → 信息图逐块生长成形 → 下载分享 |
| 03 | ppt | 生成 PPT | 文章或大纲一键转为可演示的 PPT，汇报展示一步到位 | `feature-ppt.mp4` | 文章页点击"生成 PPT" → 页面骨架逐页翻动 → 主题样式切换 → 导出 |
| 04 | mindmap | 生成思维导图 | 复杂内容自动梳理成思维导图，结构一目了然，可继续编辑和导出 | `feature-mindmap.mp4` | 输入主题/导入文章 → 中心节点向外逐层展开 → 拖拽调整分支 → 导出图片 |

**交互规范**：

- 视频进入视口（`IntersectionObserver`，threshold 0.4）自动播放，离开暂停；
- `muted` + `loop` + `playsInline` + `preload="none"` + `poster`（必需，避免布局抖动与流量浪费）；
- `prefers-reduced-motion: reduce` 时不自动播放，仅显示 poster + 播放按钮；
- 每个功能块保留 `data-feature-key`，沿用现有 IntersectionObserver 结构即可；sprite 学者动画可保留（品牌记忆点），但建议缩小移动端干扰。

### S4 Outcomes ——「带来什么效果」（★ 全新）

**目标**（2026-07-11 定稿：改为**效率层面**叙事）：不讲成本数字，讲两个效率承诺——**找素材、创作不用切换平台**；**一篇文章直接转换成多种产物**。区块标题：「把创作时间，还给创作本身」。

**4.1 效率数字带**（4 个卡片）：

| 数字 | 说明文案 | 依据 |
|------|----------|------|
| 1 个平台 | 找素材、写作、配图、导出，全程不切换页面 | 产品事实 |
| 0 复制粘贴 | 素材搜到即插入文章，不再跨工具搬运 | 产品事实 |
| 1 → 4 | 一篇文章直接转出信息图、PPT、思维导图 | 产品事实 |
| 秒级 | 全网素材实时搜索，选题当场找到依据 | 素材搜索能力 |

**4.2 效率支柱一：不用切换平台找素材、创作**（左文右视频）：

```
以前：找素材开 3 个标签页，写作、做图各用一个工具，来回复制粘贴；素材存在收藏夹里，写的时候又找不到
现在：全网搜索、素材入库、引用成稿，都在同一个编辑页面里完成；素材点一下就进文章
```
（配 8–10 秒 Hyperframes 对比视频 `outcome-before-after.mp4`，左右分屏，见 §5 视频清单 #6。）

**4.3 效率支柱二：一篇文章，转换成多种产物**（左图右文，与 4.2 镜像排布）：

```
以前：同一个内容，做图、做 PPT、画导图要重做三遍
现在：写完文章，信息图、PPT、思维导图一键转换生成；一次创作沉淀为素材，下一篇继续复用
```
（视觉：「你的文章」卡片 → 三条箭头 → 信息图 / 演示 PPT / 思维导图卡片的转换图示，静态图或轻量动画均可。）

> 成本类数字不在 S4 展示。⚠ 2026-07-12 修正：积分消耗随内容难度**动态计算**，首页任何位置不得出现「1 积分」等固定单价承诺；定价细节一律由价格页承接。

**4.4 使用场景卡**（3 个，回答"谁在什么时候用"）：

1. **自媒体作者**：一天产出 2 篇图文并茂的公众号/博客文章；
2. **出海内容团队**：中英双语内容 + SEO 关键词一次完成；
3. **职场汇报**：把周报/文档一键转成 PPT 和思维导图，几分钟搞定一次演示。

**4.5 （可选）用户证言位**：预留结构，上线初期可先不放，避免伪造证言。

> **原型定稿**：本区块及全页的高保真原型见 `docs/plans/homepage-redesign/home-desktop.html`（1440px）与 `home-mobile.html`（390px），可直接在浏览器打开，作为实现基准。

### S5 FAQ（可选，建议做）

5–6 个问题，直接利好 SEO（配合 `FAQPage` 结构化数据）：

- JoyfulWords 是免费的吗？（注册送积分 + 按量付费说明）
- 和直接用 ChatGPT 写有什么区别？（工作流整合 + 素材沉淀 + 排版导出）
- 支持哪些导出格式？
- 生成的内容版权归谁？
- 支持团队协作吗？（如暂不支持，如实回答"规划中"）

### S6 Final CTA

收敛现有 `#start-writing` CTA band：保留品牌色块 + 一句话 + 单个主按钮，删除右侧模拟进度卡（S3 已有真实视频，模拟卡失去意义），整体高度减半。

文案：「**你的下一篇内容，从这里开始**」+「免费开始创作」。

### S7 Footer 扩充

三列结构：

| 产品 | 资源 | 法律 |
|------|------|------|
| 开始创作(/articles) | 博客(/{locale}/blog) | 隐私政策 |
| 价格(/{locale}/pricing) | 免费工具(/{locale}/tools) | 服务条款 |
| MCP(/{locale}/mcp) | 文件转换(/{locale}/file-converter) | Cookie 政策(/{locale}/cookie-policy) |

所有 `[locale]` 链接用 `buildLocalizedPath(locale, path)` 生成（现有 util）。

---

## 五、HeyGen Hyperframes 视频制作方案

### 5.1 工具认知

[Hyperframes](https://hyperframes.heygen.com/)（GitHub: `heygen-com/hyperframes`，Apache 2.0）：

- **原理**：用 HTML/CSS/JS 定义视频（data 属性声明时间轴与轨道，动画用 GSAP/CSS/Lottie/Three.js），无头 Chrome 逐帧渲染，FFmpeg 编码，**确定性输出 MP4**（同样输入永远得到同样视频）；
- **对本项目的天然优势**：首页视频可以**直接复用站点的 `--jw-*` CSS 变量、字体和组件样式**来搭"产品界面场景"，做出与站点视觉 100% 一致的演示动画——不需要录屏、不需要 AE；
- **环境要求**：Node.js 22+、FFmpeg；
- **Claude Code 集成**：`npx skills add heygen-com/hyperframes --full-depth --yes` 安装后可用 `/hyperframes` 路由技能 + 产品视频/解释器等 20 个工作流技能，即"让 Claude Code 按脚本写出视频 HTML 再渲染"。

### 5.2 制作工作流

```bash
# 0. 一次性：安装技能（团队各自机器执行）
npx skills add heygen-com/hyperframes --full-depth --yes

# 1. 在仓库外建视频工程（不进 JoyfulWords 主仓库，避免污染依赖）
npx hyperframes init joyword-landing-videos
cd joyword-landing-videos

# 2. 每支视频一个 HTML 组合；编写/让 Claude Code 按 §5.3 脚本生成
npx hyperframes preview    # 浏览器实时预览（就是网页，改 CSS 即所见即所得）
npx hyperframes render     # 渲染 MP4

# 3. 压缩 + 生成 poster
ffmpeg -i out.mp4 -vcodec libx264 -crf 28 -preset slow -movflags +faststart -an feature-article-zh.mp4
ffmpeg -i feature-article-zh.mp4 -vframes 1 -q:v 3 feature-article-zh-poster.jpg
```

建议把视频工程放独立仓库（如 `joyword-landing-videos`），HTML 源文件即"视频源码"，后续改文案/换色只需重渲染——这是 Hyperframes 相对录屏的最大优势（可版本管理、可参数化、中英文各渲染一版）。

### 5.3 视频清单与规格

**统一规格**：

| 项 | 规格 | 说明 |
|----|------|------|
| 格式 | MP4（H.264）+ `-movflags +faststart` | faststart 保证边下边播 |
| 音频 | 无（`-an`） | 首页静音自动播放，去掉音轨省体积 |
| 分辨率 | 功能视频 1280×800（16:10，接近产品界面比例）；Hero 1280×720 | 2x 屏也够清晰 |
| 帧率 | 30fps | |
| 时长 | 功能视频 6–8s 循环；Hero 15–20s | 循环无缝（首末帧一致） |
| 体积预算 | 单支 ≤ 1.2MB；Hero ≤ 2.5MB | crf 26–30 之间调 |
| Poster | 每支视频 1 张 jpg（≤60KB），取信息量最大一帧 | 必须有 |
| 双语 | 视频内出现的 UI 文字做 zh/en 两版（Hyperframes 源码里换字符串重渲染即可），文件名加后缀 `-zh`/`-en` | 按 locale 加载 |

**清单（6 支 × 2 语言 = 12 个文件）**：

| # | 文件名 | 用在 | 内容脚本 | 时长 |
|---|--------|------|----------|------|
| 1 | `hero-overview-{zh,en}.mp4` | S1 Hero | 品牌开场 1s → 一个选题依次生成四种产物（文章流式成稿 → 信息图成形 → PPT 翻页 → 思维导图展开）→ 定格四产物拼图 + logo | 15–20s |
| 2 | `feature-article-{zh,en}.mp4` | S3-01 | 见 §4 S3 表格 | 6–8s |
| 3 | `feature-infographic-{zh,en}.mp4` | S3-02 | 同上 | 6–8s |
| 4 | `feature-ppt-{zh,en}.mp4` | S3-03 | 同上 | 6–8s |
| 5 | `feature-mindmap-{zh,en}.mp4` | S3-04 | 同上 | 6–8s |
| 6 | `outcome-before-after-{zh,en}.mp4` | S4 对比 | 左右分屏：左侧多窗口来回粘贴（快进乱序感）；右侧 JoyfulWords 单页顺畅产出四种内容 | 8–10s |

**制作分期**：第一批只做 #1、#2、#4（Hero + 文章 + PPT，最强卖点），信息图/思维导图先用 poster 静态图占位，验证效果后补齐——避免一次性投入过大。

### 5.4 视频托管与加载

- **存放（2026-07-12 定稿）**：Cloudflare R2（bucket `joyful-words`），对外域名 `https://cdn.joyword.link/home/video/`，海报在 `.../posters/`。**不进 git 仓库**（曾导致 push 413）。代码中的基址常量：`components/home/sections/landing-media.ts`。上传时设置 `Cache-Control: public, max-age=604800, s-maxage=2592000`。走 CDN 也顺带规避了此前发现的"视频路径被登录鉴权 307 重定向"的问题（资源不再经过应用层）。
- **✅ 缓存头已补齐（2026-07-11）**：`next.config.mjs` 静态资源缓存规则已加入 `mp4|webm`，视频将命中 `PUBLIC_ASSET_CACHE_CONTROL`（max-age 7 天 / s-maxage 30 天）。
- **加载策略**：`preload="none"` + poster 首屏即显；Hero 视频可 `preload="metadata"`；全部懒加载（进入视口才 `video.play()`）。

---

## 六、技术实施方案

### 6.1 组件重构

把 728 行的 `home-page-content.tsx` 拆分为分区组件：

```
components/home/
├── home-page-content.tsx        # 只做组装（<Hero/><HowItWorks/>…）
├── landing-header.tsx           # 保持
└── sections/
    ├── hero-section.tsx         # S1
    ├── how-it-works-section.tsx # S2
    ├── features-section.tsx     # S3（含视频交替布局）
    ├── outcomes-section.tsx     # S4 ★新
    ├── faq-section.tsx          # S5 ★新
    ├── final-cta-section.tsx    # S6
    ├── landing-footer.tsx       # S7
    └── feature-video.tsx        # 通用视频组件 ★新
```

### 6.2 `FeatureVideo` 组件要点

```tsx
"use client"
// props: srcBase（不含语言后缀）、posterSrc、aria-label
// 内部逻辑：
// 1. useTranslation().locale 拼出 `${srcBase}-${locale}.mp4`
// 2. IntersectionObserver 控制 play()/pause()
// 3. matchMedia("(prefers-reduced-motion: reduce)") → 不自动播放，显示播放按钮
// 4. <video muted loop playsInline preload="none" poster={posterSrc}>
// 5. onError 时降级为 <Image poster>（视频 404 不能破坏首页）
```

### 6.3 i18n 变更（zh.ts / en.ts 同步）

- 修改：`landing.heading*`、`landing.description`、`landing.cta`（加"注册送 200 积分"）、`landing.viewArticles`（改为"看 60 秒演示"）、`landing.stats.*`（换真实数字）；
- 新增命名空间：`landing.outcomes.*`（数字带、对比、场景×3）、`landing.faq.*`（q1–q6）、`landing.footer.{product,resources,legal}.*`；
- 功能 key 重构（已定稿为四大能力）：新建 `landing.features.{article,infographic,ppt,mindmap}`，旧的 `aiWriting/materialSearch/imageGen/knowledgeCards/seoGeo/competitors` 六个 key 在首页下线后删除（先全局 grep 确认无其他页面引用）。
- 项目规则提醒：toast 不用动态字符串；两语言文件必须同批提交。

### 6.4 移动端实现收敛（建议，可后置）

现状 `MobileHomeExperience`/`MobileHomeFeatures` 与桌面版重复。本次改版新 section 组件一律**单实现 + 响应式**（Tailwind 断点），旧的移动端组件随分区替换逐步删除。若排期紧，Phase 1 可先只改桌面结构、移动端沿用，但新增 S4/S5 必须是单实现。

### 6.5 SEO 与结构化数据

- `generateMetadata` 的 description 与新 Hero 文案对齐；
- FAQ 区输出 `FAQPage` JSON-LD；
- Hero 视频可输出 `VideoObject` JSON-LD（name/description/thumbnailUrl/contentUrl），利于富媒体收录；
- 页面仍为静态渲染（`generateStaticParams` 已有），确认新组件不引入导致 SSR 失败的浏览器 API（IntersectionObserver 等都在 `useEffect` 内）。

### 6.6 数据埋点（PostHog）

新增事件，用于验证改版效果：

| 事件 | 触发 |
|------|------|
| `landing_hero_video_play` | Hero 视频开始播放 |
| `landing_feature_video_view` (`feature_key`) | 功能视频进入视口并播放 |
| `landing_demo_cta_click` | "看 60 秒演示"点击 |
| `landing_primary_cta_click` (`section`) | 各区主 CTA 点击（区分来源区块） |
| `landing_faq_expand` (`question_key`) | FAQ 展开 |

### 6.7 不受影响 / 需要顺带检查的点

- `proxy.ts` 与 `lib/auth/session-policy.ts`：首页本就是公开路由，无需变更；
- `next.config.mjs`：除 §5.4 的 mp4 缓存头外，`/:locale(zh|en)` 的 HTML 缓存（s-maxage=600）意味着**文案改动最长 10 分钟生效**，验收时注意；
- 无新增 `NEXT_PUBLIC_*` 变量则不动 Dockerfile.prod；若视频改走独立 CDN 域（如 `NEXT_PUBLIC_VIDEO_CDN`），**必须**同步 Dockerfile.prod 的 ARG/ENV 与 .drone.yml（项目 Critical Gotcha）。

---

## 七、分阶段执行计划

### Phase 0：内容与素材准备（不改代码）

- [x] 确定 S3 功能位：**快速生成文章 / 生成信息图 / 生成 PPT / 生成思维导图**（2026-07-11 定稿）
- [x] 确认注册赠送积分数额：**3000 积分**（2026-07-11 定稿；2026-07-12 调整为 **200 积分**）
- [x] 评审并定稿 §4 全部中文文案，翻译英文版（2026-07-12 已实施进 zh/en 语言文件）
- [x] 搭建 `joyword-landing-videos` 视频工程，安装 Hyperframes 技能（2026-07-12，独立目录 `~/joyword-landing-videos`）

### Phase 1：结构改版（纯代码，静态资源用占位图）

- [x] 拆分 section 组件（§6.1），组装新信息架构 S1–S7（2026-07-12 完成，`components/home/sections/`）
- [x] i18n 双语言文件新增/修改 key（§6.3）
- [x] `FeatureVideo` 组件（懒加载 + poster + reduced-motion + 404 降级）
- [x] Footer 扩充内链
- [x] FAQ + JSON-LD（`app/[locale]/page.tsx` 输出 FAQPage）
- [x] PostHog 埋点（5 个 landing_* 事件，`lib/analytics/events.ts`）
- [x] 验收：`pnpm lint` 通过；zh/en 无缺 key（Lighthouse 待生产环境复测）

### Phase 2：视频第一批（Hero + 文章 + PPT）

- [x] ~~第一批 3 支~~ **全部 6 支 × zh/en 共 12 条一次做完**（2026-07-12），单支 0.33–0.9MB 全部在预算内
- [x] 放入 `public/videos/landing/`，接入 `FeatureVideo`，中英页各引用对应语言版本（已验证）
- [x] `next.config.mjs` 增加 mp4/webm 缓存头（2026-07-11 已完成）
- [x] 验收：全部视频 `preload="none"` 懒加载，Range 请求 206 正常；reduced-motion 降级已实现

### Phase 3：视频补齐 + 迭代

- [x] ~~其余视频~~ 已并入 Phase 2 一次完成
- [ ] 观察 PostHog 数据 2 周：功能视频观看率、CTA 点击率对比改版前
- [ ] 根据数据调整 S3 功能排序与 S4 数字表达

---

## 八、风险与注意事项

### 8.1 性能风险

12 支视频总量 ≈ 15MB，但通过 `preload="none"` + 懒加载，**单个访客实际只下载滚动经过的视频**。红线：任何情况下 Hero 之外的视频不得参与首屏加载；每支视频渲染后必须核对体积 ≤ 预算。

### 8.2 功能宣传与实际能力错位（已解决）

~~`docs/architecture/key-patterns.md` 标注部分模块含 mock 数据。~~ **2026-07-11 已定稿**：首页只宣传四大真实生成能力（文章 / 信息图 / PPT / 思维导图），均有对应的生产模块（`app/articles`、`lib/api/infographics`、`lib/api/presentations`、`lib/mindmap`），原 mock 模块（知识卡片、SEO/GEO）不再出现在首页。实施时若发现四者中任一链路实际不可用，回到本节重新决策。

### 8.3 双语言维护成本

视频内嵌 UI 文字导致每支视频 ×2 渲染。缓解：视频 HTML 源码中把文字抽成变量，渲染脚本循环两种语言输出——Hyperframes 的"代码即视频"特性正好支持，一次编写两版产出。

### 8.4 Hyperframes 是新工具（已落地，附踩坑记录）

已完成 12 条视频制作。三条实战经验供后续维护参考：① **GSAP 等库必须 vendor 到本地**（`vendor/gsap.min.js`），CDN 引用在渲染沙箱中取不到会导致整条视频渲染成空白帧；② 渲染必须用 `--workers 1`，多 worker 有 detached-frame 竞态会随机崩溃；③ 视频台词是营销文案，不要把"画面须符合产品真实"之类的制作守则写进屏幕文字（曾出现"只提供真实的 XMind 导出"这类内部语言，已修正）。

### 8.5 SEO 波动

标题/描述大改会引起收录快照更新，属预期内。保持 URL、hreflang、canonical 不变（本方案不动路由），风险可控。

---

## 附录 A：现有文案 → 新文案 key 对照（实施时逐项勾对）

| key | 动作 |
|-----|------|
| `landing.heading` / `headingAccent` / `headingSuffix` | 改写 |
| `landing.description` | 改写 |
| `landing.viewArticles` | 改为 `landing.watchDemo`（新增，旧 key 保留给别处引用检查后删除） |
| `landing.cta` | 加「注册送 200 积分」 |
| `landing.stats.*` | 换真实数字 |
| `landing.features.*` | 重建为 `{article, infographic, ppt, mindmap}` 四个 key，旧 6 个 key 确认无引用后删除 |
| `landing.outcomes.*` | 新增 |
| `landing.faq.*` | 新增 |
| `landing.footer.*` | 扩充 |

## 附录 B：视频文件命名与目录

```
public/videos/landing/
├── hero-overview-zh.mp4 / -en.mp4
├── feature-article-zh.mp4 / -en.mp4
├── feature-infographic-zh.mp4 / -en.mp4
├── feature-ppt-zh.mp4 / -en.mp4
├── feature-mindmap-zh.mp4 / -en.mp4
├── outcome-before-after-zh.mp4 / -en.mp4
└── posters/
    └── <同名>.jpg
```
