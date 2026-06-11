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

export class FileConverterApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "FileConverterApiError"
    this.status = status
  }
}

export async function listWordTemplates(): Promise<DocumentTemplateRecord[]> {
  const response = await fetch(`${DOCUMENT_CONVERTER_BASE}/templates?type=word`, {
    method: "GET",
    credentials: "include",
    headers: await optionalHeaders(),
  })
  if (!response.ok) {
    throw new FileConverterApiError(await readErrorMessage(response), response.status)
  }
  const payload = (await response.json()) as TemplateListResponse
  return payload.templates ?? []
}

export async function uploadWordTemplate(file: File, name: string): Promise<DocumentTemplateRecord> {
  const token = await getValidAccessToken()
  if (!token) {
    throw new FileConverterApiError("请先登录后上传模板", 401)
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
    throw new FileConverterApiError(await readErrorMessage(response), response.status)
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
    throw new FileConverterApiError(await readErrorMessage(response), response.status)
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
    throw new FileConverterApiError(await readErrorMessage(response), response.status)
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
    throw new FileConverterApiError(await readErrorMessage(response), response.status)
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
