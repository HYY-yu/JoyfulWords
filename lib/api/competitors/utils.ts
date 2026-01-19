/**
 * Competitor API 辅助工具函数
 */

import type { CrawlLog, CrawlLogWithStatus, SocialPlatform } from './types'
import { STATE_NUMBER_TO_STATUS, PLATFORM_URL_PATTERNS } from './enums'

// ==================== Crawl Log Status Transformation ====================

/**
 * 转换抓取日志状态（数字 → 字符串）
 * @param log - API 返回的原始日志（state 为数字）
 * @returns 转换后的日志（status 为字符串）
 */
export function transformCrawlLogStatus(log: CrawlLog): CrawlLogWithStatus {
  return {
    ...log,
    status: STATE_NUMBER_TO_STATUS[log.state] || 'pending',
  }
}

/**
 * 批量转换抓取日志状态
 * @param logs - API 返回的原始日志列表
 * @returns 转换后的日志列表
 */
export function transformCrawlLogStatusList(logs: CrawlLog[]): CrawlLogWithStatus[] {
  return logs.map(transformCrawlLogStatus)
}

// ==================== Time Formatting ====================

/**
 * 格式化 ISO 8601 时间为本地时间字符串
 * @param isoString - ISO 8601 格式时间
 * @param locale - 地区设置（默认：zh-CN）
 * @returns 格式化后的时间字符串
 */
export function formatToLocalTime(isoString: string, locale: string = 'zh-CN'): string {
  try {
    const date = new Date(isoString)
    return date.toLocaleString(locale)
  } catch (error) {
    console.error('Failed to format time:', error)
    return isoString
  }
}

/**
 * 格式化 API 时间（2006-01-02T15:04:05Z UTC）为本地时间
 * @param apiTime - API 返回的时间字符串（ISO 8601 UTC 格式）
 * @param locale - 地区设置（默认：zh-CN）
 * @returns 格式化后的时间字符串
 */
export function formatApiTime(apiTime: string, locale: string = 'zh-CN'): string {
  try {
    // API 时间格式：2006-01-02T15:04:05Z（ISO 8601 UTC）
    return formatToLocalTime(apiTime, locale)
  } catch (error) {
    console.error('Failed to format API time:', error)
    return apiTime
  }
}

/**
 * 格式化相对时间（多久前）
 * @param isoString - ISO 8601 格式时间
 * @param locale - 地区设置（默认：zh-CN）
 * @returns 相对时间字符串（如 "2小时前"）
 */
export function formatRelativeTime(isoString: string, locale: string = 'zh-CN'): string {
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (locale.startsWith('zh')) {
      if (diffSecs < 60) return '刚刚'
      if (diffMins < 60) return `${diffMins}分钟前`
      if (diffHours < 24) return `${diffHours}小时前`
      if (diffDays < 7) return `${diffDays}天前`
      return formatToLocalTime(isoString, locale)
    } else {
      if (diffSecs < 60) return 'just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      return formatToLocalTime(isoString, locale)
    }
  } catch (error) {
    console.error('Failed to format relative time:', error)
    return isoString
  }
}

// ==================== URL Validation ====================

/**
 * 验证 URL 是否有效
 * @param url - URL 字符串
 * @returns 是否为有效 URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 从 URL 推测社交媒体平台
 * @param url - URL 字符串
 * @returns 推测的平台，如果无法推测则返回 null
 */
export function detectPlatformFromUrl(url: string): SocialPlatform | null {
  for (const [platform, patterns] of Object.entries(PLATFORM_URL_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(url)) {
        return platform as SocialPlatform
      }
    }
  }
  return null
}

/**
 * 根据平台和 URL 类型验证 URL
 * @param url - URL 字符串
 * @param platform - 社交媒体平台
 * @param urlType - URL 类型（profile/post）
 * @returns 验证结果和错误消息
 */
export function validateUrlForPlatform(
  url: string,
  platform: SocialPlatform,
  urlType: 'profile' | 'post'
): { valid: boolean; error?: string } {
  // 验证 URL 格式
  if (!isValidUrl(url)) {
    return { valid: false, error: 'Invalid URL format' }
  }

  // 验证平台匹配
  const detectedPlatform = detectPlatformFromUrl(url)
  if (detectedPlatform && detectedPlatform !== platform) {
    return {
      valid: false,
      error: `URL does not match the selected platform. Detected: ${detectedPlatform}, Selected: ${platform}`,
    }
  }

  return { valid: true }
}

// ==================== Cron Expression Validation ====================

/**
 * 验证 Cron 表达式是否有效
 * @param cron - Cron 表达式（5 字段）
 * @returns 是否为有效的 Cron 表达式
 */
export function isValidCronExpression(cron: string): boolean {
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return false

  const [minute, hour, day, month, weekday] = parts

  // 验证每个字段（简单验证）
  const isValidField = (field: string, min: number, max: number): boolean => {
    // 支持 *、*/n、数字
    if (field === '*') return true
    if (field.match(/^\*\/\d+$/)) {
      const interval = Number.parseInt(field.replace('*/', ''))
      return interval > 0 && interval <= max
    }
    if (field.match(/^\d+$/)) {
      const value = Number.parseInt(field)
      return value >= min && value <= max
    }
    return false
  }

  return (
    isValidField(minute, 0, 59) &&
    isValidField(hour, 0, 23) &&
    isValidField(day, 1, 31) &&
    isValidField(month, 1, 12) &&
    isValidField(weekday, 0, 6)
  )
}

// ==================== Content Truncation ====================

/**
 * 截断文本到指定长度
 * @param text - 原始文本
 * @param maxLength - 最大长度
 * @param suffix - 后缀（默认："..."）
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - suffix.length) + suffix
}

// ==================== Number Formatting ====================

/**
 * 格式化数字（添加千位分隔符）
 * @param num - 数字
 * @param locale - 地区设置（默认：zh-CN）
 * @returns 格式化后的数字字符串
 */
export function formatNumber(num: number, locale: string = 'zh-CN'): string {
  return new Intl.NumberFormat(locale).format(num)
}

/**
 * 格式化互动数量（点赞、评论、分享）
 * @param count - 数量
 * @param locale - 地区设置（默认：zh-CN）
 * @returns 格式化后的字符串（如 "1.2K"）
 */
export function formatEngagementCount(count: number, locale: string = 'zh-CN'): string {
  if (count < 1000) return formatNumber(count, locale)

  const thousands = count / 1000
  if (locale.startsWith('zh')) {
    if (thousands < 10) return `${thousands.toFixed(1)}k`
    return `${Math.floor(thousands)}k`
  } else {
    if (thousands < 10) return `${thousands.toFixed(1)}K`
    return `${Math.floor(thousands)}K`
  }
}

// ==================== Error Handling Utilities ====================

/**
 * 从错误响应中提取错误消息
 * @param error - 错误对象
 * @returns 错误消息字符串
 */
export function extractErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'error' in error) {
    return String(error.error)
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  return 'An unknown error occurred'
}

/**
 * 判断是否为网络错误
 * @param error - 错误对象
 * @returns 是否为网络错误
 */
export function isNetworkError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    // 检查常见的网络错误特征
    return (
      'name' in error && error.name === 'TypeError' &&
      'message' in error && typeof error.message === 'string' &&
      (error.message.includes('fetch') || error.message.includes('network'))
    )
  }
  return false
}
