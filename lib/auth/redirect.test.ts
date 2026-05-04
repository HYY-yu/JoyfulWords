import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_AUTH_REDIRECT, normalizeAuthRedirect } from '@/lib/auth/redirect'

test('normalizes missing auth redirects to the default app route', () => {
  assert.equal(normalizeAuthRedirect(null), DEFAULT_AUTH_REDIRECT)
  assert.equal(normalizeAuthRedirect(''), DEFAULT_AUTH_REDIRECT)
})

test('keeps local auth redirects with query strings', () => {
  assert.equal(
    normalizeAuthRedirect('/agent-oauth?user_code=ABCD-EFGH'),
    '/agent-oauth?user_code=ABCD-EFGH'
  )
  assert.equal(
    normalizeAuthRedirect(
      '/oauth/authorize?response_type=code&client_id=joyfulwords-mcp-server&redirect_uri=http%3A%2F%2F127.0.0.1%3A39123%2Fcallback'
    ),
    '/oauth/authorize?response_type=code&client_id=joyfulwords-mcp-server&redirect_uri=http%3A%2F%2F127.0.0.1%3A39123%2Fcallback'
  )
})

test('rejects external auth redirects', () => {
  assert.equal(normalizeAuthRedirect('https://example.com/phish'), DEFAULT_AUTH_REDIRECT)
  assert.equal(normalizeAuthRedirect('//example.com/phish'), DEFAULT_AUTH_REDIRECT)
})
