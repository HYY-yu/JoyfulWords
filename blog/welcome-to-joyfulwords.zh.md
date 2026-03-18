---
title: "欢迎来到 JoyfulWords 博客"
date: "2026-03-18"
summary: "这是博客模块的首篇中文示例文章，用来验证 Markdown 目录驱动发布链路。"
locale: "zh"
---

# 欢迎来到 JoyfulWords 博客

这个博客模块现在会自动读取项目根目录下的 Markdown 文件，并把它们渲染成文章页。

## 你可以怎么用

- 新建一个 `post-slug.zh.md`
- 再补一个 `post-slug.en.md`
- 提交代码并走 CI/CD
- 新文章就会出现在 `/blog`

> 当前版本只做最轻量的目录驱动发布，不引入 CMS，也不接数据库。

## Frontmatter 约定

每篇文章需要在顶部提供这几个字段：

- `title`
- `date`
- `summary`
- `locale`

后面如果你要继续扩展标签、封面、作者，也可以在这个基础上往前兼容。
