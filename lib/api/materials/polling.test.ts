import assert from 'node:assert/strict'
import test from 'node:test'

import {
  MaterialRequestFailedError,
  MaterialRequestPollingError,
  waitForMaterialRequest,
} from './polling'
import type { MaterialRequest } from './types'

const accepted = {
  id: 42,
  poll_url: '/materials/requests/42',
}

test('polls pending and processing states until the request succeeds', async () => {
  const responses: MaterialRequest<{ ids: number[] }>[] = [
    { id: 42, request_type: 'ai_import', status: 'pending' },
    { id: 42, request_type: 'ai_import', status: 'processing' },
    {
      id: 42,
      request_type: 'ai_import',
      status: 'succeeded',
      result: { ids: [7, 8] },
    },
  ]
  const delays: number[] = []
  const statuses: string[] = []

  const result = await waitForMaterialRequest(accepted, {
    fetchRequest: async () => responses.shift()!,
    sleep: async (delayMs) => {
      delays.push(delayMs)
    },
    onStatusChange: (request) => {
      statuses.push(request.status)
    },
  })

  assert.deepEqual(result, { ids: [7, 8] })
  assert.deepEqual(delays, [1_000, 2_000, 3_000])
  assert.deepEqual(statuses, ['pending', 'processing', 'succeeded'])
})

test('retries a temporary network error without losing the request', async () => {
  const responses = [
    { error: 'temporary network error', reason: 'network_error' },
    {
      id: 42,
      request_type: 'parse_preview',
      status: 'succeeded',
      result: { content: 'parsed' },
    },
  ] as const
  let index = 0

  const result = await waitForMaterialRequest(accepted, {
    fetchRequest: async () => responses[index++],
    sleep: async () => undefined,
  })

  assert.deepEqual(result, { content: 'parsed' })
  assert.equal(index, 2)
})

test('surfaces Worker failure metadata for localized UI handling', async () => {
  await assert.rejects(
    waitForMaterialRequest(accepted, {
      fetchRequest: async () => ({
        id: 42,
        request_type: 'material_parse',
        status: 'failed',
        error_code: 'material_parse_provider_failed',
        error_message_id: 'material_parse_failed',
      }),
      sleep: async () => undefined,
    }),
    (error: unknown) => {
      assert.ok(error instanceof MaterialRequestFailedError)
      assert.equal(error.errorCode, 'material_parse_provider_failed')
      assert.equal(error.errorMessageId, 'material_parse_failed')
      return true
    }
  )
})

test('stops polling on 404 responses', async () => {
  let attempts = 0

  await assert.rejects(
    waitForMaterialRequest(accepted, {
      fetchRequest: async () => {
        attempts += 1
        return { error: 'not found', status: 404 }
      },
      sleep: async () => undefined,
    }),
    (error: unknown) => {
      assert.ok(error instanceof MaterialRequestPollingError)
      assert.equal(error.status, 404)
      return true
    }
  )
  assert.equal(attempts, 1)
})

test('does not poll after cancellation', async () => {
  const controller = new AbortController()
  controller.abort()

  await assert.rejects(
    waitForMaterialRequest(accepted, {
      signal: controller.signal,
      fetchRequest: async () => {
        throw new Error('fetch should not run')
      },
      sleep: async () => undefined,
    }),
    (error: unknown) => error instanceof Error && error.name === 'AbortError'
  )
})
