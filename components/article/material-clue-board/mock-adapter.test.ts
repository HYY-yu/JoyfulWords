import assert from "node:assert/strict"
import test from "node:test"

import { createClueExpansionSubmitError } from "./mock-adapter"

test("preserves AbortError semantics when a clue submission is canceled", () => {
  const controller = new AbortController()
  controller.abort()

  const error = createClueExpansionSubmitError(
    "signal is aborted without reason",
    controller.signal
  )

  assert.equal(error.name, "AbortError")
  assert.equal(error.message, "Material clue expansion aborted")
})

test("keeps real clue submission failures as regular errors", () => {
  const error = createClueExpansionSubmitError("request failed")

  assert.equal(error.name, "Error")
  assert.equal(error.message, "request failed")
})
