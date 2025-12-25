# Authentication System - Supabase Auth

## Overview
JoyfulWords uses Supabase Authentication for user management with Email/Password and Google OAuth support. The system requires email verification and protects all routes by redirecting unauthenticated users to the login page.

**Last Updated:** 2025-12-25
**Status:** ✅ Fully Implemented

---

## Architecture

### Technology Stack
- **Backend:** Supabase Auth (no custom backend)
- **Auth Provider:** Supabase Auth with SSR support (`@supabase/ssr`)
- **State Management:** React Context (`useAuth` hook)
- **Middleware:** Next.js middleware for session refresh
- **Session Storage:** HTTP-only cookies (managed by Supabase)

### Authentication Flow
```
User → Login Page → Supabase Auth → Email Verification → Dashboard
                ↓
         Google OAuth → Callback → Dashboard
```

---

## Key Files Reference

### Core Auth Files
- **`/lib/supabase/client.ts`** - Browser Supabase client for client-side auth
- **`/lib/supabase/server.ts`** - Server Supabase client for server actions
- **`/lib/supabase/middleware.ts`** - Middleware helper for session refresh
- **`/lib/auth/auth-context.tsx`** - Auth context provider with `useAuth()` hook
- **`/middleware.ts`** - Root middleware for route protection

### Database
- **`/supabase/migrations/20251225100234_create_user_profiles.sql`**
  - Creates `public.profiles` table
  - Auto-creates profile on user signup via trigger
  - RLS policies for profile access

- **`/supabase/migrations/20251225100326_update_materials_rls.sql`**
  - Adds `user_id` column to materials table
  - Updates RLS policies for authenticated users only
  - Users can only modify their own materials

### Auth Pages
- **`/app/auth/login/page.tsx`** - Login page (email/password + Google OAuth)
- **`/app/auth/signup/page.tsx`** - Signup page with email verification
- **`app/auth/verify-email/page.tsx`** - Email verification confirmation
- **`/app/auth/forgot-password/page.tsx`** - Password reset request
- **`/app/auth/callback/route.ts`** - OAuth callback and email verification handler
- **`/app/auth/signout/actions.ts`** - Sign out server action

### UI Components
- **`/components/auth/auth-card.tsx`** - Centered card wrapper for auth pages
- **`/components/auth/google-oauth-button.tsx`** - Google OAuth sign-in button
- **`/components/auth/password-strength.tsx`** - Password strength indicator
- **`/components/auth/login-form.tsx`** - Login form with validation
- **`/components/auth/signup-form.tsx`** - Signup form with password validation
- **`/components/auth/forgot-password-form.tsx`** - Password reset form

### Integration Points
- **`/app/layout.tsx`** - Wraps app with `AuthProvider`
- **`/app/page.tsx`** - Dashboard with auth check (redirects if unauthenticated)
- **`/components/sidebar.tsx`** - User dropdown menu with logout

---

## Environment Variables

Required in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Production:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## Supabase Configuration

### Email Verification
**File:** `/supabase/config.toml`
```toml
[auth.email]
enable_confirmations = true  # Email verification required
```

### Redirect URLs
**File:** `/supabase/config.toml`
```toml
[auth]
site_url = "http://127.0.0.1:3000"
additional_redirect_urls = [
  "http://127.0.0.1:3000/auth/callback",
  "http://localhost:3000/auth/callback"
]
```

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URLs:
   - Local: `http://127.0.0.1:3000/auth/callback`
   - Production: `https://your-domain.com/auth/callback`
4. Configure in Supabase Dashboard → Authentication → Providers → Google
5. Add Client ID and Client Secret

---

## Usage Examples

### Using the Auth Hook
```typescript
"use client"
import { useAuth } from "@/lib/auth/auth-context"

export function MyComponent() {
  const { user, session, loading, signInWithEmail, signOut } = useAuth()

  if (loading) return <div>Loading...</div>

  const handleLogin = async () => {
    try {
      await signInWithEmail("user@example.com", "password")
    } catch (error) {
      console.error("Login failed:", error)
    }
  }

  return (
    <div>
      <p>Welcome, {user?.email}</p>
      <button onClick={signOut}>Logout</button>
    </div>
  )
}
```

### Server-Side Auth Check
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ServerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return <div>Protected content for {user.email}</div>
}
```

### Protecting API Routes
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ data: 'protected data' })
}
```

---

## Database Schema

