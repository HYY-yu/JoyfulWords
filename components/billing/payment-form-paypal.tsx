"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/forms/form'
import { Input } from '@/components/ui/base/input'
import { Button } from '@/components/ui/base/button'
import { Loader2Icon } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/i18n-context'
import { CreditTierSelector } from './credit-tier-selector'

// PayPal 官方 Logo 组件
function PayPalLogo() {
  return (
    <div className="flex justify-center mb-6">
      <svg
        width="100"
        height="28"
        viewBox="0 0 100 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="PayPal Logo"
      >
        <text
          x="0"
          y="22"
          fontFamily="Helvetica, Arial, sans-serif"
          fontSize="24"
          fontWeight="bold"
          fill="#003087"
        >
          Pay
        </text>
        <text
          x="40"
          y="22"
          fontFamily="Helvetica, Arial, sans-serif"
          fontSize="24"
          fontWeight="bold"
          fill="#009CDE"
        >
          Pal
        </text>
      </svg>
    </div>
  )
}

const formSchema = z.object({
  credits: z
    .number({
      requiredError: 'billing.payment.form.credits.required' as never,
      invalid_type_error: 'billing.payment.form.credits.invalid' as never,
    })
    .min(200, { message: 'billing.payment.form.credits.min' })
    .max(100000, { message: 'billing.payment.form.credits.max' })
    .refine((val) => val % 100 === 0, {
      message: 'billing.payment.form.credits.multiple',
    }),
})

interface PaymentFormPaypalProps {
  onSubmit: (data: { credits: number }) => void
  loading?: boolean
  t: (key: string) => string
}

export function PaymentFormPaypal({
  onSubmit,
  loading = false,
  t,
}: PaymentFormPaypalProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      credits: 100,
    },
  })

  const credits = form.watch('credits')
  const amount = credits ? (credits / 100).toFixed(2) : '0.00'

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    onSubmit(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* PayPal 官方 Logo */}
        <PayPalLogo />

        {/* 固定档位选择 */}
        <CreditTierSelector
          form={form}
          fieldName="credits"
          currentValue={credits}
          t={t}
        />

        {/* 自定义积分数输入 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t('billing.payment.form.customAmount')}
          </label>
        </div>

        {/* 积分数输入 */}
        <FormField
          control={form.control}
          name="credits"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('billing.payment.form.credits.label')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="200"
                  min={200}
                  max={100000}
                  step={100}
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : 0
                    field.onChange(value)
                  }}
                />
              </FormControl>
              <FormMessage>
                {form.formState.errors.credits?.message
                  ? t(String(form.formState.errors.credits.message))
                  : null}
              </FormMessage>
            </FormItem>
          )}
        />

        {/* 提示信息 */}
        <p className="text-sm text-muted-foreground">
          {t('billing.payment.form.credits.hint')}
        </p>

        {/* 金额预览 */}
        <div className="flex items-baseline justify-between p-4 rounded-lg bg-muted/50">
          <span className="text-sm font-medium">
            {t('billing.payment.form.totalAmount')}
          </span>
          <span className="text-2xl font-bold">${amount}</span>
        </div>

        {/* 提交按钮 - PayPal 官方样式 */}
        <Button
          type="submit"
          className="w-full h-12 bg-[#0070BA] hover:bg-[#005ea6] text-white font-bold text-base"
          disabled={loading}
          style={{
            backgroundColor: loading ? undefined : '#0070BA',
          }}
        >
          {loading ? (
            <>
              <Loader2Icon className="w-5 h-5 mr-2 animate-spin" />
              {t('billing.payment.form.submitting')}
            </>
          ) : (
            t('billing.payment.form.payWithPaypal')
          )}
        </Button>

        {/* PayPal 安全提示 */}
        <p className="text-xs text-center text-muted-foreground">
          <svg
            className="inline-block w-3 h-3 mr-1"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          {t('billing.payment.form.paypalSecure')}
        </p>
      </form>
    </Form>
  )
}
