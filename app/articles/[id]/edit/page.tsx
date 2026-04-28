"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useToast } from "@/hooks/use-toast"
import { useEditorState } from "@/lib/editor-state"
import { useAutoSave } from "@/lib/hooks/use-auto-save"
import { normalizeContentToHTML, detectContentFormat, htmlToMarkdown } from "@/lib/tiptap-utils"
import { articlesClient } from "@/lib/api/articles/client"
import type { Article } from "@/lib/api/articles/types"
import type { TaskCenterTaskReference } from "@/lib/api/taskcenter/types"
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

  const [activeArticleEditTaskRef, setActiveArticleEditTaskRef] =
    useState<TaskCenterTaskReference | null>(null)
  const [articleEditSubmissionTick, setArticleEditSubmissionTick] = useState(0)

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
            title: t("contentWriting.manager.loadFailed"),
            description: result.error,
          })
          return
        }

        const found = result.list.find((a) => a.id === articleId) ?? null

        if (!found) {
          setLoadError(t("contentWriting.manager.articleNotFound"))
          toast({
            variant: "destructive",
            title: t("contentWriting.manager.articleNotFound"),
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
          title: t("contentWriting.manager.loadFailed"),
          description: message,
        })
      } finally {
        setLoadingArticle(false)
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, articleId])

  const handleOpenArticleEditTask = useCallback((taskRef: TaskCenterTaskReference) => {
    setActiveArticleEditTaskRef(taskRef)
  }, [])

  const handleArticleEditSubmitted = useCallback(() => {
    setArticleEditSubmissionTick((current) => current + 1)
  }, [])

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

  // ==================== Version rollback ====================

  const handleVersionRollback = useCallback((versionData: { content: string }) => {
    if (versionData.content) {
      editorState.setContent({
        html: versionData.content,
        text: versionData.content.replace(/<[^>]*>/g, ""),
      })
    }
  }, [editorState])

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
            {t("contentWriting.manager.loading")}
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
            {t("contentWriting.manager.articleNotFound")}
          </p>
          <p className="text-sm text-muted-foreground">{loadError}</p>
          <button
            onClick={() => router.push("/articles")}
            className="text-sm text-primary hover:underline"
          >
            {t("common.back")}
          </button>
        </div>
      </div>
    )
  }

  // ==================== Layout panels ====================

  const topBar = (
    <EditorTopBar
      article={article}
      onSave={autoSave.triggerSave}
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
      currentContent={editorState.content.html}
      onVersionRollback={handleVersionRollback}
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
        activeArticleEditTaskRef={activeArticleEditTaskRef}
        onActiveArticleEditTaskRefChange={setActiveArticleEditTaskRef}
        onArticleEditSubmitted={handleArticleEditSubmitted}
      />
    </div>
  )

  const rightPanel = (
    <EditorAIPanel
      articleId={article.id}
      submissionTick={articleEditSubmissionTick}
      onOpenArticleEditTask={handleOpenArticleEditTask}
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
