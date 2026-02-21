"use client"

import { PaymentProvider } from '@/lib/api/payment/types'
import { CreditCardIcon, WalletIcon, CoinsIcon, BanknoteIcon } from 'lucide-react'
import { getEnabledPaymentProviders } from '@/lib/config/payment-providers'

interface PaymentProviderSelectorProps {
  value: PaymentProvider
  onChange: (provider: PaymentProvider) => void
  t: (key: string) => string
}

const PROVIDERS = {
  paypal: {
    icon: CreditCardIcon,
    labelKey: 'billing.payment.providers.paypal',
  },
  oxapay: {
    icon: CoinsIcon,
    labelKey: 'billing.payment.providers.oxapay',
  },
  stripe: {
    icon: BanknoteIcon,
    labelKey: 'billing.payment.providers.stripe',
  },
} as const

export function PaymentProviderSelector({
  value,
  onChange,
  t,
}: PaymentProviderSelectorProps) {
  // 获取启用的支付渠道
  const enabledProviders = getEnabledPaymentProviders()

  return (
    <div className="flex gap-2 border-b border-border/50">
      {enabledProviders.map((provider) => {
        const { icon: Icon, labelKey } = PROVIDERS[provider as PaymentProvider]
        const isActive = value === provider

        return (
          <button
            key={provider}
            onClick={() => onChange(provider as PaymentProvider)}
            className={`
              px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px
              flex items-center gap-2
              ${
                isActive
                  ? 'text-primary border-primary bg-primary/5'
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span>{t(labelKey)}</span>
          </button>
        )
      })}
    </div>
  )
}
