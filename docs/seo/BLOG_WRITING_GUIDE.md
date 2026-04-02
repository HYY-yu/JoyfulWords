# Blog Writing Guide

本文件用于规范 JoyfulWords 博客的后续写作方向、文章结构、主题归类和发布标准。目标不是单纯“发文章”，而是持续建设可扩张的内容集群，让博客成为产品获客和教育用户的长期入口。

## 1. 博客定位

JoyfulWords 博客服务于以下目标：

- 获取与产品能力强相关的自然搜索流量
- 帮用户理解 AI 写作、SEO、配图、素材管理与正式发布工作流
- 让文章自然承接 JoyfulWords 的产品价值
- 逐步形成可扩张的主题集群，而不是零散文章堆积

博客不应写成：

- 泛流量杂志
- 只追热点的资讯流
- 与产品关系很弱的宽泛内容站

## 2. 当前主题导航

博客列表页当前按 5 个主题组织：

1. AI 写作
2. SEO 内容优化
3. 内容创作工作流
4. AI 配图
5. 素材管理与复用

新文章必须优先归入这 5 类之一。若确实出现新的稳定主题，再评估是否扩展导航。

当前归类规则不是 frontmatter，也不是关键词匹配，而是目录 + `DEFI.md`：

- `blog/ai-writing/` 下的文章自动进入 `AI 写作`
- `blog/seo-content/` 下的文章自动进入 `SEO 内容优化`
- `blog/content-workflow/` 下的文章自动进入 `内容创作工作流`
- `blog/ai-visuals/` 下的文章自动进入 `AI 配图`
- `blog/materials/` 下的文章自动进入 `素材管理与复用`
- 每个 topic 的名称、描述、顺序、空状态文案，都来自对应目录下的 `DEFI.md`

## 3. 选题判断标准

一篇文章值得写，至少应满足以下 3 条中的 2 条：

- 与 JoyfulWords 当前能力直接相关
- 能自然引出“写作 + 配图 + 素材 + SEO”的工作流价值
- 有明确搜索意图，适合用博客承接

应优先写的类型：

- how-to / tutorial
- best practices
- mistakes / pitfalls
- checklist
- workflow / use case
- comparison / alternatives
- templates / examples

不优先写的类型：

- 泛娱乐热点
- 与内容创作工作流弱相关的话题
- 很难自然承接产品价值的纯流量词
- 只适合社交传播、不适合长期沉淀的内容

## 4. 每篇文章开写前要先定的 7 个字段

写文章前，先在草稿里写清楚这 7 项：

1. 主关键词
2. 次关键词
3. 搜索意图
4. 目标读者
5. 所属主题
6. 关联产品能力
7. 目标 CTA

示例：

```md
主关键词: AI 写作工作流
次关键词: 博客写作流程, 正式发布内容, AI 内容创作工具
搜索意图: 想建立一套可持续使用的 AI 写作流程
目标读者: 独立创作者 / 内容营销负责人
所属主题: 内容创作工作流
关联产品能力: AI 写作, 素材管理, SEO 优化
目标 CTA: 用 JoyfulWords 把写作、配图和 SEO 放到同一工作流里
```

## 5. 推荐文章结构

每篇博客默认按下面结构写：

1. 标题
2. 摘要 / 导语
3. 问题定义
4. 方法或框架
5. 具体步骤 / 示例
6. 常见错误或注意事项
7. FAQ
8. 结尾总结
9. CTA

具体要求：

- H1 只保留一个
- 开头前 100 到 150 字直接回答核心问题
- H2/H3 结构清晰，不要大段无层次正文
- 尽量提供步骤、示例、对比或 checklist
- 文章结尾要有明确 CTA，但不要硬推

## 6. 产品提及原则

提到 JoyfulWords 时，遵守以下原则：

- 从真实创作场景切入，不要突然插广告
- 强调工作流价值，而不是单点生成能力
- 不夸张承诺，不写“自动搞定一切”
- 产品提及应与文章主题一致

推荐表达：

- 用 JoyfulWords 把写作、配图和 SEO 放到同一工作流里
- 用 JoyfulWords 管理素材并完成正式创作
- 用 JoyfulWords 更快产出可发布内容

不推荐表达：

- 最强 AI 工具
- 一键帮你搞定全部内容
- 秒杀所有写作软件

## 7. 内链规则

每篇文章发布前，至少检查以下内链：

- 链到 2 到 4 篇相关文章
- 如适合，链回博客主题页对应 section
- 如适合，链到首页或核心产品入口

内链优先顺序：

1. 同主题相关文章
2. 相邻工作流环节文章
3. 能承接转化的产品入口

## 8. CTA 规则

CTA 必须和搜索意图匹配。

常用 CTA 方向：

- AI 写作类：开始用 JoyfulWords 写第一篇文章
- 工作流类：把写作、配图和 SEO 放到同一工作流里
- 配图类：用 JoyfulWords 边写边补图
- SEO 类：用 JoyfulWords 产出更适合正式发布的内容
- 素材类：用 JoyfulWords 管理素材并复用到后续创作

## 9. 目录与 Frontmatter 规范

每篇博客必须放在对应 topic 目录下。目录结构示例：

```text
blog/
  ai-writing/
    DEFI.md
    ai-writing-workflow.zh.md
    ai-writing-workflow.en.md
  seo-content/
    DEFI.md
    seo-checklist.zh.md
    seo-checklist.en.md
```

目录名就是文章所属 topic，不再额外使用 `category` 字段。`DEFI.md` 负责定义这个 topic 在博客页上的展示方式。

`DEFI.md` 的建议格式：

```md
---
order: "10"
label_zh: "AI 写作"
label_en: "AI Writing"
description_zh: "这个主题讲什么"
description_en: "What this topic covers"
audience_hint_zh: "适合谁看"
audience_hint_en: "Who this topic is for"
empty_state_zh: "这个主题还没文章时显示什么"
empty_state_en: "What to show when this topic is empty"
---
```

当前最少需要：

```yaml
---
title: "文章标题"
date: "2026-03-31"
summary: "文章摘要"
locale: "zh"
---
```

建议后续可扩展字段：

```yaml
---
title: "文章标题"
date: "2026-03-31"
summary: "文章摘要"
locale: "zh"
keywords: "AI写作工作流,博客写作流程,正式发布内容"
author: "JoyfulWords Team"
draft: "false"
---
```

## 10. 发布前 Checklist

- 是否归入 5 个既有主题之一
- 是否有明确主关键词和搜索意图
- 是否能自然承接产品能力
- 是否有清晰的 H2/H3 结构
- 是否有 FAQ 或常见问题补充
- 是否有 2 到 4 个站内内链
- 是否有与文章意图匹配的 CTA
- 是否补全中英文版本
- 是否检查 title、summary、frontmatter

## 11. 第一批优先写的主题方向

建议按下面顺序继续写：

1. AI 写作如何用于正式博客创作
2. 什么是更适合正式发布的内容创作工作流
3. AI 写作如何服务 SEO，而不是制造空泛内容
4. 博客配图如何和正文协同
5. 素材库如何帮助长期内容生产

## 12. 维护规则

- 如果已有文章能更新解决问题，优先更新，不要重复开新文
- 同一主题至少连续写 3 篇以上，再切到下一个主题
- 博客列表页的主题导航必须长期稳定，避免频繁改分类
- 新增主题前，先确认已有 3 到 5 篇稳定内容需求
