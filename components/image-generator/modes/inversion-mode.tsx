"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { Upload, Split, Download, CheckCircle2, Layers, Loader2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useToast } from "@/hooks/use-toast"
import { useAsyncTaskToast } from "@/hooks/use-async-task-toast"
import { imageGenerationClient } from "@/lib/api/image-generation/client"
import { uploadImageToR2 } from "@/lib/tiptap-image-upload"
import { loadTaskFromStorage } from "@/hooks/use-image-generation-polling"
import { MaterialSelectorDialog } from "@/components/image-generator/ui/material-selector-dialog"
import { useInfiniteMaterials } from "@/lib/hooks/use-infinite-materials"
import { Button } from "@/components/ui/base/button"
import { Textarea } from "@/components/ui/base/textarea"
import { Slider } from "@/components/ui/base/slider"
import { DEFAULT_POLLING_CONFIG } from "@/lib/api/image-generation/types"

// 反向模式专用的轮询配置
const INVERSION_POLLING_CONFIG = {
  ...DEFAULT_POLLING_CONFIG,
  storageKey: 'joyfulwords-inversion-generation-task',
}

type LayerImage = {
  id: string
  name: string
  nameEn: string
  imageUrl: string
  description: string
  index: number
}

type SplitStatus = "idle" | "uploading" | "splitting" | "completed" | "error"

interface InversionModeProps {
  articleId?: number | null
}

