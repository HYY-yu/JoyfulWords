"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { Button } from "@/components/ui/base/button"
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
  BookLockIcon,
  DownloadIcon,
  Trash2,
  PencilLineIcon,
  LoaderIcon,
  CheckIcon,
  GitBranchIcon,
  SendIcon,
} from "lucide-react"
import type { Article } from "@/lib/api/articles/types"
import { useToast } from "@/hooks/use-toast"
import { articlesClient } from "@/lib/api/articles/client"
import { VersionDialog } from "./version-dialog"
import { JoyfulThemeSwitcher } from "@/components/theme/joyful-theme-switcher"

export type SaveState = "idle" | "saving" | "saved" | "error"

interface EditorTopBarProps {
  article?: Article | null
  onSave?: (content: string, skipVersion?: boolean) => void
  onExport?: (format: "markdown" | "html") => void
  onClean?: () => void
  onPublish?: () => void
  onArticleUpdated?: (article: Article) => void
  isSaving?: boolean
  isPublishing?: boolean
  saveState?: SaveState
  currentContent?: string
  onVersionRollback?: (versionData: { content: string }) => void
}

export function EditorTopBar({
  article,
  onSave,
  onExport,
  onClean,
  onPublish,
  onArticleUpdated,
  isSaving = false,
  isPublishing = false,
  saveState = "idle",
  currentContent = "",
  onVersionRollback,
}: EditorTopBarProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const router = useRouter()
  const canOpenVersionDialog = Boolean(article && onSave && onVersionRollback)
  const canPublish = Boolean(article && article.status === "draft" && onPublish)

  // 历史版本对话框状态
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false)

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
    return <BookLockIcon className="w-4 h-4" />
  }

  const getSaveTooltip = () => {
    if (saveState === "saving" || isSaving) {
      return t("contentWriting.editorHeader.saving")
    }
    if (saveState === "saved") {
      return t("contentWriting.editorHeader.saved")
    }
    return t("contentWriting.editorHeader.saveAsNewReversion")
  }

  return (
    <>
    <div className="relative z-10 flex h-14 items-center justify-between px-4">
      {/* Left: Back button + Title + Status Badge */}
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {/* Back Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-xl text-[var(--jw-editor-muted)] hover:bg-[var(--jw-accent-soft)] hover:text-[var(--jw-accent)]"
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
          <div className="flex min-w-0 max-w-[520px] flex-1 items-center gap-1">
            <Input
              ref={inputRef}
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="jw-soft-input h-9 text-sm font-semibold"
              disabled={isSavingTitle}
            />
            {isSavingTitle && (
              <LoaderIcon className="w-4 h-4 animate-spin shrink-0 text-muted-foreground" />
            )}
          </div>
        ) : (
          <div className="group/title flex min-w-0 flex-1 flex-col justify-center rounded-lg px-1 py-0.5">
            <div className="min-w-0" title={article?.title}>
              <div className="hidden min-w-0 items-center gap-1.5 text-[11px] font-medium leading-4 text-[var(--jw-editor-muted)] sm:flex">
                <span className="truncate">JoyfulWords / Article Canvas</span>
                {article && (
                  <>
                    <span className="h-1 w-1 shrink-0 rounded-full bg-[var(--jw-accent)]" />
                    <span className="shrink-0">{getStatusText(article.status)}</span>
                  </>
                )}
              </div>
              <div className="flex min-w-0 items-center gap-1.5">
                <h3 className="truncate text-sm font-semibold leading-5 text-[var(--jw-editor-text)]">
                  {article?.title ?? t("contentWriting.editorHeader.newArticle")}
                </h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="h-7 w-7 shrink-0 rounded-lg text-[var(--jw-editor-muted)] opacity-70 hover:bg-[var(--jw-accent-soft)] hover:text-[var(--jw-accent)] group-hover/title:opacity-100"
                      onClick={handleTitleClick}
                    >
                      <PencilLineIcon className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span>{t("contentWriting.manager.editTitleAction")}</span>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: Action Buttons */}
      <div className="flex shrink-0 items-center gap-1.5">
        {/* Clean Button */}
        {onClean && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive"
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

        {/* Theme Dropdown */}
        <JoyfulThemeSwitcher variant="compact" />

        {/* Export Dropdown */}
        <Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-md text-[var(--jw-editor-muted)] hover:bg-[var(--jw-accent-soft)] hover:text-[var(--jw-accent)]"
                >
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

        {/* Version History Button */}
        {canOpenVersionDialog && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[var(--jw-editor-muted)] hover:bg-[var(--jw-accent-soft)] hover:text-[var(--jw-accent)]"
                onClick={() => setIsVersionDialogOpen(true)}
              >
                <GitBranchIcon className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>{t("contentWriting.version.historyVersions")}</span>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Save Button */}
        {onSave && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="h-9 gap-2 rounded-lg bg-[var(--jw-accent)] px-3 text-[var(--jw-accent-foreground)] shadow-[var(--jw-accent-button-shadow)] hover:bg-[var(--jw-accent-hover)]"
                onClick={() => onSave(currentContent)}
                disabled={isSaving || isPublishing || saveState === "saving"}
              >
                {renderSaveIcon()}
                <span>{isSaving || saveState === "saving" ? t("common.saving") : t("common.save")}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>{getSaveTooltip()}</span>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Publish Button */}
        {canPublish && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="h-9 gap-2 rounded-lg border border-[var(--jw-accent)] bg-[var(--jw-control-active-bg)] px-3 text-[var(--jw-accent)] shadow-sm hover:bg-[var(--jw-accent-soft)]"
                onClick={onPublish}
                disabled={isSaving || isPublishing || saveState === "saving"}
              >
                {isPublishing ? (
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <SendIcon className="w-4 h-4" />
                )}
                <span>
                  {isPublishing
                    ? t("contentWriting.editorHeader.publishing")
                    : t("contentWriting.editorHeader.publish")}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>{t("contentWriting.editorHeader.publishTooltip")}</span>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>

    {/* Version Dialog */}
    {article && onSave && onVersionRollback && (
      <VersionDialog
        open={isVersionDialogOpen}
        onOpenChange={setIsVersionDialogOpen}
        articleId={article.id}
        currentContent={currentContent}
        currentTitle={article.title}
        onVersionRollback={onVersionRollback}
        onSave={onSave}
      />
    )}
    </>
  )
}
