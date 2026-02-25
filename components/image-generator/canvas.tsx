"use client"

import type { Layer, ToolType } from "./types"
import { Code, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/base/button"
import { cn } from "@/lib/utils"

interface CanvasProps {
  layers: Layer[]
  selectedTool: ToolType
  selectedLayer: Layer | null
  onCanvasClick: (e: React.MouseEvent<HTMLDivElement>) => void
  onLayerClick: (e: React.MouseEvent, layer: Layer) => void
  onGenerateJson: () => void
  onGenerateImage: () => void
}

export function Canvas({
  layers,
  selectedTool,
  selectedLayer,
  onCanvasClick,
  onLayerClick,
  onGenerateJson,
  onGenerateImage,
}: CanvasProps) {
  const getToolHint = () => {
    if (selectedTool === "select") return "点击选择图层"
    if (selectedTool === "rectangle") return "点击画布添加矩形"
    if (selectedTool === "delete") return "点击图层删除"
    return ""
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
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
          >
            <Code className="w-4 h-4" />
            预览 JSON
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-primary hover:bg-primary/90"
            onClick={onGenerateImage}
          >
            <Sparkles className="w-4 h-4" />
            生成图片
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 p-6 overflow-auto">
        <div
          className="relative w-full h-full bg-card border-2 border-dashed border-border rounded-xl overflow-auto"
          onClick={onCanvasClick}
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
          }}
        >
          {/* Layers */}
          {layers.map((layer) => (
            <div
              key={layer.id}
              className={cn(
                "absolute border-2 cursor-pointer transition-all duration-200",
                selectedLayer?.id === layer.id
                  ? "border-primary shadow-lg shadow-primary/20"
                  : "border-primary/50 hover:border-primary hover:shadow-md"
              )}
              style={{
                left: `${layer.x}px`,
                top: `${layer.y}px`,
                width: `${layer.width}px`,
                height: `${layer.height}px`,
                zIndex: layer.zIndex,
                backgroundColor: selectedLayer?.id === layer.id
                  ? "hsl(var(--primary) / 0.1)"
                  : "hsl(var(--primary) / 0.05)",
              }}
              onClick={(e) => onLayerClick(e, layer)}
            >
              {/* Layer Label */}
              <div className="absolute -top-6 left-0 text-xs font-medium text-primary whitespace-nowrap">
                {layer.label}
              </div>

              {/* Resize Handles (only for selected) */}
              {selectedLayer?.id === layer.id && (
                <>
                  <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary rounded-full" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary rounded-full" />
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary rounded-full" />
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
                <p className="text-muted-foreground font-medium">画布空白</p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  从左侧选择矩形工具开始创作
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
