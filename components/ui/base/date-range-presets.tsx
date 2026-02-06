'use client'

import { CalendarIcon } from 'lucide-react'
import { startOfDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/base/button'
import type { DateRange, DateRangePreset } from './date-range-picker'

interface DateRangePresetsProps {
  /** 当前选中的日期范围 */
  value?: DateRange
  /** 预设选项列表 */
  presets: DateRangePreset[]
  /** 预设选项点击回调 */
  onSelectPreset: (preset: DateRangePreset) => void
  /** i18n 翻译函数 */
  t: (key: string) => string
  /** 额外的 CSS 类名 */
  className?: string
}

export function DateRangePresets({
  value,
  presets,
  onSelectPreset,
  t,
  className,
}: DateRangePresetsProps) {
  return (
    <div
      data-slot="date-range-presets"
      className={cn('flex flex-col gap-2 border-b border-border pb-4 mb-4', className)}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
        <CalendarIcon className="h-3.5 w-3.5" />
        <span>{t('common.dateRange.quickSelect')}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {presets.map((preset) => {
          const isActive = isPresetActive(value, preset)

          return (
            <Button
              key={preset.label}
              variant="ghost"
              size="sm"
              data-active={isActive}
              onClick={() => onSelectPreset(preset)}
              className={cn(
                'h-8 text-xs',
                'hover:bg-accent hover:text-accent-foreground',
                'data-[active=true]:bg-primary data-[active=true]:text-primary-foreground',
                'transition-colors'
              )}
            >
              {preset.icon && <span className="mr-1.5">{preset.icon}</span>}
              {preset.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * 检查预设选项是否处于激活状态
 * 使用 startOfDay 归一化日期，避免时区和时间部分的影响
 */
function isPresetActive(value: DateRange | undefined, preset: DateRangePreset): boolean {
  if (!value?.from || !value?.to) return false
  if (!preset.range.from || !preset.range.to) return false

  // 归一化为当天 00:00:00 后比较
  const valueStart = startOfDay(value.from).getTime()
  const valueEnd = startOfDay(value.to).getTime()
  const presetStart = startOfDay(preset.range.from).getTime()
  const presetEnd = startOfDay(preset.range.to).getTime()

  return valueStart === presetStart && valueEnd === presetEnd
}
