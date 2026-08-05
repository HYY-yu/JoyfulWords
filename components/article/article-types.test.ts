import test from "node:test"
import assert from "node:assert/strict"

import { mergeTags, parseTags, stringifyTags } from "./article-types"

test("article tag helpers trim empty values and serialize consistently", () => {
  const parsed = parseTags(" AI, 科技, ,Go ")

  assert.deepEqual(parsed, ["AI", "科技", "Go"])
  assert.equal(stringifyTags(parsed), "AI,科技,Go")
})

test("mergeTags handles comma input and deduplicates case-insensitively", () => {
  const merged = mergeTags(["AI", "科技"], " ai, Go, go, 内容创作 ")

  assert.deepEqual(merged, ["AI", "科技", "Go", "内容创作"])
})
