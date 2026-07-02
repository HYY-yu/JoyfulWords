import { NextRequest, NextResponse } from "next/server"

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

function isAllowedImageHost(hostname: string) {
  const normalized = hostname.toLowerCase()
  return (
    ALLOWED_HOSTS.has(normalized) ||
    ALLOWED_HOST_SUFFIXES.some((suffix) => normalized.endsWith(suffix))
  )
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

  const response = await fetch(parsedUrl, {
    headers: {
      Accept: "image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8",
    },
    next: { revalidate: 60 * 60 * 24 },
  })

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to load image" }, { status: response.status })
  }

  const contentType = response.headers.get("content-type") || "image/png"
  if (!contentType.toLowerCase().startsWith("image/")) {
    return NextResponse.json({ error: "URL is not an image" }, { status: 400 })
  }

  return new NextResponse(response.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
