"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { usePayment } from '@/lib/hooks/use-payment'
import { useTranslation } from '@/lib/i18n/i18n-context'
import { Loader2Icon, CheckCircle2Icon, XCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/base/button'
import { detectPaymentProvider, getProviderDescription } from '@/lib/payment'

type OrderStatus = 'loading' | 'pending' | 'success' | 'failed' | 'timeout'

export function PaymentSuccessContent() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { getOrderStatus } = usePayment()

  // 检测支付供应商
  const detection = detectPaymentProvider(searchParams)

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
        params: Object.fromEntries(searchParams.entries()),
      })
    }
  }, [detection, searchParams])

  const orderNo = detection?.orderNo || null
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(detection ? 'loading' : 'failed')
  const [credits, setCredits] = useState<number>(0)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 15 // 最多轮询 15 次（75 秒，5 秒间隔）

  // 使用 ref 来跟踪轮询是否应该继续，以及 timeout ID
  const shouldContinuePollingRef = useRef(true)
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)

  const verifyOrder = useCallback(async () => {
    // 检查是否应该继续轮询
    if (!shouldContinuePollingRef.current) {
      console.debug('[PaymentSuccess] 轮询已停止，跳过本次查询')
      setOrderStatus('failed')
      return
    }

    if (!orderNo) {
      console.warn('[PaymentSuccess] 订单号缺失，无法查询订单状态')
      shouldContinuePollingRef.current = false
      setOrderStatus('failed')
      return
    }

    const currentRetryCount = retryCountRef.current
    console.debug('[PaymentSuccess] 开始查询订单状态', { orderNo, provider: detection?.provider, retryCount: currentRetryCount })
    const result = await getOrderStatus(orderNo)

    // 检查是否应该继续轮询（API 返回后可能已经停止）
    if (!shouldContinuePollingRef.current) {
      console.debug('[PaymentSuccess] 轮询已在请求期间停止，放弃结果')
      return
    }

    if (!result) {
      console.debug('[PaymentSuccess] 订单状态未返回，继续轮询', {
        orderNo,
        retryCount: currentRetryCount + 1,
      })
      if (currentRetryCount < MAX_RETRIES) {
        // 继续轮询（5 秒间隔，避免接口频率限制）
        retryCountRef.current = currentRetryCount + 1
        setRetryCount(currentRetryCount + 1)
        timeoutIdRef.current = setTimeout(verifyOrder, 5000)
      } else {
        // 超时
        console.warn('[PaymentSuccess] 订单状态查询超时', { orderNo, MAX_RETRIES })
        shouldContinuePollingRef.current = false
        setOrderStatus('timeout')
      }
      return
    }

    setCredits(result.credits)
    console.info('[PaymentSuccess] 订单状态已更新', {
      orderNo,
      status: result.status,
      credits: result.credits,
    })

    if (result.status === 'completed') {
      console.info('[PaymentSuccess] 订单已完成', { orderNo, credits: result.credits })
      shouldContinuePollingRef.current = false
      setOrderStatus('success')
    } else if (result.status === 'pending' || result.status === 'paid') {
      console.debug('[PaymentSuccess] 订单处理中，继续轮询', {
        orderNo,
        status: result.status,
        retryCount: currentRetryCount + 1,
      })
      // 继续轮询（5 秒间隔，避免接口频率限制）
      if (currentRetryCount < MAX_RETRIES) {
        retryCountRef.current = currentRetryCount + 1
        setRetryCount(currentRetryCount + 1)
        timeoutIdRef.current = setTimeout(verifyOrder, 5000)
      } else {
        // 超时
        console.warn('[PaymentSuccess] 订单处理超时', { orderNo, status: result.status })
        shouldContinuePollingRef.current = false
        setOrderStatus('timeout')
      }
    } else {
      // failed, cancelled, compensation_needed
      console.warn('[PaymentSuccess] 订单失败', { orderNo, status: result.status })
      shouldContinuePollingRef.current = false
      setOrderStatus('failed')
    }
  }, [orderNo, getOrderStatus, MAX_RETRIES, detection?.provider])

  useEffect(() => {
    verifyOrder()

    // cleanup 函数：组件卸载或状态改变时清除 timeout
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
        timeoutIdRef.current = null
      }
      shouldContinuePollingRef.current = false
    }
  }, [verifyOrder])

  const handleBackToBilling = () => {
    router.push('/?tab=billing')
  }

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
