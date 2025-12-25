# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JoyfulWords (创作者工具箱) is a Next.js 16-based SaaS application providing content creation tools for creators. The application features a modern React architecture with TypeScript, Tailwind CSS, and Shadcn/ui components.

## Development Commands

```bash
# Start development server with hot reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run ESLint
pnpm lint

# Check supabase Local Info
supabase status
```

Note: The project uses pnpm as the package manager.

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
- **Backend & Auth**: Supabase (PostgreSQL database + Authentication)
  - Email/Password authentication with required email verification
  - Google OAuth support (ready to configure)
  - Row Level Security (RLS) for data protection
  - SSR-compatible auth with `@supabase/ssr`

### Key Patterns

1. **Tab-Based Navigation**: The application uses a two-level tab system:
   - Main tabs (image-generation, content-writing, knowledge-cards, seo-geo, video-editing)
   - Nested tabs within content-writing (material-search, competitor-tracking, article-writing, article-manager)

2. **State Management**: Uses React useState for local state management. No global state management library.

3. **Component Architecture**:
   - All components use `"use client"` directive
   - Composition pattern with Shadcn/ui components
   - Conditional rendering based on active tabs

4. **Styling Approach**:
   - CSS variables for theming (light/dark mode support)
   - Tailwind utility classes
   - Custom sidebar color scheme defined in globals.css

5. **TypeScript Configuration**:
   - Path alias: `@/*` maps to project root
   - Strict mode enabled
   - Next.js plugin for type checking

### Tiptap Editor Implementation

The application uses Tiptap 2.x as the rich text editor for content creation:

1. **Editor Features**:
   - Standard formatting (bold, italic, underline, strikethrough)
   - Headings (H1-H6) and paragraph styles
   - Lists (ordered and unordered)
   - Block quotes and code blocks
   - Links and mentions
   - Tables and media embedding
   - Custom collaborative features

2. **Custom Extensions**:
   - Tailored styling for Chinese typography
   - Custom toolbar integration with Shadcn/ui components
   - Mention suggestions for tagging users or content
   - Placeholder text with bilingual support

3. **Integration**:
   - Used primarily in article-writing and content creation tools
   - Styled with Tailwind CSS variables for dark mode support
   - Integrated with React Hook Form for form state management

## Important Notes

- **TypeScript Errors**: Build ignores TypeScript errors (`ignoreBuildErrors: true` in next.config.mjs)
- **Image Optimization**: Disabled (`unoptimized: true` in next.config.mjs)
- **Bilingual UI**: Application supports Chinese (primary) and English text
- **Dark Mode**: Fully supported through CSS variables
- **Responsive Design**: Mobile-responsive with Tailwind utilities

## Feature Status

- **Fully Implemented**:
  - **Authentication System** (Supabase Auth)
    - Email/Password login with required email verification
    - Google OAuth integration (requires configuration)
    - Protected routes with automatic redirects
    - User session management with automatic token refresh
    - Password strength indicator and validation
    - Forgot password functionality
    - User profile dropdown with logout
    - Bilingual auth pages (zh/en)
  - Content writing tools (material search, competitor tracking, article writing)
  - Article management system with full CRUD operations and interactive content preview
  - Knowledge cards system with form validation, real-time preview, and HTML generation
- **Placeholder UI**: Image generation, SEO/GEO tools, video editing (show "Doing 中..." or "Coming soon")
- **Analytics**: Vercel Analytics integrated for production tracking

## Development Guidelines

- Follow the existing component structure and naming conventions
- Use Shadcn/ui components for consistency
- Maintain the bilingual UI pattern (Chinese primary, English secondary)
- Test responsive design using the built-in mobile detection hook
- Use the established tab patterns for new features
- Leverage the existing CSS variables for consistent theming
- For rich text editing, use the Tiptap editor component located in `/components/editor/`
- When extending Tiptap functionality, add new extensions to `editor-extensions.ts`

## Authentication & User Management

This project uses Supabase Auth for complete user authentication and management. The system includes:

### Key Features
- **Email/Password Auth** with required email verification
- **Google OAuth** ready (requires configuration)
- **Protected Routes** - unauthenticated users automatically redirected to `/auth/login`
- **Session Management** with automatic token refresh via middleware
- **User Profiles** linked to Supabase auth users

### Using Auth in Components
```typescript
// Client component
import { useAuth } from "@/lib/auth/auth-context"

const { user, session, loading, signInWithEmail, signOut } = useAuth()
```

### Server-Side Auth Checks
```typescript
// Server component or server action
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  redirect('/auth/login')
}
```

### Important Files
- **Auth Context**: `/lib/auth/auth-context.tsx`
- **Auth Pages**: `/app/auth/*` (login, signup, verify-email, forgot-password)
- **Auth Components**: `/components/auth/*`
- **Supabase Clients**: `/lib/supabase/*` (client.ts, server.ts, middleware.ts)
- **Middleware**: `/middleware.ts` (session refresh and route protection)

### Database
- **User Profiles**: `public.profiles` table (auto-created on signup)
- **Row Level Security**: All tables protected with RLS policies
- **Migrations**: Located in `/supabase/migrations/`

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

**See `/docs/auth.md`** for complete authentication documentation.
