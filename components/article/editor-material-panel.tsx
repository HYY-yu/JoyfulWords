"use client"

import { useState, useCallback, useRef, useEffect, type ReactNode } from "react"
import { GripVertical, Search, BookOpen, Trash2, FileText, Newspaper, ImageIcon, X, Check, Upload, Loader2, AlertTriangle, SearchX, Clock3, Inbox, Heart, Pin, PinOff } from "lucide-react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useInfiniteMaterials } from "@/lib/hooks/use-infinite-materials"
import { useInfiniteMaterialFavorites } from "@/lib/hooks/use-infinite-material-favorites"
import { Input } from "@/components/ui/base/input"
import { Button } from "@/components/ui/base/button"
import { Badge } from "@/components/ui/base/badge"
import { Checkbox } from "@/components/ui/base/checkbox"
import { ScrollArea } from "@/components/ui/base/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/base/tabs"
import { Skeleton } from "@/components/ui/base/skeleton"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/base/dialog"
import { Textarea } from "@/components/ui/base/textarea"
import { cn, formatDate } from "@/lib/utils"
import type { CheckedState } from "@radix-ui/react-checkbox"
import type { Material, MaterialType, MaterialFavorite, MaterialParseStatus, MaterialSearchDetailResponse, MaterialSearchResultItem } from "@/lib/api/materials/types"
import { materialsClient, uploadFileToPresignedUrl } from "@/lib/api/materials/client"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/base/label"
import { markdownToHTML } from "@/lib/tiptap-utils"
import { MATERIAL_IMAGE_DATA_TRANSFER_TYPE } from "@/lib/editor-drag-drop"

// ==================== MaterialCard ====================

type MaterialCardItem = Pick<Material, "id" | "title" | "material_type" | "content" | "source_url" | "parse_status" | "parse_failed_code" | "markdown_url">

interface MaterialCardProps {
  material: MaterialCardItem
  leftActions?: ReactNode
}

function MaterialIconButton({
  icon,
  label,
  onClick,
  active = false,
  destructive = false,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  active?: boolean
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onClick()
      }}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
        destructive
          ? "border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10"
          : active
            ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
            : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {icon}
    </button>
  )
}

function MaterialCard({ material, leftActions }: MaterialCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [markdownHTML, setMarkdownHTML] = useState("")
  const [markdownLoading, setMarkdownLoading] = useState(false)
  const [markdownError, setMarkdownError] = useState("")
  const isImage = material.material_type === "image"
  const imageUrl = isImage ? material.content : null
  const isInfoFile = material.material_type === "info" && Boolean(material.markdown_url || material.parse_status)
  const parseStatusLabel =
    material.parse_status === "parsing"
      ? "解析中"
      : material.parse_status === "success"
        ? "解析完成"
        : material.parse_status === "failed"
          ? "解析失败"
          : ""

  useEffect(() => {
    if (!previewOpen || !isInfoFile || material.parse_status !== "success" || markdownHTML || markdownLoading) {
      return
    }

    let cancelled = false
    setMarkdownLoading(true)
    setMarkdownError("")

    const loadMarkdown = async () => {
      if (material.content) {
        return material.content
      }

      if (!material.markdown_url) {
        throw new Error("Markdown result is empty")
      }

      const response = await fetch(material.markdown_url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.text()
    }

    loadMarkdown()
      .then(async (markdown) => {
        const html = await markdownToHTML(markdown)
        if (!cancelled) setMarkdownHTML(html)
      })
      .catch((error) => {
        if (!cancelled) setMarkdownError(error instanceof Error ? error.message : "Failed to load markdown")
      })
      .finally(() => {
        if (!cancelled) setMarkdownLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isInfoFile, markdownHTML, markdownLoading, material.content, material.markdown_url, material.parse_status, previewOpen])

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.effectAllowed = "copy"
      if (isImage && imageUrl) {
        e.dataTransfer.setData(MATERIAL_IMAGE_DATA_TRANSFER_TYPE, imageUrl)
      } else {
        e.dataTransfer.setData("text/plain", material.content || material.title)
      }
    },
    [material.content, material.title, isImage, imageUrl]
  )

  return (
    <>
      <div
        draggable
        onDragStart={handleDragStart}
        className={cn(
          isImage
            ? "group flex h-full min-w-0 w-full max-w-full cursor-grab items-start gap-2 overflow-hidden rounded-md border border-border bg-card p-2"
            : "group flex min-w-0 w-full max-w-full cursor-grab items-start gap-2 rounded-md border border-border bg-card p-3",
          "hover:border-primary/50 hover:bg-accent/50 active:cursor-grabbing",
          "transition-colors duration-150"
        )}
      >
        <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
          {leftActions}
          <GripVertical className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground" />
        </div>

        {isImage ? (
          <div className="min-w-0 flex-1">
            <p className="mb-2 line-clamp-2 min-w-0 text-sm font-medium leading-tight">{material.title}</p>
            {imageUrl ? (
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="block w-full overflow-hidden rounded-md border border-border cursor-pointer hover:opacity-80 transition-opacity"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={material.title}
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
              </button>
            ) : null}
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <p className="mb-1 truncate text-sm font-medium leading-tight">{material.title}</p>
            {parseStatusLabel ? (
              <Badge
                variant="outline"
                className={cn(
                  "mb-2 h-5 rounded px-1.5 text-[11px]",
                  material.parse_status === "parsing" && "border-blue-200 bg-blue-50 text-blue-700",
                  material.parse_status === "success" && "border-green-200 bg-green-50 text-green-700",
                  material.parse_status === "failed" && "border-red-200 bg-red-50 text-red-700"
                )}
              >
                {parseStatusLabel}
              </Badge>
            ) : null}
            {material.content ? (
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="w-full text-left cursor-pointer hover:opacity-80 transition-opacity"
              >
                <p className="line-clamp-4 text-xs leading-relaxed text-muted-foreground">
                  {isInfoFile
                    ? material.parse_status === "success"
                      ? material.content || material.markdown_url
                      : material.content
                    : material.content}
                </p>
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        {isImage && imageUrl ? (
          <DialogContent className="max-w-3xl p-2 border-none bg-transparent shadow-none [&>button]:hidden">
            <DialogTitle className="sr-only">{material.title}</DialogTitle>
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="absolute -top-10 right-0 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={material.title}
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
            <p className="mt-1 text-center text-sm text-white/80">{material.title}</p>
          </DialogContent>
        ) : (
          <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <DialogTitle className="text-base font-semibold">{material.title}</DialogTitle>
            <ScrollArea className="flex-1 mt-2">
              {isInfoFile ? (
                <div className="pr-4 text-sm leading-relaxed">
                  {parseStatusLabel ? (
                    <Badge variant="outline" className="mb-3 rounded px-1.5 text-[11px]">
                      {parseStatusLabel}
                    </Badge>
                  ) : null}
                  {material.parse_status === "success" && markdownHTML ? (
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: markdownHTML }}
                    />
                  ) : material.parse_status === "success" && markdownLoading ? (
                    <p className="text-muted-foreground">Markdown 加载中...</p>
                  ) : material.parse_status === "success" && markdownError ? (
                    <p className="whitespace-pre-wrap text-muted-foreground">{material.content || material.markdown_url}</p>
                  ) : material.parse_status === "failed" ? (
                    <p className="text-destructive">解析失败{material.parse_failed_code ? `（${material.parse_failed_code}）` : ""}</p>
                  ) : (
                    <p className="whitespace-pre-wrap text-muted-foreground">{material.content}</p>
                  )}
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed pr-4">
                  {material.content}
                </p>
              )}
            </ScrollArea>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}

// ==================== MaterialCardSkeleton ====================

function MaterialCardSkeleton() {
  return (
    <div className="flex min-w-0 w-full max-w-full items-start gap-2 rounded-md border border-border p-3">
      <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
        <Skeleton className="h-7 w-7 rounded-md" />
        <Skeleton className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  )
}

// ==================== SearchTab ====================

const SEARCH_TYPE_TABS = [
  { id: "info" as MaterialType, i18nKey: "typeInfo", icon: FileText },
  { id: "news" as MaterialType, i18nKey: "typeNews", icon: Newspaper },
  { id: "image" as MaterialType, i18nKey: "typeImage", icon: ImageIcon },
] as const

const SEARCH_POLL_INTERVAL_MS = 3000
const SEARCH_MAX_FAIL_COUNT = 3

interface PersistedMaterialSearchTask {
  logId: number
  articleId: number
  userId: number
  query: string
  materialType: MaterialType
  createdAt: string
}

interface SearchTabProps {
  articleId: number | null
  userId: number | null
  searchType: MaterialType
  onSearchTypeChange: (type: MaterialType) => void
  onSearchLockedChange?: (locked: boolean) => void
  onImportSuccess?: (materialType: MaterialType) => void
}

interface EditableSearchResultDraft {
  title: string
  content: string
}

function buildMaterialSearchStorageKey(userId: number, articleId: number) {
  return `${userId}_${articleId}`
}

function loadPersistedMaterialSearchTask(userId: number, articleId: number): PersistedMaterialSearchTask | null {
  try {
    const raw = localStorage.getItem(buildMaterialSearchStorageKey(userId, articleId))
    if (!raw) return null
    return JSON.parse(raw) as PersistedMaterialSearchTask
  } catch {
    return null
  }
}

function savePersistedMaterialSearchTask(task: PersistedMaterialSearchTask) {
  localStorage.setItem(
    buildMaterialSearchStorageKey(task.userId, task.articleId),
    JSON.stringify(task)
  )
}

function clearPersistedMaterialSearchTask(userId: number, articleId: number) {
  localStorage.removeItem(buildMaterialSearchStorageKey(userId, articleId))
}

function buildSelectableUrl(item: MaterialSearchResultItem) {
  return item.url
}

function buildImageSelectableUrl(url: string) {
  return url
}

function SearchStatusBanner({
  status,
  query,
}: {
  status: "triggered" | "polling"
  query: string
}) {
  const { t } = useTranslation()

  return (
    <div className="rounded-2xl border border-primary/15 bg-primary/[0.06] px-3 py-2.5">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Clock3 className="h-4 w-4 animate-pulse" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            {status === "triggered"
              ? t("contentWriting.materialPanel.searchTriggered")
              : t("contentWriting.materialPanel.searching")}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {t("contentWriting.materialPanel.searchingHint", { query })}
          </p>
        </div>
      </div>
    </div>
  )
}

function SearchEmptyState() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-border/80 bg-gradient-to-br from-muted/60 via-background to-background px-5 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Search className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-foreground">
        {t("contentWriting.materialPanel.searchInitialHint")}
      </p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {t("contentWriting.materialPanel.searchInitialDescription")}
      </p>
    </div>
  )
}

function SearchCardShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-[8px] border border-[var(--jw-task-card-border)] bg-[var(--jw-task-card-bg)] shadow-[0_22px_48px_-34px_rgba(0,0,0,0.32)]",
        className
      )}
    >
      {children}
    </div>
  )
}

