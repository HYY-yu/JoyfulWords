"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
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
import {
  ArrowLeftIcon,
  SaveIcon,
  DownloadIcon,
  Trash2,
  LoaderIcon,
  CheckIcon,
} from "lucide-react"
import type { Article } from "@/lib/api/articles/types"
import { getStatusVariant } from "./article-types"
import { useToast } from "@/hooks/use-toast"
import { articlesClient } from "@/lib/api/articles/client"

export type SaveState = "idle" | "saving" | "saved" | "error"

interface EditorTopBarProps {
  article?: Article | null
  onSave?: () => void
  onExport?: (format: "markdown" | "html") => void
  onClean?: () => void
  onArticleUpdated?: (article: Article) => void
  isSaving?: boolean
  saveState?: SaveState
}

export function EditorTopBar({
  article,
  onSave,
  onExport,
  onClean,
  onArticleUpdated,
  isSaving = false,
  saveState = "idle",
}: EditorTopBarProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const router = useRouter()

  // Inline title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editingTitle, setEditingTitle] = useState("")
  const [isSavingTitle, setIsSavingTitle] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync title when article changes
  useEffect(() => {
    if (article) {
      setEditingTitle(article.title)
    }
  }, [article])

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingTitle])

  const getStatusText = (status: string): string => {
    const statusKey = `contentWriting.manager.status.${status}`
    return t(statusKey as any)
  }

  const handleTitleClick = () => {
    if (!article) return
    setEditingTitle(article.title)
    setIsEditingTitle(true)
  }

  const handleTitleSave = async () => {
    if (!article || isSavingTitle) return

    const trimmedTitle = editingTitle.trim()
    if (!trimmedTitle) {
      // Revert to original if empty
      setEditingTitle(article.title)
      setIsEditingTitle(false)
      return
    }

    // No change — just exit editing
    if (trimmedTitle === article.title) {
      setIsEditingTitle(false)
      return
    }

    setIsSavingTitle(true)

    const result = await articlesClient.updateArticleMetadata(article.id, {
      title: trimmedTitle,
    })

    setIsSavingTitle(false)

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

    const updatedArticle: Article = {
      ...article,
      title: trimmedTitle,
    }

    onArticleUpdated?.(updatedArticle)
    setIsEditingTitle(false)
  }

  const handleTitleCancel = () => {
    if (article) {
      setEditingTitle(article.title)
    }
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleTitleSave()
    } else if (e.key === "Escape") {
      handleTitleCancel()
    }
  }

  const handleBackClick = () => {
    router.push("/articles")
  }

  // Render save button icon based on saveState
  const renderSaveIcon = () => {
    if (saveState === "saving" || isSaving) {
      return <LoaderIcon className="w-4 h-4 animate-spin" />
    }
    if (saveState === "saved") {
      return <CheckIcon className="w-4 h-4" />
    }
    return <SaveIcon className="w-4 h-4" />
  }

  const getSaveTooltip = () => {
    if (saveState === "saving" || isSaving) {
      return t("contentWriting.editorHeader.saving")
    }
    if (saveState === "saved") {
      return t("contentWriting.editorHeader.saved")
    }
    return t("contentWriting.editorHeader.saveTooltip")
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-background shadow-[0_2px_6px_rgba(0,0,0,0.1)] relative z-10">
      {/* Left: Back button + Title + Status Badge */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Back Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleBackClick}
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>{t("contentWriting.editorHeader.backToList")}</span>
          </TooltipContent>
        </Tooltip>

        {/* Editable Title */}
        {isEditingTitle ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <Input
              ref={inputRef}
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="h-8 text-sm font-semibold"
              disabled={isSavingTitle}
            />
            {isSavingTitle && (
              <LoaderIcon className="w-4 h-4 animate-spin shrink-0 text-muted-foreground" />
            )}
          </div>
        ) : (
          <h3
            className="text-sm font-semibold truncate cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5"
            onClick={handleTitleClick}
            title={article?.title}
          >
            {article?.title ?? t("contentWriting.editorHeader.newArticle")}
          </h3>
        )}

        {/* Status Badge */}
        {article && !isEditingTitle && (
          <Badge
            variant={getStatusVariant(article.status)}
            className="shrink-0 text-xs"
          >
            {getStatusText(article.status)}
          </Badge>
        )}
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-1 shrink-0">
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

        {/* Save Button */}
        {onSave && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onSave}
                disabled={isSaving || saveState === "saving"}
              >
                {renderSaveIcon()}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>{getSaveTooltip()}</span>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
