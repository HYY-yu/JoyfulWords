/**
 * Article API Types
 * 所有类型定义来自后端 API 文档 (/docs/ARTICLE_API.md)
 */

// ==================== Entity Enums ====================

/**
 * 文章状态枚举（来自 API 定义）
 */
export type ArticleStatus = 'init' | 'draft' | 'published' | 'archived'

// ==================== Entity Types ====================

/**
 * 素材关联信息
 */
export interface ArticleMaterial {
  id: number
  type: 'info' | 'news' | 'image'
  title: string
  content?: string  // 仅当 type=image 时返回
  source_url: string
}

/**
 * 竞品文章关联信息
 */
export interface ArticlePost {
  id: number
  platform: 'linkedin' | 'x' | 'facebook' | 'reddit'
  content: string  // 前 10 个字符
  author_name: string
  original_link: string
}

/**
 * 文章实体（来自 API 响应）
 */
export interface Article {
  id: number
  user_id: number
  title: string
  content: string
  status: ArticleStatus
  category?: string
  tags?: string  // 逗号分隔的字符串
  updated_at: string  // ISO 8601
  created_at: string  // ISO 8601
  materials?: ArticleMaterial[]  // 关联的素材列表
  posts?: ArticlePost[]  // 关联的竞品文章列表
}

// ==================== Request Types ====================

/**
 * AI 写文章请求
 */
export interface AIWriteRequest {
  req: string  // 写作要求/主题（1-500 字符）
  link_post?: number  // 关联的竞品文章 ID
  link_materials?: number[]  // 关联的素材 ID 列表
}

/**
 * 获取文章列表请求参数
 */
export interface GetArticlesRequest {
  page?: number  // 页码，从 1 开始，默认 1
  page_size?: number  // 每页数量，默认 20，最大 100
  title?: string  // 标题筛选（模糊搜索）
  status?: ArticleStatus  // 状态过滤
}

/**
 * 创建文章请求（手动创建）
 */
export interface CreateArticleRequest {
  title: string  // 文章标题（1-200 字符）
  content: string  // 文章内容
  category?: string  // 文章分类（最多 100 字符）
  tags?: string  // 文章标签，逗号分隔（最多 500 字符）
}

/**
 * 编辑文章内容请求
 */
export interface UpdateArticleContentRequest {
  content: string  // 新的文章内容
}

/**
 * 编辑文章元数据请求
 */
export interface UpdateArticleMetadataRequest {
  title?: string  // 文章标题（1-200 字符）
  category?: string  // 文章分类（最多 100 字符）
  tags?: string  // 文章标签，逗号分隔（最多 500 字符）
}

/**
 * 更新文章状态请求
 */
export interface UpdateArticleStatusRequest {
  status: ArticleStatus  // 目标状态
}

// ==================== Response Types ====================

/**
 * 文章列表响应
 */
export interface ArticleListResponse {
  total: number
  list: Article[]
}

/**
 * 创建文章响应
 */
export interface CreateArticleResponse {
  id: number
  message: string
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

// ==================== UI Helper Types ====================

/**
 * 前端使用的 Article 类型（扩展自后端类型）
 * 添加 tags 数组支持（后端是逗号分隔字符串）
 */
export interface ArticleUI extends Article {
  tagsArray?: string[]  // tags 的数组形式（仅前端使用）
}

/**
 * 状态转换规则映射
 */
export const STATUS_TRANSITIONS: Record<ArticleStatus, ArticleStatus[]> = {
  init: ['draft'],
  draft: ['published', 'archived'],
  published: ['archived'],
  archived: []  // 终态，不可转换
}
