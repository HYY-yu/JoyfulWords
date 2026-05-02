# Key Patterns

This document describes the core architectural patterns used in JoyfulWords.

## Tab-Based Navigation

The application uses a two-level tab system:

**Main tabs:**
- `image-generation`
- `content-writing`
- `knowledge-cards`
- `seo-geo`
- `video-editing`

> **⚠️ IMPORTANT: Feature Status Before Production**
>
> The following modules are **NOT production-ready** and contain **mock data only**:
> - `image-generation` - 图片生成
> - `knowledge-cards` - 知识卡片
> - `seo-geo` - SEO/GEO 优化
>
> **Before deploying to production:** replace all mock data with real API integrations and test these modules thoroughly.

**Nested tabs within content-writing:**
- `material-search`
- `article-writing`
- `article-manager`

## State Management

- Uses React `useState` for local state
- No global state management library
- Component-level state isolation

## Component Architecture

- All components use `"use client"` directive (client-side rendering)
- Composition pattern with Shadcn/ui components
- Conditional rendering based on active tabs

## Internationalization (i18n)

**Implementation:**
- Custom i18n using React Context
- Languages: Chinese (zh - primary), English (en)
- Translation files: `/lib/i18n/locales/{zh,en}.ts`

**Usage:**
```typescript
const { t, locale, setLocale } = useTranslation()
t("section.key")
```

**Persistence:** Locale stored in localStorage

## Styling Approach

- CSS variables for theming (light/dark mode)
- Tailwind utility classes
- Custom sidebar colors in `app/globals.css`

## TypeScript Configuration

- Path alias: `@/*` → project root
- Strict mode enabled
- Build ignores TypeScript errors (`ignoreBuildErrors: true`)
