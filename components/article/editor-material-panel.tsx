"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { GripVertical, Search, BookOpen, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useInfiniteMaterials } from "@/lib/hooks/use-infinite-materials"
import { useMaterialFavorites } from "@/lib/hooks/use-material-favorites"
import { Input } from "@/components/ui/base/input"
import { Button } from "@/components/ui/base/button"
import { Badge } from "@/components/ui/base/badge"
import { ScrollArea } from "@/components/ui/base/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/base/tabs"
import { Skeleton } from "@/components/ui/base/skeleton"
import { cn } from "@/lib/utils"
import type { Material } from "@/lib/api/materials/types"

// ==================== MaterialCard ====================

interface MaterialCardProps {
  material: Material
  onAddToGroup?: (materialId: number) => void
  showAddToGroup?: boolean
}

function MaterialCard({ material, onAddToGroup, showAddToGroup }: MaterialCardProps) {
  const { t } = useTranslation()

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.effectAllowed = "copy"
      e.dataTransfer.setData("text/plain", material.content || material.title)
    },
    [material.content, material.title]
  )

  return (
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
        {material.content && (
          <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
            {material.content}
          </p>
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

function SearchTab() {
  const { t } = useTranslation()
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(value)
    }, 400)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  const { materials, isLoading, hasMore, observerTarget } = useInfiniteMaterials({
    nameFilter: debouncedQuery || undefined,
    pageSize: 20,
    enabled: true,
  })

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={handleQueryChange}
          placeholder={t("contentWriting.materialPanel.searchPlaceholder")}
          className="pl-8"
        />
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 pr-2">
          {materials.map((material) => (
            <MaterialCard key={material.id} material={material} />
          ))}

          {/* Loading skeletons */}
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <MaterialCardSkeleton key={`skeleton-${i}`} />
            ))}

          {/* Infinite scroll observer target */}
          {hasMore && <div ref={observerTarget} className="h-4" />}

          {/* Empty state */}
          {!isLoading && materials.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Search className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {debouncedQuery
                  ? t("contentWriting.materialPanel.noResults")
                  : t("contentWriting.materialPanel.searchHint")}
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
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium hover:bg-accent/50 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          {groupName}
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            {materialIds.length}
          </Badge>
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="rounded p-0.5 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </button>

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

function LibraryTab() {
  const { t } = useTranslation()
  const { groups, createGroup, deleteGroup, addToGroup, removeFromGroup } = useMaterialFavorites()
  const [newGroupName, setNewGroupName] = useState("")
  const [showCreateInput, setShowCreateInput] = useState(false)

  const { materials, isLoading, hasMore, observerTarget } = useInfiniteMaterials({
    pageSize: 20,
    enabled: true,
  })

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
      {/* All materials list */}
      <div className="flex-1 overflow-hidden">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t("contentWriting.materialPanel.allMaterials")}
        </p>
        <ScrollArea className="h-[280px]">
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

// ==================== EditorMaterialPanel ====================

export interface EditorMaterialPanelProps {
  className?: string
}

export function EditorMaterialPanel({ className }: EditorMaterialPanelProps) {
  const { t } = useTranslation()

  return (
    <div className={cn("flex h-full flex-col overflow-hidden bg-background", className)}>
      <Tabs defaultValue="search" className="flex h-full flex-col">
        <TabsList className="mx-3 mt-3 shrink-0">
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
          <LibraryTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
