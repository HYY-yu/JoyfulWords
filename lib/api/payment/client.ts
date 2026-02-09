import { apiRequest } from '@/lib/api/client'
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  OrderDetail,
  OrderStatusResponse,
  ErrorResponse,
} from './types'

/**
 * Payment API Client
 * 提供支付管理相关的所有 API 调用方法
 */
export const paymentClient = {
  /**
   * 创建支付订单
   * POST /payment/orders/create
   *
   * @param data - 创建订单请求参数
   * @returns Promise<CreateOrderResponse | ErrorResponse>
   */
  async createOrder(data: CreateOrderRequest): Promise<CreateOrderResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    return apiRequest<CreateOrderResponse>('/payment/orders/create', {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(data),
    })
  },

  /**
   * 查询订单详情
   * GET /payment/orders/:orderNo
   *
   * @param orderNo - 订单号
   * @returns Promise<OrderDetail | ErrorResponse>
   */
  async getOrderDetail(orderNo: string): Promise<OrderDetail | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    return apiRequest<OrderDetail>(`/payment/orders/${orderNo}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
  },

  /**
   * 查询订单状态（主动查询支付提供商）
   * GET /payment/orders/:orderNo/status
   *
   * @param orderNo - 订单号
   * @returns Promise<OrderStatusResponse | ErrorResponse>
   */
  async getOrderStatus(orderNo: string): Promise<OrderStatusResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    return apiRequest<OrderStatusResponse>(`/payment/orders/${orderNo}/status`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
  },
}
