import test from 'node:test'
import assert from 'node:assert/strict'

import { getPaymentReturnStatus } from './order-status'

test('treats creating as processing on the payment return page', () => {
  assert.equal(getPaymentReturnStatus('creating'), 'processing')
})

test('treats completed as the only normal credited success status', () => {
  assert.equal(getPaymentReturnStatus('completed'), 'success')

  for (const status of ['creating', 'pending', 'paid'] as const) {
    assert.notEqual(getPaymentReturnStatus(status), 'success')
  }
})

test('treats failure, refund, and dispute states as non-success', () => {
  const nonSuccessStatuses = [
    'create_failed',
    'review_required',
    'refund_pending',
    'partially_refunded',
    'refunded',
    'dispute_pending',
    'disputed',
    'failed',
  ] as const

  for (const status of nonSuccessStatuses) {
    assert.equal(getPaymentReturnStatus(status), 'failed')
  }
})
