/**
 * Article Types
 *
 * 后端 API 集成完成 ✓
 * API endpoints: docs/ARTICLE_API.md
 *
 * 关键变更：
 * 1. id 类型：string → number
 * 2. 新增后端关联字段：materials[], posts[]
 * 3. 时间格式：后端 ISO 8601 (created_at, updated_at)
 * 4. tags 格式：后端是逗号分隔字符串，前端提供 tagsArray 辅助
 */

// Re-export core types from API types
export type { Article, ArticleStatus, ArticleMaterial, ArticlePost } from '@/lib/api/articles/types'

// Legacy types for backward compatibility (will be phased out)
export type ArticleImage = {
  id: string
  url: string
  alt: string
  caption?: string
}

export type ReferenceLink = {
  id: string
  url: string
  title: string
  description?: string
}

export type ArticleFormData = Omit<any, 'id' | 'createdAt' | 'modifiedAt'>

// ==================== 辅助函数 ====================

/**
 * 将逗号分隔的 tags 字符串转换为数组
 * @param tagsString - 逗号分隔的标签字符串
 * @returns 标签数组
 *
 * @example
 * parseTags('AI,机器学习,深度学习') // ['AI', '机器学习', '深度学习']
 * parseTags('') // []
 */
export const parseTags = (tagsString?: string): string[] => {
  if (!tagsString) return []
  return tagsString.split(',').map(tag => tag.trim()).filter(Boolean)
}

/**
 * 将 tags 数组转换为逗号分隔的字符串
 * @param tagsArray - 标签数组
 * @returns 逗号分隔的字符串
 *
 * @example
 * stringifyTags(['AI', '机器学习', '深度学习']) // 'AI,机器学习,深度学习'
 */
export const stringifyTags = (tagsArray: string[]): string => {
  return tagsArray.map(tag => tag.trim()).filter(Boolean).join(',')
}

/**
 * 格式化 ISO 8601 时间为本地时间字符串
 * @param isoString - ISO 8601 格式的时间字符串
 * @returns 格式化后的时间字符串
 *
 * @example
 * formatDateTime('2024-01-15T10:30:00Z') // '2024-01-15 18:30:00'
 */
export const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * 格式化 ISO 8601 时间为短日期格式
 * @param isoString - ISO 8601 格式的时间字符串
 * @returns 短日期字符串 (YYYY-MM-DD)
 *
 * @example
 * formatShortDate('2024-01-15T10:30:00Z') // '2024-01-15'
 */
export const formatShortDate = (isoString: string): string => {
  const date = new Date(isoString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * 获取状态对应的 Badge variant
 * @param status - 文章状态
 * @returns Badge variant
 */
export const getStatusVariant = (status: any): "default" | "secondary" | "destructive" | "outline" => {
  const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    init: 'outline',      // Gray outline for init
    draft: 'secondary',   // Gray for draft
    published: 'default', // Blue for published
    archived: 'outline'   // Gray outline for archived
  }
  return variantMap[status] || 'outline'
}

/**
 * 截断文本到指定长度
 * @param text - 原始文本
 * @param maxLength - 最大长度
 * @returns 截断后的文本
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// Article draft state for localStorage persistence
export interface ArticleDraft {
  article: any | null           // 当前编辑的文章对象（Edit模式）
  isEditMode: boolean               // 是否为编辑模式
  lastSaved: string                 // ISO时间戳

  content: {
    html: string                    // HTML格式内容（主要）
    text: string                    // 纯文本（用于字数统计）
  }

  metadata: {
    wordCount: number               // 字数统计
    hasUnsavedChanges: boolean      // 是否有未保存的更改
    version: string                 // 数据格式版本（用于未来迁移）
  }
}

// ==================== Mock Data (保留用于演示，生产环境使用真实 API) ====================

// Mock data has been moved to a separate file for reference only
// Real data will come from the backend API
export const mockArticles: any[] = [] // Empty - will be populated by API
