import test from 'node:test'
import assert from 'node:assert/strict'

import {
  clearPendingPaymentCreateIntent,
  getOrCreatePaymentRequestID,
} from './create-intent'

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

test('reuses request_id for the same unresolved payment intent', () => {
  Object.defineProperty(globalThis, 'window', { value: globalThis, configurable: true })
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
  })
  const input = {
    provider: 'creem' as const,
    credits: 500,
    returnUrl: 'https://example.test/payment/success',
    cancelUrl: 'https://example.test/payment/cancel',
  }

  const first = getOrCreatePaymentRequestID(input, false)
  const automaticRetry = getOrCreatePaymentRequestID(input, false)
  const manualRetry = getOrCreatePaymentRequestID(input, true)

  assert.equal(automaticRetry, first)
  assert.notEqual(manualRetry, first)
  clearPendingPaymentCreateIntent(manualRetry)
  assert.notEqual(getOrCreatePaymentRequestID(input, false), manualRetry)

  Reflect.deleteProperty(globalThis, 'localStorage')
  Reflect.deleteProperty(globalThis, 'window')
})
