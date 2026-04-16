import type { AccessTokenSession } from '@/lib/api/types'

const ACCESS_TOKEN_KEY = 'access_token'
const EXPIRES_AT_KEY = 'expires_at'
const LEGACY_REFRESH_TOKEN_KEY = 'refresh_token'
const LEGACY_USER_KEY = 'user'

/**
 * Token Manager
 * 仅负责 access token 的持久化，避免和用户身份状态耦合。
 */
export class TokenManager {
  private static clearLegacyStorage() {
    if (typeof window === 'undefined') return

    localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY)
    localStorage.removeItem(LEGACY_USER_KEY)
    document.cookie = `${LEGACY_REFRESH_TOKEN_KEY}=; path=/; max-age=0; sameSite=lax`
  }

  static setAccessToken(session: AccessTokenSession): number {
    if (typeof window === 'undefined') return 0

    const expiresAt = Date.now() + session.expires_in * 1000
    localStorage.setItem(ACCESS_TOKEN_KEY, session.access_token)
    localStorage.setItem(EXPIRES_AT_KEY, expiresAt.toString())
    this.clearLegacyStorage()
    return expiresAt
  }

  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  }

  static getExpiresAt(): number | null {
    if (typeof window === 'undefined') return null

    const rawValue = localStorage.getItem(EXPIRES_AT_KEY)
    if (!rawValue) return null

    const expiresAt = Number(rawValue)
    return Number.isFinite(expiresAt) ? expiresAt : null
  }

  static isTokenExpired(): boolean {
    const expiresAt = this.getExpiresAt()
    if (!expiresAt) return true

    // 提前 1 分钟触发刷新，避免边界时间请求失败。
    return Date.now() + 60_000 > expiresAt
  }

  static clearAccessToken(): void {
    if (typeof window === 'undefined') return

    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(EXPIRES_AT_KEY)
    this.clearLegacyStorage()
  }
}

export const TOKEN_KEYS = {
  ACCESS_TOKEN: ACCESS_TOKEN_KEY,
  EXPIRES_AT: EXPIRES_AT_KEY,
}
