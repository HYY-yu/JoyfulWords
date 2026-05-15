import { isAuthRoute, isPublicRoute } from '@/lib/auth/session-policy'

const DEFAULT_RETRY_DELAYS_MS = [0, 50, 100, 200, 400] as const

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export async function waitForProxySessionBeforeRedirect(
  redirectTarget: string,
  retryDelaysMs: readonly number[] = DEFAULT_RETRY_DELAYS_MS
): Promise<boolean> {
  if (typeof window === 'undefined' || isPublicRoute(redirectTarget)) {
    return true
  }

  const targetUrl = new URL(redirectTarget, window.location.origin)

  if (targetUrl.origin !== window.location.origin) {
    return true
  }

  const targetPath = `${targetUrl.pathname}${targetUrl.search}`

  for (const delayMs of retryDelaysMs) {
    if (delayMs > 0) {
      await sleep(delayMs)
    }

    try {
      const response = await fetch(targetPath, {
        method: 'HEAD',
        credentials: 'include',
        cache: 'no-store',
      })
      const finalPathname = new URL(response.url, window.location.origin).pathname

      if (!isAuthRoute(finalPathname)) {
        return true
      }

      console.debug('[Auth] Protected redirect is still gated by proxy login redirect', {
        redirectTarget,
        finalPathname,
      })
    } catch (error) {
      console.warn('[Auth] Failed to probe proxy session before redirect', {
        redirectTarget,
        error,
      })
    }
  }

  console.warn('[Auth] Proxy session was not visible before protected redirect', {
    redirectTarget,
  })
  return false
}
