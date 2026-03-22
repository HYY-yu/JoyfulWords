# 搜索 Tab 重新设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the editor panel's Search Tab from browsing existing materials to triggering async searches, polling for results, and manually collecting results into the library. Add an upload button above tabs.

**Architecture:** Create a `useCollectedMaterials` hook (localStorage-based) for tracking which search results the user has "collected". Rewrite `SearchTab` to use async search + polling instead of `useInfiniteMaterials`. Update `LibraryTab` to client-filter by collected status. Add upload dialog directly in `EditorMaterialPanel`.

**Tech Stack:** React, TypeScript, Shadcn/ui, Tailwind CSS, localStorage, existing `materialsClient` API

**Spec:** `docs/superpowers/specs/2026-03-22-search-tab-redesign-design.md`

---

### Task 1: Create `useCollectedMaterials` hook

**Files:**
- Create: `lib/hooks/use-collected-materials.ts`

This hook manages which materials the user has "collected" (added to library) from search results, using localStorage as temporary storage.

- [ ] **Step 1: Create the hook file**

```typescript
// lib/hooks/use-collected-materials.ts
"use client"

import { useState, useCallback, useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-context"

const STORAGE_KEY_PREFIX = "joyfulwords-collected-materials"

function getStorageKey(userId: number): string {
  return `${STORAGE_KEY_PREFIX}-${userId}`
}

function loadFromStorage(userId: number): Set<number> {
  try {
    const raw = localStorage.getItem(getStorageKey(userId))
    if (!raw) return new Set()
    const ids: number[] = JSON.parse(raw)
    return new Set(ids)
  } catch {
    return new Set()
  }
}

function saveToStorage(userId: number, ids: Set<number>): void {
  localStorage.setItem(getStorageKey(userId), JSON.stringify([...ids]))
}

export interface UseCollectedMaterialsReturn {
  collectedIds: Set<number>
  collect: (id: number) => void
  uncollect: (id: number) => void
  isCollected: (id: number) => boolean
}

export function useCollectedMaterials(): UseCollectedMaterialsReturn {
  const { user } = useAuth()
  const [collectedIds, setCollectedIds] = useState<Set<number>>(new Set())

  // Load from localStorage when user is available
  useEffect(() => {
    if (user?.id) {
      setCollectedIds(loadFromStorage(user.id))
    }
  }, [user?.id])

  const collect = useCallback(
    (id: number) => {
      if (!user?.id) return
      setCollectedIds((prev) => {
        const next = new Set(prev)
        next.add(id)
        saveToStorage(user.id, next)
        return next
      })
    },
    [user?.id]
  )

  const uncollect = useCallback(
    (id: number) => {
      if (!user?.id) return
      setCollectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        saveToStorage(user.id, next)
        return next
      })
    },
    [user?.id]
  )

  const isCollected = useCallback(
    (id: number) => collectedIds.has(id),
    [collectedIds]
  )

  return { collectedIds, collect, uncollect, isCollected }
}
```

- [ ] **Step 2: Verify file compiles**

