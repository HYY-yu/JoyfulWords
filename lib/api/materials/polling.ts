import type { ErrorResponse } from '@/lib/api/types'
import { materialsClient } from './client'
import type {
  MaterialAcceptedResponse,
  MaterialRequest,
  MaterialRequestFailed,
} from './types'

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000
const POLL_DELAYS_MS = [1_000, 2_000, 3_000, 5_000] as const

export class MaterialRequestFailedError extends Error {
  readonly requestId: number
  readonly requestType: MaterialRequestFailed['request_type']
  readonly errorCode: string
  readonly errorMessageId: string

  constructor(request: MaterialRequestFailed) {
    super(request.error_message_id || 'material_request_failed')
    this.name = 'MaterialRequestFailedError'
    this.requestId = request.id
    this.requestType = request.request_type
    this.errorCode = request.error_code
    this.errorMessageId = request.error_message_id
  }
}

export class MaterialRequestPollingError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'MaterialRequestPollingError'
    this.status = status
  }
}

interface WaitForMaterialRequestOptions<TResult> {
  signal?: AbortSignal
  timeoutMs?: number
  onStatusChange?: (request: MaterialRequest<TResult>) => void
  fetchRequest?: (
    pollUrl: string,
    signal?: AbortSignal
  ) => Promise<MaterialRequest<TResult> | ErrorResponse>
  sleep?: (delayMs: number, signal?: AbortSignal) => Promise<void>
}

function createAbortError() {
  const error = new Error('Material request polling aborted')
  error.name = 'AbortError'
  return error
}

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw createAbortError()
}

function sleepWithAbort(delayMs: number, signal?: AbortSignal): Promise<void> {
  assertNotAborted(signal)

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort)
      resolve()
    }, delayMs)
    const handleAbort = () => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', handleAbort)
      reject(createAbortError())
    }
    signal?.addEventListener('abort', handleAbort, { once: true })
  })
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

export async function waitForMaterialRequest<TResult>(
  accepted: Pick<MaterialAcceptedResponse, 'id' | 'poll_url'>,
  options: WaitForMaterialRequestOptions<TResult> = {}
): Promise<TResult> {
  const startedAt = Date.now()
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const fetchRequest =
    options.fetchRequest ??
    ((pollUrl: string, signal?: AbortSignal) =>
      materialsClient.getRequest<TResult>(pollUrl, signal))
  const sleep = options.sleep ?? sleepWithAbort
  let attempt = 0

  while (Date.now() - startedAt <= timeoutMs) {
    assertNotAborted(options.signal)
    await sleep(POLL_DELAYS_MS[Math.min(attempt, POLL_DELAYS_MS.length - 1)], options.signal)
    assertNotAborted(options.signal)

    const response = await fetchRequest(accepted.poll_url, options.signal)
    if ('error' in response) {
      if (response.status === 401 || response.status === 404) {
        throw new MaterialRequestPollingError(response.error, response.status)
      }
      console.warn('[MaterialsWorker] Poll request failed; retrying', {
        requestId: accepted.id,
        status: response.status ?? null,
        reason: response.reason ?? null,
      })
      attempt += 1
      continue
    }

    if (response.id !== accepted.id) {
      console.warn('[MaterialsWorker] Ignoring mismatched poll response', {
        expectedRequestId: accepted.id,
        actualRequestId: response.id,
      })
      attempt += 1
      continue
    }

    options.onStatusChange?.(response)
    if (response.status === 'succeeded') return response.result
    if (response.status === 'failed') throw new MaterialRequestFailedError(response)
    attempt += 1
  }

  throw new MaterialRequestPollingError('Material request polling timed out')
}
