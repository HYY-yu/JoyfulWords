import palettes from "./design/catalog-palettes.fixture.json"
import type { ArticleThemeDesign } from "./design/article-design"
import assert from "node:assert/strict"
import test from "node:test"
import { DEFAULT_WECHAT_MARKDOWN_EXPORT_OPTIONS, renderWeChatMarkdown } from "./wechat-markdown-export"

const article = `# 标题 Title

正文 **重点** 和 [来源](https://example.com)。

## 二级标题

### 三级标题

> 引用内容

- 列表内容

![图片说明](https://example.com/image.png)

| 指标 | 数值 |
| --- | --- |
| 阅读 | 42 |

\`\`\`ts
const value = 1 < 2
\`\`\`
`

test("all 30 existing catalog combinations preserve content and use inherited colors", () => {
  assert.equal(palettes.length, 30)
  const outputs = new Set<string>()
  for (const palette of palettes) {
    const design: ArticleThemeDesign = {
      style: { id: 1, slug: palette.slug, name: { zh: "", en: "" }, description: { zh: "", en: "" }, recommended_scene: "work-report", version: 1 },
      palette: { ...palette, id: 1, style_id: 1, color_family_id: 1, version: 1, chart: [] },
    }
    const before = JSON.stringify(design)
    const result = renderWeChatMarkdown(article, DEFAULT_WECHAT_MARKDOWN_EXPORT_OPTIONS, design)
    outputs.add(result.html)
    for (const content of ["标题 Title", "二级标题", "三级标题", "引用内容", "列表内容", "图片说明", "指标", "42"]) {
      assert.ok(result.plainText.includes(content), `${palette.slug}/${palette.family}: missing ${content}`)
    }
    for (const color of [palette.primary, palette.background, palette.surface, palette.text, palette.muted_text, palette.border, palette.on_primary]) {
      assert.ok(result.html.includes(color), `${palette.slug}/${palette.family}: missing ${color}`)
    }
    assert.match(result.html, /<table[^>]*style=/)
    assert.match(result.html, /const&nbsp;value&nbsp;=&nbsp;1&nbsp;&lt;&nbsp;2/)
    assert.doesNotMatch(result.html, /class=|<style/)
    assert.equal(JSON.stringify(design), before)
    assert.ok(result.wordCount > 0)
  }
  assert.equal(outputs.size, 30)
})

test("unset design uses the same catalog default as charts", () => {
  const result = renderWeChatMarkdown(article, DEFAULT_WECHAT_MARKDOWN_EXPORT_OPTIONS)
  assert.match(result.html, /#176B50/)
  assert.match(result.html, /#F4F8F6/)
})

test("caption and link options remain independent of the preset", () => {
  const markdown = '![caption](https://example.com/image.png "image title")\n\n[Source](https://example.com)'
  const result = renderWeChatMarkdown(markdown, { ...DEFAULT_WECHAT_MARKDOWN_EXPORT_OPTIONS, imageCaption: "none", citeLinks: false })
  assert.doesNotMatch(result.html, /<figcaption|<sup/)
  assert.match(result.html, /<img/)
  assert.match(result.html, /Source/)
})
