# 文章编辑器三栏布局实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将文章编辑器重构为三栏布局的独立页面 (`/articles/[id]/edit`)，左栏素材面板、中栏编辑器、右栏 AI 功能 + 任务进度。

**Architecture:** 新建独立路由页面，复用现有 TiptapEditor、AI Dialog、素材搜索等组件。三栏通过自定义 Hook 实现可拖拽分隔条。编辑器顶栏保留返回/标题编辑/保存功能。

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS 4.x, Tiptap 3.x, Shadcn/ui, React DnD (HTML5 drag & drop)

**Spec:** `docs/superpowers/specs/2026-03-21-article-editor-three-column-layout-design.md`

---

## Chunk 1: 基础设施 — 路由、布局容器、可拖拽面板

### Task 1: 创建可拖拽面板 Hook

**Files:**
- Create: `lib/hooks/use-resizable-panels.ts`

这个 Hook 管理三栏宽度，支持拖拽分隔条调整，并持久化到 localStorage。

- [ ] **Step 1: 创建 Hook 文件**

```typescript
// lib/hooks/use-resizable-panels.ts
"use client"

import { useState, useCallback, useEffect, useRef } from "react"

interface PanelConstraints {
  minWidth: number  // px
  maxWidth: number  // px
}

interface UseResizablePanelsOptions {
  storageKey: string
  defaultLeftWidth: number   // percentage 0-100
  defaultRightWidth: number  // percentage 0-100
  leftConstraints: PanelConstraints
  rightConstraints: PanelConstraints
  centerMinWidth: number     // px
}

interface ResizablePanelsReturn {
  leftWidth: number          // percentage
  rightWidth: number         // percentage
  centerWidth: number        // percentage
  leftCollapsed: boolean
  rightCollapsed: boolean
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  handleLeftDragStart: (e: React.MouseEvent) => void
  handleRightDragStart: (e: React.MouseEvent) => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function useResizablePanels(options: UseResizablePanelsOptions): ResizablePanelsReturn {
  const {
    storageKey,
    defaultLeftWidth,
    defaultRightWidth,
    leftConstraints,
    rightConstraints,
    centerMinWidth,
  } = options

  const containerRef = useRef<HTMLDivElement | null>(null)

  // Load from localStorage or use defaults
  const [leftWidth, setLeftWidth] = useState(() => {
    if (typeof window === "undefined") return defaultLeftWidth
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.leftWidth ?? defaultLeftWidth
      } catch { return defaultLeftWidth }
    }
    return defaultLeftWidth
  })

  const [rightWidth, setRightWidth] = useState(() => {
    if (typeof window === "undefined") return defaultRightWidth
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.rightWidth ?? defaultRightWidth
      } catch { return defaultRightWidth }
    }
    return defaultRightWidth
  })

  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ leftWidth, rightWidth }))
  }, [storageKey, leftWidth, rightWidth])

  const centerWidth = 100 - (leftCollapsed ? 0 : leftWidth) - (rightCollapsed ? 0 : rightWidth)

  const toggleLeftPanel = useCallback(() => setLeftCollapsed(prev => !prev), [])
  const toggleRightPanel = useCallback(() => setRightCollapsed(prev => !prev), [])

  const createDragHandler = useCallback((side: "left" | "right") => {
    return (e: React.MouseEvent) => {
      e.preventDefault()
      const container = containerRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const containerWidth = containerRect.width

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const relativeX = moveEvent.clientX - containerRect.left
        const percentage = (relativeX / containerWidth) * 100

        if (side === "left") {
          const minPct = (leftConstraints.minWidth / containerWidth) * 100
          const maxPct = (leftConstraints.maxWidth / containerWidth) * 100
          const centerMinPct = (centerMinWidth / containerWidth) * 100
          const maxAllowed = 100 - (rightCollapsed ? 0 : rightWidth) - centerMinPct
          const newWidth = Math.max(minPct, Math.min(maxPct, Math.min(maxAllowed, percentage)))
          setLeftWidth(newWidth)
        } else {
          const rightPct = 100 - (relativeX / containerWidth) * 100
          const minPct = (rightConstraints.minWidth / containerWidth) * 100
          const maxPct = (rightConstraints.maxWidth / containerWidth) * 100
          const centerMinPct = (centerMinWidth / containerWidth) * 100
          const maxAllowed = 100 - (leftCollapsed ? 0 : leftWidth) - centerMinPct
          const newWidth = Math.max(minPct, Math.min(maxPct, Math.min(maxAllowed, rightPct)))
          setRightWidth(newWidth)
        }
      }

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
    }
  }, [leftConstraints, rightConstraints, centerMinWidth, leftWidth, rightWidth, leftCollapsed, rightCollapsed])

  return {
    leftWidth,
    rightWidth,
    centerWidth,
    leftCollapsed,
    rightCollapsed,
    toggleLeftPanel,
    toggleRightPanel,
    handleLeftDragStart: createDragHandler("left"),
    handleRightDragStart: createDragHandler("right"),
    containerRef,
  }
}
```

- [ ] **Step 2: 验证文件创建成功**

确认文件存在且无 TypeScript 语法错误。

- [ ] **Step 3: Commit**

```bash
git add lib/hooks/use-resizable-panels.ts
git commit -m "feat: add useResizablePanels hook for three-column layout"
```

---

### Task 2: 创建编辑器顶栏组件

**Files:**
- Create: `components/article/editor-top-bar.tsx`
- Reference: `components/article/article-editor-header.tsx` (了解现有头部结构)

