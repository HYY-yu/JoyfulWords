import { apiRequest } from '@/lib/api/client'
import type {
  ConvertPromptRequest,
  ConvertPromptResponse,
  CreateGenerationTaskRequest,
  CreateGenerationTaskResponse,
  TaskResultResponse,
  GetModelsResponse,
  GetGenerationLogsRequest,
  GetGenerationLogsResponse,
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

  /**
   * 创建图片生成任务
   * POST /image-generation/generate
   *
   * 创建异步图片生成任务，返回 task_id 用于轮询结果
   *
   * @param request - 创建任务请求对象
   * @returns Promise<CreateGenerationTaskResponse | ErrorResponse>
   *
   * @example
   * const result = await imageGenerationClient.createGenerationTask({
   *   prompt: 'A beautiful landscape',
   *   model_name: 'flux'
   * })
   * if ('error' in result) {
   *   console.error(result.error)
   * } else {
   *   console.log(result.task_id)
   * }
   */
  async createGenerationTask(request: CreateGenerationTaskRequest) {
    const token = localStorage.getItem('access_token')

    // TRACE: 任务创建入口 - 记录请求参数
    console.debug('[ImageGeneration] Creating generation task:', {
      hasPrompt: !!request.prompt,
      hasConfig: !!request.config,
      modelName: request.model_name,
      materialIds: request.material_ids,
      referenceImageCount: request.reference_images?.length || 0,
    })

    return apiRequest<CreateGenerationTaskResponse>('/image-generation/generate', {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(request),
    })
  },

  /**
   * 获取任务结果
   * GET /image-generation/tasks/:task_id
   *
   * 轮询获取图片生成任务的结果
   *
   * @param taskId - 任务 ID
   * @param signal - AbortSignal 用于取消请求
   * @returns Promise<TaskResultResponse | ErrorResponse>
   *
   * @example
   * const result = await imageGenerationClient.getTaskResult('img_abc123')
   * if ('error' in result) {
   *   console.error(result.error)
   * } else if (result.status === 'success') {
   *   console.log(result.image_url)
   * }
   */
  async getTaskResult(taskId: string, signal?: AbortSignal) {
    const token = localStorage.getItem('access_token')

    // TRACE: 轮询节点 - 记录轮询尝试
    console.debug('[ImageGeneration] Polling task result:', taskId)

    return apiRequest<TaskResultResponse>(`/image-generation/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      signal,  // 传递 signal 以支持请求取消
    })
  },

  /**
   * 获取可用的图片生成模型列表
   * GET /image-generation/models
   *
   * @returns Promise<GetModelsResponse | ErrorResponse>
   *
   * @example
   * const result = await imageGenerationClient.getModels()
   * if ('error' in result) {
   *   console.error(result.error)
   * } else {
   *   console.log(result.provider, result.models)
   * }
   */
  async getModels() {
    console.debug('[ImageGeneration] Fetching available models...')
    return apiRequest<GetModelsResponse>('/image-generation/models', {
      method: 'GET',
    })
  },

  /**
   * 获取图片生成记录列表
   * GET /image-generation/logs
   *
   * @param request - 查询参数
   * @returns Promise<GetGenerationLogsResponse | ErrorResponse>
   *
   * @example
   * const result = await imageGenerationClient.getGenerationLogs({
   *   page: 1,
   *   page_size: 20,
   *   status: 'success',
   * })
   */
  async getGenerationLogs(request: GetGenerationLogsRequest) {
    const token = localStorage.getItem('access_token')

    console.debug('[ImageGeneration] Fetching generation logs:', {
      page: request.page,
      pageSize: request.page_size,
      status: request.status,
      genMode: request.gen_mode,
    })

    const params = new URLSearchParams({
      page: String(request.page),
      page_size: String(request.page_size),
    })

    if (request.status) params.append('status', request.status)
    if (request.gen_mode) params.append('gen_mode', request.gen_mode)
    if (request.model_name) params.append('model_name', request.model_name)

    return apiRequest<GetGenerationLogsResponse>(
      `/image-generation/logs?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      }
    )
  },
}
