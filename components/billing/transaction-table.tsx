"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/base/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/base/select"
import { DateRangePicker } from "@/components/ui/base/date-range-picker"
import type { Transaction } from "@/lib/api/billing/types"
import type { DateRange } from "@/components/ui/base/date-range-picker"

interface PaginationState {
  page: number
  pageSize: number
  total: number
}

interface TransactionTableProps {
  transactions: Transaction[]
  loading: boolean
  pagination: PaginationState
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  type: 'recharges' | 'usage'
  // 筛选相关
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  dateRange?: DateRange
  onDateRangeChange?: (range: DateRange | undefined) => void
  t: (key: string, params?: Record<string, any>) => any
}

export function TransactionTable({
  transactions,
  loading,
  pagination,
  onPageChange,
  onPageSizeChange,
  type,
  statusFilter,
  onStatusFilterChange,
  dateRange,
  onDateRangeChange,
  t,
}: TransactionTableProps) {
  const getStatusBadge = (status: Transaction['status']) => {
    const config = {
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200' },
      settled: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200' },
      failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200' },
    }
    const labels = {
      pending: t('billing.status.pending'),
      settled: t('billing.status.settled'),
      failed: t('billing.status.failed'),
    }
    const { bg, text } = config[status]
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
        {labels[status]}
      </span>
    )
  }

  const getDescription = (tx: Transaction) => {
    if (tx.description) return tx.description
    return type === 'recharges'
      ? t('billing.transaction.recharge')
      : t('billing.transaction.usage')
  }

  const renderMetadata = (metadata: Record<string, any>) => {
    if (!metadata || Object.keys(metadata).length === 0) {
      return <span className="text-muted-foreground text-xs">-</span>
    }

    return (
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(metadata).map(([key, value]) => (
          <span
            key={key}
            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted/80 border border-border/60 text-muted-foreground"
          >
            <span className="font-semibold text-foreground">{key}</span>
            <span className="mx-1">:</span>
            <span>{String(value)}</span>
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Filter Bar */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* 状态筛选 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {t("billing.table.filterStatus")}
          </span>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("billing.table.filterStatusAll")}</SelectItem>
              <SelectItem value="settled">{t("billing.status.settled")}</SelectItem>
              <SelectItem value="pending">{t("billing.status.pending")}</SelectItem>
              <SelectItem value="failed">{t("billing.status.failed")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 日期范围筛选 */}
        <DateRangePicker
          t={t}
          value={dateRange}
          onChange={onDateRangeChange}
          showPresets={true}
          presetTypes={['last7Days', 'thisMonth', 'lastMonth']}
        />
      </div>

      {/* Transaction Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("billing.table.date")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("billing.table.transactionId")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("billing.table.metadata")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("billing.table.description")}
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("billing.table.status")}
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("billing.table.amount")}
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("billing.table.credits")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                    {t("billing.table.loading")}
                  </div>
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted-foreground">
                  {t("billing.table.noData")}
                </td>
              </tr>
            ) : (
              transactions.map((tx, index) => (
                <tr key={`${tx.created_at}-${tx.type}-${tx.amount}-${index}`} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {new Date(tx.created_at).toLocaleString("zh-CN")}
                  </td>
                  <td className="py-3 px-4 text-sm font-mono text-muted-foreground">
                    {tx.transaction_id}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {renderMetadata(tx.metadata)}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {getDescription(tx)}
                  </td>
                  <td className="py-3 px-4 text-sm text-center">
                    {getStatusBadge(tx.status)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right">
                    ${tx.amount}
                  </td>
                  <td className={`py-3 px-4 text-sm text-right font-medium ${
                    type === 'recharges' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {type === 'recharges' ? '+' : '-'}
                    {tx.credits}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && transactions.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t("billing.table.totalInfo", {
              total: pagination.total,
              page: pagination.page,
            })}
          </div>
          <div className="flex items-center gap-4">
            {/* Page Size Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t("billing.table.perPage")}</span>
              <Select
                value={String(pagination.pageSize)}
                onValueChange={(value) => {
                  onPageSizeChange(Number(value))
                  onPageChange(1)
                }}
              >
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">{t("billing.table.items")}</span>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>

              <div className="text-sm text-foreground min-w-[80px] text-center">
                {pagination.page} / {Math.ceil(pagination.total / pagination.pageSize)}
              </div>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
