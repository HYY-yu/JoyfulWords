export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ============ 功能开关配置 ============
/**
 * 功能状态枚举
 * - doing: 开发中,显示 Coming Soon 页面
 * - show: 已上线,显示完整功能
 */
export type FeatureStatus = 'doing' | 'show'

/**
 * 功能开关配置
 * 通过环境变量控制各功能的可见性
 * 环境变量命名: NEXT_PUBLIC_FEATURE_{FEATURE_NAME}
 * 默认值: 'doing' (开发中)
 */
export const featureFlags = {
  'image-generation': parseFeatureStatus(process.env.NEXT_PUBLIC_FEATURE_IMAGE_GENERATION),
  'knowledge-cards': parseFeatureStatus(process.env.NEXT_PUBLIC_FEATURE_KNOWLEDGE_CARDS),
  'seo-geo': parseFeatureStatus(process.env.NEXT_PUBLIC_FEATURE_SEO_GEO),
} as const

/**
 * 功能 ID 类型推断
 */
export type FeatureId = keyof typeof featureFlags

/**
 * 解析环境变量为功能状态
 */
function parseFeatureStatus(value: string | undefined): FeatureStatus {
  if (value === 'show') return 'show'
  if (value === 'doing') return 'doing'

  // 开发环境下警告无效值
  if (value && process.env.NODE_ENV === 'development') {
    console.warn(
      `[Feature Flags] Invalid value "${value}". Expected 'show' or 'doing'. Defaulting to 'doing'.`
    )
  }

  return 'doing' // 默认值
}

/**
 * 检查功能是否已上线
 * @param featureId 功能 ID
 * @returns true 表示功能已上线
 */
export function isFeatureEnabled(featureId: FeatureId): boolean {
  return featureFlags[featureId] === 'show'
}
