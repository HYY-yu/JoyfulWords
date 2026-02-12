/**
 * 支付供应商 URL 参数配置
 * 用于识别不同支付供应商的回调 URL 特征
 */

import type { PaymentProvider } from '@/lib/api/payment/types'

/**
 * 支付供应商 URL 参数模式
 */
export interface ProviderUrlPattern {
  provider: PaymentProvider
  requiredParams: string[] // 必须同时存在的参数
  optionalParams?: string[] // 可选参数
  orderIdField: string // 订单 ID 字段名（如 paypal 用 token，payin 用 payment_id）
  description: string
}

/**
 * 支付供应商配置表
 * 新增供应商只需在此添加配置
 */
export const PAYMENT_PROVIDER_CONFIG: ProviderUrlPattern[] = [
  {
    provider: 'paypal',
    requiredParams: ['token', 'PayerID'],
    optionalParams: ['order_no'],
    orderIdField: 'token', // PayPal 的 token 就是订单 ID
    description: 'PayPal 回调',
  },
  {
    provider: 'oxapay',
    requiredParams: ['payment_id'],
    optionalParams: ['order_no', 'txid'],
    orderIdField: 'payment_id', // Oxapay 的 payment_id 就是订单 ID
    description: 'Oxapay 加密货币支付',
  },
  // {
  //   provider: 'paydify',
  //   requiredParams: ['checkout_id'],
  //   optionalParams: ['order_no'],
  //   orderIdField: 'checkout_id',
  //   description: 'Paydify 支付',
  // },
]
