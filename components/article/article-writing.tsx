"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useToast } from "@/hooks/use-toast"
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

export function ArticleWriting() {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [currentArticle, setCurrentArticle] = useState<Article | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [articleContent, setArticleContent] = useState("")
  const [articleMarkdown, setArticleMarkdown] = useState("")
  const [articleHTML, setArticleHTML] = useState("")
  const [cleanConfirmOpen, setCleanConfirmOpen] = useState(false)

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
        localStorage.setItem('joyfulwords-article-draft', json)
      } catch (error) {
        console.error('Failed to save draft:', error)
        toast({
          title: "自动保存失败",
          description: t("contentWriting.editorHeader.autoSaveFailed"),
          variant: "destructive"
        })
      }
    }, 500),
    [toast, t]
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
    // 1. 优先检查 Edit 跳转
    const editArticle = (window as any).__editArticle

    if (editArticle) {
      console.log("Loading edit article:", editArticle)
      setCurrentArticle(editArticle)
      setIsEditMode(true)
      setArticleContent(editArticle.content)
      setArticleHTML(editArticle.content)
      setArticleMarkdown("")

      // Clear after loading
      ;(window as any).__editArticle = null
      return
    }

    // 2. 检查 localStorage 草稿
    const savedDraft = localStorage.getItem('joyfulwords-article-draft')
    if (savedDraft) {
      try {
        const draft: ArticleDraft = JSON.parse(savedDraft)

        // 版本检查
        if (draft.metadata?.version !== 'v1.0.0') {
          console.warn('Draft version mismatch:', draft.metadata?.version)
          return
        }

        // 恢复草稿
        setCurrentArticle(draft.article)
        setIsEditMode(draft.isEditMode)
        setArticleContent(draft.content.html)
        setArticleHTML(draft.content.html)
        setArticleMarkdown(draft.content.markdown)

        toast({
          description: t("contentWriting.editorHeader.draftRestored")
        })
      } catch (error) {
        console.error('Failed to load draft:', error)
      }
    }
  }, [])

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

    // 清除 localStorage
    localStorage.removeItem('joyfulwords-article-draft')

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
