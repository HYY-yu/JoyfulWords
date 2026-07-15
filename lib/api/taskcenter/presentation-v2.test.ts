import assert from "node:assert/strict"
import test from "node:test"
import { getTaskCenterPresentationDownloadUrl } from "./types"

test("returns the V2 pptx_url after trimming whitespace", () => {
  assert.equal(
    getTaskCenterPresentationDownloadUrl({ pptx_url: "  https://example.com/deck.pptx  " }),
    "https://example.com/deck.pptx"
  )
})

test("returns null when the V2 pptx_url is missing", () => {
  assert.equal(getTaskCenterPresentationDownloadUrl({}), null)
  assert.equal(getTaskCenterPresentationDownloadUrl({ pptx_url: "   " }), null)
})