### Profiles Table
```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Accessing User Profile
```typescript
// Server component
import { createClient } from '@/lib/supabase/server'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  return <div>{profile?.full_name}</div>
}
```

---

## Internationalization

Auth translations are located in:
- **`/lib/i18n/locales/en.ts`** - English translations (auth section)
- **`/lib/i18n/locales/zh.ts`** - Chinese translations (auth section)

### Adding New Auth Translations
```typescript
// In both en.ts and zh.ts
auth: {
  yourNewKey: "English text",
  // ...
}
```

Usage:
```typescript
const { t } = useTranslation()
t("auth.yourNewKey")
```

---

## Testing

### Local Email Testing
- **Mailpit URL:** http://127.0.0.1:54324
- View all sent emails during development
- No actual emails are sent in local development

### Test Checklist
- [ ] Sign up with email
- [ ] Receive verification email in Mailpit
- [ ] Click verification link
- [ ] Login with verified email
- [ ] Login failure with unverified email
- [ ] Password strength indicator updates
- [ ] "Remember me" persists session
- [ ] Logout works correctly
- [ ] Unauthenticated users redirected to login
- [ ] Google OAuth (if configured)

---

## Security Considerations

### Row Level Security (RLS)
- ✅ All tables have RLS enabled
- ✅ Users can only access their own data
- ✅ Server-side validation required for sensitive operations

### Session Management
- ✅ JWT tokens expire after 1 hour (configurable)
- ✅ Middleware automatically refreshes tokens
- ✅ HTTP-only cookies prevent XSS attacks
- ✅ CSRF protection built into Supabase

### Best Practices
1. **Never trust client-side auth checks** - Always validate on the server
2. **Use server actions** for sensitive operations
3. **Implement rate limiting** - Supabase provides built-in rate limiting
4. **Enable email verification** - Prevents spam accounts
5. **Use strong passwords** - Minimum 6 characters (configurable in Supabase)

---

## Troubleshooting

### Common Issues

**Issue:** "Auth session missing!" error
**Solution:** Ensure middleware is properly configured and cookies are being set

**Issue:** User not redirected after login
**Solution:** Check that `useAuth` hook is properly wrapped in `AuthProvider`

**Issue:** Email verification not working
**Solution:**
- Check `enable_confirmations = true` in `supabase/config.toml`
- Verify emails in Mailpit (http://127.0.0.1:54324)
- Check redirect URLs are correct in Supabase config

**Issue:** Google OAuth not working
**Solution:**
- Ensure redirect URL matches exactly in Google Cloud Console
- Use `http://127.0.0.1:3000` not `localhost:3000`
- Check Google Client ID and Secret in Supabase Dashboard

### Resetting Local Database
```bash
supabase db reset
```

### Checking Supabase Status
```bash
supabase status
```

---

## Migration Reference

### Applied Migrations
1. **20251225100234_create_user_profiles.sql**
   - Creates profiles table
   - Sets up triggers for auto-creating profiles
   - Configures RLS policies

2. **20251225100326_update_materials_rls.sql**
   - Adds user_id to materials table
   - Updates RLS for authenticated users
   - Restricts material access to owners

### Creating New Migrations
```bash
supabase migration new migration_name
# Edit the generated migration file
supabase db reset
```

---

## Future Enhancements

### Planned Features
- [ ] User profile page (`/profile`)
- [ ] Password change functionality
- [ ] Email change functionality
- [ ] Two-factor authentication (2FA)
- [ ] Session management view
- [ ] Login history tracking
- [ ] Account deletion
- [ ] Social account linking

### User Profile Page
```typescript
// Future implementation at /app/profile/page.tsx
export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  // Profile editing form
}
```

---

## Additional Resources

### Documentation
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase SSR with Next.js](https://supabase.com/docs/guides/auth/server-side/rendering)
- [Next.js App Router](https://nextjs.org/docs/app)

### Supabase Dashboard
- **Local:** http://127.0.0.1:54323
- **Mailpit:** http://127.0.0.1:54324
- **API:** http://127.0.0.1:54321

### Useful Commands
```bash
# Start Supabase
supabase start

# Stop Supabase
supabase stop

# Check status
supabase status

# Reset database
supabase db reset

# View logs
supabase logs auth

# Generate types
supabase gen types typescript
```

---

## Implementation Notes

### Design Decisions
1. **Why SSR?** Server-side rendering provides better security and SEO
2. **Why middleware?** Automatic token refresh prevents session expiration
3. **Why email verification?** Prevents spam accounts and verifies user identity
4. **Why "Remember me"?** User convenience while maintaining security
5. **Why Google OAuth?** Popular, secure, and easy to integrate

### Code Style
- ✅ All auth components are client components (`"use client"`)
- ✅ Server actions for sensitive operations (login, signup, signout)
- ✅ Consistent error handling with toast notifications
- ✅ Loading states for better UX
- ✅ Bilingual support (zh/en) throughout

---

## Support

For issues or questions:
1. Check this documentation first
2. Review Supabase Auth documentation
3. Check browser console and Supabase logs
4. Ensure all environment variables are set correctly
5. Verify database migrations are applied

**Remember:** Email testing in development uses Mailpit, not real emails!
