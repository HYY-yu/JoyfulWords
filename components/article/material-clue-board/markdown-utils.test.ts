import test from "node:test"
import assert from "node:assert/strict"

import {
  normalizeMarkdownLinksWithSpaceDestinations,
  sanitizeClueBoardMaterialContent,
} from "./markdown-utils"

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

test("removes clue-board search link markup before creating materials", () => {
  const markdown = "[ 搜索词] (搜索词) opens a [Related Topic](Related Topic) summary."

  assert.equal(
    sanitizeClueBoardMaterialContent(markdown),
    "搜索词 opens a Related Topic summary."
  )
})

test("keeps regular markdown links and images when sanitizing clue-board materials", () => {
  const markdown = [
    "[JoyfulWords](https://joyfulwords.com) keeps [docs](./docs) linked.",
    "![preview](https://cdn.example.com/preview.png)",
    "[example.com](example.com) remains visible as a markdown link.",
  ].join("\n")

  assert.equal(sanitizeClueBoardMaterialContent(markdown), markdown)
})
