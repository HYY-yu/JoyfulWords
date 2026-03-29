import { apiRequest } from '@/lib/api/client'
import type { TaskListItem, TaskDetailResponse, TaskType } from './types'

/**
 * Task Center API Client
 * 提供任务中心相关的所有 API 调用方法
 */
export const taskCenterClient = {
  /**
   * 获取任务列表
   * GET /api/taskcenter/tasks
   *
   * 获取用户的任务列表，包括各种类型的任务
   *
   * @param params - 查询参数
   * @param params.type - 任务类型（必选）
   * @param params.status - 任务状态（可选）
   * @returns Promise<TaskListItem[]>
   *
   * @example
   * const tasks = await taskCenterClient.getTasks({ type: 'image' })
   * const tasks = await taskCenterClient.getTasks({ type: 'article', status: 'completed' })
   */
  async getTasks(params: { type: TaskType; status?: string }): Promise<TaskListItem[]> {
    const token = localStorage.getItem('access_token')

    // 构建 URL 查询参数
    const searchParams = new URLSearchParams()
    if (params.type) searchParams.append('type', params.type)
    if (params.status) searchParams.append('status', params.status)

    const queryString = searchParams.toString()
    const url = queryString ? `/api/taskcenter/tasks?${queryString}` : '/api/taskcenter/tasks'

    return apiRequest<TaskListItem[]>(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
  },

  /**
   * 获取任务详情
   * GET /api/taskcenter/task/:type/:id
   *
   * 获取指定类型和ID的任务详情
   *
   * @param type - 任务类型
   * @param id - 任务ID
   * @returns Promise<TaskDetailResponse>
   *
   * @example
   * const taskDetail = await taskCenterClient.getTaskDetail('image', 1)
   */
  async getTaskDetail(type: TaskType, id: number): Promise<TaskDetailResponse> {
    const token = localStorage.getItem('access_token')

    return apiRequest<TaskDetailResponse>(`/api/taskcenter/task/${type}/${id}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
  },
}
