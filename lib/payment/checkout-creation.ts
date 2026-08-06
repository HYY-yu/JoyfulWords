import type { PaymentOrder } from '@/lib/api/payment/types'

export type CheckoutCreationAction =
  | { kind: 'wait' }
  | { kind: 'open_provider'; approvalUrl: string }
  | { kind: 'show_create_failed' }
  | { kind: 'show_payment_result' }

export function getCheckoutCreationAction(order: PaymentOrder): CheckoutCreationAction {
  if (order.status === 'create_failed') {
    return { kind: 'show_create_failed' }
  }
  if (order.status === 'creating' || order.status === 'pending') {
    if (order.approval_url) {
      return { kind: 'open_provider', approvalUrl: order.approval_url }
    }
    return { kind: 'wait' }
  }
  return { kind: 'show_payment_result' }
}
