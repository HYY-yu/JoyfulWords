"use client"

import { useState, useCallback } from "react"
import { Upload, Download, Sparkles, Image as ImageIcon, Zap, CheckCircle2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n/i18n-context"

type StylePreset = {
  id: string
  name: string
  nameEn: string
  description: string
  preview: string
  gradient: string
}

const STYLE_PRESETS: StylePreset[] = [
  {
    id: "cyber-neon",
    name: "赛博霓虹",
    nameEn: "Cyber Neon",
    description: "高饱和度霓虹色彩，未来科技感",
    preview: "linear-gradient(135deg, #ff006e 0%, #8338ec 50%, #3a86ff 100%)",
    gradient: "from-pink-500 via-purple-500 to-blue-500"
  },
  {
    id: "frosted-glass",
    name: "磨砂玻璃",
    nameEn: "Frosted Glass",
    description: "半透明质感，柔和光晕",
    preview: "linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 50%, #818cf8 100%)",
    gradient: "from-indigo-100 via-indigo-200 to-indigo-300"
  },
  {
    id: "minimal-line",
    name: "极简白描",
    nameEn: "Minimal Line",
    description: "黑白线条，简洁雅致",
    preview: "linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 50%, #808080 100%)",
    gradient: "from-gray-900 via-gray-600 to-gray-500"
  },
  {
    id: "warm-oil",
    name: "温暖油画",
    nameEn: "Warm Oil",
    description: "厚重笔触，温暖色调",
    preview: "linear-gradient(135deg, #f4a261 0%, #e76f51 50%, #264653 100%)",
    gradient: "from-orange-400 via-red-400 to-cyan-700"
  },
  {
    id: "anime",
    name: "二次元",
    nameEn: "Anime",
    description: "日式动画风格，明亮色彩",
    preview: "linear-gradient(135deg, #ff9ff3 0%, #feca57 50%, #48dbfb 100%)",
    gradient: "from-pink-300 via-yellow-300 to-cyan-400"
  },
  {
    id: "watercolor",
    name: "水彩晕染",
    nameEn: "Watercolor",
    description: "流动色彩，自然融合",
    preview: "linear-gradient(135deg, #a8edea 0%, #fed6e3 50%, #d299c2 100%)",
    gradient: "from-teal-200 via-pink-200 to-purple-300"
  }
]

type RenderStatus = "idle" | "generating" | "completed" | "error"

export function StyleMode() {
  const { t, locale } = useTranslation()
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [renderStatus, setRenderStatus] = useState<RenderStatus>("idle")
  const [renderedImage, setRenderedImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string)
      setRenderedImage(null)
      setRenderStatus("idle")
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

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId)
  }

  const handleGenerate = () => {
    if (!uploadedImage || !selectedStyle) return
    setRenderStatus("generating")

    // 模拟 AI 渲染过程
    setTimeout(() => {
      setRenderedImage(uploadedImage) // 实际应该是渲染后的图片
      setRenderStatus("completed")
    }, 3000)
  }

  const handleDownload = () => {
    if (!renderedImage) return
    const link = document.createElement("a")
    link.href = renderedImage
    link.download = `styled-image-${Date.now()}.png`
    link.click()
  }

  const handleReset = () => {
    setUploadedImage(null)
    setRenderedImage(null)
    setSelectedStyle(null)
    setRenderStatus("idle")
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* 左侧：上传和预览区 */}
      <div className="w-80 border-r border-border/50 bg-muted/30 flex flex-col">
        <div className="p-4 border-b border-border/50">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {locale === "zh" ? "图片上传" : "Image Upload"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {locale === "zh" ? "拖拽或点击上传图片" : "Drag or click to upload"}
          </p>
        </div>

        <div className="flex-1 p-4">
          {/* 上传区域 */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => {
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
                  : uploadedImage
                  ? "border-transparent"
                  : "border-border/50 hover:border-primary/50 hover:bg-muted/50"
              }
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
                  {locale === "zh" ? "拖拽图片到此处" : "Drop image here"}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {locale === "zh" ? "或点击选择文件" : "or click to select"}
                </p>
              </>
            )}

            {/* 拖拽时的高亮效果 */}
            {isDragging && (
              <div className="absolute inset-0 bg-primary/10 animate-pulse pointer-events-none" />
            )}
          </div>

          {/* 已上传图片的预览 */}
          {uploadedImage && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {locale === "zh" ? "原图预览" : "Original"}
                </span>
                <button
                  onClick={handleReset}
                  className="text-xs text-destructive hover:text-destructive/80 transition-colors"
                >
                  {locale === "zh" ? "重新上传" : "Reupload"}
                </button>
              </div>
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
              {locale === "zh" ? "实时预览" : "Live Preview"}
            </span>
          </div>

          {/* 状态指示器 */}
          <div className="flex items-center gap-2">
            {renderStatus === "idle" && uploadedImage && selectedStyle && (
              <button
                onClick={handleGenerate}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                {locale === "zh" ? "生成图片" : "Generate"}
              </button>
            )}
            {renderStatus === "generating" && (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                <Zap className="w-4 h-4 animate-pulse" />
                {locale === "zh" ? "AI 渲染中..." : "Rendering..."}
              </div>
            )}
            {renderStatus === "completed" && renderedImage && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Download className="w-4 h-4" />
                {locale === "zh" ? "下载图片" : "Download"}
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
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  {locale === "zh" ? "等待上传" : "Waiting for upload"}
                </p>
                <p className="text-sm text-muted-foreground/60">
                  {locale === "zh" ? "上传图片并选择风格开始创作" : "Upload an image and select a style to begin"}
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
                <img
                  src={uploadedImage || ""}
                  alt="Rendering"
                  className="w-full h-full object-cover opacity-50 blur-sm"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary/10 backdrop-blur-sm">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                  </div>
                  <p className="mt-6 text-lg font-medium text-primary">
                    {locale === "zh" ? "AI 正在渲染" : "AI Rendering"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {locale === "zh" ? "这可能需要几秒钟" : "This may take a few seconds"}
                  </p>
                </div>
              </div>
            )}

            {/* 渲染完成 */}
            {renderStatus === "completed" && renderedImage && (
              <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-green-500/50 shadow-2xl relative group">
                <img
                  src={renderedImage}
                  alt="Rendered"
                  className="w-full h-full object-cover"
                />
                {/* 成功标记 */}
                <div className="absolute top-4 right-4 p-2 bg-green-500 rounded-full shadow-lg">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                {/* 悬浮效果 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 右侧：风格控制面板 */}
      <div className="w-96 border-l border-border/50 bg-muted/30 flex flex-col">
        <div className="p-4 border-b border-border/50">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {locale === "zh" ? "风格选择" : "Style Selection"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {locale === "zh" ? "选择预设风格或自定义" : "Choose a preset style or customize"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {STYLE_PRESETS.map((preset, index) => (
              <div
                key={preset.id}
                onClick={() => handleStyleSelect(preset.id)}
                className={`
                  relative group rounded-xl overflow-hidden cursor-pointer transition-all duration-300
                  ${
                    selectedStyle === preset.id
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg scale-[1.02]"
                      : "hover:scale-[1.01] hover:shadow-md"
                  }
                `}
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                {/* 预览条 */}
                <div
                  className="h-20 w-full transition-transform duration-500 group-hover:scale-105"
                  style={{ background: preset.preview }}
                >
                  {/* 覆盖层 */}
                  <div className="w-full h-full bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>

                {/* 信息区 */}
                <div className="p-3 bg-background/95 backdrop-blur-sm">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        {locale === "zh" ? preset.name : preset.nameEn}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {preset.description}
                      </p>
                    </div>
                    {selectedStyle === preset.id && (
                      <div className="p-1 bg-primary rounded-full">
                        <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                {/* 选中指示器 */}
                {selectedStyle === preset.id && (
                  <div className="absolute top-2 left-2">
                    <div className="px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                      {locale === "zh" ? "已选择" : "Selected"}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 自定义选项 */}
          <div className="mt-6 p-4 rounded-xl border border-border/50 bg-background/50">
            <h4 className="text-sm font-semibold text-foreground mb-3">
              {locale === "zh" ? "高级选项" : "Advanced Options"}
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {locale === "zh" ? "风格强度" : "Style Strength"}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="75"
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{locale === "zh" ? "轻微" : "Subtle"}</span>
                  <span>{locale === "zh" ? "强烈" : "Strong"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部提示 */}
        <div className="p-4 border-t border-border/50 bg-background/50">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              {locale === "zh"
                ? "选择风格后点击「生成图片」按钮，AI 将自动为您的图片应用选定的风格效果。"
                : "After selecting a style, click 'Generate' and AI will apply the style effect to your image."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
