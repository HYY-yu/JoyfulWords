import { apiRequest, authenticatedApiRequest } from "@/lib/api/client"
import type { ErrorResponse } from "@/lib/api/types"
import { tokenStore } from "@/lib/tokens/token-store"
import type {
  ToolboxImageGenerationRequest,
  ToolboxImageGenerationResponse,
  ToolboxImageSplitRequest,
  ToolboxImageSplitResponse,
  ToolboxImageTaskResponse,
  ToolboxInfographicLogDetailResponse,
  ToolboxInfographicRequest,
  ToolboxInfographicResponse,
  ToolboxTempUploadURLRequest,
  ToolboxTempUploadURLResponse,
} from "./types"

function getOptionalAuthorizationHeaders(): HeadersInit | undefined {
  const accessToken = tokenStore.getAccessToken()
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
}

function getTaskId(taskId: string | number): string {
  return encodeURIComponent(String(taskId))
}

export const toolboxClient = {
  async createTempUploadURL(
    request: ToolboxTempUploadURLRequest
  ): Promise<ToolboxTempUploadURLResponse | ErrorResponse> {
    console.info("[Toolbox] Creating temporary image upload URL", {
      filename: request.filename,
      contentType: request.content_type,
      authenticated: Boolean(tokenStore.getAccessToken()),
    })
    // TODO(observability): add toolbox temp-upload presign counters and latency trace attributes.

    return apiRequest<ToolboxTempUploadURLResponse | ErrorResponse>(
      "/toolbox/image-generation/temp-upload-url",
      {
        method: "POST",
        credentials: "include",
        headers: getOptionalAuthorizationHeaders(),
        body: JSON.stringify(request),
      }
    )
  },

  async createImageGenerationTask(
    request: ToolboxImageGenerationRequest
  ): Promise<ToolboxImageGenerationResponse | ErrorResponse> {
    console.info("[Toolbox] Creating image generation task", {
      genMode: request.gen_mode,
      modelName: request.model_name,
      hasPrompt: Boolean(request.prompt?.trim()),
      referenceImageCount: request.reference_images?.length ?? 0,
      authenticated: Boolean(tokenStore.getAccessToken()),
    })
    // TODO(observability): add toolbox guest/auth submission counters and latency trace attributes.

    return apiRequest<ToolboxImageGenerationResponse | ErrorResponse>(
      "/toolbox/image-generation/generate",
      {
        method: "POST",
        credentials: "include",
        headers: getOptionalAuthorizationHeaders(),
        body: JSON.stringify(request),
      }
    )
  },

  async getImageTaskResult(
    taskId: string | number,
    signal?: AbortSignal
  ): Promise<ToolboxImageTaskResponse | ErrorResponse> {
    console.debug("[Toolbox] Polling image task", { taskId })

    return apiRequest<ToolboxImageTaskResponse | ErrorResponse>(
      `/toolbox/image-generation/tasks/${getTaskId(taskId)}`,
      {
        method: "GET",
        credentials: "include",
        headers: getOptionalAuthorizationHeaders(),
        signal,
      }
    )
  },

  async createImageSplitTask(
    request: ToolboxImageSplitRequest
  ): Promise<ToolboxImageSplitResponse | ErrorResponse> {
    console.info("[Toolbox] Creating image split task", {
      hasImageUrl: Boolean(request.image_url),
      numLayers: request.num_layers ?? 4,
      hasPrompt: Boolean(request.prompt?.trim()),
    })
    // TODO(observability): add toolbox split submission metrics.

    return authenticatedApiRequest<ToolboxImageSplitResponse | ErrorResponse>(
      "/toolbox/image-generation/split",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    )
  },

  async generateInfographic(
    request: ToolboxInfographicRequest
  ): Promise<ToolboxInfographicResponse | ErrorResponse> {
    console.info("[Toolbox] Creating infographic task", {
      textLength: request.text.length,
      cardStyle: request.card_style,
      screenOrientation: request.screen_orientation,
      language: request.language,
      decorationLevel: request.decoration_level,
      hasUserCustom: Boolean(request.user_custom?.trim()),
    })
    // TODO(observability): add toolbox infographic submission metrics.

    return authenticatedApiRequest<ToolboxInfographicResponse | ErrorResponse>(
      "/toolbox/infographics/generate",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    )
  },

  async getInfographicLogDetail(
    id: number
  ): Promise<ToolboxInfographicLogDetailResponse | ErrorResponse> {
    console.debug("[Toolbox] Fetching infographic detail", { logId: id })

    return authenticatedApiRequest<ToolboxInfographicLogDetailResponse | ErrorResponse>(
      `/toolbox/infographics/logs/${id}`,
      {
        method: "GET",
      }
    )
  },
}