function SearchStateCard({
  icon,
  title,
  description,
  query,
  onDelete,
}: {
  icon: ReactNode
  title: string
  description: string
  query: string
  onDelete: () => void
}) {
  const { t } = useTranslation()

  return (
    <SearchCardShell className="overflow-hidden">
      <div className="border-b border-[var(--jw-header-divider)] px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="jw-icon-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
              {icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label={t("contentWriting.materialPanel.deleteCard")}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="px-4 py-4">
        <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-[11px] font-medium">
          {query}
        </Badge>
      </div>
    </SearchCardShell>
  )
}

function SearchResultListItem({
  item,
  draft,
  checked,
  onCheckedChange,
  onDraftChange,
}: {
  item: MaterialSearchResultItem
  draft: EditableSearchResultDraft
  checked: boolean
  onCheckedChange: (checked: CheckedState) => void
  onDraftChange: (draft: EditableSearchResultDraft) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="flex gap-3 rounded-lg border border-[var(--jw-task-card-border)] bg-[var(--jw-task-card-bg)] p-3 transition-colors hover:border-[var(--jw-action-hover-border)] hover:bg-[var(--jw-task-card-hover-bg)]">
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} className="mt-1" />
      <div className="min-w-0 flex-1 space-y-2">
        <Input
          value={draft.title}
          onChange={(event) => onDraftChange({ ...draft, title: event.target.value })}
          className="h-8 text-sm font-semibold"
        />
        {item.published_date ? (
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
            {t("contentWriting.materialPanel.publishedAt")}: {formatDate(item.published_date)}
          </p>
        ) : null}
        <Textarea
          value={draft.content}
          onChange={(event) => onDraftChange({ ...draft, content: event.target.value })}
          className="min-h-[112px] resize-y text-xs leading-5"
        />
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("contentWriting.materialPanel.viewSource")}
          </a>
        ) : null}
      </div>
    </div>
  )
}

function SearchImageItem({
  url,
  checked,
  onCheckedChange,
  onOpenPreview,
}: {
  url: string
  checked: boolean
  onCheckedChange: (checked: CheckedState) => void
  onOpenPreview: (url: string) => void
}) {
  const { t } = useTranslation()

  return (
    <label className="group relative cursor-pointer overflow-hidden rounded-lg border border-[var(--jw-task-card-border)] bg-[var(--jw-task-card-bg)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={t("contentWriting.materialPanel.imageResultAlt")} className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" loading="lazy" />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
        <Checkbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="bg-[var(--jw-control-active-bg)] shadow-sm"
        />
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onOpenPreview(url)
          }}
          className="rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          {t("contentWriting.materialPanel.openImage")}
        </button>
      </div>
    </label>
  )
}

