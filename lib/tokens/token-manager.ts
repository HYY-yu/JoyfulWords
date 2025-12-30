import type { Tokens, User } from '@/lib/api/types'

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const EXPIRES_AT_KEY = 'expires_at'
const USER_KEY = 'user'

/**
 * Token Manager - Handles token storage and retrieval (Client-side only)
 * Uses localStorage for client-side access and sets cookies for server-side access
 */
export class TokenManager {
  /**
   * Set authentication tokens
   * - access_token: localStorage
   * - refresh_token: localStorage + cookie (for server-side)
   * - expires_at: localStorage
   * - user: localStorage
   */
  static setTokens(tokens: Tokens): void {
    if (typeof window === 'undefined') return

    const expiresAt = Date.now() + tokens.expires_in * 1000

    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
    localStorage.setItem(EXPIRES_AT_KEY, expiresAt.toString())
    localStorage.setItem(USER_KEY, JSON.stringify(tokens.user))

    // Set refresh token in cookie for server-side access
    document.cookie = `${REFRESH_TOKEN_KEY}=${tokens.refresh_token}; path=/; max-age=${30 * 24 * 60 * 60}; sameSite=lax`
  }

  /**
   * Get all tokens
   */
  static getTokens(): Tokens | null {
    if (typeof window === 'undefined') return null

    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    const userStr = localStorage.getItem(USER_KEY)

    if (!accessToken || !refreshToken || !userStr) {
      return null
    }

    const user: User = JSON.parse(userStr)

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: parseInt(localStorage.getItem(EXPIRES_AT_KEY) || '0'),
      user,
    }
  }

  /**
   * Get access token from localStorage
   */
  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  }

  /**
   * Get refresh token from localStorage or fallback to cookies
   */
  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') {
      return null
    }

    // Try localStorage first
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (refreshToken) {
      return refreshToken
    }

    // Fallback to cookies
    const match = document.cookie.match(new RegExp(`(^| )${REFRESH_TOKEN_KEY}=([^;]+)`))
    return match ? match[2] : null
  }

  /**
   * Get current user from localStorage
   */
  static getUser(): User | null {
    if (typeof window === 'undefined') return null

    const userStr = localStorage.getItem(USER_KEY)
    if (!userStr) return null

    try {
      return JSON.parse(userStr) as User
    } catch {
      return null
    }
  }

  /**
   * Check if token is expired (with 1 minute buffer)
   */
  static isTokenExpired(): boolean {
    if (typeof window === 'undefined') return false

    const expiresAt = localStorage.getItem(EXPIRES_AT_KEY)
    if (!expiresAt) return true

    // Check if token will expire in the next 1 minute
    return Date.now() + 60000 > parseInt(expiresAt)
  }

  /**
   * Clear all tokens from localStorage and cookies
   */
  static clearTokens(): void {
    if (typeof window === 'undefined') return

    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(EXPIRES_AT_KEY)
    localStorage.removeItem(USER_KEY)

    // Clear refresh token cookie
    document.cookie = `${REFRESH_TOKEN_KEY}=; path=/; max-age=0; sameSite=lax`
  }

  /**
   * Update tokens after refresh
   */
  static updateTokens(tokens: Tokens): void {
    this.setTokens(tokens)
  }
}

// Export the key constants for use in server code
export const TOKEN_KEYS = {
  ACCESS_TOKEN: ACCESS_TOKEN_KEY,
  REFRESH_TOKEN: REFRESH_TOKEN_KEY,
  EXPIRES_AT: EXPIRES_AT_KEY,
  USER: USER_KEY,
}
