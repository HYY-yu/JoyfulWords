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
  return matchesPrefix(pathname, AUTH_ROUTE_PREFIXES)
}

export function isPublicPage(pathname: string): boolean {
  return matchesPrefix(pathname, PUBLIC_PAGE_PREFIXES)
}

export function isPublicRoute(pathname: string): boolean {
  return (
    isAuthRoute(pathname) ||
    isPublicPage(pathname) ||
    EXACT_PUBLIC_ROUTES.some((route) => route === pathname)
  )
}

export function shouldAttemptSessionRestore({
  pathname,
  hasStoredUser,
  hasAccessToken,
}: SessionRestorePolicyInput): boolean {
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
