import assert from "node:assert/strict"
import test from "node:test"
import type { PPTImageStyle } from "@/lib/api/presentations/v2/types"
import { resolveImageStyle } from "./image-style"

const styles: PPTImageStyle[] = [
  {
    id: "photo_illustration",
    label_i18n: { zh: "照片插图", en: "Photo illustration" },
    prompt_suffix: "not shown in the UI",
  },
  {
    id: "flat_vector",
    label_i18n: { zh: "扁平矢量", en: "Flat vector" },
    prompt_suffix: "not shown in the UI",
  },
]

test("restores a still-supported preferred image style", () => {
  assert.equal(
    resolveImageStyle(styles, "photo_illustration", "flat_vector")?.id,
    "flat_vector"
  )
})

test("falls back to the backend default when a stored style is unavailable", () => {
  assert.equal(
    resolveImageStyle(styles, "photo_illustration", "monochrome_line_art")?.id,
    "photo_illustration"
  )
})

test("returns null when the backend exposes no selectable styles", () => {
  assert.equal(resolveImageStyle([], "photo_illustration"), null)
})
