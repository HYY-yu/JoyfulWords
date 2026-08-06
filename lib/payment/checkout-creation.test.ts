import test from 'node:test'
import assert from 'node:assert/strict'

import type { PaymentOrder } from '@/lib/api/payment/types'
import { getCheckoutCreationAction } from './checkout-creation'

function order(overrides: Partial<PaymentOrder>): PaymentOrder {
  return {
    order_no: 'ORD20260806TEST',
    status: 'creating',
    amount: 2,
    currency: 'USD',
    credits: 200,
    provider: 'oxapay',
    created_at: '2026-08-06T00:00:00Z',
    ...overrides,
  }
}

test('waits in the checkout surface while approval_url is unavailable', () => {
  assert.deepEqual(getCheckoutCreationAction(order({ status: 'creating' })), { kind: 'wait' })
  assert.deepEqual(getCheckoutCreationAction(order({ status: 'pending' })), { kind: 'wait' })
})

test('opens Provider only after approval_url is persisted', () => {
  assert.deepEqual(
    getCheckoutCreationAction(order({ status: 'pending', approval_url: 'https://pay.example.test' })),
    { kind: 'open_provider', approvalUrl: 'https://pay.example.test' }
  )
})

test('routes creation failure and early payment completion separately', () => {
  assert.deepEqual(getCheckoutCreationAction(order({ status: 'create_failed' })), {
    kind: 'show_create_failed',
  })
  assert.deepEqual(getCheckoutCreationAction(order({
    status: 'paid',
    approval_url: 'https://pay.example.test/already-paid',
  })), {
    kind: 'show_payment_result',
  })
  assert.deepEqual(getCheckoutCreationAction(order({ status: 'completed' })), {
    kind: 'show_payment_result',
  })
})
