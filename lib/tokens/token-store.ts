import type { AccessTokenSession } from '@/lib/api/types'
import { TokenManager } from './token-manager'

export type TokenEventType =
  | 'token:updated'
  | 'token:cleared'
  | 'token:refresh-started'
  | 'token:refresh-failed'

export interface TokenStoreEvent {
  type: TokenEventType
  source: string
  hasAccessToken: boolean
  expiresAt: number | null
}

interface TokenSnapshot {
  accessToken: string | null
  expiresAt: number | null
  isRefreshing: boolean
}

type TokenListener = (event: TokenStoreEvent) => void

const listeners = new Set<TokenListener>()

let hydrated = false
let snapshot: TokenSnapshot = {
  accessToken: null,
  expiresAt: null,
  isRefreshing: false,
}

function ensureHydrated() {
  if (hydrated || typeof window === 'undefined') return

  snapshot = {
    accessToken: TokenManager.getAccessToken(),
    expiresAt: TokenManager.getExpiresAt(),
    isRefreshing: false,
  }
  hydrated = true
}

function emit(type: TokenEventType, source: string) {
  const event: TokenStoreEvent = {
    type,
    source,
    hasAccessToken: Boolean(snapshot.accessToken),
    expiresAt: snapshot.expiresAt,
  }

  listeners.forEach((listener) => {
    try {
      listener(event)
    } catch (error) {
      console.error('[TokenStore] Listener failed', {
        type,
        source,
        error,
      })
    }
  })
}

export const tokenStore = {
  subscribe(listener: TokenListener) {
    ensureHydrated()
    listeners.add(listener)

    return () => {
      listeners.delete(listener)
    }
  },

  getAccessToken(): string | null {
    ensureHydrated()
    return snapshot.accessToken
  },

  getExpiresAt(): number | null {
    ensureHydrated()
    return snapshot.expiresAt
  },

  isRefreshing(): boolean {
    ensureHydrated()
    return snapshot.isRefreshing
  },

  isTokenExpired(): boolean {
    ensureHydrated()

    if (!snapshot.expiresAt) return true
    return Date.now() + 60_000 > snapshot.expiresAt
  },

  setAccessToken(session: AccessTokenSession, source = 'unknown'): void {
    ensureHydrated()

    snapshot = {
      accessToken: session.access_token,
      expiresAt: TokenManager.setAccessToken(session),
      isRefreshing: false,
    }

    emit('token:updated', source)
  },

  markRefreshStarted(source = 'unknown'): void {
    ensureHydrated()
    snapshot = {
      ...snapshot,
      isRefreshing: true,
    }
    emit('token:refresh-started', source)
  },

  markRefreshFailed(source = 'unknown'): void {
    ensureHydrated()
    snapshot = {
      ...snapshot,
      isRefreshing: false,
    }
    emit('token:refresh-failed', source)
  },

  clear(source = 'unknown'): void {
    ensureHydrated()

    snapshot = {
      accessToken: null,
      expiresAt: null,
      isRefreshing: false,
    }
    TokenManager.clearAccessToken()

    emit('token:cleared', source)
  },
}
