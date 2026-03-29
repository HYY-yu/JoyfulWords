"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useToast } from "@/hooks/use-toast"
import { useEditorState } from "@/lib/editor-state"
import { useAutoSave } from "@/lib/hooks/use-auto-save"
import {
  loadAIEditTasks,
  saveAIEditTasks,
  addAIEditTask,
  removeAIEditTask,
  clearAIEditTasks,
  isAIEditExpired,
  type AIEditState,
} from "@/lib/hooks/use-ai-edit-state"
import { useMultipleAIEditPollers } from "@/lib/hooks/use-multiple-ai-edit-pollers"
import { normalizeContentToHTML, detectContentFormat, htmlToMarkdown } from "@/lib/tiptap-utils"
import { articlesClient } from "@/lib/api/articles/client"
import type { Article } from "@/lib/api/articles/types"
import { ArticleEditorLayout } from "@/components/article/article-editor-layout"
import { EditorTopBar } from "@/components/article/editor-top-bar"
import { EditorMaterialPanel } from "@/components/article/editor-material-panel"
import { EditorAIPanel } from "@/components/article/editor-ai-panel"
import { TiptapEditor } from "@/components/tiptap-editor"

// ==================== Download helper ====================

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ==================== Page Component ====================

export default function ArticleEditPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()

  // Extract and parse article ID from URL params
  const articleIdParam = params?.id as string | undefined
  const articleId = articleIdParam ? Number(articleIdParam) : null

  // ---- Local state ----
  const [article, setArticle] = useState<Article | null>(null)
  const [loadingArticle, setLoadingArticle] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // ---- Editor state ----
  const editorState = useEditorState()

  // ---- Auto-save (edit mode only) ----
  const autoSave = useAutoSave({
    articleId: article?.id ?? null,
    isEditMode: true,
    delay: 3000,
    onSaved: () => {
      editorState.markSaved()
    },
    onError: (error) => {
      console.error("[EditPage] Auto-save failed:", error)
    },
  })

  // ---- AI edit tasks state ----
  const [aiEditTasks, setAiEditTasks] = useState<Map<string, AIEditState>>(new Map())
  const [activeExecId, setActiveExecId] = useState<string | null>(null)

  // ==================== Auth guard ====================

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    }
  }, [authLoading, user, router])

  // ==================== Load article from API ====================

  useEffect(() => {
    if (!user || !articleId) return

    const load = async () => {
      setLoadingArticle(true)
      setLoadError(null)

      try {
        // Fetch with a large page size and locate the article by ID.
        // The API doesn't expose a single-article GET endpoint, so we
        // retrieve the list and find the matching record.
        const result = await articlesClient.getArticles({ page: 1, page_size: 100 })

        if ("error" in result) {
          setLoadError(result.error)
          toast({
            variant: "destructive",
            title: t("contentWriting.manager.loadFailed") || "Failed to load article",
            description: result.error,
          })
          return
        }

        const found = result.list.find((a) => a.id === articleId) ?? null

        if (!found) {
          setLoadError("Article not found")
          toast({
            variant: "destructive",
            title: t("contentWriting.manager.articleNotFound") || "Article not found",
          })
          return
        }

        // Convert content to HTML (it may be stored as Markdown or plain text)
        const format = detectContentFormat(found.content)
        const html = await normalizeContentToHTML(found.content, format)

        editorState.setContent({
          html,
          text: found.content.replace(/<[^>]*>/g, ""),
        })

        setArticle(found)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        setLoadError(message)
        toast({
          variant: "destructive",
          title: t("contentWriting.manager.loadFailed") || "Failed to load article",
          description: message,
        })
      } finally {
        setLoadingArticle(false)
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, articleId])

  // ==================== Restore AI tasks from localStorage ====================

  useEffect(() => {
    if (!user) return
    const tasks = loadAIEditTasks(user.id)
    if (tasks.size > 0) {
      setAiEditTasks(tasks)
    }
  }, [user])

  // ==================== AI edit polling callbacks ====================

  const handleAIEditSuccess = useCallback(
    (execId: string, responseText: string) => {
      setAiEditTasks((prev) => {
        const next = new Map(prev)
        const task = next.get(execId)
        if (task) {
          next.set(execId, { ...task, status: "idle" as const, result_text: responseText })
        }
        return next
      })

      if (user) {
        const tasks = loadAIEditTasks(user.id)
        const task = tasks.get(execId)
        if (task) {
          tasks.set(execId, { ...task, status: "idle" as const, result_text: responseText })
          saveAIEditTasks(user.id, tasks)
        }
      }

      toast({
        title: t("aiRewrite.toast.generateSuccess") || "AI 改写完成",
        description: t("aiRewrite.toast.resultReady") || "点击编辑器中的蓝色等待块查看结果",
      })
    },
    [user, toast, t]
  )

  const handleAIEditError = useCallback(
    (execId: string, message: string) => {
      setAiEditTasks((prev) => {
        const next = new Map(prev)
        next.delete(execId)
        return next
      })

      if (user) {
        const allTasks = Array.from(aiEditTasks.values())
        const hasOtherWaiting = allTasks.some(
          (t) => t.status === "waiting" && t.exec_id !== execId
        )
        if (!hasOtherWaiting) {
          clearAIEditTasks(user.id)
        } else {
          removeAIEditTask(user.id, execId)
        }
      }

      toast({
        variant: "destructive",
        title: t("aiRewrite.toast.generateFailed") || "AI 改写失败",
        description: message,
      })
    },
    [user, toast, t, aiEditTasks]
  )

  const handleAIEditExpired = useCallback(
    (execId: string) => {
      setAiEditTasks((prev) => {
        const next = new Map(prev)
        next.delete(execId)
        return next
      })

      if (user) {
        const allTasks = Array.from(aiEditTasks.values())
        const hasOtherWaiting = allTasks.some(
          (t) => t.status === "waiting" && t.exec_id !== execId
        )
        if (!hasOtherWaiting) {
          clearAIEditTasks(user.id)
        } else {
          removeAIEditTask(user.id, execId)
        }
      }

      toast({
        variant: "destructive",
        title: t("aiRewrite.toast.timeout") || "AI 改写超时",
        description: t("aiRewrite.toast.timeoutDesc") || "AI 改写任务超时，请重试",
      })
    },
    [user, toast, t, aiEditTasks]
  )

  useMultipleAIEditPollers({
    tasks: aiEditTasks,
    onSuccess: handleAIEditSuccess,
    onError: handleAIEditError,
    onExpired: handleAIEditExpired,
  })

  // ==================== AI task management callbacks ====================

  const handleAIPendingBlockClick = useCallback(
    (execId: string) => {
      if (execId === "") {
        setActiveExecId(null)
        return
      }

      const task = aiEditTasks.get(execId)
      if (!task) return

      if (isAIEditExpired(task)) {
        toast({
          variant: "destructive",
          title: t("aiRewrite.toast.taskExpired") || "AI 改写任务已过期",
        })
        if (user) {
          removeAIEditTask(user.id, execId)
          setAiEditTasks((prev) => {
            const next = new Map(prev)
            next.delete(execId)
            return next
          })
        }
        return
      }

      setActiveExecId(execId)
    },
    [aiEditTasks, user, toast, t]
  )

  const handleAIEditResultConsumed = useCallback(
    (execId: string) => {
      setAiEditTasks((prev) => {
        const next = new Map(prev)
        next.delete(execId)
        return next
      })
      setActiveExecId(null)
      if (user) {
        removeAIEditTask(user.id, execId)
      }
    },
    [user]
  )

  const handleTaskSubmitted = useCallback((task: AIEditState) => {
    setAiEditTasks((prev) => {
      const next = new Map(prev)
      next.set(task.exec_id, task)
      return next
    })
  }, [])

  const handleSetActiveExecId = useCallback((execId: string | null) => {
    setActiveExecId(execId)
  }, [])

  const handleAddTask = useCallback(
    (task: AIEditState) => {
      setAiEditTasks((prev) => {
        const next = new Map(prev)
        next.set(task.exec_id, task)
        return next
      })
      if (user) {
        addAIEditTask(user.id, task)
      }
    },
    [user]
  )

  const handleRemoveTask = useCallback(
    (execId: string) => {
      setAiEditTasks((prev) => {
        const next = new Map(prev)
        next.delete(execId)
        return next
      })
      if (user) {
        removeAIEditTask(user.id, execId)
      }
    },
    [user]
  )

  // ==================== Editor change handler ====================

  const handleEditorChange = useCallback(
    (_text: string, html: string) => {
      editorState.setContent({ html, text: _text })

      if (article?.id) {
        autoSave.triggerSave(html)
      }
    },
    [editorState, article, autoSave]
  )

  // ==================== Article metadata update ====================

  const handleArticleUpdated = useCallback(
    (updated: Article) => {
      setArticle(updated)
      toast({
        description: t("contentWriting.editorHeader.saveMetadataSuccess"),
      })
    },
    [toast, t]
  )

  // ==================== Export ====================

  const handleExport = useCallback(
    (format: "markdown" | "html") => {
      const { content } = editorState
      const timestamp = Date.now()

      if (format === "markdown") {
        const md = htmlToMarkdown(content.html)
        downloadFile(md, `article-${timestamp}.md`, "text/markdown")
      } else {
        const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${article?.title ?? "Article"}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    h1 { font-size: 2em; margin-bottom: 0.5em; }
    h2 { font-size: 1.5em; margin-top: 1.5em; margin-bottom: 0.5em; }
    h3 { font-size: 1.2em; margin-top: 1em; margin-bottom: 0.5em; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 12px; border-radius: 6px; overflow-x: auto; }
    blockquote { border-left: 4px solid #ddd; margin: 1em 0; padding-left: 1em; color: #666; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  ${content.html}
</body>
</html>`
        downloadFile(htmlContent, `article-${timestamp}.html`, "text/html")
      }
    },
    [editorState, article]
  )

  // ==================== Cleanup on unmount ====================

  useEffect(() => {
    return () => {
      autoSave.cancelPendingSave()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ==================== Render states ====================

  if (authLoading || loadingArticle) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">
            {authLoading ? "Loading..." : t("contentWriting.manager.loading") || "Loading article..."}
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (loadError || !article) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold text-foreground">
            {t("contentWriting.manager.articleNotFound") || "Article not found"}
          </p>
          <p className="text-sm text-muted-foreground">{loadError}</p>
          <button
            onClick={() => router.push("/articles")}
            className="text-sm text-primary hover:underline"
          >
            {t("common.back") || "Back to articles"}
          </button>
        </div>
      </div>
    )
  }

  // ==================== Layout panels ====================

  const topBar = (
    <EditorTopBar
      article={article}
      onExport={handleExport}
      onArticleUpdated={handleArticleUpdated}
      saveState={
        autoSave.saveState.status === "saving"
          ? "saving"
          : autoSave.saveState.status === "saved"
          ? "saved"
          : autoSave.saveState.status === "error"
          ? "error"
          : "idle"
      }
    />
  )

  const leftPanel = <EditorMaterialPanel articleId={article.id} userId={user.id} />

  const centerPanel = (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TiptapEditor
        content={editorState.content.html}
        onChange={handleEditorChange}
        saveStatus={autoSave.saveState}
        placeholder={t("contentWriting.writing.editorPlaceholder")}
        editable={true}
        articleId={article.id}
        mode="edit"
        aiEditTasks={aiEditTasks}
        activeExecId={activeExecId}
        onAIPendingBlockClick={handleAIPendingBlockClick}
        onTaskSubmitted={handleTaskSubmitted}
        onAIEditResultConsumed={handleAIEditResultConsumed}
        userId={user.id}
      />
    </div>
  )

  const rightPanel = (
    <EditorAIPanel
      aiEditTasks={aiEditTasks}
      activeExecId={activeExecId}
      onSetActiveExecId={handleSetActiveExecId}
      onAddTask={handleAddTask}
      onRemoveTask={handleRemoveTask}
    />
  )

  return (
    <ArticleEditorLayout
      topBar={topBar}
      leftPanel={leftPanel}
      centerPanel={centerPanel}
      rightPanel={rightPanel}
    />
  )
}
