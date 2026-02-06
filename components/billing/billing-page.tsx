"use client"

import { useEffect, useState, useRef } from 'react'
import { useTranslation } from '@/lib/i18n/i18n-context'
import { useToast } from '@/hooks/use-toast'
import { useBilling, type PaginationState } from '@/lib/hooks/use-billing'
import type { InvoiceDetail } from '@/lib/api/billing/types'
import { BalanceCard } from './balance-card'
import { TransactionTable } from './transaction-table'
import { InvoiceTable } from './invoice-table'
import { InvoiceDetailDialog } from './invoice-detail-dialog'
import type { DateRange } from 'react-day-picker'

export function BillingPage() {
  const { t } = useTranslation()
  const { toast } = useToast()

  // 使用自定义 hook 管理所有状态和业务逻辑
  const {
    balance,
    recharges,
    usage,
    invoices,
    loading,
    refreshing,
    pagination,
    filters,
    fetchBalance,
    refreshBalance,
    fetchRecharges,
    fetchUsage,
    fetchInvoices,
    fetchInvoiceDetail,
    updatePagination,
    updateFilters,
  } = useBilling()

  // Tab 状态
  const [activeTab, setActiveTab] = useState<'recharges' | 'usage' | 'invoices'>('recharges')

  // 发票详情状态
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null)
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)

  // 使用 ref 保存 fetch 函数，避免 useEffect 依赖数组问题
  const fetchRechargesRef = useRef(fetchRecharges)
  const fetchUsageRef = useRef(fetchUsage)
  const fetchInvoicesRef = useRef(fetchInvoices)
  const fetchBalanceRef = useRef(fetchBalance)

  // 保持 ref 为最新值
  useEffect(() => {
    fetchRechargesRef.current = fetchRecharges
    fetchUsageRef.current = fetchUsage
    fetchInvoicesRef.current = fetchInvoices
    fetchBalanceRef.current = fetchBalance
  }, [fetchRecharges, fetchUsage, fetchInvoices, fetchBalance])

  // ==================== 数据获取 ====================

  // 组件初始加载时获取余额
  useEffect(() => {
    fetchBalanceRef.current()
  }, [])

  // 监听 Tab 切换，自动加载对应数据（每次切换都刷新）
  useEffect(() => {
    if (activeTab === 'recharges') {
      fetchRechargesRef.current()
    } else if (activeTab === 'usage') {
      fetchUsageRef.current()
    } else if (activeTab === 'invoices') {
      fetchInvoicesRef.current()
    }
  }, [activeTab])

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
    // 触发数据获取
    if (activeTab === 'recharges') {
      fetchRecharges()
    } else if (activeTab === 'usage') {
      fetchUsage()
    } else {
      fetchInvoices()
    }
  }

  // 日期范围筛选处理（仅用于 invoices）
  const handleDateRangeChange = (range?: DateRange) => {
    updateFilters('invoices', { dateRange: range })
    // 重置到第一页
    updatePagination('invoices', { page: 1 })
    // 触发数据获取
    fetchInvoices()
  }

  // 发票编号点击处理
  const handleInvoiceClick = async (lagoId: string) => {
    const detail = await fetchInvoiceDetail(lagoId)
    if (detail) {
      setSelectedInvoice(detail)
      setInvoiceDialogOpen(true)
    }
  }

  const handlePageChange = (page: number) => {
    const key = activeTab
    updatePagination(key, { page })
    if (activeTab === 'recharges') {
      fetchRecharges()
    } else if (activeTab === 'usage') {
      fetchUsage()
    } else {
      fetchInvoices()
    }
  }

  const handlePageSizeChange = (pageSize: number) => {
    const key = activeTab
    updatePagination(key, { pageSize, page: 1 })
    if (activeTab === 'recharges') {
      fetchRecharges()
    } else if (activeTab === 'usage') {
      fetchUsage()
    } else {
      fetchInvoices()
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
          <button
            onClick={() => setActiveTab('invoices')}
            className={`
              px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px
              ${
                activeTab === 'invoices'
                  ? 'text-primary border-primary bg-primary/5'
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50'
              }
            `}
          >
            {t('billing.tabs.invoices')}
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
            t={t}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoiceTable
            invoices={invoices}
            loading={loading}
            pagination={pagination.invoices}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            statusFilter={filters.invoices.status}
            onStatusFilterChange={handleStatusFilterChange}
            dateRange={filters.invoices.dateRange}
            onDateRangeChange={handleDateRangeChange}
            onInvoiceClick={handleInvoiceClick}
            t={t}
          />
        )}
      </div>

      {/* Invoice Detail Dialog */}
      <InvoiceDetailDialog
        invoice={selectedInvoice}
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        t={t}
      />
    </div>
  )
}
