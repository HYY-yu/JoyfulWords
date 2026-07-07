import type { MessageResponse } from "@/lib/api/types"

export type PodcastType = "news_broadcast" | "two_person_interview"

export type PodcastLanguage = "auto" | "zh-CN" | "en-US"

export type PodcastGenerationStatus = "pending" | "processing" | "success" | "failed"

export type PodcastSegmentSpeed = "slow" | "medium" | "fast" | string

export type PodcastSegmentVolume = "low" | "normal" | "high" | string

export type PodcastSegmentPitch = "low" | "neutral" | "high" | string

export type PodcastOutputFormat = "mp3" | "opus"

export type PodcastSampleRate = 8000 | 16000 | 22050 | 24000 | 32000 | 44100 | 48000

export interface CreateArticlePodcastScriptRequest {
  article_id: number
  podcast_type: PodcastType
  language?: PodcastLanguage
}

export interface UpdateArticlePodcastScriptSegmentRequest {
  id: string
  text: string
}

export interface UpdateArticlePodcastScriptRequest {
  title?: string
  summary?: string
  segments?: UpdateArticlePodcastScriptSegmentRequest[]
}

export interface PodcastParticipant {
  id: string
  role: string
  display_name: string
}

export interface PodcastScriptSegment {
  id: string
  speaker_id: string
  text: string
  voice_instruction?: string
  speed?: PodcastSegmentSpeed
  volume?: PodcastSegmentVolume
  pitch?: PodcastSegmentPitch
}

export interface ArticlePodcastScriptJSON {
  schema_version: "article_podcast_script.v1" | string
  podcast_type: PodcastType | string
  language: PodcastLanguage | string
  title: string
  summary: string
  participants: PodcastParticipant[]
  segments: PodcastScriptSegment[]
  estimated_duration_seconds?: number
}

export interface ArticlePodcastScriptRecord {
  id: number
  article_id: number
  podcast_type: PodcastType
  language: PodcastLanguage | string
  exec_id: string
  status: PodcastGenerationStatus
  revision: number
  title?: string
  summary?: string
  script_json?: ArticlePodcastScriptJSON | null
  error_message?: string
  created_at: string
  updated_at: string
}

export interface CreateArticlePodcastAudioRequest {
  default_voice?: string
  voice_map?: Record<string, string>
  output_format?: PodcastOutputFormat
  sample_rate?: PodcastSampleRate
}

export interface RegenerateArticlePodcastAudioSegmentRequest {
  voice?: string
}

export type PodcastTTSVoiceSource = "wavespeed_api" | "fallback" | string

export interface PodcastTTSVoice {
  id: string
  display_name: string
  languages: string[]
}

export interface PodcastTTSVoicesResponse {
  model_name: string
  default_voice: string
  source: PodcastTTSVoiceSource
  voices: PodcastTTSVoice[]
}

export interface ArticlePodcastAudioTask {
  id: number
  script_id: number
  article_id: number
  exec_id: string
  status: PodcastGenerationStatus
  script_revision: number
  podcast_type: PodcastType
  language: PodcastLanguage | string
  title?: string
  output_format: PodcastOutputFormat
  sample_rate: PodcastSampleRate
  total_segments: number
  completed_segments: number
  failed_segments: number
  provider?: string
  model_name?: string
  provider_billable_units?: number
  provider_cost_usd?: number
  revision: number
  audio_manifest_json?: ArticlePodcastAudioManifest | null
  error_message?: string
  created_at: string
  updated_at: string
}

export interface ArticlePodcastAudioSegment {
  id: string
  index: number
  speaker_id: string
  voice: string
  audio_url: string
  text: string
  speed?: number
  volume?: number
  pitch?: number
  output_format: PodcastOutputFormat | string
  sample_rate: PodcastSampleRate | number
  provider_status: PodcastGenerationStatus | string
}

export interface ArticlePodcastAudioManifest {
  schema_version: "article_podcast_audio.v1" | string
  script_id: number
  script_revision: number
  podcast_type: PodcastType | string
  language: PodcastLanguage | string
  title: string
  output_format: PodcastOutputFormat | string
  sample_rate: PodcastSampleRate | number
  estimated_cost_usd?: number
  provider?: string
  model_name?: string
  segments: ArticlePodcastAudioSegment[]
}

export interface PodcastProgressSummary {
  total: number
  completed: number
  failed: number
  percent: number
}

export interface PodcastMessageResponse extends MessageResponse {}

export const PODCAST_TYPES: PodcastType[] = ["news_broadcast", "two_person_interview"]

export const PODCAST_LANGUAGES: PodcastLanguage[] = ["auto", "zh-CN", "en-US"]

export const PODCAST_SAMPLE_RATES: PodcastSampleRate[] = [
  8000,
  16000,
  22050,
  24000,
  32000,
  44100,
  48000,
]

export function isPodcastTerminalStatus(status: PodcastGenerationStatus | string): boolean {
  return status === "success" || status === "failed"
}

export function getSortedPodcastAudioSegments(
  manifest: ArticlePodcastAudioManifest | null | undefined
): ArticlePodcastAudioSegment[] {
  return [...(manifest?.segments ?? [])].sort((left, right) => left.index - right.index)
}

export function getPodcastAudioProgress(
  task: Pick<ArticlePodcastAudioTask, "total_segments" | "completed_segments" | "failed_segments"> | null | undefined,
  manifest?: ArticlePodcastAudioManifest | null
): PodcastProgressSummary {
  const segments = getSortedPodcastAudioSegments(manifest)
  const manifestCompleted = segments.filter((segment) => segment.provider_status === "success").length
  const manifestFailed = segments.filter((segment) => segment.provider_status === "failed").length
  const total = task?.total_segments || segments.length
  const completed = Math.max(task?.completed_segments ?? 0, manifestCompleted)
  const failed = Math.max(task?.failed_segments ?? 0, manifestFailed)
  const percent = total > 0 ? Math.min(100, Math.round(((completed + failed) / total) * 100)) : 0

  return {
    total,
    completed,
    failed,
    percent,
  }
}
