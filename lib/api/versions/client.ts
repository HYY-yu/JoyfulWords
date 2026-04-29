import { authenticatedApiRequest } from '@/lib/api/client'
import type {
  Version,
  CreateVersionRequest,
  MessageResponse,
  ErrorResponse,
} from './types'

export const versionsClient = {
  /**
   * 获取文章版本列表
   * GET /article/versions?article_id={articleId}
   */
  async getVersions(articleId: number): Promise<Version[] | ErrorResponse> {
    const result = await authenticatedApiRequest<Version[] | ErrorResponse>(
      `/article/versions?article_id=${articleId}`
    )
    return result
  },

  /**
   * 创建新版本
   * POST /article/versions
   */
  async createVersion(
    articleId: number,
    article: CreateVersionRequest['article'],
    detail: string
  ): Promise<Version | ErrorResponse> {
    const result = await authenticatedApiRequest<Version | ErrorResponse>(
      `/article/versions`,
      {
        method: 'POST',
        body: JSON.stringify({
          article_id: articleId,
          article,
          detail,
        }),
      }
    )
    return result
  },

  /**
   * 删除版本
   * DELETE /article/versions/:id
   */
  async deleteVersion(versionId: number): Promise<MessageResponse | ErrorResponse> {
    return authenticatedApiRequest<MessageResponse | ErrorResponse>(
      `/article/versions/${versionId}`,
      {
        method: 'DELETE',
      }
    )
  },
}
