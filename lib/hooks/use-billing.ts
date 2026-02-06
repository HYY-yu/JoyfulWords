import { useState, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/lib/i18n/i18n-context'
import { billingClient } from '@/lib/api/billing/client'
import type { BalanceResponse, Transaction } from '@/lib/api/billing/types'

// Re-export types for use in other modules
export type { BalanceResponse, Transaction } from '@/lib/api/billing/types'

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
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // 筛选状态
  const [filters, setFilters] = useState<{
    recharges: { status: string }
    usage: { status: string }
  }>({
    recharges: { status: 'all' },
    usage: { status: 'all' },
  })

  const [pagination, setPagination] = useState<{
    recharges: PaginationState
    usage: PaginationState
  }>({
    recharges: { page: 1, pageSize: 20, total: 0 },
    usage: { page: 1, pageSize: 20, total: 0 },
  })

  // 使用 ref 保存最新状态，避免闭包陷阱
  const filtersRef = useRef(filters)
  const paginationRef = useRef(pagination)

  // 更新分页的辅助函数（同时更新 ref）
  const updatePagination = useCallback(
    (type: 'recharges' | 'usage', updates: Partial<PaginationState>) => {
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
    (type: 'recharges' | 'usage', newFilters: Partial<{ status: string }>) => {
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

  return {
    // 状态
    balance,
    recharges,
    usage,
    loading,
    refreshing,
    pagination,
    filters,

    // 数据获取
    fetchBalance,
    refreshBalance,
    fetchRecharges,
    fetchUsage,

    // 分页和筛选
    updatePagination,
    updateFilters,
  }
}
