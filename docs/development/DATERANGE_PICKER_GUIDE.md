# DateRangePicker 使用指南

## 概述

`DateRangePicker` 是一个基于 `react-day-picker` 的日期范围选择组件，支持：
- 双月日历显示
- 快捷预设选项（近7天、本月、上月等）
- 确认/取消机制
- 内置时区处理

---

## 基础用法

### 最简单的用法

```tsx
import { DateRangePicker } from '@/components/ui/base/date-range-picker'

function MyComponent() {
  const { t } = useTranslation()
  const [dateRange, setDateRange] = useState<DateRange>()

  const handleDateRangeChange = (range?: DateRange) => {
    setDateRange(range)
    // 触发数据请求
    fetchData(range)
  }

  return (
    <DateRangePicker
      value={dateRange}
      onChange={handleDateRangeChange}
      t={t}
    />
  )
}
```

---

## Props API

```tsx
interface DateRangePickerProps {
  /** 当前选中的日期范围（已确认的值） */
  value?: DateRange

  /** 值变化回调（仅在点击确认时调用） */
  onChange?: (range: DateRange | undefined) => void

  /** 占位符文本 */
  placeholderFrom?: string  // 默认: t('common.dateRange.from')
  placeholderTo?: string    // 默认: t('common.dateRange.to')

  /** 禁用状态 */
  disabled?: boolean

  /** 是否显示预设快捷选项 */
  showPresets?: boolean  // 默认: true

  /** 自定义预设选项类型列表 */
  presetTypes?: PresetType[]  // 默认: ['last7Days', 'thisMonth', 'lastMonth']

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
  variant?: 'default' | 'outline' | 'ghost'  // 默认: 'outline'

  /** 日历按钮变体 */
  buttonVariant?: 'default' | 'ghost' | 'outline'  // 默认: 'ghost'
}
```

---

## 类型定义

```tsx
import type { DateRange } from 'react-day-picker'

// DateRange 类型
type DateRange = {
  from: Date | undefined
  to: Date | undefined
}

// 预设类型
type PresetType =
  | 'today'
  | 'yesterday'
  | 'last7Days'
  | 'last30Days'
  | 'thisMonth'
  | 'lastMonth'
```

---

## 高级用法

### 1. 自定义预设选项

```tsx
<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  presetTypes={['today', 'thisWeek', 'thisMonth', 'lastMonth']}
  t={t}
/>
```

### 2. 限制日期范围

```tsx
<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  // 只能选择最近 30 天内的日期
  fromDate={subDays(new Date(), 30)}
  toDate={new Date()}
  t={t}
/>
```

### 3. 禁用特定日期

```tsx
<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  // 禁用周末
  disabledDays={[
    new Date(2025, 1, 1),  // 禁用特定日期
    // 也可以传入函数
  ]}
  t={t}
/>
```

### 4. 隐藏快捷选项

```tsx
<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  showPresets={false}
  t={t}
/>
```

### 5. 自定义样式

```tsx
<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  className="w-full"
  variant="ghost"
  buttonVariant="outline"
  t={t}
/>
```

---

## 后端集成指南

### ⚠️ 重要：时区处理

**不要使用 `toISOString()`**，它会把本地时间转换成 UTC，导致日期偏移。

### ❌ 错误示例

```tsx
// 中国是 UTC+8，这会导致日期少一天
const startDate = startOfDay(dateRange.from).toISOString()
// 选择 02-01 → 得到 "2025-01-31T16:00:00.000Z" ❌
```

### ✅ 正确示例

```tsx
import { format, startOfDay, endOfDay } from 'date-fns'

const params = {
  issuing_date_start: format(startOfDay(dateRange.from), "yyyy-MM-dd'T'HH:mm:ss"),
  issuing_date_end: format(endOfDay(dateRange.to), "yyyy-MM-dd'T'HH:mm:ss"),
}
// 选择 02-01 → 得到 "2025-02-01T00:00:00" ✅
// 选择 02-04 → 得到 "2025-02-04T23:59:59" ✅
```

### 完整示例

