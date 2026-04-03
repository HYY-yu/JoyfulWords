import type { CreatorConfig } from '@/components/image-generator/types'

export interface ConvertPromptRequest {
  config: CreatorConfig
  model_name?: string
}

export interface ConvertPromptResponse {
  enhanced_prompt: string
  reference_images: string[]
}

// ============ 图片生成任务相关类型 ============

/**
 * 图片生成模式
 */
export type GenerationMode = 'creator' | 'style' | 'split_images'

/**
 * 创建图片生成任务请求
 */
export interface CreateGenerationTaskRequest {
  gen_mode: GenerationMode
  config?: CreatorConfig
  prompt?: string
  model_name?: string
  article_id?: number
  material_ids?: number[]
  reference_images?: string[]
}

/**
 * 创建图片生成任务响应
 */
export interface CreateGenerationTaskResponse {
  task_id: string
  status: 'pending' | 'processing' | 'success' | 'failed'
  poll_url: string
  estimated_eta?: number
}

/**
 * 任务结果响应 - 处理中
 */
export interface TaskResultProcessing {
  task_id: string
  status: 'processing'
  prompt_used: string
  model_name: string
  width: number
  height: number
  created_at: string
}

/**
 * 任务结果响应 - 等待中
 */
export interface TaskResultPending {
  task_id: string
  status: 'pending'
  prompt_used: string
  model_name: string
  width: number
  height: number
  created_at: string
}

/**
 * 任务结果响应 - 成功
 */
export interface TaskResultSuccess {
  task_id: string
  status: 'success'
  image_url: string | string[] // 可能是字符串或 JSON 数组字符串
  prompt_used: string
  model_name: string
  width: number
  height: number
  created_at: string
  completed_at: string
}

/**
 * 任务结果响应 - 失败
 */
export interface TaskResultFailed {
  task_id: string
  status: 'failed'
  error_message: string
  created_at: string
}

/**
 * 任务结果联合类型
 */
export type TaskResultResponse =
  | TaskResultPending
  | TaskResultProcessing
  | TaskResultSuccess
  | TaskResultFailed

/**
 * localStorage 存储的任务状态
 */
export interface GenerationTaskStorage {
  task_id: string
  status: 'pending' | 'processing' | 'success' | 'failed'
  prompt?: string
  created_at: string
  config?: CreatorConfig
  estimated_eta?: number
}

/**
 * 轮询配置
 */
export interface PollingConfig {
  /** 初始延迟时间（毫秒）*/
  initialDelay: number
  /** 最小延迟时间（毫秒）*/
  minDelay: number
  /** 最大延迟时间（毫秒）*/
  maxDelay: number
  /** 超时时间（毫秒）*/
  timeout: number
  /** 最大尝试次数 */
  maxAttempts: number
  /** localStorage key */
  storageKey: string
  /** 任务过期时间（毫秒）*/
  taskExpiry: number
}

/**
 * 默认轮询配置
 * - 初始延迟：10秒（首次给后端足够时间提交任务）
 * - 最小延迟：2秒
 * - 最大延迟：30秒
 * - 超时：5分钟
 * - 最大尝试：20次
 * - 任务过期：1小时
 */
export const DEFAULT_POLLING_CONFIG: PollingConfig = {
  initialDelay: 10000, // 10 seconds
  minDelay: 2000, // 2 seconds
  maxDelay: 30000, // 30 seconds
  timeout: 300000, // 5 minutes
  maxAttempts: 20,
  storageKey: 'joyfulwords-generation-task',
  taskExpiry: 3600000, // 1 hour
}

// ============ 模型和生成记录相关类型 ============

/**
 * 获取可用模型列表响应
 */
export interface GetModelsResponse {
  provider: string
  models: string[]
}

/**
 * 图片生成记录
 */
export interface GenerationLog {
  id: number
  user_id: number
  gen_mode: 'creator' | 'style' | 'split_images'
  config: string  // JSON 字符串
  prompt: string
  referenced_material_ids: number[]
  referenced_materials: Array<{
    id: number
    title: string
    material_type: 'info' | 'news' | 'image'
  }>
  reference_image_urls: string  // JSON 数组字符串
  status: 'pending' | 'processing' | 'success' | 'failed'
  image_urls: string  // JSON 数组字符串
  model_name: string
  model_reference_id: string
  created_at: string
  completed_at?: string
}

/**
 * 获取生成记录列表请求
 */
export interface GetGenerationLogsRequest {
  page: number
  page_size: number
  status?: 'pending' | 'processing' | 'success' | 'failed'
  gen_mode?: 'creator' | 'style' | 'split_images'
  model_name?: string
}

/**
 * 获取生成记录列表响应
 */
export interface GetGenerationLogsResponse {
  total: number
  list: GenerationLog[]
}

/**
 * 复制图片到素材响应
 */
export interface CopyToMaterialsResponse {
  message: string
  count: number
  material_ids: number[]
}

// ============ 风格示例相关类型 ============

/**
 * 风格示例
 */
export interface StyleExample {
  name: string
  img_url: string
  full_prompt: string
}

/**
 * 获取风格示例列表响应
 */
export interface GetStyleExamplesResponse {
  style_list: StyleExample[]
}

// ============ 图片拆分任务相关类型 ============

/**
 * 创建图片拆分任务请求
 */
export interface CreateSplitTaskRequest {
  image_url: string
  num_layers?: number
  prompt?: string
  article_id?: number
}

export interface CopyToMaterialsRequest {
  article_id?: number
}

/**
 * 创建图片拆分任务响应
 */
export interface CreateSplitTaskResponse {
  task_id: string
  status: 'pending' | 'processing' | 'success' | 'failed'
  poll_url: string
  estimated_eta?: number
  num_layers: number
}
