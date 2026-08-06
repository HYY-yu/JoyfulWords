import type { PaymentProvider } from '@/lib/api/payment/types'

const PENDING_PAYMENT_INTENT_KEY = 'joyfulwords-pending-payment-create-intent'

export interface PaymentCreateIntentInput {
  provider: PaymentProvider
  credits: number
  returnUrl: string
  cancelUrl: string
}

export interface StoredPaymentCreateIntent extends PaymentCreateIntentInput {
  requestId: string
  orderNo?: string
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

export function getPendingPaymentCreateIntent(): StoredPaymentCreateIntent | null {
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
      typeof value.cancelUrl !== 'string' ||
      (value.orderNo !== undefined && typeof value.orderNo !== 'string')
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
    const stored = getPendingPaymentCreateIntent()
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

export function savePendingPaymentOrder(requestId: string, orderNo: string): void {
  if (typeof window === 'undefined') return

  try {
    const stored = getPendingPaymentCreateIntent()
    if (!stored || stored.requestId !== requestId) return
    localStorage.setItem(
      PENDING_PAYMENT_INTENT_KEY,
      JSON.stringify({ ...stored, orderNo } satisfies StoredPaymentCreateIntent)
    )
  } catch (error) {
    console.warn('[PaymentCreateIntent] 保存待处理订单号失败', error)
  }
}

export function clearPendingPaymentCreateIntent(requestId?: string): void {
  if (typeof window === 'undefined') return

  try {
    if (requestId) {
      const stored = getPendingPaymentCreateIntent()
      if (stored && stored.requestId !== requestId) return
    }
    localStorage.removeItem(PENDING_PAYMENT_INTENT_KEY)
  } catch (error) {
    console.warn('[PaymentCreateIntent] 清除支付 request_id 失败', error)
  }
}
