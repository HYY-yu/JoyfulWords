import test from "node:test"
import assert from "node:assert/strict"

import { NextRequest } from "next/server"

import { GET } from "./route"

const ORIGINAL_FETCH = globalThis.fetch
const MAX_IMAGE_PROXY_BYTES = 12 * 1024 * 1024

function requestForImageURL(imageURL: string): NextRequest {
  return new NextRequest(
    `http://localhost/api/image-proxy?url=${encodeURIComponent(imageURL)}`
  )
}

test.afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH
})

test("image proxy rejects SVG even though it is image/*", async () => {
  globalThis.fetch = (async () =>
    new Response("<svg />", {
      headers: { "Content-Type": "image/svg+xml" },
    })) as typeof fetch

  const response = await GET(requestForImageURL("https://images.unsplash.com/vector.svg"))
  const body = await response.json()

  assert.equal(response.status, 400)
  assert.equal(body.error, "URL is not an image")
})

test("image proxy rejects raster responses with excessive content length", async () => {
  globalThis.fetch = (async () =>
    new Response(new Uint8Array(), {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(MAX_IMAGE_PROXY_BYTES + 1),
      },
    })) as typeof fetch

  const response = await GET(requestForImageURL("https://images.unsplash.com/photo.png"))
  const body = await response.json()

  assert.equal(response.status, 413)
  assert.equal(body.error, "Image is too large")
})

test("image proxy rejects raster streams that exceed the byte limit", async () => {
  const oversizedStream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(MAX_IMAGE_PROXY_BYTES + 1))
      controller.close()
    },
  })

  globalThis.fetch = (async () =>
    new Response(oversizedStream, {
      headers: { "Content-Type": "image/png" },
    })) as typeof fetch

  const response = await GET(requestForImageURL("https://images.unsplash.com/photo.png"))
  const body = await response.json()

  assert.equal(response.status, 413)
  assert.equal(body.error, "Image is too large")
})

test("image proxy returns allowed raster images", async () => {
  const imageBytes = new Uint8Array([137, 80, 78, 71])
  globalThis.fetch = (async () =>
    new Response(imageBytes, {
      headers: { "Content-Type": "image/png; charset=binary" },
    })) as typeof fetch

  const response = await GET(requestForImageURL("https://images.unsplash.com/photo.png"))
  const body = new Uint8Array(await response.arrayBuffer())

  assert.equal(response.status, 200)
  assert.equal(response.headers.get("Content-Type"), "image/png")
  assert.deepEqual(body, imageBytes)
})
