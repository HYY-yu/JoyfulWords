"use client"

import { useState, useCallback, useEffect } from "react"
import { Upload, Sparkles, Image as ImageIcon, Zap, CheckCircle2, Loader2, Copy } from "lucide-react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useToast } from "@/hooks/use-toast"
import { imageGenerationClient } from "@/lib/api/image-generation/client"
import { uploadImageToR2 } from "@/lib/tiptap-image-upload"
import { useImageGenerationPolling, loadTaskFromStorage } from "@/hooks/use-image-generation-polling"
import { ModelSelector } from "@/components/image-generator/ui/model-selector"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/base/dialog"
import { Textarea } from "@/components/ui/base/textarea"
import { Button } from "@/components/ui/base/button"

// Style 模式专用的轮询配置
const STYLE_POLLING_CONFIG = {
  ...require('@/lib/api/image-generation/types').DEFAULT_POLLING_CONFIG,
  storageKey: 'joyfulwords-style-generation-task',
}

// 风格项目接口
interface StyleItem {
  id: string
  name: string
  img_url: string
  full_prompt?: string
  isCustom?: boolean
}

type RenderStatus = "idle" | "generating" | "completed" | "error"

// StyleCard 子组件
interface StyleCardProps {
  name: string
  imgUrl: string
  isCustom?: boolean
  isSelected: boolean
  onClick: () => void
  t: (key: string, params?: Record<string, any>) => string
}

