"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDownIcon, ChevronUpIcon, SaveIcon } from "lucide-react"
import type { Article } from "./article-types"
import { getStatusText, getStatusVariant } from "./article-types"

interface ArticleEditorHeaderProps {
  article?: Article | null
  mode: "create" | "edit"
  content?: string
  onSaveAsNew?: () => void
}

export function ArticleEditorHeader({
  article,
  mode,
  content = "",
  onSaveAsNew,
}: ArticleEditorHeaderProps) {
  const { t } = useTranslation()
  const [showDetails, setShowDetails] = useState(false)

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
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
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

        {/* Right: Save Button (only when has content) */}
        <div className="flex items-center gap-2">
          {shouldShowSaveButton && (
            <Button onClick={onSaveAsNew} size="sm" className="h-8 gap-1.5">
              <SaveIcon className="w-3.5 h-3.5" />
              {t("contentWriting.editorHeader.saveAsNew")}
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (!article) {
    // Fallback (shouldn't happen)
    return null
  }

  return (
    <div className="border-b border-border">
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

        {/* Right: Details Toggle Button */}
        <div className="flex items-center gap-2 shrink-0">
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
        </div>
      </div>

      {/* Details Row */}
      {showDetails && (
        <div className="px-5 pb-3">
          <div className="pt-3 border-t border-border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">创建时间</div>
                <div className="text-foreground font-medium">{article.createdAt}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">修改时间</div>
                <div className="text-foreground font-medium">{article.modifiedAt}</div>
              </div>
              {article.category && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">分类</div>
                  <div className="text-foreground font-medium">{article.category}</div>
                </div>
              )}
              {article.tags.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">标签</div>
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
