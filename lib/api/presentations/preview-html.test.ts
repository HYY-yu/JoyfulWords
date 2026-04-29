import test from "node:test"
import assert from "node:assert/strict"

import { preparePresentationPreviewHTML } from "./preview-html"

test("preparePresentationPreviewHTML hides reveal slide number links", () => {
  const html = "<!doctype html><html><head></head><body><div class=\"reveal\"></div></body></html>"

  const result = preparePresentationPreviewHTML(html)

  assert.match(result, /joyfulwords-reveal-preview-guard/)
  assert.match(result, /\.slide-number,/)
  assert.match(result, /\.slide-number a,/)
  assert.match(result, /\.reveal \.slide-number/)
  assert.match(result, /\.reveal \.slide-number a/)
  assert.match(result, /pointer-events: none !important/)
  assert.match(result, /<\/style><\/head>/)
})

test("preparePresentationPreviewHTML does not inject the guard twice", () => {
  const html = "<html><head></head><body></body></html>"
  const once = preparePresentationPreviewHTML(html)

  assert.equal(preparePresentationPreviewHTML(once), once)
})
