"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import {
  SparklesIcon,
  FileTextIcon,
  TrendingUpIcon,
  XIcon,
  DownloadIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { TiptapEditor } from "./tiptap-editor"

// Mock data types matching the other components
type Material = {
  id: string
  name: string
  type: string
  link: string
  content: string
  createdAt: string
}

type Post = {
  id: string
  platform: string
  content: string
  url: string
  sourceUrl: string
  likes: number
  comments: number
  createdAt: string
}

// Mock data
const mockMaterials: Material[] = [
  {
    id: "1",
    name: "AI发展趋势2024",
    type: "文章",
    link: "https://example.com/ai-trends",
    content: "人工智能在2024年迎来了新的发展机遇...",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "机器学习基础入门",
    type: "教程",
    link: "https://example.com/ml-basics",
    content: "机器学习是人工智能的一个重要分支...",
    createdAt: "2024-01-10",
  },
  {
    id: "3",
    name: "ChatGPT应用案例",
    type: "案例",
    link: "https://example.com/chatgpt-cases",
    content: "ChatGPT在各种场景下的应用实例...",
    createdAt: "2024-01-08",
  },
]

const mockPosts: Post[] = [
  {
    id: "1",
    platform: "小红书",
    content: "分享一个超实用的AI工具，让你的工作效率翻倍！具体用法请看图～",
    url: "https://xiaohongshu.com/post/123",
    sourceUrl: "https://xiaohongshu.com",
    likes: 1250,
    comments: 89,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    platform: "抖音",
    content: "5分钟学会使用AI写文案，这个技巧太神奇了！#AI #文案创作",
    url: "https://douyin.com/video/456",
    sourceUrl: "https://douyin.com",
    likes: 3580,
    comments: 210,
    createdAt: "2024-01-14",
  },
  {
    id: "3",
    platform: "知乎",
    content: "作为一名内容创作者，我是如何利用AI工具提升创作效率的？",
    url: "https://zhihu.com/question/789",
    sourceUrl: "https://zhihu.com",
    likes: 890,
    comments: 156,
    createdAt: "2024-01-13",
  },
]

export function ArticleWriting() {
  const { t } = useTranslation()
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])
  const [selectedPosts, setSelectedPosts] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [articleContent, setArticleContent] = useState("")
  const [articleMarkdown, setArticleMarkdown] = useState("")
  const [articleHTML, setArticleHTML] = useState("")

  const handleMaterialToggle = (materialId: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(materialId)
        ? prev.filter((id) => id !== materialId)
        : [...prev, materialId]
    )
  }

  const handlePostToggle = (postId: string) => {
    setSelectedPosts((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    )
  }

  const handleRemoveMaterial = (materialId: string) => {
    setSelectedMaterials((prev) => prev.filter((id) => id !== materialId))
  }

  const handleRemovePost = (postId: string) => {
    setSelectedPosts((prev) => prev.filter((id) => id !== postId))
  }

  const handleGenerate = () => {
    setIsGenerating(true)

    // Simulate AI generation
    setTimeout(() => {
      const generatedContent = `# AI技术在内容创作中的应用

随着人工智能技术的快速发展，内容创作领域正经历着前所未有的变革。

## 素材分析

根据选择的素材，我们可以看到以下关键点：

${selectedMaterials
  .map((id) => {
    const material = mockMaterials.find((m) => m.id === id)
    return material ? `- ${material.name}: ${material.content.substring(0, 50)}...` : ""
  })
  .join("\n")}

## 竞品分析

通过分析竞品内容，我们发现了以下趋势：

${selectedPosts
  .map((id) => {
    const post = mockPosts.find((p) => p.id === id)
    return post ? `- 来自 ${post.platform}: ${post.content}\n` : ""
  })
  .join("")}

## 结论

综合以上分析，我们可以看到AI技术的发展趋势非常明显...

---
*本文由 AI 助手生成于 ${new Date().toLocaleString()}*`

      setArticleContent(generatedContent)
      setIsGenerating(false)
    }, 2000)
  }

  const handleEditorChange = (content: string, html: string, markdown: string) => {
    setArticleContent(content)
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

  return (
    <div className="space-y-6">
      {/* AI Help Section */}
      <div className="bg-card rounded-lg border border-border p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <SparklesIcon className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">{t("contentWriting.writing.aiHelpTitle")}</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Material Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileTextIcon className="w-4 h-4" />
              <span>{t("contentWriting.writing.selectMaterial")}</span>
            </div>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder={t("contentWriting.writing.placeholderMaterial")} />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[200px]">
                  {mockMaterials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center space-x-2 p-2 hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleMaterialToggle(material.id)}
                    >
                      <Checkbox checked={selectedMaterials.includes(material.id)} />
                      <label className="text-sm cursor-pointer flex-1">{material.name}</label>
                    </div>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>

            {/* Selected Materials */}
            {selectedMaterials.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{t("contentWriting.writing.selectedCountMaterial").replace("{count}", selectedMaterials.length.toString())}</p>
                <div className="space-y-1">
                  {selectedMaterials.map((id) => {
                    const material = mockMaterials.find((m) => m.id === id)
                    return material ? (
                      <div key={id} className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded text-sm">
                        <div className="truncate flex-1">
                          <span className="font-medium">{material.name}</span>
                          <span className="text-muted-foreground text-xs ml-2">{material.type}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveMaterial(id)} className="h-6 w-6 p-0">
                          <XIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : null
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Competitor Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUpIcon className="w-4 h-4" />
              <span>{t("contentWriting.writing.selectCompetitor")}</span>
            </div>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder={t("contentWriting.writing.placeholderCompetitor")} />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[200px]">
                  {mockPosts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center space-x-2 p-2 hover:bg-muted/50 cursor-pointer"
                      onClick={() => handlePostToggle(post.id)}
                    >
                      <Checkbox checked={selectedPosts.includes(post.id)} />
                      <label className="text-sm cursor-pointer flex-1">{post.platform}</label>
                    </div>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>

            {/* Selected Posts */}
            {selectedPosts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{t("contentWriting.writing.selectedCountCompetitor").replace("{count}", selectedPosts.length.toString())}</p>
                <div className="space-y-1">
                  {selectedPosts.map((id) => {
                    const post = mockPosts.find((p) => p.id === id)
                    return post ? (
                      <div key={id} className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded text-sm">
                        <div className="truncate flex-1">
                          <span className="font-medium">{post.platform}</span>
                          <span className="text-muted-foreground text-xs ml-2">{post.sourceUrl}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemovePost(id)} className="h-6 w-6 p-0">
                          <XIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : null
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || (selectedMaterials.length === 0 && selectedPosts.length === 0)}
            className="gap-2"
          >
            <SparklesIcon className="w-4 h-4" />
            {isGenerating ? t("contentWriting.writing.generatingBtn") : t("contentWriting.writing.generateBtn")}
          </Button>
        </div>
      </div>

      {/* Editor Section */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Editor Header */}
        <div className="border-b border-border px-4 py-3 flex items-center justify-between bg-muted/30">
          <h3 className="text-lg font-semibold">{t("contentWriting.writing.editorTitle")}</h3>
          <div className="flex items-center gap-3">
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <DownloadIcon className="w-4 h-4" />
                  {t("contentWriting.writing.exportBtn")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport("markdown")}>{t("contentWriting.writing.exportMarkdown")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("html")}>{t("contentWriting.writing.exportHtml")}</DropdownMenuItem>
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
    </div>
  )
}