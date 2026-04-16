import { apiClient } from '@/lib/api/client'
import { tokenStore } from './token-store'

let refreshPromise: Promise<boolean> | null = null

/**
 * Refresh access token using the server-side HttpOnly refresh cookie.
 * Uses a promise lock to prevent concurrent refresh attempts.
 */
export async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise
  }

  tokenStore.markRefreshStarted('refresh_access_token')

  refreshPromise = (async () => {
    try {
      const result = await apiClient.refreshToken()

      if ('error' in result) {
        throw new Error(result.error)
      }

      tokenStore.setAccessToken(result, 'refresh_access_token')
      return true
    } catch (error) {
      tokenStore.markRefreshFailed('refresh_access_token')
      tokenStore.clear('refresh_access_token_failed')
      console.error('Token refresh failed:', error)
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
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

  if (!accessToken) {
    return null
  }

  if (tokenStore.isTokenExpired()) {
    const refreshed = await refreshAccessToken()
    if (!refreshed) {
      return null
    }
  }

  return tokenStore.getAccessToken()
}
