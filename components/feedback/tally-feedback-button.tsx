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
        user_id: user?.id ? String(user.id) : '',
        email: user?.email || '',
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
    <button
      onClick={handleFeedbackClick}
      disabled={isLoading}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium",
        "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
        "transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {isLoading ? (
        <>
          <span className="animate-spin">⏳</span>
          <span>{t('common.feedbackLoading')}</span>
        </>
      ) : (
        <>
          <MessageSquareIcon className="w-5 h-5 text-sidebar-foreground/60" />
          <span>{t('common.feedback')}</span>
        </>
      )}
    </button>
  )
}
