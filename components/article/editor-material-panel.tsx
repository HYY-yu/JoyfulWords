"use client"

import { useState, useCallback, useRef, useEffect, type ReactNode } from "react"
import { GripVertical, Search, BookOpen, Trash2, FileText, Newspaper, ImageIcon, X, Check, Upload, Loader2, AlertTriangle, SearchX, Clock3, Inbox } from "lucide-react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useInfiniteMaterials } from "@/lib/hooks/use-infinite-materials"
import { Input } from "@/components/ui/base/input"
import { Button } from "@/components/ui/base/button"
import { Badge } from "@/components/ui/base/badge"
import { Checkbox } from "@/components/ui/base/checkbox"
import { ScrollArea } from "@/components/ui/base/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/base/tabs"
import { Skeleton } from "@/components/ui/base/skeleton"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/base/dialog"
import { cn, formatDate } from "@/lib/utils"
import type { CheckedState } from "@radix-ui/react-checkbox"
import type { Material, MaterialType, MaterialSearchDetailResponse, MaterialSearchResultItem } from "@/lib/api/materials/types"
import { materialsClient, uploadFileToPresignedUrl } from "@/lib/api/materials/client"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/base/label"
import { Textarea } from "@/components/ui/base/textarea"

// ==================== MaterialCard ====================

interface MaterialCardProps {
  material: Material
}

function MaterialCard({ material }: MaterialCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const isImage = material.material_type === "image"
  const imageUrl = isImage ? material.content : null

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.effectAllowed = "copy"
      if (isImage && imageUrl) {
        e.dataTransfer.setData("text/plain", imageUrl)
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
            ? "group flex h-full cursor-grab flex-col gap-2 overflow-hidden rounded-md border border-border bg-card p-2"
            : "group flex cursor-grab items-start gap-2 rounded-md border border-border bg-card p-3",
          "hover:border-primary/50 hover:bg-accent/50 active:cursor-grabbing",
          "transition-colors duration-150"
        )}
      >
        {isImage ? (
          <>
            <div className="flex items-start gap-2">
              <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground" />
              <p className="line-clamp-2 min-w-0 flex-1 text-sm font-medium leading-tight">{material.title}</p>
            </div>
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
          </>
        ) : (
          <>
            <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="mb-1 truncate text-sm font-medium leading-tight">{material.title}</p>
              {material.content ? (
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="w-full text-left cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <p className="line-clamp-4 text-xs leading-relaxed text-muted-foreground">
                    {material.content}
                  </p>
                </button>
              ) : null}
            </div>
          </>
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
              <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed pr-4">
                {material.content}
              </p>
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
    <div className="flex items-start gap-2 rounded-md border border-border p-3">
      <Skeleton className="mt-0.5 h-4 w-4 shrink-0" />
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
  onImportSuccess?: () => void
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
        "rounded-[24px] border border-slate-200 bg-white shadow-[0_22px_48px_-34px_rgba(15,23,42,0.28)]",
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
      <div className="border-b border-slate-100 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              {icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
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

function SearchResultContent({
  content,
}: {
  content: string
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const shouldCollapse = content.length > 180

  return (
    <div className="rounded-2xl bg-slate-50/80 px-3 py-2.5">
      <p
        className={cn(
          "whitespace-pre-wrap text-xs leading-5 text-slate-600",
          !expanded && shouldCollapse && "line-clamp-4"
        )}
      >
        {content}
      </p>
      {shouldCollapse && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-2 text-xs font-medium text-primary transition-colors hover:text-primary/80"
        >
          {expanded
            ? t("contentWriting.materialPanel.collapseContent")
            : t("contentWriting.materialPanel.expandContent")}
        </button>
      )}
    </div>
  )
}

function SearchResultListItem({
  item,
  checked,
  onCheckedChange,
}: {
  item: MaterialSearchResultItem
  checked: boolean
  onCheckedChange: (checked: CheckedState) => void
}) {
  const { t } = useTranslation()

  return (
    <label className="flex cursor-pointer gap-3 rounded-[20px] border border-slate-200 bg-slate-50/60 p-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.04]">
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} className="mt-1" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-6 text-slate-900">{item.title}</p>
        {item.published_date ? (
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            {t("contentWriting.materialPanel.publishedAt")}: {formatDate(item.published_date)}
          </p>
        ) : null}
        {item.content ? <div className="mt-2"><SearchResultContent content={item.content} /></div> : null}
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
    </label>
  )
}

function SearchImageItem({
  url,
  checked,
  onCheckedChange,
}: {
  url: string
  checked: boolean
  onCheckedChange: (checked: CheckedState) => void
}) {
  const { t } = useTranslation()

  return (
    <label className="group relative cursor-pointer overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={t("contentWriting.materialPanel.imageResultAlt")} className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" loading="lazy" />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
        <Checkbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="border-white/70 bg-white/90 shadow-sm"
        />
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          {t("contentWriting.materialPanel.openImage")}
        </a>
      </div>
    </label>
  )
}

function SearchResultCard({
  result,
  selectedUrls,
  importLoading,
  onToggleUrl,
  onDelete,
  onImport,
}: {
  result: MaterialSearchDetailResponse
  selectedUrls: Set<string>
  importLoading: boolean
  onToggleUrl: (url: string, checked: boolean) => void
  onDelete: () => void
  onImport: () => void
}) {
  const { t } = useTranslation()
  const aiResultItems = result.ai_result?.ai_result ?? []
  const imageItems = result.ai_result?.images ?? []
  const selectedCount = selectedUrls.size
  const importDisabled = selectedCount === 0 || importLoading

  return (
    <SearchCardShell className="overflow-hidden">
      <div className="border-b border-slate-100 bg-[linear-gradient(135deg,rgba(248,250,252,1),rgba(255,255,255,1),rgba(239,246,255,0.7))] px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">
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
          <div className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {t("contentWriting.materialPanel.aiSummary")}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
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
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {aiResultItems.map((item) => (
              <SearchResultListItem
                key={item.url}
                item={item}
                checked={selectedUrls.has(buildSelectableUrl(item))}
                onCheckedChange={(checked) => onToggleUrl(buildSelectableUrl(item), checked === true)}
              />
            ))}
          </div>
        )}
      </div>
    </SearchCardShell>
  )
}

