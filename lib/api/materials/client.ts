import { apiRequest } from '@/lib/api/client'
import type {
  SearchMaterialsRequest,
  GetMaterialsRequest,
  GetSearchLogsRequest,
  CreateMaterialRequest,
  UpdateMaterialRequest,
  GetPresignedUrlRequest,
  MaterialListResponse,
  MaterialLogListResponse,
  CreateMaterialResponse,
  PresignedUrlResponse,
  MessageResponse,
  ErrorResponse,
} from './types'

/**
 * Material API Client
 * 提供素材管理相关的所有 API 调用方法
 */
export const materialsClient = {
  /**
   * 1. 触发素材搜索
   * POST /materials/search
   *
   * 调用 n8n 工作流进行异步素材搜索
   *
   * @param materialType - 素材类型 (info/news/image)
   * @param searchText - 搜索关键词 (1-500 字符)
   * @returns Promise<MessageResponse | ErrorResponse>
   *
   * @example
   * const result = await materialsClient.search('news', 'AI技术')
   * if ('error' in result) {
   *   console.error(result.error)
   * } else {
   *   console.log(result.message) // "OK"
   * }
   */
  async search(
    materialType: SearchMaterialsRequest['material_type'],
    searchText: SearchMaterialsRequest['search_text']
  ): Promise<MessageResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    return apiRequest<MessageResponse>('/materials/search', {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({
        material_type: materialType,
        search_text: searchText,
      } as SearchMaterialsRequest),
    })
  },

  /**
   * 2. 获取搜索日志列表
   * GET /materials/search-logs/list
   *
   * 查看用户的素材搜索历史记录
   *
   * @param params - 查询参数
   * @returns Promise<MaterialLogListResponse | ErrorResponse>
   *
   * @example
   * const result = await materialsClient.getSearchLogs({
   *   page: 1,
   *   page_size: 20,
   *   type: 'news',
   *   status: 'success'
   * })
   */
  async getSearchLogs(
    params?: GetSearchLogsRequest
  ): Promise<MaterialLogListResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    // 构建 URL 查询参数
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', String(params.page))
    if (params?.page_size) searchParams.append('page_size', String(params.page_size))
    if (params?.type) searchParams.append('type', params.type)
    if (params?.status) searchParams.append('status', params.status)

    const queryString = searchParams.toString()
    const url = queryString ? `/materials/search-logs/list?${queryString}` : '/materials/search-logs/list'

    return apiRequest<MaterialLogListResponse>(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
  },

  /**
   * 3. 获取素材列表
   * GET /materials/list
   *
   * 查看用户的素材列表，支持分页、标题搜索和类型过滤
   *
   * @param params - 查询参数
   * @returns Promise<MaterialListResponse | ErrorResponse>
   *
   * @example
   * const result = await materialsClient.getMaterials({
   *   page: 1,
   *   page_size: 20,
   *   name: 'AI',
   *   type: 'info'
   * })
   */
  async getMaterials(
    params?: GetMaterialsRequest
  ): Promise<MaterialListResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    // 构建 URL 查询参数
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', String(params.page))
    if (params?.page_size) searchParams.append('page_size', String(params.page_size))
    if (params?.name) searchParams.append('name', params.name)
    if (params?.type) searchParams.append('type', params.type)

    const queryString = searchParams.toString()
    const url = queryString ? `/materials/list?${queryString}` : '/materials/list'

    return apiRequest<MaterialListResponse>(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
  },

  /**
   * 4. 获取预签名上传 URL
   * POST /materials/presigned-url
   *
   * 获取 Cloudflare R2 的预签名上传 URL，用于上传图片等文件
   *
   * @param filename - 文件名
   * @param contentType - 文件 MIME 类型
   * @returns Promise<PresignedUrlResponse | ErrorResponse>
   *
   * @example
   * const result = await materialsClient.getPresignedUrl('photo.jpg', 'image/jpeg')
   * if ('error' in result) {
   *   console.error(result.error)
   * } else {
   *   // 使用 result.upload_url 上传文件
   *   await fetch(result.upload_url, { method: 'PUT', body: file })
   *   // 上传成功后使用 result.file_url 作为素材内容
   * }
   */
  async getPresignedUrl(
    filename: GetPresignedUrlRequest['filename'],
    contentType: GetPresignedUrlRequest['content_type']
  ): Promise<PresignedUrlResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    return apiRequest<PresignedUrlResponse>('/materials/presigned-url', {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({
        filename,
        content_type: contentType,
      } as GetPresignedUrlRequest),
    })
  },

  /**
   * 5. 创建素材
   * POST /materials
   *
   * 创建新的素材记录
   *
   * @param data - 素材数据
   * @returns Promise<CreateMaterialResponse | ErrorResponse>
   *
   * @example
   * const result = await materialsClient.createMaterial({
   *   title: 'AI 技术资料',
   *   material_type: 'info',
   *   content: '这是关于 AI 技术的详细资料...'
   * })
   */
  async createMaterial(
    data: CreateMaterialRequest
  ): Promise<CreateMaterialResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    return apiRequest<CreateMaterialResponse>('/materials', {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(data),
    })
  },

  /**
   * 6. 更新素材
   * PUT /materials/:id
   *
   * 更新已有素材的信息，支持部分更新
   *
   * @param id - 素材 ID
   * @param data - 更新数据（至少提供一个字段）
   * @returns Promise<MessageResponse | ErrorResponse>
   *
   * @example
   * const result = await materialsClient.updateMaterial(123, {
   *   title: '更新后的标题',
   *   source_url: 'https://example.com/new-source'
   * })
   */
  async updateMaterial(
    id: number,
    data: UpdateMaterialRequest
  ): Promise<MessageResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    return apiRequest<MessageResponse>(`/materials/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(data),
    })
  },

  /**
   * 7. 删除素材
   * DELETE /materials/:id
   *
   * 删除指定的素材
   * 注意：如果素材已被文章使用，则无法删除
   *
   * @param id - 素材 ID
   * @returns Promise<MessageResponse | ErrorResponse>
   *
   * @example
   * const result = await materialsClient.deleteMaterial(123)
   * if ('error' in result) {
   *   console.error(result.error) // 可能是 "该素材已被使用，无法删除"
   * }
   */
  async deleteMaterial(
    id: number
  ): Promise<MessageResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    return apiRequest<MessageResponse>(`/materials/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
  },
}

/**
 * 辅助函数：上传文件到预签名 URL
 *
 * @param uploadUrl - 预签名上传 URL
 * @param file - 要上传的文件
 * @param contentType - 文件 MIME 类型
 * @returns Promise<boolean> - 上传是否成功
 *
 * @example
 * const success = await uploadFileToPresignedUrl(
 *   presignedResult.upload_url,
 *   imageFile,
 *   'image/jpeg'
 * )
 */
export async function uploadFileToPresignedUrl(
  uploadUrl: string,
  file: File,
  contentType: string
): Promise<boolean> {
  try {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': contentType,
      },
    })

    return response.ok
  } catch (error) {
    console.error('Failed to upload file to presigned URL:', error)
    return false
  }
}
