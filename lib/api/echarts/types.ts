"use client"

export type JoyChartType = "bar" | "line" | "pie"
export type JoyChartStatus = "pending" | "processing" | "succeeded" | "failed"
export type JoyChartSort = "none" | "asc" | "desc"
export type JoyChartOrientation = "vertical" | "horizontal"

export interface JoyChartDimension {
  id: string
  name?: string
  type?: "ordinal" | "number" | "time" | string
  role?: "category" | "value" | string
  format?: string
}

export interface JoyChartDataset {
  id?: string
  dimensions: JoyChartDimension[]
  source: Array<Record<string, string | number | boolean | null>>
}

export interface JoyChartDisplay {
  legend?: boolean
  tooltip?: boolean
  label?: boolean
  layout?: {
    orientation?: JoyChartOrientation
    stack?: boolean
    sort?: JoyChartSort
  }
  axis?: {
    showGrid?: boolean
    xLabelRotate?: number
    yFormat?: string
  }
  style?: {
    theme?: string
    emphasis?: boolean
  }
  bar?: {
    borderRadius?: number
    barWidth?: number
  }
  line?: {
    smooth?: boolean
    area?: boolean
    symbol?: boolean
  }
  pie?: {
    donut?: boolean
    rose?: boolean
    showPercent?: boolean
  }
}

export interface JoyChartReferenceContext {
  section_title?: string
  anchor_text?: string
  placement_hint?: "before" | "after" | string
  reason?: string
}

export interface JoyChartSpec {
  schemaVersion: "joychart.v1" | string
  chart: {
    type: JoyChartType | string
    title?: string
  }
  dataset: JoyChartDataset
  encoding?: Record<string, string>
  display?: JoyChartDisplay
  extensions?: {
    reference_context?: JoyChartReferenceContext
    [key: string]: unknown
  }
}

export interface EChartsLogResponse {
  id: number
  user_id?: number
  article_id?: number
  prompt: string
  schema_version?: string
  chart_type?: JoyChartType | string
  title?: string
  status: JoyChartStatus
  spec: JoyChartSpec | Record<string, never>
  error_code?: string
  error_message?: string
  version: number
  created_at: string
  updated_at: string
}

export interface GenerateEChartsRequest {
  prompt: string
  article_id?: number
  display?: JoyChartDisplay
}

export interface GenerateEChartsFromArticleRequest {
  article_id: number
  max_charts?: number
  display?: JoyChartDisplay
}

export interface GenerateEChartsFromArticleItem {
  prompt: string
  reference_context?: JoyChartReferenceContext
  log?: EChartsLogResponse
  poll_url?: string
  error_code?: string
  error_message?: string
}

export interface GenerateEChartsFromArticleResponse {
  article_id: number
  total: number
  items: GenerateEChartsFromArticleItem[]
}

export interface UpdateEChartsDisplayRequest {
  version: number
  display: JoyChartDisplay
}

export interface ReplaceEChartsSpecRequest {
  version: number
  spec: JoyChartSpec
}
