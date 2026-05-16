import type {
  CreateGenerationTaskRequest,
  CreateGenerationTaskResponse,
  CreateSplitTaskRequest,
  CreateSplitTaskResponse,
  TaskResultResponse,
} from "@/lib/api/image-generation/types"
import type {
  GenerateInfographicRequest,
  GenerateInfographicResponse,
  InfographicLogDetailResponse,
} from "@/lib/api/infographics/types"

export type ToolboxImageGenerationRequest = Omit<CreateGenerationTaskRequest, "article_id">

export type ToolboxImageGenerationResponse = CreateGenerationTaskResponse

export type ToolboxImageTaskResponse = TaskResultResponse

export interface ToolboxTempUploadURLRequest {
  filename: string
  content_type: string
}

export interface ToolboxTempUploadURLResponse {
  upload_url: string
  file_url: string
  expires_at: string
}

export type ToolboxImageSplitRequest = Omit<CreateSplitTaskRequest, "article_id">

export type ToolboxImageSplitResponse = CreateSplitTaskResponse

export type ToolboxInfographicRequest = Omit<GenerateInfographicRequest, "article_id">

export type ToolboxInfographicResponse = GenerateInfographicResponse

export type ToolboxInfographicLogDetailResponse = InfographicLogDetailResponse
