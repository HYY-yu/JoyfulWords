import { apiRequest } from '@/lib/api/client'
import type {
  FetchContentRequest,
  GetTasksRequest,
  GetResultsRequest,
  GetCrawlLogsRequest,
  UpdateTaskStatusRequest,
  FetchContentImmediateResponse,
  FetchContentScheduledResponse,
  TaskListResponse,
  ResultListResponse,
  CrawlLogListResponse,
  MessageResponse,
  ErrorResponse,
} from './types'

/**
 * Competitor API Client
 * 提供竞品追踪相关的所有 API 调用方法
 * 文档：/docs/COMPETITORS_API.md
 */
export const competitorsClient = {
  /**
   * 1. 触发内容抓取
   * POST /social/fetch
   *
   * 支持立即抓取和定时抓取两种模式
   *
   * @param request - 抓取请求参数
   * @returns Promise<FetchContentResponse | ErrorResponse>
   *
   * @example 立即抓取
   * const result = await competitorsClient.fetchContent({
   *   platform: 'LinkedIn',
   *   url: 'https://www.linkedin.com/in/username',
   *   url_type: 'profile',
   *   num_of_posts: 3,
   *   is_scheduled: false
   * })
   *
   * @example 定时抓取
   * const result = await competitorsClient.fetchContent({
   *   platform: 'Facebook',
   *   url: 'https://www.facebook.com/username',
   *   url_type: 'profile',
   *   num_of_posts: 3,
   *   is_scheduled: true,
   *   cron_interval: '0 9 * * *'
   * })
   */
  async fetchContent(
    request: FetchContentRequest
  ): Promise<FetchContentImmediateResponse | FetchContentScheduledResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    return apiRequest<FetchContentImmediateResponse | FetchContentScheduledResponse>('/social/fetch', {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept-Language': 'zh-CN',
      },
      body: JSON.stringify(request),
    })
  },

  /**
   * 2. 获取定时任务列表
   * GET /social/tasks/list
   *
   * 查看用户创建的所有定时抓取任务
   *
   * @param params - 查询参数
   * @returns Promise<TaskListResponse | ErrorResponse>
   *
   * @example
   * const result = await competitorsClient.getTasks({
   *   page: 1,
   *   page_size: 10
   * })
   */
  async getTasks(
    params?: GetTasksRequest
  ): Promise<TaskListResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    // 构建 URL 查询参数
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', String(params.page))
    if (params?.page_size) searchParams.append('page_size', String(params.page_size))

    const queryString = searchParams.toString()
    const url = queryString ? `/social/tasks/list?${queryString}` : '/social/tasks/list'

    return apiRequest<TaskListResponse>(url, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept-Language': 'zh-CN',
      },
    })
  },

  /**
   * 3. 获取抓取结果列表
   * GET /social/results/list
   *
   * 查看用户所有已抓取的社交媒体帖子
   *
   * @param params - 查询参数
   * @returns Promise<ResultListResponse | ErrorResponse>
   *
   * @example
   * const result = await competitorsClient.getResults({
   *   page: 1,
   *   page_size: 10
   * })
   */
  async getResults(
    params?: GetResultsRequest
  ): Promise<ResultListResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    // 构建 URL 查询参数
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', String(params.page))
    if (params?.page_size) searchParams.append('page_size', String(params.page_size))

    const queryString = searchParams.toString()
    const url = queryString ? `/social/results/list?${queryString}` : '/social/results/list'

    return apiRequest<ResultListResponse>(url, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept-Language': 'zh-CN',
      },
    })
  },

  /**
   * 4. 更新任务状态
   * PUT /social/tasks/:id/status
   *
   * 暂停或恢复定时任务的执行
   *
   * @param id - 任务 ID
   * @param status - 目标状态（running/paused）
   * @returns Promise<MessageResponse | ErrorResponse>
   *
   * @example 暂停任务
   * const result = await competitorsClient.updateTaskStatus(123, 'paused')
   *
   * @example 恢复任务
   * const result = await competitorsClient.updateTaskStatus(123, 'running')
   */
  async updateTaskStatus(
    id: number,
    status: UpdateTaskStatusRequest['status']
  ): Promise<MessageResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    return apiRequest<MessageResponse>(`/social/tasks/${id}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept-Language': 'zh-CN',
      },
      body: JSON.stringify({ status } as UpdateTaskStatusRequest),
    })
  },

  /**
   * 5. 删除任务
   * DELETE /social/tasks/:id
   *
   * 删除指定的定时抓取任务
   *
   * @param id - 任务 ID
   * @returns Promise<MessageResponse | ErrorResponse>
   *
   * @example
   * const result = await competitorsClient.deleteTask(123)
   */
  async deleteTask(
    id: number
  ): Promise<MessageResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    return apiRequest<MessageResponse>(`/social/tasks/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept-Language': 'zh-CN',
      },
    })
  },

  /**
   * 6. 获取抓取日志列表
   * GET /social/craw-logs
   *
   * 查看用户所有抓取任务的快照日志记录
   *
   * @param params - 查询参数
   * @returns Promise<CrawlLogListResponse | ErrorResponse>
   *
   * @example
   * const result = await competitorsClient.getCrawlLogs({
   *   page: 1,
   *   page_size: 10
   * })
   */
  async getCrawlLogs(
    params?: GetCrawlLogsRequest
  ): Promise<CrawlLogListResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    // 构建 URL 查询参数
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', String(params.page))
    if (params?.page_size) searchParams.append('page_size', String(params.page_size))

    const queryString = searchParams.toString()
    const url = queryString ? `/social/craw-logs?${queryString}` : '/social/craw-logs'

    return apiRequest<CrawlLogListResponse>(url, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept-Language': 'zh-CN',
      },
    })
  },
}

/**
 * 类型守卫：检查响应是否为错误响应
 */
export function isErrorResponse(
  response: unknown
): response is ErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response
  )
}

/**
 * 类型守卫：检查响应是否为立即抓取响应
 */
export function isImmediateFetchResponse(
  response: unknown
): response is FetchContentImmediateResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'is_scheduled' in response &&
    (response as FetchContentImmediateResponse).is_scheduled === false
  )
}

/**
 * 类型守卫：检查响应是否为定时抓取响应
 */
export function isScheduledFetchResponse(
  response: unknown
): response is FetchContentScheduledResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'is_scheduled' in response &&
    'task_id' in response &&
    (response as FetchContentScheduledResponse).is_scheduled === true
  )
}