编辑器顶栏：← 返回 + 可编辑标题 + 状态Badge + 清空/导出/保存按钮。

- [ ] **Step 1: 创建 EditorTopBar 组件**

```typescript
// components/article/editor-top-bar.tsx
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
import { ArrowLeftIcon, DownloadIcon, Trash2Icon, SaveIcon, LoaderIcon } from "lucide-react"
import type { Article, ArticleStatus } from "@/lib/api/articles/types"
import { getStatusVariant } from "./article-types"
import { useToast } from "@/hooks/use-toast"
import { articlesClient } from "@/lib/api/articles/client"

interface EditorTopBarProps {
  article: Article | null
  onSave?: () => void
  onExport?: (format: "markdown" | "html") => void
  onClean?: () => void
  onArticleUpdated?: (article: Article) => void
  isSaving?: boolean
  saveState?: "idle" | "saving" | "saved" | "error"
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

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(article?.title || "")
  const [isSavingTitle, setIsSavingTitle] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (article) setTitleValue(article.title)
  }, [article])

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [editingTitle])

  const getStatusText = (status: ArticleStatus): string => {
    return t(`contentWriting.manager.status.${status}` as any)
  }

  const handleSaveTitle = async () => {
    if (!article || isSavingTitle || !titleValue.trim()) return
    if (titleValue === article.title) {
      setEditingTitle(false)
      return
    }

    setIsSavingTitle(true)
    const result = await articlesClient.updateArticleMetadata(article.id, { title: titleValue.trim() })
    setIsSavingTitle(false)

    if ("error" in result) {
      toast({ variant: "destructive", title: t("contentWriting.editorHeader.saveMetadataFailed"), description: result.error })
      setTitleValue(article.title)
    } else {
      onArticleUpdated?.({ ...article, title: titleValue.trim() })
      toast({ title: t("contentWriting.editorHeader.saveMetadataSuccess") })
    }
    setEditingTitle(false)
  }

  const handleGoBack = () => {
    router.push("/articles")
  }

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-background border-b">
      {/* Left: Back + Title + Status */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleGoBack}>
          <ArrowLeftIcon className="w-4 h-4" />
        </Button>

        {editingTitle ? (
          <Input
            ref={titleInputRef}
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveTitle()
              if (e.key === "Escape") { setTitleValue(article?.title || ""); setEditingTitle(false) }
            }}
            className="h-8 text-sm font-semibold max-w-[300px]"
            disabled={isSavingTitle}
          />
        ) : (
          <h3
            className="text-sm font-semibold truncate cursor-pointer hover:bg-muted/50 rounded px-2 py-1"
            onClick={() => article && setEditingTitle(true)}
          >
            {article?.title || t("contentWriting.editorHeader.newArticle")}
          </h3>
        )}

        {article && (
          <Badge variant={getStatusVariant(article.status)} className="shrink-0 text-xs">
            {getStatusText(article.status)}
          </Badge>
        )}

        {isSavingTitle && <LoaderIcon className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {onClean && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onClean}>
                <Trash2Icon className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><span>{t("contentWriting.editorHeader.cleanTooltip")}</span></TooltipContent>
          </Tooltip>
        )}

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
          <TooltipContent><span>{t("contentWriting.editorHeader.exportTooltip")}</span></TooltipContent>
        </Tooltip>

        <Button size="sm" className="h-8 px-4" onClick={onSave} disabled={isSaving}>
          {isSaving ? <LoaderIcon className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <SaveIcon className="w-3.5 h-3.5 mr-1.5" />}
          {t("contentWriting.editorHeader.saveTooltip")}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/article/editor-top-bar.tsx
git commit -m "feat: add EditorTopBar component with editable title"
```

---

### Task 3: 创建三栏布局容器

**Files:**
- Create: `components/article/article-editor-layout.tsx`

三栏布局容器组件，使用 `useResizablePanels` 管理面板宽度。

- [ ] **Step 1: 创建布局容器组件**

```typescript
// components/article/article-editor-layout.tsx
"use client"

import { ReactNode } from "react"
import { useResizablePanels } from "@/lib/hooks/use-resizable-panels"
import { cn } from "@/lib/utils"

interface ArticleEditorLayoutProps {
  leftPanel: ReactNode
  centerPanel: ReactNode
  rightPanel: ReactNode
  topBar: ReactNode
}

export function ArticleEditorLayout({
  leftPanel,
  centerPanel,
  rightPanel,
  topBar,
}: ArticleEditorLayoutProps) {
  const {
    leftWidth,
    rightWidth,
    leftCollapsed,
    rightCollapsed,
    toggleLeftPanel,
    toggleRightPanel,
    handleLeftDragStart,
    handleRightDragStart,
    containerRef,
  } = useResizablePanels({
    storageKey: "joyfulwords-editor-panel-widths",
    defaultLeftWidth: 22,
    defaultRightWidth: 24,
    leftConstraints: { minWidth: 180, maxWidth: 400 },
    rightConstraints: { minWidth: 200, maxWidth: 420 },
    centerMinWidth: 400,
  })

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      {/* Top bar */}
      {topBar}

      {/* Three-column body */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        {!leftCollapsed && (
          <>
            <div
              className="flex flex-col overflow-hidden border-r bg-muted/30"
              style={{ width: `${leftWidth}%` }}
            >
              {leftPanel}
            </div>

            {/* Left resize handle */}
            <div
              className="w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors relative flex-shrink-0 group"
              onMouseDown={handleLeftDragStart}
            >
              <div className="absolute top-1/2 left-0 w-1 h-8 bg-border rounded-full -translate-y-1/2 group-hover:bg-primary/40" />
            </div>
          </>
        )}

        {/* Center panel */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {centerPanel}
        </div>

        {/* Right resize handle */}
        {!rightCollapsed && (
          <>
            <div
              className="w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors relative flex-shrink-0 group"
              onMouseDown={handleRightDragStart}
            >
              <div className="absolute top-1/2 left-0 w-1 h-8 bg-border rounded-full -translate-y-1/2 group-hover:bg-primary/40" />
            </div>

            {/* Right panel */}
            <div
              className="flex flex-col overflow-hidden border-l bg-muted/30"
              style={{ width: `${rightWidth}%` }}
            >
              {rightPanel}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/article/article-editor-layout.tsx
git commit -m "feat: add ArticleEditorLayout three-column container"
```

