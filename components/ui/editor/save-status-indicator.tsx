import { useTranslation } from '@/lib/i18n/i18n-context'
import { cn } from '@/lib/utils'
import type { AutoSaveState } from '@/lib/hooks/use-auto-save'

interface SaveStatusIndicatorProps {
  saveStatus: AutoSaveState
}

/**
 * 保存状态指示灯组件
 *
 * 显示当前文章的保存状态：
 * - saved (已保存): 绿色圆点
 * - saving (保存中): 黄色圆点（动画）
 * - idle (有未保存修改): 灰色圆点
 * - error (保存失败): 红色圆点
 */
export function SaveStatusIndicator({ saveStatus }: SaveStatusIndicatorProps) {
  const { t } = useTranslation()

  const getStatusText = () => {
    return t(`tiptapEditor.autoSave.${saveStatus.status}`)
  }

  const getStatusDotClass = () => {
    return cn(
      'w-2 h-2 rounded-full transition-colors',
      saveStatus.status === 'saved' && 'bg-green-500',
      saveStatus.status === 'saving' && 'bg-yellow-500 animate-pulse',
      saveStatus.status === 'error' && 'bg-red-500',
      saveStatus.status === 'idle' && 'bg-gray-300 dark:bg-gray-600'
    )
  }

  return (
    <div
      className="flex items-center"
      role="status"
      aria-live="polite"
      aria-label={getStatusText()}
      title={getStatusText()}
    >
      <div className={getStatusDotClass()} aria-hidden="true" />
    </div>
  )
}
