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
  CopyToMaterialsResponse,
  CopyToMaterialsRequest,
  GetStyleExamplesResponse,
  CreateSplitTaskRequest,
  CreateSplitTaskResponse,
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
      articleId: request.article_id,
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
    const token = localStorage.getItem('access_token')
    console.debug('[ImageGeneration] Fetching available models...')
    return apiRequest<GetModelsResponse>('/image-generation/models', {
      method: 'GET',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
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

  /**
   * 复制图片生成记录到素材库
   * POST /image-generation/logs/:id/copy-to-materials
   *
   * @param logId - 图片生成记录ID (task_id)
   * @returns Promise<CopyToMaterialsResponse | ErrorResponse>
   *
   * @example
   * const result = await imageGenerationClient.copyToMaterials(123)
   * if ('error' in result) {
   *   console.error(result.error)
   * } else {
   *   console.log(`已复制 ${result.count} 张图片到素材库`)
   * }
   */
  async copyToMaterials(logId: number, articleId?: number) {
    const token = localStorage.getItem('access_token')
    const requestBody: CopyToMaterialsRequest | undefined =
      typeof articleId === 'number' ? { article_id: articleId } : undefined

    console.info('[ImageGeneration] Copying log to materials:', {
      logId,
      articleId: requestBody?.article_id ?? null,
    })

    return apiRequest<CopyToMaterialsResponse>(
      `/image-generation/logs/${logId}/copy-to-materials`,
      {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: requestBody ? JSON.stringify(requestBody) : undefined,
      }
    )
  },

  /**
   * 获取风格示例列表
   * GET /image-generation/style-examples
   *
   * 获取可用的风格示例列表
   *
   * @returns Promise<GetStyleExamplesResponse | ErrorResponse>
   *
   * @example
   * const result = await imageGenerationClient.getStyleExamples()
   * if ('error' in result) {
   *   console.error(result.error)
   * } else {
   *   console.log(result.style_list)
   * }
   */
  async getStyleExamples() {
    console.debug('[ImageGeneration] Fetching style examples...')
    return apiRequest<GetStyleExamplesResponse>('/image-generation/style-examples', {
      method: 'GET',
    })
  },

  /**
   * 创建图片拆分任务
   * POST /image-generation/split
   *
   * 创建异步图片拆分任务，返回 task_id 用于轮询结果
   *
   * @param request - 创建拆分任务请求对象
   * @returns Promise<CreateSplitTaskResponse | ErrorResponse>
   *
   * @example
   * const result = await imageGenerationClient.createSplitTask({
   *   image_url: 'https://example.com/image.jpg',
   *   num_layers: 4,
   *   prompt: 'A beautiful landscape'
   * })
   * if ('error' in result) {
   *   console.error(result.error)
   * } else {
   *   console.log(result.task_id)
   * }
   */
  async createSplitTask(request: CreateSplitTaskRequest) {
    const token = localStorage.getItem('access_token')

    // TRACE: 任务创建入口 - 记录请求参数
    console.debug('[ImageGeneration] Creating split task:', {
      hasImageUrl: !!request.image_url,
      numLayers: request.num_layers || 4,
      hasPrompt: !!request.prompt,
      articleId: request.article_id,
    })

    return apiRequest<CreateSplitTaskResponse>('/image-generation/split', {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(request),
    })
  },
}
