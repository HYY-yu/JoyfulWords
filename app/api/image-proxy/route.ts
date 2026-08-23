import { NextRequest, NextResponse } from "next/server"

const IMAGE_PROXY_TIMEOUT_MS = 12_000
const MAX_IMAGE_PROXY_BYTES = 12 * 1024 * 1024

const ALLOWED_HOST_SUFFIXES = [
  ".joyword.link",
  ".joyword.top",
  ".r2.dev",
  ".r2.cloudflarestorage.com",
]

const ALLOWED_HOSTS = new Set([
  "cdn.joyword.link",
  "images.unsplash.com",
])

const ALLOWED_RASTER_CONTENT_TYPES = new Set([
  "image/avif",
  "image/bmp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/tiff",
  "image/webp",
  "image/x-icon",
])

function isAllowedImageHost(hostname: string) {
  const normalized = hostname.toLowerCase()
  return (
    ALLOWED_HOSTS.has(normalized) ||
    ALLOWED_HOST_SUFFIXES.some((suffix) => normalized.endsWith(suffix))
  )
}

function parseContentLength(value: string | null): number | null {
  if (!value) return null

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function normalizeContentType(value: string | null): string {
  return value?.split(";")[0]?.trim().toLowerCase() || ""
}

function isAllowedRasterContentType(value: string | null): boolean {
  return ALLOWED_RASTER_CONTENT_TYPES.has(normalizeContentType(value))
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "AbortError"
  )
}

async function readLimitedBody(body: ReadableStream<Uint8Array> | null, maxBytes: number) {
  if (!body) return new Uint8Array()

  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue

      totalBytes += value.byteLength
      if (totalBytes > maxBytes) {
        void reader.cancel("image_proxy_response_too_large").catch(() => undefined)
        throw new Error("image_proxy_response_too_large")
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const result = new Uint8Array(totalBytes)
  let offset = 0
  chunks.forEach((chunk) => {
    result.set(chunk, offset)
    offset += chunk.byteLength
  })
  return result
}

export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get("url")
  if (!imageUrl) {
    return NextResponse.json({ error: "Missing image URL" }, { status: 400 })
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(imageUrl)
  } catch {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 })
  }

  if (parsedUrl.protocol !== "https:" || !isAllowedImageHost(parsedUrl.hostname)) {
    return NextResponse.json({ error: "Image host is not allowed" }, { status: 400 })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), IMAGE_PROXY_TIMEOUT_MS)

  try {
    const response = await fetch(parsedUrl, {
      headers: {
        Accept: "image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8",
      },
      next: { revalidate: 60 * 60 * 24 },
      signal: controller.signal,
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to load image" }, { status: response.status })
    }

    const contentType = normalizeContentType(response.headers.get("content-type"))
    if (!isAllowedRasterContentType(contentType)) {
      return NextResponse.json({ error: "URL is not an image" }, { status: 400 })
    }

    const contentLength = parseContentLength(response.headers.get("content-length"))
    if (contentLength !== null && contentLength > MAX_IMAGE_PROXY_BYTES) {
      return NextResponse.json({ error: "Image is too large" }, { status: 413 })
    }

    const imageBody = await readLimitedBody(response.body, MAX_IMAGE_PROXY_BYTES)
    return new NextResponse(imageBody, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    if (isAbortError(error)) {
      return NextResponse.json({ error: "Image request timed out" }, { status: 504 })
    }
    if (error instanceof Error && error.message === "image_proxy_response_too_large") {
      return NextResponse.json({ error: "Image is too large" }, { status: 413 })
    }
    return NextResponse.json({ error: "Failed to load image" }, { status: 502 })
  } finally {
    clearTimeout(timeoutId)
  }
}
