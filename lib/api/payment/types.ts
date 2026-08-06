/**
 * Payment API Types
 * 所有类型定义来自后端 API 文档 (docs/api/PAYMENT_API.md)
 */

// ==================== Common Types ====================

/**
 * 支付提供商类型
 */
export type PaymentProvider = 'paypal' | 'oxapay' | 'stripe' | 'creem'

/**
 * 订单状态
 */
export type OrderStatus =
  | 'creating'
  | 'create_failed'
  | 'pending'
  | 'paid'
  | 'completed'
  | 'review_required'
  | 'refund_pending'
  | 'partially_refunded'
  | 'refunded'
  | 'dispute_pending'
  | 'disputed'
  | 'failed'

// ==================== Request Types ====================

/**
 * 创建订单请求
 */
export interface CreateOrderRequest {
  credits: number // 购买积分数（100 积分 = 1 USD）
  provider: PaymentProvider // 支付提供商
  return_url: string // 支付成功后返回的 URL
  cancel_url: string // 支付取消后返回的 URL
  request_id: string // 一次支付意图的前端幂等键；自动重试必须复用
  metadata?: Record<string, any>
}

// ==================== Response Types ====================

/**
 * 标准订单 DTO
 */
export interface PaymentOrder {
  order_no: string // 订单号
  status: OrderStatus // 订单状态
  provider_status?: string // 支付提供商状态
  amount: number // 支付金额
  currency: 'USD' // 币种
  credits: number // 订单积分数
  provider: PaymentProvider // 支付提供商
  approval_url?: string // 支付页面 URL
  credits_added?: number // 实际充值成功的积分数（完成后才有值）
  created_at: string // 创建时间
  paid_at?: string // 支付成功时间
  completed_at?: string // 订单完成时间
}

/**
 * 创建订单响应
 */
export type CreateOrderResponse = PaymentOrder

/**
 * 订单详情
 */
export type OrderDetail = PaymentOrder

/**
 * 订单状态查询响应
 */
export type OrderStatusResponse = Omit<OrderDetail, 'approval_url'>

/**
 * 订单列表响应
 */
export interface OrderListResponse {
  orders: OrderDetail[]
  total: number // 总订单数
  page: number // 当前页码
  page_size: number // 每页数量
}

/**
 * 错误响应
 */
export interface ErrorResponse {
  error: string
  code?: string
  status?: number
  reason?: string
  error_description?: string
}
