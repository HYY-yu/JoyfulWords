'use client'

import { useState } from 'react'
import { MessageSquareIcon } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { useTranslation } from '@/lib/i18n/i18n-context'
import { useTallyPopup } from 'react-tally'
import { cn } from '@/lib/utils'

// Tally 表单配置
const TALLY_FORM_ID = 'Zj2jda' // 替换为实际的表单 ID

interface TallyFeedbackButtonProps {
  className?: string
}

export function TallyFeedbackButton({ className }: TallyFeedbackButtonProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const { open } = useTallyPopup(TALLY_FORM_ID)

  const handleFeedbackClick = async () => {
    if (isLoading) return

    setIsLoading(true)

    try {
      // 打开 Tally 弹窗，传递用户信息作为 hidden fields
      open({
        hideTitle: true,
        emoji: {text: "👋", animation: "wave"},
        hiddenFields:{
          user_id: user?.id ? String(user.id) : '',
          email: user?.email || '',
        }
      })
    } catch (error) {
      console.error('Failed to open feedback form:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 如果用户未登录，不显示反馈按钮
  if (!user) {
    return null
  }

  return (
    <div className="group relative inline-flex">
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -top-2.5 left-1/2 z-10 flex -translate-x-1/2 -rotate-1 items-center whitespace-nowrap",
          "rounded-full border border-[color-mix(in_srgb,var(--jw-accent)_70%,var(--jw-surface-strong))] bg-[var(--jw-accent)] px-1.5 py-0.5 text-[var(--jw-accent-foreground)]",
          "shadow-[0_4px_10px_-7px_var(--jw-accent)]",
          "animate-in fade-in zoom-in-90 slide-in-from-bottom-1 duration-500 motion-reduce:animate-none",
          "transition-transform group-hover:-translate-y-px group-hover:rotate-0 motion-reduce:transition-none"
        )}
      >
        <strong className="text-[8px] font-extrabold leading-none tracking-[0.05em]">
          {t('common.feedbackRewardValue')}
        </strong>
      </div>

      <button
        type="button"
        aria-label={t('common.feedbackRewardAriaLabel')}
        onClick={handleFeedbackClick}
        disabled={isLoading}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg border border-transparent px-4 py-2.5 text-sm font-semibold",
          "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
          "transition-[background-color,border-color,color,box-shadow,transform] duration-200",
          "hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0",
          "motion-reduce:transition-none",
          className
        )}
      >
        {isLoading ? (
          <>
            <span className="animate-spin motion-reduce:animate-none">⏳</span>
            <span>{t('common.feedbackLoading')}</span>
          </>
        ) : (
          <>
            <MessageSquareIcon className="h-5 w-5 shrink-0" />
            <span>{t('common.feedback')}</span>
          </>
        )}
      </button>
    </div>
  )
}
