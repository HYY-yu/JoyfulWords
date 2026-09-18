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

export interface InfographicRequest {
  max_count: number
  idempotency_key: string; source: "article" | "selection"; text: string
  orientation: "landscape" | "portrait" | "square"; language: "zh" | "en"
}
export interface InfographicRecord {
  max_count: number; is_batch: boolean; analysis_model: string; cards?: InfographicRecord[]
  card?: { name: string; type: string; html_content: string; article_excerpt: string; article_anchor: string; selection_reason: string }
  id: number; article_id: number; title: string; source: InfographicRequest["source"]; source_text: string
  orientation: InfographicRequest["orientation"]; language: InfographicRequest["language"]
  model: string; design: NonNullable<ArticleDesignState["binding"]>["snapshot"]
  status: CoverRecord["status"] | "analyzing" | "partial" | "empty"; error_code: string; credits: number; created_at: string
  result: CoverRecord["result"]
}
export interface InfographicOptions { enabled: boolean; credits: number; presets: CoverPreset[] }

export interface VisualProfile { version: number; theme: string; motif: string; material: string; lighting: string; palette_rule: string }
export interface ArtworkReference { kind: "cover" | "artwork"; id: number; url: string }
export interface ArtworkRequest {
 max_count: number; idempotency_key: string; source: "article" | "selection"; text: string
 orientation: "landscape" | "portrait" | "square"
}
export interface ArtworkRecord {
 max_count: number; is_batch: boolean; analysis_model: string; cards?: ArtworkRecord[]
 card?: { name: string; subjects?: { source_term: string; depiction: string }[]; scene: string; article_excerpt: string; article_anchor: string; selection_reason: string }
 id: number; article_id: number; title: string; source: ArtworkRequest["source"]; source_text: string
 orientation: ArtworkRequest["orientation"]; model: string; design: NonNullable<ArticleDesignState["binding"]>["snapshot"]
 rendering_style?: { material: string; lighting: string; palette_rule: string }; visual_profile: VisualProfile; reference?: ArtworkReference
 status: InfographicRecord["status"]; error_code: string; credits: number; created_at: string; result: CoverRecord["result"]
}
export type ArtworkOptions = InfographicOptions
