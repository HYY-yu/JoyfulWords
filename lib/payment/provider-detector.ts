/**
 * 支付供应商检测工具
 * 根据回调 URL 参数识别支付供应商
 */

import { PAYMENT_PROVIDER_CONFIG } from './provider-config'
import type { PaymentProvider } from '@/lib/api/payment/types'

/**
 * 供应商检测结果
 */
export interface ProviderDetectionResult {
  provider: PaymentProvider
  params: Record<string, string | null> // 提取的所有相关参数
  orderNo: string | null // 订单号（如果有）
}

/**
 * 通用检测结果（只有 order_no 但无法识别供应商）
 */
export interface GenericDetectionResult {
  provider: null
  params: Record<string, string | null>
  orderNo: string | null
}

export type DetectionResult = ProviderDetectionResult | GenericDetectionResult

/**
 * 检测支付供应商
 *
 * @param searchParams - URLSearchParams 对象
 * @returns 检测结果，如果无法识别且没有 order_no 返回 null
 *
 * @example
 * ```ts
 * // PayPal 回调
 * const params = new URLSearchParams({ token: 'xxx', PayerID: 'yyy' })
 * detectPaymentProvider(params)
 * // => { provider: 'paypal', params: { token: 'xxx', PayerID: 'yyy' }, orderNo: null }
 *
 * // Payin 回调
 * const params = new URLSearchParams({ payment_id: 'xxx', order_no: 'yyy' })
 * detectPaymentProvider(params)
 * // => { provider: 'payin', params: { payment_id: 'xxx', order_no: 'yyy' }, orderNo: 'yyy' }
 *
 * // 通用回掉（只有 order_no）
 * const params = new URLSearchParams({ order_no: 'xxx' })
 * detectPaymentProvider(params)
 * // => { provider: null, params: { order_no: 'xxx' }, orderNo: 'xxx' }
 *
 * // 无法识别
 * const params = new URLSearchParams({ foo: 'bar' })
 * detectPaymentProvider(params)
 * // => null
 * ```
 */
export function detectPaymentProvider(
  searchParams: URLSearchParams
): DetectionResult | null {
  // 1. 首先检查是否有 order_no
  const orderNo = searchParams.get('order_no')

  // 2. 遍历配置，尝试识别供应商
  for (const config of PAYMENT_PROVIDER_CONFIG) {
    const { provider, requiredParams, optionalParams = [], orderIdField } = config

    // 检查所有必需参数是否存在
    const hasAllRequired = requiredParams.every((param) => searchParams.has(param))

    if (hasAllRequired) {
      // 识别成功
      const extractedParams: Record<string, string | null> = {}

      // 提取所有相关参数（必需 + 可选）
      for (const param of [...requiredParams, ...optionalParams]) {
        extractedParams[param] = searchParams.get(param)
      }

      // 优先使用 order_no，如果没有则使用供应商的 orderIdField
      const finalOrderNo = orderNo || searchParams.get(orderIdField)

      return {
        provider,
        params: extractedParams,
        orderNo: finalOrderNo,
      }
    }
  }

  // 3. 无法识别供应商，但如果有 order_no，返回通用结果
  if (orderNo) {
    return {
      provider: null,
      params: { order_no: orderNo },
      orderNo,
    }
  }

  // 4. 完全无法识别
  return null
}

/**
 * 获取供应商配置描述
 */
export function getProviderDescription(provider: PaymentProvider): string | null {
  const config = PAYMENT_PROVIDER_CONFIG.find((c) => c.provider === provider)
  return config?.description || null
}
