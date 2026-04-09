import { apiRequest } from '@/lib/api/client'
import type { TaskListItem, TaskDetailResponse } from './types'
import { TaskType } from './types'

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
   * 获取指定类型和ID的任务详情，已完成的任务会缓存24小时
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
    const cacheKey = `task_detail_${type}_${id}`
    
    console.log(`[TaskCenter] Fetching task detail for ${type} task ${id}`)
    
    // 检查缓存
    const cachedData = localStorage.getItem(cacheKey)
    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData)
        const cacheTime = parsedData.__cache_time
        const now = Date.now()
        const twentyFourHours = 24 * 60 * 60 * 1000
        
        console.log(`[TaskCenter] Found cached data for ${type} task ${id}, cached at ${new Date(cacheTime).toLocaleString()}`)
        
        // 检查缓存是否在24小时内
        if (now - cacheTime < twentyFourHours) {
          console.log(`[TaskCenter] Using cached task detail for ${type} task ${id}`)
          delete parsedData.__cache_time
          return parsedData
        } else {
          console.log(`[TaskCenter] Cache expired for ${type} task ${id}`)
        }
      } catch (error) {
        console.error(`[TaskCenter] Error parsing cached data:`, error)
        // 缓存解析失败，清除缓存
        localStorage.removeItem(cacheKey)
      }
    } else {
      console.log(`[TaskCenter] No cached data found for ${type} task ${id}`)
    }

    const data = await apiRequest<TaskDetailResponse>(`/api/taskcenter/task/${type}/${id}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })

    // 缓存所有任务（不仅仅是已完成的），因为状态可能会变化
    const dataWithCacheTime = {
      ...data,
      __cache_time: Date.now()
    }
    localStorage.setItem(cacheKey, JSON.stringify(dataWithCacheTime))
    console.log(`[TaskCenter] Cached task detail for ${type} task ${id}`)

    return data
  },

  /**
   * 删除任务
   * DELETE /api/taskcenter/task/:type/:id
   *
   * 删除指定类型和ID的任务
   *
   * @param type - 任务类型
   * @param id - 任务ID
   * @returns Promise<{ success: boolean }>
   *
   * @example
   * const result = await taskCenterClient.deleteTask('image', 1)
   */
  async deleteTask(type: TaskType, id: number): Promise<{ success: boolean }> {
    const token = localStorage.getItem('access_token')
    const cacheKey = `task_detail_${type}_${id}`
    
    console.log(`[TaskCenter] Deleting task ${type} ${id}`)
    
    // 发送删除请求
    const data = await apiRequest<{ success: boolean }>(`/api/taskcenter/task/${type}/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
    
    // 清除缓存
    localStorage.removeItem(cacheKey)
    console.log(`[TaskCenter] Deleted task ${type} ${id} and cleared cache`)
    
    return data
  },
}
