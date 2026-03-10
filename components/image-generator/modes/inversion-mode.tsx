"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, Split, Download, CheckCircle2, Layers } from "lucide-react"
import { useTranslation } from "@/lib/i18n/i18n-context"

type LayerImage = {
  id: string
  name: string
  nameEn: string
  imageUrl: string
  description: string
  index: number
}

type SplitStatus = "idle" | "uploading" | "splitting" | "completed" | "error"

export function InversionMode() {
  const { t } = useTranslation()

  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [splitStatus, setSplitStatus] = useState<SplitStatus>("idle")
  const [layerImages, setLayerImages] = useState<LayerImage[]>([])
  const [selectedLayers, setSelectedLayers] = useState<Set<string>>(new Set())
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string)
      setLayerImages([])
      setSelectedLayers(new Set())
      setSplitStatus("idle")
    }
    reader.readAsDataURL(file)
  }, [])

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

  const handleSplit = useCallback(() => {
    if (!uploadedImage) return

    setSplitStatus("splitting")
    setIsProcessing(true)

    // 模拟 API 拆分过程
    setTimeout(() => {
      // 生成模拟的拆分层，使用翻译键
      const mockLayers: LayerImage[] = [
        {
          id: "layer-1",
          name: t("imageGeneration.inversionMode.layers.mainSubject.name"),
          nameEn: t("imageGeneration.inversionMode.layers.mainSubject.name"),
          imageUrl: uploadedImage,
          description: t("imageGeneration.inversionMode.layers.mainSubject.description"),
          index: 0
        },
        {
          id: "layer-2",
          name: t("imageGeneration.inversionMode.layers.background.name"),
          nameEn: t("imageGeneration.inversionMode.layers.background.name"),
          imageUrl: uploadedImage,
          description: t("imageGeneration.inversionMode.layers.background.description"),
          index: 1
        },
        {
          id: "layer-3",
          name: t("imageGeneration.inversionMode.layers.details.name"),
          nameEn: t("imageGeneration.inversionMode.layers.details.name"),
          imageUrl: uploadedImage,
          description: t("imageGeneration.inversionMode.layers.details.description"),
          index: 2
        },
        {
          id: "layer-4",
          name: t("imageGeneration.inversionMode.layers.lighting.name"),
          nameEn: t("imageGeneration.inversionMode.layers.lighting.name"),
          imageUrl: uploadedImage,
          description: t("imageGeneration.inversionMode.layers.lighting.description"),
          index: 3
        }
      ]

      setLayerImages(mockLayers)
      setSplitStatus("completed")
      setIsProcessing(false)
    }, 3000)
  }, [uploadedImage, t])

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
    setLayerImages([])
    setSelectedLayers(new Set())
    setSplitStatus("idle")
    setIsProcessing(false)
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
              if (isProcessing) return
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
                  : uploadedImage
                  ? "border-transparent"
                  : "border-border/50 hover:border-primary/50 hover:bg-muted/50"
              }
              ${isProcessing ? "cursor-not-allowed opacity-60" : ""}
            `}
          >
            {uploadedImage ? (
              <img
                src={uploadedImage}
                alt="Uploaded"
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
            {isDragging && !uploadedImage && (
              <div className="absolute inset-0 bg-primary/10 animate-pulse pointer-events-none" />
            )}
          </div>

          {/* 操作按钮 */}
          {uploadedImage && splitStatus === "idle" && (
            <button
              onClick={handleSplit}
              disabled={isProcessing}
              className={`
                mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                font-medium transition-all duration-200
                ${
                  isProcessing
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
          {uploadedImage && (
            <button
              onClick={handleReset}
              disabled={isProcessing}
              className={`
                mt-auto pt-4 text-sm text-muted-foreground hover:text-destructive
                transition-colors ${isProcessing ? "cursor-not-allowed opacity-60" : ""}
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
    </div>
  )
}
