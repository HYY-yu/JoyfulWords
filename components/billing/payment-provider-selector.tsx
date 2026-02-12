"use client"

import { PaymentProvider } from '@/lib/api/payment/types'
import { CreditCardIcon, WalletIcon, CoinsIcon } from 'lucide-react'

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
} as const

export function PaymentProviderSelector({
  value,
  onChange,
  t,
}: PaymentProviderSelectorProps) {
  return (
    <div className="flex gap-2 border-b border-border/50">
      {(Object.keys(PROVIDERS) as PaymentProvider[]).map((provider) => {
        const { icon: Icon, labelKey } = PROVIDERS[provider]
        const isActive = value === provider

        return (
          <button
            key={provider}
            onClick={() => onChange(provider)}
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
