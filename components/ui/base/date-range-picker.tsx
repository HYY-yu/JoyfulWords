'use client'

import * as React from 'react'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Calendar } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Button } from './button'
import { cn } from '@/lib/utils'
import { DateRangePresets } from './date-range-presets'
import { DateRangeUtils, getPresetRange, type PresetType } from './date-range-utils'

/**
 * 日期范围
 */
export interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

/**
 * 预设日期范围选项
 */
export interface DateRangePreset {
  /** 显示标签 */
  label: string
  /** 日期范围 */
  range: DateRange
  /** 可选图标 */
  icon?: React.ReactNode
}

interface DateRangePickerProps {
  /** 当前选中的日期范围 */
  value?: DateRange
  /** 值变化回调 */
  onChange?: (range: DateRange | undefined) => void
  /** 占位符文本 */
  placeholderFrom?: string
  placeholderTo?: string
  /** 禁用状态 */
  disabled?: boolean
  /** 是否显示预设快捷选项 */
  showPresets?: boolean
  /** 自定义预设选项类型列表 */
  presetTypes?: PresetType[]
  /** 最小可选日期 */
  fromDate?: Date
  /** 最大可选日期 */
  toDate?: Date
  /** 禁用的日期 */
  disabledDays?: Date[]
  /** i18n 翻译函数 */
  t: (key: string, params?: Record<string, any>) => any
  /** 额外的 CSS 类名 */
  className?: string
  /** 触发器样式变体 */
  variant?: 'default' | 'outline' | 'ghost'
  /** 日历按钮变体 */
  buttonVariant?: 'default' | 'ghost' | 'outline'
}

export function DateRangePicker({
  value,
  onChange,
  placeholderFrom,
  placeholderTo,
  disabled = false,
  showPresets = true,
  presetTypes = ['last7Days', 'thisMonth', 'lastMonth'],
  fromDate,
  toDate,
  disabledDays,
  t,
  className,
  variant = 'outline',
  buttonVariant = 'ghost',
}: DateRangePickerProps) {
  const [isFromOpen, setIsFromOpen] = React.useState(false)
  const [isToOpen, setIsToOpen] = React.useState(false)

  // 生成预设选项
  const presets: DateRangePreset[] = React.useMemo(() => {
    return presetTypes.map((type) => ({
      label: t(`common.dateRange.${type}`),
      range: getPresetRange(type),
    }))
  }, [presetTypes, t])

  // 处理开始日期选择
  const handleFromSelect = React.useCallback(
    (date: Date | undefined) => {
      const newRange: DateRange = {
        from: date,
        to: value?.to,
      }
      onChange?.(newRange)
      setIsFromOpen(false)

      // 如果结束日期早于开始日期，重置结束日期
      if (value?.to && date && date > value.to) {
        onChange?.({ from: date, to: undefined })
      }
    },
    [onChange, value]
  )

  // 处理结束日期选择
  const handleToSelect = React.useCallback(
    (date: Date | undefined) => {
      const newRange: DateRange = {
        from: value?.from,
        to: date,
      }
      onChange?.(newRange)
      setIsToOpen(false)

      // 如果开始日期晚于结束日期，重置开始日期
      if (value?.from && date && date < value.from) {
        onChange?.({ from: undefined, to: date })
      }
    },
    [onChange, value]
  )

  // 处理预设选项点击
  const handlePresetClick = React.useCallback(
    (preset: DateRangePreset) => {
      onChange?.(preset.range)
      setIsFromOpen(false)
      setIsToOpen(false)
    },
    [onChange]
  )

  // 处理清除开始日期
  const handleClearFrom = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onChange?.({ from: undefined, to: value?.to })
    },
    [onChange, value]
  )

  // 处理清除结束日期
  const handleClearTo = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onChange?.({ from: value?.from, to: undefined })
    },
    [onChange, value]
  )

  // 格式化显示文本
  const fromDisplay = React.useMemo(() => {
    if (!value?.from) return placeholderFrom || t('common.dateRange.from')
    return format(value.from, 'yyyy-MM-dd', { locale: zhCN })
  }, [value?.from, placeholderFrom, t])

  const toDisplay = React.useMemo(() => {
    if (!value?.to) return placeholderTo || t('common.dateRange.to')
    return format(value.to, 'yyyy-MM-dd', { locale: zhCN })
  }, [value?.to, placeholderTo, t])

  return (
    <div className={cn('flex items-center gap-2', className)} data-slot="date-range-picker">
      {/* 开始日期选择器 */}
      <Popover open={isFromOpen} onOpenChange={setIsFromOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={variant}
            disabled={disabled}
            className={cn(
              'w-[160px] justify-start text-left font-normal',
              'h-9 px-3',
              'border-input bg-background hover:bg-accent hover:text-accent-foreground',
              'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
              !value?.from && 'text-muted-foreground',
            )}
            data-slot="date-range-picker-trigger-from"
          >
            <CalendarIcon className="mr-2 h-4 w-4 opacity-50 flex-shrink-0" />
            <span className="flex-1 truncate text-center">{fromDisplay}</span>
            {value?.from && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClearFrom}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleClearFrom(e as any)
                  }
                }}
                className="ml-1 flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                aria-label="Clear"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
          {showPresets && (
            <DateRangePresets
              value={value}
              presets={presets}
              onSelectPreset={handlePresetClick}
              t={t}
            />
          )}
          <Calendar
            mode="single"
            selected={value?.from}
            onSelect={handleFromSelect}
            numberOfMonths={1}
            disabled={disabledDays}
            fromDate={fromDate}
            toDate={toDate}
            buttonVariant={buttonVariant}
            className="p-3"
            formatters={{
              formatCaption: (date) => {
                return format(date, 'yyyy年 MM月', { locale: zhCN })
              },
            }}
            data-slot="date-range-picker-calendar-from"
          />
        </PopoverContent>
      </Popover>

      {/* 分隔符 */}
      <span className="text-muted-foreground text-sm">~</span>

      {/* 结束日期选择器 */}
      <Popover open={isToOpen} onOpenChange={setIsToOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={variant}
            disabled={disabled}
            className={cn(
              'w-[160px] justify-start text-left font-normal',
              'h-9 px-3',
              'border-input bg-background hover:bg-accent hover:text-accent-foreground',
              'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
              !value?.to && 'text-muted-foreground',
            )}
            data-slot="date-range-picker-trigger-to"
          >
            <CalendarIcon className="mr-2 h-4 w-4 opacity-50 flex-shrink-0" />
            <span className="flex-1 truncate text-center">{toDisplay}</span>
            {value?.to && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClearTo}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleClearTo(e as any)
                  }
                }}
                className="ml-1 flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                aria-label="Clear"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
          {showPresets && (
            <DateRangePresets
              value={value}
              presets={presets}
              onSelectPreset={handlePresetClick}
              t={t}
            />
          )}
          <Calendar
            mode="single"
            selected={value?.to}
            onSelect={handleToSelect}
            numberOfMonths={1}
            disabled={disabledDays}
            fromDate={fromDate}
            toDate={toDate}
            buttonVariant={buttonVariant}
            className="p-3"
            formatters={{
              formatCaption: (date) => {
                return format(date, 'yyyy年 MM月', { locale: zhCN })
              },
            }}
            data-slot="date-range-picker-calendar-to"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
