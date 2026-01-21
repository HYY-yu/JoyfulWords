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
| **Features** | |
| Tiptap Editor | `/docs/tiptap/editor_features.md` |
| Authentication | `/docs/AUTH_API.md` |
| Articles API | `/docs/ARTICLE_API.md` |
| Materials API | `/docs/MATERIAL_API.md` |
| Competitors API | `/docs/COMPETITORS_API.md` |
| opentelemetry-setup | `/docs/opentelemetry-setup.md` |
