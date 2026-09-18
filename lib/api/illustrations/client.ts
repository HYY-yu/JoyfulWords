import { authenticatedApiRequest } from "@/lib/api/client"
import type { ErrorResponse } from "@/lib/api/types"
import type { ArticleDesignState, DesignCatalog, CoverOptions, CoverRecord, CoverRequest } from "./types"

export const illustrationsClient = {
  coverOptions(signal?: AbortSignal): Promise<CoverOptions | ErrorResponse> {
    return authenticatedApiRequest("/illustrations/cover-options", { method: "GET", signal })
  },
  covers(articleId: number, signal?: AbortSignal): Promise<{ items: CoverRecord[] } | ErrorResponse> {
    return authenticatedApiRequest(`/illustrations/articles/${articleId}/covers`, { method: "GET", signal })
  },
  createCover(articleId: number, request: CoverRequest): Promise<CoverRecord | ErrorResponse> {
    console.info("[Illustrations] Submitting cover", { articleId, outputPreset: request.output_preset })
    return authenticatedApiRequest(`/illustrations/articles/${articleId}/covers`, { method: "POST", body: JSON.stringify(request) })
  },
  catalog(signal?: AbortSignal): Promise<DesignCatalog | ErrorResponse> {
    return authenticatedApiRequest("/illustrations/catalog", { method: "GET", signal })
  },
  design(articleId: number, signal?: AbortSignal): Promise<ArticleDesignState | ErrorResponse> {
    return authenticatedApiRequest(`/illustrations/articles/${articleId}/design`, { method: "GET", signal })
  },
  bind(articleId: number, styleId: number, paletteId: number): Promise<ArticleDesignState | ErrorResponse> {
    console.info("[Illustrations] Binding article design", { articleId, styleId, paletteId })
    return authenticatedApiRequest(`/illustrations/articles/${articleId}/design`, {
      method: "POST", body: JSON.stringify({ style_id: styleId, palette_id: paletteId }),
    })
  },
  retry(articleId: number): Promise<ArticleDesignState | ErrorResponse> {
    console.info("[Illustrations] Retrying design preparation", { articleId })
    return authenticatedApiRequest(`/illustrations/articles/${articleId}/design/prepare`, { method: "POST" })
  },
}
