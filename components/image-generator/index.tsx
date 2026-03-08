"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ImageIcon } from "lucide-react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useToast } from "@/hooks/use-toast"
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
        reference_image: undefined,
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
            ? { ...l, description: props.description, zIndex: props.z_index }
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
      reference_image: layerProps.reference_image,
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

  const handleGenerateImageFromPrompt = (prompt: string) => {
    console.log("使用专业提示词生成图片:", prompt)
    // TODO: 调用后端 API 生成图片
  }

  const handleGenerateImage = () => {
    const creatorConfig = buildCreatorConfig()
    console.log("生成图片:", creatorConfig)
    // TODO: 调用后端 API 生成图片
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
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column - Toolbar */}
          <Toolbar selectedTool={selectedTool} onToolSelect={handleToolClick} />

          {/* Center Column - Canvas */}
          <Canvas
            layers={layers}
            selectedTool={selectedTool}
            selectedLayer={selectedLayer}
            metaSettings={metaSettings}
            onCanvasClick={handleCanvasClick}
            onLayerClick={handleLayerClick}
            onLayerPositionChange={handleLayerPositionChange}
            onLayerSizeChange={handleLayerSizeChange}
            onDeleteLayer={handleDeleteLayer}
            onGenerateJson={handleGenerateJson}
            onGenerateImage={handleGenerateImage}
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
