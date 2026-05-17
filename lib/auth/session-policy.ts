import { stripLocalePrefix } from "@/lib/i18n/route-locale"

const AUTH_ROUTE_PREFIXES = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/google/callback',
  '/auth/verify-email',
] as const

const PUBLIC_PAGE_PREFIXES = [
  '/cookie-policy',
  '/terms-of-use',
  '/privacy-policy',
  '/blog',
  '/mcp',
  '/pricing',
  '/tools',
  '/file-converter',
] as const

const EXACT_PUBLIC_ROUTES = ['/', '/sitemap.xml', '/robots.txt'] as const

const NON_REFRESHABLE_ENDPOINT_PREFIXES = [
  '/auth/login',
  '/auth/signup/request',
  '/auth/signup/verify',
  '/auth/password/reset/request',
  '/auth/password/reset/verify',
  '/auth/google/login',
  '/auth/google/callback',
] as const

interface SessionRestorePolicyInput {
  pathname: string
  hasStoredUser: boolean
  hasAccessToken: boolean
  accessTokenExpired?: boolean
}

interface AuthRefreshPolicyInput {
  endpoint: string
  hasAuthorizationHeader: boolean
  skipAuthRefresh: boolean
}

function matchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => pathname.startsWith(prefix))
}

export function isAuthRoute(pathname: string): boolean {
  return matchesPrefix(stripLocalePrefix(pathname), AUTH_ROUTE_PREFIXES)
}

export function isPublicPage(pathname: string): boolean {
  return matchesPrefix(stripLocalePrefix(pathname), PUBLIC_PAGE_PREFIXES)
}

export function isPublicRoute(pathname: string): boolean {
  const normalizedPathname = stripLocalePrefix(pathname)
  return (
    isAuthRoute(normalizedPathname) ||
    isPublicPage(normalizedPathname) ||
    EXACT_PUBLIC_ROUTES.some((route) => route === normalizedPathname)
  )
}

export function shouldAttemptSessionRestore({
  pathname,
  hasStoredUser,
  hasAccessToken,
  accessTokenExpired = false,
}: SessionRestorePolicyInput): boolean {
  if (isAuthRoute(pathname)) {
    return false
  }

  if (hasAccessToken && accessTokenExpired) {
    return true
  }

  if (hasStoredUser && hasAccessToken) {
    return false
  }

  if (hasStoredUser || hasAccessToken) {
    return true
  }

  return !isPublicRoute(pathname)
}

export function shouldAttemptAuthRefresh({
  endpoint,
  hasAuthorizationHeader,
  skipAuthRefresh,
}: AuthRefreshPolicyInput): boolean {
  if (skipAuthRefresh || !hasAuthorizationHeader) {
    return false
  }

  return !matchesPrefix(endpoint, NON_REFRESHABLE_ENDPOINT_PREFIXES)
}
