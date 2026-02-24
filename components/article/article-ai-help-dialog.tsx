"use client"

import { useState, useEffect, useRef } from "react"
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
import { SparklesIcon, FileTextIcon, TrendingUpIcon, XIcon, LoaderIcon, UploadIcon } from "lucide-react"
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

  // 文件上传状态
  const [uploadedFile, setUploadedFile] = useState<{
    url: string  // R2 file_url
    name: string
  } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
            title: t("contentWriting.aiHelp.loadMaterialsFailed"),
            description: result.error,
          })
        }
      } catch (error) {
        console.error('[AI Help] Materials load error:', error)
        toast({
          variant: "destructive",
          title: t("contentWriting.aiHelp.loadMaterialsFailed"),
          description: error instanceof Error ? error.message : undefined,
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
            title: t("contentWriting.aiHelp.loadCompetitorsFailed"),
            description: result.error,
          })
        }
      } catch (error) {
        console.error('[AI Help] Competitors load error:', error)
        toast({
          variant: "destructive",
          title: t("contentWriting.aiHelp.loadCompetitorsFailed"),
          description: error instanceof Error ? error.message : undefined,
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
    // 互斥逻辑：选择竞品时清空已上传文件
    if (uploadedFile) {
      setUploadedFile(null)
    }
    setSelectedCompetitors([id]) // 单选
  }

  // 文件验证
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: t("contentWriting.aiHelp.invalidFileType") }
    }
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return { valid: false, error: t("contentWriting.aiHelp.fileTooLarge") }
    }
    return { valid: true }
  }

  // 文件上传处理
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件
    const validation = validateFile(file)
    if (!validation.valid) {
      toast({
        variant: "destructive",
        description: validation.error,
      })
      // 重置 input
      e.target.value = ''
      return
    }

    // 互斥逻辑：上传文件时清空竞品选择
    if (selectedCompetitors.length > 0) {
      setSelectedCompetitors([])
    }

    setIsUploading(true)
    try {
      console.log('[AI Help] Starting file upload:', file.name, file.type, file.size)

      // 1. 获取预签名 URL
      const presignedResult = await materialsClient.getPresignedUrl(file.name, file.type)
      if ('error' in presignedResult) {
        throw new Error(presignedResult.error)
      }
      console.log('[AI Help] Presigned URL received:', presignedResult.file_url)

      // 2. 上传文件到 R2
      const { uploadFileToPresignedUrl } = await import("@/lib/api/materials/client")
      const uploadSuccess = await uploadFileToPresignedUrl(
        presignedResult.upload_url,
        file,
        file.type
      )
      if (!uploadSuccess) {
        throw new Error(t("contentWriting.aiHelp.uploadFailed"))
      }
      console.log('[AI Help] File uploaded to R2 successfully')

      // 3. 保存文件信息（不创建 material 记录）
      setUploadedFile({
        url: presignedResult.file_url,
        name: file.name
      })

      toast({
        description: t("contentWriting.aiHelp.uploadSuccess"),
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("contentWriting.aiHelp.uploadFailed")
      console.error('[AI Help] Upload failed:', error)
      toast({
        variant: "destructive",
        description: errorMessage,
      })
    } finally {
      setIsUploading(false)
    }

    // 重置 input 允许重复上传同名文件
    e.target.value = ''
  }

  // 移除已上传文件
  const handleRemoveFile = () => {
    setUploadedFile(null)
    // 重置 input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 对话框关闭处理（上传中阻止关闭）
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isUploading) {
      toast({
        variant: "destructive",
        description: t("contentWriting.aiHelp.uploadInProgress") || "文件上传中，请稍候...",
      })
      return
    }
    onOpenChange(newOpen)
  }

  const handleRemoveMaterial = (id: number) => {
    setSelectedMaterials(prev => prev.filter(i => i !== id))
  }

  const handleRemoveCompetitor = (id: string) => {
    setSelectedCompetitors(prev => prev.filter(i => i !== id))
  }

  const handleGenerate = async () => {
    // Validation: At least one selection or prompt required
    if (selectedMaterials.length === 0 && selectedCompetitors.length === 0 && !uploadedFile && !prompt.trim()) {
      toast({
        variant: "destructive",
        description: t("contentWriting.aiHelp.promptRequired"),
      })
      return
    }

    setIsGenerating(true)

    // Add Info log for critical path
    console.log('[AI Help] Starting article generation:', {
      promptLength: prompt.length,
      materialsCount: selectedMaterials.length,
      competitorId: selectedCompetitors[0] || null,
      hasUploadedFile: !!uploadedFile
    })

    try {
      // 转换竞品 ID（string → number），目前只有一个竞品可选
      const postId = selectedCompetitors.length > 0 ? Number(selectedCompetitors[0]) : 0

      const result = await articlesClient.aiWrite({
        req: prompt,
        link_post: postId,
        link_materials: selectedMaterials,
        competitor_file_url: uploadedFile?.url,
      })

      if ('error' in result) {
        console.warn('[AI Help] AI write failed:', result.error)
        throw new Error(result.error)
      }

      // Add Info log for success
      console.log('[AI Help] Article created successfully:', result.id)

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
      setUploadedFile(null)
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            {/* Competitor Selection & File Upload - mutually exclusive */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-6">
              {/* Option 1: Select from existing competitors */}
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
                    disabled={!!uploadedFile}
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
                          } ${uploadedFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => uploadedFile ? null : handleToggleCompetitor(post.id)}
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

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200 dark:border-gray-700"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">{t("common.or") || "或"}</span>
                </div>
              </div>

              {/* Option 2: Upload competitor article */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <UploadIcon className="w-4 h-4" />
                    <Label>{t("contentWriting.aiHelp.fileUploadLabel")}</Label>
                  </div>
                  {isUploading && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <LoaderIcon className="w-3 h-3 animate-spin" />
                      {t("contentWriting.aiHelp.uploading")}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {!uploadedFile ? (
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,image/jpg,application/pdf"
                      onChange={handleFileSelect}
                      disabled={isUploading || selectedCompetitors.length > 0}
                    />
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileTextIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm truncate">{uploadedFile.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveFile}
                        disabled={isUploading}
                        className="flex-shrink-0"
                      >
                        <XIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {t("contentWriting.aiHelp.fileUploadHint")}
                  </p>
                </div>
              </div>
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
            disabled={isGenerating || isUploading}
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
