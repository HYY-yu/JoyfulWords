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

### Directory Structure

```
/app                    # Next.js App Router pages
  - layout.tsx         # Root layout with metadata and font configuration
  - page.tsx           # Main dashboard page with tab state management
  - globals.css        # Global styles with Tailwind directives and CSS variables

/components/           # React components
  - /ui/              # Shadcn/ui component library (~59 components)
  - /editor/          # Tiptap editor components and extensions
    - tiptap-editor.tsx  # Main rich text editor component
    - editor-toolbar.tsx # Editor toolbar with formatting controls
    - editor-extensions.ts # Custom Tiptap extensions and configurations
  - sidebar.tsx       # Main navigation sidebar
  - main-content.tsx  # Content area router based on active tab
  - content-writing.tsx  # Content writing tools with nested tabs
  - material-search.tsx  # Material search functionality
  - competitor-tracking.tsx # Competitor analysis
  - article-writing.tsx  # Article writing tool with Tiptap editor
  - article-manager.tsx  # Article management system with table view and dialogs
  - article-types.ts     # Type definitions and mock data for articles
  - article-dialogs.tsx  # Dialog components for article management (preview, images, links)
  - article-table.tsx    # Reusable table component for article display
  - image-generation.tsx # Image generation feature
  - knowledge-cards.tsx  # Knowledge cards generation and management feature
  - [other feature components]

/hooks/               # Custom React hooks
  - use-mobile.ts     # Mobile detection hook
  - use-toast.ts      # Toast notification hook

/lib/                 # Utility functions
  - utils.ts          # Class name merging (clsx + twMerge)

/public/              # Static assets
  - Icons/            # Application icons (light/dark theme variants)
  - Images/           # Placeholder images and backgrounds
```

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

### Article Management System

The application includes a comprehensive article management module located in the content-writing section:

1. **Core Components**:
   - `article-manager.tsx`: Main management interface with table view, search, and filtering
   - `article-types.ts`: TypeScript definitions for Article, ArticleImage, ReferenceLink types
   - `article-dialogs.tsx`: Modal dialogs for content preview, image gallery, and link management
   - `article-table.tsx`: Reusable table component with sorting and interaction capabilities

2. **Features**:
   - **Table View**: Clean, consistent table styling matching material search design
   - **Search & Filter**: Title-based search and status-based filtering (published, draft, archived)
   - **Interactive Content**: Click-to-preview functionality for article content, images, and reference links
   - **Content Preview Dialog**: Full article content display with metadata and tags
   - **Image Gallery Dialog**: Interactive image viewer with navigation and thumbnail grid
   - **Links Management Dialog**: Organized display of reference links with external access
   - **CRUD Operations**: Edit, delete, and create new articles with confirmation dialogs
   - **Status Management**: Track and change article publication status

3. **Mock Data**:
   - 12 sample articles covering various content creation topics
   - Rich content including images (1-3 per article) and reference links (1-3 per article)
   - Different statuses and categories for comprehensive testing
   - Bilingual content with Chinese titles and English descriptions

4. **UI/UX Design**:
   - Consistent styling with material search component
   - Responsive table layout with hover effects
   - Icon-based actions with tooltips
   - Loading states and empty data handling
   - Mobile-optimized responsive design

5. **Technical Implementation**:
   - TypeScript strict mode with comprehensive type safety
   - React hooks for state management (useState, useMemo)
   - Shadcn/ui components for consistent design system
   - Custom CSS utilities (line-clamp) for text truncation
   - Toast notifications for user feedback

### Knowledge Cards System

The application includes a comprehensive knowledge cards module for converting arbitrary text/links into structured knowledge cards:

1. **Core Component**: `knowledge-cards.tsx`
   - Complete form-based interface with validation using React Hook Form + Zod
   - Real-time style preview with iframe rendering
   - Support for both Markdown and mind map layouts
   - Six color themes: 热情红, 魅力蓝, 活力橙, 自然绿, 优雅紫, 科技银

2. **Form Fields**:
   - **Content Input**: Large textarea supporting URLs or arbitrary text (10-10,000 characters)
   - **Card Style**: Required selection from six predefined color schemes
   - **Card Layout**: Choice between Markdown and mind map formats
   - **Language**: Chinese or English language selection
   - **Card Count**: Optional number of cards (1-20, default 5)
   - **Card Requirements**: Optional special requirements field

3. **Features**:
   - **Real-time Preview**: Live style preview in iframe before generation
   - **Dynamic Generation**: Simulated AI processing with loading states
   - **HTML Output**: Generated cards rendered as HTML in iframe
   - **Export Functions**: Print and download HTML capabilities
   - **Responsive Design**: Mobile-optimized layout with proper form validation
   - **Theme Support**: Full dark/light mode compatibility

4. **Technical Implementation**:
   - TypeScript strict mode with comprehensive form validation
   - React Hook Form for state management and form handling
   - Zod schemas for runtime validation
   - Shadcn/ui components for consistent design
   - iframe-based rendering for safe HTML display
   - Color scheme system with CSS gradients
   - Toast notifications using Sonner for user feedback

5. **Card Generation Process**:
   - Accepts arbitrary text or URLs as input
   - Processes content based on selected layout (Markdown/mind map)
   - Generates styled HTML cards with proper typography
   - Includes metadata like generation timestamps
   - Applies selected color themes and layout styles
   - Supports bilingual content (Chinese/English)

## Important Notes

- **TypeScript Errors**: Build ignores TypeScript errors (`ignoreBuildErrors: true` in next.config.mjs)
- **Image Optimization**: Disabled (`unoptimized: true` in next.config.mjs)
- **Bilingual UI**: Application supports Chinese (primary) and English text
- **Dark Mode**: Fully supported through CSS variables
- **Responsive Design**: Mobile-responsive with Tailwind utilities

## Feature Status

- **Fully Implemented**:
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
- Ensure editor content is properly sanitized and validated with Zod schemas