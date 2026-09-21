import { authenticatedApiRequest } from "@/lib/api/client"
import type { ErrorResponse } from "@/lib/api/types"

export interface CaseSummary {
  id: number
  slug: string
  title: Record<string, string>
  summary: Record<string, string>
  style_slug: string
  color_family: string
  cover_url: string
}
export interface CaseDetail extends CaseSummary {
  articles: { article_key: string; locale: string; title: string; content: string; category: string; tags: string[] }[]
  materials: { material_key: string; title: string; material_type: string; content: string; source_url: string }[]
  artifacts: { artifact_key: string; artifact_type: string; locale: string; title: string; asset_url: string; preview_url: string }[]
}
export const casesClient = {
  copy(slug: string): Promise<{ article_id: number } | ErrorResponse> {
    return authenticatedApiRequest(`/api/v1/cases/${encodeURIComponent(slug)}/copy`, { method: "POST" })
  },
  list(signal?: AbortSignal): Promise<{ items: CaseSummary[] } | ErrorResponse> {
    return authenticatedApiRequest("/api/v1/cases", { signal })
  },
  detail(slug: string, signal?: AbortSignal): Promise<CaseDetail | ErrorResponse> {
    return authenticatedApiRequest(`/api/v1/cases/${encodeURIComponent(slug)}`, { signal })
  },
}
export function caseText(value: Record<string, string>, locale: string): string {
  return value[locale] || value.zh || value.en || ""
}
// Case snapshots may contain external links, but never executable URL schemes.
export function caseAssetUrl(value: string): string | undefined {
  try {
    const url = new URL(value)
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password ? url.href : undefined
  } catch { return undefined }
}
