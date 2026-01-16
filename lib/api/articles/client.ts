import { apiRequest } from '@/lib/api/client'
import type {
  AIWriteRequest,
  GetArticlesRequest,
  CreateArticleRequest,
  UpdateArticleContentRequest,
  UpdateArticleMetadataRequest,
  UpdateArticleStatusRequest,
  ArticleListResponse,
  CreateArticleResponse,
  MessageResponse,
  ErrorResponse,
} from './types'

/**
 * Article API Client
 * 提供文章管理相关的所有 API 调用方法
 */
export const articlesClient = {
  /**
   * 1. AI 写文章
   * POST /article/ai-write
   *
   * 调用 n8n 工作流进行异步 AI 文章生成
   *
   * @param data - AI 写作请求参数
   * @returns Promise<CreateArticleResponse | ErrorResponse>
   *
   * @example
   * const result = await articlesClient.aiWrite({
   *   req: '写一篇关于AI的文章',
   *   link_post: 0,
   *   link_materials: [91, 89, 88]
   * })
   */
  async aiWrite(
    data: AIWriteRequest
  ): Promise<CreateArticleResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    return apiRequest<CreateArticleResponse>('/article/ai-write', {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(data),
    })
  },

  /**
   * 2. 获取文章列表
   * GET /article
   *
   * 查看用户的文章列表，包括关联的素材和竞品文章信息
   *
   * @param params - 查询参数
   * @returns Promise<ArticleListResponse | ErrorResponse>
   *
   * @example
   * const result = await articlesClient.getArticles({
   *   page: 1,
   *   page_size: 20,
   *   status: 'draft'
   * })
   */
  async getArticles(
    params?: GetArticlesRequest
  ): Promise<ArticleListResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    // 构建 URL 查询参数
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', String(params.page))
    if (params?.page_size) searchParams.append('page_size', String(params.page_size))
    if (params?.title) searchParams.append('title', params.title)
    if (params?.status) searchParams.append('status', params.status)

    const queryString = searchParams.toString()
    const url = queryString ? `/article?${queryString}` : '/article'

    return apiRequest<ArticleListResponse>(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
  },

  /**
   * 3. 新建文章（手动创建）
   * POST /article
   *
   * 用户手动创建文章（非 AI 生成）
   *
   * @param data - 文章数据
   * @returns Promise<CreateArticleResponse | ErrorResponse>
   *
   * @example
   * const result = await articlesClient.createArticle({
   *   title: '文章标题',
   *   content: '文章内容...',
   *   category: '技术',
   *   tags: 'AI,机器学习'
   * })
   */
  async createArticle(
    data: CreateArticleRequest
  ): Promise<CreateArticleResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    return apiRequest<CreateArticleResponse>('/article', {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(data),
    })
  },

  /**
   * 4. 编辑文章内容
   * PUT /article/:id/content
   *
   * 更新文章的内容字段（独立接口，性能优化）
   *
   * @param id - 文章 ID
   * @param data - 更新数据
   * @returns Promise<MessageResponse | ErrorResponse>
   *
   * @example
   * const result = await articlesClient.updateArticleContent(123, {
   *   content: '更新后的文章内容...'
   * })
   */
  async updateArticleContent(
    id: number,
    data: UpdateArticleContentRequest
  ): Promise<MessageResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    return apiRequest<MessageResponse>(`/article/${id}/content`, {
      method: 'PUT',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(data),
    })
  },

  /**
   * 5. 编辑文章元数据
   * PUT /article/:id
   *
   * 更新文章的标题、分类、标签等元数据，支持部分更新
   *
   * @param id - 文章 ID
   * @param data - 更新数据（至少提供一个字段）
   * @returns Promise<MessageResponse | ErrorResponse>
   *
   * @example
   * // 只更新标题
   * const result = await articlesClient.updateArticleMetadata(123, {
   *   title: '更新后的标题'
   * })
   *
   * // 更新多个字段
   * const result = await articlesClient.updateArticleMetadata(123, {
   *   title: '更新后的标题',
   *   category: 'AI技术',
   *   tags: '机器学习,深度学习'
   * })
   */
  async updateArticleMetadata(
    id: number,
    data: UpdateArticleMetadataRequest
  ): Promise<MessageResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    return apiRequest<MessageResponse>(`/article/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(data),
    })
  },

  /**
   * 6. 删除文章
   * DELETE /article/:id
   *
   * 删除指定的文章，同时级联删除关联的素材和竞品文章引用
   *
   * @param id - 文章 ID
   * @returns Promise<MessageResponse | ErrorResponse>
   *
   * @example
   * const result = await articlesClient.deleteArticle(123)
   */
  async deleteArticle(
    id: number
  ): Promise<MessageResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    return apiRequest<MessageResponse>(`/article/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
  },

  /**
   * 7. 更新文章状态
   * PUT /article/:id/status
   *
   * 更新文章的状态，支持特定的状态转换
   *
   * @param id - 文章 ID
   * @param data - 状态更新数据
   * @returns Promise<MessageResponse | ErrorResponse>
   *
   * @example
   * const result = await articlesClient.updateArticleStatus(123, {
   *   status: 'published'
   * })
   */
  async updateArticleStatus(
    id: number,
    data: UpdateArticleStatusRequest
  ): Promise<MessageResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    return apiRequest<MessageResponse>(`/article/${id}/status`, {
      method: 'PUT',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(data),
    })
  },
}
