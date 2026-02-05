# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

JoyfulWords (创作者工具箱) is a Next.js 16-based SaaS application providing content creation tools for creators.

**Package Manager:** `pnpm` only.

## Technology Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4.x
- **UI**: Shadcn/ui (Radix UI)
- **Rich Text Editor**: Tiptap 3.x
- **Forms**: React Hook Form + Zod
- **Backend**: Golang + PostgreSQL

## Quick Reference

### Key Files
- Rich Text Editor: `/components/tiptap-editor.tsx`
- Auth Context: `/lib/auth/auth-context.tsx`
- i18n Hook: `/lib/i18n/` (use `useTranslation()`)
- Tiptap Extensions: `/lib/tiptap-extensions.ts`

### Component Patterns
- All components use `"use client"`
- Use Shadcn/ui from `/components/ui/`
- Tab-based navigation structure

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
