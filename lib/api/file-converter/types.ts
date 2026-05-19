export type FileConverterFormat = "pdf" | "word" | "json" | "markdown"

export type FileConverterSourceTab = "file" | "json" | "markdown"

export interface TextConvertRequest {
  source_type: Extract<FileConverterFormat, "json" | "markdown">
  target_type: FileConverterFormat
  content: string
}

export interface TextConvertResponse {
  data: string
}

export interface FileConvertResult {
  kind: "file"
  blob: Blob
  fileName: string
  contentType: string
}

export interface TextConvertResult {
  kind: "text"
  data: string
}

export type ConvertResult = FileConvertResult | TextConvertResult

export interface ApiErrorResponse {
  error?: string
}
