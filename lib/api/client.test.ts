import test from 'node:test'
import assert from 'node:assert/strict'

import { authenticatedApiRequest } from '@/lib/api/client'
import { getValidAccessToken } from '@/lib/tokens/refresh'
import { tokenStore } from '@/lib/tokens/token-store'

type FetchCall = {
  url: string
  init?: RequestInit
}

function installBrowserGlobals() {
  const storage = new Map<string, string>()
  const originalWindow = (globalThis as typeof globalThis & { window?: unknown }).window
  const originalLocalStorage = globalThis.localStorage
  const originalFetch = globalThis.fetch
  const windowStub = {
    location: {
      href: '',
    },
  }

  Object.defineProperty(globalThis, 'window', {
    value: windowStub,
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

  tokenStore.clear('test_setup')

  return {
    storage,
    windowStub,
    restore() {
      tokenStore.clear('test_cleanup')
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        configurable: true,
      })
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        configurable: true,
      })
      globalThis.fetch = originalFetch
    },
  }
}

function readFetchUrl(input: string | URL | Request): string {
  return input instanceof Request ? input.url : input.toString()
}

test('authenticated request restores missing access token before calling protected endpoint', async () => {
  const globals = installBrowserGlobals()
  const calls: FetchCall[] = []

  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = readFetchUrl(input)
    calls.push({ url, init })

    if (url.endsWith('/auth/token/refresh')) {
      return new Response(
        JSON.stringify({
          access_token: 'new-access-token',
          expires_in: 900,
          user: {
            id: 1,
            email: 'user@example.com',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (url.endsWith('/article?page=1&page_size=10')) {
      return new Response(JSON.stringify({ list: [], total: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'unexpected request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const result = await authenticatedApiRequest<{ list: unknown[]; total: number }>(
      '/article?page=1&page_size=10'
    )

    assert.deepEqual(result, { list: [], total: 0 })
    assert.equal(calls.length, 2)
    assert.equal(calls[0].url, 'http://localhost:8080/auth/token/refresh')
    assert.equal(calls[0].init?.credentials, 'include')
    assert.equal(calls[1].url, 'http://localhost:8080/article?page=1&page_size=10')
    assert.equal(calls[1].init?.credentials, 'include')
    assert.equal(new Headers(calls[1].init?.headers).get('Authorization'), 'Bearer new-access-token')
  } finally {
    globals.restore()
  }
})

test('authenticated request does not call protected endpoint when refresh fails', async () => {
  const globals = installBrowserGlobals()
  const calls: FetchCall[] = []

  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = readFetchUrl(input)
    calls.push({ url, init })

    return new Response(JSON.stringify({ error: 'missing refresh token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const result = await authenticatedApiRequest<{ error: string; status: number }>(
      '/article?page=1&page_size=10'
    )

    assert.deepEqual(result, { error: 'Session expired', status: 401 })
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, 'http://localhost:8080/auth/token/refresh')
    assert.equal(globals.windowStub.location.href, '/auth/login?reason=token_expired')
  } finally {
    globals.restore()
  }
})

test('authenticated request logs network refresh failures before API response', async () => {
  const globals = installBrowserGlobals()
  const calls: FetchCall[] = []
  const originalWarn = console.warn
  const warnings: unknown[][] = []

  console.warn = (...args: unknown[]) => {
    warnings.push(args)
  }

  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = readFetchUrl(input)
    calls.push({ url, init })
    throw new TypeError('Failed to fetch')
  }

  try {
    const result = await authenticatedApiRequest<{ error: string; status: number }>(
      '/article?page=1&page_size=10'
    )

    assert.deepEqual(result, { error: 'Session expired', status: 401 })
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, 'http://localhost:8080/auth/token/refresh')
    assert.equal(globals.windowStub.location.href, '/auth/login?reason=token_expired')
    assert.equal(typeof warnings[0]?.[0], 'string')
    assert.match(
      warnings[0][0] as string,
      /^\[Auth\] Token refresh request failed before API response /
    )
    assert.match(warnings[0][0] as string, /reason="network_error"/)
    assert.equal(warnings[0].length, 1)
  } finally {
    console.warn = originalWarn
    globals.restore()
  }
})

test('getValidAccessToken restores missing access token from refresh cookie', async () => {
  const globals = installBrowserGlobals()
  const calls: FetchCall[] = []

  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = readFetchUrl(input)
    calls.push({ url, init })

    return new Response(
      JSON.stringify({
        access_token: 'payment-access-token',
        expires_in: 900,
        user: {
          id: 1,
          email: 'user@example.com',
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    const token = await getValidAccessToken()

    assert.equal(token, 'payment-access-token')
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, 'http://localhost:8080/auth/token/refresh')
    assert.equal(calls[0].init?.credentials, 'include')
  } finally {
    globals.restore()
  }
})
