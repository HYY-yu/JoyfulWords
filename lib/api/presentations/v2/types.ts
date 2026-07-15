export type PPTLanguage = "zh" | "en"

export type PPTPageType = "封面页" | "目录页" | "章节过渡页" | "内容页" | "结尾页"

export interface StorycardSlide {
  id: string
  page_type: PPTPageType
  title: string
  key_message: string
  content_points: string[]
  relation_hint: string
  visual_hint: string
  source_refs: string[]
}

export interface StorycardDocument {
  schema_version: 1
  article_id: number
  title: string
  language: PPTLanguage
  audience: string
  presentation_goal: string
  narrative_structure: string
  slides: StorycardSlide[]
}

export type StorycardStatus = "generating" | "draft" | "confirmed" | "failed"

export interface StorycardResponse {
  id: number
  article_id: number
  version: number
  status: StorycardStatus
  language: PPTLanguage
  title: string
  storycard: StorycardDocument | Record<string, never>
  error_code: string
  error_message: string
  created_at: string
  updated_at: string
}

export interface PPTTemplate {
  id: number
  template_key: string
  version: number
  name_i18n: Record<PPTLanguage, string>
  description_i18n: Record<PPTLanguage, string>
  metadata: Record<string, unknown>
  cover_url: string
}

export interface PPTTemplatesResponse {
  templates: PPTTemplate[]
}

export type GenerationStatus = "queued" | "processing" | "succeeded" | "failed"

export type GenerationStage =
  | "queued"
  | "preparing"
  | "matching_templates"
  | "selecting_pages"
  | "filling_deck_input"
  | "validating_input"
  | "resolving_assets"
  | "generating_pptx"
  | "verifying_pptx"
  | "uploading"
  | "succeeded"
  | "failed"

export interface GenerationResponse {
  id: number
  article_id: number
  storycard_id: number
  template_id: number
  status: GenerationStatus
  stage: GenerationStage
  slide_count: number
  pptx_url: string
  error_code: string
  error_message: string
  verify_report: Record<string, unknown>
  created_at: string
  updated_at: string
  completed_at: string
}

export interface GenerateStorycardRequest {
  article_id: number
  language: PPTLanguage
}

export interface UpdateStorycardRequest {
  version: number
  storycard: StorycardDocument
}

export interface ConfirmStorycardRequest {
  version: number
}

export interface CreateGenerationRequest {
  storycard_id: number
  storycard_version: number
  template_key: string
  template_version: number
}

