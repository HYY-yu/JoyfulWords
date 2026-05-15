import test from 'node:test'
import assert from 'node:assert/strict'

import { waitForProxySessionBeforeRedirect } from '@/lib/auth/post-login-redirect'

function installBrowserGlobals() {
  const originalWindow = (globalThis as typeof globalThis & { window?: unknown }).window
  const originalFetch = globalThis.fetch

  Object.defineProperty(globalThis, 'window', {
    value: {
      location: {
        origin: 'http://localhost:3000',
      },
      setTimeout,
    },
    configurable: true,
  })

  return {
    restore() {
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        configurable: true,
      })
      globalThis.fetch = originalFetch
    },
  }
}

test('does not probe public redirects', async () => {
  const globals = installBrowserGlobals()
  let fetchCalled = false

  globalThis.fetch = async () => {
    fetchCalled = true
    return { url: 'http://localhost:3000/tools' } as Response
  }

  try {
    const ready = await waitForProxySessionBeforeRedirect('/tools', [0])

    assert.equal(ready, true)
    assert.equal(fetchCalled, false)
  } finally {
    globals.restore()
  }
})

test('waits until a protected redirect is no longer bounced to login by proxy', async () => {
  const globals = installBrowserGlobals()
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = []

  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ input, init })

    if (calls.length === 1) {
      return { url: 'http://localhost:3000/auth/login?redirect=%2Farticles' } as Response
    }

    return { url: 'http://localhost:3000/articles' } as Response
  }

  try {
    const ready = await waitForProxySessionBeforeRedirect('/articles', [0, 0])

    assert.equal(ready, true)
    assert.equal(calls.length, 2)
    assert.equal(calls[0].input, '/articles')
    assert.equal(calls[0].init?.method, 'HEAD')
    assert.equal(calls[0].init?.credentials, 'include')
    assert.equal(calls[0].init?.cache, 'no-store')
  } finally {
    globals.restore()
  }
})

test('returns false when proxy keeps redirecting protected route to login', async () => {
  const globals = installBrowserGlobals()

  globalThis.fetch = async () => {
    return { url: 'http://localhost:3000/auth/login?redirect=%2Farticles' } as Response
  }

  try {
    const ready = await waitForProxySessionBeforeRedirect('/articles', [0, 0])

    assert.equal(ready, false)
  } finally {
    globals.restore()
  }
})
