'use client'

const OAUTH_STATE_STORAGE_PREFIX = 'oauth_state:'
const OAUTH_STATE_PROCESSING_PREFIX = 'oauth_state_processing:'
const LEGACY_OAUTH_STATE_KEY = 'oauth_state'
const LEGACY_OAUTH_REDIRECT_KEY = 'oauth_redirect'

export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000
const OAUTH_CALLBACK_PROCESSING_TTL_MS = 2 * 60 * 1000

type OAuthStateRecord = {
  redirect: string
  createdAt: number
}

export type OAuthStateValidation =
  | { ok: true; redirect: string }
  | { ok: false; reason: 'missing' | 'expired' | 'invalid' }

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.sessionStorage
}

function parseRecord(raw: string | null): OAuthStateRecord | null {
  if (!raw) {
    return null
  }

  try {
    const record = JSON.parse(raw) as Partial<OAuthStateRecord>
    if (typeof record.redirect !== 'string' || typeof record.createdAt !== 'number') {
      return null
    }
    return record as OAuthStateRecord
  } catch {
    return null
  }
}

function stateKey(state: string): string {
  return `${OAUTH_STATE_STORAGE_PREFIX}${state}`
}

function processingKey(state: string): string {
  return `${OAUTH_STATE_PROCESSING_PREFIX}${state}`
}

export function pruneExpiredOAuthStates(now = Date.now()): void {
  const storage = getSessionStorage()
  if (!storage) {
    return
  }

  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index)
    if (!key || !key.startsWith(OAUTH_STATE_STORAGE_PREFIX)) {
      continue
    }

    const record = parseRecord(storage.getItem(key))
    if (!record || now - record.createdAt > OAUTH_STATE_TTL_MS) {
      storage.removeItem(key)
    }
  }
}

export function saveOAuthState(state: string, redirect: string, now = Date.now()): void {
  const storage = getSessionStorage()
  if (!storage) {
    return
  }

  pruneExpiredOAuthStates(now)

  const record: OAuthStateRecord = {
    redirect,
    createdAt: now,
  }

  storage.setItem(stateKey(state), JSON.stringify(record))

  // Keep the legacy keys briefly for older callback pages during rolling deploys.
  storage.setItem(LEGACY_OAUTH_STATE_KEY, state)
  storage.setItem(LEGACY_OAUTH_REDIRECT_KEY, redirect)
}

export function validateOAuthState(state: string, now = Date.now()): OAuthStateValidation {
  const storage = getSessionStorage()
  if (!storage) {
    return { ok: false, reason: 'missing' }
  }

  const record = parseRecord(storage.getItem(stateKey(state)))
  if (record) {
    if (now - record.createdAt > OAUTH_STATE_TTL_MS) {
      clearOAuthState(state)
      return { ok: false, reason: 'expired' }
    }

    return { ok: true, redirect: record.redirect || '/articles' }
  }

  const legacyState = storage.getItem(LEGACY_OAUTH_STATE_KEY)
  if (legacyState === state) {
    return {
      ok: true,
      redirect: storage.getItem(LEGACY_OAUTH_REDIRECT_KEY) || '/articles',
    }
  }

  return { ok: false, reason: 'missing' }
}

export function beginOAuthCallbackProcessing(state: string, now = Date.now()): boolean {
  const storage = getSessionStorage()
  if (!storage) {
    return true
  }

  const key = processingKey(state)
  const startedAt = Number(storage.getItem(key))
  if (Number.isFinite(startedAt) && now - startedAt < OAUTH_CALLBACK_PROCESSING_TTL_MS) {
    return false
  }

  storage.setItem(key, String(now))
  return true
}

export function clearOAuthCallbackProcessing(state: string): void {
  getSessionStorage()?.removeItem(processingKey(state))
}

export function clearOAuthState(state: string): void {
  const storage = getSessionStorage()
  if (!storage) {
    return
  }

  storage.removeItem(stateKey(state))
  storage.removeItem(processingKey(state))

  if (storage.getItem(LEGACY_OAUTH_STATE_KEY) === state) {
    storage.removeItem(LEGACY_OAUTH_STATE_KEY)
    storage.removeItem(LEGACY_OAUTH_REDIRECT_KEY)
  }
}
