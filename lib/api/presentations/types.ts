import type { MessageResponse } from "@/lib/api/types"

export type PresentationLanguage = "zh" | "en"
export type PresentationStatus = "pending" | "processing" | "success" | "failed" | "already_created"
export type PresentationTaskKind = "storycard_generate" | "layout_generate" | "ppt_export"
export type PresentationStage =
  | "storycard_generate"
  | "layout_generate"
  | "generate_images"
  | "render_html"
  | "render_ppt"
  | "completed"
  | "failed"

export type PresentationTransition = "none" | "fade" | "push" | "wipe" | "cut" | "slide"

export interface PresentationStorycardImage {
  mode?: string
  prompt?: string
  image_url?: string
  [key: string]: unknown
}

export interface PresentationStorycardSlide {
  id: string
  headline?: string
  subheadline?: string
  speaker_notes?: string
  body?: string[]
  image?: PresentationStorycardImage
  [key: string]: unknown
}

export interface PresentationStorycardDocument {
  version?: number
  article_id?: number
  title?: string
  language?: PresentationLanguage
  slides?: PresentationStorycardSlide[]
  [key: string]: unknown
}

export interface PresentationStorycardRecord {
  id: number
  article_id: number
  version: number
  status: PresentationStatus
  title: string
  language: PresentationLanguage
  model_name: string
  error_message: string
  storycard_json: PresentationStorycardDocument
  created_at: string
  updated_at: string
}

export interface GeneratePresentationStorycardRequest {
  article_id: number
  language: PresentationLanguage
  force_regenerate?: boolean
}

export interface GeneratePresentationStorycardResponse {
  storycard_id: number
  presentation_log_id?: number
  status: "processing" | "success" | "already_created"
  already_created?: boolean
}

export interface UpdatePresentationStorycardRequest {
  version: number
  storycard_json: PresentationStorycardDocument
}

export interface UpdatePresentationStorycardResponse {
  id: number
  version: number
}

export interface PresentationThemeConfig {
  [key: string]: unknown
}

export interface PresentationThemesResponse {
  default_theme: string
  themes: Record<string, PresentationThemeConfig>
}

export interface PresentationImageStyle {
  id: string
  label: string
  prompt_suffix: string
}

export interface PresentationImageStylesResponse {
  default_style: string
  style: PresentationImageStyle[]
}

export interface GeneratePresentationLayoutRequest {
  storycard_id: number
  storycard_version: number
  storycard_json?: PresentationStorycardDocument
  theme?: string
  transition?: PresentationTransition
  image_style?: PresentationImageStyle
  title?: string
  subtitle?: string
  author?: string
}

export interface GeneratePresentationLayoutResponse {
  presentation_log_id: number
  status: "processing"
}

export interface PresentationLogDetailResponse {
  id: number
  article_id: number
  storycard_id: number
  task_kind: PresentationTaskKind | string
  stage: PresentationStage | string
  status: PresentationStatus
  slide_count: number
  model_name: string
  error_message: string
  layouts_json?: unknown
  deck_model_json?: unknown
  render_html?: string
  ppt_url?: string
  created_at: string
  updated_at: string
  completed_at?: string | null
}

export interface PresentationHTMLResponse {
  id: number
  status: PresentationStatus
  html_content: string
}

export interface ExportPresentationPPTResponse {
  presentation_log_id: number
  status: "processing"
}

export interface PresentationPPTResponse {
  id: number
  status: PresentationStatus
  ppt_url: string
}

export interface PresentationDownloadResult {
  download_url: string
}

export interface PresentationStorycardSummary {
  storycard: PresentationStorycardRecord | null
  source: "current" | "generated" | "missing"
}

export interface RefreshPresentationStorycardResult {
  storycard: PresentationStorycardRecord | null
  logId: number | null
  status: "processing" | "success" | "already_created" | "missing"
}

export function normalizePresentationStorycardDocument(
  storycard: PresentationStorycardDocument | null | undefined
): PresentationStorycardDocument {
  const cloned = JSON.parse(JSON.stringify(storycard ?? {})) as PresentationStorycardDocument
  if (!Array.isArray(cloned.slides)) {
    cloned.slides = []
    return cloned
  }

  cloned.slides = cloned.slides.map((slide, index) => {
    const nextSlide = { ...slide } as PresentationStorycardSlide & Record<string, unknown>
    delete nextSlide.kind

    return nextSlide
  })

  return cloned
}

export interface PresentationMessageResponse extends MessageResponse {}
