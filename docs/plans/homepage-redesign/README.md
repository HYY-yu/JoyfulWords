# 首页改版 · 原型定稿与实现说明

> 定稿日期：2026-07-11。本目录是首页改版的**实现基准**，配套设计方案见 `../2026-07-11-homepage-redesign-plan.md`。

## 文件

| 文件 | 说明 |
|------|------|
| `home-desktop.html` | 桌面端高保真原型（1440px），浏览器直接打开即可查看 |
| `home-mobile.html` | 移动端高保真原型（390px） |

原型中每个区块左上角有黑色标注牌（`S1 · 是什么 · HERO` 等），与方案文档的分区编号一一对应。带播放按钮的卡片是 **Hyperframes 视频占位**，右下角标注了目标文件名与时长（如 `feature-article-zh.mp4 · 6–8s 循环`）；实现时先用占位卡中的静态假 UI 作为 poster 占位，视频由独立工程制作后放入 `public/videos/landing/`。

## 页面结构（三段式叙事）

1. **S1 Hero（是什么）**：主标题「一个想法，生成文章、信息图、PPT 和思维导图」；主 CTA「免费开始创作 · 注册送 200 积分」；次 CTA「看 60 秒演示 ▶」；右侧 Hero 视频位。
2. **S2 四步工作流（是什么）**：快速找寻素材 → 梳理大纲 → 生成成稿 → 一键多态导出。
3. **S3 四大生成能力（有什么）**：快速生成文章 / 生成信息图 / 生成 PPT / 生成思维导图，左右交替，每个配视频位 + 3 个要点 + 功能入口链接。
4. **S4 效果区（带来什么效果，效率叙事）**：效率数字带（1 个平台 / 0 复制粘贴 / 1→4 / 秒级）→ 效率支柱一「找素材、创作不用切换平台」（Before/After 视频位）→ 效率支柱二「一篇文章，转换成多种产物」（转换图示）→ 3 张场景卡。
5. **S5 FAQ**：首条含「注册送 200 积分 / 按量付费、积分随内容难度动态计算」定价说明（注意：积分消耗是动态的，不得写固定单价），输出 FAQPage JSON-LD。
6. **S6 Final CTA**：单按钮收敛版色块。
7. **S7 Footer**：产品 / 资源 / 法律三列内链（用 `buildLocalizedPath(locale, path)` 生成 locale 链接）。

## 实现要求（务必遵守）

- 入口：`app/[locale]/page.tsx` → `components/home/home-page-content.tsx`；按方案 §6.1 拆分为 `components/home/sections/*`，**新组件一律单实现 + Tailwind 响应式**，逐步替换旧的 `MobileHomeExperience` / `MobileHomeFeatures` 双实现。
- 样式：使用现有 `--jw-*` CSS 变量（原型按 blue-white 主题绘制），**不要硬编码色值**，保证 paper / black-gold 主题自动适配。
- i18n：所有文案走 `useTranslation()`，key 方案见设计文档 §6.3；`lib/i18n/locales/zh.ts` 与 `en.ts` **必须同批新增**。功能 key 使用 `landing.features.{article,infographic,ppt,mindmap}`。
- 视频组件：`components/home/sections/feature-video.tsx`，要求 `muted loop playsInline preload="none"` + poster + IntersectionObserver 进出视口播放/暂停 + `prefers-reduced-motion` 降级 + `onError` 降级为 poster 图（视频缺失不能破坏页面）。视频文件名按 locale 拼接 `-zh` / `-en` 后缀。
- SEO：更新 `generateMetadata` 描述与新 Hero 对齐；FAQ 输出 JSON-LD；不改路由与 hreflang。
- 埋点：按设计文档 §6.6 增加 PostHog 事件。
- 验收：`pnpm lint` 通过；zh/en 无缺 key；375px 无横向滚动；Hero 之外资源不参与首屏加载。
