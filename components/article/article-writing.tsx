"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TiptapEditor } from "../tiptap-editor"
import { ArticleEditorHeader } from "./article-editor-header"
import { ArticleSaveDialog } from "./article-save-dialog"
import type { Article } from "./article-types"

export function ArticleWriting() {
  const { t } = useTranslation()

  const [currentArticle, setCurrentArticle] = useState<Article | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [articleContent, setArticleContent] = useState("")
  const [articleMarkdown, setArticleMarkdown] = useState("")
  const [articleHTML, setArticleHTML] = useState("")

  // Load article from window state on mount (runs every time due to key prop)
  useEffect(() => {
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
    } else {
      // Create mode - no article loaded
      setCurrentArticle(null)
      setIsEditMode(false)
    }
  }, [])

  const handleEditorChange = (content: string, html: string, markdown: string) => {
    setArticleContent(html)  // 改为保存 HTML，这样图片就不会丢失
    setArticleHTML(html)
    setArticleMarkdown(markdown)
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

  return (
    <div className="space-y-6">
      {/* Editor Section */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Editor Header with Export Button */}
        <div className="border-b border-border bg-muted/30">
          <div className="px-4 py-3 flex items-center justify-between">
            <ArticleEditorHeader
              article={currentArticle}
              mode={isEditMode ? "edit" : "create"}
              content={articleContent}
              onSaveAsNew={() => setSaveDialogOpen(true)}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <DownloadIcon className="w-4 h-4" />
                  {t("contentWriting.writing.exportBtn")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport("markdown")}>
                  {t("contentWriting.writing.exportMarkdown")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("html")}>
                  {t("contentWriting.writing.exportHtml")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tiptap Editor */}
        <div className="p-6">
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
    </div>
  )
}
