"use client"

import { useState, useCallback, useEffect } from "react"
import { Upload, Download, Sparkles, Image as ImageIcon, Zap, CheckCircle2, Loader2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { imageGenerationClient } from "@/lib/api/image-generation/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/base/dialog"
import { Textarea } from "@/components/ui/base/textarea"
import { Button } from "@/components/ui/base/button"

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
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<StyleItem | null>(null)
  const [renderStatus, setRenderStatus] = useState<RenderStatus>("idle")
  const [renderedImage, setRenderedImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // 风格列表相关状态
  const [styles, setStyles] = useState<StyleItem[]>([])
  const [isLoadingStyles, setIsLoadingStyles] = useState(true)
  const [stylesLoadError, setStylesLoadError] = useState<string | null>(null)

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

  const handleGenerate = () => {
    if (!uploadedImage || !selectedStyle) return

    console.debug('[StyleMode] Starting generation:', {
      hasImage: !!uploadedImage,
      styleName: selectedStyle.name,
      hasPrompt: !!selectedStyle.full_prompt
    })

    setRenderStatus("generating")

    // TODO: 实际生成逻辑
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

        <div className="flex-1 p-4 space-y-4">
          {/* 上传区域 */}
          {!uploadedImage ? (
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
                    : "border-border/50 hover:border-primary/50 hover:bg-muted/50"
                }
              `}
            >
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
                  const input = document.createElement("input")
                  input.type = "file"
                  input.accept = "image/*"
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) handleFileUpload(file)
                  }
                  input.click()
                }}
                className="relative aspect-square rounded-2xl border-2 border-dashed border-border/50 transition-all duration-300 hover:border-primary/50 hover:bg-muted/50 cursor-pointer overflow-hidden"
              >
                <img
                  src={uploadedImage}
                  alt="Uploaded"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                  <Upload className="w-8 h-8 text-foreground" />
                </div>
              </div>

              {/* 重新上传按钮 */}
              <button
                onClick={handleReset}
                className="text-xs text-destructive hover:text-destructive/80 transition-colors w-fit"
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
                  ? '上传黑白线稿图，AI 将会把风格迁移'
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
            {renderStatus === "idle" && uploadedImage && selectedStyle && (
              <button
                onClick={handleGenerate}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                {t("imageGeneration.styleMode.generate")}
              </button>
            )}
            {renderStatus === "generating" && (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                <Zap className="w-4 h-4 animate-pulse" />
                {t("imageGeneration.styleMode.rendering")}
              </div>
            )}
            {renderStatus === "completed" && renderedImage && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Download className="w-4 h-4" />
                {t("imageGeneration.styleMode.download")}
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
