import type {
  CreateGenerationTaskRequest,
  CreateGenerationTaskResponse,
  TaskResultResponse,
} from "@/lib/api/image-generation/types"
import type {
  GenerateInfographicRequest,
  GenerateInfographicResponse,
  InfographicLogDetailResponse,
} from "@/lib/api/infographics/types"
import type {
  EChartsLogResponse,
  JoyChartDisplay,
  JoyChartSpec,
  JoyChartType,
} from "@/lib/api/echarts/types"

export const TOOLBOX_GUEST_MODEL = "nano-banana-2-fast"

export const TOOLBOX_IMAGE_MODELS = [
  TOOLBOX_GUEST_MODEL,
  "nano-banana-2",
  "flux-2-max",
  "qwen-image-2.0-pro",
  "gpt-image-2",
  "bytedance/seedream-v4.5",
  "bytedance/seedream-v5.0-lite",
] as const

export type ToolboxImageModel = (typeof TOOLBOX_IMAGE_MODELS)[number]

export type ToolboxCreateImageTaskRequest = CreateGenerationTaskRequest

export type ToolboxCreateImageTaskResponse = CreateGenerationTaskResponse

export type ToolboxImageTaskResultResponse = TaskResultResponse

export interface ToolboxTempUploadURLRequest {
  filename: string
  content_type: string
}

export interface ToolboxTempUploadURLResponse {
  upload_url: string
  file_url: string
  expires_at: string
}

export type ToolboxGenerateInfographicRequest = GenerateInfographicRequest

export type ToolboxGenerateInfographicResponse = GenerateInfographicResponse

export type ToolboxInfographicLogDetailResponse = InfographicLogDetailResponse

export interface ToolboxGenerateEChartRequest {
  data_text: string
  requirement: string
  display?: JoyChartDisplay
}

export interface ToolboxGenerateEChartGuestResponse {
  schema_version?: "joychart.v1" | string
  chart_type?: JoyChartType | string
  title?: string
  spec: JoyChartSpec
}

export type ToolboxGenerateEChartResponse =
  | ToolboxGenerateEChartGuestResponse
  | EChartsLogResponse