function SearchTab({ articleId, userId, onImportSuccess }: SearchTabProps) {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [searchType, setSearchType] = useState<MaterialType>("info")
  const [searchText, setSearchText] = useState("")
  const [activeTask, setActiveTask] = useState<PersistedMaterialSearchTask | null>(null)
  const [detail, setDetail] = useState<MaterialSearchDetailResponse | null>(null)
  const [bannerStatus, setBannerStatus] = useState<"triggered" | "polling" | null>(null)
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())
  const [isImporting, setIsImporting] = useState(false)

  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const networkFailCountRef = useRef(0)

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
    stopPolling()
    setActiveTask(null)
    setDetail(null)
    setBannerStatus(null)
    setSelectedUrls(new Set())
    if (userId && articleId) {
      clearPersistedMaterialSearchTask(userId, articleId)
    }
  }, [articleId, stopPolling, userId])

  const hydrateSelections = useCallback((response: MaterialSearchDetailResponse) => {
    if (response.status !== "success" || !response.ai_result) {
      setSelectedUrls(new Set())
      return
    }

    if (response.material_type === "image") {
      setSelectedUrls(new Set((response.ai_result.images ?? []).map((url) => buildImageSelectableUrl(url))))
      return
    }

    setSelectedUrls(
      new Set((response.ai_result.ai_result ?? []).map((item) => buildSelectableUrl(item)))
    )
  }, [])

  const handlePollResult = useCallback(
    async (task: PersistedMaterialSearchTask) => {
      console.debug("[MaterialSearch] polling detail", { logId: task.logId, query: task.query })
      const response = await materialsClient.getSearchLogDetail(task.logId)

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

      if (response.status === "doing") {
        setBannerStatus("polling")
        pollingRef.current = setTimeout(() => {
          void handlePollResult(task)
        }, SEARCH_POLL_INTERVAL_MS)
        return
      }

      stopPolling()
      setBannerStatus(null)
      hydrateSelections(response)
      console.info("[MaterialSearch] search finished", {
        logId: task.logId,
        status: response.status,
      })
    },
    [clearSearchTask, hydrateSelections, stopPolling, t, toast]
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
    setSearchType(storedTask.materialType)
    setSearchText(storedTask.query)
    setBannerStatus("polling")
    void handlePollResult(storedTask)

    return stopPolling
  }, [articleId, handlePollResult, stopPolling, userId])

  useEffect(() => stopPolling, [stopPolling])

  const handleSearch = useCallback(async () => {
    const trimmed = searchText.trim()
    if (!trimmed || !userId || !articleId || activeTask) return

    stopPolling()
    setDetail(null)
    setSelectedUrls(new Set())

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
      setBannerStatus(null)
      return
    }

    const task: PersistedMaterialSearchTask = {
      ...nextTaskBase,
      logId: searchResult.id,
    }

    persistTask(task)
    setActiveTask(task)
    setBannerStatus("triggered")
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

  const handleImport = useCallback(async () => {
    if (!activeTask || selectedUrls.size === 0) return

    console.info("[MaterialSearch] importing selected results", {
      logId: activeTask.logId,
      count: selectedUrls.size,
    })
    setIsImporting(true)

    const result = await materialsClient.addFromLog({
      material_log_id: activeTask.logId,
      urls: Array.from(selectedUrls),
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
    onImportSuccess?.()
    setIsImporting(false)
  }, [activeTask, onImportSuccess, selectedUrls, t, toast])

  const isSearchLocked = Boolean(activeTask)

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-3">
      <div className="flex gap-1.5 shrink-0">
        {SEARCH_TYPE_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = searchType === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSearchType(tab.id)}
              disabled={isSearchLocked}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t(`contentWriting.materialPanel.${tab.i18nKey}`)}
            </button>
          )
        })}
      </div>

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
            {bannerStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {bannerStatus && activeTask ? (
          <SearchStatusBanner status={bannerStatus} query={activeTask.query} />
        ) : null}
      </div>

      <ScrollArea className="min-h-0 flex-1 min-w-0">
        <div className="flex min-w-0 flex-col gap-3 px-0.5 pr-2">
          {!activeTask ? <SearchEmptyState /> : null}

          {activeTask && detail?.status === "success" ? (
            <SearchResultCard
              result={detail}
              selectedUrls={selectedUrls}
              importLoading={isImporting}
              onToggleUrl={handleToggleUrl}
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

const CATEGORY_TABS = [
  { id: "info" as MaterialType, i18nKey: "info", icon: FileText },
  { id: "news" as MaterialType, i18nKey: "news", icon: Newspaper },
  { id: "image" as MaterialType, i18nKey: "image", icon: ImageIcon },
] as const

function LibraryTab() {
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState<MaterialType>("info")
  const { materials: allMaterials, isLoading, hasMore, observerTarget } = useInfiniteMaterials({
    type: activeCategory,
    pageSize: 20,
    enabled: true,
  })

  const materials = allMaterials

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Category tabs */}
      <div className="flex gap-1.5 shrink-0">
        {CATEGORY_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeCategory === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t(`contentWriting.materials.types.${tab.i18nKey}`)}
            </button>
          )
        })}
      </div>

      {/* Materials list */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className={cn(
            "pr-2 pb-4",
            activeCategory === "image" ? "grid grid-cols-2 gap-2" : "flex flex-col gap-2"
          )}>
            {materials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
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
        </ScrollArea>
      </div>
    </div>
  )
}

