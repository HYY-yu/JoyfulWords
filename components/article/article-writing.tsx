"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth/auth-context"
import { TiptapEditor } from "../tiptap-editor"
import { ArticleEditorHeader } from "./article-editor-header"
import { ArticleSaveDialog } from "./article-save-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Article, ArticleDraft } from "./article-types"

interface ArticleWritingProps {
  articleId?: string | null
}

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T & { cancel?: () => void } {
  let timeout: NodeJS.Timeout | null = null
  const debounced = (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
  ;(debounced as any).cancel = () => {
    if (timeout) clearTimeout(timeout)
  }
  return debounced as T & { cancel?: () => void }
}

export function ArticleWriting({ articleId }: ArticleWritingProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { user } = useAuth()

  const [currentArticle, setCurrentArticle] = useState<Article | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [articleContent, setArticleContent] = useState("")
  const [articleMarkdown, setArticleMarkdown] = useState("")
  const [articleHTML, setArticleHTML] = useState("")
  const [cleanConfirmOpen, setCleanConfirmOpen] = useState(false)

  // Generate user-specific localStorage key
  const getDraftKey = useCallback(() => {
    return user ? `joyfulwords-article-draft-${user.id}` : 'joyfulwords-article-draft-guest'
  }, [user])

  // Debug: Log when component mounts with new articleId
  useEffect(() => {
    console.log('[ArticleWriting] Mounted with articleId:', articleId)
  }, [articleId])

  // Debounced save to localStorage
  const debouncedSave = useMemo(
    () => debounce((draft: ArticleDraft) => {
      try {
        const json = JSON.stringify(draft)
        // 4MB 容量检查
        if (json.length > 4 * 1024 * 1024) {
          toast({
            title: "警告",
            description: t("contentWriting.editorHeader.contentTooLarge"),
            variant: "destructive"
          })
          return
        }
        localStorage.setItem(getDraftKey(), json)
      } catch (error) {
        console.error('Failed to save draft:', error)
        toast({
          title: "自动保存失败",
          description: t("contentWriting.editorHeader.autoSaveFailed"),
          variant: "destructive"
        })
      }
    }, 500),
    [toast, t, getDraftKey]
  )

  // Build draft object from current state
  const buildDraft = useCallback((): ArticleDraft => {
    const text = articleContent.replace(/<[^>]*>/g, "")

    return {
      article: currentArticle,
      isEditMode,
      lastSaved: new Date().toISOString(),
      content: {
        html: articleContent,
        markdown: articleMarkdown,
        text
      },
      metadata: {
        wordCount: text.length,
        hasUnsavedChanges: true,
        version: "v1.0.0"
      }
    }
  }, [currentArticle, isEditMode, articleContent, articleMarkdown])

  // Load article from window state on mount (runs every time due to key prop)
  useEffect(() => {
    // 1. 优先检查 Edit 跳转（第一次编辑时）
    const editArticle = (window as any).__editArticle

    if (editArticle) {
      console.log("Loading edit article from window:", editArticle)
      setCurrentArticle(editArticle)
      setIsEditMode(true)
      setArticleContent(editArticle.content)
      setArticleHTML(editArticle.content)
      setArticleMarkdown("")

      // Clear edit article data, but keep editArticleId for tab switching
      ;(window as any).__editArticle = null
      // 注意：不清除 window.__editArticleId，这样切换 tab 时能保持状态
      return
    }

    // 2. 从 localStorage 加载（编辑模式切换 tab，或新建模式的草稿）
    const savedDraft = localStorage.getItem(getDraftKey())
    if (savedDraft) {
      try {
        const draft: ArticleDraft = JSON.parse(savedDraft)

        // 版本检查
        if (draft.metadata?.version !== 'v1.0.0') {
          console.warn('Draft version mismatch:', draft.metadata?.version)
          return
        }

        // 编辑模式：检查 draft 中的文章 ID 是否匹配
        // 新文章模式：直接加载草稿
        if (articleId) {
          // 编辑模式：只有 draft 中的文章 ID 匹配时才加载
          if (draft.article && draft.article.id === articleId) {
            console.log("Loading edit article from localStorage:", draft.article)
            setCurrentArticle(draft.article)
            setIsEditMode(true)
            setArticleContent(draft.content.html)
            setArticleHTML(draft.content.html)
            setArticleMarkdown(draft.content.markdown)
          } else {
            console.log("Draft article ID mismatch, clearing state")
            // ID 不匹配，说明是切换到了另一篇文章，清除状态
            setCurrentArticle(null)
            setIsEditMode(false)
            setArticleContent("")
            setArticleHTML("")
            setArticleMarkdown("")
          }
        } else {
          // 新文章模式：恢复草稿
          setCurrentArticle(draft.article)
          setIsEditMode(draft.isEditMode)
          setArticleContent(draft.content.html)
          setArticleHTML(draft.content.html)
          setArticleMarkdown(draft.content.markdown)

          toast({
            description: t("contentWriting.editorHeader.draftRestored")
          })
        }
      } catch (error) {
        console.error('Failed to load draft:', error)
      }
    }
  }, [getDraftKey, toast, t, articleId])

  const handleEditorChange = (_content: string, html: string, markdown: string) => {
    setArticleContent(html)  // 改为保存 HTML，这样图片就不会丢失
    setArticleHTML(html)
    setArticleMarkdown(markdown)

    // TODO: 实时保存到后端 API（EditMode）
    // API: PUT /api/articles/:id/draft
    //
    // 建议实现：
    // 1. 使用防抖（2-3秒）避免频繁请求
    // 2. 仅保存内容，不触发验证
    // 3. 返回 draftId 用于后续更新
    // 4. 失败时静默重试3次
    // 5. 显示"自动保存中..."状态指示
  }

  const handleExport = (format: "markdown" | "html") => {
    if (format === "markdown") {
      const blob = new Blob([articleMarkdown || articleContent], { type: "text/markdown" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `article-${Date.now()}.md`
      a.click()
      URL.revokeObjectURL(url)
    } else if (format === "html") {
      const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Article</title>
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
  ${articleHTML || articleContent}
</body>
</html>`
      const blob = new Blob([htmlContent], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `article-${Date.now()}.html`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleSaveArticle = (articleData: { title: string; category?: string; tags: string[] }) => {
    // TODO: Implement save logic
    // API: POST /api/articles to create new article
    console.log("Saving article:", articleData)
    // Will be connected to API later
  }

  // Auto-save to localStorage when content changes
  useEffect(() => {
    if (articleContent || articleMarkdown) {
      const draft = buildDraft()
      debouncedSave(draft)
    }

    // 清理函数
    return () => {
      debouncedSave.cancel?.()
    }
  }, [articleContent, articleMarkdown, buildDraft, debouncedSave])

  // Clean confirm handler
  const handleCleanConfirm = () => {
    // 清空所有状态
    setCurrentArticle(null)
    setIsEditMode(false)
    setArticleContent("")
    setArticleHTML("")
    setArticleMarkdown("")

    // 清除 localStorage (使用用户特定的 key)
    localStorage.removeItem(getDraftKey())

    // 关闭对话框
    setCleanConfirmOpen(false)

    toast({
      description: t("contentWriting.editorHeader.cleanSuccess")
    })
  }

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Editor Section */}
      <div className="flex flex-col flex-1 bg-card rounded-lg border border-border overflow-hidden">
        {/* Editor Header */}
        <div className="shrink-0">
          <ArticleEditorHeader
            article={currentArticle}
            mode={isEditMode ? "edit" : "create"}
            content={articleContent}
            onSaveAsNew={() => setSaveDialogOpen(true)}
            onExport={handleExport}
            onClean={() => setCleanConfirmOpen(true)}
          />
        </div>

        {/* Tiptap Editor */}
        <div className="flex-1 overflow-auto p-6">
          <TiptapEditor
            content={articleContent}
            onChange={handleEditorChange}
            placeholder={t("contentWriting.writing.editorPlaceholder")}
            editable={true}
          />
        </div>
      </div>

      {/* Save Dialog */}
      <ArticleSaveDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveArticle}
      />

      {/* Clean Confirm Dialog */}
      <AlertDialog open={cleanConfirmOpen} onOpenChange={setCleanConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("contentWriting.editorHeader.cleanConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("contentWriting.editorHeader.cleanConfirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCleanConfirm}>
              {t("common.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
