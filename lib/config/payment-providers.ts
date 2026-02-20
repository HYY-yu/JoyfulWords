/**
 * 支付渠道配置
 * 用于控制各个支付渠道的显示和隐藏
 *
 * 通过环境变量 NEXT_PUBLIC_ENABLED_PAYMENT_PROVIDERS 控制
 * 多个渠道用逗号分隔，例如: "paypal,oxapay"
 * 如果未设置环境变量，默认启用所有渠道
 */

export type PaymentProviderConfig = {
  enabled: boolean
  priority?: number // 用于排序，数字越小越靠前
}

export type PaymentProvidersConfig = Record<string, PaymentProviderConfig>

/**
 * 从环境变量解析启用的支付渠道
 */
function parseEnabledProviders(): string[] {
  const envValue = process.env.NEXT_PUBLIC_ENABLED_PAYMENT_PROVIDERS

  if (!envValue || envValue.trim() === '') {
    // 默认启用所有渠道
    return ['paypal', 'oxapay']
  }

  return envValue
    .split(',')
    .map(provider => provider.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * 支付渠道完整配置
 */
export const PAYMENT_PROVIDERS_CONFIG: PaymentProvidersConfig = {
  paypal: {
    enabled: true,
    priority: 1,
  },
  oxapay: {
    enabled: true,
    priority: 2,
  },
}

/**
 * 根据环境变量过滤并排序支付渠道
 */
export function getEnabledPaymentProviders(): string[] {
  const enabledFromEnv = parseEnabledProviders()

  return Object.entries(PAYMENT_PROVIDERS_CONFIG)
    .filter(([provider]) => enabledFromEnv.includes(provider))
    .sort(([, a], [, b]) => (a.priority || 999) - (b.priority || 999))
    .map(([provider]) => provider)
}

/**
 * 检查指定支付渠道是否启用
 */
export function isPaymentProviderEnabled(provider: string): boolean {
  const enabledFromEnv = parseEnabledProviders()
  return enabledFromEnv.includes(provider)
}
