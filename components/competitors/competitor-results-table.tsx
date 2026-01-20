"use client"

import { useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon, TrashIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatApiTime } from "@/lib/api/competitors/utils"
import type { CrawlResult } from "@/lib/api/competitors/types"

interface CompetitorResultsTableProps {
  results: CrawlResult[]
  loading: boolean
  pagination: { page: number; pageSize: number; total: number }
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onDelete?: (resultId: string) => void
  t: (key: string) => string
}

export function CompetitorResultsTable({
  results,
  loading,
  pagination,
  onPageChange,
  onPageSizeChange,
  onDelete,
  t,
}: CompetitorResultsTableProps) {
  const totalPages = Math.ceil(pagination.total / pagination.pageSize)

  // Content preview state
  const [contentPreview, setContentPreview] = useState<{ content: string } | null>(null)

  const handleContentClick = (post: CrawlResult) => {
    setContentPreview({
      content: post.content,
    })
  }

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
                {t("contentWriting.materials.table.content")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.materials.table.link")} (Source)
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.competitors.table.likes")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.competitors.table.comments")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.materials.table.time")}
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
                  {t("contentWriting.competitors.table.loading")}
                </td>
              </tr>
            ) : results.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted-foreground">
                  {t("contentWriting.competitors.table.noResults")}
                </td>
              </tr>
            ) : (
              results.map((post) => (
                <tr key={post.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                  <td className="py-3 px-4 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {post.platform}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-foreground max-w-md">
                    <div
                      className="line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleContentClick(post)}
                      title={t("contentWriting.competitors.table.clickToViewContent")}
                    >
                      {post.content}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline max-w-xs truncate"
                    >
                      <span className="truncate">{post.url}</span>
                      <ExternalLinkIcon className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{post.like_count}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{post.comment_count}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {formatApiTime(post.created_at)}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => onDelete(post.id)}
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </Button>
                    )}
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

      {/* Content Preview Dialog */}
      <Dialog open={contentPreview !== null} onOpenChange={(open) => !open && setContentPreview(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{t("contentWriting.competitors.table.contentDialogTitle")}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] p-4 bg-muted/30 rounded-lg">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {contentPreview?.content}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
