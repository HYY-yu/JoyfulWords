# Landing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a public landing page at `/`, move the authenticated dashboard to `/dashboard`.

**Architecture:** Move current `app/page.tsx` to `app/dashboard/page.tsx`, create new landing page at `app/page.tsx`. Update middleware to treat `/` as public. Update 4 files that reference `'/'` as the post-login destination.

**Tech Stack:** Next.js App Router, Tailwind CSS, Shadcn Button, Lucide icons, Next.js Link

---

### Task 1: Move Dashboard to `/dashboard`

**Files:**
- Move: `app/page.tsx` -> `app/dashboard/page.tsx`

**Step 1: Create dashboard directory and move file**

```bash
mkdir -p app/dashboard
mv app/page.tsx app/dashboard/page.tsx
```

**Step 2: Verify the file moved correctly**

```bash
cat app/dashboard/page.tsx | head -5
```

Expected: First line is `"use client"`, imports remain unchanged.

**Step 3: Commit**

```bash
git add app/page.tsx app/dashboard/page.tsx
git commit -m "refactor: move dashboard from / to /dashboard"
```

---

### Task 2: Update Route References

**Files:**
- Modify: `middleware.ts:6-15,25-26`
- Modify: `components/auth/login-form.tsx:35`
- Modify: `app/auth/google/callback/page.tsx:84`
- Modify: `lib/auth/auth-context.tsx:97`
- Modify: `app/payment/cancel/page.tsx:13`
- Modify: `app/payment/success/payment-success-content.tsx:226`

**Step 1: Update middleware.ts**

The middleware uses `publicRoutes` with `startsWith` matching. `/` would match everything, so use exact match. Change the auth redirect target from `/` to `/dashboard`.

```typescript
// middleware.ts - replace full middleware function
const publicRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/google/callback',  // Google OAuth callback
  '/auth/verify-email',     // Email verification
  '/cookie-policy',         // Cookie policy
  '/terms-of-use',          // Terms of use
  '/privacy-policy',        // Privacy policy
]

// Exact match public routes (cannot use startsWith)
const exactPublicRoutes = ['/']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const refreshToken = request.cookies.get(REFRESH_TOKEN_KEY)?.value
  const isAuthenticated = !!refreshToken
  const isPublic = publicRoutes.some(route => pathname.startsWith(route)) || exactPublicRoutes.includes(pathname)

  // Redirect authenticated users away from auth pages to dashboard
  if (isAuthenticated && publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect unauthenticated users to login for protected routes
  if (!isAuthenticated && !isPublic) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
```

**Step 2: Update login-form.tsx**

```
// components/auth/login-form.tsx:35
// Change:
router.push("/")
// To:
router.push("/dashboard")
```

**Step 3: Update google callback**

```
// app/auth/google/callback/page.tsx:84
// Change:
const redirect = sessionStorage.getItem('oauth_redirect') || '/'
// To:
const redirect = sessionStorage.getItem('oauth_redirect') || '/dashboard'
```

**Step 4: Update auth-context.tsx**

```
// lib/auth/auth-context.tsx:97
// Change:
sessionStorage.setItem('oauth_redirect', redirectUrl || '/')
// To:
sessionStorage.setItem('oauth_redirect', redirectUrl || '/dashboard')
```

**Step 5: Update payment pages**

```
// app/payment/cancel/page.tsx:13
// Change:
router.push('/?tab=billing')
// To:
router.push('/dashboard?tab=billing')

// app/payment/success/payment-success-content.tsx:226
// Change:
router.push('/?tab=billing')
// To:
router.push('/dashboard?tab=billing')
```

**Step 6: Commit**

```bash
git add middleware.ts components/auth/login-form.tsx app/auth/google/callback/page.tsx lib/auth/auth-context.tsx app/payment/cancel/page.tsx app/payment/success/payment-success-content.tsx
git commit -m "refactor: update all route references from / to /dashboard"
```

---

### Task 3: Create Landing Page

