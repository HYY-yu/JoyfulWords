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
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false)

  // ✅ 使用统一状态管理（替换 articleContent, articleHTML, articleMarkdown）
  const editorState = useEditorState()

  // ✅ 自动保存 Hook（仅编辑模式）
  const autoSave = useAutoSave({
    articleId: currentArticle?.id ?? null,
    isEditMode,
    delay: 3000,
    onSaved: () => {
      // 保存成功后标记为已保存
      editorState.markSaved()
    },
    onError: (error) => {
      console.error('[AutoSave] Save failed:', error)
      // 静默重试已在 Hook 内部处理，这里只记录日志
    },
  })

  // ====== AI 异步编辑状态（支持多个并行任务）=====
  // key: exec_id, value: 任务状态
  const [aiEditTasks, setAiEditTasks] = useState<Map<string, AIEditState>>(new Map())
  const [activeExecId, setActiveExecId] = useState<string | null>(null) // 当前打开的 dialog 对应的 exec_id

  // 从 localStorage 初始化 AI 编辑状态（页面刷新后恢复轮询）
  useEffect(() => {
    if (!user) return
    const tasks = loadAIEditTasks(user.id)
    if (tasks.size > 0) {
      setAiEditTasks(tasks)
      console.log('[ArticleWriting] Restored AI edit tasks from localStorage:', tasks.size)
    }
  }, [user])

  // 轮询成功回调
  const handleAIEditSuccess = useCallback((execId: string, responseText: string) => {
    console.log('[ArticleWriting] AI edit succeeded for exec_id:', execId)
    console.log('[ArticleWriting] Response text length:', responseText?.length)
    console.log('[ArticleWriting] Response text preview:', responseText?.substring(0, 100))

    setAiEditTasks(prev => {
      const newTasks = new Map(prev)
      const task = newTasks.get(execId)
      if (task) {
        // 更新任务状态为 idle，保存结果文本
        const updatedTask = {
          ...task,
          status: 'idle' as const,
          result_text: responseText,
        }
        console.log('[ArticleWriting] Updated task:', updatedTask)
        newTasks.set(execId, updatedTask)
      }
      return newTasks
    })

    // 更新 localStorage 中的任务状态（保留 idle 任务供刷新后恢复）
    if (user) {
      const tasks = loadAIEditTasks(user.id)
      const task = tasks.get(execId)
      if (task) {
        const updatedTask = {
          ...task,
          status: 'idle' as const,
          result_text: responseText,
        }
        tasks.set(execId, updatedTask)
        saveAIEditTasks(user.id, tasks)
      }
    }

    // 通知用户点击 AIPendingBlock 查看结果
    toast({
      title: t("aiRewrite.toast.generateSuccess") || "AI 改写完成",
      description: t("aiRewrite.toast.resultReady") || "点击编辑器中的蓝色等待块查看结果",
    })
  }, [user, toast, t])

  // 轮询失败回调
  const handleAIEditError = useCallback((execId: string, message: string) => {
    console.error('[ArticleWriting] AI edit failed for exec_id:', execId, message)

    setAiEditTasks(prev => {
      const newTasks = new Map(prev)
      newTasks.delete(execId)
      return newTasks
    })

    // 检查是否还有其他 waiting 任务
    if (user) {
      const allTasks = Array.from(aiEditTasks.values())
      const hasOtherWaiting = allTasks.some(t => t.status === 'waiting' && t.exec_id !== execId)

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
  }, [user, toast, t, aiEditTasks])

  // 轮询超时回调
  const handleAIEditExpired = useCallback((execId: string) => {
    console.warn('[ArticleWriting] AI edit polling timed out for exec_id:', execId)

    setAiEditTasks(prev => {
      const newTasks = new Map(prev)
      newTasks.delete(execId)
      return newTasks
    })

    if (user) {
      const allTasks = Array.from(aiEditTasks.values())
      const hasOtherWaiting = allTasks.some(t => t.status === 'waiting' && t.exec_id !== execId)

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
  }, [user, toast, t, aiEditTasks])

  // 为每个任务启动轮询
  useMultipleAIEditPollers({
    tasks: aiEditTasks,
    onSuccess: handleAIEditSuccess,
    onError: handleAIEditError,
    onExpired: handleAIEditExpired,
  })

  // 当用户点击 AIPendingBlock 时，打开对应的 dialog
  const handleAIPendingBlockClick = useCallback((execId: string) => {
    console.log('[ArticleWriting] handleAIPendingBlockClick called with exec_id:', execId)
    console.log('[ArticleWriting] Current aiEditTasks:', Array.from(aiEditTasks.keys()))

    // 空字符串表示清除 activeExecId（dialog 关闭时调用）
    if (execId === '') {
      console.log('[ArticleWriting] Clearing activeExecId')
      setActiveExecId(null)
      setIsAIDialogOpen(false)
      return
    }

    const task = aiEditTasks.get(execId)
    if (task) {
      // 检查任务是否过期
      if (isAIEditExpired(task)) {
        toast({
          variant: "destructive",
          title: t("aiRewrite.toast.taskExpired") || "AI 改写任务已过期",
        })
        // 清理过期任务
        if (user) {
          removeAIEditTask(user.id, execId)
          setAiEditTasks(prev => {
            const newTasks = new Map(prev)
            newTasks.delete(execId)
            return newTasks
          })
        }
        return
      }

      console.log('[ArticleWriting] Task found, opening dialog. Status:', task.status, 'result_text:', task.result_text)
      setActiveExecId(execId)
      setIsAIDialogOpen(true)
    } else {
      console.error('[ArticleWriting] Task not found for exec_id:', execId)
    }
  }, [aiEditTasks, user, toast, t])

  // 当用户从 dialog 应用改写结果后
  const handleAIEditResultConsumed = useCallback((execId: string) => {
    setAiEditTasks(prev => {
      const newTasks = new Map(prev)
      newTasks.delete(execId)
      return newTasks
    })
    setActiveExecId(null)

    // 同时从 localStorage 删除任务
    if (user) {
      removeAIEditTask(user.id, execId)
    }
  }, [user])

  // 当新任务提交成功后，添加到 aiEditTasks
  const handleTaskSubmitted = useCallback((task: AIEditState) => {
    console.log('[ArticleWriting] New task submitted:', task)
    setAiEditTasks(prev => {
      const newTasks = new Map(prev)
      newTasks.set(task.exec_id, task)
      return newTasks
    })
  }, [])

  // 获取当前打开的任务
  const getActiveTask = useCallback((): AIEditState | null => {
    if (!activeExecId) return null
    return aiEditTasks.get(activeExecId) || null
  }, [activeExecId, aiEditTasks])

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

    // ✅ 触发自动保存（仅编辑模式）
    if (isEditMode && currentArticle?.id) {
      autoSave.triggerSave(html)
    }
  }, [editorState, isEditMode, currentArticle, autoSave])

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

  // 保存成功后的处理：清空编辑器并跳转到文章管理
  const handleSaveSuccess = useCallback(() => {
    // ✅ 使用统一状态管理重置编辑器
    editorState.reset()

    // 清除 localStorage
    localStorage.removeItem(getDraftKey())

    // 清理当前文章，返回创建模式
    setCurrentArticle(null)
    setIsEditMode(false)

    toast({
      description: t("contentWriting.saveDialog.saveAndNavigateSuccess"),
    })

    // 跳转到文章管理页面
    setTimeout(() => {
      // 触发自定义事件通知 content-writing 组件切换 tab
      window.dispatchEvent(new CustomEvent('navigate-to-article-manager'))
    }, 500)
  }, [editorState, getDraftKey, toast, t])

  // Handle article metadata updated from editor header
  const handleArticleUpdated = useCallback((updatedArticle: Article) => {
    setCurrentArticle(updatedArticle)
    toast({
      description: t("contentWriting.editorHeader.saveMetadataSuccess"),
    })
  }, [toast, t])

  // 组件卸载时清理待处理的自动保存
  useEffect(() => {
    return () => {
      autoSave.cancelPendingSave()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 只在组件卸载时清理，不依赖 autoSave 对象

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden gap-6">
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
        <div className="flex-1 overflow-hidden p-6 flex flex-col min-h-0">
          <TiptapEditor
            content={editorState.content.html}
            onChange={handleEditorChange}
            saveStatus={autoSave.saveState}
            placeholder={t("contentWriting.writing.editorPlaceholder")}
            editable={true}
            articleId={currentArticle?.id}
            mode={isEditMode ? "edit" : "create"}
            aiEditTasks={aiEditTasks}
            activeExecId={activeExecId}
            onAIPendingBlockClick={handleAIPendingBlockClick}
            onTaskSubmitted={handleTaskSubmitted}
            onAIEditResultConsumed={handleAIEditResultConsumed}
            userId={user?.id}
          />
        </div>
      </div>

      {/* Save Dialog */}
      <ArticleSaveDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        content={editorState.content.html}
        onSaveSuccess={handleSaveSuccess}
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
