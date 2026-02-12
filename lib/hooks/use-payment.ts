import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/lib/i18n/i18n-context'
import { paymentClient } from '@/lib/api/payment/client'
import { getValidAccessToken } from '@/lib/tokens/refresh'
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  OrderDetail,
  PaymentProvider,
} from '@/lib/api/payment/types'

/**
 * 支付自定义 Hook
 * 提供支付相关的业务逻辑和状态管理
 */
export function usePayment() {
  const { toast } = useToast()
  const { t } = useTranslation()

  const [loading, setLoading] = useState(false)

  /**
   * 创建支付订单
   *
   * @param provider - 支付提供商
   * @param credits - 积分数
   * @param network - Payin 网络类型（仅 Payin 需要传递）
   * @param currency - Payin 币种类型（仅 Payin 需要传递）
   * @returns Promise<CreateOrderResponse | null> 成功返回订单信息，失败返回 null
   */
  const createOrder = useCallback(
    async (
      provider: PaymentProvider,
      credits: number
    ): Promise<CreateOrderResponse | null> => {
      setLoading(true)

      try {
        // 获取有效的 access token
        const token = await getValidAccessToken()
        if (!token) {
          toast({
            variant: 'destructive',
            title: t('payment.error.unauthorized'),
          })
          return null
        }

        // 构建 return_url 和 cancel_url
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const returnUrl = `${baseUrl}/payment/success`
        const cancelUrl = `${baseUrl}/payment/cancel`

        // 构建请求参数
        const request: CreateOrderRequest = {
          credits,
          provider,
          return_url: returnUrl,
          cancel_url: cancelUrl,
          timestamp: Math.floor(Date.now() / 1000),
        }

        // 调用 API 创建订单
        const result = await paymentClient.createOrder(request)

        if ('error' in result) {
          toast({
            variant: 'destructive',
            title: t('payment.error.createFailed'),
            description: result.error,
          })
          return null
        }

        return result
      } catch (error) {
        toast({
          variant: 'destructive',
          title: t('payment.error.createFailed'),
          description: error instanceof Error ? error.message : t('payment.error.unknown'),
        })
        return null
      } finally {
        setLoading(false)
      }
    },
    [toast, t]
  )

  /**
   * 查询订单详情
   *
   * @param orderNo - 订单号
   * @returns Promise<OrderDetail | null> 成功返回订单详情，失败返回 null
   */
  const getOrderDetail = useCallback(async (orderNo: string): Promise<OrderDetail | null> => {
    setLoading(true)

    try {
      const token = await getValidAccessToken()
      if (!token) {
        toast({
          variant: 'destructive',
          title: t('payment.error.unauthorized'),
        })
        return null
      }

      const result = await paymentClient.getOrderDetail(orderNo)

      if ('error' in result) {
        toast({
          variant: 'destructive',
          title: t('payment.error.queryFailed'),
          description: result.error,
        })
        return null
      }

      return result
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('payment.error.queryFailed'),
        description: error instanceof Error ? error.message : t('payment.error.unknown'),
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [toast, t])

  /**
   * 查询订单状态（主动查询支付提供商）
   *
   * @param orderNo - 订单号
   * @returns Promise<OrderDetail | null> 成功返回订单详情，失败返回 null
   */
  const getOrderStatus = useCallback(async (orderNo: string): Promise<OrderDetail | null> => {
    setLoading(true)

    try {
      const token = await getValidAccessToken()
      if (!token) {
        toast({
          variant: 'destructive',
          title: t('payment.error.unauthorized'),
        })
        return null
      }

      const result = await paymentClient.getOrderStatus(orderNo)

      if ('error' in result) {
        toast({
          variant: 'destructive',
          title: t('payment.error.queryFailed'),
          description: result.error,
        })
        return null
      }

      return result
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('payment.error.queryFailed'),
        description: error instanceof Error ? error.message : t('payment.error.unknown'),
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [toast, t])

  return {
    loading,
    createOrder,
    getOrderDetail,
    getOrderStatus,
  }
}
