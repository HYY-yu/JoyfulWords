"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { GripVertical, Search, BookOpen, ChevronDown, ChevronRight, Plus, Trash2, FileText, Newspaper, ImageIcon, X, Check, Upload, Loader2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useInfiniteMaterials } from "@/lib/hooks/use-infinite-materials"
import { useMaterialFavorites } from "@/lib/hooks/use-material-favorites"
import { Input } from "@/components/ui/base/input"
import { Button } from "@/components/ui/base/button"
import { Badge } from "@/components/ui/base/badge"
import { ScrollArea } from "@/components/ui/base/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/base/tabs"
import { Skeleton } from "@/components/ui/base/skeleton"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/base/dialog"
import { cn } from "@/lib/utils"
import type { Material, MaterialType, MaterialLog } from "@/lib/api/materials/types"
import { materialsClient, uploadFileToPresignedUrl } from "@/lib/api/materials/client"
import { useCollectedMaterials } from "@/lib/hooks/use-collected-materials"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/base/label"
import { Textarea } from "@/components/ui/base/textarea"

// ==================== MaterialCard ====================

interface MaterialCardProps {
  material: Material
  onAddToGroup?: (materialId: number) => void
  showAddToGroup?: boolean
}

function MaterialCard({ material, onAddToGroup, showAddToGroup }: MaterialCardProps) {
  const { t } = useTranslation()
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
          "group flex cursor-grab items-start gap-2 rounded-md border border-border bg-card p-3",
          "hover:border-primary/50 hover:bg-accent/50 active:cursor-grabbing",
          "transition-colors duration-150"
        )}
      >
        {/* Drag handle */}
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground" />

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="mb-1 truncate text-sm font-medium leading-tight">{material.title}</p>

          {isImage && imageUrl ? (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="mt-1 block w-full overflow-hidden rounded-md border border-border cursor-pointer hover:opacity-80 transition-opacity"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={material.title}
                className="h-24 w-full object-cover"
                loading="lazy"
              />
            </button>
          ) : (
            material.content && (
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="w-full text-left cursor-pointer hover:opacity-80 transition-opacity"
              >
                <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                  {material.content}
                </p>
              </button>
            )
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {material.material_type}
            </Badge>
          </div>
        </div>

        {/* Add to group button */}
        {showAddToGroup && onAddToGroup && (
          <button
            type="button"
            onClick={() => onAddToGroup(material.id)}
            className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100 transition-opacity"
            title={t("contentWriting.materialPanel.addToGroup")}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        {isImage && imageUrl ? (
          <DialogContent className="max-w-3xl p-2 border-none bg-transparent shadow-none [&>button]:hidden">
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

// ==================== SearchResultCard ====================

interface SearchResultCardProps {
  material: Material
  isCollected: boolean
  onCollect: (id: number) => void
}

function SearchResultCard({ material, isCollected, onCollect }: SearchResultCardProps) {
  const { t } = useTranslation()
  const [previewOpen, setPreviewOpen] = useState(false)
  const isImage = material.material_type === "image"
  const imageUrl = isImage ? material.content : null

  return (
    <>
      <div
        className={cn(
          "flex items-start gap-2 rounded-md border border-border bg-card p-3",
          "transition-colors duration-150"
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="mb-1 truncate text-sm font-medium leading-tight">{material.title}</p>

          {isImage && imageUrl ? (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="mt-1 block w-full overflow-hidden rounded-md border border-border cursor-pointer hover:opacity-80 transition-opacity"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={material.title}
                className="h-24 w-full object-cover"
                loading="lazy"
              />
            </button>
          ) : (
            material.content && (
              <p className="line-clamp-3 text-xs text-muted-foreground leading-relaxed">
                {material.content}
              </p>
            )
          )}
        </div>

        {/* Collect button */}
        <Button
          variant={isCollected ? "secondary" : "outline"}
          size="sm"
          className="shrink-0 text-xs h-7 px-2"
          disabled={isCollected}
          onClick={() => onCollect(material.id)}
        >
          {isCollected ? (
            <>
              <Check className="mr-1 h-3 w-3" />
              {t("contentWriting.materialPanel.collected")}
            </>
          ) : (
            t("contentWriting.materialPanel.collectButton")
          )}
        </Button>
      </div>

      {/* Image preview dialog */}
      {isImage && imageUrl && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl p-2 border-none bg-transparent shadow-none [&>button]:hidden">
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
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

// ==================== SearchTab ====================

const SEARCH_TYPE_TABS = [
  { id: "info" as MaterialType, i18nKey: "typeInfo", icon: FileText },
  { id: "news" as MaterialType, i18nKey: "typeNews", icon: Newspaper },
  { id: "image" as MaterialType, i18nKey: "typeImage", icon: ImageIcon },
] as const

function SearchTab() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { isCollected, collect } = useCollectedMaterials()

  const [searchType, setSearchType] = useState<MaterialType>("info")
  const [searchText, setSearchText] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<Material[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  // Polling refs
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const pollingStartTimeRef = useRef<number>(0)
  const networkFailCountRef = useRef<number>(0)

  // Cleanup polling on unmount
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
      pollingRef.current = null
    }
    networkFailCountRef.current = 0
  }, [])

  useEffect(() => {
    return stopPolling
  }, [stopPolling])

  const handleSearch = useCallback(async () => {
    const trimmed = searchText.trim()
    if (!trimmed) return

    // Stop any existing polling
    stopPolling()
    setIsSearching(true)
    setHasSearched(true)
    setResults([])

    // 1. Trigger async search
    const searchResult = await materialsClient.search(searchType, trimmed)

    if ("error" in searchResult) {
      toast({
        variant: "destructive",
        title: t("contentWriting.materialPanel.searchFailed"),
        description: searchResult.error,
      })
      setIsSearching(false)
      return
    }

    // 2. Start polling for completion using recursive setTimeout
    pollingStartTimeRef.current = Date.now()
    networkFailCountRef.current = 0

    const poll = async () => {
      // Timeout check (30 seconds)
      if (Date.now() - pollingStartTimeRef.current > 30000) {
        stopPolling()
        setIsSearching(false)
        toast({
          variant: "destructive",
          title: t("contentWriting.materialPanel.searchTimeout"),
        })
        return
      }

      try {
        // Poll search logs
        const logsResult = await materialsClient.getSearchLogs({
          type: searchType,
          page_size: 5,
        })

        if ("error" in logsResult) {
          networkFailCountRef.current++
          if (networkFailCountRef.current >= 3) {
            stopPolling()
            setIsSearching(false)
            toast({
              variant: "destructive",
              title: t("contentWriting.materialPanel.searchFailed"),
            })
            return
          }
          pollingRef.current = setTimeout(poll, 3000)
          return
        }

        networkFailCountRef.current = 0

        // Find matching log
        const matchingLog = logsResult.list.find(
          (log: MaterialLog) =>
            log.material_type === searchType &&
            log.query === trimmed &&
            log.status !== "doing"
        )

        if (!matchingLog) {
          // Still searching — schedule next poll
          pollingRef.current = setTimeout(poll, 3000)
          return
        }

        // Check for failure
        if (matchingLog.status === "failed") {
          stopPolling()
          setIsSearching(false)
          toast({
            variant: "destructive",
            title: t("contentWriting.materialPanel.searchStatusFailed"),
          })
          return
        }

        // Search completed — fetch results
        stopPolling()
        const latestLogId = matchingLog.id

        const materialsResult = await materialsClient.getMaterials({
          type: searchType,
          page_size: 100,
        })

        if ("error" in materialsResult) {
          setIsSearching(false)
          return
        }

        // Client-side filter by material_logs_id
        const filtered = materialsResult.list.filter(
          (m: Material) => m.material_logs_id === latestLogId
        )
        setResults(filtered)
        setIsSearching(false)
      } catch {
        networkFailCountRef.current++
        if (networkFailCountRef.current >= 3) {
          stopPolling()
          setIsSearching(false)
          toast({
            variant: "destructive",
            title: t("contentWriting.materialPanel.searchFailed"),
          })
          return
        }
        pollingRef.current = setTimeout(poll, 3000)
      }
    }

    // Start first poll after 3 seconds
    pollingRef.current = setTimeout(poll, 3000)
  }, [searchText, searchType, stopPolling, toast, t])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handleSearch()
    },
    [handleSearch]
  )

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Type selector */}
      <div className="flex gap-1.5 shrink-0">
        {SEARCH_TYPE_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = searchType === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSearchType(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
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

      {/* Search input + button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("contentWriting.materialPanel.searchInputPlaceholder")}
            className="pl-8"
            disabled={isSearching}
          />
        </div>
        <Button
          size="sm"
          onClick={handleSearch}
          disabled={isSearching || !searchText.trim()}
          className="shrink-0"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Results area */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 pr-2">
          {/* Searching state */}
          {isSearching && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Loader2 className="mb-2 h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {t("contentWriting.materialPanel.searching")}
              </p>
            </div>
          )}

          {/* Results list */}
          {!isSearching &&
            results.map((material) => (
              <SearchResultCard
                key={material.id}
                material={material}
                isCollected={isCollected(material.id)}
                onCollect={collect}
              />
            ))}

          {/* Empty states */}
          {!isSearching && hasSearched && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Search className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {t("contentWriting.materialPanel.searchNoResults")}
              </p>
            </div>
          )}

          {!isSearching && !hasSearched && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Search className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {t("contentWriting.materialPanel.searchInitialHint")}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// ==================== FavoriteGroupSection ====================

interface FavoriteGroupSectionProps {
  groupId: string
  groupName: string
  materialIds: number[]
  allMaterials: Material[]
  onDelete: () => void
  onRemoveMaterial: (materialId: number) => void
}

function FavoriteGroupSection({
  groupId,
  groupName,
  materialIds,
  allMaterials,
  onDelete,
  onRemoveMaterial,
}: FavoriteGroupSectionProps) {
  const [expanded, setExpanded] = useState(true)
  const groupMaterials = allMaterials.filter((m) => materialIds.includes(m.id))

  return (
    <div className="rounded-md border border-border">
      {/* Group header */}
      <div className="flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-accent/50 transition-colors">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate">{groupName}</span>
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            {materialIds.length}
          </Badge>
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded p-0.5 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Group materials */}
      {expanded && (
        <div className="flex flex-col gap-1.5 border-t border-border px-2 pb-2 pt-1.5">
          {groupMaterials.length === 0 ? (
            <p className="py-2 text-center text-xs text-muted-foreground">—</p>
          ) : (
            groupMaterials.map((material) => (
              <div key={material.id} className="relative">
                <MaterialCard material={material} />
                <button
                  type="button"
                  onClick={() => onRemoveMaterial(material.id)}
                  className="absolute right-2 top-2 rounded p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
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
  const { groups, createGroup, deleteGroup, addToGroup, removeFromGroup } = useMaterialFavorites()
  const [newGroupName, setNewGroupName] = useState("")
  const [showCreateInput, setShowCreateInput] = useState(false)
  const [activeCategory, setActiveCategory] = useState<MaterialType>("info")
  const { materials: allMaterials, isLoading, hasMore, observerTarget } = useInfiniteMaterials({
    type: activeCategory,
    pageSize: 20,
    enabled: true,
  })

  const materials = allMaterials

  const handleCreateGroup = useCallback(() => {
    if (!newGroupName.trim()) return
    createGroup(newGroupName.trim())
    setNewGroupName("")
    setShowCreateInput(false)
  }, [newGroupName, createGroup])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handleCreateGroup()
      if (e.key === "Escape") {
        setShowCreateInput(false)
        setNewGroupName("")
      }
    },
    [handleCreateGroup]
  )

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
          <div className="flex flex-col gap-2 pr-2">
            {materials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                showAddToGroup={groups.length > 0}
                onAddToGroup={
                  groups.length > 0
                    ? (materialId) => {
                        // Add to first group as default — user can manage groups
                        addToGroup(groups[0].id, materialId)
                      }
                    : undefined
                }
              />
            ))}

            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <MaterialCardSkeleton key={`lib-skeleton-${i}`} />
              ))}

            {hasMore && <div ref={observerTarget} className="h-4" />}

            {!isLoading && materials.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <BookOpen className="mb-2 h-7 w-7 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {t("contentWriting.materialPanel.emptyLibrary")}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Favorites groups section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("contentWriting.materialPanel.favoriteGroups")}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setShowCreateInput((v) => !v)}
          >
            <Plus className="mr-1 h-3 w-3" />
            {t("contentWriting.materialPanel.createGroup")}
          </Button>
        </div>

        {/* Create group input */}
        {showCreateInput && (
          <div className="flex gap-1.5">
            <Input
              autoFocus
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("contentWriting.materialPanel.groupNamePlaceholder")}
              className="h-7 text-xs"
            />
            <Button
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim()}
            >
              {t("contentWriting.materialPanel.confirm")}
            </Button>
          </div>
        )}

        {/* Groups list */}
        <ScrollArea className="max-h-[240px]">
          <div className="flex flex-col gap-2 pr-2">
            {groups.length === 0 ? (
              <p className="py-2 text-center text-xs text-muted-foreground">
                {t("contentWriting.materialPanel.noGroups")}
              </p>
            ) : (
              groups.map((group) => (
                <FavoriteGroupSection
                  key={group.id}
                  groupId={group.id}
                  groupName={group.name}
                  materialIds={group.materialIds}
                  allMaterials={materials}
                  onDelete={() => deleteGroup(group.id)}
                  onRemoveMaterial={(materialId) => removeFromGroup(group.id, materialId)}
                />
              ))
            )}
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
}

export function EditorMaterialPanel({ className }: EditorMaterialPanelProps) {
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
          <SearchTab />
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
