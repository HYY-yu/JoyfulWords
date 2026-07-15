import assert from "node:assert/strict"
import test from "node:test"
import { getPresentationGenerationErrorKey } from "./error-messages"

test("maps every documented generation error code to a safe i18n key", () => {
  assert.equal(
    getPresentationGenerationErrorKey("invalid_runtime_manifest"),
    "presentationV2.errors.generation.invalid_runtime_manifest"
  )
})

test("uses the safe fallback for unknown backend errors", () => {
  assert.equal(
    getPresentationGenerationErrorKey("internal_stack_trace"),
    "presentationV2.errors.generation.unknown"
  )
})
