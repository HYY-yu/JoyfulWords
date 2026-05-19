import { API_BASE_URL } from "@/lib/config"
import { getLanguageHeader } from "@/lib/api/client"
import type {
  ApiErrorResponse,
  ConvertResult,
  FileConverterFormat,
  TextConvertRequest,
  TextConvertResponse,
} from "./types"

export class FileConverterApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "FileConverterApiError"
    this.status = status
  }
}

export async function convertUploadedFile(file: File, targetType: FileConverterFormat): Promise<ConvertResult> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("target_type", targetType)

  return requestConversion({
    method: "POST",
    body: formData,
    headers: {
      "Accept-Language": getLanguageHeader(),
    },
  })
}

export async function convertTextContent(request: TextConvertRequest): Promise<ConvertResult> {
  return requestConversion({
    method: "POST",
    body: JSON.stringify(request),
    headers: {
      "Accept-Language": getLanguageHeader(),
      "Content-Type": "application/json",
    },
  })
}

async function requestConversion(init: RequestInit): Promise<ConvertResult> {
  const response = await fetch(`${API_BASE_URL}/api/convert`, init)
  const contentType = response.headers.get("content-type") ?? ""

  if (!response.ok) {
    throw new FileConverterApiError(await readErrorMessage(response), response.status)
  }

  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as TextConvertResponse
    return {
      kind: "text",
      data: payload.data,
    }
  }

  const blob = await response.blob()
  return {
    kind: "file",
    blob,
    fileName: getFileNameFromDisposition(response.headers.get("content-disposition")) ?? fallbackFileName(contentType),
    contentType: contentType || blob.type,
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    try {
      const payload = (await response.json()) as ApiErrorResponse
      return payload.error || "转换失败，请稍后重试"
    } catch {
      return "转换失败，请稍后重试"
    }
  }

  const text = await response.text()
  return text || "转换失败，请稍后重试"
}

function getFileNameFromDisposition(disposition: string | null): string | null {
  if (!disposition) return null

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }

  const asciiMatch = disposition.match(/filename="?([^";]+)"?/i)
  return asciiMatch?.[1] ?? null
}

function fallbackFileName(contentType: string): string {
  if (contentType.includes("pdf")) return "converted.pdf"
  if (contentType.includes("wordprocessingml")) return "converted.docx"
  return "converted.bin"
}
