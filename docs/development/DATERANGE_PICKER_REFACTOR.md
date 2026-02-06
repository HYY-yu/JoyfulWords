# DateRangePicker 组件重构报告

**日期**: 2026-02-06
**组件**: `components/ui/base/date-range-picker.tsx`
**重构类型**: 功能增强

---

## 概述

对 `DateRangePicker` 组件进行了全面重构，解决了多个问题并提升了用户体验。

---

## 问题清单

| 问题 | 描述 |
|------|------|
| QuickSelect 难看 | 预设按钮区域没有 padding，内容紧贴边缘 |
| 双组件冗余 | 使用两个独立的 From/To Popover，体验割裂 |
| 即时触发问题 | 选择日期立即触发 `onChange`，导致频繁刷新列表 |
| 日期计算错误 | 使用 `toISOString()` 导致 UTC 时区转换，日期少一天 |

---

## 重构内容

### 1. 统一 Popover 架构

**之前**: 两个独立的 Popover（From 和 To）

```tsx
<Popover open={isFromOpen} onOpenChange={setIsFromOpen}>
  {/* From 日历 */}
</Popover>
<Popover open={isToOpen} onOpenChange={setIsToOpen}>
  {/* To 日历 */}
</Popover>
```

**之后**: 单一共享 Popover，内部管理临时状态

```tsx
<Popover open={isOpen} onOpenChange={setIsOpen}>
  <PopoverTrigger>
    {/* From 按钮 ~ To 按钮 清除按钮 */}
  </PopoverTrigger>
  <PopoverContent>
    {/* QuickSelect + 双月日历 + 确认/取消 */}
  </PopoverContent>
</Popover>
```

### 2. 双月日历模式

使用 `react-day-picker` 的原生 `mode="range"` + `numberOfMonths={2}`：

```tsx
<Calendar
  mode="range"
  selected={tempRange}
  onSelect={handleRangeSelect}
  numberOfMonths={2}
  // ...
/>
```

**优势**:
- 内置范围高亮样式 (`range_start`, `range_middle`, `range_end`)
- 用户可直观看到选择的范围
- 单次操作完成 From/To 选择

### 3. 临时状态 + 确认机制

**状态管理**:

```tsx
// 内部临时状态（用户选择中的日期范围）
const [tempRange, setTempRange] = useState<DateRange>(value || { from: undefined, to: undefined })

// 外部确认值（只读）
const value prop

// 确认后才触发
const onChange prop
```

**交互流程**:

```
1. 打开 Popover → tempRange 初始化为 value
2. 选择日期/预设 → tempRange 实时更新（UI 变化，不触发 onChange）
3. 点击确认 → onChange(tempRange)，关闭 Popover
4. 点击取消/外部 → tempRange 恢复为 value，关闭 Popover
```

### 4. 修复 QuickSelect 样式

**之前**:

```tsx
className="flex flex-col gap-2 border-b border-border pb-4 mb-4"
```

**之后**:

```tsx
className="flex flex-col gap-2 border-b border-border px-3 pt-3 pb-4 mb-2"
```

**改进**: 添加了水平 padding `px-3`，内容不再紧贴边缘。

### 5. 修复日期时区问题

**问题代码** (`lib/hooks/use-billing.ts`):

```tsx
// ❌ 错误：toISOString() 会转成 UTC，导致日期少一天
if (currentFilters.dateRange?.from) {
  params.issuing_date_start = startOfDay(currentFilters.dateRange.from).toISOString()
}
```

**修复后**:

```tsx
// ✅ 正确：使用 format 保持本地时间
import { format } from 'date-fns'

if (currentFilters.dateRange?.from) {
  params.issuing_date_start = format(startOfDay(currentFilters.dateRange.from), "yyyy-MM-dd'T'HH:mm:ss")
}

if (currentFilters.dateRange?.to) {
  params.issuing_date_end = format(endOfDay(currentFilters.dateRange.to), "yyyy-MM-dd'T'HH:mm:ss")
}
```

**原理**: 中国是 UTC+8，`2025-02-01 00:00:00` 本地时间会变成 `2025-01-31 16:00:00` UTC。

---

## 修改的文件

| 文件 | 修改内容 |
|------|---------|
| `components/ui/base/date-range-picker.tsx` | 完全重构：使用 `mode="range"` + 双月日历，临时状态，确认/取消 |
| `components/ui/base/date-range-presets.tsx` | 修复 padding |
| `lib/i18n/locales/zh.ts` | 添加 `dateRange.cancel` 和 `dateRange.confirm` |
| `lib/i18n/locales/en.ts` | 添加 `dateRange.cancel` 和 `dateRange.confirm` |
| `components/ui/base/date-range-utils.ts` | 使用 `react-day-picker` 的 `DateRange` 类型 |
| `lib/hooks/use-billing.ts` | 修复时区问题，使用 `format` 替代 `toISOString` |
| `components/billing/billing-page.tsx` | 添加 `handleDateRangeChange`，自动触发刷新 |
| `components/billing/invoice-table.tsx` | 保持原有导入 |

---

## UI 布局

```
┌──────────────────────────────────────────────────────────┐
│  [From 按钮 180px] ~ [To 按钮 180px] [清除]              │
├──────────────────────────────────────────────────────────┤
│  ┌─────────────────┬─────────────────┐                   │
│  │   快捷选择      │                   │                   │
│  │ [近7天][本月][上月] │                   │                   │
│  ├─────────────────┴─────────────────┤                   │
│  │      双月日历 (mode="range")      │                   │
│  │   2025年01月    2025年02月        │                   │
│  │   日 一 二 三 四 五 六  日 一 二... │                   │
│  │       [1][2][3]...      [1][2]... │                   │
│  └───────────────────────────────────┘                   │
│  ┌─────────────────────────────────────────────────┐     │
│  │                   [取消] [确认]                   │     │
│  └─────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────┘
```

---

## 性能优化

### 减少不必要的 API 请求

**之前**: 每次选择日期都触发 `onChange` → 外部组件立即请求数据

**之后**: 只有点击"确认"按钮才触发 `onChange`

**收益**: 用户在选择过程中不会产生多次请求，等待确认后一次性请求。

---

## 关键设计决策

### 1. 为什么使用 `react-day-picker` 的 `DateRange` 类型？

- 项目已经在用 `react-day-picker` (v9.x)
- 避免类型冲突和重复定义
- 保持类型一致性

### 2. 为什么使用 `format` 而不是 `toISOString`？

- `toISOString()` 返回 UTC 时间，会导致时区问题
- `format(date, "yyyy-MM-dd'T'HH:mm:ss")` 保持本地时间
- 后端正确接收用户选择的日期

### 3. 为什么需要临时状态？

- 用户可能在选择过程中改变主意
- 取消操作可以恢复原值
- 只有确认才提交，符合表单交互惯例

---

## 后续优化建议

1. **移动端适配**: 双月日历在小屏幕上可能需要改为单月
2. **键盘导航**: 增强键盘支持（Escape 取消，Enter 确认）
3. **范围限制**: 添加最大天数限制（如最多选择 90 天）
4. **时间选择**: 如需精确到时分秒，可扩展为 DateTimeRangePicker

---

## 相关文档

- [使用指南](#daterangepicker-使用指南) ← 详见下文
- [react-day-picker 文档](https://daypicker.dev/)
- [date-fns 文档](https://date-fns.org/)
