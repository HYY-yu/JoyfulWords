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

### Tiptap Editor Implementation

The application uses Tiptap 2.x as the rich text editor for content creation:

1. **Editor Features**:
   - Standard formatting (bold, italic, underline, strikethrough)
   - Headings (H1-H6) and paragraph styles
   - Lists (ordered and unordered)
   - Block quotes and code blocks
   - Links and images (via extensions)

2. **Custom Extensions**:
   - Located in `/lib/tiptap-extensions.ts`
   - Tailored styling for Chinese typography
   - Custom toolbar integration with Shadcn/ui components

3. **Integration**:
   - Main component: `/components/tiptap-editor.tsx`
   - Used primarily in article-writing and content creation tools
   - Styled with Tailwind CSS variables for dark mode support
   - Integrated with React Hook Form for form state management

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
  /supabase             # Supabase client configuration
  tiptap-extensions.ts  # Tiptap custom extensions
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

## Feature Status

- **Fully Implemented**:
  - **Authentication System** (Auth)
    - Email/Password login with required email verification
    - Google OAuth integration
    - Protected routes with automatic redirects
    - User session management
    - Bilingual auth pages (zh/en)
  - Content writing tools (material search, competitor tracking, article writing)
  - Article management system with full CRUD operations and interactive content preview
  - Knowledge cards system with form validation, real-time preview, and HTML generation
  - Internationalization system with Chinese and English support

- **Placeholder UI**: Image generation, SEO/GEO tools, video editing (show "Doing 中..." or "Coming soon")
- **Analytics**: Vercel Analytics integrated for production tracking

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
- Use the Tiptap editor component located in `/components/tiptap-editor.tsx`
- When extending Tiptap functionality, add new extensions to `/lib/tiptap-extensions.ts`

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
