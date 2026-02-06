"use client"

import { ChevronLeftIcon, ChevronRightIcon, FileTextIcon } from "lucide-react"
import { Button } from "@/components/ui/base/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/base/select"
import { DateRangePicker, type DateRange } from "@/components/ui/base/date-range-picker"
import type { Invoice, InvoiceStatus, PaymentStatus } from "@/lib/api/billing/types"

interface PaginationState {
  page: number
  pageSize: number
  total: number
}

interface InvoiceTableProps {
  invoices: Invoice[]
  loading: boolean
  pagination: PaginationState
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  dateRange?: DateRange
  onDateRangeChange: (range?: DateRange) => void
  onInvoiceClick: (lagoId: string) => void
  t: (key: string, params?: Record<string, any>) => any
}

export function InvoiceTable({
  invoices,
  loading,
  pagination,
  onPageChange,
  onPageSizeChange,
  statusFilter,
  onStatusFilterChange,
  dateRange,
  onDateRangeChange,
  onInvoiceClick,
  t,
}: InvoiceTableProps) {
  // 发票状态徽章配置
  const getStatusBadge = (status: InvoiceStatus) => {
    const config = {
      draft: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-800 dark:text-gray-200' },
      finalized: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200' },
      voided: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200' },
      failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200' },
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200' },
    }
    const labels = {
      draft: t('billing.invoices.status.draft'),
      finalized: t('billing.invoices.status.finalized'),
      voided: t('billing.invoices.status.voided'),
      failed: t('billing.invoices.status.failed'),
      pending: t('billing.invoices.status.pending'),
    }
    const { bg, text } = config[status]
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
        {labels[status]}
      </span>
    )
  }

  // 支付状态徽章配置
  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const config = {
      succeeded: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200' },
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200' },
      failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200' },
    }
    const labels = {
      succeeded: t('billing.invoices.paymentStatus.succeeded'),
      pending: t('billing.invoices.paymentStatus.pending'),
      failed: t('billing.invoices.paymentStatus.failed'),
    }
    const { bg, text } = config[status]
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
        {labels[status]}
      </span>
    )
  }

  // 金额格式化：只显示美元
  const formatAmount = (cents: number) => {
    const dollars = (cents / 100).toFixed(2)
    return `$${dollars}`
  }

  // 信用额度格式化：只显示积分
  const formatCredit = (cents: number) => {
    const credits = cents
    return `${credits}`
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
              <SelectItem value="draft">{t("billing.invoices.status.draft")}</SelectItem>
              <SelectItem value="finalized">{t("billing.invoices.status.finalized")}</SelectItem>
              <SelectItem value="voided">{t("billing.invoices.status.voided")}</SelectItem>
              <SelectItem value="failed">{t("billing.invoices.status.failed")}</SelectItem>
              <SelectItem value="pending">{t("billing.invoices.status.pending")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 日期范围筛选 */}
        <DateRangePicker
          value={dateRange}
          onChange={onDateRangeChange}
          t={t}
        />
      </div>

      {/* Invoice Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("billing.invoices.table.issuingDate")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("billing.invoices.table.number")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("billing.invoices.table.status")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("billing.invoices.table.paymentStatus")}
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("billing.invoices.table.credit")}
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("billing.invoices.table.totalAmount")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && invoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                    {t("billing.table.loading")}
                  </div>
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  {t("billing.table.noData")}
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.lago_id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {new Date(invoice.issuing_date).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <button
                      onClick={() => onInvoiceClick(invoice.lago_id)}
                      className="flex items-center gap-1.5 text-primary hover:underline transition-colors"
                    >
                      <FileTextIcon className="w-4 h-4" />
                      {invoice.number}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {getPaymentStatusBadge(invoice.payment_status)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-medium">
                    {formatCredit(invoice.prepaid_credit_amount_cents)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-medium">
                    {formatAmount(invoice.total_amount_cents)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && invoices.length > 0 && (
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
