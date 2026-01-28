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
} from "@/components/ui/base/dialog"
import { Button } from "@/components/ui/base/button"
import { Input } from "@/components/ui/base/input"
import { Label } from "@/components/ui/base/label"
import { Textarea } from "@/components/ui/base/textarea"
import { ScrollArea } from "@/components/ui/base/scroll-area"
import { Checkbox } from "@/components/ui/base/checkbox"
import { Badge } from "@/components/ui/base/badge"
import { SparklesIcon, FileTextIcon, TrendingUpIcon, XIcon, LoaderIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { materialsClient } from "@/lib/api/materials/client"
import { articlesClient } from "@/lib/api/articles/client"
import { competitorsClient } from "@/lib/api/competitors/client"
import type { Material } from "@/lib/api/materials/types"
import type { Article } from "@/lib/api/articles/types"
import type { CrawlResult } from "@/lib/api/competitors/types"

// Types for dialog props
interface ArticleAIHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onArticleCreated: (article: Article) => void  // 接收后端返回的 Article 对象
}

export function ArticleAIHelpDialog({
  open,
  onOpenChange,
  onArticleCreated,
}: ArticleAIHelpDialogProps) {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [prompt, setPrompt] = useState("")
  const [selectedMaterials, setSelectedMaterials] = useState<number[]>([])
  const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [materialSearch, setMaterialSearch] = useState("")
  const [competitorSearch, setCompetitorSearch] = useState("")

  // Use real Materials API
  const [materials, setMaterials] = useState<Material[]>([])
  const [materialsLoading, setMaterialsLoading] = useState(false)

  // Use real Competitors API
  const [competitors, setCompetitors] = useState<CrawlResult[]>([])
  const [competitorsLoading, setCompetitorsLoading] = useState(false)

  // Load materials on mount
  useEffect(() => {
    const loadMaterials = async () => {
      setMaterialsLoading(true)
      try {
        console.log('[AI Help] Loading materials...')
        const result = await materialsClient.getMaterials({
          page: 1,
          page_size: 100,
        })
        if ('list' in result) {
          console.log('[AI Help] Materials loaded successfully:', result.list.length)
          setMaterials(result.list)
        } else if ('error' in result) {
          console.warn('[AI Help] Materials load failed:', result.error)
          toast({
            variant: "destructive",
            description: result.error,
          })
        }
      } catch (error) {
        console.error('[AI Help] Materials load error:', error)
        toast({
          variant: "destructive",
          description: t("contentWriting.aiHelp.loadMaterialsFailed"),
        })
      } finally {
        setMaterialsLoading(false)
      }
    }

    if (open) {
      loadMaterials()
    }
  }, [open, toast, t])

  // Load competitors on mount
  useEffect(() => {
    const loadCompetitors = async () => {
      setCompetitorsLoading(true)
      try {
        console.log('[AI Help] Loading competitors...')
        const result = await competitorsClient.getResults({
          page: 1,
          page_size: 100,
        })
        if ('posts' in result) {
          console.log('[AI Help] Competitors loaded successfully:', result.posts.length)
          setCompetitors(result.posts)
        } else if ('error' in result) {
          console.warn('[AI Help] Competitors load failed:', result.error)
          toast({
            variant: "destructive",
            description: result.error,
          })
        }
      } catch (error) {
        console.error('[AI Help] Competitors load error:', error)
        toast({
          variant: "destructive",
          description: t("contentWriting.aiHelp.loadCompetitorsFailed"),
        })
      } finally {
        setCompetitorsLoading(false)
      }
    }

    if (open) {
      loadCompetitors()
    }
  }, [open, toast, t])

  const filteredMaterials = materials.filter(m =>
    m.title?.toLowerCase().includes(materialSearch.toLowerCase()) ?? false
  )

  const filteredCompetitors = competitors.filter(c =>
    c.content?.toLowerCase().includes(competitorSearch.toLowerCase()) ?? false
  )

  const handleToggleMaterial = (id: number) => {
    setSelectedMaterials(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleToggleCompetitor = (id: string) => {
    setSelectedCompetitors(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleRemoveMaterial = (id: number) => {
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
      // 转换竞品 ID（string → number），目前只有一个竞品可选
      const postId = selectedCompetitors.length > 0 ? Number(selectedCompetitors[0]) : 0

      const result = await articlesClient.aiWrite({
        req: prompt,
        link_post: postId,
        link_materials: selectedMaterials,
      })

      if ('error' in result) {
        throw new Error(result.error)
      }

      // AI 写作启动成功
      toast({
        description: t("contentWriting.aiHelp.success"),
      })

      // 通知父组件刷新列表查看新文章（status='init'）
      onArticleCreated({
        id: result.id,
        title: "",
        content: "",
        status: "init",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 0,
      } as Article)

      // Reset form and close dialog
      setPrompt("")
      setSelectedMaterials([])
      setSelectedCompetitors([])
      onOpenChange(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("contentWriting.aiHelp.generateFailed")
      console.error('[AI Help] Generate failed:', error)
      toast({
        variant: "destructive",
        description: errorMessage,
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
                  {competitorsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <LoaderIcon className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
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
                          <div className="text-xs text-muted-foreground line-clamp-2">{post.content}</div>
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Selected Competitor */}
              {selectedCompetitors.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    {t("contentWriting.aiHelp.selectedCompetitor")}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCompetitors.map((id) => {
                      const post = competitors.find(p => p.id === id)
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
                          onClick={() => handleToggleMaterial(material.id)}
                        >
                          <Checkbox checked={selectedMaterials.includes(material.id)} />
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
                      const material = materials.find(m => m.id === id)
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
