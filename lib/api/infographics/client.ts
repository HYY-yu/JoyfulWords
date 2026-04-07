import { apiRequest } from "@/lib/api/client"
import type { ErrorResponse } from "@/lib/api/types"
import type {
  CopyInfographicToMaterialsRequest,
  CopyInfographicToMaterialsResponse,
  GenerateInfographicRequest,
  GenerateInfographicResponse,
  InfographicLogDetailResponse,
} from "./types"

export const infographicsClient = {
  async generate(
    request: GenerateInfographicRequest
  ): Promise<GenerateInfographicResponse | ErrorResponse> {
    const token = localStorage.getItem("access_token")

    console.info("[Infographics] Creating infographic task:", {
      articleId: request.article_id ?? 0,
      cardStyle: request.card_style,
      screenOrientation: request.screen_orientation,
      language: request.language,
      decorationLevel: request.decoration_level,
      textLength: request.text.length,
      hasUserCustom: Boolean(request.user_custom?.trim()),
    })

    // TODO(observability): add infographic task creation metrics and trace attributes.
    return apiRequest<GenerateInfographicResponse>("/infographics/generate", {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(request),
    })
  },

  async getLogDetail(
    id: number
  ): Promise<InfographicLogDetailResponse | ErrorResponse> {
    const token = localStorage.getItem("access_token")

    console.debug("[Infographics] Fetching infographic detail:", { logId: id })

    return apiRequest<InfographicLogDetailResponse>(`/infographics/logs/${id}`, {
      method: "GET",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    })
  },

  async copyToMaterials(
    id: number,
    articleId?: number
  ): Promise<CopyInfographicToMaterialsResponse | ErrorResponse> {
    const token = localStorage.getItem("access_token")
    const requestBody: CopyInfographicToMaterialsRequest | undefined =
      typeof articleId === "number" ? { article_id: articleId } : undefined

    console.info("[Infographics] Copying infographic to materials:", {
      logId: id,
      articleId: requestBody?.article_id ?? null,
    })

    // TODO(observability): add copy-to-materials success and failure counters.
    return apiRequest<CopyInfographicToMaterialsResponse>(
      `/infographics/logs/${id}/copy-to-materials`,
      {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: requestBody ? JSON.stringify(requestBody) : undefined,
      }
    )
  },
}
