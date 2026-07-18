import { apiRequest, getLanguageHeader } from "@/lib/api/client"
import { getValidAccessToken } from "@/lib/tokens/refresh"
import { tokenStore } from "@/lib/tokens/token-store"
import type {
  ToolboxCreateImageTaskRequest,
  ToolboxCreateImageTaskResponse,
  ToolboxCompleteTempUploadResponse,
  ToolboxGenerateInfographicRequest,
  ToolboxGenerateInfographicResponse,
  ToolboxGenerateEChartRequest,
  ToolboxGenerateEChartResponse,
  ToolboxImageTaskResultResponse,
  ToolboxInfographicLogDetailResponse,
  ToolboxTempUploadURLResponse,
} from "./types"

interface ToolboxRequestOptions {
  preferAuth?: boolean
  signal?: AbortSignal
}

async function getOptionalAuthorizationHeader(preferAuth: boolean): Promise<HeadersInit | undefined> {
  if (!preferAuth) return undefined

  const token = tokenStore.getAccessToken() && !tokenStore.isTokenExpired()
    ? tokenStore.getAccessToken()
    : await getValidAccessToken()

  if (!token) return undefined
  return { Authorization: `Bearer ${token}` }
}

async function toolboxApiRequest<T>(
  endpoint: string,
  init: RequestInit,
  options: ToolboxRequestOptions = {}
) {
  const authHeader = await getOptionalAuthorizationHeader(Boolean(options.preferAuth))

  return apiRequest<T>(endpoint, {
    ...init,
    credentials: "include",
    signal: options.signal,
    headers: {
      ...authHeader,
      ...init.headers,
    },
  })
}

export const toolboxClient = {
  async createImageTask(
    request: ToolboxCreateImageTaskRequest,
    options: ToolboxRequestOptions = {}
  ) {
    console.debug("[Toolbox] Creating image generation task", {
      genMode: request.gen_mode,
      hasConfig: Boolean(request.config),
      hasPrompt: Boolean(request.prompt?.trim()),
      modelName: request.model_name,
      referenceImageCount: request.reference_images?.length ?? 0,
      preferAuth: Boolean(options.preferAuth),
    })

    return toolboxApiRequest<ToolboxCreateImageTaskResponse>(
      "/toolbox/image-generation/generate",
      {
        method: "POST",
        body: JSON.stringify(request),
      },
      options
    )
  },

  async getImageTask(taskId: string, options: ToolboxRequestOptions = {}) {
    console.debug("[Toolbox] Polling image generation task", {
      taskId,
      preferAuth: Boolean(options.preferAuth),
    })

    return toolboxApiRequest<ToolboxImageTaskResultResponse>(
      `/toolbox/image-generation/tasks/${taskId}`,
      { method: "GET" },
      options
    )
  },

  async createTempUploadURL(file: File, options: ToolboxRequestOptions = {}) {
    console.debug("[Toolbox] Creating temp upload URL", {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      preferAuth: Boolean(options.preferAuth),
    })

    return toolboxApiRequest<ToolboxTempUploadURLResponse>(
      "/toolbox/image-generation/temp-upload-url",
      {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type || "image/png",
          size_bytes: file.size,
        }),
      },
      options
    )
  },

  async uploadReferenceImage(file: File, options: ToolboxRequestOptions = {}) {
    const tempUpload = await this.createTempUploadURL(file, options)

    if ("error" in tempUpload) {
      return tempUpload
    }

    const uploadResponse = await fetch(tempUpload.upload_url, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "image/png",
        "Accept-Language": getLanguageHeader(),
      },
      body: file,
    })

    if (!uploadResponse.ok) {
      console.error("[Toolbox] Temp image upload failed", {
        status: uploadResponse.status,
        fileName: file.name,
      })

      return {
        error: "Upload failed",
        status: uploadResponse.status,
      }
    }

    const completed = await toolboxApiRequest<ToolboxCompleteTempUploadResponse>(
      "/toolbox/image-generation/temp-upload-complete",
      {
        method: "POST",
        body: JSON.stringify({ upload_token: tempUpload.upload_token }),
      },
      options
    )

    if ("error" in completed) {
      return completed
    }

    console.info("[Toolbox] Reference image uploaded", {
      fileName: file.name,
      fileUrl: completed.file_url,
    })

    return {
      file_url: completed.file_url,
    }
  },

  async createInfographicTask(
    request: ToolboxGenerateInfographicRequest,
    options: ToolboxRequestOptions = {}
  ) {
    console.info("[Toolbox] Creating infographic task", {
      articleId: request.article_id ?? 0,
      cardStyle: request.card_style,
      screenOrientation: request.screen_orientation,
      language: request.language,
      decorationLevel: request.decoration_level,
      textLength: request.text.length,
      hasUserCustom: Boolean(request.user_custom?.trim()),
    })

    // TODO(observability): add toolbox infographic task creation metrics and trace attributes.
    return toolboxApiRequest<ToolboxGenerateInfographicResponse>(
      "/toolbox/infographics/generate",
      {
        method: "POST",
        body: JSON.stringify(request),
      },
      {
        ...options,
        preferAuth: true,
      }
    )
  },

  async getInfographicLog(id: number, options: ToolboxRequestOptions = {}) {
    console.debug("[Toolbox] Polling infographic task", { logId: id })

    return toolboxApiRequest<ToolboxInfographicLogDetailResponse>(
      `/toolbox/infographics/logs/${id}`,
      { method: "GET" },
      {
        ...options,
        preferAuth: true,
      }
    )
  },

  async generateEChart(
    request: ToolboxGenerateEChartRequest,
    options: ToolboxRequestOptions = {}
  ) {
    console.info("[Toolbox] Generating AI chart", {
      dataTextLength: request.data_text.length,
      requirementLength: request.requirement.length,
      theme: request.display?.style?.theme ?? null,
      preferAuth: Boolean(options.preferAuth),
    })

    // TODO(observability): add toolbox AI chart generation counters by actor type and result status.
    return toolboxApiRequest<ToolboxGenerateEChartResponse>(
      "/toolbox/echarts/generate",
      {
        method: "POST",
        body: JSON.stringify(request),
      },
      options
    )
  },
}
