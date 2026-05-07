import test from 'node:test'
import assert from 'node:assert/strict'

import { getEnabledPaymentProviders, isPaymentProviderEnabled } from './payment-providers'

const ENV_KEY = 'NEXT_PUBLIC_ENABLED_PAYMENT_PROVIDERS'

test('enables all payment providers by default, including creem', () => {
  const previous = process.env[ENV_KEY]
  delete process.env[ENV_KEY]

  try {
    assert.deepEqual(getEnabledPaymentProviders(), ['paypal', 'oxapay', 'stripe', 'creem'])
    assert.equal(isPaymentProviderEnabled('creem'), true)
  } finally {
    if (previous === undefined) {
      delete process.env[ENV_KEY]
    } else {
      process.env[ENV_KEY] = previous
    }
  }
})

test('parses enabled payment providers from env and ignores unknown values', () => {
  const previous = process.env[ENV_KEY]
  process.env[ENV_KEY] = ' creem, paypal, unknown '

  try {
    assert.deepEqual(getEnabledPaymentProviders(), ['paypal', 'creem'])
    assert.equal(isPaymentProviderEnabled('creem'), true)
    assert.equal(isPaymentProviderEnabled('stripe'), false)
  } finally {
    if (previous === undefined) {
      delete process.env[ENV_KEY]
    } else {
      process.env[ENV_KEY] = previous
    }
  }
})
