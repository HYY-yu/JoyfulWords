/**
 * Competitor API Types
 * 所有类型定义来自后端 API 文档
 * 文档：/docs/COMPETITORS_API.md
 */

// ==================== Entity Enums ====================

/**
 * 社交媒体平台枚举（来自 API 定义）
 */
export type SocialPlatform = 'Facebook' | 'LinkedIn' | 'X' | 'Reddit'

/**
 * URL 类型枚举（来自 API 定义）
 */
export type UrlType = 'profile' | 'post'

/**
 * 任务状态枚举（来自 API 定义）
 */
export type TaskStatus = 'running' | 'paused'

/**
 * 抓取日志状态枚举（来自 API 定义）
 * 注意：API 返回数字状态（1-4），需要在前端转换为字符串
 */
export type CrawlLogStatus = 'pending' | 'doing' | 'success' | 'failed'

// ==================== Entity Types ====================

/**
 * 定时任务实体
 */
export interface ScheduledTask {
  id: number // 任务 ID
  platform: SocialPlatform // 社交媒体平台
  url: string // 抓取的 URL
  url_type: UrlType // URL 类型（profile/post）
  cron_interval: string // Cron 表达式
  interval_desc: string // 执行间隔的中文描述
  last_run_at: string // 上次执行时间（格式：2006-01-02T15:04:05Z，UTC）
  next_run_at: string // 下次执行时间（格式：2006-01-02T15:04:05Z，UTC）
  status: TaskStatus // 任务状态：running/paused
  created_at: string // 任务创建时间（格式：2006-01-02T15:04:05Z，UTC）
}

/**
 * 抓取结果实体
 */
export interface CrawlResult {
  id: string // 帖子 ID
  user_id: string // 作者用户名
  content: string // 帖子内容
  url: string // 帖子原始链接
  platform: SocialPlatform // 社交媒体平台
  like_count: number // 点赞数
  comment_count: number // 评论数
  share_count: number // 分享数
  posted_at: string // 帖子发布时间（格式：2006-01-02T15:04:05Z，UTC）
  scraped_at: string // 抓取时间（格式：2006-01-02T15:04:05Z，UTC）
}

/**
 * 抓取日志实体
 * 注意：API 返回的 state 是数字（1-4），需要转换
 */
export interface CrawlLog {
  id: number // 快照记录 ID
  state: number // 快照状态：1-等待处理，2-处理中，3-已完成，4-失败
  snapshot_id: string // Bright Data 快照 ID
  created_at: string // 创建时间（格式：2006-01-02T15:04:05Z，UTC）
  updated_at: string // 更新时间（格式：2006-01-02T15:04:05Z，UTC）
}

/**
 * 转换后的抓取日志（状态已转换为字符串）
 */
export interface CrawlLogWithStatus extends Omit<CrawlLog, 'state'> {
  status: CrawlLogStatus // 转换后的状态字符串
}

// ==================== Request Types ====================

/**
 * 触发内容抓取请求
 */
export interface FetchContentRequest {
  platform: SocialPlatform
  url: string
  url_type: UrlType
  num_of_posts: number
  is_scheduled: boolean
  cron_interval?: string // is_scheduled=true 时必填
}

/**
 * 获取定时任务列表请求参数
 */
export interface GetTasksRequest {
  page?: number // 页码，从 1 开始，默认 1
  page_size?: number // 每页数量，默认 10，最大 100
}

/**
 * 获取抓取结果列表请求参数
 */
export interface GetResultsRequest {
  page?: number // 页码，从 1 开始，默认 1
  page_size?: number // 每页数量，默认 10，最大 100
}

/**
 * 获取抓取日志列表请求参数
 */
export interface GetCrawlLogsRequest {
  page?: number // 页码，从 1 开始，默认 1
  page_size?: number // 每页数量，默认 10，最大 100
}

/**
 * 更新任务状态请求
 */
export interface UpdateTaskStatusRequest {
  status: TaskStatus // 目标状态：running/paused
}

/**
 * 删除任务请求（无 body）
 */
export interface DeleteTaskRequest {
  // 路径参数：id
}

// ==================== Response Types ====================

/**
 * 触发内容抓取响应（立即抓取）
 */
export interface FetchContentImmediateResponse {
  message: string // "异步抓取中"
  is_scheduled: false
}

/**
 * 触发内容抓取响应（定时任务）
 */
export interface FetchContentScheduledResponse {
  task_id: number // 任务 ID
  message: string // "定时任务创建成功"
  is_scheduled: true
}

/**
 * 定时任务列表响应
 */
export interface TaskListResponse {
  tasks: ScheduledTask[]
  total: number
}

/**
 * 抓取结果列表响应
 */
export interface ResultListResponse {
  posts: CrawlResult[]
  total: number
}

/**
 * 抓取日志列表响应
 */
export interface CrawlLogListResponse {
  logs: CrawlLog[]
  total: number
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

// ==================== Utility Types ====================

/**
 * 定时任务配置（UI 使用）
 */
export interface ScheduleConfig {
  mode: 'simple' | 'custom' // 简化模式 / Cron 表达式模式
  simpleInterval: number // 简化模式：间隔数值
  simpleUnit: 'hours' | 'days' // 简化模式：间隔单位
  cronExpression: string // Cron 模式：cron 表达式
}

/**
 * 分页状态
 */
export interface PaginationState {
  page: number
  pageSize: number
  total: number
}
