"use client"

import { ChevronLeftIcon, ChevronRightIcon, TrashIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatApiTime } from "@/lib/api/competitors/utils"
import { TASK_STATUS_COLOR_CONFIG } from "@/lib/api/competitors/enums"
import type { ScheduledTask } from "@/lib/api/competitors/types"

interface CompetitorTasksTableProps {
  tasks: ScheduledTask[]
  loading: boolean
  pagination: { page: number; pageSize: number; total: number }
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onToggleStatus: (taskId: number, currentStatus: "running" | "paused") => void
  onDelete: (taskId: number) => void
  onEditInterval: (task: ScheduledTask) => void
  t: (key: string) => string
}

export function CompetitorTasksTable({
  tasks,
  loading,
  pagination,
  onPageChange,
  onPageSizeChange,
  onToggleStatus,
  onDelete,
  onEditInterval,
  t,
}: CompetitorTasksTableProps) {
  const totalPages = Math.ceil(pagination.total / pagination.pageSize)

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.competitors.table.platform")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.competitors.table.url")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.competitors.table.interval")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.competitors.table.lastRun")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.competitors.table.nextRun")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.competitors.table.status")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.competitors.table.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted-foreground">
                  加载中...
                </td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted-foreground">
                  {t("contentWriting.competitors.table.noTasks")}
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                  <td className="py-3 px-4 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {task.platform}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-foreground max-w-xs truncate">{task.url}</td>
                  <td className="py-3 px-4 text-sm">
                    <button
                      onClick={() => onEditInterval(task)}
                      className="text-primary hover:underline cursor-pointer text-left"
                    >
                      {task.interval_desc}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {task.last_run_at ? formatApiTime(task.last_run_at) : "-"}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {task.next_run_at ? formatApiTime(task.next_run_at) : "-"}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <button
                      onClick={() => onToggleStatus(task.id, task.status)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-all hover:opacity-80 ${
                        task.status === "running"
                          ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                          : "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20"
                      }`}
                    >
                      {task.status === "running" ? t("contentWriting.competitors.table.running") : t("contentWriting.competitors.table.paused")}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => onDelete(task.id)}
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </Button>
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
