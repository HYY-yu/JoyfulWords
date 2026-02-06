/**
 * Billing API Types
 * 所有类型定义来自后端 API 文档 (docs/api/BILLING_API.md)
 */

// ==================== Request Types ====================

/**
 * 查询交易记录请求参数
 */
export interface GetTransactionsRequest {
  page?: number // 页码，从 1 开始，默认 1
  page_size?: number // 每页数量，默认 20，最大 100
  status?: 'pending' | 'settled' // 交易状态过滤
  started_at?: string // 开始时间（ISO 8601 UTC 格式）
  ended_at?: string // 结束时间（ISO 8601 UTC 格式）
}

// ==================== Response Types ====================

/**
 * 余额响应
 */
export interface BalanceResponse {
  balance_cents: number // 余额（单位：分，100分 = 1积分）
  currency: string // 货币类型，固定为 "USD"
  updated_at: string // 余额更新时间（ISO 8601 格式）
  is_cached: boolean // 是否来自本地缓存
}

/**
 * 交易记录实体
 */
export interface Transaction {
  transaction_id: string // 交易ID（UUID）
  type: 'inbound' | 'outbound' // 交易类型：inbound(充值)/outbound(消费)
  amount: string // 金额（美元，保留2位小数）
  credits: string // 积分数量（整数）
  status: 'pending' | 'settled' | 'failed' // 交易状态
  description: string // 交易描述
  created_at: string // 创建时间（ISO 8601 格式）
  failed_at: string | null // 失败时间
  settled_at: string | null // 结算时间
  metadata: Record<string, any> // 元数据
}

/**
 * 交易记录列表响应
 */
export interface TransactionListResponse {
  transactions: Transaction[]
  meta: {
    total_count: number // 总记录数
    page: number // 当前页码
    per_page: number // 每页数量
    total_pages: number // 总页数
  }
}

/**
 * 错误响应
 */
export interface ErrorResponse {
  error: string
}

// ==================== Invoice Types ====================

/**
 * 发票状态
 */
export type InvoiceStatus = 'draft' | 'finalized' | 'voided' | 'failed' | 'pending'

/**
 * 支付状态
 */
export type PaymentStatus = 'succeeded' | 'pending' | 'failed'

/**
 * 发票实体
 */
export interface Invoice {
  lago_id: string                      // Lago ID（用于查询详情）
  status: InvoiceStatus                // 发票状态
  issuing_date: string                 // 签发日期（ISO 8601）
  number: string                       // 发票编号（点击查看详情）
  payment_status: PaymentStatus        // 支付状态
  fees_amount_cents: number            // 费用金额（分）
  prepaid_credit_amount_cents: number  // 预付费金额（分）
  total_amount_cents: number           // 总金额（分）
  currency: string                     // 货币类型
}

/**
 * 计费项明细
 */
export interface FeeItem {
  name: string           // 计费项名称
  code: string           // 计费编号
  units: string          // 使用量
  unit_price: string     // 单价（美元）
  amount_cents: number   // 总金额（分）
  created_at: string     // 创建时间（ISO 8601 格式）
}

/**
 * 发票详情
 */
export interface InvoiceDetail {
  lago_id: string
  status: string
  number: string
  issuing_date: string
  payment_status: string
  fees_amount_cents: number
  prepaid_credit_amount_cents: number
  fee_items: FeeItem[]
}

/**
 * 查询发票列表请求参数
 */
export interface GetInvoicesRequest {
  page?: number
  page_size?: number
  status?: InvoiceStatus
  issuing_date_start?: string  // ISO 8601 格式
  issuing_date_end?: string    // ISO 8601 格式
}

/**
 * 发票列表响应
 */
export interface InvoiceListResponse {
  invoices: Invoice[]
  meta: {
    total_count: number
    page: number
    per_page: number
    total_pages: number
  }
}