---

### Task 4: 创建编辑页面路由

**Files:**
- Create: `app/articles/[id]/edit/page.tsx`

独立路由页面，获取文章数据并渲染三栏布局。

- [ ] **Step 1: 创建路由目录和页面文件**

```typescript
// app/articles/[id]/edit/page.tsx
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useToast } from "@/hooks/use-toast"
import { articlesClient } from "@/lib/api/articles/client"
import { useEditorState } from "@/lib/editor-state"
import { useAutoSave } from "@/lib/hooks/use-auto-save"
import { loadAIEditTasks, saveAIEditTasks, addAIEditTask, removeAIEditTask } from "@/lib/hooks/use-ai-edit-state"
import { useMultipleAIEditPollers } from "@/lib/hooks/use-multiple-ai-edit-pollers"
import type { Article } from "@/lib/api/articles/types"
import type { AIEditState } from "@/lib/hooks/use-ai-edit-state"
import { ArticleEditorLayout } from "@/components/article/article-editor-layout"
import { EditorTopBar } from "@/components/article/editor-top-bar"
import { EditorMaterialPanel } from "@/components/article/editor-material-panel"
import { EditorAIPanel } from "@/components/article/editor-ai-panel"
import TiptapEditor from "@/components/tiptap-editor"
import { normalizeContentToHTML } from "@/lib/tiptap-utils"
import { convertHtmlToMarkdown } from "@/lib/tiptap-utils"

export default function ArticleEditPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { t } = useTranslation()
  const { toast } = useToast()
  const articleId = Number(params.id)

  // Article state
  const [article, setArticle] = useState<Article | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Editor state
  const editorState = useEditorState()
  const editorRef = useRef<any>(null)

  // AI edit state
  const [aiEditTasks, setAiEditTasks] = useState<Map<string, AIEditState>>(new Map())
  const [activeExecId, setActiveExecId] = useState<string | null>(null)

  // Auto-save
  const { saveState, triggerSave } = useAutoSave({
    articleId: article?.id ?? null,
    content: editorState.content.html,
    isDirty: editorState.metadata.isDirty,
    onSaved: () => editorState.markSaved(),
    enabled: !!article,
  })

  // Load article
  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push("/auth/login"); return }

    const loadArticle = async () => {
      setIsLoading(true)
      const result = await articlesClient.getArticle(articleId)
      if ("error" in result) {
        toast({ variant: "destructive", title: t("contentWriting.writing.loadFailed"), description: result.error })
        router.push("/articles")
        return
      }
      setArticle(result)
      const html = normalizeContentToHTML(result.content || "")
      editorState.setContent(html, html.replace(/<[^>]*>/g, ""))
      editorState.markSaved()
      setIsLoading(false)
    }

    loadArticle()
  }, [articleId, user, authLoading])

  // Load AI edit tasks
  useEffect(() => {
    if (!user) return
    const tasks = loadAIEditTasks(user.id)
    // Filter to only this article's tasks
    const articleTasks = new Map<string, AIEditState>()
    tasks.forEach((task, key) => {
      if (task.article_id === articleId) articleTasks.set(key, task)
    })
    setAiEditTasks(articleTasks)
  }, [user, articleId])

  // AI edit pollers
  useMultipleAIEditPollers({
    tasks: aiEditTasks,
    onSuccess: (execId, resultText) => {
      setAiEditTasks(prev => {
        const next = new Map(prev)
        const task = next.get(execId)
        if (task) {
          next.set(execId, { ...task, status: "idle", result_text: resultText })
        }
        return next
      })
      if (user) {
        const allTasks = loadAIEditTasks(user.id)
        const task = allTasks.get(execId)
        if (task) {
          allTasks.set(execId, { ...task, status: "idle", result_text: resultText })
          saveAIEditTasks(user.id, allTasks)
        }
      }
    },
    onError: (execId, message) => {
      toast({ variant: "destructive", title: "AI 编辑失败", description: message })
      handleRemoveTask(execId)
    },
    onExpired: (execId) => {
      toast({ variant: "destructive", title: "AI 编辑超时" })
      handleRemoveTask(execId)
    },
  })

  const handleRemoveTask = useCallback((execId: string) => {
    setAiEditTasks(prev => {
      const next = new Map(prev)
      next.delete(execId)
      return next
    })
    if (user) removeAIEditTask(user.id, execId)
  }, [user])

  const handleContentChange = useCallback((html: string, text: string) => {
    editorState.setContent(html, text)
  }, [])

  const handleSave = useCallback(async () => {
    if (!article) return
    triggerSave()
  }, [article, triggerSave])

  const handleExport = useCallback((format: "markdown" | "html") => {
    const content = editorState.content.html
    if (format === "markdown") {
      const md = convertHtmlToMarkdown(content)
      downloadFile(md, `${article?.title || "article"}.md`, "text/markdown")
    } else {
      downloadFile(content, `${article?.title || "article"}.html`, "text/html")
    }
  }, [editorState.content.html, article])

  const handleClean = useCallback(() => {
    editorState.reset()
  }, [])

  const handleArticleUpdated = useCallback((updated: Article) => {
    setArticle(updated)
  }, [])

  // Auth guard
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user || !article) return null

  return (
    <ArticleEditorLayout
      topBar={
        <EditorTopBar
          article={article}
          onSave={handleSave}
          onExport={handleExport}
          onClean={handleClean}
          onArticleUpdated={handleArticleUpdated}
          isSaving={saveState === "saving"}
          saveState={saveState}
        />
      }
      leftPanel={
        <EditorMaterialPanel
          onInsertMaterial={(text) => {
            // Insert at cursor position in editor
            editorRef.current?.commands?.insertContent(text)
          }}
        />
      }
      centerPanel={
        <div className="flex flex-col h-full">
          <TiptapEditor
            ref={editorRef}
            content={editorState.content.html}
            onUpdate={handleContentChange}
            aiEditTasks={aiEditTasks}
            activeExecId={activeExecId}
            onAIPendingBlockClick={(execId) => setActiveExecId(execId)}
          />
          {/* Status bar */}
          <div className="flex items-center justify-between px-4 py-1.5 border-t text-xs text-muted-foreground">
            <span>{t("contentWriting.writing.wordCount")}: {editorState.metadata.wordCount}</span>
            <span className={saveState === "saved" ? "text-green-600" : ""}>
              {saveState === "saving" && t("contentWriting.writing.saving")}
              {saveState === "saved" && `✓ ${t("contentWriting.writing.saved")}`}
              {saveState === "error" && t("contentWriting.writing.saveFailed")}
            </span>
          </div>
        </div>
      }
      rightPanel={
        <EditorAIPanel
          article={article}
          aiEditTasks={aiEditTasks}
          activeExecId={activeExecId}
          onSetActiveExecId={setActiveExecId}
          onAddTask={(task) => {
            setAiEditTasks(prev => new Map(prev).set(task.exec_id, task))
            if (user) addAIEditTask(user.id, task)
          }}
          onRemoveTask={handleRemoveTask}
          editorContent={editorState.content.html}
        />
      }
    />
  )
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

注意：此文件引用了尚未创建的 `EditorMaterialPanel` 和 `EditorAIPanel`，将在后续 Task 中实现。当前阶段可能会有 TypeScript 报错，这是预期的。

- [ ] **Step 2: Commit**

```bash
git add app/articles/[id]/edit/page.tsx
git commit -m "feat: add article edit page route with three-column layout"
```

---

## Chunk 2: 左栏 — 素材面板

### Task 5: 创建素材收藏夹 Hook

**Files:**
- Create: `lib/hooks/use-material-favorites.ts`

前端 localStorage 收藏夹管理。

- [ ] **Step 1: 创建 Hook**

```typescript
// lib/hooks/use-material-favorites.ts
"use client"

