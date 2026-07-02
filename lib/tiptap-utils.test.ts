import test from "node:test"
import assert from "node:assert/strict"

import {
  clipboardTableTextToHTML,
  detectContentFormat,
  parseMarkdownTableRows,
  parseTSVTableRows,
} from "@/lib/tiptap-utils"

test("detects markdown table content as markdown", () => {
  const markdown = [
    "| Name | Score |",
    "| --- | --- |",
    "| Alice | 10 |",
  ].join("\n")

  assert.equal(detectContentFormat(markdown), "markdown")
})

test("detects task list markdown as markdown", () => {
  assert.equal(detectContentFormat("[ ] Draft outline"), "markdown")
  assert.equal(detectContentFormat("[x] Publish article"), "markdown")
  assert.equal(detectContentFormat("- [ ] Review edits"), "markdown")
})

test("detects persisted HTML code blocks as html even when code text contains markdown markers", () => {
  const html = [
    "<p>Before</p>",
    "<pre><code># 角色",
    "",
    "### 执行原则",
    "",
    "1. 备份优先原则（Backup First）",
    "",
    "- **任何**修改前先备份。",
    "`cp /etc/nginx/nginx.conf /tmp/nginx.conf.bak`</code></pre>",
  ].join("\n")

  assert.equal(detectContentFormat(html), "html")
})

test("parses markdown table rows", () => {
  const markdown = [
    "| Name | Score |",
    "| --- | --- |",
    "| Alice | 10 |",
    "| Bob | 8 |",
  ].join("\n")

  assert.deepEqual(parseMarkdownTableRows(markdown), [
    ["Name", "Score"],
    ["Alice", "10"],
    ["Bob", "8"],
  ])
})

test("converts TSV clipboard text to table HTML", () => {
  const html = clipboardTableTextToHTML("Name\tScore\nAlice\t10")

  assert.equal(
    html,
    "<table><tbody><tr><td>Name</td><td>Score</td></tr><tr><td>Alice</td><td>10</td></tr></tbody></table>"
  )
})

test("escapes cell text when converting clipboard table text", () => {
  const html = clipboardTableTextToHTML("Name\tValue\nAlice\t<admin> & owner")

  assert.equal(
    html,
    "<table><tbody><tr><td>Name</td><td>Value</td></tr><tr><td>Alice</td><td>&lt;admin&gt; &amp; owner</td></tr></tbody></table>"
  )
})

test("does not treat ordinary text as a clipboard table", () => {
  assert.equal(clipboardTableTextToHTML("Name | Score\nAlice | 10"), null)
  assert.equal(parseTSVTableRows("just plain text"), null)
})

test("does not treat ragged TSV rows as a table", () => {
  assert.equal(parseTSVTableRows("Name\tScore\nAlice"), null)
})

test("preserves empty edge cells in TSV clipboard text", () => {
  assert.deepEqual(parseTSVTableRows("\tScore\nAlice\t"), [
    ["", "Score"],
    ["Alice", ""],
  ])
})
