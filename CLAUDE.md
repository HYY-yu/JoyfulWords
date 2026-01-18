# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JoyfulWords (创作者工具箱) is a Next.js 16-based SaaS application providing content creation tools for creators. The application features a modern React architecture with TypeScript, Tailwind CSS, and Shadcn/ui components.

## Development Commands

```bash
# Start development server with hot reload (default: http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run ESLint
pnpm lint
```

**Package Manager:** This project uses `pnpm` exclusively. Do not use npm or yarn.

## Architecture

### Technology Stack
- **Framework**: Next.js 16.0.10 with App Router
- **Language**: TypeScript 5.x (strict mode enabled)
- **Styling**: Tailwind CSS 4.x with CSS variables for theming
- **UI Components**: Shadcn/ui (Radix UI primitives) with "new-york" style
- **Rich Text Editor**: Tiptap 2.x with custom extensions and styling
- **Icons**: Lucide React
- **Forms**: React Hook Form 7.x with Zod validation
- **Analytics**: Vercel Analytics
- **Fonts**: Geist and Geist Mono from Google Fonts
- **Backend & Auth**: Golang Backend (PostgreSQL database + Authentication)
  - Email/Password authentication with required email verification
  - Google OAuth support (ready to configure)
  - Row Level Security (RLS) for data protection

### Key Patterns

1. **Tab-Based Navigation**: The application uses a two-level tab system:
   - Main tabs (image-generation, content-writing, knowledge-cards, seo-geo, video-editing)
   - Nested tabs within content-writing (material-search, competitor-tracking, article-writing, article-manager)

2. **State Management**: Uses React useState for local state management. No global state management library.

3. **Component Architecture**:
   - All components use `"use client"` directive (client-side rendering)
   - Composition pattern with Shadcn/ui components
   - Conditional rendering based on active tabs

4. **Internationalization (i18n)**:
   - Custom i18n implementation using React Context
   - Supported languages: Chinese (zh - primary), English (en)
   - Translation files located in `/lib/i18n/locales/`
   - Access via `useTranslation()` hook: `const { t, locale, setLocale } = useTranslation()`
   - Locale persisted in localStorage

5. **Styling Approach**:
   - CSS variables for theming (light/dark mode support)
   - Tailwind utility classes
   - Custom sidebar color scheme defined in `app/globals.css`

6. **TypeScript Configuration**:
   - Path alias: `@/*` maps to project root
   - Strict mode enabled
   - Next.js plugin for type checking
   - Build ignores TypeScript errors (`ignoreBuildErrors: true` in next.config.mjs)

### Tiptap Rich Text Editor

The application uses **Tiptap 3.x** as the rich text editor for content creation (article-writing, etc.).

**Key Files:**
- Component: `/components/tiptap-editor.tsx`
- Extensions: `/lib/tiptap-extensions.ts`
- State utilities: `/lib/editor-state.ts`
- Format utils: `/lib/tiptap-utils.ts`

**📚 Detailed Documentation:** For comprehensive information about Tiptap implementation, see:
- `/docs/tiptap/editor_features.md` - Feature design, data flow, best practices, and implementation details

**Markdown 支持**: 使用混合方案
- Markdown → HTML: marked.js 库
- HTML → Markdown: Tiptap 编辑器实例（通过 window.tiptapEditor 访问）
- 格式自动检测: `detectContentFormat()`

**扩展列表**:
- StarterKit（标题、加粗、斜体等）
- Link（链接管理）
- Underline（下划线）
- CustomImage（图片上传到 R2）
- CustomHighlight（5种颜色高亮）
- CustomTextAlign（4种对齐方式）
- Markdown（Markdown 格式支持）

**UI 组件**:
- `components/ui/tiptap-toolbar.tsx` - 工具栏
- `components/ui/tiptap-toolbar-button.tsx` - 工具栏按钮
- `components/ui/highlight-buttons.tsx` - 高亮颜色选择
- `components/ui/text-align-buttons.tsx` - 文本对齐按钮
- `components/ui/image-menu.tsx` - 图片编辑浮动菜单
- `components/ui/link-menu.tsx` - 链接编辑浮动菜单