function SearchResultCard({
  result,
  selectedUrls,
  resultDrafts,
  importLoading,
  onToggleUrl,
  onDraftChange,
  onDelete,
  onImport,
}: {
  result: MaterialSearchDetailResponse
  selectedUrls: Set<string>
  resultDrafts: Record<string, EditableSearchResultDraft>
  importLoading: boolean
  onToggleUrl: (url: string, checked: boolean) => void
  onDraftChange: (url: string, draft: EditableSearchResultDraft) => void
  onDelete: () => void
  onImport: () => void
}) {
  const { t } = useTranslation()
  const aiResultItems = result.ai_result?.ai_result ?? []
  const imageItems = result.ai_result?.images ?? []
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const selectedCount = selectedUrls.size
  const importDisabled = selectedCount === 0 || importLoading

  return (
    <>
      <SearchCardShell className="overflow-hidden">
        <div className="jw-panel-header px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                {t("contentWriting.materialPanel.resultCardTitle")}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1 self-start">
              <Button
                size="icon-sm"
                className="h-8 w-8"
                onClick={onImport}
                disabled={importDisabled}
                aria-label={t("contentWriting.materialPanel.importToLibrary")}
                title={t("contentWriting.materialPanel.importToLibrary")}
              >
                {importLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Inbox className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8"
                onClick={onDelete}
                aria-label={t("contentWriting.materialPanel.deleteCard")}
                title={t("contentWriting.materialPanel.deleteCard")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-4 py-4">
          {result.material_type === "info" && result.ai_result?.ai_answer ? (
            <div className="rounded-lg border border-[var(--jw-task-card-border)] bg-[var(--jw-control-bg)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
                {t("contentWriting.materialPanel.aiSummary")}
              </p>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
                {result.ai_result.ai_answer}
              </p>
            </div>
          ) : null}

          {result.material_type === "image" ? (
            <div className="grid grid-cols-2 gap-3">
              {imageItems.map((url) => (
                <SearchImageItem
                  key={url}
                  url={url}
                  checked={selectedUrls.has(buildImageSelectableUrl(url))}
                  onCheckedChange={(checked) => onToggleUrl(buildImageSelectableUrl(url), checked === true)}
                  onOpenPreview={setPreviewImageUrl}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {aiResultItems.map((item) => (
                <SearchResultListItem
                  key={item.url}
                  item={item}
                  draft={resultDrafts[item.url] ?? { title: item.title, content: item.content }}
                  checked={selectedUrls.has(buildSelectableUrl(item))}
                  onCheckedChange={(checked) => onToggleUrl(buildSelectableUrl(item), checked === true)}
                  onDraftChange={(draft) => onDraftChange(item.url, draft)}
                />
              ))}
            </div>
          )}
        </div>
      </SearchCardShell>

      <Dialog open={previewImageUrl !== null} onOpenChange={(open) => !open && setPreviewImageUrl(null)}>
        <DialogContent className="max-w-4xl">
          <DialogTitle>{t("imageGeneration.logs.preview.title")}</DialogTitle>
          <div className="flex items-center justify-center p-2 pt-4">
            {previewImageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={previewImageUrl}
                alt={t("contentWriting.materialPanel.imageResultAlt")}
                className="max-h-[70vh] w-full rounded-lg object-contain"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function SearchTab({
  articleId,
  userId,
  searchType,
  onSearchTypeChange,
  onSearchLockedChange,
  onImportSuccess,
}: SearchTabProps) {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [searchText, setSearchText] = useState("")
  const [activeTask, setActiveTask] = useState<PersistedMaterialSearchTask | null>(null)
  const [detail, setDetail] = useState<MaterialSearchDetailResponse | null>(null)
  const [bannerStatus, setBannerStatus] = useState<"triggered" | "polling" | null>(null)
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())
  const [resultDrafts, setResultDrafts] = useState<Record<string, EditableSearchResultDraft>>({})
  const [isImporting, setIsImporting] = useState(false)
  const [isTriggeringSearch, setIsTriggeringSearch] = useState(false)

  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const networkFailCountRef = useRef(0)
  const searchTriggerLockedRef = useRef(false)
  const activeSearchLogIdRef = useRef<number | null>(null)
  const searchRequestSeqRef = useRef(0)

  const persistTask = useCallback(
    (task: PersistedMaterialSearchTask | null) => {
      if (!userId || !articleId) return

      if (task) {
        savePersistedMaterialSearchTask(task)
      } else {
        clearPersistedMaterialSearchTask(userId, articleId)
      }
    },
    [articleId, userId]
  )

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
      pollingRef.current = null
    }
    networkFailCountRef.current = 0
  }, [])

  const clearSearchTask = useCallback(() => {
    console.info("[MaterialSearch] clearing active card")
    searchRequestSeqRef.current += 1
    searchTriggerLockedRef.current = false
    activeSearchLogIdRef.current = null
    stopPolling()
    setActiveTask(null)
    setDetail(null)
    setBannerStatus(null)
    setSelectedUrls(new Set())
    setResultDrafts({})
    setIsTriggeringSearch(false)
    if (userId && articleId) {
      clearPersistedMaterialSearchTask(userId, articleId)
    }
  }, [articleId, stopPolling, userId])

  const resetSelections = useCallback(() => {
    setSelectedUrls(new Set())
  }, [])

  const handlePollResult = useCallback(
    async (task: PersistedMaterialSearchTask) => {
      console.debug("[MaterialSearch] polling detail", { logId: task.logId, query: task.query })
      const response = await materialsClient.getSearchLogDetail(task.logId)
      if (activeSearchLogIdRef.current !== task.logId) {
        console.debug("[MaterialSearch] ignoring stale poll result", {
          logId: task.logId,
          activeLogId: activeSearchLogIdRef.current,
        })
        return
      }

      if ("error" in response) {
        networkFailCountRef.current += 1
        console.warn("[MaterialSearch] detail poll failed", {
          logId: task.logId,
          failCount: networkFailCountRef.current,
          error: response.error,
        })

        if (networkFailCountRef.current >= SEARCH_MAX_FAIL_COUNT) {
          stopPolling()
          clearSearchTask()
          toast({
            variant: "destructive",
            title: t("contentWriting.materialPanel.searchFailed"),
            description: response.error,
          })
          return
        }

        pollingRef.current = setTimeout(() => {
          void handlePollResult(task)
        }, SEARCH_POLL_INTERVAL_MS)
        return
      }

      networkFailCountRef.current = 0
      setDetail(response)
      if (response.status === "success") {
        const nextDrafts: Record<string, EditableSearchResultDraft> = {}
        for (const item of response.ai_result?.ai_result ?? []) {
          nextDrafts[item.url] = {
            title: item.title,
            content: item.content,
          }
        }
        setResultDrafts(nextDrafts)
      }

      if (response.status === "doing") {
        setBannerStatus("polling")
        pollingRef.current = setTimeout(() => {
          void handlePollResult(task)
        }, SEARCH_POLL_INTERVAL_MS)
        return
      }

      stopPolling()
      setBannerStatus(null)
      resetSelections()
      console.info("[MaterialSearch] search finished", {
        logId: task.logId,
        status: response.status,
      })
    },
    [clearSearchTask, resetSelections, stopPolling, t, toast]
  )

  useEffect(() => {
    if (!userId || !articleId) return

    const storedTask = loadPersistedMaterialSearchTask(userId, articleId)
    if (!storedTask) return

    console.info("[MaterialSearch] restoring task from localStorage", {
      articleId,
      userId,
      logId: storedTask.logId,
    })
    setActiveTask(storedTask)
    activeSearchLogIdRef.current = storedTask.logId
    searchTriggerLockedRef.current = true
    onSearchTypeChange(storedTask.materialType)
    setSearchText(storedTask.query)
    setBannerStatus("polling")
    void handlePollResult(storedTask)

    return stopPolling
  }, [articleId, handlePollResult, onSearchTypeChange, stopPolling, userId])

  useEffect(() => stopPolling, [stopPolling])

  useEffect(() => {
    onSearchLockedChange?.(Boolean(activeTask) || isTriggeringSearch)
  }, [activeTask, isTriggeringSearch, onSearchLockedChange])

  const handleSearch = useCallback(async () => {
    const trimmed = searchText.trim()
    if (!trimmed || !userId || !articleId || activeTask || searchTriggerLockedRef.current) return

    const requestSeq = searchRequestSeqRef.current + 1
    searchRequestSeqRef.current = requestSeq
    searchTriggerLockedRef.current = true
    setIsTriggeringSearch(true)
    stopPolling()
    setDetail(null)
    setSelectedUrls(new Set())
    setResultDrafts({})

    const nextTaskBase = {
      articleId,
      userId,
      query: trimmed,
      materialType: searchType,
      createdAt: new Date().toISOString(),
    }

    console.info("[MaterialSearch] triggering v2 search", {
      articleId,
      userId,
      materialType: searchType,
      query: trimmed,
    })

    const searchResult = await materialsClient.searchV2(searchType, trimmed)
    if (searchRequestSeqRef.current !== requestSeq) {
      console.debug("[MaterialSearch] ignoring stale trigger response", {
        materialType: searchType,
        query: trimmed,
      })
      return
    }

    if ("error" in searchResult) {
      console.warn("[MaterialSearch] trigger failed", {
        materialType: searchType,
        query: trimmed,
        error: searchResult.error,
      })
      toast({
        variant: "destructive",
        title: t("contentWriting.materialPanel.searchFailed"),
        description: searchResult.error,
      })
      searchTriggerLockedRef.current = false
      setIsTriggeringSearch(false)
      setBannerStatus(null)
      return
    }

    const task: PersistedMaterialSearchTask = {
      ...nextTaskBase,
      logId: searchResult.id,
    }

    activeSearchLogIdRef.current = task.logId
    persistTask(task)
    setActiveTask(task)
    setBannerStatus("triggered")
    setIsTriggeringSearch(false)
    void handlePollResult(task)
  }, [activeTask, articleId, handlePollResult, persistTask, searchText, searchType, stopPolling, t, toast, userId])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        void handleSearch()
      }
    },
    [handleSearch]
  )

  const handleToggleUrl = useCallback((url: string, checked: boolean) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(url)
      } else {
        next.delete(url)
      }
      return next
    })
  }, [])

  const handleDraftChange = useCallback((url: string, draft: EditableSearchResultDraft) => {
    setResultDrafts((prev) => ({
      ...prev,
      [url]: draft,
    }))
  }, [])

  const handleImport = useCallback(async () => {
    if (!activeTask || selectedUrls.size === 0) return

    console.info("[MaterialSearch] importing selected results", {
      logId: activeTask.logId,
      count: selectedUrls.size,
    })
    setIsImporting(true)

    const result = await materialsClient.addFromLog({
      material_log_id: activeTask.logId,
      article_id: activeTask.articleId,
      urls: Array.from(selectedUrls),
      items: Array.from(selectedUrls)
        .map((url) => {
          const draft = resultDrafts[url]
          if (!draft) return null
          return {
            url,
            title: draft.title,
            content: draft.content,
          }
        })
        .filter((item): item is { url: string; title: string; content: string } => Boolean(item)),
    })

    if ("error" in result) {
      console.warn("[MaterialSearch] import failed", {
        logId: activeTask.logId,
        error: result.error,
      })
      toast({
        variant: "destructive",
        title: t("contentWriting.materialPanel.importFailed"),
        description: result.error,
      })
      setIsImporting(false)
      return
    }

    toast({
      title: t("contentWriting.materialPanel.importSuccess"),
      description: t("contentWriting.materialPanel.importSuccessCount", { count: result.ids.length }),
    })
    onImportSuccess?.(activeTask.materialType)
    clearSearchTask()
    setIsImporting(false)
  }, [activeTask, clearSearchTask, onImportSuccess, resultDrafts, selectedUrls, t, toast])

  const isSearchLocked = Boolean(activeTask) || isTriggeringSearch

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-3">
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("contentWriting.materialPanel.searchInputPlaceholder")}
              className="h-9"
              disabled={isSearchLocked}
            />
          </div>
          <Button
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => void handleSearch()}
            disabled={isSearchLocked || !searchText.trim()}
          >
            {isSearchLocked ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {bannerStatus && activeTask ? (
          <SearchStatusBanner status={bannerStatus} query={activeTask.query} />
        ) : null}
      </div>

      <ScrollArea className="min-h-0 flex-1 min-w-0 [&_[data-slot=scroll-area-scrollbar]]:hidden">
        <div className="flex min-w-0 flex-col gap-3 px-0.5">
          {!activeTask ? <SearchEmptyState /> : null}

          {activeTask && detail?.status === "success" ? (
            <SearchResultCard
              result={detail}
              selectedUrls={selectedUrls}
              resultDrafts={resultDrafts}
              importLoading={isImporting}
              onToggleUrl={handleToggleUrl}
              onDraftChange={handleDraftChange}
              onDelete={clearSearchTask}
              onImport={() => void handleImport()}
            />
          ) : null}

          {activeTask && detail?.status === "failed" ? (
            <SearchStateCard
              icon={<AlertTriangle className="h-5 w-5" />}
              title={t("contentWriting.materialPanel.failedCardTitle")}
              description={t("contentWriting.materialPanel.failedCardDescription")}
              query={detail.query}
              onDelete={clearSearchTask}
            />
          ) : null}

          {activeTask && detail?.status === "nodata" ? (
            <SearchStateCard
              icon={<SearchX className="h-5 w-5" />}
              title={t("contentWriting.materialPanel.noDataCardTitle")}
              description={t("contentWriting.materialPanel.noDataCardDescription")}
              query={detail.query}
              onDelete={clearSearchTask}
            />
          ) : null}

          <div className="h-10 shrink-0" aria-hidden="true" />
        </div>
      </ScrollArea>
    </div>
  )
}

