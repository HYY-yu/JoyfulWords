import test from 'node:test'
import assert from 'node:assert/strict'

import { normalizeConsoleArgs } from '@/lib/otel/console-normalizer'

test('normalizes object context into a single readable log line', () => {
  const args = normalizeConsoleArgs([
    '[Auth] Session restore failed',
    {
      pathname: '/articles',
      refreshFailureStatus: 401,
      refreshFailureReason: 'refresh_session_missing',
    },
  ])

  assert.equal(args.length, 1)
  assert.match(String(args[0]), /^\[Auth\] Session restore failed /)
  assert.match(String(args[0]), /pathname="\/articles"/)
  assert.match(String(args[0]), /refreshFailureStatus=401/)
  assert.match(String(args[0]), /refreshFailureReason="refresh_session_missing"/)
})

test('normalizes Error arguments without collapsing to object Object', () => {
  const args = normalizeConsoleArgs([
    '[Faro] Failed to initialize browser telemetry:',
    new Error('network timeout'),
  ])

  assert.equal(args.length, 1)
  assert.match(String(args[0]), /\[Faro\] Failed to initialize browser telemetry:/)
  assert.match(String(args[0]), /name="Error"/)
  assert.match(String(args[0]), /message="network timeout"/)
  assert.doesNotMatch(String(args[0]), /\[object Object\]/)
})

test('handles circular context safely', () => {
  const context: Record<string, unknown> = { requestId: 'abc' }
  context.self = context

  const args = normalizeConsoleArgs(['[API] Request failed', context])

  assert.equal(args.length, 1)
  assert.match(String(args[0]), /requestId="abc"/)
  assert.match(String(args[0]), /self=\{"requestId":"abc","self":"\[Circular\]"\}/)
})

test('preserves native console formatter calls', () => {
  const args = ['response time %dms', 120]

  assert.deepEqual(normalizeConsoleArgs(args), args)
})
