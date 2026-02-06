import { useState, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/lib/i18n/i18n-context'
import { billingClient } from '@/lib/api/billing/client'
import { startOfDay, endOfDay, format } from 'date-fns'
import type { BalanceResponse, Transaction, Invoice, InvoiceDetail } from '@/lib/api/billing/types'
import type { InvoiceStatus } from '@/lib/api/billing/types'
import type { DateRange } from 'react-day-picker'

// Re-export types for use in other modules
export type { BalanceResponse, Transaction, Invoice, InvoiceDetail } from '@/lib/api/billing/types'

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export function useBilling() {
  const { toast } = useToast()
  const { t } = useTranslation()

  // ==================== 状态管理 ====================

  const [balance, setBalance] = useState<BalanceResponse | null>(null)
  const [recharges, setRecharges] = useState<Transaction[]>([])
  const [usage, setUsage] = useState<Transaction[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // 筛选状态
  const [filters, setFilters] = useState<{
    recharges: { status: string; dateRange?: DateRange }
    usage: { status: string; dateRange?: DateRange }
    invoices: { status: string; dateRange?: DateRange }
  }>({
    recharges: { status: 'all' },
    usage: { status: 'all' },
    invoices: { status: 'all' },
  })

  const [pagination, setPagination] = useState<{
    recharges: PaginationState
    usage: PaginationState
    invoices: PaginationState
  }>({
    recharges: { page: 1, pageSize: 20, total: 0 },
    usage: { page: 1, pageSize: 20, total: 0 },
    invoices: { page: 1, pageSize: 20, total: 0 },
  })

  // 使用 ref 保存最新状态，避免闭包陷阱
  const filtersRef = useRef(filters)
  const paginationRef = useRef(pagination)

  // 更新分页的辅助函数（同时更新 ref）
  const updatePagination = useCallback(
    (type: 'recharges' | 'usage' | 'invoices', updates: Partial<PaginationState>) => {
      setPagination((prev) => {
        const updated = {
          ...prev,
          [type]: { ...prev[type], ...updates },
        }
        paginationRef.current = updated
        return updated
      })
    },
    []
  )

  const updateFilters = useCallback(
    (type: 'recharges' | 'usage' | 'invoices', newFilters: Partial<{ status: string; dateRange?: DateRange }>) => {
      setFilters((prev) => {
        const updated = {
          ...prev,
          [type]: { ...prev[type], ...newFilters },
        }
        filtersRef.current = updated
        return updated
      })
    },
    []
  )

  // ==================== 数据获取 ====================

  /**
   * 查询余额
   */
  const fetchBalance = useCallback(async () => {
    const result = await billingClient.getBalance()

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: t('billing.balance.fetchFailed'),
        description: result.error,
      })
      return false
    }

    setBalance(result)
    return true
  }, [toast, t])

  /**
   * 刷新余额
   */
  const refreshBalance = useCallback(async () => {
    setRefreshing(true)

    const result = await billingClient.refreshBalance()

    setRefreshing(false)

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: t('billing.balance.refreshFailed'),
        description: result.error,
      })
      return false
    }

    setBalance(result)
    toast({
      title: t('billing.balance.refreshSuccess'),
    })

    return true
  }, [toast, t])

  /**
   * 查询充值记录
   */
  const fetchRecharges = useCallback(async () => {
    setLoading(true)

    const currentPagination = paginationRef.current.recharges
    const currentFilters = filtersRef.current.recharges

    const params: {
      page?: number
      page_size?: number
      status?: 'pending' | 'settled'
    } = {
      page: currentPagination.page,
      page_size: currentPagination.pageSize,
    }

    // 添加筛选参数
    if (currentFilters.status && currentFilters.status !== 'all') {
      params.status = currentFilters.status as 'pending' | 'settled'
    }

    const result = await billingClient.getRecharges(params)

    setLoading(false)

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: t('billing.recharges.fetchFailed'),
        description: result.error,
      })
      return false
    }

    setRecharges(result.transactions)
    setPagination((prev) => ({
      ...prev,
      recharges: { ...prev.recharges, total: result.meta.total_count },
    }))

    return true
  }, [toast, t])

  /**
   * 查询使用记录
   */
  const fetchUsage = useCallback(async () => {
    setLoading(true)

    const currentPagination = paginationRef.current.usage
    const currentFilters = filtersRef.current.usage

    const params: {
      page?: number
      page_size?: number
      status?: 'pending' | 'settled'
    } = {
      page: currentPagination.page,
      page_size: currentPagination.pageSize,
    }

    // 添加筛选参数
    if (currentFilters.status && currentFilters.status !== 'all') {
      params.status = currentFilters.status as 'pending' | 'settled'
    }

    const result = await billingClient.getUsage(params)

    setLoading(false)

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: t('billing.usage.fetchFailed'),
        description: result.error,
      })
      return false
    }

    setUsage(result.transactions)
    setPagination((prev) => ({
      ...prev,
      usage: { ...prev.usage, total: result.meta.total_count },
    }))

    return true
  }, [toast, t])

  /**
   * 查询发票列表
   */
  const fetchInvoices = useCallback(async () => {
    setLoading(true)

    const currentPagination = paginationRef.current.invoices
    const currentFilters = filtersRef.current.invoices

    const params: {
      page?: number
      page_size?: number
      status?: InvoiceStatus
      issuing_date_start?: string
      issuing_date_end?: string
    } = {
      page: currentPagination.page,
      page_size: currentPagination.pageSize,
    }

    if (currentFilters.status && currentFilters.status !== 'all') {
      params.status = currentFilters.status as InvoiceStatus
    }

    if (currentFilters.dateRange?.from) {
      // 使用本地时间，避免时区转换导致日期偏移
      params.issuing_date_start = format(startOfDay(currentFilters.dateRange.from), "yyyy-MM-dd'T'HH:mm:ss")
    }

    if (currentFilters.dateRange?.to) {
      // 使用本地时间，避免时区转换导致日期偏移
      params.issuing_date_end = format(endOfDay(currentFilters.dateRange.to), "yyyy-MM-dd'T'HH:mm:ss")
    }

    const result = await billingClient.getInvoices(params)

    setLoading(false)

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: t('billing.invoices.fetchFailed'),
        description: result.error,
      })
      return false
    }

    setInvoices(result.invoices)
    setPagination((prev) => ({
      ...prev,
      invoices: { ...prev.invoices, total: result.meta.total_count },
    }))

    return true
  }, [toast, t])

  /**
   * 查询发票详情
   */
  const fetchInvoiceDetail = useCallback(async (lagoId: string) => {
    const result = await billingClient.getInvoiceDetail(lagoId)

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: t('billing.invoices.detailFetchFailed'),
        description: result.error,
      })
      return null
    }

    return result
  }, [toast, t])

  return {
    // 状态
    balance,
    recharges,
    usage,
    invoices,
    loading,
    refreshing,
    pagination,
    filters,

    // 数据获取
    fetchBalance,
    refreshBalance,
    fetchRecharges,
    fetchUsage,
    fetchInvoices,
    fetchInvoiceDetail,

    // 分页和筛选
    updatePagination,
    updateFilters,
  }
}
