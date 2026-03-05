import { NextResponse, type NextRequest } from 'next/server'

const REFRESH_TOKEN_KEY = 'refresh_token'

// Routes that don't require authentication (prefix match)
const publicRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/google/callback',  // Google OAuth 回调页面
  '/auth/verify-email',     // 邮箱验证页面
  '/cookie-policy',         // Cookie 政策页面
  '/terms-of-use',          // 使用条款页面
  '/privacy-policy',        // 隐私政策页面
]

// Exact match public routes (cannot use startsWith for '/')
const exactPublicRoutes = ['/']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get refresh token from cookies
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

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)',
  ],
}
