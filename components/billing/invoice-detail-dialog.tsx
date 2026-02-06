"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/base/dialog"
import type { InvoiceDetail } from "@/lib/api/billing/types"

interface InvoiceDetailDialogProps {
  invoice: InvoiceDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
  t: (key: string, params?: Record<string, any>) => any
}

export function InvoiceDetailDialog({ invoice, open, onOpenChange, t }: InvoiceDetailDialogProps) {
  if (!invoice) return null

  // 金额格式化：只显示美元
  const formatAmount = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  // 信用额度格式化：只显示积分
  const formatCredit = (cents: number) => {
    const credits = cents
    return `${credits} ${t('billing.balance.credits')}`
  }

  // 计算总金额：FeesAmount - PrepaidCredits（注意符号）
  const totalAmount = invoice.fees_amount_cents - invoice.prepaid_credit_amount_cents

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("billing.invoices.detail.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">{t("billing.invoices.detail.number")}</span>
              <p className="font-medium">{invoice.number}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("billing.invoices.detail.issuingDate")}</span>
              <p className="font-medium">{new Date(invoice.issuing_date).toLocaleDateString("zh-CN")}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("billing.invoices.detail.status")}</span>
              <p className="font-medium">{t(`billing.invoices.status.${invoice.status}`)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("billing.invoices.detail.paymentStatus")}</span>
              <p className="font-medium">{t(`billing.invoices.paymentStatus.${invoice.payment_status}`)}</p>
            </div>
          </div>

          {/* 金额汇总 */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("billing.invoices.detail.feesAmount")}</span>
              <span>{formatAmount(invoice.fees_amount_cents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("billing.invoices.detail.prepaidAmount")}</span>
              <span className="text-red-600">{formatCredit(invoice.prepaid_credit_amount_cents)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>{t("billing.invoices.detail.totalAmount")}</span>
              <span>{formatAmount(totalAmount)}</span>
            </div>
          </div>

          {/* 计费项明细 */}
          <div>
            <h3 className="font-medium mb-3">{t("billing.invoices.detail.feeItems")}</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2 px-3 text-sm">{t("billing.invoices.detail.itemName")}</th>
                    <th className="text-left py-2 px-3 text-sm">{t("billing.invoices.detail.units")}</th>
                    <th className="text-left py-2 px-3 text-sm">{t("billing.invoices.detail.unitPrice")}</th>
                    <th className="text-right py-2 px-3 text-sm">{t("billing.invoices.detail.amount")}</th>
                    <th className="text-left py-2 px-3 text-sm">{t("billing.invoices.detail.createdAt")}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.fee_items && invoice.fee_items.length > 0 ? (
                    invoice.fee_items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="py-2 px-3 text-sm">{item.name}</td>
                        <td className="py-2 px-3 text-sm">{item.units}</td>
                        <td className="py-2 px-3 text-sm">${item.unit_price}</td>
                        <td className="py-2 px-3 text-sm text-right">{formatAmount(item.amount_cents)}</td>
                        <td className="py-2 px-3 text-sm">{new Date(item.created_at).toLocaleString("zh-CN")}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-sm text-muted-foreground">
                        {t("billing.table.noData")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
