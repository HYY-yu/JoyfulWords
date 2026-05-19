function inferImageExtension(contentType: string | null, imageUrl: string): string {
  const normalizedContentType = contentType?.toLowerCase() ?? ""
  if (normalizedContentType.includes("jpeg") || normalizedContentType.includes("jpg")) return "jpg"
  if (normalizedContentType.includes("webp")) return "webp"
  if (normalizedContentType.includes("gif")) return "gif"
  if (normalizedContentType.includes("avif")) return "avif"
  if (normalizedContentType.includes("svg")) return "svg"

  try {
    const pathname = new URL(imageUrl).pathname
    const extension = pathname.split(".").pop()?.toLowerCase()
    if (extension && /^[a-z0-9]{2,5}$/.test(extension)) {
      return extension
    }
  } catch {
    // Ignore invalid URLs and fall back to png.
  }

  return "png"
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const objectUrl = window.URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = objectUrl
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.URL.revokeObjectURL(objectUrl)
}

async function fetchImageBlob(imageUrl: string) {
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`download_failed_${response.status}`)
  }

  const contentType = response.headers.get("content-type")
  if (contentType && !contentType.toLowerCase().startsWith("image/")) {
    throw new Error("download_failed_non_image")
  }

  return {
    blob: await response.blob(),
    contentType,
  }
}

export async function downloadImageFromUrl(imageUrl: string, filenamePrefix = "generated-image") {
  try {
    const { blob, contentType } = await fetchImageBlob(imageUrl)
    const extension = inferImageExtension(contentType, imageUrl)
    triggerBlobDownload(blob, `${filenamePrefix}-${Date.now()}.${extension}`)
    return
  } catch (error) {
    console.warn("[ImageDownload] Direct image download failed, trying image proxy", {
      imageUrl,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  const proxyUrl = new URL("/api/image-proxy", window.location.origin)
  proxyUrl.searchParams.set("url", imageUrl)

  try {
    const { blob, contentType } = await fetchImageBlob(proxyUrl.toString())
    const extension = inferImageExtension(contentType, imageUrl)
    triggerBlobDownload(blob, `${filenamePrefix}-${Date.now()}.${extension}`)
  } catch (error) {
    console.error("[ImageDownload] Image download failed", {
      imageUrl,
      error: error instanceof Error ? error.message : String(error),
    })
    window.open(imageUrl, "_blank", "noopener,noreferrer")
    throw error
  }
}
