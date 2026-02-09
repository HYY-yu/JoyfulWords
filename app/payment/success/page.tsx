"use client"

// 强制动态渲染,因为需要读取 URL 参数中的订单号
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { usePayment } from '@/lib/hooks/use-payment'
import { useTranslation } from '@/lib/i18n/i18n-context'
import { Loader2Icon, CheckCircle2Icon, XCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/base/button'

type OrderStatus = 'loading' | 'pending' | 'success' | 'failed' | 'timeout'

export default function PaymentSuccessPage() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { getOrderStatus } = usePayment()

  const orderNo = searchParams.get('order_no')
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('loading')
  const [credits, setCredits] = useState<number>(0)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 15 // 最多轮询 15 次（30 秒）

  const verifyOrder = useCallback(async () => {
    if (!orderNo) {
      setOrderStatus('failed')
      return
    }

    const result = await getOrderStatus(orderNo)

    if (!result) {
      if (retryCount < MAX_RETRIES - 1) {
        // 继续轮询
        setRetryCount((prev) => prev + 1)
        setTimeout(verifyOrder, 2000)
      } else {
        // 超时
        setOrderStatus('timeout')
      }
      return
    }

    setCredits(result.credits)

    if (result.status === 'completed') {
      setOrderStatus('success')
    } else if (result.status === 'pending' || result.status === 'paid') {
      // 继续轮询
      if (retryCount < MAX_RETRIES - 1) {
        setRetryCount((prev) => prev + 1)
        setTimeout(verifyOrder, 2000)
      } else {
        // 超时
        setOrderStatus('timeout')
      }
    } else {
      // failed, cancelled, compensation_needed
      setOrderStatus('failed')
    }
  }, [orderNo, getOrderStatus, retryCount, MAX_RETRIES])

  useEffect(() => {
    verifyOrder()
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

        {/* 订单号显示 */}
        {orderNo && (
          <div className="mt-8 text-center text-xs text-muted-foreground">
            {t('billing.payment.orderNo')}: {orderNo}
          </div>
        )}
      </div>
    </div>
  )
}
