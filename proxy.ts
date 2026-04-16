import { NextResponse, type NextRequest } from 'next/server'
import { isAuthRoute, isPublicRoute } from '@/lib/auth/session-policy'

const REFRESH_TOKEN_KEY = 'refresh_token'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get refresh token from cookies
  const refreshToken = request.cookies.get(REFRESH_TOKEN_KEY)?.value
  const isAuthenticated = !!refreshToken
  const isAuthPage = isAuthRoute(pathname)
  const isPublic = isPublicRoute(pathname)

  // Redirect authenticated users away from auth pages (but NOT public pages)
  // if (isAuthenticated && isAuthPage) {
  //   return NextResponse.redirect(new URL('/articles', request.url))
  // }

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
    '/((?!api/|_next/static|_next/image|favicon.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)',
  ],
}
