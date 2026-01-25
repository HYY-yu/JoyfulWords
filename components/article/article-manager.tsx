"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useAuth } from "@/lib/auth/auth-context"
import { useArticles } from "@/lib/hooks/use-articles"
import { Input } from "@/components/ui/base/input"
import { Button } from "@/components/ui/base/button"
import { Badge } from "@/components/ui/base/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/base/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/base/dropdown-menu"
import {
  SearchIcon, PlusIcon, EditIcon, TrashIcon, LoaderIcon,
  Eye, RefreshCw, ChevronLeftIcon, ChevronRightIcon, SparklesIcon, CheckIcon, XIcon
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/base/tooltip"
import type { Article } from "@/lib/api/articles/types"
import { getStatusVariant, formatShortDate } from "./article-types"
import {
  ContentPreviewDialog,
  DeleteConfirmDialog,
  ImageGalleryDialog,
  MaterialsLinksDialog,
} from "./article-dialogs"
import { ArticleAIHelpDialog } from "./article-ai-help-dialog"
import { useToast } from "@/hooks/use-toast"
import { articlesClient } from "@/lib/api/articles/client"

interface ArticleManagerProps {
  onNavigateToWriting?: () => void
}

export function ArticleManager({ onNavigateToWriting }: ArticleManagerProps = {}) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()

  // 使用 useArticles Hook
  const {
    articles,
    loading,
    pagination,
    titleFilter,
    statusFilter,
    setTitleFilter,
    setStatusFilter,
    handleDelete,
    handleStatusChange,
    getAllowedStatuses,
    fetchArticles,
    handleRefresh,
    handlePageChange,
    handlePageSizeChange,
  } = useArticles()

  // Dialog states
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [contentPreviewOpen, setContentPreviewOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [aiHelpDialogOpen, setAiHelpDialogOpen] = useState(false)
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false)
  const [materialsLinksOpen, setMaterialsLinksOpen] = useState(false)

  // Title editing states
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState("")

  // Action handlers
  const handleEditArticle = (article: Article) => {
    // 保留 window.__editArticle (向后兼容)
    ;(window as any).__editArticle = article

    // 设置文章 ID（用于 React key）
    ;(window as any).__editArticleId = article.id

    // 新增 localStorage 存储（使用用户特定的 key）
    try {
      const draft = {
        article,
        isEditMode: true,
        lastSaved: new Date().toISOString(),
        content: {
          html: article.content,
          text: article.content.replace(/<[^>]*>/g, ""),
        },
        metadata: {
          wordCount: article.content.length,
          hasUnsavedChanges: false,
          version: "v1.0.0",
        },
      }
      const draftKey = user ? `joyfulwords-article-draft-${user.id}` : 'joyfulwords-article-draft-guest'
      localStorage.setItem(draftKey, JSON.stringify(draft))
    } catch (error) {
      console.error('Failed to save article to localStorage:', error)
    }

    if (onNavigateToWriting) {
      onNavigateToWriting()
    }

    toast({
      description: `${t("common.edit")}: ${article.title}`
    })
  }

  const confirmDeleteArticle = () => {
    if (selectedArticle) {
      handleDelete(selectedArticle.id)
      setDeleteConfirmOpen(false)
      setSelectedArticle(null)
    }
  }

  // 状态更新处理器
  const handleStatusUpdate = async (article: Article, newStatus: string) => {
    const success = await handleStatusChange(article.id, newStatus as any)
    if (success) {
      setSelectedArticle(null)
    }
  }

  const handleAIArticleCreated = () => {
    // 刷新列表查看新文章
    handleRefresh()
  }

  // Title editing handlers
  const startEditingTitle = (article: Article) => {
    setEditingArticleId(article.id)
    setEditingTitle(article.title)
  }

  const cancelEditingTitle = () => {
    setEditingArticleId(null)
    setEditingTitle("")
  }

  const saveTitle = async (articleId: number) => {
    if (!editingTitle.trim()) {
      return
    }

    const result = await articlesClient.updateArticleMetadata(articleId, {
      title: editingTitle.trim()
    })

    if ('message' in result) {
      setEditingArticleId(null)
      handleRefresh()
    } else {
      toast({
        variant: "destructive",
        description: result.error
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar + Action Buttons */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          {/* Title Filter */}
          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {t("contentWriting.manager.filterTitle")}
            </span>
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("contentWriting.manager.searchTitlePlaceholder")}
                className="pl-8 h-9"
                value={titleFilter}
                onChange={(e) => setTitleFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchArticles()}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {t("contentWriting.manager.filterStatus")}
            </span>
            <Select
              value={statusFilter}
              onValueChange={(value: any) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("contentWriting.manager.status.all")}</SelectItem>
                <SelectItem value="init">{t("contentWriting.manager.status.init")}</SelectItem>
                <SelectItem value="draft">{t("contentWriting.manager.status.draft")}</SelectItem>
                <SelectItem value="published">{t("contentWriting.manager.status.published")}</SelectItem>
                <SelectItem value="archived">{t("contentWriting.manager.status.archived")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Refresh Button (for AI generation status) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>{t("common.refresh")}</span>
            </TooltipContent>
          </Tooltip>

          {/* AI Help Button */}
          <Button
            onClick={() => setAiHelpDialogOpen(true)}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <SparklesIcon className="w-4 h-4" />
            {t("common.aiHelp")}
          </Button>
        </div>
      </div>

      {/* Articles Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.manager.table.title")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.manager.table.content")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.manager.table.status")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.manager.table.images")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.manager.table.materials")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.manager.table.posts")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.manager.table.created")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.manager.table.modified")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.manager.table.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <LoaderIcon className="w-5 h-5 animate-spin" />
                    <span>{t("contentWriting.manager.loading")}</span>
                  </div>
                </td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-muted-foreground">
                  {t("contentWriting.manager.emptyTitle")}
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr
                  key={article.id}
                  className="border-b border-border last:border-b-0 hover:bg-muted/30"
                >
                  {/* Title - 可内联编辑 */}
                  <td className="py-3 px-4 text-sm">
                    {editingArticleId === article.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveTitle(article.id)
                            } else if (e.key === 'Escape') {
                              cancelEditingTitle()
                            }
                          }}
                          className="h-8 text-sm"
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => saveTitle(article.id)}
                        >
                          <CheckIcon className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={cancelEditingTitle}
                        >
                          <XIcon className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        className="h-auto p-0 justify-start text-left hover:bg-transparent w-full"
                        onClick={() => startEditingTitle(article)}
                      >
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <EditIcon className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {t("contentWriting.manager.clickForEdit")}
                            </span>
                          </div>
                          <div className="font-medium truncate" title={article.title}>
                            {article.title}
                          </div>
                        </div>
                      </Button>
                    )}
                  </td>

                  {/* Content Preview */}
                  <td className="py-3 px-4 text-sm">
                    <Button
                      variant="ghost"
                      className="h-auto p-0 justify-start text-left hover:bg-transparent"
                      onClick={() => {
                        setSelectedArticle(article)
                        setContentPreviewOpen(true)
                      }}
                    >
                      <div className="max-w-md">
                        <div className="flex items-center gap-1 mb-1">
                          <Eye className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {t("contentWriting.manager.clickForDetail")}
                          </span>
                        </div>
                        <div className="text-sm text-foreground line-clamp-2">
                          {article.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...'}
                        </div>
                      </div>
                    </Button>
                  </td>

                  {/* Status - 可点击编辑 */}
                  <td className="py-3 px-4 text-sm">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Badge
                          variant={getStatusVariant(article.status)}
                          className="text-xs cursor-pointer hover:opacity-80"
                        >
                          {t(`contentWriting.manager.status.${article.status}`)}
                        </Badge>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {getAllowedStatuses(article.status).map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => handleStatusUpdate(article, status)}
                          >
                            {t(`contentWriting.manager.status.${status}`)}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>

                  {/* Images - 图片素材 */}
                  <td className="py-3 px-4 text-sm">
                    {(() => {
                      const imageMaterials = article.materials?.filter(m => m.type === 'image') || []
                      if (imageMaterials.length === 0) {
                        return <span className="text-muted-foreground">-</span>
                      }
                      return (
                        <Button
                          variant="ghost"
                          className="h-auto p-1 justify-start text-left hover:bg-transparent"
                          onClick={() => {
                            setSelectedArticle(article)
                            setImageGalleryOpen(true)
                          }}
                        >
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <Eye className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {t("contentWriting.manager.clickForDetail")}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              {imageMaterials.slice(0, 2).map((material) => (
                                <div key={material.id} className="relative w-12 h-12 rounded overflow-hidden border">
                                  <img
                                    src={material.content || ''}
                                    alt={material.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                              {imageMaterials.length > 2 && (
                                <div className="w-12 h-12 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                  +{imageMaterials.length - 2}
                                </div>
                              )}
                            </div>
                          </div>
                        </Button>
                      )
                    })()}
                  </td>

                  {/* Materials - 其他素材 */}
                  <td className="py-3 px-4 text-sm">
                    {(() => {
                      const otherMaterials = article.materials?.filter(m => m.type !== 'image') || []
                      if (otherMaterials.length === 0) {
                        return <span className="text-muted-foreground">-</span>
                      }
                      return (
                        <Button
                          variant="ghost"
                          className="h-auto p-2 justify-start text-left hover:bg-transparent"
                          onClick={() => {
                            setSelectedArticle(article)
                            setMaterialsLinksOpen(true)
                          }}
                        >
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <Eye className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {t("contentWriting.manager.clickForDetail")}
                              </span>
                            </div>
                            <div className="text-sm text-foreground">
                              {t("contentWriting.manager.materialsCount", { count: otherMaterials.length })}
                            </div>
                          </div>
                        </Button>
                      )
                    })()}
                  </td>

                  {/* Posts - 竞品文章 */}
                  <td className="py-3 px-4 text-sm">
                    {article.posts && article.posts.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {article.posts.slice(0).map((post) => (
                          post.original_link ? (
                            <a
                              key={post.id}
                              href={post.original_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 line-clamp-1 max-w-[150px] hover:underline"
                              title={`${post.platform || ''}${post.author_name ? ' - ' + post.author_name : ''}`}
                            >
                              {post.platform}{post.author_name ? ` - ${post.author_name}` : ''}
                            </a>
                          ) : (
                            <span
                              key={post.id}
                              className="text-xs text-foreground line-clamp-1 max-w-[150px]"
                              title={`${post.platform || ''}${post.author_name ? ' - ' + post.author_name : ''}`}
                            >
                              {post.platform}{post.author_name ? ` - ${post.author_name}` : ''}
                            </span>
                          )
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>

                  {/* Created At */}
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {formatShortDate(article.created_at)}
                  </td>

                  {/* Modified At */}
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {formatShortDate(article.updated_at)}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-sm">
                    <div className="flex items-center gap-2">
                      {/* Edit button: Only show for draft and published */}
                      {(article.status === 'draft' || article.status === 'published') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditArticle(article)}
                          className="h-8 w-8 p-0"
                        >
                          <EditIcon className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      {/* Delete button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedArticle(article)
                          setDeleteConfirmOpen(true)
                        }}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination UI */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t("contentWriting.manager.totalCount", { total: pagination.total, page: pagination.page })}
          </div>
          <div className="flex items-center gap-4">
            {/* Page size selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t("contentWriting.manager.perPage")}</span>
              <Select
                value={String(pagination.pageSize)}
                onValueChange={(value) => handlePageSizeChange(Number(value))}
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
              <span className="text-sm text-muted-foreground">{t("contentWriting.manager.items")}</span>
            </div>

            {/* Pagination buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
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
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize) || loading}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {selectedArticle && (
        <>
          <ContentPreviewDialog
            article={selectedArticle}
            open={contentPreviewOpen}
            onOpenChange={setContentPreviewOpen}
          />
          <ImageGalleryDialog
            article={selectedArticle}
            open={imageGalleryOpen}
            onOpenChange={setImageGalleryOpen}
          />
          <MaterialsLinksDialog
            article={selectedArticle}
            open={materialsLinksOpen}
            onOpenChange={setMaterialsLinksOpen}
          />
          <DeleteConfirmDialog
            article={selectedArticle}
            open={deleteConfirmOpen}
            onOpenChange={setDeleteConfirmOpen}
            onConfirm={confirmDeleteArticle}
          />
        </>
      )}

      {/* AI Help Dialog */}
      <ArticleAIHelpDialog
        open={aiHelpDialogOpen}
        onOpenChange={setAiHelpDialogOpen}
        onArticleCreated={handleAIArticleCreated}
      />
    </div>
  )
}