Run: `pnpm tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `use-collected-materials.ts`

- [ ] **Step 3: Commit**

```bash
git add lib/hooks/use-collected-materials.ts
git commit -m "feat: add useCollectedMaterials hook (localStorage-based)"
```

---

### Task 2: Add i18n translation keys

**Files:**
- Modify: `lib/i18n/locales/zh.ts`
- Modify: `lib/i18n/locales/en.ts`

Add all new translation keys needed for the redesigned search tab, upload dialog, and collection UI.

- [ ] **Step 1: Read both translation files to find the exact insertion points**

Read `lib/i18n/locales/zh.ts` and `lib/i18n/locales/en.ts`, locate `contentWriting.materialPanel` sections.

- [ ] **Step 2: Add Chinese translations**

**Important:** The keys `searchTab` and `libraryTab` already exist in this section. Do NOT duplicate them. Only add the NEW keys below. Merge them into the existing `contentWriting.materialPanel` object.

Add to the `contentWriting.materialPanel` section in `zh.ts` (after the existing keys):

```typescript
// Search tab redesign — new keys only
typeInfo: "资料",
typeNews: "新闻",
typeImage: "图片",
searchInputPlaceholder: "输入搜索关键词...",
searchButton: "搜索",
searching: "AI 搜索中...",
searchInitialHint: "输入关键词搜索新素材",
searchNoResults: "未找到相关素材",
collectButton: "加入素材库",
collected: "已采纳",
searchFailed: "搜索请求失败",
searchStatusFailed: "搜索失败，请重试",
searchTimeout: "搜索超时，请重试",
// Upload dialog
uploadButton: "上传素材",
uploadDialogTitle: "上传素材",
uploadMaterialName: "素材标题",
uploadMaterialNamePlaceholder: "请输入素材标题",
uploadMaterialType: "素材类型",
uploadMaterialContent: "素材内容",
uploadMaterialContentPlaceholder: "请输入素材内容",
uploadSelectImage: "选择图片",
uploadImageHint: "支持 PNG、JPEG 格式，最大 5MB",
uploadSubmit: "上传",
uploadCancel: "取消",
uploadSuccess: "上传成功",
uploadFailed: "上传失败",
uploadNameRequired: "请输入素材标题",
uploadContentRequired: "请输入素材内容",
uploadImageRequired: "请选择图片文件",
```

- [ ] **Step 3: Add English translations**

Same approach: merge into existing `contentWriting.materialPanel` in `en.ts`. Do NOT duplicate `searchTab`/`libraryTab`.

```typescript
// Search tab redesign — new keys only
typeInfo: "Info",
typeNews: "News",
typeImage: "Image",
searchInputPlaceholder: "Enter search keywords...",
searchButton: "Search",
searching: "AI searching...",
searchInitialHint: "Enter keywords to search for new materials",
searchNoResults: "No matching materials found",
collectButton: "Add to Library",
collected: "Collected",
searchFailed: "Search request failed",
searchStatusFailed: "Search failed, please retry",
searchTimeout: "Search timed out, please retry",
uploadButton: "Upload Material",
uploadDialogTitle: "Upload Material",
uploadMaterialName: "Material Title",
uploadMaterialNamePlaceholder: "Enter material title",
uploadMaterialType: "Material Type",
uploadMaterialContent: "Material Content",
uploadMaterialContentPlaceholder: "Enter material content",
uploadSelectImage: "Select Image",
uploadImageHint: "PNG, JPEG supported, max 5MB",
uploadSubmit: "Upload",
uploadCancel: "Cancel",
uploadSuccess: "Upload successful",
uploadFailed: "Upload failed",
uploadNameRequired: "Please enter material title",
uploadContentRequired: "Please enter material content",
uploadImageRequired: "Please select an image file",
```

- [ ] **Step 4: Verify compilation**

Run: `pnpm tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 5: Commit**

```bash
git add lib/i18n/locales/zh.ts lib/i18n/locales/en.ts
git commit -m "feat: add i18n keys for search tab redesign and upload dialog"
```

---

### Task 3: Rewrite `SearchTab` component

**Files:**
- Modify: `components/article/editor-material-panel.tsx` (replace `SearchTab` function, lines 145-218)

Replace the current `SearchTab` that uses `useInfiniteMaterials` with a new implementation that:
1. Has a material type selector (资料/新闻/图片)
2. Has a search input + search button
3. Triggers async search via `materialsClient.search()`
4. Polls `getSearchLogs` every 3 seconds to detect completion
5. Fetches results via `getMaterials` filtered by `material_logs_id === latestLogId`
6. Shows "加入素材库" button on each result card
7. Handles errors and timeouts per spec

- [ ] **Step 1: Add new imports at top of file**

Modify existing imports in `editor-material-panel.tsx` — do NOT add duplicate import lines from the same modules:

1. **Modify** the existing lucide-react import (line 4) to add `Check, Upload, Loader2`:
   ```typescript
   import { GripVertical, Search, BookOpen, ChevronDown, ChevronRight, Plus, Trash2, FileText, Newspaper, ImageIcon, X, Check, Upload, Loader2 } from "lucide-react"
   ```

2. **Modify** the existing types import (line 16) to add `MaterialLog`:
   ```typescript
   import type { Material, MaterialType, MaterialLog } from "@/lib/api/materials/types"
   ```

3. **Add** these new imports:
   ```typescript
   import { materialsClient, uploadFileToPresignedUrl } from "@/lib/api/materials/client"
   import { useCollectedMaterials } from "@/lib/hooks/use-collected-materials"
   import { useToast } from "@/hooks/use-toast"
   import { Label } from "@/components/ui/base/label"
   import { Textarea } from "@/components/ui/base/textarea"
   ```

Note: `LibraryTab` still uses `useInfiniteMaterials`, so keep that import.

