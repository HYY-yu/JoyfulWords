"use client"

import { useEffect, useState } from 'react'
import { useTranslation } from '@/lib/i18n/i18n-context'
import { useToast } from '@/hooks/use-toast'
import { useBilling } from '@/lib/hooks/use-billing'
import { BalanceCard } from './balance-card'
import { TransactionTable } from './transaction-table'

export function BillingPage() {
  const { t } = useTranslation()
  const { toast } = useToast()

  // 使用自定义 hook 管理所有状态和业务逻辑
  const {
    balance,
    recharges,
    usage,
    loading,
    refreshing,
    pagination,
    filters,
    fetchBalance,
    refreshBalance,
    fetchRecharges,
    fetchUsage,
    updatePagination,
    updateFilters,
  } = useBilling()

  // Tab 状态
  const [activeTab, setActiveTab] = useState<'recharges' | 'usage'>('recharges')

  // ==================== 数据获取 ====================

  // 组件初始加载时获取余额
  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  // 监听 Tab 切换，自动加载对应数据
  useEffect(() => {
    if (activeTab === 'recharges' && recharges.length === 0) {
      fetchRecharges()
    } else if (activeTab === 'usage' && usage.length === 0) {
      fetchUsage()
    }
  }, [activeTab, fetchRecharges, fetchUsage, recharges.length, usage.length])

  // ==================== 事件处理 ====================

  const onRefresh = async () => {
    await refreshBalance()
  }

  const onRecharge = () => {
    // 充值功能预留：显示 Toast 提示
    // TODO: 未来可以跳转到 Stripe 或打开充值对话框
    toast({
      title: t('billing.balance.rechargeComingSoon'),
      description: t('billing.balance.rechargeComingSoonDesc'),
    })
  }

  // 筛选处理
  const handleStatusFilterChange = (status: string) => {
    updateFilters(activeTab, { status })
    // 重置到第一页
    updatePagination(activeTab, { page: 1 })
  }

  const handleStartDateFilterChange = (date: string) => {
    updateFilters(activeTab, { started_at: date })
  }

  const handleEndDateFilterChange = (date: string) => {
    updateFilters(activeTab, { ended_at: date })
  }

  const handleApplyFilters = () => {
    if (activeTab === 'recharges') {
      fetchRecharges()
    } else {
      fetchUsage()
    }
  }

  const handlePageChange = (page: number) => {
    const key = activeTab
    updatePagination(key, { page })
    if (activeTab === 'recharges') {
      fetchRecharges()
    } else {
      fetchUsage()
    }
  }

  const handlePageSizeChange = (pageSize: number) => {
    const key = activeTab
    updatePagination(key, { pageSize, page: 1 })
    if (activeTab === 'recharges') {
      fetchRecharges()
    } else {
      fetchUsage()
    }
  }

  // ==================== 渲染 ====================

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <BalanceCard
        balance={balance}
        loading={loading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onRecharge={onRecharge}
        t={t}
      />

      {/* Divider */}
      <div className="border-t border-dashed border-border/60" />

      {/* Transaction Records */}
      <div className="space-y-4">
        {/* Tab Headers */}
        <div className="flex gap-2 border-b border-border/50">
          <button
            onClick={() => setActiveTab('recharges')}
            className={`
              px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px
              ${
                activeTab === 'recharges'
                  ? 'text-primary border-primary bg-primary/5'
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50'
              }
            `}
          >
            {t('billing.tabs.recharges')}
          </button>
          <button
            onClick={() => setActiveTab('usage')}
            className={`
              px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px
              ${
                activeTab === 'usage'
                  ? 'text-primary border-primary bg-primary/5'
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50'
              }
            `}
          >
            {t('billing.tabs.usage')}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'recharges' && (
          <TransactionTable
            transactions={recharges}
            loading={loading}
            pagination={pagination.recharges}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            type="recharges"
            statusFilter={filters.recharges.status}
            onStatusFilterChange={handleStatusFilterChange}
            startDateFilter={filters.recharges.started_at}
            onStartDateFilterChange={handleStartDateFilterChange}
            endDateFilter={filters.recharges.ended_at}
            onEndDateFilterChange={handleEndDateFilterChange}
            onApplyFilters={handleApplyFilters}
            t={t}
          />
        )}

        {activeTab === 'usage' && (
          <TransactionTable
            transactions={usage}
            loading={loading}
            pagination={pagination.usage}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            type="usage"
            statusFilter={filters.usage.status}
            onStatusFilterChange={handleStatusFilterChange}
            startDateFilter={filters.usage.started_at}
            onStartDateFilterChange={handleStartDateFilterChange}
            endDateFilter={filters.usage.ended_at}
            onEndDateFilterChange={handleEndDateFilterChange}
            onApplyFilters={handleApplyFilters}
            t={t}
          />
        )}
      </div>
    </div>
  )
}
