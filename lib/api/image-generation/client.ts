import { apiRequest } from '@/lib/api/client'
import type {
  ConvertPromptRequest,
  ConvertPromptResponse,
} from './types'

/**
 * Image Generation API Client
 * 提供图片生成相关的 API 调用方法
 */
export const imageGenerationClient = {
  /**
   * 提示词转换
   * POST /image-generation/convert-prompt
   *
   * 将 CreatorConfig 转换为专业提示词
   *
   * @param config - CreatorConfig 配置对象
   * @param modelName - 可选的模型名称
   * @returns Promise<ConvertPromptResponse | ErrorResponse>
   *
   * @example
   * const result = await imageGenerationClient.convertPrompt(creatorConfig, 'flux')
   * if ('error' in result) {
   *   console.error(result.error)
   * } else {
   *   console.log(result.enhanced_prompt)
   *   console.log(result.reference_images)
   * }
   */
  async convertPrompt(
    config: ConvertPromptRequest['config'],
    modelName?: ConvertPromptRequest['model_name']
  ) {
    const token = localStorage.getItem('access_token')

    return apiRequest<ConvertPromptResponse>('/image-generation/convert-prompt', {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({
        config,
        model_name: modelName,
      } as ConvertPromptRequest),
    })
  },
}
