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
import { CreditTierSelector } from './credit-tier-selector'

const formSchema = z.object({
  credits: z
    .number({
      required_error: 'billing.payment.form.credits.required' as never,
      invalid_type_error: 'billing.payment.form.credits.invalid' as never,
    })
    .min(200, { message: 'billing.payment.form.credits.min' })
    .max(100000, { message: 'billing.payment.form.credits.max' })
    .refine((val) => val % 100 === 0, {
      message: 'billing.payment.form.credits.multiple',
    }),
})

interface PaymentFormOxapayProps {
  onSubmit: (data: { credits: number }) => void
  loading?: boolean
  t: (key: string) => string
  initialCredits?: number
}

export function PaymentFormOxapay({
  onSubmit,
  loading = false,
  t,
  initialCredits,
}: PaymentFormOxapayProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      credits: initialCredits || 500,
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

        {/* 提交按钮 */}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
              {t('billing.payment.form.submitting')}
            </>
          ) : (
            t('billing.payment.form.submit')
          )}
        </Button>
      </form>
    </Form>
  )
}
