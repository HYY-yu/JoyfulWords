import test from "node:test"
import assert from "node:assert/strict"

import { normalizeMarkdownLinksWithSpaceDestinations } from "./markdown-utils"

test("wraps markdown link destinations containing spaces in angle brackets", () => {
  const markdown = "[Chiau](Chiau) is a [last name](last name) common among [Overseas Chinese](Overseas Chinese)."

  assert.equal(
    normalizeMarkdownLinksWithSpaceDestinations(markdown),
    "[Chiau](Chiau) is a [last name](<last name>) common among [Overseas Chinese](<Overseas Chinese>)."
  )
})

test("does not rewrite image markdown or already valid links", () => {
  const markdown = "![alt text](https://cdn.example.com/a b.png) [semantic search](semantic%20search) [rag](rag)"

  assert.equal(normalizeMarkdownLinksWithSpaceDestinations(markdown), markdown)
})

