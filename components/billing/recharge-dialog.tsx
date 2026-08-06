"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/base/dialog'
import { PaymentProviderSelector } from './payment-provider-selector'
import { PaymentFormPaypal } from './payment-form-paypal'
import { PaymentFormOxapay } from './payment-form-oxapay'
import { PaymentFormStripe } from './payment-form-stripe'
import { PaymentFormCardWallets } from './payment-form-card-wallets'
import { PaymentProvider } from '@/lib/api/payment/types'
import { usePayment } from '@/lib/hooks/use-payment'
import { Loader2Icon } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/i18n-context'
import { getEnabledPaymentProviders } from '@/lib/config/payment-providers'
import { trackProductEventAndFlush } from '@/lib/analytics/client'
import { PRODUCT_ANALYTICS_EVENTS } from '@/lib/analytics/events'
import { Button } from '@/components/ui/base/button'
import { useAdaptivePolling } from '@/lib/hooks/use-adaptive-polling'
import {
  clearLastOrderNo,
  clearPendingPaymentCreateIntent,
  getCheckoutCreationAction,
  getPendingPaymentCreateIntent,
} from '@/lib/payment'

interface RechargeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialCredits?: number
}

export function RechargeDialog({ open, onOpenChange, initialCredits }: RechargeDialogProps) {
  const { t } = useTranslation()
  const { createOrder, getOrderDetail } = usePayment()

  // 获取启用的支付渠道，默认选择第一个
  const enabledProviders = getEnabledPaymentProviders()
  const defaultProvider = (enabledProviders[0] || 'oxapay') as PaymentProvider

  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>(defaultProvider)
  const [submitting, setSubmitting] = useState(false)
  const [pendingOrderNo, setPendingOrderNo] = useState<string | null>(null)
  const [waitingLong, setWaitingLong] = useState(false)
  const createRequestControllerRef = useRef<AbortController | null>(null)

  const {
    startPolling: startOrderPolling,
    stopPolling: stopOrderPolling,
  } = useAdaptivePolling({
    poll: async ({ signal }) => {
      if (!pendingOrderNo) return 'stop'

      const order = await getOrderDetail(pendingOrderNo, { signal, silent: true })
      if (!order) {
        throw new Error('Payment order detail is unavailable')
      }
      const action = getCheckoutCreationAction(order)
      if (action.kind === 'show_create_failed') {
        clearPendingPaymentCreateIntent()
        setPendingOrderNo(null)
        setSubmitting(false)
        window.location.href = `/payment/failed?order_no=${encodeURIComponent(order.order_no)}`
        return 'stop'
      }
      if (action.kind === 'open_provider') {
        clearPendingPaymentCreateIntent()
        window.location.replace(action.approvalUrl)
        return 'stop'
      }
      if (action.kind === 'show_payment_result') {
        clearPendingPaymentCreateIntent()
        window.location.href = `/payment/success?order_no=${encodeURIComponent(order.order_no)}`
        return 'stop'
      }
      return { action: 'continue', delayMs: 3_000 }
    },
    policy: {
      fastIntervalMs: 3_000,
      fastWindowMs: 30_000,
      standardIntervalMs: 5_000,
      standardWindowMs: 2 * 60_000,
      slowIntervalMs: 10_000,
      maxErrorIntervalMs: 30_000,
      timeoutMs: 24 * 60 * 60_000,
      jitterRatio: 0.1,
    },
    debugLabel: 'payment-checkout-create',
  })

  const cancelPendingRequest = useCallback(() => {
    createRequestControllerRef.current?.abort()
    createRequestControllerRef.current = null
    stopOrderPolling()
    clearPendingPaymentCreateIntent()
    clearLastOrderNo()
    setPendingOrderNo(null)
    setSubmitting(false)
    setWaitingLong(false)
  }, [stopOrderPolling])

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      cancelPendingRequest()
    }
    onOpenChange(nextOpen)
  }, [cancelPendingRequest, onOpenChange])

  useEffect(() => {
    if (!open) return
    const pendingIntent = getPendingPaymentCreateIntent()
    if (!pendingIntent?.orderNo) return

    setSelectedProvider(pendingIntent.provider)
    setPendingOrderNo(pendingIntent.orderNo)
    setSubmitting(true)
  }, [open])

  useEffect(() => {
    if (!open || !pendingOrderNo) {
      stopOrderPolling()
      return
    }

    setWaitingLong(false)
    startOrderPolling()
    const longWaitTimer = window.setTimeout(() => setWaitingLong(true), 30_000)
    return () => {
      window.clearTimeout(longWaitTimer)
      stopOrderPolling()
    }
  }, [open, pendingOrderNo, startOrderPolling, stopOrderPolling])

  const handleSubmit = async (data: { credits: number }) => {
    setSubmitting(true)
    setWaitingLong(false)
    createRequestControllerRef.current?.abort()
    const controller = new AbortController()
    createRequestControllerRef.current = controller

    try {
      await trackProductEventAndFlush(PRODUCT_ANALYTICS_EVENTS.CHECKOUT_STARTED, {
        provider: selectedProvider,
        credits: data.credits,
      })

      const result = await createOrder(
        selectedProvider,
        data.credits,
        { signal: controller.signal }
      )

      if (controller.signal.aborted) return

      if (!result) return

      const action = getCheckoutCreationAction(result)
      if (action.kind === 'show_create_failed') {
        window.location.href = `/payment/failed?order_no=${encodeURIComponent(result.order_no)}`
      } else if (action.kind === 'open_provider') {
        window.location.replace(action.approvalUrl)
      } else if (action.kind === 'show_payment_result') {
        window.location.href = `/payment/success?order_no=${encodeURIComponent(result.order_no)}`
      } else {
        setPendingOrderNo(result.order_no)
        return
      }
    } catch (error) {
      console.error('Failed to create order:', error)
    } finally {
      if (createRequestControllerRef.current === controller) {
        createRequestControllerRef.current = null
      }
      if (!pendingOrderNo && !getPendingPaymentCreateIntent()?.orderNo) {
        setSubmitting(false)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('billing.payment.dialog.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 支付商选择器 */}
          <PaymentProviderSelector
            value={selectedProvider}
            onChange={setSelectedProvider}
            t={t}
          />

          {/* 表单内容 */}
          <div className="pt-4">
            {submitting ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2Icon className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">
                  {waitingLong
                    ? t('billing.payment.checkoutWaiting.stillCreating')
                    : t('billing.payment.processing')}
                </p>
                {waitingLong && (
                  <>
                    <p className="mt-2 max-w-xs text-center text-xs leading-5 text-muted-foreground">
                      {t('billing.payment.checkoutWaiting.cancelNotice')}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-4 text-muted-foreground"
                      onClick={() => handleOpenChange(false)}
                    >
                      {t('billing.payment.checkoutWaiting.cancel')}
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <>
                {selectedProvider === 'paypal' && (
                  <PaymentFormPaypal
                    onSubmit={(data) => handleSubmit(data)}
                    loading={submitting}
                    t={t}
                    initialCredits={initialCredits}
                  />
                )}
                {selectedProvider === 'oxapay' && (
                  <PaymentFormOxapay
                    onSubmit={(data) => handleSubmit(data)}
                    loading={submitting}
                    t={t}
                    initialCredits={initialCredits}
                  />
                )}
                {selectedProvider === 'stripe' && (
                  <PaymentFormStripe
                    onSubmit={(data) => handleSubmit(data)}
                    loading={submitting}
                    t={t}
                    initialCredits={initialCredits}
                  />
                )}
                {selectedProvider === 'creem' && (
                  <PaymentFormCardWallets
                    onSubmit={(data) => handleSubmit(data)}
                    loading={submitting}
                    t={t}
                    initialCredits={initialCredits}
                  />
                )}

              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
