import { authenticatedApiRequest } from "@/lib/api/client"
import type {
  ErrorResponse,
  GenerateMindMapRequest,
  GenerateMindMapResponse,
  GetMindMapResponse,
  SaveMindMapRequest,
  SaveMindMapResponse,
} from "./types"

function normalizeMindMapError(error: string): string {
  switch (error) {
    case "Session expired":
      return "MINDMAP_UNAUTHORIZED"
    case "Request failed":
      return "MINDMAP_REQUEST_FAILED"
    default:
      return error
  }
}

function normalizeResult<T extends object>(result: T | ErrorResponse): T | ErrorResponse {
  if ("error" in result) {
    return {
      error: normalizeMindMapError(result.error),
    }
  }

  return result
}

export const mindMapClient = {
  async generate(
    request: GenerateMindMapRequest
  ): Promise<GenerateMindMapResponse | ErrorResponse> {
    const result = await authenticatedApiRequest<GenerateMindMapResponse | ErrorResponse>(
      `/article/${request.articleId}/mindmap/generate`,
      {
        method: "POST",
      }
    )

    return normalizeResult(result)
  },

  async getByArticleId(articleId: number): Promise<GetMindMapResponse | ErrorResponse> {
    const result = await authenticatedApiRequest<GetMindMapResponse | ErrorResponse>(`/article/${articleId}/mindmap`, {
      method: "GET",
    })

    return normalizeResult(result)
  },

  async saveByArticleId(
    articleId: number,
    request: SaveMindMapRequest
  ): Promise<SaveMindMapResponse | ErrorResponse> {
    const result = await authenticatedApiRequest<SaveMindMapResponse | ErrorResponse>(`/article/${articleId}/mindmap`, {
      method: "PUT",
      body: JSON.stringify(request),
    })

    return normalizeResult(result)
  },
}
