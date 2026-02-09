'use client'

import { useTranslation } from '@/lib/i18n/i18n-context'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/base/alert-dialog'

/**
 * 积分不足响应数据结构
 */
export interface InsufficientCreditsData {
  current_credits: number
  required_credits: number
  shortage_credits: number
  recommended_recharge: number
  recommended_recharge_usd: string
}

interface InsufficientCreditsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: InsufficientCreditsData | null
}

/**
 * 积分不足弹窗组件
 *
 * 当用户积分不足以执行操作时显示，提供前往充值页面的按钮
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false)
 * const [data, setData] = useState<InsufficientCreditsData | null>(null)
 *
 * <InsufficientCreditsDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   data={data}
 * />
 * ```
 */
export function InsufficientCreditsDialog({
  open,
  onOpenChange,
  data,
}: InsufficientCreditsDialogProps) {
  const { t } = useTranslation()

  const handleGoToRecharge = () => {
    if (!data) return

    // 设置 billing tab 为激活状态
    localStorage.setItem('joyfulwords-active-tab', 'billing')

    // 设置推荐充值金额到 localStorage，供 BillingPage 使用
    localStorage.setItem('billing-recommended-amount', data.recommended_recharge_usd)

    // 设置标记，告诉 BillingPage 自动打开充值弹窗
    localStorage.setItem('billing-auto-open-recharge', 'true')

    // 刷新页面以应用 tab 切换
    window.location.reload()
  }

  if (!data) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('billing.insufficientCredits.title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('billing.insufficientCredits.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t('billing.insufficientCredits.currentCredits')}:
            </span>
            <span className="font-semibold">{data.current_credits}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t('billing.insufficientCredits.requiredCredits')}:
            </span>
            <span className="font-semibold">{data.required_credits}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t('billing.insufficientCredits.shortageCredits')}:
            </span>
            <span className="font-semibold text-destructive">
              {data.shortage_credits}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm border-t pt-3">
            <span className="text-muted-foreground">
              {t('billing.insufficientCredits.recommendedRecharge')}:
            </span>
            <span className="font-semibold text-lg">
              ${data.recommended_recharge_usd}
            </span>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>
            {t('billing.insufficientCredits.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleGoToRecharge}>
            {t('billing.insufficientCredits.goToRecharge')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
