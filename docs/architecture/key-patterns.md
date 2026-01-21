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

**Nested tabs within content-writing:**
- `material-search`
- `competitor-tracking`
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
