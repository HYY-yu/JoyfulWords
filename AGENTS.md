# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JoyfulWords (创作者工具箱) is a Next.js 16 (App Router) SaaS frontend providing content creation tools for creators. This repo is **frontend only** — the backend is Golang + PostgreSQL, reached via `API_BASE_URL` (`/lib/config.ts`). The only Next.js API route is `app/api/image-proxy`.

**Package Manager:** `pnpm` only. `AGENTS.md` is a copy of this file — keep both in sync when editing.

## Commands

```bash
pnpm dev              # dev server at http://localhost:3000
pnpm dev:joyword      # HTTPS dev at local.joyword.link (needs ./certificates)
pnpm build            # production build (webpack, standalone output)
pnpm lint             # eslint . — run this; build does NOT catch TS errors (ignoreBuildErrors: true)
```

### Tests

No test framework — tests use `node:test` + `node:assert/strict`, run via `tsx` (which resolves the `@/*` path alias from tsconfig):

```bash
pnpm tsx --test lib/auth/session-policy.test.ts        # single file
pnpm tsx --test proxy.test.ts lib/**/*.test.ts         # all tests
```

Test files live next to their source (`*.test.ts` in `lib/**` and root `proxy.test.ts`).

## Architecture

### Routing: two trees, gated by `proxy.ts`

- **`app/[locale]/`** — public, SEO-facing pages (blog, pricing, mcp, tools, file-converter, legal pages), prefixed `/zh` or `/en`, cached in production (see `next.config.mjs` headers).
- **Root routes** (`app/articles`, `app/auth`, `app/payment`, `app/tools`, oauth flows) — the authenticated app, un-prefixed, `private, no-store`.

`proxy.ts` (Next.js proxy/middleware) redirects unauthenticated users (no `refresh_token` cookie) to `/auth/login?redirect=...` for non-public routes, and resolves locale (path → cookie → Accept-Language). Which routes are public is defined in `/lib/auth/session-policy.ts` — when adding a public page, update it and keep it aligned with the cache-header matchers in `next.config.mjs` (there's a test asserting alignment).

### API layer

All backend calls go through `/lib/api/client.ts`: attaches Bearer token from `/lib/tokens/token-store`, auto-refreshes on 401 (redirecting to login on refresh failure), sets `Accept-Language`, and intercepts insufficient-credits errors to trigger the recharge dialog. Domain-specific API modules live under `/lib/api/{articles,materials,billing,taskcenter,...}`. Shared response types in `/lib/api/types.ts`.

### i18n

Custom React Context implementation (no library). Chinese (zh) is primary, English (en) secondary.

- Translation files: `/lib/i18n/locales/{zh,en}.ts` — **always add keys to both files**
- Client: `const { t, locale, setLocale } = useTranslation()` from `/lib/i18n`
- Server components: `/lib/i18n/server.ts`; route locale parsing: `/lib/i18n/route-locale.ts`
- Locale persisted in localStorage + `locale` cookie

### Components

- All components use `"use client"`; state is local `useState` (no global state library)
- Shadcn/ui (Radix) in `/components/ui/`; feature components grouped by domain (`/components/article`, `/components/materials`, ...)
- Forms: React Hook Form + Zod via `zodResolver`
- Rich text: Tiptap 3.x — editor at `/components/tiptap-editor.tsx`, extensions in `/lib/tiptap-extensions.ts`, Markdown↔HTML conversion in `/lib/tiptap-utils.ts`
- Tab-based navigation: main tabs (image-generation, content-writing, knowledge-cards, seo-geo, video-editing) with nested tabs inside content-writing. **image-generation, knowledge-cards, and seo-geo are mock-data only, not production-ready.**

### Observability

OpenTelemetry (server via `instrumentation.ts`, browser via `/components/otel` + `/lib/otel`), Grafana Faro, PostHog analytics. `proxy.ts` emits `server-timing` traceparent headers.

## Critical Gotchas

### ⚠️ Dockerfile.prod 环境变量配置

**易错点**: 添加新的 `NEXT_PUBLIC_*` 环境变量时，必须同步更新 Dockerfile.prod

**规则**:
1. 每个 `NEXT_PUBLIC_*` 变量必须在 Dockerfile.prod 中声明为 `ARG`
2. 必须在 Dockerfile.prod 中设置对应的 `ENV`
3. .drone.yml 中，docker build 也要增加。

**示例**:
```dockerfile
# 必须添加这两行
ARG NEXT_PUBLIC_ENABLE_COOKIE_BANNER
ENV NEXT_PUBLIC_ENABLE_COOKIE_BANNER=${NEXT_PUBLIC_ENABLE_COOKIE_BANNER}
```

**原因**: Next.js 的 `NEXT_PUBLIC_*` 变量在**构建时**被内联到客户端代码中。如果 Dockerfile 中没有声明，即使 `.env.local` 中有值，构建后的代码中该变量仍为 `undefined`。

### When implementing components with Next.js i18n:
(1) Avoid nested buttons in forms to prevent HTML5 validation conflicts,
(2) Handle server/client date format hydration mismatches,
(3) Never use dynamic strings in toast() calls - use pre-defined translation keys only.

### Date handling

Always verify time zone handling when working with Date objects. Never mutate Date objects directly - create new Date instances to avoid side effects. Use toISOString() with caution as it converts to UTC.

## Documentation Index

| Topic | Documentation |
|-------|---------------|
| **Architecture** | |
| Key Patterns | `/docs/architecture/key-patterns.md` |
| **Development** | |
| Guidelines | `/docs/development/guidelines.md` |
| OpenTelemetry Setup | `/docs/development/opentelemetry-setup.md` |
| 401 Auto Redirect | `/docs/development/401_AUTO_REDIRECT.md` |
| **API References** | |
| Authentication API | `/docs/api/AUTH_API.md` |
| Articles API | `/docs/api/ARTICLE_API.md` |
| Materials API | `/docs/api/MATERIAL_API.md` |
| Competitors API | `/docs/api/COMPETITORS_API.md` |
| **Features** | |
| Tiptap Editor | `/docs/tiptap/editor_features.md` |
| Tiptap Image Features | `/docs/tiptap/IMAGE_FEATURES.md` |
| PPT V2 Frontend | `/docs/presentation/PRESENTATION_V2.md` |
| Tally Feedback | `/docs/features/tally-feedback.md` |
| **Components** | |
| Cookie Banner | `/docs/cookie_banner/COOKIE_BANNER.md` |
| Cookie Banner Implementation | `/docs/cookie_banner/COOKIE_BANNER_IMPLEMENTATION_SUMMARY.md` |
| Cookie Banner Test | `/docs/cookie_banner/COOKIE_BANNER_TEST.md` |
| **Modules** | |
| Articles Implementation | `/docs/articles/IMPLEMENT_REPORT.md` |
| Materials Integration | `/docs/materials/integration-plan.md` |
| Materials API Guide | `/docs/materials/MATERIAL_API_GUIDE.md` |
| Materials Overview | `/docs/materials/README.md` |
| **Design Plans** | |
| Legal Compliance Design | `/docs/plans/2025-02-05-legal-compliance-design.md` |
| Tally Feedback Integration | `/docs/plans/2026-01-21-tally-feedback-integration.md` |
| AI Button Heartbeat Animation | `/docs/plans/2026-02-01-ai-button-heartbeat-animation-design.md` |
