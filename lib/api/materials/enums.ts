/**
 * Material API 枚举常量
 * 所有枚举值来自 API 文档定义
 */

// ==================== Material Types ====================

export const MATERIAL_TYPES = {
  INFO: 'info',
  NEWS: 'news',
  IMAGE: 'image',
} as const

export type MaterialTypeValue = typeof MATERIAL_TYPES[keyof typeof MATERIAL_TYPES]

// ==================== Material Status ====================

export const MATERIAL_STATUS = {
  DOING: 'doing',
  SUCCESS: 'success',
  FAILED: 'failed',
  NODATA: 'nodata',
} as const

export type MaterialStatusValue = typeof MATERIAL_STATUS[keyof typeof MATERIAL_STATUS]

// ==================== UI Options ====================

/**
 * 素材类型筛选选项（包含"全部"选项）
 */
export const MATERIAL_TYPE_FILTER_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: MATERIAL_TYPES.INFO, label: '资料' },
  { value: MATERIAL_TYPES.NEWS, label: '新闻' },
  { value: MATERIAL_TYPES.IMAGE, label: '图片' },
] as const

/**
 * 搜索状态筛选选项（包含"全部"选项）
 */
export const MATERIAL_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: MATERIAL_STATUS.DOING, label: '进行中' },
  { value: MATERIAL_STATUS.SUCCESS, label: '成功' },
  { value: MATERIAL_STATUS.FAILED, label: '失败' },
  { value: MATERIAL_STATUS.NODATA, label: '无数据' },
] as const

/**
 * 搜索 Tab 选项（UI 使用）
 * 映射 UI 标签到 API 枚举值
 */
export const SEARCH_TAB_OPTIONS = [
  {
    uiLabel: 'Info', // UI 组件使用的标签
    apiValue: 'info', // API 调用使用的值
    i18nKey: 'info', // 国际化 key
  },
  {
    uiLabel: 'News',
    apiValue: 'news',
    i18nKey: 'news',
  },
  {
    uiLabel: 'Image',
    apiValue: 'image',
    i18nKey: 'image',
  },
] as const

/**
 * UI Tab 标签到 API 枚举值的映射
 */
export const UI_TAB_TO_API_TYPE: Record<string, MaterialTypeValue> = {
  'Info': 'info',
  'News': 'news',
  'Image': 'image',
}

/**
 * API 枚举值到 UI Tab 标签的映射
 */
export const API_TYPE_TO_UI_TAB: Record<MaterialTypeValue, string> = {
  'info': 'Info',
  'news': 'News',
  'image': 'Image',
}

/**
 * 搜索状态颜色配置
 */
export const STATUS_COLOR_CONFIG: Record<MaterialStatusValue, { bg: string; text: string }> = {
  doing: { bg: 'bg-blue-500/10', text: 'text-blue-600' },
  success: { bg: 'bg-green-500/10', text: 'text-green-600' },
  failed: { bg: 'bg-red-500/10', text: 'text-red-600' },
  nodata: { bg: 'bg-gray-500/10', text: 'text-gray-600' },
}
