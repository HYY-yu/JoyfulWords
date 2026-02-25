"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ImageIcon } from "lucide-react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import type { Layer, ToolType, EnvironmentSettings, RenderSettings, LayerProps, TabValue } from "./types"
import { ModeTabs } from "./mode-tabs"
import { Toolbar } from "./toolbar"
import { Canvas } from "./canvas"
import { PropertiesPanel } from "./properties-panel"
import { StyleMode } from "./style-mode"
import { InversionMode } from "./inversion-mode"

const TAB_STORAGE_KEY = 'joyfulwords-image-generation-tab'

export function ImageGeneration() {
  const { t } = useTranslation()

  const [selectedTool, setSelectedTool] = useState<ToolType>("select")
  const [selectedLayer, setSelectedLayer] = useState<Layer | null>(null)
  const [layers, setLayers] = useState<Layer[]>([])
  const [activeTab, setActiveTab] = useState<TabValue>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TAB_STORAGE_KEY) as TabValue || "creation"
    }
    return "creation"
  })

  // 基础环境参数
  const [envSettings, setEnvSettings] = useState<EnvironmentSettings>({
    width: 1024,
    height: 1024,
    style: "realistic",
    lighting: "natural",
  })

  // 渲染控制参数
  const [renderSettings, setRenderSettings] = useState<RenderSettings>({
    steps: 15,
  })

  // 选中图层属性
  const [layerProps, setLayerProps] = useState<LayerProps>({
    label: "",
    description: "",
    zIndex: 0,
  })

  const handleToolClick = (tool: ToolType) => {
    setSelectedTool(tool)
    if (tool === "delete" && selectedLayer) {
      setLayers(layers.filter((l) => l.id !== selectedLayer.id))
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
        label: `图层 ${layers.length + 1}`,
        description: "",
        zIndex: layers.length,
      }

      setLayers([...layers, newLayer])
      setSelectedLayer(newLayer)
      setLayerProps({
        label: newLayer.label,
        description: "",
        zIndex: newLayer.zIndex,
      })
      setSelectedTool("select")
    }
  }

  const handleLayerClick = (e: React.MouseEvent, layer: Layer) => {
    e.stopPropagation()
    if (selectedTool === "select") {
      setSelectedLayer(layer)
      setLayerProps({
        label: layer.label,
        description: layer.description,
        zIndex: layer.zIndex,
      })
    }
  }

  const handleLayerPropsChange = (props: LayerProps) => {
    setLayerProps(props)
    if (selectedLayer) {
      setLayers(
        layers.map((l) =>
          l.id === selectedLayer.id
            ? { ...l, label: props.label, description: props.description, zIndex: props.zIndex }
            : l
        )
      )
    }
  }

  const handleGenerateJson = () => {
    console.log("生成 JSON:", { layers, envSettings, renderSettings })
  }

  const handleGenerateImage = () => {
    console.log("生成图片:", { layers, envSettings, renderSettings })
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
            onCanvasClick={handleCanvasClick}
            onLayerClick={handleLayerClick}
            onGenerateJson={handleGenerateJson}
            onGenerateImage={handleGenerateImage}
          />

          {/* Right Column - Properties Panel */}
          <PropertiesPanel
            selectedLayer={selectedLayer}
            envSettings={envSettings}
            renderSettings={renderSettings}
            layerProps={layerProps}
            onEnvSettingsChange={setEnvSettings}
            onRenderSettingsChange={setRenderSettings}
            onLayerPropsChange={handleLayerPropsChange}
          />
        </div>
      )}
    </main>
  )
}
