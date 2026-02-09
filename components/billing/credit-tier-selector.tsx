"use client"

import type { UseFormReturn } from 'react-hook-form'
import type { z } from 'zod'

// 固定档位选项
export const CREDIT_TIERS = [500, 1000, 1500, 2000] as const

interface CreditTierSelectorProps<T extends z.ZodType> {
  form: UseFormReturn<z.infer<T>>
  fieldName: string
  currentValue: number
  t: (key: string) => string
}

export function CreditTierSelector<T extends z.ZodType>({
  form,
  fieldName,
  currentValue,
  t,
}: CreditTierSelectorProps<T>) {
  const handleTierSelect = (tier: number) => {
    form.setValue(fieldName as any, tier)
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {t('billing.payment.form.selectTier')}
      </label>
      <div className="grid grid-cols-4 gap-2">
        {CREDIT_TIERS.map((tier) => (
          <button
            key={tier}
            type="button"
            onClick={() => handleTierSelect(tier)}
            className={`
              px-3 py-2 text-sm font-medium rounded-lg border transition-all
              ${
                currentValue === tier
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted border-border'
              }
            `}
          >
            {tier}
          </button>
        ))}
      </div>
    </div>
  )
}
