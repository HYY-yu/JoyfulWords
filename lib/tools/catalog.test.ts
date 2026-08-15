import assert from "node:assert/strict"
import test from "node:test"

import {
  isAvailableToolSlug,
  TOOL_INDEX_SLUGS,
  type ToolSlug,
} from "./catalog"

test("all document conversion entries shown in the toolbox are available", () => {
  const documentTools: ToolSlug[] = [
    "ppt-generator",
    "markdown-to-word",
    "ppt-to-word",
  ]

  for (const slug of documentTools) {
    assert.equal((TOOL_INDEX_SLUGS as readonly ToolSlug[]).includes(slug), true)
    assert.equal(isAvailableToolSlug(slug), true)
  }
})

test("tools outside the published toolbox stay unavailable", () => {
  assert.equal(isAvailableToolSlug("ai-writer"), false)
  assert.equal(isAvailableToolSlug("word-to-ppt"), false)
  assert.equal(isAvailableToolSlug("meme-inserter"), false)
})
