import type {
  ErrorResponse,
  GenerateMindMapRequest,
  GenerateMindMapResponse,
  GetMindMapResponse,
  SaveMindMapRequest,
  SaveMindMapResponse,
} from "./types"

async function parseResponse<T>(response: Response): Promise<T | ErrorResponse> {
  const text = await response.text()
  let payload: any

  try {
    payload = text ? JSON.parse(text) : {}
  } catch (error) {
    console.warn("[MindMap API] Invalid JSON response", error)
    return { error: `Invalid response format (status ${response.status})` }
  }

  if (!response.ok) {
    return { error: payload?.error || `Request failed (status ${response.status})` }
  }

  return payload as T
}

export const mindMapClient = {
  async generate(
    request: GenerateMindMapRequest
  ): Promise<GenerateMindMapResponse | ErrorResponse> {
    const token = localStorage.getItem("access_token")
    const response = await fetch("/api/article/mindmap/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(request),
    })

    return parseResponse<GenerateMindMapResponse>(response)
  },

  async getByArticleId(articleId: number): Promise<GetMindMapResponse | ErrorResponse> {
    const token = localStorage.getItem("access_token")
    const response = await fetch(`/api/article/${articleId}/mindmap`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    return parseResponse<GetMindMapResponse>(response)
  },

  async saveByArticleId(
    articleId: number,
    request: SaveMindMapRequest
  ): Promise<SaveMindMapResponse | ErrorResponse> {
    const token = localStorage.getItem("access_token")
    const response = await fetch(`/api/article/${articleId}/mindmap`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(request),
    })

    return parseResponse<SaveMindMapResponse>(response)
  },
}