// ==================== UploadDialog ====================

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadSuccess?: () => void
}

function UploadDialog({ open, onOpenChange, onUploadSuccess }: UploadDialogProps) {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [title, setTitle] = useState("")
  const [materialType, setMaterialType] = useState<"info" | "image">("info")
  const [content, setContent] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({})

  const resetForm = useCallback(() => {
    setTitle("")
    setMaterialType("info")
    setContent("")
    setImageFile(null)
    setImagePreview("")
    setErrors({})
  }, [])

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

  const handleSubmit = useCallback(async () => {
    const newErrors: { title?: string; content?: string } = {}
    if (!title.trim()) newErrors.title = t("contentWriting.materialPanel.uploadNameRequired")
    if (materialType === "info" && !content.trim())
      newErrors.content = t("contentWriting.materialPanel.uploadContentRequired")
    if (materialType === "image" && !imageFile)
      newErrors.content = t("contentWriting.materialPanel.uploadImageRequired")

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsUploading(true)

    try {
      let finalContent = content

      if (materialType === "image" && imageFile) {
        const presigned = await materialsClient.getPresignedUrl(imageFile.name, imageFile.type)
        if ("error" in presigned) throw new Error(presigned.error)

        const ok = await uploadFileToPresignedUrl(presigned.upload_url, imageFile, imageFile.type)
        if (!ok) throw new Error("Image upload failed")

        finalContent = presigned.file_url
      }

      const result = await materialsClient.createMaterial({
        title: title.trim(),
        material_type: materialType,
        content: finalContent,
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
      setIsUploading(false)
    }
  }, [title, materialType, content, imageFile, toast, t, resetForm, onOpenChange, onUploadSuccess])

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm()
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <h3 className="text-lg font-semibold">{t("contentWriting.materialPanel.uploadDialogTitle")}</h3>

        <div className="flex flex-col gap-4 mt-2">
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
                onClick={() => setMaterialType("info")}
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
                onClick={() => setMaterialType("image")}
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
              <Label className="text-sm">{t("contentWriting.materialPanel.uploadMaterialContent")}</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("contentWriting.materialPanel.uploadMaterialContentPlaceholder")}
                rows={4}
              />
              {errors.content && <p className="text-xs text-destructive">{errors.content}</p>}
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
                    accept="image/png,image/jpeg,image/jpg"
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
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            {t("contentWriting.materialPanel.uploadCancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isUploading}>
            {isUploading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {t("contentWriting.materialPanel.uploadSubmit")}
          </Button>
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

export function EditorMaterialPanel({ className, articleId, userId }: EditorMaterialPanelProps) {
  const { t } = useTranslation()
  const [showUpload, setShowUpload] = useState(false)
  // Incrementing key forces LibraryTab to remount and refetch after upload
  const [libraryKey, setLibraryKey] = useState(0)

  return (
    <div className={cn("flex h-full flex-col overflow-hidden bg-background", className)}>
      {/* Upload button — above tabs */}
      <div className="px-3 pt-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => setShowUpload(true)}
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          {t("contentWriting.materialPanel.uploadButton")}
        </Button>
      </div>

      <Tabs defaultValue="search" className="flex h-full flex-col">
        <TabsList className="mx-3 mt-2 shrink-0">
          <TabsTrigger value="search" className="flex-1 text-xs">
            <Search className="mr-1.5 h-3.5 w-3.5" />
            {t("contentWriting.materialPanel.searchTab")}
          </TabsTrigger>
          <TabsTrigger value="library" className="flex-1 text-xs">
            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
            {t("contentWriting.materialPanel.libraryTab")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-0 flex-1 overflow-hidden px-3 pb-3 pt-3">
          <div className="min-h-0 h-full min-w-0">
            <SearchTab
              articleId={articleId}
              userId={userId}
              onImportSuccess={() => setLibraryKey((k) => k + 1)}
            />
          </div>
        </TabsContent>

        <TabsContent value="library" className="mt-0 flex-1 overflow-hidden px-3 pb-3 pt-3">
          <LibraryTab key={libraryKey} />
        </TabsContent>
      </Tabs>

      {/* Upload dialog */}
      <UploadDialog
        open={showUpload}
        onOpenChange={setShowUpload}
        onUploadSuccess={() => setLibraryKey((k) => k + 1)}
      />
    </div>
  )
}
