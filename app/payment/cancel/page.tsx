"use client"

import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/i18n-context'
import { XCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/base/button'

export default function PaymentCancelPage() {
  const { t } = useTranslation()
  const router = useRouter()

  const handleBackToBilling = () => {
    router.push('/?tab=billing')
  }

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <XCircleIcon className="w-16 h-16 text-muted-foreground mx-auto" />
        <div>
          <h1 className="text-2xl font-bold mb-2">
            {t('billing.payment.cancel.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('billing.payment.cancel.desc')}
          </p>
        </div>
        <div className="space-y-2">
          <Button onClick={handleBackToBilling} className="w-full">
            {t('billing.payment.success.backToBilling')}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-full"
          >
            {t('billing.payment.cancel.goBack')}
          </Button>
        </div>
      </div>
    </div>
  )
}
