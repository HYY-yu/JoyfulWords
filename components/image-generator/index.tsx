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
import { ModeTabs } from "./mode-tabs"
import { Toolbar } from "./toolbar"
import { Canvas } from "./canvas"
import { PropertiesPanel } from "./properties-panel"
import { StyleMode } from "./style-mode"
import { InversionMode } from "./inversion-mode"
import { JsonPreviewDialog } from "./json-preview-dialog"
import { GenerationLoadingOverlay } from "./generation-loading-overlay"

const TAB_STORAGE_KEY = 'joyfulwords-image-generation-tab'

export function ImageGeneration() {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [selectedTool, setSelectedTool] = useState<ToolType>("select")
  const [selectedLayer, setSelectedLayer] = useState<Layer | null>(null)
  const [layers, setLayers] = useState<Layer[]>([])
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
  }, []) // 只在 mount 时执行一次

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

  const handleSaveImageToMaterials = () => {
    // TODO: 后期实现保存到素材功能
    toast({
      title: t("imageGeneration.toast.comingSoon"),
      description: t("imageGeneration.toast.saveToMaterialsComingSoon"),
    })
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
      ) : (
        /* Main Content - Three Columns */
        <div className="flex-1 flex overflow-hidden relative">
          {/* Loading 蒙版 - 仅在生成时显示 */}
          {isGenerating && (
            <GenerationLoadingOverlay message={generatingMessage} />
          )}

          {/* Left Column - Toolbar */}
          <Toolbar selectedTool={selectedTool} onToolSelect={handleToolClick} />

          {/* Center Column - Canvas */}
          <Canvas
            layers={layers}
            selectedTool={selectedTool}
            selectedLayer={selectedLayer}
            metaSettings={metaSettings}
            generatedImageUrl={generatedImageUrl}
            showGeneratedImage={showGeneratedImage}
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
            onMetaSettingsChange={setMetaSettings}
            onGlobalStyleSettingsChange={setGlobalStyleSettings}
            onCompositionSettingsChange={setCompositionSettings}
            onLayerPropsChange={handleLayerPropsChange}
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
    </main>
  )
}
