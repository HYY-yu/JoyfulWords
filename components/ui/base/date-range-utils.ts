import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths, type Locale } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { DateRange } from 'react-day-picker'
export type { DateRange } from 'react-day-picker'

/**
 * 预设日期范围类型
 */
export type PresetType = 'today' | 'yesterday' | 'last7Days' | 'last30Days' | 'thisMonth' | 'lastMonth'

/**
 * 日期范围工具函数
 */
export const DateRangeUtils = {
  /**
   * 格式化日期范围为 ISO 字符串 (YYYY-MM-DD HH:mm)
   */
  formatToISO: (range: DateRange | undefined): { start?: string; end?: string } => {
    if (!range?.from || !range?.to) {
      return { start: undefined, end: undefined }
    }

    return {
      start: format(range.from, 'yyyy-MM-dd HH:mm', { locale: zhCN }),
      end: format(range.to, 'yyyy-MM-dd HH:mm', { locale: zhCN }),
    }
  },

  /**
   * 格式化日期范围为显示文本
   * @param range 日期范围
   * @param locale 当前语言 (zh-CN | en-US)
   * @param placeholder 未选择时的占位符
   */
  formatToDisplay: (
    range: DateRange | undefined,
    locale: Locale = zhCN,
    placeholder: string = '选择日期范围'
  ): string => {
    if (!range?.from) return placeholder
    if (!range?.to) return format(range.from, 'yyyy-MM-dd', { locale })

    const from = format(range.from, 'yyyy-MM-dd', { locale })
    const to = format(range.to, 'yyyy-MM-dd', { locale })
    return `${from} ~ ${to}`
  },

  /**
   * 验证日期范围是否有效
   */
  validateRange: (range: DateRange | undefined): boolean => {
    if (!range?.from || !range?.to) return false
    return range.from <= range.to
  },

  /**
   * 获取范围的边界时间（当天 00:00:00 - 23:59:59）
   */
  getRangeBoundaries: (range: DateRange): { start: Date; end: Date } => {
    if (!range.from || !range.to) {
      throw new Error('Invalid date range: from and to are required')
    }

    return {
      start: startOfDay(range.from),
      end: endOfDay(range.to),
    }
  },

  /**
   * 检查两个日期范围是否相等
   */
  isRangeEqual: (range1: DateRange | undefined, range2: DateRange | undefined): boolean => {
    if (!range1?.from || !range1?.to) return false
    if (!range2?.from || !range2?.to) return false

    const r1Start = startOfDay(range1.from).getTime()
    const r1End = endOfDay(range1.to).getTime()
    const r2Start = startOfDay(range2.from).getTime()
    const r2End = endOfDay(range2.to).getTime()

    return r1Start === r2Start && r1End === r2End
  },
}

/**
 * 获取预设日期范围
 */
export function getPresetRange(type: PresetType): DateRange {
  const today = new Date()

  switch (type) {
    case 'today':
      return { from: today, to: today }
    case 'yesterday':
      return { from: subDays(today, 1), to: subDays(today, 1) }
    case 'last7Days':
      return { from: subDays(today, 6), to: today }
    case 'last30Days':
      return { from: subDays(today, 29), to: today }
    case 'thisMonth':
      return { from: startOfMonth(today), to: today }
    case 'lastMonth': {
      const lastMonth = subMonths(today, 1)
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) }
    }
    default:
      return { from: today, to: today }
  }
}
