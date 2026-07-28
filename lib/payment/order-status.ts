import type { OrderStatus } from '@/lib/api/payment/types'

export type PaymentReturnStatus = 'processing' | 'success' | 'failed'

/**
 * 将后端订单状态映射为支付回调页状态。
 */
export function getPaymentReturnStatus(status: OrderStatus): PaymentReturnStatus {
  switch (status) {
    case 'creating':
    case 'pending':
    case 'paid':
      return 'processing'
    case 'completed':
      return 'success'
    case 'create_failed':
    case 'review_required':
    case 'refund_pending':
    case 'partially_refunded':
    case 'refunded':
    case 'dispute_pending':
    case 'disputed':
    case 'failed':
      return 'failed'
  }
}