**Files:**
- Create: `app/page.tsx`

**Step 1: Create the landing page component**

Reference design: `/Users/fsm/Downloads/joyfulwords.html` (HomePage function, lines 134-248)

The page is a single `"use client"` component with these sections:

1. **Navbar** (fixed, glassmorphism `backdrop-blur-2xl`, h-14)
   - Logo: `J` in a gradient square + "JoyfulWords" serif text
   - "Features" anchor link (`href="#features"`)
   - "My Articles" button (Link to `/dashboard`, variant `default`, size `sm`)
   - "Start Creating ->" button (Link to `/dashboard`, primary blue bg)

2. **Hero** (min-h-screen, centered, radial gradient bg)
   - Badge pill: "AI-driven content creation platform" with Sparkles icon
   - H1: "Write better content," + line break + italic blue "Faster"
   - Description paragraph
   - Two CTA buttons: primary "Start Creating" + outline "View My Articles"
   - Three stat cards in a row: "10x" / "6 in 1" / "Real-time"

3. **Features** (`id="features"`, white bg, border-t)
   - Label: "FULL TOOLKIT" uppercase small
   - H2: "Everything you need," + italic blue "built in"
   - 3x2 grid with 1px gap (using border trick), rounded-2xl
   - Each card: icon in colored circle, number (01-06), title, description
   - 6 features with their colors:
     - AI Writing: blue `#2563EB`
     - Image Gen: purple `#7c3aed`
     - SEO/GEO: green `#16a34a`
     - Knowledge Cards: amber `#d97706`
     - Material Search: cyan `#0891b2`
     - Competitor Analysis: red `#dc2626`

4. **CTA** (dark bg `#1a1a1a`, rounded-2xl, radial gradient overlay)
   - H2: "Start your first article" (white, serif)
   - Subtitle (white/50)
   - White button "Start Creating ->"

5. **Footer** (border-t, flex between)
   - Logo (same as navbar)
   - "Content creation tool v1.0.0" text

Use Tailwind classes exclusively. Use `font-serif` for headings. Use Shadcn `Button` with `asChild` wrapping `Link` for navigation buttons. Use Lucide icons: `Sparkles`, `Gem`, `Target`, `Square`, `LayoutGrid`, `MessageSquareMore`.

**Step 2: Verify dev server loads the page**

```bash
# Open browser to localhost:3000
# Expected: Landing page renders with all 5 sections
# Click "Start Creating" -> redirects to /auth/login (if not logged in)
# Click "My Articles" -> same
```

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add public landing page at /"
```

---

### Task 4: Add Landing Page Animations to globals.css

**Files:**
- Modify: `app/globals.css`

**Step 1: Add fadeUp and fadeIn keyframes**

Append to `globals.css` after existing animations:

```css
/* ========================================
   Landing Page Animations
   ======================================== */
@keyframes landing-fade-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-up {
  animation: landing-fade-up 0.55s ease both;
}

.animate-delay-1 { animation-delay: 0.08s; }
.animate-delay-2 { animation-delay: 0.16s; }
.animate-delay-3 { animation-delay: 0.26s; }
.animate-delay-4 { animation-delay: 0.38s; }
```

**Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat: add landing page fade-up animations"
```

---

### Task 5: Verify Full Flow

**Step 1: Test unauthenticated flow**

1. Open incognito browser to `localhost:3000` -> sees landing page
2. Click "Start Creating" -> redirects to `/auth/login`
3. Click "Features" -> scrolls to features section

**Step 2: Test authenticated flow**

1. Log in via `/auth/login` -> redirects to `/dashboard`
2. Navigate to `localhost:3000` -> sees landing page (public, no redirect)
3. Navigate to `/dashboard` -> sees dashboard
4. Log out -> redirect to `/auth/login`

**Step 3: Test payment flow**

1. Payment success -> "Back to billing" redirects to `/dashboard?tab=billing`
2. Payment cancel -> same

**Step 4: Commit if any fixes needed**