// ==================== LibraryTab ====================

function toMaterialCardItem(material: Material | MaterialFavorite): MaterialCardItem {
  return {
    id: "material_id" in material ? material.material_id : material.id,
    title: material.title,
    material_type: material.material_type,
    content: material.content,
    source_url: material.source_url,
    parse_status: material.parse_status,
    parse_failed_code: material.parse_failed_code,
    markdown_url: material.markdown_url,
  }
}

const CATEGORY_TABS = [
  { id: "info" as MaterialType, i18nKey: "info", icon: FileText },
  { id: "news" as MaterialType, i18nKey: "news", icon: Newspaper },
  { id: "image" as MaterialType, i18nKey: "image", icon: ImageIcon },
] as const

function FavoriteEmptyState() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-border/80 bg-gradient-to-br from-muted/60 via-background to-background px-5 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Heart className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-foreground">
        {t("contentWriting.materialPanel.emptyFavorites")}
      </p>
    </div>
  )
}

function LibraryTab({
  articleId,
  activeCategory,
  onFavorite,
  onDelete,
}: {
  articleId: number | null
  activeCategory: MaterialType
  onFavorite: (material: Material) => void
  onDelete: (material: Material) => void
}) {
  const { t } = useTranslation()
  const { materials: allMaterials, isLoading, hasMore, observerTarget, reset } = useInfiniteMaterials({
    articleId: articleId ?? undefined,
    type: activeCategory,
    pageSize: 20,
    enabled: Boolean(articleId),
  })

  const materials = allMaterials
  const hasParsingMaterial = materials.some((material) => material.parse_status === "parsing")

  useEffect(() => {
    if (activeCategory !== "info" || !hasParsingMaterial) return
    const timer = window.setInterval(() => reset(), 5000)
    return () => window.clearInterval(timer)
  }, [activeCategory, hasParsingMaterial, reset])

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-3">
      {/* Materials list */}
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <div className="h-full min-w-0 overflow-y-auto pr-2">
          <div className={cn(
            "min-w-0 pb-4",
            activeCategory === "image" ? "grid grid-cols-2 gap-2" : "flex flex-col gap-2"
          )}>
            {materials.map((material) => (
              <MaterialCard
                key={material.id}
                material={toMaterialCardItem(material)}
                leftActions={(
                  <>
                    <MaterialIconButton
                      icon={<Heart className={cn("h-3.5 w-3.5", material.is_favorite && "fill-current")} />}
                      label={material.is_favorite
                        ? t("contentWriting.materialPanel.favoritedAction")
                        : t("contentWriting.materialPanel.favoriteAction")}
                      onClick={() => onFavorite(material)}
                      active={material.is_favorite}
                    />
                    <MaterialIconButton
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                      label={t("contentWriting.materialPanel.libraryDeleteAction")}
                      onClick={() => onDelete(material)}
                      destructive
                    />
                  </>
                )}
              />
            ))}

            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <MaterialCardSkeleton key={`lib-skeleton-${i}`} />
              ))}

            {hasMore && (
              <div
                ref={observerTarget}
                className={cn("h-4", activeCategory === "image" ? "col-span-2" : "")}
              />
            )}

            {!isLoading && materials.length === 0 && (
              <div className={cn(
                "flex flex-col items-center justify-center py-6 text-center",
                activeCategory === "image" ? "col-span-2" : ""
              )}>
                <BookOpen className="mb-2 h-7 w-7 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {t("contentWriting.materialPanel.emptyLibrary")}
                </p>
              </div>
            )}

            <div className={cn("h-8 shrink-0", activeCategory === "image" ? "col-span-2" : "")} aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  )
}

