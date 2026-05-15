import { NextResponse, type NextRequest } from 'next/server'
import { trace } from '@opentelemetry/api'
import { DEFAULT_LOCALE, getLocaleFromPathname, parseAcceptLanguageLocale } from '@/lib/i18n/route-locale'
import { isPublicRoute } from '@/lib/auth/session-policy'

const REFRESH_TOKEN_KEY = 'refresh_token'
const LOCALE_COOKIE_KEY = 'locale'
const NEXT_INTERNAL_QUERY_KEYS = new Set(['_rsc'])

export function buildProtectedRouteRedirect(pathname: string, searchParams: URLSearchParams): string {
  const cleanSearchParams = new URLSearchParams(searchParams)

  NEXT_INTERNAL_QUERY_KEYS.forEach((key) => {
    cleanSearchParams.delete(key)
  })

  const cleanSearch = cleanSearchParams.toString()
  return cleanSearch ? `${pathname}?${cleanSearch}` : pathname
}

function withTraceServerTiming(response: NextResponse): NextResponse {
  const spanContext = trace.getActiveSpan()?.spanContext()
  if (!spanContext) return response

  const traceFlags = spanContext.traceFlags.toString(16).padStart(2, '0')
  response.headers.append(
    'server-timing',
    `traceparent;desc="00-${spanContext.traceId}-${spanContext.spanId}-${traceFlags}"`
  )

  return response
}

function withSeoHostPolicy(request: NextRequest, response: NextResponse): NextResponse {
  return response
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get refresh token from cookies
  const refreshToken = request.cookies.get(REFRESH_TOKEN_KEY)?.value
  const isAuthenticated = !!refreshToken
  const isPublic = isPublicRoute(pathname)
  const pathLocale = getLocaleFromPathname(pathname)
  const cookieLocale = request.cookies.get(LOCALE_COOKIE_KEY)?.value
  const acceptLanguageLocale = parseAcceptLanguageLocale(request.headers.get('accept-language'))
  const requestLocale = pathLocale ?? (cookieLocale === 'en' || cookieLocale === 'zh' ? cookieLocale : null) ?? acceptLanguageLocale ?? DEFAULT_LOCALE

  // Redirect authenticated users away from auth pages (but NOT public pages)
  // if (isAuthenticated && isAuthPage) {
  //   return NextResponse.redirect(new URL('/articles', request.url))
  // }

  // Redirect unauthenticated users to login for protected routes
  if (!isAuthenticated && !isPublic) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('redirect', buildProtectedRouteRedirect(pathname, request.nextUrl.searchParams))
    return withSeoHostPolicy(request, withTraceServerTiming(NextResponse.redirect(url)))
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-locale', requestLocale)

  return withSeoHostPolicy(request, withTraceServerTiming(NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })))
}

export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)',
  ],
}
