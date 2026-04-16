import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isPublicRoute,
  shouldAttemptAuthRefresh,
  shouldAttemptSessionRestore,
} from '@/lib/auth/session-policy'

test('protected routes require bootstrap restore when local auth state is missing', () => {
  assert.equal(
    shouldAttemptSessionRestore({
      pathname: '/articles',
      hasStoredUser: false,
      hasAccessToken: false,
    }),
    true
  )
})

test('public auth routes skip bootstrap restore when there is no local auth state', () => {
  assert.equal(
    shouldAttemptSessionRestore({
      pathname: '/auth/login',
      hasStoredUser: false,
      hasAccessToken: false,
    }),
    false
  )
})

test('partial local auth state still triggers bootstrap restore', () => {
  assert.equal(
    shouldAttemptSessionRestore({
      pathname: '/auth/login',
      hasStoredUser: true,
      hasAccessToken: false,
    }),
    true
  )
})

test('401 refresh only runs for authenticated requests', () => {
  assert.equal(
    shouldAttemptAuthRefresh({
      endpoint: '/auth/login',
      hasAuthorizationHeader: false,
      skipAuthRefresh: false,
    }),
    false
  )

  assert.equal(
    shouldAttemptAuthRefresh({
      endpoint: '/articles/list',
      hasAuthorizationHeader: true,
      skipAuthRefresh: false,
    }),
    true
  )
})

test('explicit skip flag disables 401 refresh', () => {
  assert.equal(
    shouldAttemptAuthRefresh({
      endpoint: '/auth/token/refresh',
      hasAuthorizationHeader: true,
      skipAuthRefresh: true,
    }),
    false
  )
})

test('public route matcher stays aligned with auth and legal pages', () => {
  assert.equal(isPublicRoute('/auth/signup'), true)
  assert.equal(isPublicRoute('/privacy-policy'), true)
  assert.equal(isPublicRoute('/articles'), false)
})
