import type { CreatorConfig } from '@/components/image-generator/types'

export interface ConvertPromptRequest {
  config: CreatorConfig
  model_name?: string
}

export interface ConvertPromptResponse {
  enhanced_prompt: string
  reference_images: string[]
}
