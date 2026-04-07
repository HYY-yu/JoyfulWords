import { apiRequest } from "@/lib/api/client"
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

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("access_token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const mindMapClient = {
  async generate(
    request: GenerateMindMapRequest
  ): Promise<GenerateMindMapResponse | ErrorResponse> {
    const result = await apiRequest<GenerateMindMapResponse | ErrorResponse>(
      `/article/${request.articleId}/mindmap/generate`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      }
    )

    return normalizeResult(result)
  },

  async getByArticleId(articleId: number): Promise<GetMindMapResponse | ErrorResponse> {
    const result = await apiRequest<GetMindMapResponse | ErrorResponse>(`/article/${articleId}/mindmap`, {
      method: "GET",
      headers: getAuthHeaders(),
    })

    return normalizeResult(result)
  },

  async saveByArticleId(
    articleId: number,
    request: SaveMindMapRequest
  ): Promise<SaveMindMapResponse | ErrorResponse> {
    const result = await apiRequest<SaveMindMapResponse | ErrorResponse>(`/article/${articleId}/mindmap`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    })

    return normalizeResult(result)
  },
}