**工具函数**:
- `lib/tiptap-utils.ts` - 格式转换（Markdown ↔ HTML）
- `lib/tiptap-image-upload.ts` - 图片上传到 R2
- `lib/editor-state.ts` - 编辑器状态管理

## Project Structure

```
/app                    # Next.js 16 App Router pages
  /auth                 # Authentication pages (login, signup, etc.)
  layout.tsx            # Root layout with providers
  page.tsx              # Main dashboard (protected route)

/components             # React components
  /auth                 # Auth-related components
  /seo-geo              # SEO/GEO tool components
  /ui                   # Shadcn/ui components (60+ components)
  article-*.tsx         # Article management components
  content-writing.tsx   # Content writing tab container
  knowledge-cards.tsx   # Knowledge cards feature
  sidebar.tsx           # Main navigation sidebar
  tiptap-editor.tsx     # Rich text editor

/lib                    # Utilities and configurations
  /auth                 # Auth context and utilities
  /i18n                 # Internationalization
    /locales            # Translation files (zh.ts, en.ts)
  tiptap-extensions.ts  # Tiptap custom extensions
  editor-state.ts       # Editor state management hooks
  tiptap-utils.ts       # Format conversion utilities (Markdown ↔ HTML)
  utils.ts              # Utility functions (cn, etc.)

/hooks                  # Custom React hooks
/public                 # Static assets
/styles                 # Global styles
```

## Important Configuration Notes

- **Image Optimization**: Disabled (`unoptimized: true` in next.config.mjs)
- **TypeScript Errors**: Build ignores TypeScript errors (`ignoreBuildErrors: true`)
- **Bilingual UI**: Application supports Chinese (primary) and English text
- **Dark Mode**: Fully supported through CSS variables via `next-themes`
- **Responsive Design**: Mobile-responsive with Tailwind utilities

## Development Guidelines

### Component Development
- Follow the existing component structure and naming conventions
- Use Shadcn/ui components for consistency (located in `/components/ui/`)
- All components should use `"use client"` directive
- Maintain the bilingual UI pattern (Chinese primary, English secondary)
- Use the established tab patterns for new features

### Styling
- Leverage existing CSS variables for consistent theming
- Use Tailwind utility classes
- Support both light and dark modes
- Reference `app/globals.css` for custom color schemes

### Forms and Validation
- Use React Hook Form for form state management
- Use Zod for schema validation
- Leverage Shadcn/ui form components

### Rich Text Editing
- Use the Tiptap editor component: `/components/tiptap-editor.tsx`
- Add new extensions to: `/lib/tiptap-extensions.ts`
- For format conversions (Markdown ↔ HTML), use utilities in `/lib/tiptap-utils.ts`
- **See `/docs/tiptap/editor_features.md` for detailed implementation guide**

### Internationalization
- Add translations to both `/lib/i18n/locales/en.ts` and `/lib/i18n/locales/zh.ts`
- Use the `useTranslation()` hook in components
- Example: `const { t, locale, setLocale } = useTranslation()`
- Access translations: `t("section.key")`

## Authentication & User Management

This project uses Auth for complete user authentication and management. The system includes:

### Key Features
- **Email/Password Auth** with required email verification
- **Google OAuth** ready (requires configuration)
- **Protected Routes** - unauthenticated users automatically redirected to `/auth/login`
- **Session Management** with automatic token refresh via middleware

### Using Auth in Components
```typescript
// Client component
import { useAuth } from "@/lib/auth/auth-context"

const { user, session, loading, signInWithEmail, signOut } = useAuth()
```

### Important Files
- **Auth Context**: `/lib/auth/auth-context.tsx`
- **Auth Pages**: `/app/auth/*` (login, signup, verify-email, forgot-password)
- **Auth Components**: `/components/auth/*`
- **Middleware**: `/proxy.ts` (session refresh and route protection)

### Email Testing (Development)
- **Mailpit**: http://127.0.0.1:54324 - view all sent emails locally
- No real emails are sent in development mode

### 📚 Detailed Documentation
For comprehensive information about the authentication system, including:
- Architecture and flow diagrams
- Usage examples and best practices
- Configuration instructions
- Troubleshooting guide
- Security considerations

**See `/docs/AUTH_API.md`** for complete authentication documentation.