function FavoriteList({
  onFavoritesChanged,
}: {
  onFavoritesChanged: () => void
}) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { favorites, isLoading, hasMore, observerTarget } = useInfiniteMaterialFavorites({
    pageSize: 20,
    enabled: true,
  })

  const handleTogglePin = useCallback(async (favorite: MaterialFavorite) => {
    const action = favorite.is_pinned ? materialsClient.unpinFavorite : materialsClient.pinFavorite
    const result = await action(favorite.id)

    if ("error" in result) {
      toast({
        variant: "destructive",
        title: favorite.is_pinned
          ? t("contentWriting.materialPanel.unpinFailed")
          : t("contentWriting.materialPanel.pinFailed"),
        description: result.error,
      })
      return
    }

    toast({
      title: favorite.is_pinned
        ? t("contentWriting.materialPanel.unpinSuccess")
        : t("contentWriting.materialPanel.pinSuccess"),
    })
    onFavoritesChanged()
  }, [onFavoritesChanged, t, toast])

  const handleDelete = useCallback(async (favorite: MaterialFavorite) => {
    const result = await materialsClient.deleteFavorite(favorite.id)

    if ("error" in result) {
      toast({
        variant: "destructive",
        title: t("contentWriting.materialPanel.favoriteDeleteFailed"),
        description: result.error,
      })
      return
    }

    toast({
      title: t("contentWriting.materialPanel.favoriteDeleteSuccess"),
    })
    onFavoritesChanged()
  }, [onFavoritesChanged, t, toast])

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-3">
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <div className="h-full min-w-0 overflow-y-auto pr-2">
          <div className="flex min-w-0 flex-col gap-2 pb-4">
            {favorites.map((favorite) => (
              <MaterialCard
                key={favorite.id}
                material={toMaterialCardItem(favorite)}
                leftActions={(
                  <>
                    <MaterialIconButton
                      icon={favorite.is_pinned
                        ? <PinOff className="h-3.5 w-3.5" />
                        : <Pin className="h-3.5 w-3.5" />}
                      label={favorite.is_pinned
                        ? t("contentWriting.materialPanel.unpinAction")
                        : t("contentWriting.materialPanel.pinAction")}
                      onClick={() => void handleTogglePin(favorite)}
                      active={favorite.is_pinned}
                    />
                    <MaterialIconButton
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                      label={t("contentWriting.materialPanel.favoriteDeleteAction")}
                      onClick={() => void handleDelete(favorite)}
                      destructive
                    />
                  </>
                )}
              />
            ))}

            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <MaterialCardSkeleton key={`favorite-skeleton-${i}`} />
              ))}

            {hasMore && (
              <div ref={observerTarget} className="h-4" />
            )}

            {!isLoading && favorites.length === 0 && <FavoriteEmptyState />}

            <div className="h-8 shrink-0" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== UploadDialog ====================

