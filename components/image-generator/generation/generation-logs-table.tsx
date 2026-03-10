"use client"

import { useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon, FileJson, Download, Copy, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/base/select"
import { Button } from "@/components/ui/base/button"
import { ScrollableTableContainer } from "@/components/ui/table/scrollable-table-container"
import type { GenerationLog, PaginationState } from "@/lib/api/image-generation/types"

interface GenerationLogsTableProps {
  logs: GenerationLog[]
  loading: boolean
  statusFilter: string
  setStatusFilter: (value: string) => void
  modeFilter: string
  setModeFilter: (value: string) => void
  modelFilter: string
  setModelFilter: (value: string) => void
  availableModels: string[]
  loadingModels: boolean
  pagination: PaginationState
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onViewPrompt: (log: GenerationLog) => void
  onDownloadImage: (imageUrl: string) => void
  onCopyToMaterials?: (logId: number) => void
  t: (key: string, params?: Record<string, any>) => string
}

// 状态颜色配置
const STATUS_COLOR_CONFIG = {
  pending: { bg: "bg-yellow-500/10", text: "text-yellow-600" },
  processing: { bg: "bg-blue-500/10", text: "text-blue-600" },
  success: { bg: "bg-green-500/10", text: "text-green-600" },
  failed: { bg: "bg-red-500/10", text: "text-red-600" },
} as const

export function GenerationLogsTable({
  logs,
  loading,
  statusFilter,
  setStatusFilter,
  modeFilter,
  setModeFilter,
  modelFilter,
  setModelFilter,
  availableModels,
  loadingModels,
  pagination,
  onPageChange,
  onPageSizeChange,
  onViewPrompt,
  onDownloadImage,
  onCopyToMaterials,
  t,
}: GenerationLogsTableProps) {
  const [copyingLogIds, setCopyingLogIds] = useState<Set<number>>(new Set())

  const handleCopyToMaterials = async (logId: number) => {
    setCopyingLogIds(prev => new Set(prev).add(logId))
    try {
      await onCopyToMaterials?.(logId)
    } finally {
      setCopyingLogIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(logId)
        return newSet
      })
    }
  }
  // 解析 image_urls JSON 字符串
  const parseImageUrls = (urlsJson: string): string[] => {
    try {
      return JSON.parse(urlsJson) as string[]
    } catch {
      return []
    }
  }

  const totalPages = Math.ceil(pagination.total / pagination.pageSize)

  return (
    <ScrollableTableContainer
      heightOffset={280}
      filterBar={
        <div className="flex items-center gap-4 flex-1">
          {/* 状态过滤 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {t("imageGeneration.logs.filterStatus")}
            </span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("imageGeneration.logs.status.all")}</SelectItem>
                <SelectItem value="pending">{t("imageGeneration.logs.status.pending")}</SelectItem>
                <SelectItem value="processing">{t("imageGeneration.logs.status.processing")}</SelectItem>
                <SelectItem value="success">{t("imageGeneration.logs.status.success")}</SelectItem>
                <SelectItem value="failed">{t("imageGeneration.logs.status.failed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 模式过滤 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {t("imageGeneration.logs.filterMode")}
            </span>
            <Select value={modeFilter} onValueChange={setModeFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("imageGeneration.logs.mode.all")}</SelectItem>
                <SelectItem value="creator">{t("imageGeneration.logs.mode.creator")}</SelectItem>
                <SelectItem value="style">{t("imageGeneration.logs.mode.style")}</SelectItem>
                <SelectItem value="inversion">{t("imageGeneration.logs.mode.inversion")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 模型过滤 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {t("imageGeneration.logs.filterModel")}
            </span>
            <Select value={modelFilter} onValueChange={setModelFilter} disabled={loadingModels || availableModels.length === 0}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("imageGeneration.logs.model.all")}</SelectItem>
                {availableModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      }
      table={
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("imageGeneration.logs.table.time")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("imageGeneration.logs.table.mode")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("imageGeneration.logs.table.model")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("imageGeneration.logs.table.status")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("imageGeneration.logs.table.images")}
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("imageGeneration.logs.table.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  {t("common.doing")}
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  {t("imageGeneration.logs.table.noData")}
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const imageUrls = parseImageUrls(log.image_urls)
                return (
                  <tr key={log.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleString("zh-CN")}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {t(`imageGeneration.logs.mode.${log.gen_mode}`)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">{log.model_name}</td>
                    <td className="py-3 px-4 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_COLOR_CONFIG[log.status]?.bg || "bg-muted"
                        } ${STATUS_COLOR_CONFIG[log.status]?.text || "text-muted-foreground"}`}
                      >
                        {t(`imageGeneration.logs.status.${log.status}`)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {log.status === "success" && imageUrls.length > 0 ? (
                        <div className="flex items-center gap-2">
                          {imageUrls.slice(0, 3).map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative w-12 h-12 rounded border border-border overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                            >
                              <img
                                src={url}
                                alt={`Generated ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </a>
                          ))}
                          {imageUrls.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{imageUrls.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onViewPrompt(log)}
                          title={t("imageGeneration.logs.actions.viewPrompt")}
                        >
                          <FileJson className="w-4 h-4" />
                        </Button>
                        {log.status === "success" && imageUrls.length > 0 && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onDownloadImage(imageUrls[0])}
                              title={t("imageGeneration.logs.actions.download")}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={copyingLogIds.has(log.id)}
                              onClick={() => handleCopyToMaterials(log.id)}
                              title={t("imageGeneration.logs.actions.copyToMaterials")}
                            >
                              {copyingLogIds.has(log.id) ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      }
      pagination={
        pagination.total > 0 ? (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              共 {pagination.total} 条，第 {pagination.page} 页
            </div>
            <div className="flex items-center gap-4">
              {/* 页大小选择 */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">每页</span>
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
                <span className="text-sm text-muted-foreground">条</span>
              </div>

              {/* 分页按钮 */}
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
                  {pagination.page} / {totalPages}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page >= totalPages}
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : null
      }
    />
  )
}
