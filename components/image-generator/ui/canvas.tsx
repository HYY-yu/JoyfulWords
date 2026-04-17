"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useCallback, useEffect } from "react"
import type { Layer, ToolType, ResizeHandle } from "../types"
import type { MetaSettings } from "../types"
import { Code, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/base/button"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/i18n-context"

interface CanvasProps {
  layers: Layer[]
  selectedTool: ToolType
  selectedLayer: Layer | null
  metaSettings: MetaSettings
  generatedImageUrl: string | null
  showGeneratedImage: boolean
  isGenerating: boolean
  generatingMessage: string
  onCanvasClick: (x: number, y: number) => void
  onLayerClick: (e: React.MouseEvent, layer: Layer) => void
  onLayerPositionChange: (layerId: string, x: number, y: number) => void
  onLayerSizeChange: (layerId: string, x: number, y: number, width: number, height: number) => void
  onDeleteLayer: (layerId: string) => void
  onGenerateJson: () => void
  onGenerateImage: () => void
  onToggleImageVisibility: () => void
  onSaveImageToMaterials: () => void
}

export function Canvas({
  layers,
  selectedTool,
  selectedLayer,
  metaSettings,
  generatedImageUrl,
  showGeneratedImage,
  isGenerating,
  generatingMessage,
  onCanvasClick,
  onLayerClick,
  onLayerPositionChange,
  onLayerSizeChange,
  onDeleteLayer,
  onGenerateJson,
  onGenerateImage,
  onToggleImageVisibility,
  onSaveImageToMaterials,
}: CanvasProps) {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null)
  const [initialResize, setInitialResize] = useState({
    x: 0, y: 0, width: 0, height: 0, mouseX: 0, mouseY: 0
  })
  const dragLayerRef = useRef<Layer | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [showImageMenu, setShowImageMenu] = useState(false)
  const imageMenuRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const pendingUpdateRef = useRef<(() => void) | null>(null)

  const scheduleCanvasUpdate = useCallback((update: () => void) => {
    pendingUpdateRef.current = update

    if (animationFrameRef.current !== null) {
      return
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null
      const nextUpdate = pendingUpdateRef.current
      pendingUpdateRef.current = null
      nextUpdate?.()
    })
  }, [])

  const getToolHint = () => {
    if (selectedTool === "select") return t("imageGeneration.canvas.toolHints.select")
    if (selectedTool === "rectangle") return t("imageGeneration.canvas.toolHints.rectangle")
    if (selectedTool === "delete") return t("imageGeneration.canvas.toolHints.delete")
    return ""
  }

  // 开始拖动
  const handleMouseDown = useCallback((e: React.MouseEvent, layer: Layer) => {
    if (selectedTool !== "select") return

    e.stopPropagation()
    setIsDragging(true)
    dragLayerRef.current = layer

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const canvasRect = canvasRef.current?.getBoundingClientRect()
    const s = canvasRect && canvasRect.width > 0 ? canvasRect.width / metaSettings.width : 1
    setDragOffset({
      x: (e.clientX - rect.left) / s,
      y: (e.clientY - rect.top) / s,
    })
  }, [selectedTool, metaSettings.width])

  // 开始调整大小
  const handleResizeStart = useCallback((e: React.MouseEvent, layer: Layer, handle: ResizeHandle) => {
    if (selectedTool !== "select") return

    e.stopPropagation()
    e.preventDefault() // 防止触发其他事件
    setIsResizing(true)
    setResizeHandle(handle)
    dragLayerRef.current = layer

    setInitialResize({
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height,
      mouseX: e.clientX,
      mouseY: e.clientY,
    })
  }, [selectedTool])

  // 处理鼠标移动
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing && dragLayerRef.current && resizeHandle) {
      // 调整大小逻辑
      const layer = dragLayerRef.current
      const canvasElRect = canvasRef.current?.getBoundingClientRect()
      const s = canvasElRect && canvasElRect.width > 0 ? canvasElRect.width / metaSettings.width : 1
      const deltaX = (e.clientX - initialResize.mouseX) / s
      const deltaY = (e.clientY - initialResize.mouseY) / s

      let newX = initialResize.x
      let newY = initialResize.y
      let newWidth = initialResize.width
      let newHeight = initialResize.height

      // 根据手柄位置调整
      if (resizeHandle.includes("e")) {
        newWidth = Math.max(20, initialResize.width + deltaX)
      }
      if (resizeHandle.includes("w")) {
        newWidth = Math.max(20, initialResize.width - deltaX)
        newX = initialResize.x + deltaX
      }
      if (resizeHandle.includes("s")) {
        newHeight = Math.max(20, initialResize.height + deltaY)
      }
      if (resizeHandle.includes("n")) {
        newHeight = Math.max(20, initialResize.height - deltaY)
        newY = initialResize.y + deltaY
      }

      // 确保不超出画布边界
      newX = Math.max(0, newX)
      newY = Math.max(0, newY)
      if (newX + newWidth > metaSettings.width) {
        newWidth = metaSettings.width - newX
      }
      if (newY + newHeight > metaSettings.high) {
        newHeight = metaSettings.high - newY
      }

      scheduleCanvasUpdate(() => onLayerSizeChange(layer.id, newX, newY, newWidth, newHeight))
    } else if (isDragging && !isResizing && dragLayerRef.current) {
      // 拖动移动逻辑
      const canvas = canvasRef.current
      if (!canvas) return

      const canvasRect = canvas.getBoundingClientRect()
      const s = canvasRect.width > 0 ? canvasRect.width / metaSettings.width : 1
      const newX = (e.clientX - canvasRect.left) / s - dragOffset.x
      const newY = (e.clientY - canvasRect.top) / s - dragOffset.y

      // 确保不拖出画布边界
      const layer = dragLayerRef.current
      const clampedX = Math.max(0, Math.min(newX, metaSettings.width - layer.width))
      const clampedY = Math.max(0, Math.min(newY, metaSettings.high - layer.height))

      scheduleCanvasUpdate(() => onLayerPositionChange(layer.id, clampedX, clampedY))
    }
  }, [
    dragOffset,
    initialResize,
    isDragging,
    isResizing,
    metaSettings,
    onLayerPositionChange,
    onLayerSizeChange,
    resizeHandle,
    scheduleCanvasUpdate,
  ])

  // 结束拖动
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)
    dragLayerRef.current = null

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    const nextUpdate = pendingUpdateRef.current
    pendingUpdateRef.current = null
    nextUpdate?.()
  }, [])

  // 注册全局鼠标事件
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  // 点击外部关闭图片菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (imageMenuRef.current && !imageMenuRef.current.contains(event.target as Node)) {
        setShowImageMenu(false)
      }
    }

    if (showImageMenu) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [showImageMenu])

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* Action Bar */}
      <div className="h-14 border-b border-border bg-background flex items-center justify-between px-6">
        <div className="text-sm text-muted-foreground">
          {getToolHint()}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onGenerateJson}
            disabled={layers.length === 0}
            title={layers.length === 0 ? t("imageGeneration.canvas.addLayerFirst") : undefined}
          >
            <Code className="w-4 h-4" />
            {t("imageGeneration.canvas.advancedMode")}
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-primary hover:bg-primary/90"
            onClick={onGenerateImage}
            disabled={layers.length === 0 || isGenerating}
            title={layers.length === 0 ? t("imageGeneration.canvas.addLayerFirst") : undefined}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {generatingMessage || t("imageGeneration.canvas.generating")}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {t("imageGeneration.canvas.generateImage")}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 p-6 overflow-hidden flex items-center justify-center min-h-0 min-w-0">
        <div
          ref={canvasRef}
          className="relative bg-card border-2 border-dashed border-border rounded-xl overflow-hidden max-w-full max-h-full"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const s = rect.width > 0 ? rect.width / metaSettings.width : 1
            onCanvasClick((e.clientX - rect.left) / s, (e.clientY - rect.top) / s)
          }}
          style={{
            width: `${metaSettings.width}px`,
            aspectRatio: `${metaSettings.width} / ${metaSettings.high}`,
            backgroundImage: `
              linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: `${(20 / metaSettings.width) * 100}% ${(20 / metaSettings.high) * 100}%`,
          }}
        >
          {/* 生成的图片覆盖层 */}
          {generatedImageUrl && showGeneratedImage && (
            <div className="absolute inset-0 z-40" onClick={(e) => e.stopPropagation()}>
              <img
                src={generatedImageUrl}
                alt="Generated"
                className="w-full h-full object-contain cursor-pointer"
                onClick={() => setShowImageMenu(!showImageMenu)}
              />
              {/* 图片菜单 */}
              {showImageMenu && (
                <div
                  ref={imageMenuRef}
                  className="absolute top-4 right-4 bg-background border border-border rounded-lg shadow-lg p-2 min-w-48 z-50"
                >
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        setShowImageMenu(false)
                        onToggleImageVisibility()
                      }}
                    >
                      {t("imageGeneration.canvas.viewOriginal")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        setShowImageMenu(false)
                        onSaveImageToMaterials()
                      }}
                    >
                      {t("imageGeneration.canvas.saveToMaterials")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 显示图片按钮（当图片隐藏时显示） */}
          {generatedImageUrl && !showGeneratedImage && (
            <div className="absolute top-4 right-4 z-30">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleImageVisibility()
                }}
              >
                {t("imageGeneration.canvas.showGeneratedImage")}
              </Button>
            </div>
          )}

          {/* Layers */}
          {layers.map((layer) => (
            <div
              key={layer.id}
              className={cn(
                "absolute border-2 transition-shadow",
                selectedTool === "select" ? "cursor-move" :
                selectedTool === "delete" ? "cursor-pointer hover:border-destructive hover:shadow-lg hover:shadow-destructive/30" :
                "cursor-pointer",
                selectedLayer?.id === layer.id && selectedTool === "delete"
                  ? "border-destructive shadow-lg shadow-destructive/30"
                  : selectedLayer?.id === layer.id
                  ? "border-primary shadow-lg shadow-primary/20"
                  : "border-primary/50 hover:border-primary hover:shadow-md"
              )}
              style={{
                left: `${(layer.x / metaSettings.width) * 100}%`,
                top: `${(layer.y / metaSettings.high) * 100}%`,
                width: `${(layer.width / metaSettings.width) * 100}%`,
                height: `${(layer.height / metaSettings.high) * 100}%`,
                zIndex: layer.zIndex,
                backgroundColor: selectedLayer?.id === layer.id
                  ? "hsl(var(--primary) / 0.1)"
                  : "hsl(var(--primary) / 0.05)",
                willChange: isDragging || isResizing ? "left, top, width, height" : undefined,
              }}
              onClick={(e) => onLayerClick(e, layer)}
              onMouseDown={(e) => selectedTool === "select" && handleMouseDown(e, layer)}
            >
              {/* Layer Label */}
              <div className="absolute -top-6 left-0 text-xs font-medium text-primary whitespace-nowrap">
                {layer.label}
              </div>

              {layer.description ? (
                <div className="pointer-events-none flex h-full items-center justify-center p-3 text-center">
                  <div className="max-h-full overflow-hidden break-words text-xs font-medium leading-5 text-primary/80">
                    {layer.description}
                  </div>
                </div>
              ) : null}

              {/* Resize Handles (only for selected and in select mode) */}
              {selectedLayer?.id === layer.id && selectedTool === "select" && (
                <>
                  {/* Corner handles */}
                  <div
                    className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-primary rounded-sm cursor-nw-resize hover:bg-primary/80"
                    onMouseDown={(e) => handleResizeStart(e, layer, "nw")}
                  />
                  <div
                    className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-primary rounded-sm cursor-ne-resize hover:bg-primary/80"
                    onMouseDown={(e) => handleResizeStart(e, layer, "ne")}
                  />
                  <div
                    className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-primary rounded-sm cursor-sw-resize hover:bg-primary/80"
                    onMouseDown={(e) => handleResizeStart(e, layer, "sw")}
                  />
                  <div
                    className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-primary rounded-sm cursor-se-resize hover:bg-primary/80"
                    onMouseDown={(e) => handleResizeStart(e, layer, "se")}
                  />

                  {/* Edge handles */}
                  <div
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-sm cursor-n-resize hover:bg-primary/80"
                    onMouseDown={(e) => handleResizeStart(e, layer, "n")}
                  />
                  <div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-sm cursor-s-resize hover:bg-primary/80"
                    onMouseDown={(e) => handleResizeStart(e, layer, "s")}
                  />
                  <div
                    className="absolute top-1/2 -left-1 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-sm cursor-w-resize hover:bg-primary/80"
                    onMouseDown={(e) => handleResizeStart(e, layer, "w")}
                  />
                  <div
                    className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-sm cursor-e-resize hover:bg-primary/80"
                    onMouseDown={(e) => handleResizeStart(e, layer, "e")}
                  />
                </>
              )}
            </div>
          ))}

          {/* Empty State */}
          {layers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">{t("imageGeneration.canvas.emptyState.title")}</p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  {t("imageGeneration.canvas.emptyState.description")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