import { useState, useCallback, useEffect } from "react"

interface FavoriteGroup {
  id: string
  name: string
  materialIds: number[]
}

interface UseMaterialFavoritesReturn {
  groups: FavoriteGroup[]
  createGroup: (name: string) => void
  deleteGroup: (groupId: string) => void
  renameGroup: (groupId: string, name: string) => void
  addToGroup: (groupId: string, materialId: number) => void
  removeFromGroup: (groupId: string, materialId: number) => void
  isInGroup: (groupId: string, materialId: number) => boolean
}

const STORAGE_KEY = "joyfulwords-material-favorites"

export function useMaterialFavorites(): UseMaterialFavoritesReturn {
  const [groups, setGroups] = useState<FavoriteGroup[]>(() => {
    if (typeof window === "undefined") return []
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  }, [groups])

  const createGroup = useCallback((name: string) => {
    setGroups(prev => [...prev, { id: crypto.randomUUID(), name, materialIds: [] }])
  }, [])

  const deleteGroup = useCallback((groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId))
  }, [])

  const renameGroup = useCallback((groupId: string, name: string) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name } : g))
  }, [])

  const addToGroup = useCallback((groupId: string, materialId: number) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId && !g.materialIds.includes(materialId)
        ? { ...g, materialIds: [...g.materialIds, materialId] }
        : g
    ))
  }, [])

  const removeFromGroup = useCallback((groupId: string, materialId: number) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId
        ? { ...g, materialIds: g.materialIds.filter(id => id !== materialId) }
        : g
    ))
  }, [])

  const isInGroup = useCallback((groupId: string, materialId: number) => {
    return groups.find(g => g.id === groupId)?.materialIds.includes(materialId) ?? false
  }, [groups])

  return { groups, createGroup, deleteGroup, renameGroup, addToGroup, removeFromGroup, isInGroup }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/hooks/use-material-favorites.ts
git commit -m "feat: add useMaterialFavorites hook with localStorage"
```

---

### Task 6: 创建素材面板组件

**Files:**
- Create: `components/article/editor-material-panel.tsx`
- Reference: `components/materials/material-search.tsx`, `lib/hooks/use-infinite-materials.ts`

左栏素材面板，包含搜索 Tab 和素材库 Tab。素材卡片支持拖拽。

- [ ] **Step 1: 创建素材面板组件**

```typescript
// components/article/editor-material-panel.tsx
"use client"

