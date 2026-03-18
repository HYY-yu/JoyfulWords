---
title: "Welcome to the JoyfulWords Blog"
date: "2026-03-18"
summary: "This is the first English sample post used to verify the Markdown-driven blog pipeline."
locale: "en"
---

# Welcome to the JoyfulWords Blog

This blog module now reads Markdown files from the project-level content directory and turns them into public articles.

## How to use it

- Create a `post-slug.zh.md`
- Add the paired `post-slug.en.md`
- Commit the files and let CI/CD deploy
- The new article will appear at `/blog`

> The current version is intentionally lightweight. No CMS, no database, and no admin upload flow.

## Frontmatter contract

Each post must define the following fields at the top:

- `title`
- `date`
- `summary`
- `locale`

You can extend this later with tags, cover images, or author fields without changing the core flow.
