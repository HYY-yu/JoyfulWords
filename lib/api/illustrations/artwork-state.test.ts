import test from "node:test"
import assert from "node:assert/strict"
import { artworkCards, isArtworkPending } from "./artwork-state"
import type { ArtworkRecord } from "./types"

test("individual images remain visible and completed/partial/empty batches stop polling", () => {
  const image = { id: 4, is_batch: false, status: "succeeded", result: { image_url: "image.png", width: 832, height: 1248 } } as ArtworkRecord
  assert.deepEqual(artworkCards(image), [image])
  const batch = { id: 10, is_batch: true, cards: [image], status: "partial" } as ArtworkRecord
  assert.deepEqual(artworkCards(batch), [image])
  for (const status of ["empty", "partial", "succeeded", "failed"] as const) assert.equal(isArtworkPending({ ...batch, status }), false)
  for (const status of ["pending", "analyzing", "processing", "submitting"] as const) assert.equal(isArtworkPending({ ...batch, status }), true)
  assert.deepEqual(artworkCards({ ...batch, cards: undefined, status: "analyzing" }), [])
})
