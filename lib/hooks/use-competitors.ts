import { useState, useCallback, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/lib/i18n/i18n-context'
import { competitorsClient } from '@/lib/api/competitors/client'
import { simpleToCron, cronToSimple } from '@/lib/api/competitors/enums'
import { transformCrawlLogStatusList } from '@/lib/api/competitors/utils'
import type {
  ScheduledTask,
  CrawlResult,
  CrawlLogWithStatus,
  SocialPlatform,
  UrlType,
  TaskStatus,
  ScheduleConfig,
} from '@/lib/api/competitors/types'

// Re-export types for use in other modules
export type {
  ScheduledTask,
  CrawlResult,
  CrawlLogWithStatus,
  SocialPlatform,
  UrlType,
  TaskStatus,
  ScheduleConfig,
} from '@/lib/api/competitors/types'

/**
 * 分页状态
 */
export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

/**
 * useCompetitors Hook 的状态管理
 */
export interface CompetitorsState {
  // 数据状态
  tasks: ScheduledTask[]
  results: CrawlResult[]
  crawlLogs: CrawlLogWithStatus[]
  loading: boolean
  searching: boolean

  // 分页状态
  pagination: {
    tasks: PaginationState
    results: PaginationState
    logs: PaginationState
  }

  // UI 状态
  editingIntervalTaskId: number | null
  deleteTaskId: number | null
  scheduleConfig: ScheduleConfig
}

/**
 * useCompetitors Hook
 *
 * 提供竞品追踪功能的完整业务逻辑
 * 包括：立即抓取、定时任务管理、抓取结果查看、日志追踪
 */
export function useCompetitors() {
  const { toast } = useToast()
  const { t } = useTranslation()

  // ==================== 状态管理 ====================

  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [results, setResults] = useState<CrawlResult[]>([])
  const [crawlLogs, setCrawlLogs] = useState<CrawlLogWithStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  // 分页状态
  const [pagination, setPagination] = useState<{
    tasks: PaginationState
    results: PaginationState
    logs: PaginationState
  }>({
    tasks: { page: 1, pageSize: 10, total: 0 },
    results: { page: 1, pageSize: 10, total: 0 },
    logs: { page: 1, pageSize: 10, total: 0 },
  })

  // UI 状态
  const [editingIntervalTaskId, setEditingIntervalTaskId] = useState<number | null>(null)
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null)
  const [deleteResultId, setDeleteResultId] = useState<string | null>(null)
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    mode: 'simple',
    simpleInterval: 1,
    simpleUnit: 'days',
    cronExpression: '0 0 * * *',
  })

  // ==================== 数据获取 ====================

  /**
   * 获取定时任务列表
   */
  const fetchTasks = useCallback(async () => {
    setLoading(true)

    const result = await competitorsClient.getTasks({
      page: pagination.tasks.page,
      page_size: pagination.tasks.pageSize,
    })

    setLoading(false)

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: t('contentWriting.competitors.toast.fetchTasksFailed'),
        description: result.error,
      })
      return false
    }

    setTasks(result.tasks)
    setPagination((prev) => ({
      ...prev,
      tasks: { ...prev.tasks, total: result.total },
    }))

    return true
  }, [pagination.tasks.page, pagination.tasks.pageSize, toast, t])

  /**
   * 获取抓取结果列表
   */
  const fetchResults = useCallback(async () => {
    setLoading(true)

    const result = await competitorsClient.getResults({
      page: pagination.results.page,
      page_size: pagination.results.pageSize,
    })

    setLoading(false)

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: t('contentWriting.competitors.toast.fetchResultsFailed'),
        description: result.error,
      })
      return false
    }

    setResults(result.posts)
    setPagination((prev) => ({
      ...prev,
      results: { ...prev.results, total: result.total },
    }))

    return true
  }, [pagination.results.page, pagination.results.pageSize, toast, t])

  /**
   * 获取抓取日志列表
   */
  const fetchCrawlLogs = useCallback(async () => {
    setLoading(true)

    const result = await competitorsClient.getCrawlLogs({
      page: pagination.logs.page,
      page_size: pagination.logs.pageSize,
    })

    setLoading(false)

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: t('contentWriting.competitors.toast.fetchLogsFailed'),
        description: result.error,
      })
      return false
    }

    // 转换日志状态（数字 → 字符串）
    const transformedLogs = transformCrawlLogStatusList(result.logs)
    setCrawlLogs(transformedLogs)
    setPagination((prev) => ({
      ...prev,
      logs: { ...prev.logs, total: result.total },
    }))

    return true
  }, [pagination.logs.page, pagination.logs.pageSize, toast, t])

  /**
   * 初始化加载所有数据
   */
  const initializeData = useCallback(async () => {
    await Promise.all([
      fetchTasks(),
      fetchResults(),
      fetchCrawlLogs(),
    ])
  }, [fetchTasks, fetchResults, fetchCrawlLogs])

  // ==================== 抓取功能 ====================

  /**
   * 触发立即抓取
   * @param platform - 社交媒体平台
   * @param url - 抓取的 URL
   * @param urlType - URL 类型（profile/post）
   * @param numOfPosts - 抓取的帖子数量（1-3）
   */
  const handleFetch = useCallback(
    async (
      platform: SocialPlatform,
      url: string,
      urlType: UrlType,
      numOfPosts: number = 3
    ) => {
      if (!url.trim()) {
        toast({
          variant: 'destructive',
          title: t('contentWriting.competitors.toast.urlRequired'),
          description: t('contentWriting.competitors.toast.urlRequiredDesc'),
        })
        return false
      }

      setSearching(true)

      const result = await competitorsClient.fetchContent({
        platform,
        url,
        url_type: urlType,
        num_of_posts: numOfPosts,
        is_scheduled: false,
      })

      setSearching(false)

      if ('error' in result) {
        toast({
          variant: 'destructive',
          title: t('contentWriting.competitors.toast.fetchStartFailed'),
          description: result.error,
        })
        return false
      }

      toast({
        title: t('contentWriting.competitors.toast.fetchStarted'),
        description: result.message,
      })

      // 刷新结果列表
      await fetchResults()

      return true
    },
    [toast, fetchResults, t]
  )

  /**
   * 创建定时任务
   * @param platform - 社交媒体平台
   * @param url - 抓取的 URL（必须是 profile 类型）
   * @param config - 定时配置
   */
  const handleSchedule = useCallback(
    async (
      platform: SocialPlatform,
      url: string,
      config: ScheduleConfig
    ) => {
      if (!url.trim()) {
        toast({
          variant: 'destructive',
          title: t('contentWriting.competitors.toast.urlRequired'),
          description: t('contentWriting.competitors.toast.urlRequiredDesc'),
        })
        return false
      }

      // 转换配置为 cron 表达式
      let cronExpression: string
      if (config.mode === 'simple') {
        cronExpression = simpleToCron(config.simpleInterval, config.simpleUnit)
      } else {
        cronExpression = config.cronExpression
      }

      setLoading(true)

      const result = await competitorsClient.fetchContent({
        platform,
        url,
        url_type: 'profile', // 定时抓取只支持 profile
        num_of_posts: 3,
        is_scheduled: true,
        cron_interval: cronExpression,
      })

      setLoading(false)

      if ('error' in result) {
        toast({
          variant: 'destructive',
          title: t('contentWriting.competitors.toast.scheduleCreateFailed'),
          description: result.error,
        })
        return false
      }

      toast({
        title: t('contentWriting.competitors.toast.scheduleCreateSuccess'),
        description: result.message,
      })

      // 刷新任务列表
      await fetchTasks()

      return true
    },
    [toast, fetchTasks, t]
  )

  // ==================== 任务管理 ====================

  /**
   * 切换任务状态（running ↔ paused）
   * @param taskId - 任务 ID
   * @param currentStatus - 当前状态
   */
  const toggleTaskStatus = useCallback(
    async (taskId: number, currentStatus: TaskStatus) => {
      const newStatus: TaskStatus = currentStatus === 'running' ? 'paused' : 'running'

      const result = await competitorsClient.updateTaskStatus(taskId, newStatus)

      if ('error' in result) {
        toast({
          variant: 'destructive',
          title: t('contentWriting.competitors.toast.statusUpdateFailed'),
          description: result.error,
        })
        return false
      }

      toast({
        title: t('contentWriting.competitors.toast.statusUpdateSuccess'),
        description: result.message,
      })

      // 刷新任务列表
      await fetchTasks()

      return true
    },
    [toast, fetchTasks, t]
  )

  /**
   * 删除任务
   * @param taskId - 任务 ID
   */
  const handleDeleteTask = useCallback(
    async (taskId: number) => {
      const result = await competitorsClient.deleteTask(taskId)

      if ('error' in result) {
        toast({
          variant: 'destructive',
          title: t('contentWriting.competitors.toast.deleteFailed'),
          description: result.error,
        })
        return false
      }

      toast({
        title: t('contentWriting.competitors.toast.deleteSuccess'),
        description: result.message,
      })

      // 从列表中移除
      setTasks((prev) => prev.filter((task) => task.id !== taskId))

      // 更新总数
      setPagination((prev) => ({
        ...prev,
        tasks: { ...prev.tasks, total: Math.max(0, prev.tasks.total - 1) },
      }))

      // 关闭删除确认对话框
      setDeleteTaskId(null)

      return true
    },
    [toast, t]
  )

  /**
   * 删除抓取结果
   * @param resultId - 抓取结果 ID (string 类型)
   */
  const handleDeleteResult = useCallback(
    async (resultId: string) => {
      const result = await competitorsClient.deleteResult(resultId)

      if ('error' in result) {
        toast({
          variant: 'destructive',
          title: t('contentWriting.competitors.toast.deleteFailed'),
          description: result.error,
        })
        return false
      }

      toast({
        title: t('contentWriting.competitors.toast.deleteSuccess'),
        description: result.message,
      })

      // 从列表中移除
      setResults((prev) => prev.filter((result) => result.id !== resultId))

      // 更新总数
      setPagination((prev) => ({
        ...prev,
        results: { ...prev.results, total: Math.max(0, prev.results.total - 1) },
      }))

      // 关闭删除确认对话框
      setDeleteResultId(null)

      return true
    },
    [toast, t]
  )

  /**
   * 更新任务执行间隔
   * @param taskId - 任务 ID
   * @param config - 新的定时配置
   */
  const handleUpdateInterval = useCallback(
    async (taskId: number, config: ScheduleConfig) => {
      // 注意：API 没有提供直接更新间隔的接口
      // 需要删除旧任务并创建新任务
      // 这里我们提示用户使用删除后重建的方式

      toast({
        variant: 'destructive',
        title: t('contentWriting.competitors.toast.notSupported'),
        description: t('contentWriting.competitors.toast.notSupportedDesc'),
      })

      setEditingIntervalTaskId(null)

      return false
    },
    [toast, t]
  )

  /**
   * 打开编辑间隔对话框
   * @param task - 要编辑的任务
   */
  const openEditIntervalDialog = useCallback((task: ScheduledTask) => {
    setEditingIntervalTaskId(task.id)

    // 解析现有的 cron_interval
    const simple = cronToSimple(task.cron_interval)
    if (simple) {
      setScheduleConfig({
        mode: 'simple',
        simpleInterval: simple.interval,
        simpleUnit: simple.unit,
        cronExpression: task.cron_interval,
      })
    } else {
      setScheduleConfig({
        mode: 'custom',
        simpleInterval: 1,
        simpleUnit: 'days',
        cronExpression: task.cron_interval,
      })
    }
  }, [])

  // ==================== 分页管理 ====================

  /**
   * 更新分页状态
   * @param type - 分页类型（tasks/results/logs）
   * @param updates - 更新的字段
   */
  const updatePagination = useCallback(
    (
      type: 'tasks' | 'results' | 'logs',
      updates: Partial<{ page: number; pageSize: number }>
    ) => {
      setPagination((prev) => ({
        ...prev,
        [type]: { ...prev[type], ...updates },
      }))
    },
    []
  )

  /**
   * 页码变化时的回调
   */
  const handlePageChange = useCallback(
    async (type: 'tasks' | 'results' | 'logs', newPage: number) => {
      updatePagination(type, { page: newPage })

      // 根据类型刷新对应的数据
      switch (type) {
        case 'tasks':
          await fetchTasks()
          break
        case 'results':
          await fetchResults()
          break
        case 'logs':
          await fetchCrawlLogs()
          break
      }
    },
    [updatePagination, fetchTasks, fetchResults, fetchCrawlLogs]
  )

  // ==================== 组件卸载 ====================

  useEffect(() => {
    // 组件挂载时初始化数据
    initializeData()
  }, [initializeData])

  // ==================== 返回接口 ====================

  return {
    // 状态
    tasks,
    results,
    crawlLogs,
    loading,
    searching,
    pagination,

    // UI 状态
    editingIntervalTaskId,
    deleteTaskId,
    deleteResultId,
    scheduleConfig,

    // Setters
    setEditingIntervalTaskId,
    setDeleteTaskId,
    setDeleteResultId,
    setScheduleConfig,

    // 数据获取
    fetchTasks,
    fetchResults,
    fetchCrawlLogs,
    initializeData,

    // 抓取功能
    handleFetch,
    handleSchedule,

    // 任务管理
    toggleTaskStatus,
    handleDeleteTask,
    handleDeleteResult,
    handleUpdateInterval,
    openEditIntervalDialog,

    // 分页
    updatePagination,
    handlePageChange,
  }
}