function StyleCard({
  name,
  imgUrl,
  isSelected,
  onClick,
  t
}: StyleCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        relative group rounded-xl overflow-hidden cursor-pointer
        transition-all duration-300
        ${isSelected
          ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg scale-[1.02]"
          : "hover:scale-[1.01] hover:shadow-md"
        }
      `}
    >
      {/* 风格图片 - hover 时从中心放大 1.1 倍 */}
      <div className="relative h-32 w-full overflow-hidden bg-muted">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 origin-center"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>

      {/* 只保留标题 */}
      <div className="p-3 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">{name}</h4>
          {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
        </div>
      </div>

      {/* 选中标记 */}
      {isSelected && (
        <div className="absolute top-2 left-2">
          <div className="px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
            {t("imageGeneration.styleMode.selected")}
          </div>
        </div>
      )}
    </div>
  )
}

export function StyleMode() {
  const { t, locale } = useTranslation()
  const { toast } = useToast()
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<StyleItem | null>(null)
  const [renderStatus, setRenderStatus] = useState<RenderStatus>("idle")
  const [renderedImage, setRenderedImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [currentGenerationLogId, setCurrentGenerationLogId] = useState<number | null>(null)
  const [isSavingToMaterials, setIsSavingToMaterials] = useState(false)

  // 风格列表相关状态
  const [styles, setStyles] = useState<StyleItem[]>([])
  const [isLoadingStyles, setIsLoadingStyles] = useState(true)
  const [stylesLoadError, setStylesLoadError] = useState<string | null>(null)

  // 模型选择相关状态
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [isLoadingModels, setIsLoadingModels] = useState(true)

  // 自定义风格对话框状态
  const [showCustomDialog, setShowCustomDialog] = useState(false)
  const [customPrompt, setCustomPrompt] = useState("")

  // 获取风格列表
  useEffect(() => {
    const fetchStyles = async () => {
      console.debug('[StyleMode] Fetching style examples...')

      try {
        const result = await imageGenerationClient.getStyleExamples()

        if ('error' in result) {
          console.error('[StyleMode] Failed to fetch style examples:', result.error)
          setStylesLoadError((result.error as any)?.message || 'Unknown error')
          return
        }

        console.info('[StyleMode] Successfully fetched style examples:', {
          count: result.style_list.length
        })

        const transformedStyles: StyleItem[] = result.style_list.map((style, index) => ({
          id: `style-${index}`,
          name: style.name,
          img_url: style.img_url,
          full_prompt: style.full_prompt
        }))

        setStyles(transformedStyles)
      } catch (error) {
        console.error('[StyleMode] Unexpected error:', error)
        setStylesLoadError('Network error')
      } finally {
        setIsLoadingStyles(false)
      }
    }

    fetchStyles()
  }, [])

  // 获取模型列表
  useEffect(() => {
    const fetchModels = async () => {
      console.debug('[StyleMode] Fetching available models...')

      try {
        const result = await imageGenerationClient.getModels()

        if ('error' in result) {
          console.error('[StyleMode] Failed to fetch models:', result.error)
          toast({
            variant: "destructive",
            title: t("imageGeneration.model.fetchFailed"),
          })
          return
        }

        console.info('[StyleMode] Successfully fetched models:', {
          count: result.models.length,
          provider: result.provider
        })

        setAvailableModels(result.models)
        if (result.models.length > 0) {
          setSelectedModel(result.models[0])
        }
      } catch (error) {
        console.error('[StyleMode] Unexpected error fetching models:', error)
      } finally {
        setIsLoadingModels(false)
      }
    }

    fetchModels()
  }, [t, toast])

  // 轮询配置
  const { startPolling, stopPolling, isPolling } = useImageGenerationPolling({
    config: STYLE_POLLING_CONFIG,
    onSuccess: (result) => {
      console.info('[StyleMode] Generation completed successfully')

      // 解析 image_url（可能是字符串或 JSON 数组字符串）
      let imageUrl: string
      if (typeof result.image_url === 'string' && result.image_url.startsWith('[')) {
        const urls = JSON.parse(result.image_url) as string[]
        imageUrl = urls[0]
      } else {
        imageUrl = result.image_url as string
      }

      setRenderedImage(imageUrl)
      setRenderStatus("completed")

      // 保存生成记录ID
      setCurrentGenerationLogId(Number(result.task_id))
      console.info('[StyleMode] Saved generation log ID:', result.task_id)

      toast({ title: t("imageGeneration.toast.generationSuccess") })
    },
    onError: (error) => {
      console.error('[StyleMode] Generation failed:', error.message)
      setRenderStatus("error")
      toast({
        variant: "destructive",
        title: error.message || t("imageGeneration.toast.generationFailed"),
      })
    },
  })

  // 组件 mount 时检查 localStorage，恢复未完成的任务
  useEffect(() => {
    const savedTask = loadTaskFromStorage(STYLE_POLLING_CONFIG)

    if (savedTask && (savedTask.status === 'pending' || savedTask.status === 'processing')) {
      // INFO: 恢复轮询 - 发现未完成的任务
      console.info('[StyleMode] Resuming polling from localStorage:', {
        taskId: savedTask.task_id,
        status: savedTask.status,
        hasPrompt: !!savedTask.prompt,
      })

      setRenderStatus("generating")

      // 启动轮询（不带 storage 参数，因为已经从 localStorage 加载了）
      startPolling(savedTask.task_id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 只在 mount 时执行一次

  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploading(true)

    try {
      console.debug('[StyleMode] Uploading image to R2:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      })

      // 上传到 R2 获取 URL
      const imageUrl = await uploadImageToR2(file)

      // INFO: 图片上传成功
      console.info('[StyleMode] Image uploaded successfully:', { imageUrl })

      setUploadedImageUrl(imageUrl)

      // 保留本地预览
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') {
          setUploadedImage(result)
          setRenderedImage(null)
          setRenderStatus("idle")

          // DEBUG: 上传完成后检查状态
          console.debug('[StyleMode] Upload complete, current state:', {
            hasImageUrl: !!imageUrl,
            imagePreviewLength: result.length,
          })
        }
      }
      reader.onerror = () => {
        console.error('[StyleMode] FileReader failed to read the image')
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('[StyleMode] Image upload failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // 根据错误类型显示不同的提示
      if (errorMessage === 'invalidFileType') {
        toast({
          variant: "destructive",
          title: t("imageGeneration.toast.error.invalidFileType"),
        })
      } else if (errorMessage === 'fileTooLarge') {
        toast({
          variant: "destructive",
          title: t("materials.dialog.imageTooLarge"),
        })
      } else {
        toast({
          variant: "destructive",
          title: t("imageGeneration.styleMode.validation.uploadFailed"),
          description: errorMessage,
        })
      }
    } finally {
      setIsUploading(false)
    }
  }, [t, toast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      handleFileUpload(file)
    }
  }, [handleFileUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleStyleSelect = (style: StyleItem) => {
    setSelectedStyle(style)
  }

  const handleCustomStyleConfirm = () => {
    if (!customPrompt.trim()) return

    const customStyle: StyleItem = {
      id: 'custom',
      name: t("imageGeneration.styleMode.styleList.custom"),
      img_url: '',
      full_prompt: customPrompt,
      isCustom: true
    }

    setSelectedStyle(customStyle)
    setShowCustomDialog(false)
    setCustomPrompt("")

    console.info('[StyleMode] Custom style created:', { promptLength: customPrompt.length })
  }

  const handleGenerate = async () => {
    // 验证输入
    if (!uploadedImageUrl || !selectedStyle || !selectedModel) {
      console.warn('[StyleMode] Generation validation failed:', {
        hasImage: !!uploadedImageUrl,
        hasStyle: !!selectedStyle,
        hasModel: !!selectedModel
      })

      if (!uploadedImageUrl || !selectedStyle) {
        toast({
          variant: "destructive",
          title: t("imageGeneration.styleMode.validation.missingInput"),
          description: t("imageGeneration.styleMode.validation.missingInputDesc"),
        })
      } else if (!selectedModel) {
        toast({
          variant: "destructive",
          title: t("imageGeneration.styleMode.validation.missingModel"),
          description: t("imageGeneration.styleMode.validation.missingModelDesc"),
        })
      }
      return
    }

    console.info('[StyleMode] Starting generation:', {
      styleName: selectedStyle.name,
      modelName: selectedModel,
      hasPrompt: !!selectedStyle.full_prompt
    })

    setRenderStatus("generating")

    try {
      // 调用真实 API
      const result = await imageGenerationClient.createGenerationTask({
        gen_mode: 'style',
        prompt: selectedStyle.full_prompt || selectedStyle.name,
        model_name: selectedModel,
        reference_images: [uploadedImageUrl],
      })

      if ('error' in result) {
        console.error('[StyleMode] Failed to create generation task:', result.error)
        setRenderStatus("error")
        toast({
          variant: "destructive",
          title: t("imageGeneration.toast.taskCreateFailed"),
        })
        return
      }

      console.info('[StyleMode] Task created successfully:', {
        taskId: result.task_id,
        status: result.status,
        estimatedEta: result.estimated_eta
      })

      // 启动轮询
      await startPolling(result.task_id, {
        status: result.status,
        prompt: selectedStyle.full_prompt,
      })
    } catch (error) {
      console.error('[StyleMode] Generation error:', error)
      setRenderStatus("error")
      toast({
        variant: "destructive",
        title: t("imageGeneration.toast.generationFailed"),
      })
    }
  }

  const handleSaveToMaterials = async () => {
    if (!currentGenerationLogId) {
      console.error('[StyleMode] No generation log ID available')
      toast({
        variant: "destructive",
        title: t("imageGeneration.toast.copyToMaterialsFailed"),
        description: t("imageGeneration.toast.error.logNotFound"),
      })
      return
    }

    console.info('[StyleMode] Copying to materials:', { logId: currentGenerationLogId })

    setIsSavingToMaterials(true)

    try {
      const result = await imageGenerationClient.copyToMaterials(currentGenerationLogId)

      if ('error' in result) {
        console.error('[StyleMode] Copy to materials failed:', result.error)

        const errorMessage = String(result.error)
        let errorKey = "serverError"

        if (errorMessage.includes("not found")) errorKey = "logNotFound"
        else if (errorMessage.includes("not completed")) errorKey = "notCompleted"
        else if (errorMessage.includes("no images")) errorKey = "noImages"
        else if (errorMessage.includes("unauthorized")) errorKey = "unauthorized"

        toast({
          variant: "destructive",
          title: t("imageGeneration.toast.copyToMaterialsFailed"),
          description: t(`imageGeneration.toast.error.${errorKey}`),
        })
        return
      }

      console.info('[StyleMode] Successfully copied to materials:', {
        count: result.count,
        materialIds: result.material_ids,
      })

      toast({
        title: t("imageGeneration.toast.copyToMaterialsSuccess", {
          count: result.count,
        }),
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[StyleMode] Unexpected error:', { error: errorMessage })

      toast({
        variant: "destructive",
        title: t("imageGeneration.toast.copyToMaterialsFailed"),
        description: t("imageGeneration.toast.error.serverError"),
      })
    } finally {
      setIsSavingToMaterials(false)
    }
  }

  const handleReset = () => {
    setUploadedImage(null)
    setUploadedImageUrl(null)
    setRenderedImage(null)
    setSelectedStyle(null)
    setRenderStatus("idle")
    stopPolling()
  }

  const handleRetryFetchStyles = () => {
    setIsLoadingStyles(true)
    setStylesLoadError(null)
    // useEffect 会自动重新触发（通过依赖项变化）
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* 左侧：上传和预览区 */}
      <div className="w-80 border-r border-border/50 bg-muted/30 flex flex-col">
        <div className="p-4 border-b border-border/50">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {t("imageGeneration.styleMode.baseImage.title")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("imageGeneration.styleMode.baseImage.description")}
          </p>
        </div>

        {/* 模型选择器 */}
        <div className="p-4 border-b border-border/50">
          <ModelSelector
            selectedModel={selectedModel}
            availableModels={availableModels}
            isLoading={isLoadingModels}
            onModelChange={setSelectedModel}
          />
        </div>

        <div className="flex-1 p-4 space-y-4">
          {/* 上传区域 */}
          {!uploadedImage ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => {
                if (isUploading) return
                const input = document.createElement("input")
                input.type = "file"
                input.accept = "image/*"
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) handleFileUpload(file)
                }
                input.click()
              }}
              className={`
                relative aspect-square rounded-2xl border-2 border-dashed transition-all duration-300
                flex flex-col items-center justify-center cursor-pointer overflow-hidden
                ${
                  isDragging
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : isUploading
                    ? "border-muted bg-muted/20 cursor-not-allowed"
                    : "border-border/50 hover:border-primary/50 hover:bg-muted/50"
                }
              `}
            >
              {isUploading ? (
                <>
                  <div className="p-4 rounded-full mb-3 bg-muted">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                  <p className="text-sm font-medium text-foreground text-center px-4">
                    {t("imageGeneration.styleMode.uploading")}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {t("imageGeneration.styleMode.uploadingHint")}
                  </p>
                </>
              ) : (
                <>
                  <div className={`
                    p-4 rounded-full mb-3 transition-all duration-300
                    ${isDragging ? "bg-primary/20 scale-110" : "bg-muted"}
                  `}>
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground text-center px-4">
                    {t("imageGeneration.styleMode.baseImage.dropHere")}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {t("imageGeneration.styleMode.baseImage.orClick")}
                  </p>
                </>
              )}

              {/* 拖拽时的高亮效果 */}
              {isDragging && (
                <div className="absolute inset-0 bg-primary/10 animate-pulse pointer-events-none" />
              )}
            </div>
          ) : (
            <>
              {/* 已上传图片的预览 */}
              <div
                onClick={() => {
                  if (isUploading || isPolling) return
                  const input = document.createElement("input")
                  input.type = "file"
                  input.accept = "image/*"
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) handleFileUpload(file)
                  }
                  input.click()
                }}
                className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
                  isUploading || isPolling
                    ? "border-muted bg-muted/20 cursor-not-allowed"
                    : "border-border/50 hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
                }`}
              >
                <img
                  src={uploadedImage}
                  alt="Uploaded"
                  className="w-full h-full object-cover"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
                <div className={`absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200 flex items-center justify-center ${
                  isUploading || isPolling ? "opacity-0" : "opacity-0 hover:opacity-100"
                }`}>
                  <Upload className="w-8 h-8 text-foreground" />
                </div>
              </div>

              {/* 重新上传按钮 */}
              <button
                onClick={handleReset}
                disabled={isPolling}
                className={`text-xs transition-colors w-fit ${
                  isPolling
                    ? "text-muted-foreground cursor-not-allowed"
                    : "text-destructive hover:text-destructive/80"
                }`}
              >
                {t("imageGeneration.styleMode.preview.reupload")}
              </button>
            </>
          )}

          {/* 功能提示 */}
          {!uploadedImage && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted-foreground text-center">
                {locale === 'zh'
                  ? '上传黑白线稿图，AI 将会应用对应风格'
                  : 'Upload a line drawing, AI will apply style transfer'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 中间：实时预览区 */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
        {/* 预览头部 */}
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {t("imageGeneration.styleMode.preview.live")}
            </span>
          </div>

          {/* 状态指示器 */}
          <div className="flex items-center gap-2">
            {/* 生成按钮 */}
            <button
              onClick={handleGenerate}
              disabled={
                renderStatus !== "idle" ||
                !uploadedImageUrl ||
                !selectedStyle ||
                !selectedModel ||
                isPolling ||
                isUploading
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                renderStatus !== "idle" ||
                !uploadedImageUrl ||
                !selectedStyle ||
                !selectedModel ||
                isPolling ||
                isUploading
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95"
              }`}
              title={!uploadedImageUrl
                ? t("imageGeneration.styleMode.validation.missingImage")
                : !selectedStyle
                ? t("imageGeneration.styleMode.validation.missingStyle")
                : !selectedModel
                ? t("imageGeneration.styleMode.validation.missingModel")
                : t("imageGeneration.styleMode.generate")
              }
            >
              <Sparkles className={`w-4 h-4 ${isUploading ? "animate-spin" : ""}`} />
              {t("imageGeneration.styleMode.generate")}
            </button>

            {/* 状态提示 */}
            {!isUploading && !isPolling && renderStatus === "idle" && (
              <>
                {!uploadedImageUrl && (
                  <span className="text-xs text-muted-foreground">
                    {t("imageGeneration.styleMode.validation.missingImage")}
                  </span>
                )}
                {uploadedImageUrl && !selectedStyle && (
                  <span className="text-xs text-muted-foreground">
                    {t("imageGeneration.styleMode.validation.missingStyle")}
                  </span>
                )}
                {uploadedImageUrl && selectedStyle && !selectedModel && (
                  <span className="text-xs text-muted-foreground">
                    {t("imageGeneration.styleMode.validation.missingModel")}
                  </span>
                )}
              </>
            )}

            {renderStatus === "generating" && (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                <Zap className="w-4 h-4 animate-pulse" />
                {t("imageGeneration.styleMode.rendering")}
              </div>
            )}
            {renderStatus === "completed" && renderedImage && (
              <button
                onClick={handleSaveToMaterials}
                disabled={isSavingToMaterials || !currentGenerationLogId}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isSavingToMaterials || !currentGenerationLogId
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700 hover:scale-105 active:scale-95"
                }`}
              >
                {isSavingToMaterials ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {isSavingToMaterials
                  ? t("materials.dialog.uploadBtn")
                  : t("imageGeneration.canvas.saveToMaterials")
                }
              </button>
            )}
          </div>
        </div>

        {/* 预览区域 */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="relative w-full max-w-2xl aspect-square">
            {/* 空状态 */}
            {!uploadedImage && !renderedImage && (
              <div className="w-full h-full rounded-2xl border-2 border-dashed border-border/30 flex flex-col items-center justify-center bg-muted/20">
                <div className="p-6 rounded-full bg-muted/50 mb-4">
                  <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                </div>
                <p className="text-lg font-medium text-muted-foreground">
                  {t("imageGeneration.styleMode.preview.waitingForUpload")}
                </p>
              </div>
            )}

            {/* 原图预览 */}
            {uploadedImage && !renderedImage && (
              <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-border/50 shadow-lg">
                <img
                  src={uploadedImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* 渲染中动画 */}
            {renderStatus === "generating" && (
              <div className="absolute inset-0 rounded-2xl overflow-hidden border-2 border-primary/50">
                {/* 只有在有上传图片时才显示模糊背景 */}
                {uploadedImage && (
                  <img
                    src={uploadedImage}
                    alt="Rendering"
                    className="w-full h-full object-cover opacity-50 blur-sm"
                  />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary/10 backdrop-blur-sm">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                  </div>
                  <p className="mt-6 text-lg font-medium text-primary">
                    {t("imageGeneration.styleMode.aiRendering")}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t("imageGeneration.styleMode.thisMayTake")}
                  </p>
                </div>
              </div>
            )}

            {/* 渲染完成 */}
            {renderStatus === "completed" && renderedImage && (
              <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-green-500/50 shadow-2xl relative">
                <img
                  src={renderedImage}
                  alt="Rendered"
                  className="w-full h-full object-cover"
                />
                {/* 成功标记 */}
                <div className="absolute top-4 right-4 p-2 bg-green-500 rounded-full shadow-lg">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
              </div>
            )}

            {/* 错误状态 */}
            {renderStatus === "error" && (
              <div className="w-full h-full rounded-2xl border-2 border-destructive/50 bg-destructive/5 flex flex-col items-center justify-center">
                <div className="p-6 rounded-full bg-destructive/10 mb-4">
                  <Zap className="w-12 h-12 text-destructive" />
                </div>
                <p className="text-lg font-medium text-destructive">
                  {t("imageGeneration.toast.generationFailed")}
                </p>
                <button
                  onClick={() => {
                    setRenderStatus("idle")
                    setRenderedImage(null)
                  }}
                  className="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-all duration-200"
                >
                  {t("common.confirm")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 右侧：风格控制面板 */}
      <div className="w-96 border-l border-border/50 bg-muted/30 flex flex-col">
        <div className="p-4 border-b border-border/50">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {t("imageGeneration.styleMode.styleList.title")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isLoadingStyles
              ? t("imageGeneration.styleMode.styleList.loading")
              : `${styles.length} styles available`
            }
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* 加载状态 */}
          {isLoadingStyles && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">
                {t("imageGeneration.styleMode.styleList.loading")}
              </p>
            </div>
          )}

          {/* 错误状态 */}
          {!isLoadingStyles && stylesLoadError && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <p className="text-sm text-destructive mb-3">
                {t("imageGeneration.styleMode.styleList.loadError")}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryFetchStyles}
              >
                {t("imageGeneration.styleMode.styleList.retry")}
              </Button>
            </div>
          )}

          {/* 风格列表 */}
          {!isLoadingStyles && !stylesLoadError && (
            <div className="grid grid-cols-2 gap-3">
              {styles.map((style) => (
                <StyleCard
                  key={style.id}
                  name={style.name}
                  imgUrl={style.img_url}
                  isSelected={selectedStyle?.id === style.id}
                  onClick={() => handleStyleSelect(style)}
                  t={t}
                />
              ))}

              {/* 自定义风格卡片 */}
              <StyleCard
                key="custom"
                name={t("imageGeneration.styleMode.styleList.custom")}
                imgUrl=""
                isSelected={selectedStyle?.isCustom === true}
                onClick={() => setShowCustomDialog(true)}
                t={t}
              />
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="p-4 border-t border-border/50 bg-background/50">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              {t("imageGeneration.styleMode.hint")}
            </p>
          </div>
        </div>
      </div>

      {/* 自定义风格对话框 */}
      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("imageGeneration.styleMode.styleList.custom")}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              placeholder={t("imageGeneration.styleMode.styleList.customPlaceholder")}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCustomDialog(false)
                setCustomPrompt("")
              }}
            >
              {t("imageGeneration.styleMode.styleList.customCancel")}
            </Button>
            <Button
              onClick={handleCustomStyleConfirm}
              disabled={!customPrompt.trim()}
            >
              {t("imageGeneration.styleMode.styleList.customConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
