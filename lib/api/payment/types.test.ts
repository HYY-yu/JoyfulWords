import test from 'node:test'
import assert from 'node:assert/strict'

import type { CreateOrderResponse } from './types'

const orderBase = {
  order_no: 'order-123',
  amount: 10,
  currency: 'USD',
  credits: 1000,
  provider: 'creem',
  created_at: '2026-07-28T00:00:00Z',
} as const

test('CreateOrderResponse accepts paid without an approval URL', () => {
  const response: CreateOrderResponse = {
    ...orderBase,
    status: 'paid',
  }

  assert.equal(response.status, 'paid')
  assert.equal(response.approval_url, undefined)
})

test('CreateOrderResponse accepts completed', () => {
  const response: CreateOrderResponse = {
    ...orderBase,
    status: 'completed',
    credits_added: 1000,
    completed_at: '2026-07-28T00:01:00Z',
  }

  assert.equal(response.status, 'completed')
  assert.equal(response.credits_added, 1000)
})
