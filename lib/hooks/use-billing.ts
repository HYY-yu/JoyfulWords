import { useState, useCallback } from 'react'
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
    recharges: { status: string; started_at: string; ended_at: string }
    usage: { status: string; started_at: string; ended_at: string }
  }>({
    recharges: { status: 'all', started_at: '', ended_at: '' },
    usage: { status: 'all', started_at: '', ended_at: '' },
  })

  const [pagination, setPagination] = useState<{
    recharges: PaginationState
    usage: PaginationState
  }>({
    recharges: { page: 1, pageSize: 20, total: 0 },
    usage: { page: 1, pageSize: 20, total: 0 },
  })

  // 更新分页的辅助函数
  const updatePagination = useCallback(
    (type: 'recharges' | 'usage', updates: Partial<PaginationState>) => {
      setPagination((prev) => ({
        ...prev,
        [type]: { ...prev[type], ...updates },
      }))
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

    const params: {
      page?: number
      page_size?: number
      status?: 'pending' | 'settled'
      started_at?: string
      ended_at?: string
    } = {
      page: pagination.recharges.page,
      page_size: pagination.recharges.pageSize,
    }

    // 添加筛选参数
    if (filters.recharges.status && filters.recharges.status !== 'all') {
      params.status = filters.recharges.status as 'pending' | 'settled'
    }
    if (filters.recharges.started_at) {
      params.started_at = filters.recharges.started_at
    }
    if (filters.recharges.ended_at) {
      params.ended_at = filters.recharges.ended_at
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
  }, [pagination.recharges.page, pagination.recharges.pageSize, filters.recharges, toast, t])

  /**
   * 查询使用记录
   */
  const fetchUsage = useCallback(async () => {
    setLoading(true)

    const params: {
      page?: number
      page_size?: number
      status?: 'pending' | 'settled'
      started_at?: string
      ended_at?: string
    } = {
      page: pagination.usage.page,
      page_size: pagination.usage.pageSize,
    }

    // 添加筛选参数
    if (filters.usage.status && filters.usage.status !== 'all') {
      params.status = filters.usage.status as 'pending' | 'settled'
    }
    if (filters.usage.started_at) {
      params.started_at = filters.usage.started_at
    }
    if (filters.usage.ended_at) {
      params.ended_at = filters.usage.ended_at
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
  }, [pagination.usage.page, pagination.usage.pageSize, filters.usage, toast, t])

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
    updateFilters: (type: 'recharges' | 'usage', newFilters: Partial<{ status: string; started_at: string; ended_at: string }>) => {
      setFilters((prev) => ({
        ...prev,
        [type]: { ...prev[type], ...newFilters },
      }))
    },
  }
}
