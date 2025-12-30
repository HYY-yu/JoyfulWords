import { TokenManager } from './token-manager'
import { apiClient } from '@/lib/api/client'

let refreshPromise: Promise<boolean> | null = null

/**
 * Refresh access token using refresh token
 * Uses a promise lock to prevent concurrent refresh attempts
 */
export async function refreshAccessToken(): Promise<boolean> {
  // If a refresh is already in progress, return that promise
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = TokenManager.getRefreshToken()

      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const result = await apiClient.refreshToken(refreshToken)

      if ('error' in result) {
        throw new Error(result.error)
      }

      // Update tokens in storage
      TokenManager.updateTokens(result as any)

      return true
    } catch (error) {
      // Clear all tokens on refresh failure
      TokenManager.clearTokens()
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
  // Check immediately on setup
  checkAndRefreshToken()

  // Check every 60 seconds
  const intervalId = setInterval(() => {
    checkAndRefreshToken()
  }, 60000)

  // Return cleanup function
  return () => clearInterval(intervalId)
}

/**
 * Check if token needs refresh and refresh if necessary
 */
function checkAndRefreshToken(): void {
  const accessToken = TokenManager.getAccessToken()

  if (!accessToken) {
    return // No token to refresh
  }

  if (TokenManager.isTokenExpired()) {
    // Token is about to expire or already expired, refresh it
    refreshAccessToken()
  }
}

/**
 * Ensure token is valid before making API calls
 * Refreshes if needed, then returns the access token
 */
export async function getValidAccessToken(): Promise<string | null> {
  const accessToken = TokenManager.getAccessToken()

  if (!accessToken) {
    return null
  }

  if (TokenManager.isTokenExpired()) {
    const refreshed = await refreshAccessToken()
    if (!refreshed) {
      return null
    }
  }

  return TokenManager.getAccessToken()
}
