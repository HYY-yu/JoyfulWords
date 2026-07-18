const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  avif: "image/avif",
  bmp: "image/bmp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  jp2: "image/jp2",
  pdf: "application/pdf",
  png: "image/png",
  webp: "image/webp",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}

const SUPPORTED_IMAGE_EXTENSIONS = new Set([
  "avif",
  "bmp",
  "gif",
  "heic",
  "heif",
  "jpeg",
  "jpg",
  "jp2",
  "png",
  "webp",
])

const RETRYABLE_UPLOAD_STATUSES = new Set([408, 425, 429])

export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024

export function getFileExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".")
  return dotIndex >= 0 ? filename.slice(dotIndex + 1).toLowerCase() : ""
}

export function resolveUploadContentType(filename: string, contentType?: string): string {
  const normalized = contentType?.trim()
  if (normalized && normalized !== "application/octet-stream" && normalized !== "binary/octet-stream") {
    return normalized
  }

  return CONTENT_TYPE_BY_EXTENSION[getFileExtension(filename)] || "application/octet-stream"
}

export function isSupportedImageFile(file: Pick<File, "name" | "type">): boolean {
  const extension = getFileExtension(file.name)
  if (SUPPORTED_IMAGE_EXTENSIONS.has(extension)) return true

  const contentType = file.type.trim().toLowerCase()
  return contentType.startsWith("image/") && contentType !== "image/svg+xml"
}

function shouldRetryUpload(status: number): boolean {
  return RETRYABLE_UPLOAD_STATUSES.has(status) || status >= 500
}

export async function putFileToPresignedUrl(
  uploadUrl: string,
  file: File,
  contentType?: string
): Promise<{ ok: boolean; status: number }> {
  const resolvedContentType = resolveUploadContentType(file.name, contentType || file.type)

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": resolvedContentType,
        },
      })

      if (response.ok || attempt === 1 || !shouldRetryUpload(response.status)) {
        return { ok: response.ok, status: response.status }
      }
    } catch {
      if (attempt === 1) return { ok: false, status: 0 }
    }
  }

  return { ok: false, status: 0 }
}