export function InversionMode({ articleId }: InversionModeProps) {
  const { t, locale } = useTranslation()
  const { toast } = useToast()
  const taskToast = useAsyncTaskToast()

  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [selectedMaterialUrl, setSelectedMaterialUrl] = useState<string | null>(null)
  const [splitStatus, setSplitStatus] = useState<SplitStatus>("idle")
  const [layerImages, setLayerImages] = useState<LayerImage[]>([])
  const [selectedLayers, setSelectedLayers] = useState<Set<string>>(new Set())
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [currentGenerationLogId, setCurrentGenerationLogId] = useState<number | null>(null)
  const [showMaterialSelector, setShowMaterialSelector] = useState(false)

  // 新增状态
  const [numLayers, setNumLayers] = useState(4)
  const [prompt, setPrompt] = useState("")
  const taskLabel = t("tiptapEditor.aiPanel.reversalMode")
  const submittingToastTitle = t("asyncTaskToast.submittingTitle", { task: taskLabel })
  const submittingToastDescription = t("asyncTaskToast.submittingDescription", { task: taskLabel })
  const pollingToastTitle = t("asyncTaskToast.pollingTitle", { task: taskLabel })
  const pollingToastDescription = t("asyncTaskToast.pollingDescription", { task: taskLabel })

  // 图片生成相关状态
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)

  const {
    materials,
    isLoading: materialsLoading,
    hasMore: hasMoreMaterials,
    loadMore: loadMoreMaterials,
    observerTarget: materialsObserverTarget,
  } = useInfiniteMaterials({
    type: "image",
    enabled: showMaterialSelector,
    pageSize: 20,
  })

  const selectedMaterial = useMemo(
    () => materials.find((material) => material.content === selectedMaterialUrl) ?? null,
    [materials, selectedMaterialUrl]
  )

  const baseImagePreview = uploadedImage ?? selectedMaterialUrl
  const baseImageUrl = uploadedImageUrl ?? selectedMaterialUrl

  // 轮询任务状态
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 处理任务完成
  const handleTaskComplete = useCallback((data: any) => {
    if (data.task_id === currentTaskId) {
      console.info('[InversionMode] Split completed successfully')

      // 解析多图 URL
      let layerUrls: string[]
      try {
        const imageUrls = data.image_url
        if (typeof imageUrls === 'string' && imageUrls.startsWith('[')) {
          layerUrls = JSON.parse(imageUrls) as string[]
        } else if (Array.isArray(imageUrls)) {
          layerUrls = imageUrls
        } else if (typeof imageUrls === 'string') {
          layerUrls = [imageUrls]
        } else {
          layerUrls = []
        }
      } catch (error) {
        console.error('[InversionMode] Failed to parse image_url:', error)
        layerUrls = []
      }

      // 转换为 LayerImage 格式
      const layers: LayerImage[] = layerUrls.map((url, index) => ({
        id: `layer-${index + 1}`,
        name: t(`imageGeneration.inversionMode.layers.default`, { index: index + 1 }),
        nameEn: locale === 'zh' ? `图层 ${index + 1}` : `Layer ${index + 1}`,
        imageUrl: url,
        description: t(`imageGeneration.inversionMode.layers.defaultDescription`, { index: index + 1 }),
        index,
      }))

      setLayerImages(layers)
      setSplitStatus("completed")
      setCurrentGenerationLogId(Number(data.task_id))
      console.info('[InversionMode] Saved generation log ID:', data.task_id)

      taskToast.showSuccess({ title: t("imageGeneration.inversionMode.splitCompleted") })
    }
  }, [currentTaskId, locale, t, taskToast])

  // 处理任务失败
  const handleTaskFailed = useCallback((data: any) => {
    if (data.task_id === currentTaskId) {
      console.error('[InversionMode] Split failed:', data.error_message)
      setSplitStatus("error")
      taskToast.showFailure({
        title: t("imageGeneration.toast.generationFailed"),
      })
    }
  }, [currentTaskId, t, taskToast])

  // 轮询任务状态
  useEffect(() => {
    if (!currentTaskId) return

    const checkTaskStatus = async () => {
      try {
        const result = await imageGenerationClient.getTaskResult(currentTaskId)

        if ('error' in result) {
          console.error('[InversionMode] Failed to get task status:', result.error)
          setSplitStatus("error")
          setIsProcessing(false)
          taskToast.showFailure({
            title: t("imageGeneration.toast.generationFailed"),
          })
          return
        }

        console.info('[InversionMode] Task status check:', {
          taskId: currentTaskId,
          status: result.status
        })

        if (result.status === 'success') {
          handleTaskComplete(result)
          setCurrentTaskId(null)
          setIsProcessing(false)
        } else if (result.status === 'failed') {
          handleTaskFailed(result)
          setCurrentTaskId(null)
          setIsProcessing(false)
        }
      } catch (error) {
        console.error('[InversionMode] Error checking task status:', error)
      }
    }

    // 立即检查一次
    checkTaskStatus()

    // 开始轮询，每10秒检查一次
    pollingIntervalRef.current = setInterval(checkTaskStatus, 10000)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [currentTaskId, handleTaskComplete, handleTaskFailed, t, taskToast])

  // 组件 mount 时检查 localStorage，恢复未完成的任务
  useEffect(() => {
    const savedTask = loadTaskFromStorage(INVERSION_POLLING_CONFIG)

    if (savedTask && (savedTask.status === 'pending' || savedTask.status === 'processing')) {
      // INFO: 发现未完成的任务，等待 WebSocket 通知
      console.info('[InversionMode] Found pending task in localStorage:', {
        taskId: savedTask.task_id,
        status: savedTask.status,
      })

      setSplitStatus("splitting")
      setIsProcessing(true)
      setCurrentTaskId(savedTask.task_id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 只在 mount 时执行一次

  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploading(true)

    try {
      console.debug('[InversionMode] Uploading image to R2:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      })

      // 上传到 R2 获取 URL
      const imageUrl = await uploadImageToR2(file)

      // INFO: 图片上传成功
      console.info('[InversionMode] Image uploaded successfully:', { imageUrl })

      setUploadedImageUrl(imageUrl)
      setSelectedMaterialUrl(null)

      // 保留本地预览
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') {
          setUploadedImage(result)
          setLayerImages([])
          setSelectedLayers(new Set())
          setSplitStatus("idle")
          setCurrentGenerationLogId(null)
          setCurrentTaskId(null)

          // DEBUG: 上传完成后检查状态
          console.debug('[InversionMode] Upload complete, current state:', {
            hasImageUrl: !!imageUrl,
            imagePreviewLength: result.length,
          })
        }
      }
      reader.onerror = () => {
        console.error('[InversionMode] FileReader failed to read the image')
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('[InversionMode] Image upload failed:', error)
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
          title: t("imageGeneration.inversionMode.validation.missingImage"),
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

  const handleSelectMaterial = useCallback((materialUrl: string) => {
    setUploadedImage(null)
    setUploadedImageUrl(null)
    setSelectedMaterialUrl(materialUrl)
    setLayerImages([])
    setSelectedLayers(new Set())
    setSplitStatus("idle")
    setIsProcessing(false)
    setCurrentGenerationLogId(null)
    setCurrentTaskId(null)
  }, [])

  const handleSplit = useCallback(async () => {
    // 验证输入
    if (!baseImageUrl) {
      console.warn('[InversionMode] Split validation failed: missing image')

      toast({
        variant: "destructive",
        title: t("imageGeneration.inversionMode.validation.missingImage"),
      })
      return
    }

    if (numLayers < 1 || numLayers > 8) {
      console.warn('[InversionMode] Split validation failed: invalid numLayers')

      toast({
        variant: "destructive",
        title: t("imageGeneration.inversionMode.validation.invalidNumLayers"),
      })
      return
    }

    console.info('[InversionMode] Starting split:', {
      numLayers,
      hasPrompt: !!prompt,
    })

    setSplitStatus("splitting")
    setIsProcessing(true)
    taskToast.showSubmitting({
      title: submittingToastTitle,
      description: submittingToastDescription,
    })

    try {
      // 调用真实 API
      const result = await imageGenerationClient.createSplitTask({
        image_url: baseImageUrl,
        num_layers: numLayers,
        prompt: prompt || undefined,
        article_id: articleId ?? undefined,
      })

      if ('error' in result) {
        console.error('[InversionMode] Failed to create split task:', result.error)
        setSplitStatus("error")
        setIsProcessing(false)
        taskToast.showFailure({
          title: t("imageGeneration.toast.generationFailed"),
        })
        return
      }

      // 保存任务状态
      setCurrentTaskId(result.task_id)
      taskToast.showPolling({
        title: pollingToastTitle,
        description: pollingToastDescription,
      })
      
      // 发送事件通知主页面刷新任务列表
      window.postMessage({ type: 'TASK_CREATED', taskType: 'image' }, '*')
    } catch (error) {
      console.error('[InversionMode] Unexpected error:', error)
      setSplitStatus("error")
      setIsProcessing(false)
      taskToast.showFailure({
        title: t("imageGeneration.toast.generationFailed"),
      })
    }
  }, [articleId, baseImageUrl, numLayers, pollingToastDescription, pollingToastTitle, prompt, submittingToastDescription, submittingToastTitle, t, taskToast, toast])

  const handleToggleLayer = (layerId: string) => {
    setSelectedLayers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(layerId)) {
        newSet.delete(layerId)
      } else {
        newSet.add(layerId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedLayers.size === layerImages.length) {
      setSelectedLayers(new Set())
    } else {
      setSelectedLayers(new Set(layerImages.map(l => l.id)))
    }
  }

  const handleDownloadSelected = async () => {
    if (selectedLayers.size === 0) return

    // 下载选中的图层
    for (const layerId of selectedLayers) {
      const layer = layerImages.find(l => l.id === layerId)
      if (layer) {
        const link = document.createElement("a")
        link.href = layer.imageUrl
        link.download = `${layer.nameEn.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`
        link.click()
        // 添加延迟避免浏览器阻止多次下载
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
  }

  const handleReset = () => {
    setUploadedImage(null)
    setUploadedImageUrl(null)
    setSelectedMaterialUrl(null)
    setLayerImages([])
    setSelectedLayers(new Set())
    setSplitStatus("idle")
    setIsProcessing(false)
    setCurrentTaskId(null)
    setCurrentGenerationLogId(null)
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* 左侧：上传和预览区 */}
      <div className="w-96 border-r border-border/50 bg-muted/30 flex flex-col">
        <div className="p-4 border-b border-border/50">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {t("imageGeneration.inversionMode.upload.title")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("imageGeneration.inversionMode.upload.description")}
          </p>
        </div>

        <div className="flex-1 p-4 flex flex-col">
          {/* 上传区域 */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => {
              if (isProcessing || isUploading) return
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
              relative aspect-[4/3] rounded-2xl border-2 border-dashed transition-all duration-300
              flex flex-col items-center justify-center cursor-pointer overflow-hidden
              ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : baseImagePreview
                  ? "border-transparent"
                  : "border-border/50 hover:border-primary/50 hover:bg-muted/50"
              }
              ${(isProcessing || isUploading) ? "cursor-not-allowed opacity-60" : ""}
            `}
          >
            {baseImagePreview ? (
              <img
                src={baseImagePreview}
                alt={selectedMaterial?.title ?? "Uploaded"}
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <div className={`
                  p-4 rounded-full mb-3 transition-all duration-300
                  ${isDragging ? "bg-primary/20 scale-110" : "bg-muted"}
                `}>
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground text-center px-4">
                  {t("imageGeneration.inversionMode.upload.dropHere")}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {t("imageGeneration.inversionMode.upload.orClick")}
                </p>
              </>
            )}

            {/* 拖拽时的高亮效果 */}
            {isDragging && !baseImagePreview && (
              <div className="absolute inset-0 bg-primary/10 animate-pulse pointer-events-none" />
            )}
          </div>

          {/* 上传中状态 */}
          {isUploading && (
            <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary">
                    {t("imageGeneration.styleMode.uploading")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("imageGeneration.styleMode.uploadingHint")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 素材选择 */}
          <div className="mt-4 space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setShowMaterialSelector(true)}
              disabled={isProcessing || isUploading || !!currentTaskId}
            >
              <Layers className="h-4 w-4" />
              <span className="truncate">
                {selectedMaterial?.title
                  ? `${t("imageGeneration.properties.imageSelected")}${selectedMaterial.title}`
                  : t("aiRewrite.material.selectMaterials")}
              </span>
            </Button>
            {selectedMaterialUrl ? (
              <p className="text-xs text-muted-foreground">
                {t("imageGeneration.properties.selectImageFromMaterials")}
              </p>
            ) : null}
          </div>

          {/* 表单控件 */}
          {baseImagePreview && splitStatus === "idle" && (
            <div className="mt-4 space-y-4">
              {/* 图层数量选择器 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    {t("imageGeneration.inversionMode.numLayers.label")}
                  </label>
                  <span className="text-xs text-primary font-semibold">
                    {numLayers}
                  </span>
                </div>
                <Slider
                  value={[numLayers]}
                  onValueChange={(value) => setNumLayers(value[0])}
                  min={1}
                  max={8}
                  step={1}
                  disabled={isProcessing || isUploading}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  {t("imageGeneration.inversionMode.numLayers.description")}
                </p>
              </div>

              {/* 场景描述文本框 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t("imageGeneration.inversionMode.prompt.label")}
                  <span className="text-muted-foreground ml-1">
                    ({t("common.optional")})
                  </span>
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t("imageGeneration.inversionMode.prompt.placeholder")}
                  disabled={isProcessing || isUploading}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {t("imageGeneration.inversionMode.prompt.description")}
                </p>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          {baseImagePreview && splitStatus === "idle" && (
            <button
              onClick={handleSplit}
              disabled={isProcessing || isUploading}
              className={`
                mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                font-medium transition-all duration-200
                ${
                  (isProcessing || isUploading)
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
                }
              `}
            >
              <Split className="w-5 h-5" />
              {t("imageGeneration.inversionMode.splitImage")}
            </button>
          )}

          {/* 拆分中状态 */}
          {splitStatus === "splitting" && (
            <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 w-10 h-10 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary">
                    {t("imageGeneration.inversionMode.splitting")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("imageGeneration.styleMode.thisMayTake")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 拆分完成状态 */}
          {splitStatus === "completed" && (
            <div className="mt-4 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-full">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    {t("imageGeneration.inversionMode.splitCompleted")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("imageGeneration.inversionMode.successfullySplit", { count: layerImages.length })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 重置按钮 */}
          {baseImagePreview && (
            <button
              onClick={handleReset}
              disabled={isProcessing || isUploading}
              className={`
                mt-auto pt-4 text-sm text-muted-foreground hover:text-destructive
                transition-colors ${(isProcessing || isUploading) ? "cursor-not-allowed opacity-60" : ""}
              `}
            >
              {t("imageGeneration.inversionMode.reupload")}
            </button>
          )}
        </div>

        {/* 底部提示 */}
        <div className="p-4 border-t border-border/50 bg-background/50">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5">
            <Layers className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              {t("imageGeneration.inversionMode.hint")}
            </p>
          </div>
        </div>
      </div>

      {/* 右侧：图层列表区 */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
        {/* 头部 */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {t("imageGeneration.inversionMode.splitResults")}
              </span>
              {layerImages.length > 0 && (
                <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                  {t("imageGeneration.inversionMode.layersCount", { count: layerImages.length })}
                </span>
              )}
            </div>

            {/* 批量操作按钮 */}
            {layerImages.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  {selectedLayers.size === layerImages.length
                    ? t("imageGeneration.inversionMode.deselectAll")
                    : t("imageGeneration.inversionMode.selectAll")
                  }
                </button>
                {selectedLayers.size > 0 && (
                  <button
                    onClick={handleDownloadSelected}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {t("imageGeneration.inversionMode.downloadSelected")}
                    {selectedLayers.size > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-primary-foreground/20 rounded-full">
                        {selectedLayers.size}
                      </span>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 图层列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          {layerImages.length === 0 ? (
            /* 空状态 */
            <div className="h-full flex flex-col items-center justify-center">
              <div className="p-6 rounded-full bg-muted/50 mb-4">
                <Layers className="w-16 h-16 text-muted-foreground/40" />
              </div>
              <p className="text-lg font-medium text-muted-foreground mb-2">
                {t("imageGeneration.inversionMode.waiting")}
              </p>
              <p className="text-sm text-muted-foreground/60 text-center max-w-md">
                {t("imageGeneration.inversionMode.waitingHint")}
              </p>
            </div>
          ) : (
            /* 图层网格 */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {layerImages.map((layer, index) => {
                const isSelected = selectedLayers.has(layer.id)
                return (
                  <div
                    key={layer.id}
                    onClick={() => handleToggleLayer(layer.id)}
                    className={`
                      relative group rounded-xl overflow-hidden cursor-pointer
                      transition-all duration-300 border-2
                      ${
                        isSelected
                          ? "border-primary shadow-lg scale-[1.02]"
                          : "border-border/50 hover:border-primary/50 hover:shadow-md"
                      }
                    `}
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    {/* 图层图片 */}
                    <div className="aspect-square bg-muted">
                      <img
                        src={layer.imageUrl}
                        alt={layer.name}
                        className="w-full h-full object-cover"
                      />
                      {/* 覆盖层 */}
                      <div className={`
                        absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300
                        ${isSelected ? "bg-primary/10" : ""}
                      `} />
                    </div>

                    {/* 图层信息 */}
                    <div className="p-3 bg-background/95 backdrop-blur-sm border-t border-border/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-primary">
                              #{layer.index + 1}
                            </span>
                            <h4 className="text-sm font-semibold text-foreground truncate">
                              {layer.name}
                            </h4>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {layer.description}
                          </p>
                        </div>

                        {/* 选择指示器 */}
                        <div className={`
                          w-5 h-5 rounded-full border-2 flex items-center justify-center
                          transition-all duration-200 ml-2 flex-shrink-0
                          ${
                            isSelected
                              ? "border-primary bg-primary"
                              : "border-border group-hover:border-primary/50"
                          }
                        `}>
                          {isSelected && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 选中标记 */}
                    {isSelected && (
                      <div className="absolute top-3 left-3">
                        <div className="px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                          {t("imageGeneration.styleMode.selected")}
                        </div>
                      </div>
                    )}

                    {/* 悬浮时显示预览按钮 */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // 可以添加预览功能
                        }}
                        className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-black/70 transition-colors"
                      >
                        <Layers className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 底部统计栏 */}
        {layerImages.length > 0 && (
          <div className="p-4 border-t border-border/50 bg-background/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t("imageGeneration.styleMode.selected")}:{" "}
                <span className="font-semibold text-foreground">{selectedLayers.size}</span> / {layerImages.length}
              </span>
              {selectedLayers.size > 0 && (
                <button
                  onClick={handleDownloadSelected}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  {t("imageGeneration.inversionMode.downloadSelected")}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <MaterialSelectorDialog
        open={showMaterialSelector}
        onOpenChange={setShowMaterialSelector}
        title={t("aiRewrite.material.selectMaterials")}
        materials={materials
          .filter((material) => material.material_type === "image" && material.content)
          .map((material) => ({
            id: material.id,
            title: material.title,
            source_url: material.content!,
          }))}
        isLoading={materialsLoading}
        hasMore={hasMoreMaterials}
        onLoadMore={loadMoreMaterials}
        observerTarget={materialsObserverTarget}
        onSelect={handleSelectMaterial}
        currentUrl={selectedMaterialUrl ?? undefined}
      />
    </div>
  )
}
