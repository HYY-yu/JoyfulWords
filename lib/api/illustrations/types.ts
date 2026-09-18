export type Localized = { zh: string; en: string }
export interface DesignStyle {
  id: number
  slug: string
  name: Localized
  description: Localized
  recommended_scene: "work-report" | "knowledge-sharing" | "product-launch"
  version: number
}
export interface ColorFamily { id: number; slug: string; name: Localized }
export interface DesignPalette {
  id: number; style_id: number; color_family_id: number; version: number
  primary: string; on_primary: string; secondary: string; background: string
  surface: string; text: string; muted_text: string; border: string; chart: string[]
}
export interface DesignCatalog {
  styles: DesignStyle[]; color_families: ColorFamily[]; palettes: DesignPalette[]
}
export interface ArticleDesignState {
  binding: {
    id: number; article_id: number; created_at: string
    snapshot: { schema_version: number; style: DesignStyle; color_family: ColorFamily; palette: DesignPalette }
  } | null
  preparation: { id: number; status: "pending" | "processing" | "ready" | "failed"; error_code: string } | null
  generation_enabled: boolean
}

export type CoverPosition = "top" | "center" | "bottom"
export interface CoverPreset { id: string; width: number; height: number }
export interface CoverOptions { enabled: boolean; credits: number; presets: CoverPreset[] }
export interface CoverRecord {
  id: number; article_id: number; title: string; title_position: CoverPosition
  output_preset: string
  status: "pending" | "submitting" | "processing" | "succeeded" | "failed"
  error_code: string; credits: number; created_at: string
  result: null | { image_url: string; width: number; height: number }
}
export interface CoverRequest {
  idempotency_key: string; title_position: CoverPosition; output_preset: string
}
