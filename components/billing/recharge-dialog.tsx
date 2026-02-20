"use client"

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/base/dialog'
import { PaymentProviderSelector } from './payment-provider-selector'
import { PaymentFormPaypal } from './payment-form-paypal'
import { PaymentFormOxapay } from './payment-form-oxapay'
import { PaymentProvider } from '@/lib/api/payment/types'
import { usePayment } from '@/lib/hooks/use-payment'
import { Loader2Icon } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/i18n-context'
import { getEnabledPaymentProviders } from '@/lib/config/payment-providers'

interface RechargeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialCredits?: number
}

export function RechargeDialog({ open, onOpenChange, initialCredits }: RechargeDialogProps) {
  const { t } = useTranslation()
  const { createOrder } = usePayment()

  // 获取启用的支付渠道，默认选择第一个
  const enabledProviders = getEnabledPaymentProviders()
  const defaultProvider = (enabledProviders[0] || 'oxapay') as PaymentProvider

  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>(defaultProvider)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (data: { credits: number }) => {
    setSubmitting(true)

    try {
      const result = await createOrder(
        selectedProvider,
        data.credits
      )

      if (result && result.approval_url) {
        // 跳转到支付页面
        window.location.href = result.approval_url
      }
    } catch (error) {
      console.error('Failed to create order:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                  {t('billing.payment.processing')}
                </p>
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
                
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
