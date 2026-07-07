import { authenticatedApiRequest } from "@/lib/api/client"
import type { ErrorResponse } from "@/lib/api/types"
import type {
  ArticlePodcastAudioTask,
  ArticlePodcastScriptRecord,
  CreateArticlePodcastAudioRequest,
  CreateArticlePodcastScriptRequest,
  PodcastTTSVoicesResponse,
  PodcastType,
  RegenerateArticlePodcastAudioSegmentRequest,
  UpdateArticlePodcastScriptRequest,
} from "./types"

function encodeQuery(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return
    searchParams.set(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ""
}

export const podcastClient = {
  async createArticleScript(
    request: CreateArticlePodcastScriptRequest
  ): Promise<ArticlePodcastScriptRecord | ErrorResponse> {
    console.info("[Podcast] Creating article podcast script", {
      articleId: request.article_id,
      podcastType: request.podcast_type,
      language: request.language ?? "auto",
    })

    // TODO(observability): add podcast script creation metrics and trace attributes.
    return authenticatedApiRequest<ArticlePodcastScriptRecord>("/podcast/article-scripts", {
      method: "POST",
      body: JSON.stringify(request),
    })
  },

  async getArticleScript(id: number): Promise<ArticlePodcastScriptRecord | ErrorResponse> {
    console.debug("[Podcast] Fetching article podcast script", { scriptId: id })

    return authenticatedApiRequest<ArticlePodcastScriptRecord>(`/podcast/article-scripts/${id}`, {
      method: "GET",
    })
  },

  async updateArticleScript(
    id: number,
    request: UpdateArticlePodcastScriptRequest
  ): Promise<ArticlePodcastScriptRecord | ErrorResponse> {
    console.info("[Podcast] Updating article podcast script text", {
      scriptId: id,
      segmentCount: request.segments?.length ?? 0,
      updatesTitle: typeof request.title === "string",
      updatesSummary: typeof request.summary === "string",
    })

    // TODO(observability): add podcast script text update metrics and trace attributes.
    return authenticatedApiRequest<ArticlePodcastScriptRecord>(`/podcast/article-scripts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(request),
    })
  },

  async getArticleScriptStatus(
    execId: string
  ): Promise<ArticlePodcastScriptRecord | ErrorResponse> {
    console.debug("[Podcast] Fetching article podcast script status", { execId })

    return authenticatedApiRequest<ArticlePodcastScriptRecord>(
      `/podcast/article-scripts/status/${encodeURIComponent(execId)}`,
      {
        method: "GET",
      }
    )
  },

  async getLatestArticleScript(
    articleId: number,
    podcastType: PodcastType
  ): Promise<ArticlePodcastScriptRecord | ErrorResponse> {
    console.debug("[Podcast] Fetching latest article podcast script", {
      articleId,
      podcastType,
    })

    return authenticatedApiRequest<ArticlePodcastScriptRecord>(
      `/podcast/articles/${articleId}/scripts${encodeQuery({ podcast_type: podcastType })}`,
      {
        method: "GET",
      }
    )
  },

  async getTTSVoices(): Promise<PodcastTTSVoicesResponse | ErrorResponse> {
    console.debug("[Podcast] Fetching TTS voices")

    return authenticatedApiRequest<PodcastTTSVoicesResponse>("/podcast/tts/voices", {
      method: "GET",
    })
  },

  async createArticleScriptAudio(
    scriptId: number,
    request: CreateArticlePodcastAudioRequest
  ): Promise<ArticlePodcastAudioTask | ErrorResponse> {
    console.info("[Podcast] Creating article podcast audio", {
      scriptId,
      defaultVoice: request.default_voice ?? "stokie_en",
      voiceMapCount: Object.keys(request.voice_map ?? {}).length,
      outputFormat: request.output_format ?? "mp3",
      sampleRate: request.sample_rate ?? 24000,
    })

    // TODO(observability): add podcast audio creation metrics and trace attributes.
    return authenticatedApiRequest<ArticlePodcastAudioTask>(
      `/podcast/article-scripts/${scriptId}/audio`,
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    )
  },

  async regenerateArticleScriptAudioSegment(
    scriptId: number,
    segmentId: string,
    request: RegenerateArticlePodcastAudioSegmentRequest = {}
  ): Promise<ArticlePodcastAudioTask | ErrorResponse> {
    console.info("[Podcast] Regenerating article podcast audio segment", {
      scriptId,
      segmentId,
      voice: request.voice,
    })

    // TODO(observability): add podcast segment audio regeneration metrics and trace attributes.
    return authenticatedApiRequest<ArticlePodcastAudioTask>(
      `/podcast/article-scripts/${scriptId}/audio/segments/${encodeURIComponent(segmentId)}/regenerate`,
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    )
  },

  async getAudioTask(id: number): Promise<ArticlePodcastAudioTask | ErrorResponse> {
    console.debug("[Podcast] Fetching article podcast audio task", { audioTaskId: id })

    return authenticatedApiRequest<ArticlePodcastAudioTask>(`/podcast/audio-tasks/${id}`, {
      method: "GET",
    })
  },

  async getAudioTaskStatus(execId: string): Promise<ArticlePodcastAudioTask | ErrorResponse> {
    console.debug("[Podcast] Fetching article podcast audio task status", { execId })

    return authenticatedApiRequest<ArticlePodcastAudioTask>(
      `/podcast/audio-tasks/status/${encodeURIComponent(execId)}`,
      {
        method: "GET",
      }
    )
  },

  async getArticleScriptAudio(scriptId: number): Promise<ArticlePodcastAudioTask | ErrorResponse> {
    console.debug("[Podcast] Fetching current article podcast audio", { scriptId })

    return authenticatedApiRequest<ArticlePodcastAudioTask>(
      `/podcast/article-scripts/${scriptId}/audio`,
      {
        method: "GET",
      }
    )
  },
}