```tsx
import { format, startOfDay, endOfDay } from 'date-fns'

const fetchInvoices = async (dateRange?: DateRange) => {
  const params: Record<string, string> = {
    page: '1',
    page_size: '20',
  }

  if (dateRange?.from) {
    // 开始日期：当天 00:00:00
    params.issuing_date_start = format(
      startOfDay(dateRange.from),
      "yyyy-MM-dd'T'HH:mm:ss"
    )
  }

  if (dateRange?.to) {
    // 结束日期：当天 23:59:59
    params.issuing_date_end = format(
      endOfDay(dateRange.to),
      "yyyy-MM-dd'T'HH:mm:ss"
    )
  }

  const response = await fetch(`/api/invoices?${new URLSearchParams(params)}`)
  return response.json()
}
```

---

## 国际化 (i18n)

### 已支持的翻译 key

```tsx
// lib/i18n/locales/zh.ts
common: {
  dateRange: {
    selectDate: "选择日期范围"
    from: "开始日期"
    to: "结束日期"
    quickSelect: "快捷选择"
    today: "今天"
    yesterday: "昨天"
    last7Days: "最近7天"
    last30Days: "最近30天"
    thisWeek: "本周"
    lastWeek: "上周"
    thisMonth: "本月"
    lastMonth: "上月"
    thisYear: "今年"
    lastYear: "去年"
    custom: "自定义"
    clear: "清除"
    cancel: "取消"
    confirm: "确认"
  }
}
```

### 使用翻译

```tsx
import { useTranslation } from '@/lib/i18n/i18n-context'

function MyComponent() {
  const { t } = useTranslation()

  return (
    <DateRangePicker
      value={dateRange}
      onChange={setDateRange}
      t={t}
    />
  )
}
```

---

## 最佳实践

### 1. 自动刷新数据

```tsx
const handleDateRangeChange = (range?: DateRange) => {
  setDateRange(range)
  // 重置分页到第一页
  setPage(1)
  // 触发数据请求
  fetchData(range)
}
```

### 2. 清除日期范围

```tsx
<DateRangePicker
  value={dateRange}
  onChange={(range) => {
    // range 为 undefined 表示清除
    handleDateRangeChange(range)
  }}
  t={t}
/>
```

### 3. 与筛选条件配合

```tsx
const [filters, setFilters] = useState({
  status: 'all',
  dateRange: undefined,
})

const handleDateRangeChange = (dateRange?: DateRange) => {
  setFilters(prev => ({ ...prev, dateRange }))
  fetchInvoices({ ...filters, dateRange })
}
```

---

## 工具函数

### DateRangeUtils

```tsx
import { DateRangeUtils } from '@/components/ui/base/date-range-utils'

// 格式化为显示文本
const display = DateRangeUtils.formatToDisplay(range, zhCN, "选择日期范围")
// 输出: "2025-02-01 ~ 2025-02-04"

// 验证范围是否有效
const isValid = DateRangeUtils.validateRange(range)
// 输出: true

// 检查两个范围是否相等
const isEqual = DateRangeUtils.isRangeEqual(range1, range2)
// 输出: true
```

### getPresetRange

```tsx
import { getPresetRange } from '@/components/ui/base/date-range-utils'

// 获取预设范围
const last7Days = getPresetRange('last7Days')
// 输出: { from: Date(2025-01-28), to: Date(2025-02-03) }
```

---

## 故障排查

### 问题 1: 日期少一天

**原因**: 使用了 `toISOString()`，导致 UTC 时区转换。

**解决**: 使用 `format(date, "yyyy-MM-dd'T'HH:mm:ss")` 代替。

### 问题 2: onChange 没有触发

**原因**: 用户没有点击确认按钮。

**说明**: 这是设计行为，只有点击"确认"按钮才会触发 `onChange`。

### 问题 3: 日历显示英文

**原因**: 没有传入 `t` 函数。

**解决**: 确保 `t={t}` prop 存在。

---

## 相关组件

- `Calendar` - 基础日历组件 (`components/ui/base/calendar.tsx`)
- `DateRangePresets` - 快捷选项组件 (`components/ui/base/date-range-presets.tsx`)
- `DateRangeUtils` - 工具函数 (`components/ui/base/date-range-utils.ts`)

---

## 相关文档

- [重构报告](./DATERANGE_PICKER_REFACTOR.md)
- [react-day-picker 文档](https://daypicker.dev/)
- [date-fns 文档](https://date-fns.org/)
