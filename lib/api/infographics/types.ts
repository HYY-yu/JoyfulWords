import type { MessageResponse } from "@/lib/api/types"

export type InfographicCardStyle =
  | "professional"
  | "rustic"
  | "academic"
  | "handdrawn"
  | "magazine"
  | "minimal"
  | "fresh"

export type InfographicScreenOrientation = "landscape" | "portrait" | "square"

export type InfographicLanguage = "zh" | "en"

export type InfographicDecorationLevel = "simple" | "moderate" | "rich"

export type InfographicStatus = "pending" | "processing" | "success" | "failed"

export const INFOGRAPHIC_CARD_STYLES: InfographicCardStyle[] = [
  "professional",
  "rustic",
  "academic",
  "handdrawn",
  "magazine",
  "minimal",
  "fresh",
]

export const INFOGRAPHIC_SCREEN_ORIENTATIONS: InfographicScreenOrientation[] = [
  "landscape",
  "portrait",
  "square",
]

export const INFOGRAPHIC_LANGUAGES: InfographicLanguage[] = ["zh", "en"]

export const INFOGRAPHIC_DECORATION_LEVELS: InfographicDecorationLevel[] = [
  "simple",
  "moderate",
  "rich",
]

export interface GenerateInfographicRequest {
  text: string
  article_id?: number
  card_style: InfographicCardStyle
  screen_orientation: InfographicScreenOrientation
  language: InfographicLanguage
  decoration_level: InfographicDecorationLevel
  user_custom?: string
}

export interface GenerateInfographicResponse {
  log_id: number
  status: "pending"
  poll_url: string
  estimated_eta?: number
}

export interface InfographicLogDetailResponse {
  id: number
  article_id: number
  source_text: string
  structured_content: string
  card_name: string
  card_type: string
  html_content: string
  card_style: InfographicCardStyle
  screen_orientation: InfographicScreenOrientation
  language: InfographicLanguage
  decoration_level: InfographicDecorationLevel
  user_custom: string
  img_prompt: string
  provider_name: string
  model_name: string
  model_reference_id: string
  image_urls: string
  status: InfographicStatus
  error_message: string
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface CopyInfographicToMaterialsRequest {
  article_id?: number
}

export interface CopyInfographicToMaterialsResponse extends MessageResponse {
  count: number
  material_ids: number[]
}

export function parseInfographicImageUrls(rawValue: string | string[] | null | undefined): string[] {
  if (!rawValue) return []

  if (Array.isArray(rawValue)) {
    return rawValue.map((item) => item.trim()).filter(Boolean)
  }

  const trimmed = rawValue.trim()
  if (!trimmed) return []

  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    }

    if (typeof parsed === "string") {
      return [parsed.trim()].filter(Boolean)
    }
  } catch {
    return trimmed
      .split(",")
      .map((item) => item.trim().replace(/[`"']/g, ""))
      .filter(Boolean)
  }

  return []
}
