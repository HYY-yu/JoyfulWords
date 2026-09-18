import test from "node:test"
import assert from "node:assert/strict"
import { infographicCards, isInfographicPending } from "./infographic-state"
import type { InfographicRecord } from "./types"

test("legacy images remain visible and completed/partial/empty batches stop polling", () => {
  const image = { id: 4, is_batch: false, status: "succeeded", result: { image_url: "image.png", width: 832, height: 1248 } } as InfographicRecord
  assert.deepEqual(infographicCards(image), [image])
  const batch = { id: 10, is_batch: true, cards: [image], status: "partial" } as InfographicRecord
  assert.deepEqual(infographicCards(batch), [image])
  for (const status of ["empty", "partial", "succeeded", "failed"] as const) assert.equal(isInfographicPending({ ...batch, status }), false)
  for (const status of ["pending", "analyzing", "processing", "submitting"] as const) assert.equal(isInfographicPending({ ...batch, status }), true)
  assert.deepEqual(infographicCards({ ...batch, cards: undefined, status: "analyzing" }), [])
})
