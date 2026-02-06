# Development Guidelines

This document provides detailed guidelines for developing features in JoyfulWords.

## Component Development

### Requirements
- Use `"use client"` directive in all components
- Follow existing component structure and naming conventions
- Use Shadcn/ui components from `/components/ui/` for consistency
- Maintain bilingual UI pattern (Chinese primary, English secondary)
- Follow established tab patterns for new features

### Example Structure
```typescript
"use client"

import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"

export function MyComponent() {
  const { t } = useTranslation()

  return <Button>{t("myComponent.submit")}</Button>
}
```

## Styling

### Guidelines
- Leverage existing CSS variables from `app/globals.css` for theming
- Use Tailwind utility classes
- Support both light and dark modes
- Reference `app/globals.css` for custom color schemes

### Theme Variables
Colors and spacing are defined as CSS variables to support dark mode switching.

## Forms and Validation

### Stack
- **State Management**: React Hook Form 7.x
- **Validation**: Zod schemas
- **UI Components**: Shadcn/ui form components

### Example
```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const schema = z.object({
  email: z.string().email(),
})

function MyForm() {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(schema),
  })
  // ...
}
```

## Rich Text Editing

### Usage
- Use Tiptap editor component: `/components/tiptap-editor.tsx`
- Add new extensions to: `/lib/tiptap-extensions.ts`
- For format conversions (Markdown ↔ HTML), use `/lib/tiptap-utils.ts`

### Key Features
- Markdown support (mixed: marked.js + Tiptap)
- Image upload to R2
- 5 highlight colors
- 4 text alignment options
- Custom floating menus for images and links

**Detailed documentation:** `/docs/tiptap/editor_features.md`

## Internationalization

### Adding Translations

1. Add to both locale files:
   - `/lib/i18n/locales/en.ts`
   - `/lib/i18n/locales/zh.ts`

2. Use in components:
```typescript
const { t, locale, setLocale } = useTranslation()
t("section.key")
```

3. Translation key format: `feature.action` or `section.subsection.key`

## Date & Time Handling

### DateRangePicker Component

Use the `DateRangePicker` component for date range selection with:
- Dual-month calendar display
- Quick preset options (Last 7 days, This month, Last month, etc.)
- Confirm/Cancel mechanism to prevent excessive API calls
- Built-in timezone handling

**Usage:**
```typescript
import { DateRangePicker } from '@/components/ui/base/date-range-picker'
import { format, startOfDay, endOfDay } from 'date-fns'

// Component
<DateRangePicker value={dateRange} onChange={setDateRange} t={t} />

// Backend integration (IMPORTANT: use format, NOT toISOString)
const params = {
  issuing_date_start: format(startOfDay(dateRange.from), "yyyy-MM-dd'T'HH:mm:ss"),
  issuing_date_end: format(endOfDay(dateRange.to), "yyyy-MM-dd'T'HH:mm:ss"),
}
```

**⚠️ Timezone Warning**: Never use `toISOString()` for date ranges in China (UTC+8) - it will shift dates by one day. Always use `format()` to preserve local time.

**Documentation:**
- [DateRangePicker 使用指南](./DATERANGE_PICKER_GUIDE.md)
- [DateRangePicker 重构报告](./DATERANGE_PICKER_REFACTOR.md)

## Project Structure Reference

```
/app                    # Next.js App Router pages
/components             # React components
  /ui                   # Shadcn/ui components (60+)
/lib                    # Utilities & configurations
  /i18n                 # Internationalization
  /auth                 # Auth context & utilities
/hooks                  # Custom React hooks
/docs                   # Documentation
```

## Important Configuration Notes

- **Image Optimization**: Disabled (`unoptimized: true`)
- **TypeScript Build**: Ignores errors (`ignoreBuildErrors: true`)
- **Bilingual UI**: Chinese (primary), English (secondary)
- **Dark Mode**: Fully supported via CSS variables
- **Responsive Design**: Mobile-responsive with Tailwind
