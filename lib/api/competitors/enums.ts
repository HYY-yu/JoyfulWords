/**
 * Competitor API 枚举常量
 * 所有枚举值来自 API 文档定义
 * 文档：/docs/COMPETITORS_API.md
 */

import type { SocialPlatform, UrlType, TaskStatus, CrawlLogStatus } from './types'

// ==================== Social Platforms ====================

/**
 * 社交媒体平台枚举
 */
export const SOCIAL_PLATFORMS = {
  FACEBOOK: 'Facebook',
  LINKEDIN: 'LinkedIn',
  X: 'X',
  REDDIT: 'Reddit',
} as const

export type SocialPlatformValue = typeof SOCIAL_PLATFORMS[keyof typeof SOCIAL_PLATFORMS]

/**
 * 平台选项（UI 使用）
 */
export const PLATFORM_OPTIONS = [
  {
    value: SOCIAL_PLATFORMS.LINKEDIN,
    label: 'LinkedIn',
    placeholder: 'https://www.linkedin.com/in/username',
  },
  {
    value: SOCIAL_PLATFORMS.FACEBOOK,
    label: 'Facebook',
    placeholder: 'https://www.facebook.com/username',
  },
  {
    value: SOCIAL_PLATFORMS.X,
    label: 'X',
    placeholder: 'https://x.com/username',
  },
  {
    value: SOCIAL_PLATFORMS.REDDIT,
    label: 'Reddit',
    placeholder: 'https://www.reddit.com/user/username',
  },
] as const

/**
 * 平台 URL 模式（用于推测平台）
 */
export const PLATFORM_URL_PATTERNS: Record<SocialPlatform, RegExp[]> = {
  Facebook: [
    /^https?:\/\/(www\.)?facebook\.com\//,
    /^https?:\/\/(web\.)?facebook\.com\//,
  ],
  LinkedIn: [
    /^https?:\/\/(www\.)?linkedin\.com\/in\//,
    /^https?:\/\/(www\.)?linkedin\.com\/company\//,
  ],
  X: [
    /^https?:\/\/(www\.)?x\.com\//,
    /^https?:\/\/(www\.)?twitter\.com\//,
  ],
  Reddit: [
    /^https?:\/\/(www\.)?reddit\.com\/user\//,
    /^https?:\/\/(www\.)?reddit\.com\/r\//,
  ],
}

// ==================== URL Types ====================

/**
 * URL 类型枚举
 */
export const URL_TYPES = {
  PROFILE: 'profile',
  POST: 'post',
} as const

export type UrlTypeValue = typeof URL_TYPES[keyof typeof URL_TYPES]

/**
 * URL 类型选项（UI 使用）
 */
export const URL_TYPE_OPTIONS = [
  { value: URL_TYPES.PROFILE, label: 'profile', i18nKey: 'profile' },
  { value: URL_TYPES.POST, label: 'post', i18nKey: 'post' },
] as const

/**
 * 平台 URL 类型限制配置
 * 定义每个平台支持的 URL 类型
 * 文档：/docs/COMPETITORS_API.md
 */
export const PLATFORM_URL_TYPE_RESTRICTIONS: Record<SocialPlatform, UrlType[]> = {
  Facebook: [URL_TYPES.PROFILE, URL_TYPES.POST],
  LinkedIn: [URL_TYPES.POST], // LinkedIn 禁止按 profile 抓取（无法限制数量）
  X: [URL_TYPES.POST], // X 禁止按 profile 抓取（无法限制数量）
  Reddit: [URL_TYPES.PROFILE, URL_TYPES.POST],
} as const

/**
 * 平台强制 URL 类型配置（派生自 PLATFORM_URL_TYPE_RESTRICTIONS）
 * 当平台只有一个允许的 URL 类型时，自动使用该类型
 */
export const PLATFORM_FORCED_URL_TYPE: Partial<Record<SocialPlatform, UrlType>> = Object.entries(
  PLATFORM_URL_TYPE_RESTRICTIONS
).reduce<Partial<Record<SocialPlatform, UrlType>>>((acc, [platform, types]) => {
  if (types.length === 1) {
    acc[platform as SocialPlatform] = types[0]
  }
  return acc
}, {})

// ==================== Task Status ====================

/**
 * 任务状态枚举
 */
export const TASK_STATUS = {
  RUNNING: 'running',
  PAUSED: 'paused',
} as const

export type TaskStatusValue = typeof TASK_STATUS[keyof typeof TASK_STATUS]

/**
 * 任务状态选项（UI 使用）
 */