import { useState, useCallback } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useInfiniteMaterials } from "@/lib/hooks/use-infinite-materials"
import { useMaterialFavorites } from "@/lib/hooks/use-material-favorites"
import { Input } from "@/components/ui/base/input"
import { Button } from "@/components/ui/base/button"
import { Badge } from "@/components/ui/base/badge"
import { SearchIcon, PlusIcon, Trash2Icon, ChevronDownIcon, ChevronRightIcon, GripVerticalIcon, StarIcon } from "lucide-react"
import type { Material } from "@/lib/api/materials/types"
import { cn } from "@/lib/utils"

interface EditorMaterialPanelProps {
  onInsertMaterial?: (text: string) => void
}

export function EditorMaterialPanel({ onInsertMaterial }: EditorMaterialPanelProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<"search" | "library">("search")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b shrink-0">
        <button
          className={cn(
            "flex-1 py-2.5 text-sm font-medium text-center transition-colors",
            activeTab === "search"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("search")}
        >
          {t("contentWriting.materialPanel.search")}
        </button>
        <button
          className={cn(
            "flex-1 py-2.5 text-sm font-medium text-center transition-colors",
            activeTab === "library"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("library")}
        >
          {t("contentWriting.materialPanel.library")}
        </button>
      </div>

      {activeTab === "search" ? (
        <MaterialSearchTab
          searchQuery={searchQuery}
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearch={() => setSearchQuery(searchInput)}
          onInsertMaterial={onInsertMaterial}
        />
      ) : (
        <MaterialLibraryTab onInsertMaterial={onInsertMaterial} />
      )}
    </div>
  )
}

// --- Search Tab ---
function MaterialSearchTab({
  searchQuery,
  searchInput,
  onSearchInputChange,
  onSearch,
  onInsertMaterial,
}: {
  searchQuery: string
  searchInput: string
  onSearchInputChange: (v: string) => void
  onSearch: () => void
  onInsertMaterial?: (text: string) => void
}) {
  const { t } = useTranslation()
  const { materials, isLoading, hasMore, loadMore, observerTarget } = useInfiniteMaterials({
    nameFilter: searchQuery,
    pageSize: 20,
    enabled: true,
  })

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Search bar */}
      <div className="p-3 shrink-0">
        <div className="flex gap-1.5">
          <Input
            placeholder={t("contentWriting.materialPanel.searchPlaceholder")}
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            className="h-8 text-sm"
          />
          <Button size="sm" variant="outline" className="h-8 px-2.5 shrink-0" onClick={onSearch}>
            <SearchIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="flex flex-col gap-2">
          {materials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              onInsert={onInsertMaterial}
            />
          ))}
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
            </div>
          )}
          <div ref={observerTarget} />
        </div>
      </div>
    </div>
  )
}

