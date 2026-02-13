"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { usePayment } from '@/lib/hooks/use-payment'
import { useTranslation } from '@/lib/i18n/i18n-context'
import { Loader2Icon, CheckCircle2Icon, XCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/base/button'
import { detectPaymentProvider, getProviderDescription, getLastOrderNo, clearLastOrderNo } from '@/lib/payment'

type OrderStatus = 'loading' | 'pending' | 'success' | 'failed' | 'timeout' | 'processing'

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

  const urlOrderNo = detection?.orderNo || null
  const [orderNo, setOrderNo] = useState<string | null>(urlOrderNo)

  // 初始状态：URL 有参数 → loading，无参数 → processing（等待 localStorage 回退）
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(
    urlOrderNo ? 'loading' : 'processing'
  )
  const [credits, setCredits] = useState<number>(0)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 15 // 最多轮询 15 次（75 秒，5 秒间隔）

  // 使用 ref 来跟踪轮询是否应该继续，以及 timeout ID
  const shouldContinuePollingRef = useRef(true)
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const orderNoRef = useRef(orderNo)
  const getOrderStatusRef = useRef(getOrderStatus)
  const isUnmountedRef = useRef(false) // 追踪组件是否真正卸载

  // 同步 ref
  useEffect(() => {
    console.log('[PaymentSuccess] 同步 ref', { orderNo, orderNoRefBefore: orderNoRef.current })
    orderNoRef.current = orderNo
    getOrderStatusRef.current = getOrderStatus
  }, [orderNo, getOrderStatus])

  // 将 detection 也存入 ref，避免依赖变化
  const detectionRef = useRef(detection)
  useEffect(() => {
    detectionRef.current = detection
  }, [detection])

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
      console.log('[PaymentSuccess] 设置 orderNo 前，shouldContinuePollingRef.current =', shouldContinuePollingRef.current)
      setOrderNo(storedOrderNo)
      // 注意：不调用 setOrderStatus，避免触发重新渲染导致 cleanup 提前执行
    } else {
      console.warn('[PaymentSuccess] localStorage 中也无订单号，显示"处理中"状态')
      setOrderStatus('processing') // URL 和 localStorage 都没有，显示处理中
    }
  }, [urlOrderNo])

  // 追踪组件卸载
  useEffect(() => {
    return () => {
      console.log('[PaymentSuccess] 组件卸载')
      isUnmountedRef.current = true
      shouldContinuePollingRef.current = false
    }
  }, [])

  const verifyOrder = useCallback(async () => {
    console.log('[PaymentSuccess] verifyOrder 被调用', {
      shouldContinuePolling: shouldContinuePollingRef.current,
      orderNoRef: orderNoRef.current,
      orderNoState: orderNo,
    })

    // 检查是否应该继续轮询
    if (!shouldContinuePollingRef.current) {
      console.warn('[PaymentSuccess] 轮询已停止，跳过本次查询', {
        shouldContinuePolling: shouldContinuePollingRef.current,
      })
      setOrderStatus('failed')
      return
    }

    const currentOrderNo = orderNoRef.current
    if (!currentOrderNo) {
      console.debug('[PaymentSuccess] 订单号暂未获取，等待 localStorage 回退')
      // 不要停止轮询，等待 localStorage 回退完成
      return
    }

    const currentRetryCount = retryCountRef.current
    console.debug('[PaymentSuccess] 开始查询订单状态', { orderNo: currentOrderNo, provider: detectionRef.current?.provider, retryCount: currentRetryCount })
    const result = await getOrderStatusRef.current(currentOrderNo)

    // Debug: 打印完整的 API 返回数据
    console.log('[PaymentSuccess] API 返回数据:', result, {
      hasStatus: !!result?.status,
      status: result?.status,
      statusType: typeof result?.status,
    })

    // 检查是否应该继续轮询（API 返回后可能已经停止）
    if (!shouldContinuePollingRef.current) {
      console.debug('[PaymentSuccess] 轮询已在请求期间停止，放弃结果')
      return
    }

    if (!result) {
      console.debug('[PaymentSuccess] 订单状态未返回，继续轮询', {
        orderNo: currentOrderNo,
        retryCount: currentRetryCount + 1,
      })
      if (currentRetryCount < MAX_RETRIES) {
        // 继续轮询（5 秒间隔，避免接口频率限制）
        retryCountRef.current = currentRetryCount + 1
        setRetryCount(currentRetryCount + 1)
        timeoutIdRef.current = setTimeout(verifyOrder, 5000)
      } else {
        // 超时
        console.warn('[PaymentSuccess] 订单状态查询超时', { orderNo: currentOrderNo, MAX_RETRIES })
        shouldContinuePollingRef.current = false
        setOrderStatus('timeout')
      }
      return
    }

    setCredits(result.credits)
    console.info('[PaymentSuccess] 订单状态已更新', {
      orderNo: currentOrderNo,
      status: result.status,
      credits: result.credits,
    })

    if (result.status === 'completed') {
      console.info('[PaymentSuccess] 订单已完成', { orderNo: currentOrderNo, credits: result.credits })
      shouldContinuePollingRef.current = false
      setOrderStatus('success')

      // 清除 localStorage 中的订单号
      clearLastOrderNo()
    } else if (result.status === 'pending' || result.status === 'paid') {
      console.debug('[PaymentSuccess] 订单处理中，继续轮询', {
        orderNo: currentOrderNo,
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
        console.warn('[PaymentSuccess] 订单处理超时', { orderNo: currentOrderNo, status: result.status })
        shouldContinuePollingRef.current = false
        setOrderStatus('timeout')
      }
    } else {
      // failed, cancelled, compensation_needed
      console.warn('[PaymentSuccess] 订单失败', { orderNo: currentOrderNo, status: result.status })
      shouldContinuePollingRef.current = false
      setOrderStatus('failed')

      // 清除 localStorage 中的订单号
      clearLastOrderNo()
    }
  }, [])

  useEffect(() => {
    // 只有当 orderNo 有效时才开始轮询
    if (orderNo) {
      console.debug('[PaymentSuccess] 订单号已就绪，开始轮询', { orderNo })
      console.log('[PaymentSuccess] 调用 verifyOrder 前，shouldContinuePollingRef.current =', shouldContinuePollingRef.current)
      verifyOrder()
    }

    // cleanup 函数：组件卸载时清除 timeout
    return () => {
      console.log('[PaymentSuccess] useEffect cleanup 执行，isUnmounted =', isUnmountedRef.current)
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
        timeoutIdRef.current = null
      }
      // 只在组件真正卸载时停止轮询，不要在 re-render cleanup 时停止
      if (isUnmountedRef.current) {
        shouldContinuePollingRef.current = false
      }
    }
  }, [orderNo])

  const handleBackToBilling = () => {
    router.push('/?tab=billing')
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
