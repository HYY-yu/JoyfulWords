"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { SparklesIcon, FileTextIcon, TrendingUpIcon, XIcon, LoaderIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { materialsClient } from "@/lib/api/materials/client"
import type { Material } from "@/lib/api/materials/types"
import type { Article } from "./article-types"

// Types for dialog props
interface ArticleAIHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onArticleCreated: (article: Article) => void
}

// Competitor type (fake data structure for now)
// TODO: Replace with real API call - GET /api/competitors (not implemented yet)
type CompetitorPost = {
  id: string
  platform: string
  content: string
  url: string
  sourceUrl: string
  likes: number
  comments: number
  createdAt: string
}

// Mock competitor data for now
const mockCompetitors: CompetitorPost[] = [
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

export function ArticleAIHelpDialog({
  open,
  onOpenChange,
  onArticleCreated,
}: ArticleAIHelpDialogProps) {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [prompt, setPrompt] = useState("")
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])
  const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [materialSearch, setMaterialSearch] = useState("")
  const [competitorSearch, setCompetitorSearch] = useState("")

  // Use real Materials API
  const [materials, setMaterials] = useState<Material[]>([])
  const [materialsLoading, setMaterialsLoading] = useState(false)

  // Load materials on mount
  useEffect(() => {
    const loadMaterials = async () => {
      setMaterialsLoading(true)
      try {
        const result = await materialsClient.getMaterials({
          page: 1,
          page_size: 100,
        })
        if ('list' in result) {
          setMaterials(result.list)
        } else if ('error' in result) {
          toast({
            variant: "destructive",
            description: result.error,
          })
        }
      } catch (error) {
        toast({
          variant: "destructive",
          description: "加载素材失败",
        })
      } finally {
        setMaterialsLoading(false)
      }
    }

    if (open) {
      loadMaterials()
    }
  }, [open, toast])

  const filteredMaterials = materials.filter(m =>
    m.title.toLowerCase().includes(materialSearch.toLowerCase())
  )

  const filteredCompetitors = mockCompetitors.filter(c =>
    c.platform.toLowerCase().includes(competitorSearch.toLowerCase())
  )

  const handleToggleMaterial = (id: string) => {
    setSelectedMaterials(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleToggleCompetitor = (id: string) => {
    setSelectedCompetitors(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleRemoveMaterial = (id: string) => {
    setSelectedMaterials(prev => prev.filter(i => i !== id))
  }

  const handleRemoveCompetitor = (id: string) => {
    setSelectedCompetitors(prev => prev.filter(i => i !== id))
  }

  const handleGenerate = async () => {
    // Validation: At least one selection or prompt required
    if (selectedMaterials.length === 0 && selectedCompetitors.length === 0 && !prompt.trim()) {
      toast({
        variant: "destructive",
        description: t("contentWriting.aiHelp.promptRequired"),
      })
      return
    }

    setIsGenerating(true)

    try {
      // TODO: Replace with real API call
      // API: POST /api/articles/generate
      // Request body: {
      //   sourceMaterials: selectedMaterials,
      //   sourceCompetitors: selectedCompetitors,
      //   generationPrompt: prompt
      // }
      // Response: Article object with status='init' and empty content

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Create new article with 'init' status and empty content
      const newArticle: Article = {
        id: `article-${Date.now()}`,
        title: t("contentWriting.aiHelp.title"), // Temporary title
        content: "", // Empty content initially
        summary: "",
        images: [],
        referenceLinks: [],
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        status: "init",
        tags: [],
        category: "",
        sourceMaterials: selectedMaterials,
        sourceCompetitors: selectedCompetitors,
        generationPrompt: prompt,
      }

      onArticleCreated(newArticle)

      toast({
        description: t("contentWriting.aiHelp.success"),
      })

      // Reset form and close dialog
      setPrompt("")
      setSelectedMaterials([])
      setSelectedCompetitors([])
      onOpenChange(false)
    } catch (error) {
      toast({
        variant: "destructive",
        description: "生成失败，请重试",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-primary" />
            {t("contentWriting.aiHelp.title")}
          </DialogTitle>
          <DialogDescription>
            {t("contentWriting.aiHelp.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Requirements - FIRST FIELD */}
          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-base font-semibold">
              {t("contentWriting.aiHelp.promptLabel")}
            </Label>
            <Textarea
              id="prompt"
              placeholder={t("contentWriting.aiHelp.promptPlaceholder")}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-6">
            {/* Competitor Selection - FIRST, SINGLE SELECT */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TrendingUpIcon className="w-4 h-4" />
                <Label>{t("contentWriting.aiHelp.competitorLabel")}</Label>
              </div>

              <div className="space-y-2">
                <Input
                  placeholder={t("contentWriting.aiHelp.competitorPlaceholder")}
                  value={competitorSearch}
                  onChange={(e) => setCompetitorSearch(e.target.value)}
                />

                <ScrollArea className="h-[200px] border rounded-md p-2">
                  <div className="space-y-1">
                    {filteredCompetitors.map((post) => (
                      <div
                        key={post.id}
                        className={`flex items-center space-x-2 p-2 rounded cursor-pointer ${
                          selectedCompetitors.includes(post.id) ? 'bg-muted' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          // Single select: clear previous selection
                          setSelectedCompetitors([post.id])
                        }}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          selectedCompetitors.includes(post.id)
                            ? 'bg-primary border-primary'
                            : 'border-border'
                        }`}>
                          {selectedCompetitors.includes(post.id) && (
                            <div className="w-2.5 h-2.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{post.platform}</div>
                          <div className="text-xs text-muted-foreground truncate">{post.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Selected Competitor */}
              {selectedCompetitors.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    已选择竞品
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCompetitors.map((id) => {
                      const post = mockCompetitors.find(p => p.id === id)
                      return post ? (
                        <Badge key={id} variant="secondary" className="gap-1">
                          <span>{post.platform}</span>
                          <button
                            onClick={() => setSelectedCompetitors([])}
                            className="hover:bg-destructive hover:text-destructive-foreground rounded"
                          >
                            <XIcon className="w-3 h-3" />
                          </button>
                        </Badge>
                      ) : null
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Material Selection - SECOND, MULTI SELECT */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileTextIcon className="w-4 h-4" />
                <Label>{t("contentWriting.aiHelp.materialLabel")}</Label>
              </div>

              <div className="space-y-2">
                <Input
                  placeholder={t("contentWriting.aiHelp.materialPlaceholder")}
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                />

                <ScrollArea className="h-[200px] border rounded-md p-2">
                  {materialsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <LoaderIcon className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredMaterials.map((material) => (
                        <div
                          key={material.id}
                          className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded cursor-pointer"
                          onClick={() => handleToggleMaterial(String(material.id))}
                        >
                          <Checkbox checked={selectedMaterials.includes(String(material.id))} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{material.title}</div>
                            <div className="text-xs text-muted-foreground">{material.material_type}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Selected Materials */}
              {selectedMaterials.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    {t("contentWriting.aiHelp.selectedMaterials").replace("{count}", selectedMaterials.length.toString())}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedMaterials.map((id) => {
                      const material = materials.find(m => String(m.id) === id)
                      return material ? (
                        <Badge key={id} variant="secondary" className="gap-1">
                          <span>{material.title}</span>
                          <button
                            onClick={() => handleRemoveMaterial(id)}
                            className="hover:bg-destructive hover:text-destructive-foreground rounded"
                          >
                            <XIcon className="w-3 h-3" />
                          </button>
                        </Badge>
                      ) : null
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("contentWriting.aiHelp.cancelBtn")}
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <LoaderIcon className="w-4 h-4 animate-spin" />
                {t("contentWriting.aiHelp.generatingBtn")}
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4" />
                {t("contentWriting.aiHelp.confirmBtn")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
