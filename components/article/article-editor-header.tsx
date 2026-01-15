"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ChevronDownIcon, ChevronUpIcon, SaveIcon, DownloadIcon, Trash2 } from "lucide-react"
import type { Article, ArticleStatus } from "./article-types"
import { getStatusVariant } from "./article-types"

interface ArticleEditorHeaderProps {
  article?: Article | null
  mode: "create" | "edit"
  content?: string
  onSaveAsNew?: () => void
  onExport?: (format: "markdown" | "html") => void
  onClean?: () => void
}

export function ArticleEditorHeader({
  article,
  mode,
  content = "",
  onSaveAsNew,
  onExport,
  onClean,
}: ArticleEditorHeaderProps) {
  const { t } = useTranslation()
  const [showDetails, setShowDetails] = useState(false)

  // Get status text using i18n
  const getStatusText = (status: ArticleStatus): string => {
    const statusKey = `contentWriting.manager.status${status.charAt(0).toUpperCase() + status.slice(1)}`
    return t(statusKey as any)
  }

  // Calculate word count (strip HTML tags)
  const wordCount = content.replace(/<[^>]*>/g, "").length

  // Determine what to display
  const isCreateMode = mode === "create"
  const isEditMode = mode === "edit"
  const hasContent = content.trim().length > 0
  const shouldShowSaveButton = isCreateMode && hasContent && onSaveAsNew

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
              {wordCount} 字
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

      {/* Details Row */}
      {showDetails && (
        <div className="px-5 pb-3">
          <div className="pt-3 border-t border-border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">{t("contentWriting.editorHeader.detailsCreatedAt")}</div>
                <div className="text-foreground font-medium">{article.createdAt}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">{t("contentWriting.editorHeader.detailsModifiedAt")}</div>
                <div className="text-foreground font-medium">{article.modifiedAt}</div>
              </div>
              {article.category && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">{t("contentWriting.editorHeader.detailsCategory")}</div>
                  <div className="text-foreground font-medium">{article.category}</div>
                </div>
              )}
              {article.tags.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">{t("contentWriting.editorHeader.detailsTags")}</div>
                  <div className="text-foreground font-medium">{article.tags.join(", ")}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
