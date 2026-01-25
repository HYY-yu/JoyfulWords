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
} from "@/components/ui/base/alert-dialog"
import type { Article, ArticleDraft } from "./article-types"
import { useEditorState } from "@/lib/editor-state"
import { normalizeContentToHTML, detectContentFormat, htmlToMarkdown } from "@/lib/tiptap-utils"

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
  const [cleanConfirmOpen, setCleanConfirmOpen] = useState(false)

  // ✅ 使用统一状态管理（替换 articleContent, articleHTML, articleMarkdown）
  const editorState = useEditorState()

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
        // 10MB 容量检查
        if (json.length > 10 * 1024 * 1024) {
          toast({
            title: t("contentWriting.writing.toast.warning"),
            description: t("contentWriting.editorHeader.contentTooLarge"),
            variant: "destructive"
          })
          return
        }
        localStorage.setItem(getDraftKey(), json)
      } catch (error) {
        console.error('Failed to save draft:', error)
        toast({
          title: t("contentWriting.writing.toast.autoSaveFailed"),
          description: t("contentWriting.editorHeader.autoSaveFailed"),
          variant: "destructive"
        })
      }
    }, 500),
    [toast, t, getDraftKey]
  )

  // Build draft object from current state
  const buildDraft = useCallback((): ArticleDraft => {
    const { content, metadata } = editorState

    return {
      article: currentArticle,
      isEditMode,
      lastSaved: new Date().toISOString(),
      content: {
        html: content.html,
        text: content.text
      },
      metadata: {
        wordCount: metadata.wordCount,
        hasUnsavedChanges: metadata.isDirty,
        version: "v1.0.0"
      }
    }
  }, [editorState, currentArticle, isEditMode])

  // Load article from window state on mount (runs every time due to key prop)
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const loadArticle = async () => {
      // 1. 优先检查 Edit 跳转（第一次编辑时）
      const editArticle = (window as any).__editArticle

      if (editArticle) {
        console.log('[ArticleWriting] Loading edit article from window:', editArticle)

        // ✅ 检测内容格式并转换为 HTML
        const format = detectContentFormat(editArticle.content)
        const html = await normalizeContentToHTML(editArticle.content, format)

        console.log('[ArticleWriting] Converted HTML:', html)

        // Update editor state for tracking
        editorState.setContent({
          html: html,
          text: editArticle.content.replace(/<[^>]*>/g, "")
        })

        // ✅ 直接设置编辑器内容，避免时序问题
        const editor = (window as any).tiptapEditor
        if (editor) {
          console.log('[ArticleWriting] Setting editor content directly')
          console.log('[ArticleWriting] Before setContent - Editor HTML:', editor.getHTML())
          editor.commands.setContent(html, { emitUpdate: false })
          console.log('[ArticleWriting] After setContent - Editor HTML:', editor.getHTML())
          console.log('[ArticleWriting] Editor JSON:', JSON.stringify(editor.state.doc.toJSON(), null, 2))
        } else {
          console.warn('[ArticleWriting] Editor not ready, content will be set via prop update')
        }

        setCurrentArticle(editArticle)
        setIsEditMode(true)

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
              console.log('[ArticleWriting] Loading edit article from localStorage:', draft.article)
              editorState.setContent({
                html: draft.content.html,
                text: draft.content.text
              })
              setCurrentArticle(draft.article)
              setIsEditMode(true)
            } else {
              console.log('[ArticleWriting] Draft article ID mismatch, clearing state')
              // ID 不匹配，说明是切换到了另一篇文章，清除状态
              editorState.reset()
              setCurrentArticle(null)
              setIsEditMode(false)
            }
          } else {
            // 新文章模式：恢复草稿
            editorState.setContent({
              html: draft.content.html,
              text: draft.content.text
            })
            setCurrentArticle(draft.article)
            setIsEditMode(draft.isEditMode)

            toast({
              description: t("contentWriting.editorHeader.draftRestored")
            })
          }
        } catch (error) {
          console.error('[ArticleWriting] Failed to load draft:', error)
        }
      }
    }

    loadArticle()
  }, [getDraftKey, toast, t, articleId, editorState])
  /* eslint-enable react-hooks/exhaustive-deps */

  const handleEditorChange = useCallback((_content: string, html: string) => {
    // ✅ 使用统一状态管理
    editorState.setContent({
      html,
      text: _content
    })

    // TODO: 实时保存到后端 API（EditMode）
    // API: PUT /api/articles/:id/draft
    //
    // 建议实现：
    // 1. 使用防抖（2-3秒）避免频繁请求
    // 2. 仅保存内容，不触发验证
    // 3. 返回 draftId 用于后续更新
    // 4. 失败时静默重试3次
    // 5. 显示"自动保存中..."状态指示
  }, [editorState])

  const handleExport = useCallback((format: "markdown" | "html") => {
    const { content } = editorState

    if (format === "markdown") {
      // 将 HTML 转换为 Markdown 格式
      const exportContent = htmlToMarkdown(content.html)
      const blob = new Blob([exportContent], { type: "text/markdown" })
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
  ${content.html}
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
  }, [editorState])

  // Auto-save to localStorage when content changes
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const { content } = editorState

    if (content.html ) {
      const draft = buildDraft()
      debouncedSave(draft)
    }

    // 清理函数
    return () => {
      debouncedSave.cancel?.()
    }
  }, [editorState.content.html,  buildDraft, debouncedSave])
  /* eslint-enable react-hooks/exhaustive-deps */

  // Clean confirm handler
  const handleCleanConfirm = useCallback(() => {
    // ✅ 使用统一状态管理重置编辑器
    editorState.reset()

    // 清除 localStorage (使用用户特定的 key)
    localStorage.removeItem(getDraftKey())

    // 清理当前文章
    setCurrentArticle(null)
    setIsEditMode(false)
    setSaveDialogOpen(false)
    // 关闭对话框
    setCleanConfirmOpen(false)

    toast({
      description: t("contentWriting.editorHeader.cleanSuccess")
    })
  }, [editorState, getDraftKey, toast, t])

  // Handle article metadata updated from editor header
  const handleArticleUpdated = useCallback((updatedArticle: Article) => {
    setCurrentArticle(updatedArticle)
    toast({
      description: t("contentWriting.editorHeader.saveMetadataSuccess"),
    })
  }, [toast, t])

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Editor Section */}
      <div className="flex flex-col flex-1 bg-card rounded-lg border border-border overflow-hidden">
        {/* Editor Header */}
        <div className="shrink-0">
          <ArticleEditorHeader
            article={currentArticle}
            mode={isEditMode ? "edit" : "create"}
            content={editorState.content.html}
            onSaveAsNew={() => setSaveDialogOpen(true)}
            onExport={handleExport}
            onClean={() => setCleanConfirmOpen(true)}
            onArticleUpdated={handleArticleUpdated}
          />
        </div>

        {/* Tiptap Editor */}
        <div className="flex-1 overflow-auto p-6">
          <TiptapEditor
            content={editorState.content.html}
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
        content={editorState.content.html}
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
