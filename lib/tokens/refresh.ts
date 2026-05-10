import { apiClient } from '@/lib/api/client'
import type { AuthResponse } from '@/lib/api/types'
import { tokenStore } from './token-store'

let refreshPromise: Promise<AuthResponse | null> | null = null

/**
 * Refresh access token using the server-side HttpOnly refresh cookie.
 * Uses a promise lock to prevent concurrent refresh attempts.
 */
export async function refreshAccessSession(source = 'refresh_access_token'): Promise<AuthResponse | null> {
  if (refreshPromise) {
    return refreshPromise
  }

  tokenStore.markRefreshStarted(source)

  refreshPromise = (async () => {
    try {
      const result = await apiClient.refreshToken()

      if ('error' in result) {
        tokenStore.markRefreshFailed(source)
        tokenStore.clear(`${source}_failed`)
        console.warn('[Auth] Token refresh rejected by API', {
          source,
          status: result.status,
          reason: result.reason,
          error: result.error,
          error_description: result.error_description,
        })
        return null
      }

      tokenStore.setAccessToken(result, source)
      return result
    } catch (error) {
      tokenStore.markRefreshFailed(source)
      tokenStore.clear(`${source}_failed`)
      console.error('[Auth] Token refresh request failed', {
        source,
        error,
      })
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function refreshAccessToken(): Promise<boolean> {
  const session = await refreshAccessSession()
  return Boolean(session)
}

/**
 * Setup automatic token refresh
 * Checks every minute if token needs refresh (1 minute before expiry)
 */
export function setupTokenRefresh(): () => void {
  checkAndRefreshToken()

  const intervalId = setInterval(() => {
    checkAndRefreshToken()
  }, 60_000)

  return () => clearInterval(intervalId)
}

function checkAndRefreshToken(): void {
  const accessToken = tokenStore.getAccessToken()

  if (!accessToken) {
    return
  }

  if (tokenStore.isTokenExpired() && !tokenStore.isRefreshing()) {
    void refreshAccessToken()
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  const accessToken = tokenStore.getAccessToken()

  if (accessToken && !tokenStore.isTokenExpired()) {
    return accessToken
  }

  const session = await refreshAccessSession(
    accessToken ? 'get_valid_access_token_expired' : 'get_valid_access_token_missing'
  )
  if (!session) {
    return null
  }

  return tokenStore.getAccessToken()
}
