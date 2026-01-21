'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useTranslation } from '@/lib/i18n/i18n-context'
import { useTallyPopup } from 'react-tally'

// Tally 表单配置
const TALLY_FORM_ID = 'Zj2jda' // 替换为实际的表单 ID

export function TallyFeedbackButton() {
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
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary-foreground dark:text-primary"
      aria-label={t('common.feedbackButton')}
    >
      {isLoading ? (
        <>
          <span className="animate-spin">⏳</span>
          <span>{t('common.feedbackLoading')}</span>
        </>
      ) : (
        <>
          <span>💬</span>
          <span>{t('common.feedbackButton')}</span>
        </>
      )}
    </button>
  )
}
