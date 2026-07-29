"use client"

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { usePayment } from '@/lib/hooks/use-payment'
import { useTranslation } from '@/lib/i18n/i18n-context'
import { Loader2Icon, CheckCircle2Icon, XCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/base/button'
import {
  clearLastOrderNo,
  detectPaymentProvider,
  getLastOrderNo,
  getPaymentReturnStatus,
  getProviderDescription,
} from '@/lib/payment'
import { trackProductEvent } from '@/lib/analytics/client'
import { PRODUCT_ANALYTICS_EVENTS } from '@/lib/analytics/events'
import { useAdaptivePolling } from '@/lib/hooks/use-adaptive-polling'

type OrderStatus = 'loading' | 'pending' | 'success' | 'failed' | 'timeout' | 'processing'

export function PaymentSuccessContent() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { getOrderStatus } = usePayment()

  // 检测支付供应商
  const detection = searchParams ? detectPaymentProvider(searchParams) : null

  // Debug 日志：记录供应商检测信息
  useEffect(() => {
    if (detection) {
      console.debug('[PaymentSuccess] 检测到支付信息:', {
        provider: detection.provider,
        description: detection.provider ? getProviderDescription(detection.provider) : '未知',
        params: detection.params,
        orderNo: detection.orderNo,
      })
    } else {
      console.debug('[PaymentSuccess] 未能识别支付信息', {
        params: Object.fromEntries(searchParams?.entries() ?? []),
      })
    }
  }, [detection, searchParams])

  const urlOrderNo = detection?.orderNo || null
  const [orderNo, setOrderNo] = useState<string | null>(urlOrderNo)

  // 初始状态：URL 有参数 → loading，无参数 → processing（等待 localStorage 回退）
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(
    urlOrderNo ? 'loading' : 'processing'
  )
  const [credits, setCredits] = useState<number>(0)
  const [retryCount, setRetryCount] = useState(0)
  const PAYMENT_POLLING_TIMEOUT_MS = 75_000

  // localStorage 回退逻辑：URL 无参数时，尝试从 localStorage 读取订单号
  useEffect(() => {
    // 如果 URL 中已有订单号，直接跳过
    if (urlOrderNo) {
      console.debug('[PaymentSuccess] URL 中已有订单号，跳过 localStorage 回退', { urlOrderNo })
      return
    }

    // 尝试从 localStorage 读取订单号
    console.debug('[PaymentSuccess] URL 中无订单号，尝试从 localStorage 读取')
    const storedOrderNo = getLastOrderNo()

    if (storedOrderNo) {
      console.info('[PaymentSuccess] 从 localStorage 读取到订单号', { storedOrderNo })
      setOrderNo(storedOrderNo)
      setOrderStatus('loading')
    } else {
      console.warn('[PaymentSuccess] localStorage 中也无订单号，显示"处理中"状态')
      setOrderStatus('processing') // URL 和 localStorage 都没有，显示处理中
    }
  }, [urlOrderNo])

  const {
    startPolling: startOrderPolling,
    stopPolling: stopOrderPolling,
  } = useAdaptivePolling({
    poll: async ({ attempt }) => {
      if (!orderNo) return "stop"
      setRetryCount(attempt)
      console.debug('[PaymentSuccess] 查询订单状态', {
        orderNo,
        provider: detection?.provider,
        attempt,
      })
      const result = await getOrderStatus(orderNo)
    if (!result) {
        console.warn('[PaymentSuccess] 订单状态未返回，稍后重试', { orderNo, attempt })
        throw new Error("Payment order status is unavailable")
    }

    setCredits(result.credits)
    console.info('[PaymentSuccess] 订单状态已更新', {
        orderNo,
      status: result.status,
      credits: result.credits,
    })

    const paymentReturnStatus = getPaymentReturnStatus(result.status)

    if (paymentReturnStatus === 'success') {
        console.info('[PaymentSuccess] 订单已完成', { orderNo, credits: result.credits })
      trackProductEvent(PRODUCT_ANALYTICS_EVENTS.PAYMENT_COMPLETED, {
          provider: detection?.provider || null,
        credits: result.credits,
        order_status: result.status,
      })
      setOrderStatus('success')
      clearLastOrderNo()
        return "stop"
    } else if (paymentReturnStatus === 'processing') {
      console.debug('[PaymentSuccess] 订单处理中，继续轮询', {
          orderNo,
        status: result.status,
          attempt,
      })
        setOrderStatus('pending')
        return { action: "continue", delayMs: 5_000 }
    } else {
        console.warn('[PaymentSuccess] 订单失败', { orderNo, status: result.status })
      trackProductEvent(PRODUCT_ANALYTICS_EVENTS.PAYMENT_FAILED, {
          provider: detection?.provider || null,
        order_status: result.status,
      })
      setOrderStatus('failed')
      clearLastOrderNo()
        return "stop"
    }
    },
    onTimeout: () => {
      console.warn('[PaymentSuccess] 订单状态查询超时', { orderNo })
      trackProductEvent(PRODUCT_ANALYTICS_EVENTS.PAYMENT_FAILED, {
        provider: detection?.provider || null,
        order_status: 'timeout',
      })
      setOrderStatus('timeout')
    },
    policy: {
      fastIntervalMs: 5_000,
      fastWindowMs: PAYMENT_POLLING_TIMEOUT_MS,
      standardIntervalMs: 5_000,
      standardWindowMs: PAYMENT_POLLING_TIMEOUT_MS,
      slowIntervalMs: 5_000,
      maxErrorIntervalMs: 10_000,
      timeoutMs: PAYMENT_POLLING_TIMEOUT_MS,
      jitterRatio: 0,
    },
    debugLabel: "payment-order",
  })

  useEffect(() => {
    if (!orderNo) {
      stopOrderPolling()
      return
    }

    console.info('[PaymentSuccess] 订单号已就绪，开始自适应轮询', { orderNo })
    startOrderPolling()
    return stopOrderPolling
  }, [orderNo, startOrderPolling, stopOrderPolling])

  const handleBackToBilling = () => {
    router.push('/articles?tab=billing')
  }

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Processing 状态 - 等待获取订单号 */}
        {orderStatus === 'processing' && (
          <div className="text-center space-y-6">
            <Loader2Icon className="w-16 h-16 animate-spin text-muted-foreground mx-auto" />
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {t('billing.payment.success.processing')}
              </h1>
              <p className="text-muted-foreground">
                {t('billing.payment.success.processingDesc')}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              {t('billing.payment.success.processingHint')}
            </div>
            <Button onClick={handleBackToBilling} className="w-full">
              {t('billing.payment.success.backToBilling')}
            </Button>
          </div>
        )}

        {/* Loading 状态 */}
        {orderStatus === 'loading' && (
          <div className="text-center space-y-4">
            <Loader2Icon className="w-16 h-16 animate-spin text-primary mx-auto" />
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {t('billing.payment.success.confirming')}
              </h1>
              <p className="text-muted-foreground">
                {t('billing.payment.success.confirmingDesc')}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              {t('billing.payment.success.retryCount', { count: retryCount + 1 })}
            </div>
          </div>
        )}

        {/* Pending 状态（轮询中） */}
        {orderStatus === 'pending' && (
          <div className="text-center space-y-4">
            <Loader2Icon className="w-16 h-16 animate-spin text-primary mx-auto" />
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {t('billing.payment.success.pending')}
              </h1>
              <p className="text-muted-foreground">
                {t('billing.payment.success.pendingDesc')}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              {t('billing.payment.success.retryCount', { count: retryCount + 1 })}
            </div>
          </div>
        )}

        {/* Success 状态 */}
        {orderStatus === 'success' && (
          <div className="text-center space-y-6">
            <CheckCircle2Icon className="w-16 h-16 text-green-500 mx-auto" />
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {t('billing.payment.success.title')}
              </h1>
              <p className="text-muted-foreground">
                {t('billing.payment.success.desc', { credits })}
              </p>
            </div>
            <Button onClick={handleBackToBilling} className="w-full">
              {t('billing.payment.success.backToBilling')}
            </Button>
          </div>
        )}

        {/* Failed 状态 */}
        {orderStatus === 'failed' && (
          <div className="text-center space-y-6">
            <XCircleIcon className="w-16 h-16 text-destructive mx-auto" />
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {t('billing.payment.failed.title')}
              </h1>
              <p className="text-muted-foreground">
                {t('billing.payment.failed.desc')}
              </p>
            </div>
            <div className="space-y-2">
              <Button onClick={handleBackToBilling} className="w-full">
                {t('billing.payment.success.backToBilling')}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                {t('billing.payment.failed.retry')}
              </Button>
            </div>
          </div>
        )}

        {/* Timeout 状态 */}
        {orderStatus === 'timeout' && (
          <div className="text-center space-y-6">
            <Loader2Icon className="w-16 h-16 text-muted-foreground mx-auto" />
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {t('billing.payment.timeout.title')}
              </h1>
              <p className="text-muted-foreground">
                {t('billing.payment.timeout.desc')}
              </p>
            </div>
            <div className="space-y-2">
              <Button onClick={handleBackToBilling} className="w-full">
                {t('billing.payment.success.backToBilling')}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                {t('billing.payment.failed.retry')}
              </Button>
            </div>
          </div>
        )}

        {/* 订单号和供应商显示 */}
        {detection && (
          <div className="mt-8 text-center text-xs text-muted-foreground space-y-1">
            <div>
              {t('billing.payment.orderNo')}: {detection.orderNo || '-'}
            </div>
            {detection.provider && (
              <div className="text-muted-foreground/70">
                {t('billing.payment.provider')}: {detection.provider}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
