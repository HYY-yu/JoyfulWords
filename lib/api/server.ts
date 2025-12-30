import { cookies } from 'next/headers'
import { TOKEN_KEYS } from '@/lib/tokens/token-manager'
import type { User } from './types'

/**
 * Server-side Token Manager
 * Used in Server Components and Server Actions
 */
export class ServerTokenManager {
  /**
   * Get refresh token from cookies (server-side)
   */
  static async getRefreshToken(): Promise<string | null> {
    const cookieStore = await cookies()
    return cookieStore.get(TOKEN_KEYS.REFRESH_TOKEN)?.value || null
  }

  /**
   * Clear refresh token cookie (server-side)
   */
  static async clearRefreshToken(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete(TOKEN_KEYS.REFRESH_TOKEN)
  }

  /**
   * Set refresh token cookie (server-side)
   */
  static async setRefreshToken(refreshToken: string): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.set(TOKEN_KEYS.REFRESH_TOKEN, refreshToken, {
      httpOnly: true,
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: 'lax',
    })
  }
}

/**
 * Server-side API Client
 * Used in Server Components and Server Actions
 */
export class ServerApiClient {
  /**
   * Get user from refresh token (server-side)
   */
  static async getUser(): Promise<User | null> {
    try {
      const refreshToken = await ServerTokenManager.getRefreshToken()

      if (!refreshToken) {
        return null
      }

      // We can verify the token server-side by calling a protected endpoint
      // For now, we'll return null as we don't have a user info endpoint
      // This can be extended when the API provides a /me endpoint
      return null
    } catch (error) {
      console.error('Error getting user:', error)
      return null
    }
  }

  /**
   * Create authenticated request headers
   */
  static async getAuthHeaders(): Promise<HeadersInit> {
    const refreshToken = await ServerTokenManager.getRefreshToken()

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (refreshToken) {
      headers['Authorization'] = `Bearer ${refreshToken}`
    }

    return headers
  }

  /**
   * Check if user is authenticated (server-side)
   */
  static async isAuthenticated(): Promise<boolean> {
    const refreshToken = await ServerTokenManager.getRefreshToken()
    return refreshToken !== null
  }
}

/**
 * Helper function to get current user in Server Components
 */
export async function getCurrentUser(): Promise<User | null> {
  return ServerApiClient.getUser()
}

/**
 * Helper function to check authentication in Server Components
 */
export async function isUserAuthenticated(): Promise<boolean> {
  return ServerApiClient.isAuthenticated()
}