export const TASK_STATUS_OPTIONS = [
  { value: TASK_STATUS.RUNNING, label: 'running', i18nKey: 'running' },
  { value: TASK_STATUS.PAUSED, label: 'paused', i18nKey: 'paused' },
] as const

/**
 * 任务状态颜色配置
 */
export const TASK_STATUS_COLOR_CONFIG: Record<TaskStatusValue, { bg: string; text: string }> = {
  running: { bg: 'bg-green-500/10', text: 'text-green-600' },
  paused: { bg: 'bg-yellow-500/10', text: 'text-yellow-600' },
}

// ==================== Crawl Log Status ====================

/**
 * 抓取日志状态枚举
 */
export const CRAWL_LOG_STATUS = {
  PENDING: 'pending',
  DOING: 'doing',
  SUCCESS: 'success',
  FAILED: 'failed',
} as const

export type CrawlLogStatusValue = typeof CRAWL_LOG_STATUS[keyof typeof CRAWL_LOG_STATUS]

/**
 * 日志状态数字到字符串的映射
 * API 返回数字，前端转换为字符串
 */
export const STATE_NUMBER_TO_STATUS: Record<number, CrawlLogStatus> = {
  1: 'pending',
  2: 'doing',
  3: 'success',
  4: 'failed',
}

/**
 * 状态字符串到数字的映射
 */
export const STATUS_TO_STATE_NUMBER: Record<CrawlLogStatus, number> = {
  pending: 1,
  doing: 2,
  success: 3,
  failed: 4,
}

/**
 * 日志状态选项（UI 使用）
 */
export const CRAWL_LOG_STATUS_OPTIONS = [
  { value: CRAWL_LOG_STATUS.PENDING, label: 'pending', i18nKey: 'pending' },
  { value: CRAWL_LOG_STATUS.DOING, label: 'doing', i18nKey: 'doing' },
  { value: CRAWL_LOG_STATUS.SUCCESS, label: 'success', i18nKey: 'success' },
  { value: CRAWL_LOG_STATUS.FAILED, label: 'failed', i18nKey: 'failed' },
] as const

/**
 * 日志状态颜色配置
 */
export const CRAWL_LOG_STATUS_COLOR_CONFIG: Record<CrawlLogStatusValue, { bg: string; text: string }> = {
  pending: { bg: 'bg-gray-500/10', text: 'text-gray-600' },
  doing: { bg: 'bg-blue-500/10', text: 'text-blue-600' },
  success: { bg: 'bg-green-500/10', text: 'text-green-600' },
  failed: { bg: 'bg-red-500/10', text: 'text-red-600' },
}

// ==================== Cron Expressions ====================

/**
 * 简化模式单位到 Cron 表达式的映射
 */
export function simpleToCron(interval: number, unit: 'hours' | 'days'): string {
  if (unit === 'hours') {
    // 每 N 小时：0 */N * * *
    return `0 */${interval} * * *`
  } else {
    // 每 N 天：0 0 */N * *
    return `0 0 */${interval} * *`
  }
}

/**
 * Cron 表达式到简化模式的解析
 * 仅支持解析简单的定时表达式
 */
export function cronToSimple(cron: string): { interval: number; unit: 'hours' | 'days' } | null {
  const parts = cron.split(' ')
  if (parts.length !== 5) return null

  const [minute, hour, day, month, weekday] = parts

  // 解析 "每 N 小时"：0 */N * * *
  if (minute === '0' && hour.startsWith('*/') && day === '*' && month === '*' && weekday === '*') {
    const interval = Number.parseInt(hour.replace('*/', ''))
    if (!Number.isNaN(interval)) {
      return { interval, unit: 'hours' }
    }
  }

  // 解析 "每 N 天"：0 0 */N * *
  if (minute === '0' && hour === '0' && day.startsWith('*/') && month === '*' && weekday === '*') {
    const interval = Number.parseInt(day.replace('*/', ''))
    if (!Number.isNaN(interval)) {
      return { interval, unit: 'days' }
    }
  }

  return null
}

/**
 * 常用 Cron 表达式预设
 */
export const CRON_PRESETS = [
  { expression: '0 * * * *', label: '每小时（整点）', i18nKey: 'everyHour' },
  { expression: '0 */2 * * *', label: '每 2 小时', i18nKey: 'every2Hours' },
  { expression: '0 */6 * * *', label: '每 6 小时', i18nKey: 'every6Hours' },
  { expression: '0 0 * * *', label: '每天（午夜）', i18nKey: 'everyDay' },
  { expression: '0 0 * * 0', label: '每周日（午夜）', i18nKey: 'everyWeek' },
  { expression: '0 9 * * *', label: '每天上午 9 点', i18nKey: 'daily9AM' },
] as const