- [ ] **Step 2: Add `SearchResultCard` component**

Add after `MaterialCardSkeleton`, before `SearchTab`:

```typescript
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
```

- [ ] **Step 3: Rewrite `SearchTab` component**

Replace the entire `SearchTab` function (lines 145-218) with:

```typescript
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

  // Cleanup polling on unmount or type change
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
    //    (avoids overlapping async polls that setInterval can cause)
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
          // Schedule next poll
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
        // Schedule next poll
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
```

- [ ] **Step 4: Verify compilation**

Run: `pnpm tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 5: Commit**

```bash
git add components/article/editor-material-panel.tsx
git commit -m "feat: rewrite SearchTab with async search, polling, and collect UI"
```

---

### Task 4: Update `LibraryTab` to filter by collected status

**Files:**
- Modify: `components/article/editor-material-panel.tsx` (modify `LibraryTab` function, lines 298-466)

The `LibraryTab` should now only show materials that are either:
- User-uploaded (`material_logs_id === 0`)
- Collected by the user (`isCollected(material.id)`)

- [ ] **Step 1: Add `useCollectedMaterials` to LibraryTab and filter materials**

In the `LibraryTab` function, add the hook and apply client-side filtering:

```typescript
function LibraryTab() {
  const { t } = useTranslation()
  const { groups, createGroup, deleteGroup, addToGroup, removeFromGroup } = useMaterialFavorites()
  const { isCollected } = useCollectedMaterials()
  const [newGroupName, setNewGroupName] = useState("")
  const [showCreateInput, setShowCreateInput] = useState(false)
  const [activeCategory, setActiveCategory] = useState<MaterialType>("info")

  const { materials: allMaterials, isLoading, hasMore, observerTarget } = useInfiniteMaterials({
    type: activeCategory,
    pageSize: 20,
    enabled: true,
  })

  // Client-side filter: only show uploaded (material_logs_id === 0) or collected materials
  const materials = allMaterials.filter(
    (m) => m.material_logs_id === 0 || isCollected(m.id)
  )

  // hasMore from the hook is based on unfiltered total, which may be inaccurate after
  // client-side filtering. Use "did the raw page return a full page of items" as the
  // hasMore signal instead. The infinite scroll observer target should use this value.
  const effectiveHasMore = hasMore && allMaterials.length > 0

  // ... rest of the component stays the same, using `materials` for rendering and
  // `effectiveHasMore` instead of `hasMore` for the observer target div.
```

The key changes are:
1. Rename the hook's `materials` to `allMaterials` and add the filter
2. Use `effectiveHasMore` for the infinite scroll observer target
3. The rest of the JSX remains identical

- [ ] **Step 2: Verify compilation**

Run: `pnpm tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add components/article/editor-material-panel.tsx
git commit -m "feat: filter LibraryTab to show only uploaded or collected materials"
```

---

### Task 5: Add upload button and upload dialog to `EditorMaterialPanel`

**Files:**
- Modify: `components/article/editor-material-panel.tsx` (modify `EditorMaterialPanel` function and add `UploadDialog`)

Add an upload button above the tabs and a lightweight upload dialog.

- [ ] **Step 1: Add `UploadDialog` component**

Add before `EditorMaterialPanel`:

```typescript
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
  }, [title, materialType, content, imageFile, toast, t, resetForm, onOpenChange])

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
```

- [ ] **Step 2: Update `EditorMaterialPanel` to include upload button + dialog**

Replace the `EditorMaterialPanel` function:

```typescript
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
```

- [ ] **Step 3: Verify compilation**

Run: `pnpm tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 4: Verify dev server renders correctly**

Run: `pnpm dev` and manually check the editor material panel.

- [ ] **Step 5: Commit**

```bash
git add components/article/editor-material-panel.tsx
git commit -m "feat: add upload button and dialog to EditorMaterialPanel"
```

---

### Task 6: Clean up unused imports

**Files:**
- Modify: `components/article/editor-material-panel.tsx`

- [ ] **Step 1: Remove `useInfiniteMaterials` import if no longer used by any component**

Check if `LibraryTab` still uses `useInfiniteMaterials`. If yes, keep the import. If no component uses it, remove the import line.

- [ ] **Step 2: Verify no TypeScript errors**

Run: `pnpm tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Final commit**

```bash
git add components/article/editor-material-panel.tsx
git commit -m "refactor: clean up unused imports in editor-material-panel"
```
