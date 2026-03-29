/**
 * Material API Types
 * 所有类型定义来自后端 API 文档
 */

// ==================== Entity Enums ====================

/**
 * 素材类型枚举（来自 API 定义）
 */
export type MaterialType = 'info' | 'news' | 'image'

/**
 * 搜索状态枚举（来自 API 定义）
 */
export type MaterialStatus = 'doing' | 'success' | 'failed' | 'nodata'

// ==================== Entity Types ====================

/**
 * 素材实体
 */
export interface Material {
  id: number
  user_id: number
  material_logs_id: number // 搜索日志 ID，用户上传的素材为 0
  article_id: number
  is_favorite: boolean
  favorite_id: number
  title: string // 素材标题 (1-200 字符)
  material_type: MaterialType
  source_url: string // 素材原链接
  content: string // 素材内容（文本或图片 URL）
  created_at: string // ISO 8601 格式时间
}

/**
 * 搜索日志实体
 */
export interface MaterialLog {
  id: number
  user_id: number
  material_type: MaterialType
  status: MaterialStatus
  query: string // 查询的字符串
  remark: string // n8n 标注的执行信息
  created_at: string // ISO 8601 格式时间
  updated_at: string // ISO 8601 格式时间
}

/**
 * 收藏实体
 */
export interface MaterialFavorite {
  id: number
  user_id: number
  material_id: number
  is_pinned: boolean
  pinned_at: string
  created_at: string
  updated_at: string
  material_user_id: number
  article_id: number
  material_logs_id: number
  title: string
  material_type: MaterialType
  source_url: string
  content: string
}

// ==================== Request Types ====================

/**
 * 触发素材搜索请求
 */
export interface SearchMaterialsRequest {
  material_type: MaterialType
  search_text: string // 1-500 字符
}

/**
 * 获取素材列表请求参数
 */
export interface GetMaterialsRequest {
  page?: number // 页码，从 1 开始，默认 1
  page_size?: number // 每页数量，默认 20，最大 100
  name?: string // 标题筛选（模糊搜索）
  type?: MaterialType // 素材类型过滤
  article_id?: number // 按文章 ID 筛选素材
}

/**
 * 获取搜索日志请求参数
 */
export interface GetSearchLogsRequest {
  page?: number // 页码，从 1 开始，默认 1
  page_size?: number // 每页数量，默认 20，最大 100
  type?: MaterialType // 素材类型过滤
  status?: MaterialStatus // 状态过滤
}

/**
 * 获取收藏列表请求参数
 */
export interface GetMaterialFavoritesRequest {
  page?: number
  page_size?: number
}

/**
 * 触发素材搜索 V2 响应
 */
export interface TriggerMaterialSearchV2Response {
  id: number
}

export interface MaterialSearchResultItem {
  url: string
  title: string
  content: string
  published_date?: string
}

export interface MaterialSearchDetailAIResult {
  ai_answer?: string
  ai_result?: MaterialSearchResultItem[]
  images?: string[]
}

/**
 * 获取搜索结果详情响应
 */
export interface MaterialSearchDetailResponse {
  id: number
  material_type: MaterialType
  status: MaterialStatus
  query: string
  ai_result: MaterialSearchDetailAIResult | null
}

/**
 * 从搜索结果创建素材请求
 */
export interface AddMaterialsFromLogRequest {
  material_log_id: number
  article_id: number
  urls: string[]
}

/**
 * 新增收藏请求
 */
export interface CreateMaterialFavoriteRequest {
  material_id: number
}

/**
 * 从搜索结果创建素材响应
 */
export interface AddMaterialsFromLogResponse {
  ids: number[]
  message: string
}

/**
 * 创建素材请求
 */
export interface CreateMaterialRequest {
  title: string // 素材标题 (1-200 字符)
  material_type: MaterialType
  content: string // 素材内容（info/news 为文本，image 为图片 URL）
  article_id?: number // 归属文章 ID
}

/**
 * 更新素材请求
 */
export interface UpdateMaterialRequest {
  title?: string // 素材标题 (1-200 字符)
  source_url?: string // 素材原链接（有效 URL，最多 500 字符）
  content?: string // 素材内容
}

/**
 * 获取预签名上传 URL 请求
 */
export interface GetPresignedUrlRequest {
  filename: string // 文件名
  content_type: string // 文件 MIME 类型
}

// ==================== Response Types ====================

/**
 * 素材列表响应
 */
export interface MaterialListResponse {
  total: number
  list: Material[]
}

/**
 * 搜索日志列表响应
 */
export interface MaterialLogListResponse {
  total: number
  list: MaterialLog[]
}

/**
 * 收藏列表响应
 */
export interface MaterialFavoriteListResponse {
  total: number
  list: MaterialFavorite[]
}

/**
 * 创建素材响应
 */
export interface CreateMaterialResponse {
  id: number
  message: string
}

/**
 * 创建收藏响应
 */
export interface CreateMaterialFavoriteResponse {
  id: number
  message: string
}

/**
 * 预签名 URL 响应
 */
export interface PresignedUrlResponse {
  upload_url: string // 用于 PUT 请求上传文件
  file_url: string // 文件最终访问 URL
  expires_at: string // URL 过期时间（15 分钟有效期）
}

/**
 * 通用消息响应
 */
export interface MessageResponse {
  message: string
}

/**
 * 错误响应
 */
export interface ErrorResponse {
  error: string
}
