import test from 'node:test'
import assert from 'node:assert/strict'

import { TokenManager } from '@/lib/tokens/token-manager'
import type { AccessTokenSession } from '@/lib/api/types'

test('token manager only clears legacy storage and does not touch cookies', () => {
  const originalWindow = (globalThis as typeof globalThis & { window?: unknown }).window
  const originalDocument = globalThis.document
  const originalLocalStorage = globalThis.localStorage

  let cookieWrites = 0
  const storage = new Map<string, string>()

  Object.defineProperty(globalThis, 'window', {
    value: {},
    configurable: true,
  })

  Object.defineProperty(globalThis, 'document', {
    value: {
      get cookie() {
        return ''
      },
      set cookie(_value: string) {
        cookieWrites += 1
      },
    },
    configurable: true,
  })

  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem(key: string) {
        return storage.has(key) ? storage.get(key)! : null
      },
      setItem(key: string, value: string) {
        storage.set(key, value)
      },
      removeItem(key: string) {
        storage.delete(key)
      },
    },
    configurable: true,
  })

  try {
    const session: AccessTokenSession = {
      access_token: 'access-token',
      expires_in: 900,
    }

    TokenManager.setAccessToken(session)
    assert.equal(storage.get('access_token'), 'access-token')
    assert.equal(storage.has('refresh_token'), false)
    assert.equal(cookieWrites, 0)

    TokenManager.clearAccessToken()
    assert.equal(storage.has('access_token'), false)
    assert.equal(storage.has('expires_at'), false)
    assert.equal(cookieWrites, 0)
  } finally {
    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      configurable: true,
    })
    Object.defineProperty(globalThis, 'document', {
      value: originalDocument,
      configurable: true,
    })
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLocalStorage,
      configurable: true,
    })
  }
})
