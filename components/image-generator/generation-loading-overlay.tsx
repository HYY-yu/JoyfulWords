"use client"

import { Loader2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/i18n-context'

/**
 * 图片生成加载蒙版组件
 *
 * 在图片生成过程中覆盖整个创作模式 Tab 内容，阻止用户交互
 * 显示旋转加载动画和生成进度信息
 */
export function GenerationLoadingOverlay({
  message,
}: {
  /** 可选的自定义消息（默认使用国际化文本） */
  message?: string
}) {
  const { t } = useTranslation()

  // 如果提供了自定义消息则使用，否则使用默认的生成提示
  const displayMessage = message || t('imageGeneration.generating.description')

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      {/* 旋转加载动画 */}
      <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />

      {/* 生成进度文本 */}
      <p className="text-sm text-muted-foreground text-center max-w-xs px-4">
        {displayMessage}
      </p>
    </div>
  )
}
