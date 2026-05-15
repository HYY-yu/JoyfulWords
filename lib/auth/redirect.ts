import { isAuthRoute } from '@/lib/auth/session-policy'

export const DEFAULT_AUTH_REDIRECT = '/articles'

function getPathnameFromRelativeRedirect(value: string): string {
  const queryIndex = value.indexOf('?')
  const hashIndex = value.indexOf('#')
  const endIndexCandidates = [queryIndex, hashIndex].filter((index) => index >= 0)
  const pathnameEndIndex = endIndexCandidates.length > 0
    ? Math.min(...endIndexCandidates)
    : value.length

  return value.slice(0, pathnameEndIndex)
}

export function normalizeAuthRedirect(value: string | null | undefined): string {
  if (!value) {
    return DEFAULT_AUTH_REDIRECT
  }

  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return DEFAULT_AUTH_REDIRECT
  }

  const pathname = getPathnameFromRelativeRedirect(value)
  if (!pathname || !pathname.startsWith('/') || isAuthRoute(pathname)) {
    return DEFAULT_AUTH_REDIRECT
  }

  return value
}
