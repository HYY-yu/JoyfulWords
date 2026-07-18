import assert from "node:assert/strict"
import test from "node:test"

import {
  isSupportedImageFile,
  putFileToPresignedUrl,
  resolveUploadContentType,
} from "./upload-file"

test("resolveUploadContentType preserves a browser-provided type", () => {
  assert.equal(resolveUploadContentType("photo.jpg", "image/custom"), "image/custom")
})

test("resolveUploadContentType falls back to the filename when browser MIME is empty", () => {
  assert.equal(resolveUploadContentType("photo.JPG", ""), "image/jpeg")
  assert.equal(resolveUploadContentType("photo.webp", "application/octet-stream"), "image/webp")
  assert.equal(resolveUploadContentType("report.pdf"), "application/pdf")
  assert.equal(resolveUploadContentType("unknown.data"), "application/octet-stream")
})

test("isSupportedImageFile accepts common images with missing MIME", () => {
  assert.equal(isSupportedImageFile({ name: "photo.jpg", type: "" }), true)
  assert.equal(isSupportedImageFile({ name: "photo.avif", type: "image/avif" }), true)
  assert.equal(isSupportedImageFile({ name: "notes.pdf", type: "application/pdf" }), false)
  assert.equal(isSupportedImageFile({ name: "vector.svg", type: "image/svg+xml" }), false)
})

test("putFileToPresignedUrl retries one transient response", async () => {
  const originalFetch = globalThis.fetch
  let calls = 0
  globalThis.fetch = async () => {
    calls += 1
    return new Response(null, { status: calls === 1 ? 503 : 200 })
  }

  try {
    const file = { name: "photo.jpg", type: "image/jpeg" } as File
    const result = await putFileToPresignedUrl("https://upload.example", file)
    assert.deepEqual(result, { ok: true, status: 200 })
    assert.equal(calls, 2)
  } finally {
    globalThis.fetch = originalFetch
  }
})
