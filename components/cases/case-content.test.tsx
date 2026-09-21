import assert from "node:assert/strict"
import test from "node:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { CaseContent } from "./case-content"

function render(content: string) {
  return renderToStaticMarkup(createElement(CaseContent, { content }))
}

test("Markdown autolinks do not turn a document into HTML", () => {
  const html = render("# Heading\n\nRead <https://example.com/report>.\n\n- Evidence")
  assert.match(html, /<h1>Heading<\/h1>/)
  assert.match(html, /href="https:\/\/example.com\/report"/)
  assert.match(html, /<li>Evidence<\/li>/)
})

test("Markdown snapshots use the same external URL boundary as HTML snapshots", () => {
  const html = render("[Private](/articles/secret) [Credential](https://user:pass@example.com) ![Private image](/private/image.png) [Safe](https://example.com)")
  assert.doesNotMatch(html, /href="\/articles|src="\/private|user:pass/)
  assert.match(html, /href="https:\/\/example.com\/" target="_blank" rel="noopener noreferrer"/)
})

test("inline raw HTML does not discard surrounding Markdown or expose event handlers", () => {
  const html = render("# Heading\n\nText <img src=x onerror=alert(1)> **strong**")
  assert.match(html, /<h1>Heading<\/h1>/)
  assert.match(html, /<strong>strong<\/strong>/)
  assert.doesNotMatch(html, /onerror|src="x"/)
})
