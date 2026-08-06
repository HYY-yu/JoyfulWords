"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  Loader2Icon,
  RotateCcwIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/base/button'
import { usePayment } from '@/lib/hooks/use-payment'
import { useTranslation } from '@/lib/i18n/i18n-context'
import type { OrderDetail } from '@/lib/api/payment/types'

export function PaymentCreateFailedContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderNo = searchParams?.get('order_no')?.trim() ?? ''
  const { createOrder, getOrderDetail } = usePayment()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    let active = true

    async function loadOrder() {
      if (!orderNo) {
        setLoadFailed(true)
        setLoading(false)
        return
      }
      const result = await getOrderDetail(orderNo)
      if (!active) return
      setOrder(result)
      setLoadFailed(!result)
      setLoading(false)
    }

    void loadOrder()
    return () => {
      active = false
    }
  }, [getOrderDetail, orderNo])

  const handleRetry = async () => {
    if (!order || retrying) return
    setRetrying(true)
    try {
      const result = await createOrder(order.provider, order.credits, {
        forceNewRequest: true,
      })
      if (!result) return

      if (result.status === 'create_failed') {
        setOrder(result)
        router.replace(`/payment/failed?order_no=${encodeURIComponent(result.order_no)}`)
        return
      }
      if (result.approval_url) {
        window.location.href = result.approval_url
        return
      }
      router.replace(`/payment/success?order_no=${encodeURIComponent(result.order_no)}`)
    } finally {
      setRetrying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center space-y-4 animate-in fade-in duration-300">
          <Loader2Icon className="size-10 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            {t('billing.payment.createFailed.loading')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-6 py-14">
      <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-500">
        <AlertTriangleIcon className="size-14 text-amber-500 mb-7" aria-hidden="true" />

        <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-3">
          {t('billing.payment.createFailed.eyebrow')}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {t('billing.payment.createFailed.title')}
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          {loadFailed
            ? t('billing.payment.createFailed.loadFailed')
            : t('billing.payment.createFailed.description')}
        </p>

        {order && (
          <dl className="mt-8 border-y border-border/70 divide-y divide-border/70">
            <div className="flex items-center justify-between gap-6 py-4">
              <dt className="text-sm text-muted-foreground">
                {t('billing.payment.orderNo')}
              </dt>
              <dd className="text-sm font-mono text-right break-all">{order.order_no}</dd>
            </div>
            <div className="flex items-center justify-between gap-6 py-4">
              <dt className="text-sm text-muted-foreground">
                {t('billing.payment.provider')}
              </dt>
              <dd className="text-sm font-medium">
                {t(`billing.payment.providers.${order.provider}`)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-6 py-4">
              <dt className="text-sm text-muted-foreground">
                {t('billing.payment.createFailed.credits')}
              </dt>
              <dd className="text-sm font-medium">
                {t('billing.payment.createFailed.creditsValue', { credits: order.credits })}
              </dd>
            </div>
          </dl>
        )}

        {order && (
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            {t('billing.payment.createFailed.retryNotice')}
          </p>
        )}

        <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3">
          <Button
            variant="outline"
            className="sm:flex-1"
            onClick={() => router.push('/articles?tab=billing')}
          >
            <ArrowLeftIcon className="size-4" />
            {t('billing.payment.success.backToBilling')}
          </Button>
          {order && (
            <Button className="sm:flex-1" onClick={handleRetry} disabled={retrying}>
              {retrying ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <RotateCcwIcon className="size-4" />
              )}
              {retrying
                ? t('billing.payment.createFailed.retrying')
                : t('billing.payment.createFailed.retry')}
            </Button>
          )}
        </div>
      </div>
    </main>
  )
}