// --- Library Tab ---
function MaterialLibraryTab({
  onInsertMaterial,
}: {
  onInsertMaterial?: (text: string) => void
}) {
  const { t } = useTranslation()
  const { materials, isLoading, hasMore, loadMore, observerTarget } = useInfiniteMaterials({
    pageSize: 20,
    enabled: true,
  })
  const favorites = useMaterialFavorites()
  const [newGroupName, setNewGroupName] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      next.has(groupId) ? next.delete(groupId) : next.add(groupId)
      return next
    })
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3">
      {/* All materials */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          {t("contentWriting.materialPanel.allMaterials")}
        </h4>
        <div className="flex flex-col gap-2">
          {materials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              onInsert={onInsertMaterial}
              favoriteGroups={favorites.groups}
              onAddToGroup={(groupId) => favorites.addToGroup(groupId, material.id)}
            />
          ))}
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
            </div>
          )}
          <div ref={observerTarget} />
        </div>
      </div>

      {/* Favorites section */}
      <div className="border-t pt-3">
        <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
          <StarIcon className="w-3 h-3" />
          {t("contentWriting.materialPanel.favorites")}
        </h4>

        {/* Create group */}
        <div className="flex gap-1.5 mb-2">
          <Input
            placeholder={t("contentWriting.materialPanel.newGroupPlaceholder")}
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newGroupName.trim()) {
                favorites.createGroup(newGroupName.trim())
                setNewGroupName("")
              }
            }}
            className="h-7 text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 shrink-0"
            onClick={() => {
              if (newGroupName.trim()) {
                favorites.createGroup(newGroupName.trim())
                setNewGroupName("")
              }
            }}
          >
            <PlusIcon className="w-3 h-3" />
          </Button>
        </div>

        {/* Groups */}
        {favorites.groups.map((group) => (
          <div key={group.id} className="mb-2">
            <div
              className="flex items-center justify-between py-1 cursor-pointer hover:bg-muted/50 rounded px-1"
              onClick={() => toggleGroup(group.id)}
            >
              <div className="flex items-center gap-1 text-xs font-medium">
                {expandedGroups.has(group.id) ? (
                  <ChevronDownIcon className="w-3 h-3" />
                ) : (
                  <ChevronRightIcon className="w-3 h-3" />
                )}
                {group.name}
                <span className="text-muted-foreground">({group.materialIds.length})</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); favorites.deleteGroup(group.id) }}
              >
                <Trash2Icon className="w-3 h-3" />
              </Button>
            </div>

            {expandedGroups.has(group.id) && (
              <div className="pl-4 flex flex-col gap-1 mt-1">
                {group.materialIds.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2">
                    {t("contentWriting.materialPanel.emptyGroup")}
                  </p>
                )}
                {/* Note: would need to fetch materials by IDs here */}
                {materials
                  .filter(m => group.materialIds.includes(m.id))
                  .map(material => (
                    <MaterialCard
                      key={material.id}
                      material={material}
                      onInsert={onInsertMaterial}
                      compact
                    />
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Material Card ---
function MaterialCard({
  material,
  onInsert,
  compact = false,
  favoriteGroups,
  onAddToGroup,
}: {
  material: Material
  onInsert?: (text: string) => void
  compact?: boolean
  favoriteGroups?: { id: string; name: string }[]
  onAddToGroup?: (groupId: string) => void
}) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", material.content || material.name)
    e.dataTransfer.effectAllowed = "copy"
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "bg-background border rounded-lg cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow",
        compact ? "p-2" : "p-3"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className={cn("font-medium text-foreground truncate", compact ? "text-xs" : "text-sm")}>
            {material.name}
          </div>
          {!compact && material.content && (
            <div className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
              {material.content}
            </div>
          )}
        </div>
        <GripVerticalIcon className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
      </div>

      {!compact && material.tags && (
        <div className="flex flex-wrap gap-1 mt-2">
          {material.tags.split(",").map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
              {tag.trim()}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/article/editor-material-panel.tsx
git commit -m "feat: add EditorMaterialPanel with search, library, and drag support"
```

---

## Chunk 3: 右栏 — AI 功能面板 + 任务进度

### Task 7: 创建任务进度组件

**Files:**
- Create: `components/article/editor-task-progress.tsx`

统一展示 AI 编辑和图片生成任务的进度列表。

- [ ] **Step 1: 创建任务进度组件**

```typescript
// components/article/editor-task-progress.tsx
"use client"

import { useTranslation } from "@/lib/i18n/i18n-context"
import { XIcon, CheckIcon, AlertCircleIcon, LoaderIcon } from "lucide-react"
import type { AIEditState } from "@/lib/hooks/use-ai-edit-state"
import { cn } from "@/lib/utils"

interface TaskItem {
  id: string
  type: "ai-edit" | "image-generation"
  status: "pending" | "completed" | "failed"
  label: string
  description: string
  startedAt: number
  completedAt?: number
}

interface EditorTaskProgressProps {
  aiEditTasks: Map<string, AIEditState>
  imageGenerationTasks?: TaskItem[]
  onRemoveTask: (taskId: string) => void
  onClickTask?: (taskId: string) => void
}

export function EditorTaskProgress({
  aiEditTasks,
  imageGenerationTasks = [],
  onRemoveTask,
  onClickTask,
}: EditorTaskProgressProps) {
  const { t } = useTranslation()

  // Convert AI edit tasks to unified format
  const aiTasks: TaskItem[] = Array.from(aiEditTasks.entries()).map(([execId, task]) => ({
    id: execId,
    type: "ai-edit" as const,
    status: task.status === "waiting" ? "pending" as const : task.result_text ? "completed" as const : "failed" as const,
    label: t("contentWriting.taskProgress.aiEdit"),
    description: task.cut_text ? `${task.cut_text.substring(0, 30)}...` : "",
    startedAt: task.started_at,
  }))

  const allTasks = [...aiTasks, ...imageGenerationTasks].sort((a, b) => b.startedAt - a.startedAt)

  if (allTasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
        {t("contentWriting.taskProgress.noTasks")}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {allTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onRemove={() => onRemoveTask(task.id)}
          onClick={() => onClickTask?.(task.id)}
        />
      ))}
    </div>
  )
}

function TaskCard({
  task,
  onRemove,
  onClick,
}: {
  task: TaskItem
  onRemove: () => void
  onClick: () => void
}) {
  const timeAgo = getTimeAgo(task.startedAt)

  return (
    <div
      className={cn(
        "group bg-background border rounded-lg p-2.5 transition-colors",
        task.status === "pending" && "border-primary bg-primary/5",
        task.status === "failed" && "border-destructive/50 bg-destructive/5",
        task.status === "completed" && "cursor-pointer hover:bg-muted/50"
      )}
      onClick={task.status === "completed" ? onClick : undefined}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {task.status === "pending" && (
            <LoaderIcon className="w-3 h-3 text-primary animate-spin" />
          )}
          {task.status === "completed" && (
            <CheckIcon className="w-3 h-3 text-green-600" />
          )}
          {task.status === "failed" && (
            <AlertCircleIcon className="w-3 h-3 text-destructive" />
          )}
          <span className={cn(
            "text-xs font-medium",
            task.status === "pending" && "text-primary",
            task.status === "completed" && "text-green-600",
            task.status === "failed" && "text-destructive",
          )}>
            {task.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
          {task.status !== "pending" && (
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onRemove() }}
            >
              <XIcon className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="text-[11px] text-muted-foreground truncate">{task.description}</div>

      {task.status === "pending" && (
        <div className="mt-2 bg-muted rounded-full h-1 overflow-hidden">
          <div className="bg-primary h-full rounded-full animate-pulse" style={{ width: "60%" }} />
        </div>
      )}
    </div>
  )
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return `${seconds}秒前`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  return `${hours}小时前`
}
```

- [ ] **Step 2: Commit**

```bash
git add components/article/editor-task-progress.tsx
git commit -m "feat: add EditorTaskProgress component with unified task display"
```

---

### Task 8: 创建 AI 功能面板组件

**Files:**
- Create: `components/article/editor-ai-panel.tsx`
- Reference: `components/ui/ai/ai-rewrite-dialog.tsx`, `components/article/article-ai-help-dialog.tsx`, `components/image-generator/index.tsx`

右栏 AI 功能面板，包含功能按钮网格和任务进度列表。

- [ ] **Step 1: 创建 AI 面板组件**

```typescript
// components/article/editor-ai-panel.tsx
"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { EditorTaskProgress } from "./editor-task-progress"
import { AIRewriteDialog } from "@/components/ui/ai/ai-rewrite-dialog"
import { ArticleAIHelpDialog } from "@/components/article/article-ai-help-dialog"
import type { Article } from "@/lib/api/articles/types"
import type { AIEditState } from "@/lib/hooks/use-ai-edit-state"
import { PencilIcon, ImageIcon, FileTextIcon, RefreshCwIcon, PaletteIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EditorAIPanelProps {
  article: Article | null
  aiEditTasks: Map<string, AIEditState>
  activeExecId: string | null
  onSetActiveExecId: (id: string | null) => void
  onAddTask: (task: AIEditState) => void
  onRemoveTask: (taskId: string) => void
  editorContent: string
}

interface AIFeatureButton {
  id: string
  icon: React.ReactNode
  label: string
  bgColor: string
}

export function EditorAIPanel({
  article,
  aiEditTasks,
  activeExecId,
  onSetActiveExecId,
  onAddTask,
  onRemoveTask,
  editorContent,
}: EditorAIPanelProps) {
  const { t } = useTranslation()
  const [activeDialog, setActiveDialog] = useState<string | null>(null)

  const features: AIFeatureButton[] = [
    {
      id: "ai-edit",
      icon: <PencilIcon className="w-4 h-4" />,
      label: t("contentWriting.aiPanel.aiEdit"),
      bgColor: "bg-blue-50",
    },
    {
      id: "create-image",
      icon: <ImageIcon className="w-4 h-4" />,
      label: t("contentWriting.aiPanel.createImage"),
      bgColor: "bg-indigo-50",
    },
    {
      id: "ai-generate",
      icon: <FileTextIcon className="w-4 h-4" />,
      label: t("contentWriting.aiPanel.aiGenerate"),
      bgColor: "bg-green-50",
    },
    {
      id: "reverse-mode",
      icon: <RefreshCwIcon className="w-4 h-4" />,
      label: t("contentWriting.aiPanel.reverseMode"),
      bgColor: "bg-pink-50",
    },
    {
      id: "image-style",
      icon: <PaletteIcon className="w-4 h-4" />,
      label: t("contentWriting.aiPanel.imageStyle"),
      bgColor: "bg-amber-50",
    },
  ]

  const handleFeatureClick = (featureId: string) => {
    setActiveDialog(featureId)
  }

  return (
    <div className="flex flex-col h-full">
      {/* AI Features header */}
      <div className="px-3 py-2.5 border-b shrink-0">
        <h3 className="text-sm font-semibold">{t("contentWriting.aiPanel.title")}</h3>
      </div>

      {/* Feature buttons grid */}
      <div className="p-3 border-b shrink-0">
        <div className="grid grid-cols-2 gap-2">
          {features.slice(0, 4).map((feature) => (
            <button
              key={feature.id}
              className="flex flex-col items-center gap-1.5 p-3 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
              onClick={() => handleFeatureClick(feature.id)}
            >
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", feature.bgColor)}>
                {feature.icon}
              </div>
              <span className="text-xs font-medium">{feature.label}</span>
            </button>
          ))}
          {features.length > 4 && (
            <button
              className="flex flex-col items-center gap-1.5 p-3 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors col-span-2"
              onClick={() => handleFeatureClick(features[4].id)}
            >
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", features[4].bgColor)}>
                {features[4].icon}
              </div>
              <span className="text-xs font-medium">{features[4].label}</span>
            </button>
          )}
        </div>
      </div>

      {/* Task Progress */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-3 py-2 shrink-0">
          <h3 className="text-sm font-semibold">{t("contentWriting.taskProgress.title")}</h3>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <EditorTaskProgress
            aiEditTasks={aiEditTasks}
            onRemoveTask={onRemoveTask}
            onClickTask={(taskId) => onSetActiveExecId(taskId)}
          />
        </div>
      </div>

      {/* Dialogs */}
      {activeDialog === "ai-generate" && article && (
        <ArticleAIHelpDialog
          isOpen={true}
          onClose={() => setActiveDialog(null)}
          articleId={article.id}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/article/editor-ai-panel.tsx
git commit -m "feat: add EditorAIPanel with feature buttons and task progress"
```

---

## Chunk 4: 集成、文章列表页更新、i18n

### Task 9: 更新文章列表页的编辑跳转

**Files:**
- Modify: `app/articles/page.tsx`

将编辑文章的跳转从 `window.__editArticle` + dashboard 方式改为直接路由到 `/articles/[id]/edit`。

- [ ] **Step 1: 修改编辑文章的跳转逻辑**

在 `app/articles/page.tsx` 中找到 `handleEditArticle` 函数，将跳转逻辑改为：

```typescript
const handleEditArticle = (article: Article) => {
  router.push(`/articles/${article.id}/edit`)
}
```

移除 `window.__editArticle` 和 `window.__editArticleId` 的赋值逻辑。

- [ ] **Step 2: Commit**

```bash
git add app/articles/page.tsx
git commit -m "feat: update article list to navigate to new edit page route"
```

---

### Task 10: 添加 i18n 翻译键

**Files:**
- Modify: i18n 翻译文件（中文和英文）

添加新组件所需的翻译键。

- [ ] **Step 1: 查找 i18n 翻译文件路径**

Run: `find lib/i18n -name "*.ts" -o -name "*.json" | head -20`

- [ ] **Step 2: 添加中文翻译**

在中文翻译文件的 `contentWriting` 下添加：

```typescript
materialPanel: {
  search: "搜索",
  library: "素材库",
  searchPlaceholder: "搜索素材...",
  allMaterials: "全部素材",
  favorites: "收藏夹",
  newGroupPlaceholder: "新建分组名称",
  emptyGroup: "暂无素材，拖拽素材到此分组",
},
aiPanel: {
  title: "AI 功能",
  aiEdit: "文章 AI 编辑",
  createImage: "创作图片",
  aiGenerate: "AI 生成文章",
  reverseMode: "反向模式",
  imageStyle: "图片风格",
},
taskProgress: {
  title: "任务进度",
  aiEdit: "AI 编辑",
  imageGeneration: "图片生成",
  noTasks: "暂无进行中的任务",
},
```

- [ ] **Step 3: 添加英文翻译**

对应的英文翻译：

```typescript
materialPanel: {
  search: "Search",
  library: "Library",
  searchPlaceholder: "Search materials...",
  allMaterials: "All Materials",
  favorites: "Favorites",
  newGroupPlaceholder: "New group name",
  emptyGroup: "No materials, drag materials to this group",
},
aiPanel: {
  title: "AI Features",
  aiEdit: "AI Edit",
  createImage: "Create Image",
  aiGenerate: "AI Generate",
  reverseMode: "Reverse Mode",
  imageStyle: "Image Style",
},
taskProgress: {
  title: "Task Progress",
  aiEdit: "AI Edit",
  imageGeneration: "Image Generation",
  noTasks: "No tasks in progress",
},
```

- [ ] **Step 4: Commit**

```bash
git add lib/i18n/
git commit -m "feat: add i18n keys for editor material panel, AI panel, and task progress"
```

---

### Task 11: 编辑器拖入素材的 Drop 处理

**Files:**
- Modify: `components/tiptap-editor.tsx`

在 TiptapEditor 中添加 drop 事件处理，支持从左侧素材面板拖拽素材文本插入。

- [ ] **Step 1: 在 TiptapEditor 的编辑器容器添加 drop 事件**

在编辑器的包裹 `div` 上添加 `onDrop` 和 `onDragOver` 事件处理：

```typescript
const handleDrop = useCallback((e: React.DragEvent) => {
  const text = e.dataTransfer.getData("text/plain")
  if (text && editor) {
    e.preventDefault()
    // 获取 drop 位置并插入文本
    const pos = editor.view.posAtCoords({ left: e.clientX, top: e.clientY })
    if (pos) {
      editor.chain().focus().insertContentAt(pos.pos, text).run()
    }
  }
}, [editor])

const handleDragOver = useCallback((e: React.DragEvent) => {
  e.preventDefault()
  e.dataTransfer.dropEffect = "copy"
}, [])
```

将这两个 handler 绑定到编辑器的容器元素。

- [ ] **Step 2: Commit**

```bash
git add components/tiptap-editor.tsx
git commit -m "feat: add drag-and-drop support for inserting materials into editor"
```

---

### Task 12: 验证和修复集成问题

**Files:**
- Potentially modify: multiple files for type errors and integration issues

- [ ] **Step 1: 运行 TypeScript 检查**

Run: `cd /Users/fsm/JoyfulWords/app && pnpm tsc --noEmit`

修复任何类型错误。

- [ ] **Step 2: 运行开发服务器测试**

Run: `cd /Users/fsm/JoyfulWords/app && pnpm dev`

打开 `/articles/[id]/edit` 页面验证：
- 三栏布局正确渲染
- 拖拽分隔条工作正常
- 素材搜索和列表加载
- AI 功能按钮显示
- 标题可编辑
- 保存按钮工作

- [ ] **Step 3: 修复发现的问题**

根据测试中发现的问题进行修复。

- [ ] **Step 4: 最终 Commit**

```bash
git add .
git commit -m "feat: integrate three-column article editor layout"
```

---

## 文件清单

### 新建文件 (8个)
| 文件 | 用途 |
|------|------|
| `app/articles/[id]/edit/page.tsx` | 编辑页面路由 |
| `components/article/article-editor-layout.tsx` | 三栏布局容器 |
| `components/article/editor-top-bar.tsx` | 编辑器顶栏 |
| `components/article/editor-material-panel.tsx` | 左栏素材面板 |
| `components/article/editor-ai-panel.tsx` | 右栏 AI 面板 |
| `components/article/editor-task-progress.tsx` | 任务进度列表 |
| `lib/hooks/use-resizable-panels.ts` | 可拖拽面板 Hook |
| `lib/hooks/use-material-favorites.ts` | 收藏夹 Hook |

### 修改文件 (3个)
| 文件 | 修改内容 |
|------|----------|
| `app/articles/page.tsx` | 编辑跳转改为 `/articles/[id]/edit` |
| `components/tiptap-editor.tsx` | 添加 drop 事件处理 |
| i18n 翻译文件 | 添加新翻译键 |
