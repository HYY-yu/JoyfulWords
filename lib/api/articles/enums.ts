/**
 * Article API Enums and Helper Functions
 * 枚举常量和辅助函数
 */

import type { ArticleStatus } from './types'

/**
 * 状态转换规则映射（来自 API 文档）
 *
 * | 当前状态 | 可转换到的状态 |
 * |---------|--------------|
 * | init | draft |
 * | draft | published/archived |
 * | published | archived |
 * | archived | (终态) |
 */
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  init: ['draft'],
  draft: ['published', 'archived'],
  published: ['archived'],
  archived: []  // 终态，不可转换
}

/**
 * 获取允许的状态转换选项
 *
 * @param currentStatus - 当前文章状态
 * @returns 允许转换到的状态数组
 *
 * @example
 * getAllowedStatusTransitions('draft') // ['published', 'archived']
 * getAllowedStatusTransitions('archived') // []
 */
export function getAllowedStatusTransitions(currentStatus: string): string[] {
  return STATUS_TRANSITIONS[currentStatus] || []
}

/**
 * 验证状态转换是否允许
 *
 * @param fromStatus - 当前状态
 * @param toStatus - 目标状态
 * @returns 是否允许转换
 *
 * @example
 * isValidStatusTransition('draft', 'published') // true
 * isValidStatusTransition('draft', 'init') // false
 * isValidStatusTransition('published', 'draft') // false
 */
export function isValidStatusTransition(
  fromStatus: string,
  toStatus: string
): boolean {
  const allowed = STATUS_TRANSITIONS[fromStatus] || []
  return allowed.includes(toStatus)
}

/**
 * 状态选项配置（用于 UI 下拉菜单）
 */
export const STATUS_OPTIONS = [
  { value: 'init', label: '初始化', labelEn: 'Initializing' },
  { value: 'draft', label: '草稿', labelEn: 'Draft' },
  { value: 'published', label: '已发布', labelEn: 'Published' },
  { value: 'archived', label: '已存档', labelEn: 'Archived' },
] as const

/**
 * 获取状态的显示文本
 */
export function getStatusLabel(status: ArticleStatus, locale: string = 'zh'): string {
  const option = STATUS_OPTIONS.find(opt => opt.value === status)
  if (!option) return status
  return locale === 'zh' ? option.label : option.labelEn
}
