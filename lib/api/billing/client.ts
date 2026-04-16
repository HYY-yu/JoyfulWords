import { authenticatedApiRequest } from '@/lib/api/client'
import type {
  BalanceResponse,
  TransactionListResponse,
  GetTransactionsRequest,
  InvoiceListResponse,
  InvoiceDetail,
  GetInvoicesRequest,
  ErrorResponse,
} from './types'

/**
 * Billing API Client
 * 提供计费管理相关的所有 API 调用方法
 */
export const billingClient = {
  /**
   * 1. 查询余额
   * GET /billing/balance
   *
   * @returns Promise<BalanceResponse | ErrorResponse>
   */
  async getBalance(): Promise<BalanceResponse | ErrorResponse> {
    return authenticatedApiRequest<BalanceResponse>('/billing/balance')
  },

  /**
   * 2. 刷新余额
   * POST /billing/balance/refresh
   *
   * @returns Promise<BalanceResponse | ErrorResponse>
   */
  async refreshBalance(): Promise<BalanceResponse | ErrorResponse> {
    return authenticatedApiRequest<BalanceResponse>('/billing/balance/refresh', {
      method: 'POST',
    })
  },

  /**
   * 3. 查询充值记录
   * GET /billing/recharges
   *
   * @param params - 查询参数（分页、状态、时间范围）
   * @returns Promise<TransactionListResponse | ErrorResponse>
   */
  async getRecharges(
    params?: GetTransactionsRequest
  ): Promise<TransactionListResponse | ErrorResponse> {
    // 构建 URL 查询参数
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', String(params.page))
    if (params?.page_size) searchParams.append('page_size', String(params.page_size))
    if (params?.status) searchParams.append('status', params.status)
    if (params?.started_at) searchParams.append('started_at', params.started_at)
    if (params?.ended_at) searchParams.append('ended_at', params.ended_at)

    const queryString = searchParams.toString()
    const url = queryString ? `/billing/recharges?${queryString}` : '/billing/recharges'

    return authenticatedApiRequest<TransactionListResponse>(url)
  },

  /**
   * 4. 查询使用记录
   * GET /billing/usage
   *
   * @param params - 查询参数（分页、状态、时间范围）
   * @returns Promise<TransactionListResponse | ErrorResponse>
   */
  async getUsage(
    params?: GetTransactionsRequest
  ): Promise<TransactionListResponse | ErrorResponse> {
    // 构建 URL 查询参数
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', String(params.page))
    if (params?.page_size) searchParams.append('page_size', String(params.page_size))
    if (params?.status) searchParams.append('status', params.status)
    if (params?.started_at) searchParams.append('started_at', params.started_at)
    if (params?.ended_at) searchParams.append('ended_at', params.ended_at)

    const queryString = searchParams.toString()
    const url = queryString ? `/billing/usage?${queryString}` : '/billing/usage'

    return authenticatedApiRequest<TransactionListResponse>(url)
  },

  /**
   * 5. 查询发票列表
   * GET /billing/usage_v2
   */
  async getInvoices(
    params?: GetInvoicesRequest
  ): Promise<InvoiceListResponse | ErrorResponse> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', String(params.page))
    if (params?.page_size) searchParams.append('page_size', String(params.page_size))
    if (params?.status) searchParams.append('status', params.status)
    if (params?.issuing_date_start) searchParams.append('issuing_date_start', params.issuing_date_start)
    if (params?.issuing_date_end) searchParams.append('issuing_date_end', params.issuing_date_end)

    const queryString = searchParams.toString()
    const url = queryString ? `/billing/usage_v2?${queryString}` : '/billing/usage_v2'

    return authenticatedApiRequest<InvoiceListResponse>(url)
  },

  /**
   * 6. 查询发票详情
   * GET /billing/usage/:lago_id
   */
  async getInvoiceDetail(
    lagoId: string
  ): Promise<InvoiceDetail | ErrorResponse> {
    return authenticatedApiRequest<InvoiceDetail>(`/billing/usage/${lagoId}`)
  },
}
