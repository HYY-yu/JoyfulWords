"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { Button } from "@/components/ui/base/button"
import { Badge } from "@/components/ui/base/badge"
import { Input } from "@/components/ui/base/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/base/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/base/tooltip"
import { ChevronDownIcon, ChevronUpIcon, SaveIcon, DownloadIcon, Trash2, XIcon, CheckIcon, LoaderIcon } from "lucide-react"
import type { Article, ArticleStatus } from "@/lib/api/articles/types"
import { getStatusVariant, formatDateTime } from "./article-types"
import { useToast } from "@/hooks/use-toast"
import { articlesClient } from "@/lib/api/articles/client"

interface ArticleEditorHeaderProps {
  article?: Article | null
  mode: "create" | "edit"
  content?: string
  onSaveAsNew?: () => void
  onExport?: (format: "markdown" | "html") => void
  onClean?: () => void
  onArticleUpdated?: (article: Article) => void  // 新增回调
}

export function ArticleEditorHeader({
  article,
  mode,
  content = "",
  onSaveAsNew,
  onExport,
  onClean,
  onArticleUpdated,
}: ArticleEditorHeaderProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [showDetails, setShowDetails] = useState(false)

  // 内联编辑状态
  const [isEditing, setIsEditing] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editingData, setEditingData] = useState({
    title: "",
    category: "",
    tags: "",
  })
  const [isSaving, setIsSaving] = useState(false)

  // 初始化编辑数据
  useEffect(() => {
    if (article) {
      setEditingData({
        title: article.title,
        category: article.category || "",
        tags: article.tags || "",
      })
    }
  }, [article])

  // Get status text using i18n
  const getStatusText = (status: ArticleStatus): string => {
    const statusKey = `contentWriting.manager.status.${status}`
    return t(statusKey as any)
  }

  // Calculate word count (strip HTML tags)
  const wordCount = content.replace(/<[^>]*>/g, "").length

  // Determine what to display
  const isCreateMode = mode === "create"
  const hasContent = content.trim().length > 0
  const shouldShowSaveButton = isCreateMode && hasContent && onSaveAsNew

  // 保存元数据
  const handleSaveMetadata = async () => {
    if (!article || isSaving) return

    setIsSaving(true)

    // 根据编辑的字段构建请求
    const updateData: any = {}
    if (editingField === 'category') {
      updateData.category = editingData.category || undefined
    } else if (editingField === 'tags') {
      updateData.tags = editingData.tags || undefined
    } else if (editingField === null) {
      // 保存所有字段（原有逻辑）
      updateData.title = editingData.title
      updateData.category = editingData.category || undefined
      updateData.tags = editingData.tags || undefined
    }

    const result = await articlesClient.updateArticleMetadata(article.id, updateData)

    setIsSaving(false)

    if ("error" in result) {
      toast({
        variant: "destructive",
        title: t("contentWriting.editorHeader.saveMetadataFailed"),
        description: result.error,
      })
      return
    }

    toast({
      title: t("contentWriting.editorHeader.saveMetadataSuccess"),
    })

    // 更新本地 article 对象
    const updatedArticle = {
      ...article,
      ...updateData,
    }

    // 通知父组件
    onArticleUpdated?.(updatedArticle)

    // 退出编辑模式
    setEditingField(null)
    setIsEditing(false)
  }

  // 取消编辑
  const handleCancelEdit = () => {
    if (article) {
      setEditingData({
        title: article.title,
        category: article.category || "",
        tags: article.tags || "",
      })
    }
    setEditingField(null)
    setIsEditing(false)
  }

  if (isCreateMode && !article) {
    // Create mode - no article loaded yet
    return (
      <div className="flex items-center justify-between px-5 py-3">
        {/* Left: Title + Word Count + Mode Badge */}
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold">
                {t("contentWriting.editorHeader.newArticle")}
              </h3>
              <Badge variant="outline" className="text-xs">
                {t("contentWriting.editorHeader.createMode")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {wordCount} 
            </p>
          </div>
        </div>

        {/* Right: Clean + Save + Export (纯图标 + Tooltip) */}
        <div className="flex items-center gap-1">
          {/* Clean Button */}
          {onClean && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={onClean}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>{t("contentWriting.editorHeader.cleanTooltip")}</span>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Save Button */}
          {shouldShowSaveButton && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onSaveAsNew}
                >
                  <SaveIcon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>{t("contentWriting.editorHeader.saveTooltip")}</span>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Export Dropdown */}
          <Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <DownloadIcon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onExport?.("markdown")}>
                  {t("contentWriting.writing.exportMarkdown")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport?.("html")}>
                  {t("contentWriting.writing.exportHtml")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <TooltipContent>
              <span>{t("contentWriting.editorHeader.exportTooltip")}</span>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    )
  }

  if (!article) {
    // Fallback (shouldn't happen)
    return null
  }

  return (
    <div>
      {/* Main Row */}
      <div className="flex items-center justify-between px-5 py-3">
        {/* Left: Title + Word Count + Status Badge */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold truncate">{article.title}</h3>
              <Badge variant={getStatusVariant(article.status)} className="shrink-0 text-xs">
                {getStatusText(article.status)}
              </Badge>
              <Badge variant="outline" className="shrink-0 text-xs">
                {t("contentWriting.editorHeader.editMode")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {wordCount} 字
            </p>
          </div>
        </div>

        {/* Right: Clean + Details Toggle + Export */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Clean Button */}
          {onClean && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={onClean}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>{t("contentWriting.editorHeader.cleanTooltip")}</span>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Details Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="h-8 gap-1.5 px-3"
          >
            {showDetails ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
            <span className="text-xs">
              {showDetails
                ? t("contentWriting.editorHeader.hideDetails")
                : t("contentWriting.editorHeader.showDetails")}
            </span>
          </Button>

          {/* Export Dropdown */}
          <Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <DownloadIcon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onExport?.("markdown")}>
                  {t("contentWriting.writing.exportMarkdown")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport?.("html")}>
                  {t("contentWriting.writing.exportHtml")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <TooltipContent>
              <span>{t("contentWriting.editorHeader.exportTooltip")}</span>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Details Row with Inline Editing */}
      {showDetails && (
        <div className="px-5 pb-3">
          <div className="pt-3 border-t border-border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {/* Created At (只读) */}
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  {t("contentWriting.editorHeader.detailsCreatedAt")}
                </div>
                <div className="text-foreground font-medium">
                  {formatDateTime(article.created_at)}
                </div>
              </div>

              {/* Modified At (只读) */}
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  {t("contentWriting.editorHeader.detailsModifiedAt")}
                </div>
                <div className="text-foreground font-medium">
                  {formatDateTime(article.updated_at)}
                </div>
              </div>

              {/* Category (可编辑) */}
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  {t("contentWriting.editorHeader.detailsCategory")}
                </div>
                {editingField === 'category' ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={editingData.category}
                      onChange={(e) => setEditingData({ ...editingData, category: e.target.value })}
                      className="h-7 text-sm"
                      placeholder={t("contentWriting.editorHeader.categoryPlaceholder")}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveMetadata()
                        } else if (e.key === 'Escape') {
                          handleCancelEdit()
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveMetadata}
                      disabled={isSaving}
                      className="h-7 w-7 p-0"
                    >
                      <CheckIcon className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="h-7 w-7 p-0"
                    >
                      <XIcon className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="text-foreground font-medium cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 inline-block min-w-[50px]"
                    onClick={() => {
                      setEditingData({ ...editingData, category: article.category || "" })
                      setEditingField('category')
                    }}
                  >
                    {article.category || <span className="text-muted-foreground">-</span>}
                  </div>
                )}
              </div>

              {/* Tags (可编辑) */}
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  {t("contentWriting.editorHeader.detailsTags")}
                </div>
                {editingField === 'tags' ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={editingData.tags}
                      onChange={(e) => setEditingData({ ...editingData, tags: e.target.value })}
                      className="h-7 text-sm"
                      placeholder={t("contentWriting.editorHeader.tagsPlaceholder")}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveMetadata()
                        } else if (e.key === 'Escape') {
                          handleCancelEdit()
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveMetadata}
                      disabled={isSaving}
                      className="h-7 w-7 p-0"
                    >
                      <CheckIcon className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="h-7 w-7 p-0"
                    >
                      <XIcon className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="text-foreground font-medium cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 inline-block min-w-[50px]"
                    onClick={() => {
                      setEditingData({ ...editingData, tags: article.tags || "" })
                      setEditingField('tags')
                    }}
                  >
                    {article.tags || <span className="text-muted-foreground">-</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
