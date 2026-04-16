import test from 'node:test'
import assert from 'node:assert/strict'
import { isSignupEmailAlreadyRegisteredError } from '@/lib/auth/auth-error-resolver'

test('recognizes signup 409 conflict as already-registered email', () => {
  assert.equal(
    isSignupEmailAlreadyRegisteredError({ error: '该邮箱已注册', status: 409 }),
    true
  )
})

test('keeps non-conflict signup errors out of the registered-email flow', () => {
  assert.equal(
    isSignupEmailAlreadyRegisteredError({ error: '请求过于频繁', status: 429 }),
    false
  )
})
