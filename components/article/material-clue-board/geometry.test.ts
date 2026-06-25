import test from "node:test"
import assert from "node:assert/strict"

import { normalizeClueHref, placeTargetNode, rectsOverlap, NODE_FOOTPRINT } from "./geometry"

test("normalizes markdown href into a clue query", () => {
  assert.equal(normalizeClueHref("deep-learning"), "deep-learning")
  assert.equal(normalizeClueHref("semantic%20search"), "semantic search")
  assert.equal(normalizeClueHref("  rag  "), "rag")
})

test("placeTargetNode avoids occupied rectangles", () => {
  const source = { x: 0, y: 0 }
  const anchor = { x: 260, y: 0 }
  const firstChoice = placeTargetNode(source, anchor, [])
  const occupied = [{
    center: firstChoice,
    width: NODE_FOOTPRINT.width,
    height: NODE_FOOTPRINT.height,
  }]

  const next = placeTargetNode(source, anchor, occupied)
  assert.equal(
    rectsOverlap(
      { center: next, width: NODE_FOOTPRINT.width, height: NODE_FOOTPRINT.height },
      occupied[0],
      NODE_FOOTPRINT.gap
    ),
    false
  )
})
