import { authenticatedApiRequest } from "@/lib/api/client"
import type { ErrorResponse } from "@/lib/api/types"
import type {
  ExportPresentationPPTResponse,
  GeneratePresentationLayoutRequest,
  GeneratePresentationLayoutResponse,
  GeneratePresentationStorycardRequest,
  GeneratePresentationStorycardResponse,
  PresentationHTMLResponse,
  PresentationImageStylesResponse,
  PresentationLogDetailResponse,
  PresentationPPTResponse,
  PresentationStorycardRecord,
  PresentationThemesResponse,
  RefreshPresentationStorycardResult,
  UpdatePresentationStorycardRequest,
  UpdatePresentationStorycardResponse,
} from "./types"
import { normalizePresentationStorycardDocument } from "./types"

async function getCurrentStorycard(articleId: number) {
  return authenticatedApiRequest<PresentationStorycardRecord | ErrorResponse>(
    `/presentations/storycard?article_id=${articleId}`,
    { method: "GET" }
  )
}

export const presentationsClient = {
  async generateStorycard(
    request: GeneratePresentationStorycardRequest
  ): Promise<GeneratePresentationStorycardResponse | ErrorResponse> {
    console.info("[Presentations] Generating storycard", {
      articleId: request.article_id,
      language: request.language,
      forceRegenerate: request.force_regenerate ?? false,
    })

    return authenticatedApiRequest<GeneratePresentationStorycardResponse>(
      "/presentations/storycard/generate",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    )
  },

  async getStorycard(
    articleId: number
  ): Promise<PresentationStorycardRecord | ErrorResponse> {
    console.debug("[Presentations] Fetching storycard", { articleId })
    const result = await getCurrentStorycard(articleId)
    if ("error" in result) {
      return result
    }

    return {
      ...result,
      storycard_json: normalizePresentationStorycardDocument(result.storycard_json),
    }
  },

  async refreshStorycard(
    articleId: number,
    language: GeneratePresentationStorycardRequest["language"],
    forceRegenerate = false
  ): Promise<RefreshPresentationStorycardResult | ErrorResponse> {
    const generated = await this.generateStorycard({
      article_id: articleId,
      language,
      force_regenerate: forceRegenerate,
    })

    if ("error" in generated) {
      return generated
    }

    const storycard = await getCurrentStorycard(articleId)
    if ("error" in storycard) {
      if (storycard.status === 404) {
        return {
          storycard: null,
          logId: generated.presentation_log_id ?? null,
          status: generated.status,
        }
      }

      return storycard
    }

    return {
      storycard: {
        ...storycard,
        storycard_json: normalizePresentationStorycardDocument(storycard.storycard_json),
      },
      logId: generated.presentation_log_id ?? null,
      status: generated.already_created ? "already_created" : generated.status,
    }
  },

  async updateStorycard(
    storycardId: number,
    request: UpdatePresentationStorycardRequest
  ): Promise<UpdatePresentationStorycardResponse | ErrorResponse> {
    console.info("[Presentations] Updating storycard", {
      storycardId,
      version: request.version,
      slideCount: Array.isArray(request.storycard_json?.slides)
        ? request.storycard_json.slides.length
        : 0,
    })

    return authenticatedApiRequest<UpdatePresentationStorycardResponse>(
      `/presentations/storycards/${storycardId}`,
      {
        method: "PUT",
        body: JSON.stringify({
          ...request,
          storycard_json: normalizePresentationStorycardDocument(request.storycard_json),
        }),
      }
    )
  },

  async getThemes(): Promise<PresentationThemesResponse | ErrorResponse> {
    return authenticatedApiRequest<PresentationThemesResponse>("/presentations/layouts/themes", {
      method: "GET",
    })
  },

  async getImageStyles(): Promise<PresentationImageStylesResponse | ErrorResponse> {
    return authenticatedApiRequest<PresentationImageStylesResponse>(
      "/presentations/layouts/image-styles",
      {
        method: "GET",
      }
    )
  },

  async generateLayout(
    request: GeneratePresentationLayoutRequest
  ): Promise<GeneratePresentationLayoutResponse | ErrorResponse> {
    console.info("[Presentations] Generating layout", {
      storycardId: request.storycard_id,
      storycardVersion: request.storycard_version,
      theme: request.theme ?? null,
      transition: request.transition ?? null,
      imageStyle: request.image_style?.id ?? null,
    })

    return authenticatedApiRequest<GeneratePresentationLayoutResponse>(
      "/presentations/layouts/generate",
      {
        method: "POST",
        body: JSON.stringify({
          ...request,
          storycard_json: request.storycard_json
            ? normalizePresentationStorycardDocument(request.storycard_json)
            : undefined,
        }),
      }
    )
  },

  async getLogDetail(
    id: number
  ): Promise<PresentationLogDetailResponse | ErrorResponse> {
    return authenticatedApiRequest<PresentationLogDetailResponse>(`/presentations/logs/${id}`, {
      method: "GET",
    })
  },

  async getHTML(
    id: number
  ): Promise<PresentationHTMLResponse | ErrorResponse> {
    return authenticatedApiRequest<PresentationHTMLResponse>(`/presentations/logs/${id}/html`, {
      method: "GET",
    })
  },

  async exportPPT(
    id: number
  ): Promise<ExportPresentationPPTResponse | ErrorResponse> {
    console.info("[Presentations] Exporting PPT", { presentationLogId: id })
    return authenticatedApiRequest<ExportPresentationPPTResponse>(
      `/presentations/logs/${id}/ppt/export`,
      {
        method: "POST",
      }
    )
  },

  async getPPT(
    id: number
  ): Promise<PresentationPPTResponse | ErrorResponse> {
    return authenticatedApiRequest<PresentationPPTResponse>(`/presentations/logs/${id}/ppt`, {
      method: "GET",
    })
  },
}