interface UploadDialogProps {
  articleId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadSuccess?: () => void
}

const DATA_FILE_ACCEPT = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jp2",
  "image/webp",
  "image/gif",
  "image/bmp",
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".jp2",
  ".webp",
  ".gif",
  ".bmp",
  ".docx",
  ".pptx",
  ".xlsx",
].join(",")

const IMAGE_FILE_ACCEPT = "image/png,image/jpeg,image/jpg,image/jp2,image/webp,image/gif,image/bmp"

const SUPPORTED_DATA_EXTENSIONS = new Set(["pdf", "png", "jpg", "jpeg", "jp2", "webp", "gif", "bmp", "docx", "pptx", "xlsx"])
const UPLOAD_PARSE_POLL_INTERVAL_MS = 3000

function getFileExtension(file: File) {
  return file.name.split(".").pop()?.toLowerCase() ?? ""
}

function UploadDialog({ articleId, open, onOpenChange, onUploadSuccess }: UploadDialogProps) {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [title, setTitle] = useState("")
  const [materialType, setMaterialType] = useState<"info" | "image">("info")
  const [dataFile, setDataFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isAddingToMaterials, setIsAddingToMaterials] = useState(false)
  const [parseTaskId, setParseTaskId] = useState("")
  const [parseStatus, setParseStatus] = useState<MaterialParseStatus>("")
  const [parseError, setParseError] = useState("")
  const [parsedMarkdown, setParsedMarkdown] = useState("")
  const parsePollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({})

  const resetForm = useCallback(() => {
    if (parsePollTimerRef.current) {
      clearTimeout(parsePollTimerRef.current)
      parsePollTimerRef.current = null
    }
    setTitle("")
    setMaterialType("info")
    setDataFile(null)
    setImageFile(null)
    setImagePreview("")
    setIsUploading(false)
    setIsAddingToMaterials(false)
    setParseTaskId("")
    setParseStatus("")
    setParseError("")
    setParsedMarkdown("")
    setErrors({})
  }, [])

  const handleDataFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      if (!SUPPORTED_DATA_EXTENSIONS.has(getFileExtension(file))) {
        setErrors({ content: t("contentWriting.materialPanel.uploadDataInvalid") })
        return
      }
      if (file.size > 50 * 1024 * 1024) {
        setErrors({ content: t("contentWriting.materialPanel.uploadDataTooLarge") })
        return
      }

      setDataFile(file)
      if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ""))
      setParseTaskId("")
      setParseStatus("")
      setParseError("")
      setParsedMarkdown("")
      setErrors({})
    },
    [t, title]
  )

  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      if (!file.type.startsWith("image/")) {
        setErrors({ content: t("contentWriting.materials.errors.invalidImageType") })
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ content: t("contentWriting.materials.errors.imageTooLarge") })
        return
      }

      setImageFile(file)
      setErrors({})
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    },
    [t]
  )

  const pollParsePreview = useCallback(
    async (taskId: string) => {
      const result = await materialsClient.getParsePreview(taskId)

      if ("error" in result) {
        setParseStatus("failed")
        setParseError(result.error)
        setIsUploading(false)
        return
      }

      setParseStatus(result.parse_status)
      setParseError(result.error_message || "")

      if (result.parse_status === "success") {
        setParsedMarkdown(result.content)
        setIsUploading(false)
        return
      }

      if (result.parse_status === "failed") {
        setIsUploading(false)
        setParseError(
          result.error_message ||
            (result.parse_failed_code
              ? t("contentWriting.materialPanel.uploadParseFailedWithCode", { code: result.parse_failed_code })
              : t("contentWriting.materialPanel.uploadParseFailed"))
        )
        return
      }

      parsePollTimerRef.current = setTimeout(() => {
        void pollParsePreview(taskId)
      }, UPLOAD_PARSE_POLL_INTERVAL_MS)
    },
    [t]
  )

  useEffect(() => {
    return () => {
      if (parsePollTimerRef.current) {
        clearTimeout(parsePollTimerRef.current)
      }
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!articleId) {
      toast({
        variant: "destructive",
        title: t("contentWriting.materialPanel.uploadFailed"),
      })
      return
    }

    const newErrors: { title?: string; content?: string } = {}
    if (!title.trim()) newErrors.title = t("contentWriting.materialPanel.uploadNameRequired")
    if (materialType === "info" && !dataFile)
      newErrors.content = t("contentWriting.materialPanel.uploadDataRequired")
    if (materialType === "image" && !imageFile)
      newErrors.content = t("contentWriting.materialPanel.uploadImageRequired")

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsUploading(true)

    try {
      const uploadFile = materialType === "info" ? dataFile : imageFile
      if (!uploadFile) throw new Error("Missing upload file")

      const presigned = await materialsClient.getPresignedUrl(uploadFile.name, uploadFile.type || "application/octet-stream")
      if ("error" in presigned) throw new Error(presigned.error)

      const ok = await uploadFileToPresignedUrl(presigned.upload_url, uploadFile, uploadFile.type || "application/octet-stream")
      if (!ok) throw new Error("File upload failed")

      if (materialType === "info") {
        const parseResult = await materialsClient.createParsePreview({
          file_url: presigned.file_url,
          file_name: uploadFile.name,
        })

        if ("error" in parseResult) throw new Error(parseResult.error)

        if (parseResult.parse_status === "failed") {
          throw new Error(parseResult.error_message || t("contentWriting.materialPanel.uploadParseFailed"))
        }

        setParseTaskId(parseResult.task_id)
        setParseStatus(parseResult.parse_status)
        setParseError("")
        setParsedMarkdown(parseResult.content || "")
        toast({ title: t("contentWriting.materialPanel.uploadParseStarted") })
        void pollParsePreview(parseResult.task_id)
        return
      }

      const result = await materialsClient.createMaterial({
        title: title.trim(),
        material_type: "image",
        content: presigned.file_url,
        article_id: articleId,
      })

      if ("error" in result) throw new Error(result.error)

      toast({ title: t("contentWriting.materialPanel.uploadSuccess") })
      resetForm()
      onOpenChange(false)
      onUploadSuccess?.()
    } catch (err) {
      setIsUploading(false)
      toast({
        variant: "destructive",
        title: t("contentWriting.materialPanel.uploadFailed"),
        description: err instanceof Error ? err.message : "",
      })
    } finally {
      if (materialType !== "info") {
        setIsUploading(false)
      }
    }
  }, [articleId, title, materialType, dataFile, imageFile, toast, t, pollParsePreview, resetForm, onOpenChange, onUploadSuccess])

  const handleAddParsedMaterial = useCallback(async () => {
    if (!articleId || parseStatus !== "success" || !parsedMarkdown.trim()) return

    setIsAddingToMaterials(true)
    try {
      const result = await materialsClient.createMaterial({
        title: title.trim(),
        material_type: "info",
        content: parsedMarkdown.trim(),
        article_id: articleId,
      })

      if ("error" in result) throw new Error(result.error)

      toast({ title: t("contentWriting.materialPanel.uploadSuccess") })
      resetForm()
      onOpenChange(false)
      onUploadSuccess?.()
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("contentWriting.materialPanel.uploadFailed"),
        description: err instanceof Error ? err.message : "",
      })
    } finally {
      setIsAddingToMaterials(false)
    }
  }, [articleId, onOpenChange, onUploadSuccess, parseStatus, parsedMarkdown, resetForm, t, title, toast])

  const hasParsedResult = materialType === "info" && parseStatus === "success"
  const isParsingUpload = materialType === "info" && parseStatus === "parsing" && Boolean(parseTaskId)

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm()
        onOpenChange(v)
      }}
    >
      <DialogContent
        className={cn(
          "flex max-h-[90vh] flex-col overflow-hidden sm:max-w-md",
          hasParsedResult && "sm:max-w-2xl"
        )}
      >
        <DialogTitle>{t("contentWriting.materialPanel.uploadDialogTitle")}</DialogTitle>

        <div className="mt-2 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">{t("contentWriting.materialPanel.uploadMaterialName")}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("contentWriting.materialPanel.uploadMaterialNamePlaceholder")}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          {/* Type selector */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">{t("contentWriting.materialPanel.uploadMaterialType")}</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMaterialType("info")
                  setParseStatus("")
                  setParseError("")
                  setParsedMarkdown("")
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  materialType === "info"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                {t("contentWriting.materialPanel.typeInfo")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMaterialType("image")
                  setParseStatus("")
                  setParseError("")
                  setParsedMarkdown("")
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  materialType === "image"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                {t("contentWriting.materialPanel.typeImage")}
              </button>
            </div>
          </div>

          {/* Content */}
          {materialType === "info" ? (
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">{t("contentWriting.materialPanel.uploadSelectData")}</Label>
              {dataFile ? (
                <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{dataFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(dataFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDataFile(null)
                      setParseTaskId("")
                      setParseStatus("")
                      setParseError("")
                      setParsedMarkdown("")
                    }}
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-border p-6 hover:border-primary/50 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-center text-xs text-muted-foreground">
                    {t("contentWriting.materialPanel.uploadDataHint")}
                  </span>
                  <input
                    type="file"
                    accept={DATA_FILE_ACCEPT}
                    className="hidden"
                    onChange={handleDataFileSelect}
                  />
                </label>
              )}
              {errors.content && <p className="text-xs text-destructive">{errors.content}</p>}
              {isParsingUpload ? (
                <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t("contentWriting.materialPanel.uploadParsing")}
                </div>
              ) : null}
              {parseStatus === "failed" && parseError ? (
                <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {parseError}
                </div>
              ) : null}
              {hasParsedResult ? (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">{t("contentWriting.materialPanel.uploadParsedContent")}</Label>
                  <Textarea
                    value={parsedMarkdown}
                    onChange={(e) => setParsedMarkdown(e.target.value)}
                    className="h-[42vh] min-h-[220px] max-h-[360px] resize-none overflow-y-auto text-sm"
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">{t("contentWriting.materialPanel.uploadSelectImage")}</Label>
              {imagePreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="h-32 w-full object-cover rounded-md border" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview("")
                    }}
                    className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-border p-6 hover:border-primary/50 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {t("contentWriting.materialPanel.uploadImageHint")}
                  </span>
                  <input
                    type="file"
                    accept={IMAGE_FILE_ACCEPT}
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </label>
              )}
              {errors.content && <p className="text-xs text-destructive">{errors.content}</p>}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex shrink-0 justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading || isAddingToMaterials}>
            {t("contentWriting.materialPanel.uploadCancel")}
          </Button>
          {hasParsedResult ? (
            <Button
              onClick={() => void handleAddParsedMaterial()}
              disabled={isAddingToMaterials || !parsedMarkdown.trim() || !title.trim()}
            >
              {isAddingToMaterials && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {t("contentWriting.materialPanel.addToMaterials")}
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isUploading}>
              {isUploading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {materialType === "info"
                ? t("contentWriting.materialPanel.uploadParseSubmit")
                : t("contentWriting.materialPanel.uploadSubmit")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== EditorMaterialPanel ====================

export interface EditorMaterialPanelProps {
  className?: string
  articleId: number | null
  userId: number | null
}

type MaterialPanelView = "search" | "library" | "favorites"

function MaterialTypeSwitcher({
  mode,
  value,
  disabled = false,
  onValueChange,
}: {
  mode: Exclude<MaterialPanelView, "favorites">
  value: MaterialType
  disabled?: boolean
  onValueChange: (value: MaterialType) => void
}) {
  const { t } = useTranslation()
  const tabs = mode === "search" ? SEARCH_TYPE_TABS : CATEGORY_TABS
  const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.id === value))

  return (
    <div className="relative grid items-center gap-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 rounded-md bg-[var(--jw-control-active-bg)] ring-1 ring-[var(--jw-task-card-border)]"
        style={{
          width: `${100 / tabs.length}%`,
          transform: `translateX(${activeIndex * 100}%)`,
          transition: "transform 260ms cubic-bezier(0.34, 1.45, 0.64, 1), opacity 180ms ease",
          opacity: disabled ? 0.55 : 1,
        }}
      />
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = value === tab.id
        const label =
          mode === "search"
            ? t(`contentWriting.materialPanel.${tab.i18nKey}`)
            : t(`contentWriting.materials.types.${tab.i18nKey}`)

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onValueChange(tab.id)}
            disabled={disabled}
            className={cn(
              "relative z-10 flex h-8 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        )
      })}
    </div>
  )
}

export function EditorMaterialPanel({ className, articleId, userId }: EditorMaterialPanelProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [showUpload, setShowUpload] = useState(false)
  const [activeView, setActiveView] = useState<MaterialPanelView>("search")
  const [searchType, setSearchType] = useState<MaterialType>("info")
  const [isSearchTypeLocked, setIsSearchTypeLocked] = useState(false)
  const [libraryActiveCategory, setLibraryActiveCategory] = useState<MaterialType>("info")
  // Incrementing key forces LibraryTab to remount and refetch after upload
  const [libraryKey, setLibraryKey] = useState(0)
  const [favoritesKey, setFavoritesKey] = useState(0)

  const refreshFavorites = useCallback(() => {
    setFavoritesKey((key) => key + 1)
    setLibraryKey((key) => key + 1)
  }, [])

  useEffect(() => {
    const handleMaterialsRefresh = (event: Event) => {
      const detail = (event as CustomEvent<{ materialType?: MaterialType }>).detail
      setLibraryActiveCategory(detail?.materialType ?? "image")
      setActiveView("library")
      setLibraryKey((key) => key + 1)
    }

    window.addEventListener("joyfulwords-materials-refresh", handleMaterialsRefresh)
    return () => {
      window.removeEventListener("joyfulwords-materials-refresh", handleMaterialsRefresh)
    }
  }, [])

  const handleImportSuccess = useCallback((materialType: MaterialType) => {
    console.info("[MaterialLibrary] syncing imported search results into library view", {
      articleId,
      materialType,
    })
    setLibraryActiveCategory(materialType)
    setActiveView("library")
    setLibraryKey((key) => key + 1)
  }, [articleId])

  const handleMaterialTypeChange = useCallback((materialType: MaterialType) => {
    if (activeView === "search") {
      setSearchType(materialType)
      return
    }

    if (activeView === "library") {
      setLibraryActiveCategory(materialType)
    }
  }, [activeView])

  const handleFavoriteMaterial = useCallback(async (material: Material) => {
    console.info("[MaterialFavorites] toggling favorite", {
      materialId: material.id,
      favoriteId: material.favorite_id,
      isFavorite: material.is_favorite,
      articleId,
    })

    const result = material.is_favorite
      ? await materialsClient.deleteFavorite(material.favorite_id)
      : await materialsClient.createFavorite({
          material_id: material.id,
        })

    if ("error" in result) {
      console.warn("[MaterialFavorites] toggle favorite failed", {
        materialId: material.id,
        favoriteId: material.favorite_id,
        isFavorite: material.is_favorite,
        error: result.error,
      })
      toast({
        variant: "destructive",
        title: material.is_favorite
          ? t("contentWriting.materialPanel.unfavoriteFailed")
          : t("contentWriting.materialPanel.favoriteFailed"),
        description: result.error,
      })
      return
    }

    refreshFavorites()
    toast({
      title: material.is_favorite
        ? t("contentWriting.materialPanel.unfavoriteSuccess")
        : t("contentWriting.materialPanel.favoriteSuccess"),
    })
  }, [articleId, refreshFavorites, t, toast])

  const handleDeleteMaterial = useCallback(async (material: Material) => {
    console.info("[MaterialLibrary] deleting material", {
      materialId: material.id,
      articleId,
      materialType: material.material_type,
    })

    const result = await materialsClient.deleteMaterial(material.id)

    if ("error" in result) {
      console.warn("[MaterialLibrary] delete material failed", {
        materialId: material.id,
        articleId,
        materialType: material.material_type,
        error: result.error,
      })
      toast({
        variant: "destructive",
        title: t("contentWriting.materialPanel.libraryDeleteFailed"),
        description: result.error,
      })
      return
    }

    setLibraryKey((key) => key + 1)
    setFavoritesKey((key) => key + 1)
    toast({
      title: t("contentWriting.materialPanel.libraryDeleteSuccess"),
    })
  }, [articleId, t, toast])

  return (
    <div className={cn("flex h-full flex-col overflow-hidden bg-transparent", className)}>
      <div className="jw-panel-header shrink-0 px-4 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground">
            {t("contentWriting.materialPanel.sourceTitle")}
          </h2>
        </div>
      </div>

      <div className="shrink-0 px-3 pt-3">
        <Button
          variant="outline"
          size="sm"
          className="jw-soft-input h-9 w-full justify-center px-3 text-xs transition-shadow hover:shadow-[0_10px_24px_rgba(15,23,42,0.16)]"
          onClick={() => setShowUpload(true)}
          disabled={!articleId}
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          {t("contentWriting.materialPanel.uploadButton")}
        </Button>
      </div>

      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "search" | "library" | "favorites")} className="flex h-full flex-col">
        <div className="mx-3 mt-3 shrink-0">
          <div className="jw-panel-control rounded-xl border border-[var(--jw-border-subtle)] p-1.5">
            <div className="flex items-center gap-2">
              <TabsList className="min-w-0 flex-1 border border-transparent bg-[var(--jw-control-bg)] transition-colors hover:border-dashed hover:border-[var(--jw-accent)]">
                <TabsTrigger value="search" className="flex-1 text-xs">
                  <Search className="mr-1.5 h-3.5 w-3.5" />
                  {t("contentWriting.materialPanel.searchTab")}
                </TabsTrigger>
                <TabsTrigger value="library" className="flex-1 text-xs">
                  <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                  {t("contentWriting.materialPanel.libraryTab")}
                </TabsTrigger>
              </TabsList>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className={cn(
                  "h-9 w-9 shrink-0 rounded-md border border-border/50 bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground",
                  "transition-shadow hover:shadow-[0_8px_18px_rgba(15,23,42,0.18)]",
                  activeView === "favorites" && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
                onClick={() => setActiveView("favorites")}
                aria-label={t("contentWriting.materialPanel.globalFavoriteButton")}
                title={t("contentWriting.materialPanel.globalFavoriteButton")}
              >
                <Heart className={cn("h-4 w-4", activeView === "favorites" && "fill-current")} />
              </Button>
            </div>

            {activeView === "search" || activeView === "library" ? (
              <div className="mt-1.5 border-t border-[var(--jw-border-subtle)] pt-1.5">
                <MaterialTypeSwitcher
                  mode={activeView}
                  value={activeView === "search" ? searchType : libraryActiveCategory}
                  disabled={activeView === "search" && isSearchTypeLocked}
                  onValueChange={handleMaterialTypeChange}
                />
              </div>
            ) : null}
          </div>
        </div>

        <TabsContent value="search" className="mt-0 flex-1 overflow-hidden px-3 pb-3 pt-1">
          <div className="min-h-0 h-full min-w-0">
            <SearchTab
              articleId={articleId}
              userId={userId}
              searchType={searchType}
              onSearchTypeChange={setSearchType}
              onSearchLockedChange={setIsSearchTypeLocked}
              onImportSuccess={handleImportSuccess}
            />
          </div>
        </TabsContent>

        <TabsContent value="library" className="mt-0 flex-1 overflow-hidden px-3 pb-3 pt-1">
          <div className="h-full min-h-0 min-w-0">
            <LibraryTab
              key={libraryKey}
              articleId={articleId}
              activeCategory={libraryActiveCategory}
              onFavorite={(material) => void handleFavoriteMaterial(material)}
              onDelete={(material) => void handleDeleteMaterial(material)}
            />
          </div>
        </TabsContent>

        <TabsContent value="favorites" className="mt-0 flex-1 overflow-hidden px-3 pb-3 pt-1">
          <div className="h-full min-h-0 min-w-0">
            <FavoriteList
              key={favoritesKey}
              onFavoritesChanged={refreshFavorites}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Upload dialog */}
      <UploadDialog
        articleId={articleId}
        open={showUpload}
        onOpenChange={setShowUpload}
        onUploadSuccess={() => setLibraryKey((k) => k + 1)}
      />
    </div>
  )
}
