export type DocumentConversionMode = "markdown-to-word" | "ppt-to-word"

export interface DocumentTemplateRecord {
  template_id: string
  user_id: number
  type: "word"
  name: string
  original_filename: string
  config_json: WordTemplateConfig
  status: "ready" | "invalid" | string
  error_msg?: string
  created_at: string
  updated_at: string
}

export interface WordTemplateConfig {
  template_id?: string
  name?: string
  styles?: Record<string, WordStyleDetails>
  style_bindings?: Record<string, WordStyleBinding>
  mapping_rules?: WordMappingRule[]
  page_setup?: Record<string, number | string | null>
  header?: Record<string, string>
  footer?: Record<string, string>
  document?: {
    paragraph_count?: number
    table_count?: number
    section_count?: number
    inline_shape_count?: number
  }
  preview?: {
    blocks?: WordPreviewBlock[]
  }
  serialized_content?: {
    blocks?: WordPreviewBlock[]
  }
  _builtin?: boolean
}

export interface WordStyleBinding {
  markdown?: string
  style_key?: string
  template_style_label?: string
  style_id?: string
  style_name?: string
  fallback_style_id?: string
  fallback_style_name?: string
}

export interface WordMappingRule {
  role: string
  markdown: string
  template_style_label: string
  style_id?: string
  style_name?: string
}

export interface WordStyleDetails {
  style_id?: string
  style_name?: string
  font?: string
  size?: number
  bold?: boolean
  italic?: boolean
  color?: string
  alignment?: string
  space_before?: number
  space_after?: number
  line_spacing?: number
  first_line_indent?: number
  left_indent?: number
  header_bg?: string
  header_font_color?: string
  border?: string
}

export interface WordPreviewBlock {
  type: "paragraph" | "table" | "image" | string
  role?: string
  text?: string
  style?: WordStyleDetails
  rows?: string[][]
  image_count?: number
}

export interface TemplateListResponse {
  templates: DocumentTemplateRecord[]
}

export interface MarkdownToWordRequest {
  markdown: string
  template_id?: string
}

export interface ConversionTaskResponse {
  task_id: string
  status: string
  filename: string
  content_type: string
  download_url: string
  preview_markdown: string
}

export interface ApiErrorResponse {
  error?: string
  status?: number
  reason?: string
  error_description?: string
}
