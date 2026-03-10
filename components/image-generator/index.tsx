"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ImageIcon } from "lucide-react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useToast } from "@/hooks/use-toast"
import { imageGenerationClient } from "@/lib/api/image-generation/client"
import { useImageGenerationPolling, loadTaskFromStorage, clearTaskFromStorage } from "@/hooks/use-image-generation-polling"
import { DEFAULT_POLLING_CONFIG } from "@/lib/api/image-generation/types"
import type {
  Layer,
  ToolType,
  MetaSettings,
  GlobalStyleSettings,
  CompositionSettings,
  LayerProps,
  TabValue,
  CreatorConfig,
} from "./types"
import { ModeTabs } from "./ui/mode-tabs"
import { Toolbar } from "./ui/toolbar"
import { Canvas } from "./ui/canvas"
import { PropertiesPanel } from "./ui/properties-panel"
import { StyleMode } from "./modes/style-mode"
import { InversionMode } from "./modes/inversion-mode"
import { GenerationLogs } from "./generation/generation-logs"
import { JsonPreviewDialog } from "./dialogs/json-preview-dialog"
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

const TAB_STORAGE_KEY = 'joyfulwords-image-generation-tab'

export function ImageGeneration() {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [selectedTool, setSelectedTool] = useState<ToolType>("select")
  const [selectedLayer, setSelectedLayer] = useState<Layer | null>(null)
  const [layers, setLayers] = useState<Layer[]>([])
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<TabValue>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TAB_STORAGE_KEY) as TabValue || "creation"
    }
    return "creation"
  })
  const [showJsonPreview, setShowJsonPreview] = useState(false)

  // 图片生成相关状态
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingMessage, setGeneratingMessage] = useState("")
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [showGeneratedImage, setShowGeneratedImage] = useState(true)
  const [currentGenerationLogId, setCurrentGenerationLogId] = useState<number | null>(null)

  // 新增: 模型相关状态
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [isLoadingModels, setIsLoadingModels] = useState(true)
  const [modelsLoadError, setModelsLoadError] = useState<string | null>(null)

  // 轮询 Hook
  const { startPolling, stopPolling, isPolling } = useImageGenerationPolling({
    onSuccess: (result) => {
      // INFO: 任务完成 - 轮询成功
      console.info('[ImageGeneration] Task completed successfully:', {
        taskId: result.task_id,
        imageUrl: result.image_url,
      })

      // 解析 image_url（可能是 JSON 数组字符串或直接是字符串）
      let imageUrl: string
      try {
        if (typeof result.image_url === 'string' && result.image_url.startsWith('[')) {
          // JSON 数组字符串，解析并取第一个元素
          const urls = JSON.parse(result.image_url) as string[]
          imageUrl = urls[0]
          console.debug('[ImageGeneration] Parsed image_url from JSON array:', imageUrl)
        } else if (Array.isArray(result.image_url)) {
          // 已经是数组，取第一个元素
          imageUrl = result.image_url[0]
          console.debug('[ImageGeneration] Extracted first URL from array:', imageUrl)
        } else {
          // 直接是字符串
          imageUrl = result.image_url
        }
      } catch (error) {
        // ERROR: 解析失败，回退到原始值
        console.error('[ImageGeneration] Failed to parse image_url:', error)
        imageUrl = String(result.image_url)
      }

      setIsGenerating(false)
      setGeneratingMessage("")
      setCurrentTaskId(null)
      setGeneratedImageUrl(imageUrl)
      setShowGeneratedImage(true)

      // 保存生成记录ID
      setCurrentGenerationLogId(result.task_id)
      console.info('[ImageGeneration] Saved generation log ID:', result.task_id)

      toast({
        title: t("imageGeneration.toast.generationSuccess"),
        description: t("imageGeneration.generating.description"),
      })
    },
    onError: (error) => {
      // ERROR: 任务失败 - 显示错误提示
      console.error('[ImageGeneration] Task failed:', {
        error: error.message,
      })

      setIsGenerating(false)
      setGeneratingMessage("")
      setCurrentTaskId(null)

      toast({
        variant: "destructive",
        title: t("imageGeneration.toast.generationFailed"),
        description: error.message,
      })
    },
    onTimeout: () => {
      // ERROR: 任务超时 - 显示超时提示
      console.error('[ImageGeneration] Task timeout')

      setIsGenerating(false)
      setGeneratingMessage("")
      setCurrentTaskId(null)

      toast({
        variant: "destructive",
        title: t("imageGeneration.toast.timeout"),
      })
    },
    onProgress: (result) => {
      // DEBUG: 任务进度 - 更新进度消息
      if (result.status === 'processing') {
        setGeneratingMessage(
          t("imageGeneration.generating.processing", {
            eta: Math.ceil(Math.random() * 30 + 10), // 模拟 ETA
          })
        )
      }
    },
  })

  // 组件 mount 时检查 localStorage，恢复未完成的任务
  useEffect(() => {
    const savedTask = loadTaskFromStorage(DEFAULT_POLLING_CONFIG)

    if (savedTask && (savedTask.status === 'pending' || savedTask.status === 'processing')) {
      // INFO: 恢复轮询 - 发现未完成的任务
      console.info('[ImageGeneration] Resuming polling from localStorage:', {
        taskId: savedTask.task_id,
        status: savedTask.status,
        hasPrompt: !!savedTask.prompt,
        hasConfig: !!savedTask.config,
      })

      setIsGenerating(true)
      setGeneratingMessage(t("imageGeneration.generating.resuming"))
      setCurrentTaskId(savedTask.task_id)

      // 启动轮询（不带 storage 参数，因为已经从 localStorage 加载了）
      startPolling(savedTask.task_id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 只在 mount 时执行一次

  // 组件 mount 时获取可用模型列表
  useEffect(() => {
    const fetchModels = async () => {
      console.debug('[ImageGeneration] Fetching available models...')
      setIsLoadingModels(true)
      setModelsLoadError(null)

      try {
        const result = await imageGenerationClient.getModels()

        if ('error' in result) {
          console.error('[ImageGeneration] Failed to fetch models:', result.error)
          setModelsLoadError(result.error)
          toast({
            variant: "destructive",
            title: t("imageGeneration.model.fetchFailed"),
            description: result.error,
          })
          return
        }

        console.info('[ImageGeneration] Models fetched successfully:', {
          provider: result.provider,
          modelCount: result.models.length,
        })

        setAvailableModels(result.models)
        // 默认选中第一个模型
        if (result.models.length > 0) {
          setSelectedModel(result.models[0])
          console.debug('[ImageGeneration] Default model selected:', result.models[0])
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('[ImageGeneration] Unexpected error fetching models:', errorMessage)
        setModelsLoadError(errorMessage)
        toast({
          variant: "destructive",
          title: t("imageGeneration.model.fetchFailed"),
          description: errorMessage,
        })
      } finally {
        setIsLoadingModels(false)
      }
    }

    fetchModels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])  // 只在 mount 时执行一次

  // 元数据参数
  const [metaSettings, setMetaSettings] = useState<MetaSettings>({
    width: 1024,
    high: 1024,
    seed: -1,
  })

  // 全局样式参数
  const [globalStyleSettings, setGlobalStyleSettings] = useState<GlobalStyleSettings>({
    medium: "Photography",
    style: "Renaissance",
    color_accent: "Cinematic Teal & Orange",
  })

  // 构图参数
  const [compositionSettings, setCompositionSettings] = useState<CompositionSettings>({
    camera: {
      angle: "Eye Level",
      focal_length: "50mm",
      depth_of_field: "Deep",
    },
    lighting: {
      type: "Natural Light",
      source: "Front",
      intensity: 0.8,
    },
  })

  // 选中图层属性
  const [layerProps, setLayerProps] = useState<LayerProps>({
    description: "",
    reference_image: undefined,
    z_index: 0,
  })

  const handleToolClick = (tool: ToolType) => {
    setSelectedTool(tool)
  }

  const handleDeleteLayer = (layerId: string) => {
    setLayers(layers.filter((l) => l.id !== layerId))
    if (selectedLayer?.id === layerId) {
      setSelectedLayer(null)
    }
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool === "rectangle") {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const newLayer: Layer = {
        id: Date.now().toString(),
        type: "rectangle",
        x: x - 50,
        y: y - 50,
        width: 100,
        height: 100,
        label: t("imageGeneration.canvas.layerLabel", { number: layers.length + 1 }),
        description: "",
        reference_image: undefined,
        zIndex: layers.length,
      }

      setLayers([...layers, newLayer])
      setSelectedLayer(newLayer)
      setLayerProps({
        description: "",
        reference_image: undefined,
        z_index: newLayer.zIndex,
      })
      setSelectedTool("select")
    }
  }

  const handleLayerClick = (e: React.MouseEvent, layer: Layer) => {
    e.stopPropagation()
    if (selectedTool === "delete") {
      // 删除模式下点击图层直接删除
      handleDeleteLayer(layer.id)
    } else if (selectedTool === "select") {
      // 选择模式下选中图层
      setSelectedLayer(layer)
      setLayerProps({
        description: layer.description,
        reference_image: layer.reference_image,
        z_index: layer.zIndex,
      })
    }
  }

  const handleLayerPropsChange = (props: LayerProps) => {
    setLayerProps(props)
    if (selectedLayer) {
      setLayers(
        layers.map((l) =>
          l.id === selectedLayer.id
            ? { ...l, description: props.description, reference_image: props.reference_image, zIndex: props.z_index }
            : l
        )
      )
    }
  }

  const handleLayerPositionChange = (layerId: string, x: number, y: number) => {
    setLayers(
      layers.map((l) =>
        l.id === layerId ? { ...l, x, y } : l
      )
    )
  }

  const handleLayerSizeChange = (layerId: string, x: number, y: number, width: number, height: number) => {
    setLayers(
      layers.map((l) =>
        l.id === layerId ? { ...l, x, y, width, height } : l
      )
    )
  }

  const handleGenerateJson = () => {
    // 验证所有图层是否都有描述
    const layersWithoutDescription = layers.filter(layer => !layer.description || layer.description.trim() === "")

    if (layersWithoutDescription.length > 0) {
      toast({
        variant: "destructive",
        title: t("imageGeneration.validation.missingDescription"),
        description: t("imageGeneration.validation.missingDescriptionDesc", {
          count: layersWithoutDescription.length,
        }),
      })
      return
    }

    setShowJsonPreview(true)
  }

  const buildCreatorConfig = (): CreatorConfig => {
    // 将 layers 转换为 CreatorLayer 格式
    const creatorLayers = layers.map((layer) => ({
      id: layer.id,
      description: layer.description,
      reference_image: layer.reference_image,  // 使用图层自己的 reference_image
      spatial_layout: {
        box_2d: [layer.x, layer.y, layer.width, layer.height] as [number, number, number, number],
        z_index: layer.zIndex,
      },
    }))

    // 构建 CreatorConfig 对象
    const creatorConfig: CreatorConfig = {
      version: "1.0",
      meta: {
        width: metaSettings.width,
        high: metaSettings.high,
        seed: metaSettings.seed,
      },
      global_style: {
        medium: globalStyleSettings.medium,
        style: globalStyleSettings.style,
        color_accent: globalStyleSettings.color_accent,
      },
      composition: {
        camera: {
          angle: compositionSettings.camera.angle,
          focal_length: compositionSettings.camera.focal_length,
          depth_of_field: compositionSettings.camera.depth_of_field,
        },
        lighting: {
          type: compositionSettings.lighting.type,
          source: compositionSettings.lighting.source,
          intensity: compositionSettings.lighting.intensity,
        },
      },
      layers: creatorLayers,
    }

    console.log("生成的 Creator JSON:", JSON.stringify(creatorConfig, null, 2))
    return creatorConfig
  }

  const handleGenerateImageFromPrompt = async (prompt: string) => {
    // TRACE: 生成入口 - 使用专业提示词生成图片
    console.debug('[ImageGeneration] Generating image from prompt:', {
      promptLength: prompt.length,
    })

    try {
      // 设置生成状态
      setIsGenerating(true)
      setGeneratingMessage(t("imageGeneration.generating.initiating"))

      // 调用 API 创建生成任务
      const result = await imageGenerationClient.createGenerationTask({
        gen_mode: 'creator', // 创作模式
        prompt,
        model_name: selectedModel,  // 新增
      })

      if ('error' in result) {
        // ERROR: 任务创建失败
        console.error('[ImageGeneration] Failed to create task:', result.error)
        setIsGenerating(false)
        setGeneratingMessage("")

        toast({
          variant: "destructive",
          title: t("imageGeneration.toast.taskCreateFailed"),
          description: result.error,
        })
        return
      }

      // INFO: 任务创建成功
      console.info('[ImageGeneration] Task created successfully:', {
        taskId: result.task_id,
        estimatedEta: result.estimated_eta,
      })

      toast({
        title: t("imageGeneration.toast.taskCreated"),
        description: t("imageGeneration.generating.started"),
      })

      // 保存任务状态并开始轮询
      setCurrentTaskId(result.task_id)
      await startPolling(result.task_id, {
        status: result.status,
        prompt,
        estimated_eta: result.estimated_eta,
      })
    } catch (error) {
      // ERROR: 网络错误或意外错误
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[ImageGeneration] Unexpected error during generation:', {
        error: errorMessage,
      })

      setIsGenerating(false)
      setGeneratingMessage("")

      toast({
        variant: "destructive",
        title: t("imageGeneration.toast.generationFailed"),
        description: errorMessage,
      })
    }
  }

  const handleGenerateImage = async () => {
    const creatorConfig = buildCreatorConfig()

    // TRACE: 生成入口 - 使用 CreatorConfig 生成图片（页面按钮）
    console.info('[ImageGeneration] Generating image from config:', {
      layerCount: creatorConfig.layers.length,
      width: creatorConfig.meta.width,
      height: creatorConfig.meta.high,
    })

    try {
      // 设置生成状态
      setIsGenerating(true)
      setGeneratingMessage(t("imageGeneration.generating.initiating"))

      // INFO: 直接使用 config 创建生成任务（API 支持直接传 config）
      console.debug('[ImageGeneration] Creating task with config...')
      const result = await imageGenerationClient.createGenerationTask({
        gen_mode: 'creator', // 创作模式
        config: creatorConfig,
        model_name: selectedModel,  // 新增
      })

      if ('error' in result) {
        // ERROR: 任务创建失败
        console.error('[ImageGeneration] Failed to create task:', result.error)
        setIsGenerating(false)
        setGeneratingMessage("")

        toast({
          variant: "destructive",
          title: t("imageGeneration.toast.taskCreateFailed"),
          description: result.error as string,
        })
        return
      }

      // INFO: 任务创建成功
      console.info('[ImageGeneration] Task created successfully:', {
        taskId: result.task_id,
        estimatedEta: result.estimated_eta,
      })

      toast({
        title: t("imageGeneration.toast.taskCreated"),
        description: t("imageGeneration.generating.started"),
      })

      // 保存任务状态并开始轮询
      setCurrentTaskId(result.task_id)
      await startPolling(result.task_id, {
        status: result.status,
        config: creatorConfig,
        estimated_eta: result.estimated_eta,
      })
    } catch (error) {
      // ERROR: 网络错误或意外错误
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[ImageGeneration] Unexpected error during generation:', {
        error: errorMessage,
      })

      setIsGenerating(false)
      setGeneratingMessage("")

      toast({
        variant: "destructive",
        title: t("imageGeneration.toast.generationFailed"),
        description: errorMessage,
      })
    }
  }

  const handleToggleImageVisibility = () => {
    setShowGeneratedImage(prev => !prev)
  }

  const handleSaveImageToMaterials = async () => {
    if (!currentGenerationLogId) {
      console.error('[ImageGeneration] No generation log ID available')
      toast({
        variant: "destructive",
        title: t("imageGeneration.toast.copyToMaterialsFailed"),
        description: t("imageGeneration.toast.error.logNotFound"),
      })
      return
    }

    console.info('[ImageGeneration] Copying to materials:', { logId: currentGenerationLogId })

    try {
      const result = await imageGenerationClient.copyToMaterials(currentGenerationLogId)

      if ('error' in result) {
        console.error('[ImageGeneration] Copy to materials failed:', result.error)

        let errorKey = "serverError"
        if (result.error.includes("not found")) errorKey = "logNotFound"
        else if (result.error.includes("not completed")) errorKey = "notCompleted"
        else if (result.error.includes("no images")) errorKey = "noImages"
        else if (result.error.includes("unauthorized")) errorKey = "unauthorized"

        toast({
          variant: "destructive",
          title: t("imageGeneration.toast.copyToMaterialsFailed"),
          description: t(`imageGeneration.toast.error.${errorKey}`),
        })
        return
      }

      console.info('[ImageGeneration] Copy to materials success:', {
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
      console.error('[ImageGeneration] Unexpected error:', { error: errorMessage })

      toast({
        variant: "destructive",
        title: t("imageGeneration.toast.copyToMaterialsFailed"),
        description: t("imageGeneration.toast.error.serverError"),
      })
    }
  }

  const handleResetClick = () => {
    setShowResetDialog(true)
  }

  const handleResetConfirm = () => {
    // 重置所有状态到初始值
    setSelectedTool("select")
    setSelectedLayer(null)
    setLayers([])
    setGeneratedImageUrl(null)
    setShowGeneratedImage(true)
    setShowResetDialog(false)

    // 重置元数据
    setMetaSettings({
      width: 1024,
      high: 1024,
      seed: -1,
    })

    // 重置全局样式
    setGlobalStyleSettings({
      medium: "Photography",
      style: "Renaissance",
      color_accent: "Cinematic Teal & Orange",
    })

    // 重置构图参数
    setCompositionSettings({
      camera: {
        angle: "Eye Level",
        focal_length: "50mm",
        depth_of_field: "Deep",
      },
      lighting: {
        type: "Natural Light",
        source: "Front",
        intensity: 0.8,
      },
    })

    // 重置选中图层属性
    setLayerProps({
      description: "",
      reference_image: undefined,
      z_index: 0,
    })

    toast({
      title: t("imageGeneration.reset.success"),
    })
  }

  const handleResetCancel = () => {
    setShowResetDialog(false)
  }

  return (
    <main className="flex-1 overflow-auto flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ImageIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">{t("imageGeneration.title")}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{t("imageGeneration.subtitle")}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Mode Tabs */}
      <ModeTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      {activeTab === "style" ? (
        <StyleMode />
      ) : activeTab === "inversion" ? (
        <InversionMode />
      ) : activeTab === "history" ? (
        <div className="flex-1 p-8 overflow-hidden flex flex-col">
          <GenerationLogs />
        </div>
      ) : (
        /* Main Content - Three Columns */
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Column - Toolbar */}
          <Toolbar selectedTool={selectedTool} onToolSelect={handleToolClick} onReset={handleResetClick} />

          {/* Center Column - Canvas */}
          <Canvas
            layers={layers}
            selectedTool={selectedTool}
            selectedLayer={selectedLayer}
            metaSettings={metaSettings}
            generatedImageUrl={generatedImageUrl}
            showGeneratedImage={showGeneratedImage}
            isGenerating={isGenerating}
            generatingMessage={generatingMessage}
            onCanvasClick={handleCanvasClick}
            onLayerClick={handleLayerClick}
            onLayerPositionChange={handleLayerPositionChange}
            onLayerSizeChange={handleLayerSizeChange}
            onDeleteLayer={handleDeleteLayer}
            onGenerateJson={handleGenerateJson}
            onGenerateImage={handleGenerateImage}
            onToggleImageVisibility={handleToggleImageVisibility}
            onSaveImageToMaterials={handleSaveImageToMaterials}
          />

          {/* Right Column - Properties Panel */}
          <PropertiesPanel
            selectedLayer={selectedLayer}
            metaSettings={metaSettings}
            globalStyleSettings={globalStyleSettings}
            compositionSettings={compositionSettings}
            layerProps={layerProps}
            // 新增 props
            selectedModel={selectedModel}
            availableModels={availableModels}
            isLoadingModels={isLoadingModels}
            onMetaSettingsChange={setMetaSettings}
            onGlobalStyleSettingsChange={setGlobalStyleSettings}
            onCompositionSettingsChange={setCompositionSettings}
            onLayerPropsChange={handleLayerPropsChange}
            // 新增回调
            onModelChange={setSelectedModel}
          />
        </div>
      )}

      {/* JSON 预览弹框 */}
      <JsonPreviewDialog
        open={showJsonPreview}
        onOpenChange={setShowJsonPreview}
        config={buildCreatorConfig()}
        onGenerateImage={handleGenerateImageFromPrompt}
      />

      {/* 重置确认对话框 */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("imageGeneration.reset.dialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("imageGeneration.reset.dialogDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleResetCancel}>
              {t("imageGeneration.reset.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleResetConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("imageGeneration.reset.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
