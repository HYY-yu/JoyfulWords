'use client'

import * as React from 'react'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { DateRange as DayPickerDateRange } from 'react-day-picker'
import { Calendar } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Button } from './button'
import { cn } from '@/lib/utils'
import { DateRangePresets } from './date-range-presets'
import { getPresetRange, type PresetType } from './date-range-utils'

/**
 * 日期范围（与 react-day-picker 的 DateRange 兼容）
 */
export type DateRange = DayPickerDateRange

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
  /** 当前选中的日期范围（已确认的值） */
  value?: DateRange
  /** 值变化回调（仅在点击确认时调用） */
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
  // Popover 打开状态（统一管理）
  const [isOpen, setIsOpen] = React.useState(false)

  // 内部临时状态（用户选择中的日期范围）
  const [tempRange, setTempRange] = React.useState<DateRange>(
    value || { from: undefined, to: undefined }
  )

  // 生成预设选项
  const presets: DateRangePreset[] = React.useMemo(() => {
    return presetTypes.map((type) => ({
      label: t(`common.dateRange.${type}`),
      range: getPresetRange(type),
    }))
  }, [presetTypes, t])

  // 当 Popover 打开时，初始化临时状态为当前值
  React.useEffect(() => {
    if (isOpen) {
      setTempRange(value || { from: undefined, to: undefined })
    }
  }, [isOpen, value])

  // 处理日历范围选择
  const handleRangeSelect = React.useCallback(
    (range: DateRange | undefined) => {
      setTempRange(range || { from: undefined, to: undefined })
    },
    []
  )

  // 处理预设选项点击
  const handlePresetClick = React.useCallback(
    (preset: DateRangePreset) => {
      setTempRange(preset.range)
    },
    []
  )

  // 确认按钮
  const handleConfirm = React.useCallback(() => {
    // 只有当 from 和 to 都有值时才触发 onChange
    if (tempRange.from && tempRange.to) {
      onChange?.(tempRange)
    }
    setIsOpen(false)
  }, [tempRange, onChange])

  // 取消按钮
  const handleCancel = React.useCallback(() => {
    setTempRange(value || { from: undefined, to: undefined })
    setIsOpen(false)
  }, [value])

  // 清除日期范围
  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onChange?.(undefined)
    },
    [onChange]
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

  // 确认按钮是否可用（必须两个日期都有值）
  const isConfirmDisabled = !tempRange.from || !tempRange.to

  return (
    <div className={cn('flex items-center gap-2', className)} data-slot="date-range-picker">
      {/* 统一的 Popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        {/* 触发器区域：From 按钮 + 分隔符 + To 按钮 */}
        <PopoverTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-2 cursor-pointer',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            {/* 开始日期按钮 */}
            <Button
              type="button"
              variant={variant}
              disabled={disabled}
              className={cn(
                'w-[180px] justify-start text-left font-normal',
                'h-9 px-3',
                'border-input bg-background hover:bg-accent hover:text-accent-foreground',
                'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                !value?.from && 'text-muted-foreground',
              )}
              data-slot="date-range-picker-trigger-from"
              onClick={(e) => {
                if (!disabled) {
                  e.stopPropagation()
                  setIsOpen(!isOpen)
                }
              }}
            >
              <CalendarIcon className="mr-2 h-4 w-4 opacity-50 flex-shrink-0" />
              <span className="flex-1 truncate text-center">{fromDisplay}</span>
            </Button>

            {/* 分隔符 */}
            <span className="text-muted-foreground text-sm">~</span>

            {/* 结束日期按钮 */}
            <Button
              type="button"
              variant={variant}
              disabled={disabled}
              className={cn(
                'w-[180px] justify-start text-left font-normal',
                'h-9 px-3',
                'border-input bg-background hover:bg-accent hover:text-accent-foreground',
                'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                !value?.to && 'text-muted-foreground',
              )}
              data-slot="date-range-picker-trigger-to"
              onClick={(e) => {
                if (!disabled) {
                  e.stopPropagation()
                  setIsOpen(!isOpen)
                }
              }}
            >
              <CalendarIcon className="mr-2 h-4 w-4 opacity-50 flex-shrink-0" />
              <span className="flex-1 truncate text-center">{toDisplay}</span>
            </Button>

            {/* 清除按钮 */}
            {value?.from && value?.to && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={handleClear}
                className="h-9 w-9 p-0"
                aria-label="Clear date range"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </Button>
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="w-auto p-0"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()} // 防止自动聚焦到日历
        >
          <div className="flex flex-col">
            {/* QuickSelect 预设选项 */}
            {showPresets && (
              <DateRangePresets
                value={tempRange}
                presets={presets}
                onSelectPreset={handlePresetClick}
                t={t}
              />
            )}

            {/* 双日历区域 */}
            <Calendar
              mode="range"
              selected={tempRange}
              onSelect={handleRangeSelect}
              numberOfMonths={2}
              disabled={disabledDays}
              fromDate={fromDate}
              toDate={toDate}
              buttonVariant={buttonVariant}
              className="px-3 pb-3"
              formatters={{
                formatCaption: (date) => {
                  return format(date, 'yyyy年 MM月', { locale: zhCN })
                },
              }}
              data-slot="date-range-picker-calendar"
            />

            {/* 操作按钮区 */}
            <div className="flex items-center justify-end gap-2 border-t border-border px-3 py-3 bg-muted/30">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="h-8"
              >
                {t('common.dateRange.cancel')}
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleConfirm}
                disabled={isConfirmDisabled}
                className="h-8"
              >
                {t('common.dateRange.confirm')}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
