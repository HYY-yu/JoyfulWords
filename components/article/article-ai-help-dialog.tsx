"use client"

/* eslint-disable @next/next/no-img-element */

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
import { Checkbox } from "@/components/ui/base/checkbox"
import { Badge } from "@/components/ui/base/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/base/toggle-group"
import { SparklesIcon, FileTextIcon, PenToolIcon, XIcon, LoaderIcon, UploadIcon, CheckIcon, CheckCircle2Icon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { articlesClient } from "@/lib/api/articles/client"
import { AI_WRITE_STYLE_OPTIONS } from "@/lib/api/articles/enums"
import { materialsClient } from "@/lib/api/materials/client"
import {
  useInfiniteMaterialPicker,
  type MaterialPickerScope,
} from "@/lib/hooks/use-infinite-material-picker"
import type { AIWriteStyleId, Article } from "@/lib/api/articles/types"
import type { Material } from "@/lib/api/materials/types"
import { cn } from "@/lib/utils"

// Types for dialog props
interface ArticleAIHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onArticleCreated: (article: Article) => void  // 接收后端返回的 Article 对象
  articleId?: number | null
  variant?: "default" | "feature" | "feature-compact"
}

function AIHelpMaterialCard({
  material,
  selected,
  onToggleSelected,
  onPreview,
  typeLabel,
}: {
  material: Material
  selected: boolean
  onToggleSelected: () => void
  onPreview: () => void
  typeLabel: string
}) {
  const isImage = material.material_type === "image"

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPreview}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onPreview()
        }
      }}
      className={cn(
        "flex min-h-[112px] min-w-0 cursor-pointer items-start gap-3 overflow-hidden rounded-lg border p-3 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-background hover:bg-muted/50"
      )}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={onToggleSelected}
        onClick={(event) => event.stopPropagation()}
        className="mt-0.5"
        aria-label={material.title}
      />

      {isImage && material.content ? (
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded border bg-muted/40">
          <img src={material.content} alt={material.title} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border bg-muted/40">
          <CheckCircle2Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 break-words text-sm font-medium text-foreground [overflow-wrap:anywhere]">
          {material.title}
        </div>
        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
          {typeLabel}
        </div>
        {!isImage && material.content ? (
          <div className="mt-2 line-clamp-3 break-words text-xs leading-5 text-muted-foreground [overflow-wrap:anywhere]">
            {material.content}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function ArticleAIHelpDialog({
  open,
  onOpenChange,
  onArticleCreated,
  articleId,
  variant = "default",
}: ArticleAIHelpDialogProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const articleIdFilter = articleId ?? undefined

  const [prompt, setPrompt] = useState("")
  const [selectedMaterials, setSelectedMaterials] = useState<number[]>([])
  const [selectedStyleId, setSelectedStyleId] = useState<AIWriteStyleId | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [materialScope, setMaterialScope] = useState<MaterialPickerScope>("article")
  const [materialSearch, setMaterialSearch] = useState("")
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null)

  // 文件上传状态
  const [uploadedFile, setUploadedFile] = useState<{
    url: string  // R2 file_url
    name: string
  } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 滚动位置状态
  const materialsScrollPositionRef = useRef(0)
  const materialsScrollRef = useRef<HTMLDivElement>(null)

  // 使用无限滚动素材 Hook
  const {
    materials,
    isLoading: materialsLoading,
    hasMore: hasMoreMaterials,
    loadMore: loadMoreMaterials,
    reset: resetMaterials,
    observerTarget: materialsObserverTarget,
  } = useInfiniteMaterialPicker({
    enabled: open,
    pageSize: 20,
    nameFilter: materialSearch || undefined,
    articleId: articleIdFilter,
    scope: materialScope,
  })

  const dialogDescription = articleIdFilter
    ? t("contentWriting.aiHelp.overwriteHint")
    : t("contentWriting.aiHelp.description")

  // 对话框关闭时清理状态（全量重置，避免下次打开残留上次输入）
  useEffect(() => {
    if (!open) {
      resetMaterials()
      setMaterialScope("article")
      setMaterialSearch("")
      materialsScrollPositionRef.current = 0
      setPrompt("")
      setSelectedStyleId(null)
      setUploadedFile(null)
      setSelectedMaterials([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }, [open, resetMaterials])

  // 保持素材列表滚动位置（只在对话框打开时恢复）
  useEffect(() => {
    if (open && materialsScrollPositionRef.current > 0 && materialsScrollRef.current) {
      setTimeout(() => {
        if (materialsScrollRef.current) {
          materialsScrollRef.current.scrollTop = materialsScrollPositionRef.current
        }
      }, 0)
    }
  }, [open]) // 只依赖 open，避免数据加载时频繁触发

  const handleMaterialsScroll = () => {
    if (materialsScrollRef.current) {
      materialsScrollPositionRef.current = materialsScrollRef.current.scrollTop
    }
  }

  const handleMaterialScopeChange = (value: string) => {
    if (!value) return
    setMaterialScope(value as MaterialPickerScope)
    materialsScrollPositionRef.current = 0
  }

  const handleToggleMaterial = (id: number) => {
    setSelectedMaterials(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSelectStyle = (styleId: AIWriteStyleId) => {
    // 互斥逻辑：选择文字风格时清空已上传文件
    if (uploadedFile) {
      setUploadedFile(null)
    }
    setSelectedStyleId(prev => (prev === styleId ? null : styleId))
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

    // 互斥逻辑：上传文件时清空已选文字风格
    if (selectedStyleId) {
      setSelectedStyleId(null)
    }

    setIsUploading(true)
    try {
      console.log('[AI Help] Starting file upload:', file.name, file.type, file.size)

      // 1. 获取预签名 URL
      const presignedResult = await materialsClient.getPresignedUrl(file.name, file.type, file.size)
      if ('error' in presignedResult) {
        throw new Error(presignedResult.error)
      }
      console.log('[AI Help] Presigned URL received')

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

      const completed = await materialsClient.completeUpload(presignedResult)
      if ('error' in completed) {
        throw new Error(completed.error)
      }

      // 3. 保存文件信息（不创建 material 记录）
      setUploadedFile({
        url: completed.file_url,
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

  const handleGenerate = async () => {
    // 覆盖保护：已有文章时生成会覆盖当前正文，必须经用户确认
    if (articleIdFilter && !window.confirm(t("contentWriting.aiHelp.overwriteConfirm"))) {
      return
    }

    // Validation: style 和上传参考文章二选一
    if (!selectedStyleId && !uploadedFile) {
      toast({
        variant: "destructive",
        description: t("contentWriting.aiHelp.styleRequired"),
      })
      return
    }

    // Validation: At least one selection or prompt required
    if (selectedMaterials.length === 0 && !prompt.trim()) {
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
      styleId: selectedStyleId,
      hasUploadedFile: !!uploadedFile
    })

    try {
      const result = await articlesClient.aiWrite({
        req: prompt,
        article_id: articleIdFilter,
        link_materials: selectedMaterials,
        style_id: selectedStyleId ?? undefined,
        competitor_file_url: uploadedFile?.url,
      })

      if ('error' in result) {
        console.warn('[AI Help] AI write failed:', result.error)
        throw new Error(result.error)
      }

      // Add Info log for success. The backend may return only article id; task
      // lifecycle is recovered through Task Center refetch and websocket events.
      console.info('[AI Help] AI write submitted successfully:', {
        articleId: result.id,
        isOverwrite: Boolean(articleIdFilter),
      })

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
      setSelectedStyleId(null)
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
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        overlayClassName={variant === "feature" || variant === "feature-compact" ? "bg-black/75" : undefined}
        showCloseButton={variant === "default"}
        className={
          variant === "feature"
            ? "flex h-screen w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 bg-background p-0 shadow-none sm:h-[calc(100vh-1rem)] sm:w-[calc(100vw-1rem)] sm:max-w-none sm:rounded-xl sm:border sm:border-border sm:shadow-2xl"
            : variant === "feature-compact"
            ? "flex h-screen w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 bg-background p-0 shadow-none sm:h-[calc(100vh-1rem)] sm:w-[calc(50vw-1rem)] sm:max-w-none sm:rounded-xl sm:border sm:border-border sm:shadow-2xl xl:w-[calc(44vw-1rem)] 2xl:w-[920px]"
            : "max-w-2xl"
        }
      >
        {variant === "feature" || variant === "feature-compact" ? (
          <div className="flex h-full min-h-0 flex-col bg-background">
            <DialogHeader className="shrink-0 border-b bg-background px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
                    <SparklesIcon className="h-5 w-5 text-primary" />
                    {t("contentWriting.aiHelp.title")}
                  </DialogTitle>
                  <DialogDescription className="mt-2">
                    {dialogDescription}
                  </DialogDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenChange(false)}
                  className="shrink-0 rounded-full"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              <div className="space-y-6 min-w-0">
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
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <PenToolIcon className="w-4 h-4" />
                        <Label>{t("contentWriting.aiHelp.styleLabel")}</Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("contentWriting.aiHelp.styleHint")}
                      </p>
                      <div className="max-h-72 overflow-y-auto pr-1">
                        <div className="grid gap-3 sm:grid-cols-2">
                          {AI_WRITE_STYLE_OPTIONS.map(({ value }) => {
                            const isSelected = selectedStyleId === value
                            const label = t(`contentWriting.aiHelp.styles.${value}.label`)
                            const description = t(`contentWriting.aiHelp.styles.${value}.description`)

                            return (
                              <button
                                key={value}
                                type="button"
                                disabled={!!uploadedFile}
                                onClick={() => handleSelectStyle(value)}
                                className={[
                                  "rounded-lg border p-4 text-left transition-colors",
                                  "disabled:cursor-not-allowed disabled:opacity-50",
                                  isSelected
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/40 hover:bg-muted/40",
                                ].join(" ")}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="text-sm font-semibold text-foreground">{label}</div>
                                  {isSelected ? <CheckIcon className="h-4 w-4 shrink-0 text-primary" /> : null}
                                </div>
                                <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">
                                  {description}
                                </p>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200 dark:border-gray-700"></span>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">{t("common.or") || "或"}</span>
                      </div>
                    </div>

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
                            disabled={isUploading || !!selectedStyleId}
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

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileTextIcon className="w-4 h-4" />
                      <Label>{t("contentWriting.aiHelp.materialLabel")}</Label>
                    </div>

                    <div className="space-y-2">
                      <ToggleGroup
                        type="single"
                        value={materialScope}
                        onValueChange={handleMaterialScopeChange}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <ToggleGroupItem value="all" className="px-3 text-xs">
                          {t("contentWriting.aiHelp.materialScopeAll")}
                        </ToggleGroupItem>
                        <ToggleGroupItem value="article" className="px-3 text-xs">
                          {t("contentWriting.aiHelp.materialScopeArticle")}
                        </ToggleGroupItem>
                        <ToggleGroupItem value="favorites" className="px-3 text-xs">
                          {t("contentWriting.aiHelp.materialScopeFavorites")}
                        </ToggleGroupItem>
                      </ToggleGroup>
                      <Input
                        placeholder={t("contentWriting.aiHelp.materialPlaceholder")}
                        value={materialSearch}
                        onChange={(e) => setMaterialSearch(e.target.value)}
                      />

                      <div
                        ref={materialsScrollRef}
                        onScroll={handleMaterialsScroll}
                        className="h-[240px] overflow-y-auto border rounded-md p-2"
                      >
                        {materialsLoading && materials.length === 0 ? (
                          <div className="flex items-center justify-center h-full">
                            <LoaderIcon className="w-5 h-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {materials.map((material) => (
                              <AIHelpMaterialCard
                                key={material.id}
                                material={material}
                                selected={selectedMaterials.includes(material.id)}
                                onToggleSelected={() => handleToggleMaterial(material.id)}
                                onPreview={() => setPreviewMaterial(material)}
                                typeLabel={t(`aiRewrite.material.typeLabels.${material.material_type}`)}
                              />
                            ))}
                            {(hasMoreMaterials || materialsLoading) && materials.length > 0 && (
                              <div ref={materialsObserverTarget} className="flex justify-center py-2">
                                <LoaderIcon className="h-4 w-4 animate-spin text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedMaterials.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                          {t("contentWriting.aiHelp.selectedMaterials").replace("{count}", selectedMaterials.length.toString())}
                        </div>
                        <div className="flex flex-wrap gap-2 min-w-0">
                          {selectedMaterials.map((id) => {
                            const material = materials.find(m => m.id === id)
                            return material ? (
                              <Badge key={id} variant="secondary" className="min-w-0 max-w-full gap-1">
                                <span className="max-w-[12rem] truncate sm:max-w-[20rem]">{material.title}</span>
                                <button
                                  onClick={() => handleRemoveMaterial(id)}
                                  className="hover:bg-destructive hover:text-destructive-foreground shrink-0 rounded"
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
            </div>

            <DialogFooter className="shrink-0 border-t bg-background px-4 py-4 sm:px-6">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
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
          </div>
        ) : (
          <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-primary" />
            {t("contentWriting.aiHelp.title")}
          </DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 min-w-0">
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
            {/* Writing style selection & reference article upload - mutually exclusive */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <PenToolIcon className="w-4 h-4" />
                  <Label>{t("contentWriting.aiHelp.styleLabel")}</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("contentWriting.aiHelp.styleHint")}
                </p>
                <div className="max-h-72 overflow-y-auto pr-1">
                  <div className="grid gap-3 sm:grid-cols-2">
                  {AI_WRITE_STYLE_OPTIONS.map(({ value }) => {
                    const isSelected = selectedStyleId === value
                    const label = t(`contentWriting.aiHelp.styles.${value}.label`)
                    const description = t(`contentWriting.aiHelp.styles.${value}.description`)

                    return (
                      <button
                        key={value}
                        type="button"
                        disabled={!!uploadedFile}
                        onClick={() => handleSelectStyle(value)}
                        className={[
                          "rounded-lg border p-4 text-left transition-colors",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 hover:bg-muted/40",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-sm font-semibold text-foreground">{label}</div>
                          {isSelected ? <CheckIcon className="h-4 w-4 shrink-0 text-primary" /> : null}
                        </div>
                        <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">
                          {description}
                        </p>
                      </button>
                    )
                  })}
                  </div>
                </div>
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

              {/* Option 2: Upload a reference article to imitate */}
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
                      disabled={isUploading || !!selectedStyleId}
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
                <ToggleGroup
                  type="single"
                  value={materialScope}
                  onValueChange={handleMaterialScopeChange}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <ToggleGroupItem value="all" className="px-3 text-xs">
                    {t("contentWriting.aiHelp.materialScopeAll")}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="article" className="px-3 text-xs">
                    {t("contentWriting.aiHelp.materialScopeArticle")}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="favorites" className="px-3 text-xs">
                    {t("contentWriting.aiHelp.materialScopeFavorites")}
                  </ToggleGroupItem>
                </ToggleGroup>
                <Input
                  placeholder={t("contentWriting.aiHelp.materialPlaceholder")}
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                />

                <div
                  ref={materialsScrollRef}
                  onScroll={handleMaterialsScroll}
                  className="h-[200px] overflow-y-auto border rounded-md p-2"
                >
                  {materialsLoading && materials.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <LoaderIcon className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {materials.map((material) => (
                        <AIHelpMaterialCard
                          key={material.id}
                          material={material}
                          selected={selectedMaterials.includes(material.id)}
                          onToggleSelected={() => handleToggleMaterial(material.id)}
                          onPreview={() => setPreviewMaterial(material)}
                          typeLabel={t(`aiRewrite.material.typeLabels.${material.material_type}`)}
                        />
                      ))}
                      {/* 无限滚动 observer */}
                      {(hasMoreMaterials || materialsLoading) && materials.length > 0 && (
                        <div ref={materialsObserverTarget} className="flex justify-center py-2">
                          <LoaderIcon className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Materials */}
              {selectedMaterials.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    {t("contentWriting.aiHelp.selectedMaterials").replace("{count}", selectedMaterials.length.toString())}
                  </div>
                  <div className="flex flex-wrap gap-2 min-w-0">
                    {selectedMaterials.map((id) => {
                      const material = materials.find(m => m.id === id)
                      return material ? (
                        <Badge key={id} variant="secondary" className="min-w-0 max-w-full gap-1">
                          <span className="max-w-[12rem] truncate sm:max-w-[20rem]">{material.title}</span>
                          <button
                            onClick={() => handleRemoveMaterial(id)}
                            className="hover:bg-destructive hover:text-destructive-foreground shrink-0 rounded"
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
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
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
          </>
        )}
      </DialogContent>
    </Dialog>
    <Dialog open={previewMaterial !== null} onOpenChange={(open) => !open && setPreviewMaterial(null)}>
      {previewMaterial?.material_type === "image" && previewMaterial.content ? (
        <DialogContent className="max-w-[min(96vw,1400px)] border-none bg-transparent p-2 shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">{previewMaterial.title}</DialogTitle>
          <div className="flex max-h-[90vh] flex-col gap-3">
            <div className="overflow-hidden rounded-lg bg-black/90 p-2">
              <img
                src={previewMaterial.content}
                alt={previewMaterial.title}
                className="max-h-[78vh] w-full rounded object-contain"
              />
            </div>
            <div className="rounded-lg bg-background/95 px-4 py-3 backdrop-blur">
              <div className="text-sm font-medium text-foreground">{previewMaterial.title}</div>
            </div>
          </div>
        </DialogContent>
      ) : previewMaterial ? (
        <DialogContent className="flex max-h-[85vh] max-w-[min(92vw,1100px)] flex-col overflow-hidden">
          <DialogTitle>{previewMaterial.title}</DialogTitle>
          <div className="mt-2 flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {t(`aiRewrite.material.typeLabels.${previewMaterial.material_type}`)}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto rounded-md border p-4">
              <div className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground [overflow-wrap:anywhere]">
                {previewMaterial.content}
              </div>
            </div>
            {previewMaterial.source_url ? (
              <div className="shrink-0 rounded-md border bg-muted/20 p-3">
                <div className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {t("contentWriting.materialPanel.viewSource")}
                </div>
                <a
                  href={previewMaterial.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-sm text-primary underline-offset-4 hover:underline"
                >
                  {previewMaterial.source_url}
                </a>
              </div>
            ) : null}
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
    </>
  )
}
