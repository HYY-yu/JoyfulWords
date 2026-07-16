import { authenticatedApiRequest } from "@/lib/api/client"
import type { ErrorResponse } from "@/lib/api/types"
import type {
  ConfirmStorycardRequest,
  CreateGenerationRequest,
  GenerateStorycardRequest,
  GenerationResponse,
  ImageStylesResponse,
  PPTTemplate,
  PPTTemplatesResponse,
  StorycardResponse,
  UpdateStorycardRequest,
} from "./types"

export type PresentationV2Result<T> = T | ErrorResponse

function request<T>(endpoint: string, options: RequestInit = {}) {
  return authenticatedApiRequest<PresentationV2Result<T>>(endpoint, options)
}

export const presentationsV2Client = {
  generateStorycard(body: GenerateStorycardRequest) {
    console.info("[PresentationV2] Generating storycard", {
      articleId: body.article_id,
      language: body.language,
    })
    return request<StorycardResponse>("/presentations/v2/storycards/generate", {
      method: "POST",
      body: JSON.stringify(body),
    })
  },

  getStorycard(articleId: number, signal?: AbortSignal) {
    console.debug("[PresentationV2] Fetching storycard", { articleId })
    return request<StorycardResponse>(
      `/presentations/v2/storycards?article_id=${encodeURIComponent(articleId)}`,
      { method: "GET", signal }
    )
  },

  updateStorycard(storycardId: number, body: UpdateStorycardRequest) {
    console.info("[PresentationV2] Saving storycard", {
      storycardId,
      version: body.version,
      slideCount: body.storycard.slides.length,
    })
    return request<StorycardResponse>(`/presentations/v2/storycards/${storycardId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    })
  },

  confirmStorycard(storycardId: number, body: ConfirmStorycardRequest) {
    console.info("[PresentationV2] Confirming storycard", {
      storycardId,
      version: body.version,
    })
    return request<StorycardResponse>(`/presentations/v2/storycards/${storycardId}/confirm`, {
      method: "POST",
      body: JSON.stringify(body),
    })
  },

  listTemplates(signal?: AbortSignal) {
    console.debug("[PresentationV2] Fetching templates")
    return request<PPTTemplatesResponse>("/presentations/v2/templates", {
      method: "GET",
      signal,
    })
  },

  getTemplate(templateKey: string, version: number, signal?: AbortSignal) {
    return request<PPTTemplate>(
      `/presentations/v2/templates/${encodeURIComponent(templateKey)}/versions/${version}`,
      { method: "GET", signal }
    )
  },

  listImageStyles(signal?: AbortSignal) {
    console.debug("[PresentationV2] Fetching image styles")
    return request<ImageStylesResponse>("/presentations/v2/image-styles", {
      method: "GET",
      signal,
    })
  },

  createGeneration(body: CreateGenerationRequest) {
    console.info("[PresentationV2] Creating generation", {
      storycardId: body.storycard_id,
      storycardVersion: body.storycard_version,
      templateKey: body.template_key,
      templateVersion: body.template_version,
      imageStyleId: body.image_style_id,
    })
    return request<GenerationResponse>("/presentations/v2/generations", {
      method: "POST",
      body: JSON.stringify(body),
    })
  },

  getGeneration(generationId: number, signal?: AbortSignal) {
    console.debug("[PresentationV2] Fetching generation", { generationId })
    return request<GenerationResponse>(`/presentations/v2/generations/${generationId}`, {
      method: "GET",
      signal,
    })
  },

  getGenerationPptx(generationId: number, signal?: AbortSignal) {
    return request<GenerationResponse>(`/presentations/v2/generations/${generationId}/pptx`, {
      method: "GET",
      signal,
    })
  },

  retryGeneration(generationId: number) {
    console.info("[PresentationV2] Retrying generation", { generationId })
    return request<GenerationResponse>(`/presentations/v2/generations/${generationId}/retry`, {
      method: "POST",
    })
  },
}
