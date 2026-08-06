import type { PaymentProvider } from '@/lib/api/payment/types'

const PENDING_PAYMENT_INTENT_KEY = 'joyfulwords-pending-payment-create-intent'

export interface PaymentCreateIntentInput {
  provider: PaymentProvider
  credits: number
  returnUrl: string
  cancelUrl: string
}

interface StoredPaymentCreateIntent extends PaymentCreateIntentInput {
  requestId: string
}

function matchesIntent(
  stored: StoredPaymentCreateIntent,
  input: PaymentCreateIntentInput
): boolean {
  return (
    stored.provider === input.provider &&
    stored.credits === input.credits &&
    stored.returnUrl === input.returnUrl &&
    stored.cancelUrl === input.cancelUrl
  )
}

function readStoredIntent(): StoredPaymentCreateIntent | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem(PENDING_PAYMENT_INTENT_KEY)
    if (!raw) return null

    const value = JSON.parse(raw) as Partial<StoredPaymentCreateIntent>
    if (
      typeof value.requestId !== 'string' ||
      typeof value.provider !== 'string' ||
      typeof value.credits !== 'number' ||
      typeof value.returnUrl !== 'string' ||
      typeof value.cancelUrl !== 'string'
    ) {
      localStorage.removeItem(PENDING_PAYMENT_INTENT_KEY)
      return null
    }
    return value as StoredPaymentCreateIntent
  } catch (error) {
    console.warn('[PaymentCreateIntent] 读取待处理支付请求失败', error)
    return null
  }
}

export function getOrCreatePaymentRequestID(
  input: PaymentCreateIntentInput,
  forceNew: boolean
): string {
  if (!forceNew) {
    const stored = readStoredIntent()
    if (stored && matchesIntent(stored, input)) {
      console.debug('[PaymentCreateIntent] 复用支付 request_id', {
        requestId: stored.requestId,
      })
      return stored.requestId
    }
  }

  const requestId = crypto.randomUUID()
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        PENDING_PAYMENT_INTENT_KEY,
        JSON.stringify({ ...input, requestId } satisfies StoredPaymentCreateIntent)
      )
    } catch (error) {
      console.warn('[PaymentCreateIntent] 保存支付 request_id 失败', error)
    }
  }
  return requestId
}

export function clearPendingPaymentCreateIntent(requestId?: string): void {
  if (typeof window === 'undefined') return

  try {
    if (requestId) {
      const stored = readStoredIntent()
      if (stored && stored.requestId !== requestId) return
    }
    localStorage.removeItem(PENDING_PAYMENT_INTENT_KEY)
  } catch (error) {
    console.warn('[PaymentCreateIntent] 清除支付 request_id 失败', error)
  }
}
