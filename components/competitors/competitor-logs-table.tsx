"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/base/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/base/select"
import { formatApiTime } from "@/lib/api/competitors/utils"
import { CRAWL_LOG_STATUS_COLOR_CONFIG } from "@/lib/api/competitors/enums"
import type { CrawlLogWithStatus } from "@/lib/api/competitors/types"

interface CompetitorLogsTableProps {
  logs: CrawlLogWithStatus[]
  loading: boolean
  pagination: { page: number; pageSize: number; total: number }
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  t: (key: string) => string
}

export function CompetitorLogsTable({
  logs,
  loading,
  pagination,
  onPageChange,
  onPageSizeChange,
  t,
}: CompetitorLogsTableProps) {
  const totalPages = Math.ceil(pagination.total / pagination.pageSize)

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.competitors.logs.table.id")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.competitors.logs.table.snapshotId")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.competitors.logs.table.status")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.competitors.logs.table.createdAt")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.competitors.logs.table.updatedAt")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">
                  {t("contentWriting.competitors.logs.table.noData")}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.snapshot_id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                  <td className="py-3 px-4 text-sm font-medium">{log.id}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground max-w-xs truncate" title={log.snapshot_id}>
                    {log.snapshot_id}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        CRAWL_LOG_STATUS_COLOR_CONFIG[log.status].bg
                      } ${CRAWL_LOG_STATUS_COLOR_CONFIG[log.status].text}`}
                    >
                      {t(`contentWriting.competitors.logs.status.${log.status}`)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {formatApiTime(log.created_at)}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {formatApiTime(log.updated_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between">
          {/* Total info */}
          <div className="text-sm text-muted-foreground">
            {t("contentWriting.competitors.pagination.totalInfo").replace("{total}", String(pagination.total)).replace("{page}", String(pagination.page))}
          </div>

          <div className="flex items-center gap-4">
            {/* Page size selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t("contentWriting.competitors.pagination.perPage")}</span>
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
                </SelectContent>
              </Select>
            </div>

            {/* Pagination buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>

              <div className="text-sm text-foreground min-w-[80px] text-center">
                {pagination.page} / {totalPages}
              </div>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= totalPages || loading}
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
