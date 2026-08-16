import { API_BASE_URL } from "@/lib/config"
import { getLanguageHeader } from "@/lib/api/client"
import { getValidAccessToken } from "@/lib/tokens/refresh"
import { tokenStore } from "@/lib/tokens/token-store"
import type {
  ApiErrorResponse,
  ConversionTaskResponse,
  DocumentTemplateRecord,
  MarkdownToWordRequest,
  TemplateListResponse,
} from "./types"

const DOCUMENT_CONVERTER_BASE = `${API_BASE_URL}/api/document-converter`

export type FileConverterErrorKind =
  | "authentication-required"
  | "guest-quota-exceeded"
  | "request-failed"

interface FileConverterErrorOptions {
  kind?: FileConverterErrorKind
  reason?: string
  action?: string
  feature?: string
  limitType?: string
}

export class FileConverterApiError extends Error {
  status: number
  kind: FileConverterErrorKind
  reason?: string
  action?: string
  feature?: string
  limitType?: string

  constructor(message: string, status: number, options: FileConverterErrorOptions = {}) {
    super(message)
    this.name = "FileConverterApiError"
    this.status = status
    this.kind = options.kind ?? "request-failed"
    this.reason = options.reason
    this.action = options.action
    this.feature = options.feature
    this.limitType = options.limitType
  }
}

export async function listWordTemplates(): Promise<DocumentTemplateRecord[]> {
  const response = await fetch(`${DOCUMENT_CONVERTER_BASE}/templates?type=word`, {
    method: "GET",
    credentials: "include",
    headers: await optionalHeaders(),
  })
  if (!response.ok) {
    throw await createFileConverterApiError(response)
  }
  const payload = (await response.json()) as TemplateListResponse
  return payload.templates ?? []
}

export async function uploadWordTemplate(file: File, name: string): Promise<DocumentTemplateRecord> {
  const token = await getValidAccessToken()
  if (!token) {
    throw new FileConverterApiError("authentication_required", 401, {
      kind: "authentication-required",
      reason: "login_required",
      action: "login_required",
    })
  }

  const formData = new FormData()
  formData.append("file", file)
  formData.append("name", name)

  const response = await fetch(`${DOCUMENT_CONVERTER_BASE}/templates/word`, {
    method: "POST",
    credentials: "include",
    body: formData,
    headers: {
      "Accept-Language": getLanguageHeader(),
      Authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw await createFileConverterApiError(response)
  }
  return (await response.json()) as DocumentTemplateRecord
}

export async function convertMarkdownToWord(request: MarkdownToWordRequest): Promise<ConversionTaskResponse> {
  const response = await fetch(`${DOCUMENT_CONVERTER_BASE}/convert/markdown-to-word`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({
      markdown: request.markdown,
      template_id: request.template_id ?? "",
    }),
    headers: await optionalHeaders({ "Content-Type": "application/json" }),
  })
  if (!response.ok) {
    throw await createFileConverterApiError(response)
  }
  return (await response.json()) as ConversionTaskResponse
}

export async function convertPptToWord(file: File, templateId: string): Promise<ConversionTaskResponse> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("template_id", templateId)

  const response = await fetch(`${DOCUMENT_CONVERTER_BASE}/convert/ppt-to-word`, {
    method: "POST",
    credentials: "include",
    body: formData,
    headers: await optionalHeaders(),
  })
  if (!response.ok) {
    throw await createFileConverterApiError(response)
  }
  return (await response.json()) as ConversionTaskResponse
}

export async function convertPdfToWord(file: File, templateId: string): Promise<ConversionTaskResponse> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("template_id", templateId)

  const response = await fetch(`${DOCUMENT_CONVERTER_BASE}/convert/pdf-to-word`, {
    method: "POST",
    credentials: "include",
    body: formData,
    headers: await optionalHeaders(),
  })
  if (!response.ok) {
    throw await createFileConverterApiError(response)
  }
  return (await response.json()) as ConversionTaskResponse
}

export function absoluteDownloadURL(downloadURL: string): string {
  if (!downloadURL) return ""
  if (/^https?:\/\//i.test(downloadURL)) return downloadURL
  return `${API_BASE_URL}${downloadURL.startsWith("/") ? downloadURL : `/${downloadURL}`}`
}

async function optionalHeaders(extra?: HeadersInit): Promise<HeadersInit> {
  const headers = new Headers(extra)
  headers.set("Accept-Language", getLanguageHeader())

  const currentToken = tokenStore.getAccessToken()
  if (currentToken) {
    const token = await getValidAccessToken()
    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }
  }
  return headers
}

async function createFileConverterApiError(response: Response): Promise<FileConverterApiError> {
  const payload = await readErrorResponse(response)
  const reason = payload.reason
  const isGuestQuotaExceeded = reason === "guest_global_quota_exceeded" || reason === "guest_daily_quota_exceeded"
  const kind: FileConverterErrorKind = isGuestQuotaExceeded
    ? "guest-quota-exceeded"
    : response.status === 401 || reason === "login_required"
      ? "authentication-required"
      : "request-failed"

  return new FileConverterApiError(
    payload.error || response.statusText || "request_failed",
    response.status,
    {
      kind,
      reason,
      action: payload.action,
      feature: payload.feature,
      limitType: payload.limit_type,
    }
  )
}

async function readErrorResponse(response: Response): Promise<ApiErrorResponse> {
  const contentType = response.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    try {
      const payload = await response.json() as unknown
      if (payload && typeof payload === "object") {
        return payload as ApiErrorResponse
      }
      return { error: response.statusText || "request_failed" }
    } catch {
      return { error: response.statusText || "request_failed" }
    }
  }

  const text = await response.text()
  return { error: text || response.statusText || "request_failed" }
}
