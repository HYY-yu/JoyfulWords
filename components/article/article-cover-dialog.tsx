"use client"

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react"
import {
  AlignCenterHorizontalIcon,
  AlignCenterVerticalIcon,
  AlignHorizontalJustifyEndIcon,
  AlignHorizontalJustifyStartIcon,
  CropIcon,
  DownloadIcon,
  ImageIcon,
  ImagePlusIcon,
  LoaderIcon,
  PaintbrushIcon,
  RefreshCwIcon,
  SearchIcon,
  SparklesIcon,
  TypeIcon,
  WandSparklesIcon,
} from "lucide-react"
import { AIFeatureDialogShell } from "@/components/ui/ai/ai-feature-dialog-shell"
import { Alert, AlertDescription } from "@/components/ui/base/alert"
import { Button } from "@/components/ui/base/button"
import { Input } from "@/components/ui/base/input"
import { Label } from "@/components/ui/base/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/base/select"
import { Slider } from "@/components/ui/base/slider"
import { Textarea } from "@/components/ui/base/textarea"
import { CreatorMode } from "@/components/image-generator/creator-mode"
import { ModelSelector } from "@/components/image-generator/ui/model-selector"
import { useToast } from "@/hooks/use-toast"
import { articlesClient } from "@/lib/api/articles/client"
import { imageGenerationClient } from "@/lib/api/image-generation/client"
import type { UnsplashPhoto } from "@/lib/api/image-generation/types"
import { materialsClient, uploadFileToPresignedUrl } from "@/lib/api/materials/client"
import type { Material } from "@/lib/api/materials/types"
import { parseTaskCenterImageUrls } from "@/lib/api/taskcenter/types"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { cn } from "@/lib/utils"
import { webSocketService, type TaskUpdatePayload } from "@/lib/websocket/websocket-service"

type BackgroundMode = "solid" | "gradient" | "unsplash" | "material"
type FontMode = "preset" | "custom"
type ExportFormat = "png" | "jpeg" | "webp"
type GradientDirection = "135" | "90" | "180" | "45"

interface CoverPreset {
  id: string
  width: number
  height: number
}

const COVER_PRESETS: CoverPreset[] = [
  { id: "blog", width: 1200, height: 630 },
  { id: "wechat", width: 900, height: 383 },
  { id: "xhs", width: 1242, height: 1660 },
  { id: "video", width: 1280, height: 720 },
  { id: "square", width: 1080, height: 1080 },
]

const FONT_OPTIONS = [
  { id: "system", family: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif" },
  { id: "headline", family: "Arial Black, Impact, system-ui, sans-serif" },
  { id: "serif", family: "Georgia, 'Times New Roman', serif" },
  { id: "song", family: "'Noto Serif SC', SimSun, Songti SC, serif" },
  { id: "kai", family: "KaiTi, STKaiti, cursive" },
  { id: "mono", family: "'SFMono-Regular', Consolas, monospace" },
]

const DEFAULT_TITLE_POSITION = { x: 110, y: 250 }
const NANO_BANANA_FAST_MODEL_KEYWORDS = ["nano", "banana", "fast"]
const COVER_TITLE_CHARACTER_LIMIT = 20
const COVER_TITLE_WORD_LIMIT = 10

function toCanvasSafeImageUrl(url: string): string {
  if (typeof window === "undefined") return url

  try {
    const parsed = new URL(url, window.location.href)
    if (parsed.protocol === "data:" || parsed.protocol === "blob:") {
      return parsed.href
    }
    if (parsed.origin === window.location.origin) {
      return parsed.href
    }
    if (parsed.protocol !== "https:") {
      return parsed.href
    }
    return `/api/image-proxy?url=${encodeURIComponent(parsed.href)}`
  } catch {
    return url
  }
}

function countTitleWords(text: string): number {
  return text.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g)?.length ?? 0
}

function countTitleCharacters(text: string): number {
  return Array.from(text.replace(/\s/g, "")).length
}

function needsStandardCoverTitle(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  return (
    countTitleCharacters(trimmed) > COVER_TITLE_CHARACTER_LIMIT ||
    countTitleWords(trimmed) > COVER_TITLE_WORD_LIMIT
  )
}

function extractFirstImageUrl(value: unknown): string {
  return parseImageUrls(value)[0] ?? ""
}

function parseImageUrls(value: unknown): string[] {
  if (typeof value === "string" || Array.isArray(value)) {
    return parseTaskCenterImageUrls(value)
  }
  return []
}

function loadCrossOriginImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("image_load_failed"))
    image.src = toCanvasSafeImageUrl(url)
  })
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const paragraphs = text.split(/\n+/).map((line) => line.trim()).filter(Boolean)
  const lines: string[] = []

  for (const paragraph of paragraphs.length ? paragraphs : [text]) {
    let current = ""
    for (const char of Array.from(paragraph)) {
      const next = current + char
      if (current && ctx.measureText(next).width > maxWidth) {
        lines.push(current)
        current = char
      } else {
        current = next
      }
    }
    if (current) lines.push(current)
  }

  return lines.length ? lines : [""]
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number
) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const drawWidth = image.naturalWidth * scale
  const drawHeight = image.naturalHeight * scale
  const dx = (width - drawWidth) / 2
  const dy = (height - drawHeight) / 2
  ctx.drawImage(image, dx, dy, drawWidth, drawHeight)
}

function buildGradient(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  direction: GradientDirection,
  from: string,
  to: string
) {
  const angle = Number(direction) * (Math.PI / 180)
  const x = Math.cos(angle)
  const y = Math.sin(angle)
  const gradient = ctx.createLinearGradient(
    width * (0.5 - x / 2),
    height * (0.5 - y / 2),
    width * (0.5 + x / 2),
    height * (0.5 + y / 2)
  )
  gradient.addColorStop(0, from)
  gradient.addColorStop(1, to)
  return gradient
}

function isDefaultArticleTitle(title: string) {
  const normalized = title.trim().toLocaleLowerCase()
  return normalized === "未命名文章" || normalized === "untitled article"
}

interface ArticleCoverDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  articleId?: number | null
  articleTitle?: string
  onTaskSubmitted?: () => void
  onArticleTitleUpdated?: (title: string) => void
}

export function ArticleCoverDialog({
  open,
  onOpenChange,
  articleId,
  articleTitle = "",
  onTaskSubmitted,
  onArticleTitleUpdated,
}: ArticleCoverDialogProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const titleBoundsRef = useRef({ x: 0, y: 0, width: 0, height: 0 })
  const dragRef = useRef({ active: false, offsetX: 0, offsetY: 0 })
  const pendingFontTaskIdsRef = useRef<Set<string>>(new Set())
  const resolvingFontTaskIdsRef = useRef<Set<string>>(new Set())
  const autoStandardizedTitleArticleRef = useRef<string | null>(null)

  const [title, setTitle] = useState("")
  const [fontMode, setFontMode] = useState<FontMode>("preset")
  const [fontFamilyId, setFontFamilyId] = useState("headline")
  const [fontSize, setFontSize] = useState(86)
  const [fontWeight, setFontWeight] = useState(800)
  const [titleColor, setTitleColor] = useState("#101828")
  const [titlePosition, setTitlePosition] = useState(DEFAULT_TITLE_POSITION)
  const [customFontDescription, setCustomFontDescription] = useState("")
  const [customFontUrl, setCustomFontUrl] = useState("")
  const [isGeneratingFont, setIsGeneratingFont] = useState(false)
  const [activeFontTaskId, setActiveFontTaskId] = useState<string | null>(null)
  const [activeFontTaskStatus, setActiveFontTaskStatus] = useState("")
  const [isExportingCover, setIsExportingCover] = useState(false)

  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>("solid")
  const [solidColor, setSolidColor] = useState("#f8fafc")
  const [gradientFrom, setGradientFrom] = useState("#fff7ed")
  const [gradientTo, setGradientTo] = useState("#dbeafe")
  const [gradientDirection, setGradientDirection] = useState<GradientDirection>("135")
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("")
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null)
  const [customFontImage, setCustomFontImage] = useState<HTMLImageElement | null>(null)

  const [width, setWidth] = useState(1200)
  const [height, setHeight] = useState(630)
  const [presetId, setPresetId] = useState("blog")
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png")

  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState("")
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [modelLoadError, setModelLoadError] = useState(false)

  const [unsplashQuery, setUnsplashQuery] = useState("")
  const [unsplashPhotos, setUnsplashPhotos] = useState<UnsplashPhoto[]>([])
  const [isSearchingUnsplash, setIsSearchingUnsplash] = useState(false)
  const [materialQuery, setMaterialQuery] = useState("")
  const [materials, setMaterials] = useState<Material[]>([])
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false)
  const [materialLoadError, setMaterialLoadError] = useState(false)
  const [hasFetchedEmptyMaterials, setHasFetchedEmptyMaterials] = useState(false)
  const [isImageCreatorOpen, setIsImageCreatorOpen] = useState(false)
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false)

  const selectedFontFamily = useMemo(
    () => FONT_OPTIONS.find((font) => font.id === fontFamilyId)?.family ?? FONT_OPTIONS[0].family,
    [fontFamilyId]
  )

  useEffect(() => {
    if (!open) return

    const nextTitle = isDefaultArticleTitle(articleTitle) ? "" : articleTitle.trim()
    setTitle(nextTitle)
    setUnsplashQuery((current) => current || nextTitle || "editorial article cover")
    setBackgroundMode("solid")
    setSolidColor("#f8fafc")
    setBackgroundImageUrl("")
    setBackgroundImage(null)
    setTitlePosition(DEFAULT_TITLE_POSITION)
    autoStandardizedTitleArticleRef.current = null
  }, [articleId, articleTitle, open])

  useEffect(() => {
    if (!open) {
      setHasFetchedEmptyMaterials(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    let cancelled = false

    async function fetchModels() {
      if (availableModels.length > 0) return
      setIsLoadingModels(true)
      setModelLoadError(false)
      const result = await imageGenerationClient.getModels()
      if (cancelled) return

      if ("error" in result) {
        setModelLoadError(true)
        toast({ variant: "destructive", title: t("imageGeneration.model.fetchFailed") })
      } else {
        setAvailableModels(result.models)
        if (!selectedModel && result.models.length > 0) {
          setSelectedModel(result.models[0])
        }
      }
      setIsLoadingModels(false)
    }

    void fetchModels()
    return () => {
      cancelled = true
    }
  }, [availableModels.length, open, selectedModel, t, toast])

  useEffect(() => {
    if (!backgroundImageUrl) {
      setBackgroundImage(null)
      return
    }

    let cancelled = false
    loadCrossOriginImage(backgroundImageUrl)
      .then((image) => {
        if (!cancelled) setBackgroundImage(image)
      })
      .catch(() => {
        if (!cancelled) {
          setBackgroundImage(null)
          toast({ variant: "destructive", title: t("imageGeneration.cover.toast.backgroundLoadFailed") })
        }
      })

    return () => {
      cancelled = true
    }
  }, [backgroundImageUrl, t, toast])

  useEffect(() => {
    if (!customFontUrl) {
      setCustomFontImage(null)
      return
    }

    let cancelled = false
    loadCrossOriginImage(customFontUrl)
      .then((image) => {
        if (!cancelled) setCustomFontImage(image)
      })
      .catch(() => {
        if (!cancelled) {
          setCustomFontImage(null)
          toast({ variant: "destructive", title: t("imageGeneration.cover.toast.fontLoadFailed") })
        }
      })

    return () => {
      cancelled = true
    }
  }, [customFontUrl, t, toast])

  const drawCover = useCallback((overrideTitle?: string) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    canvas.width = width
    canvas.height = height

    ctx.clearRect(0, 0, width, height)
    if (backgroundMode === "solid") {
      ctx.fillStyle = solidColor
      ctx.fillRect(0, 0, width, height)
    } else if (backgroundMode === "gradient") {
      ctx.fillStyle = buildGradient(ctx, width, height, gradientDirection, gradientFrom, gradientTo)
      ctx.fillRect(0, 0, width, height)
    } else if (backgroundImage) {
      drawCoverImage(ctx, backgroundImage, width, height)
      ctx.fillStyle = "rgba(255,255,255,0.12)"
      ctx.fillRect(0, 0, width, height)
    } else {
      ctx.fillStyle = "#f8fafc"
      ctx.fillRect(0, 0, width, height)
    }

    ctx.fillStyle = "rgba(255,255,255,0.24)"
    ctx.fillRect(0, 0, width, height)

    const maxTitleWidth = width * 0.74
    if (fontMode === "custom" && customFontImage) {
      const imageHeight = Math.max(64, fontSize * 2.2)
      const ratio = customFontImage.naturalWidth / customFontImage.naturalHeight
      const imageWidth = Math.min(maxTitleWidth, imageHeight * ratio)
      const adjustedHeight = imageWidth / ratio
      ctx.drawImage(customFontImage, titlePosition.x, titlePosition.y, imageWidth, adjustedHeight)
      titleBoundsRef.current = {
        x: titlePosition.x,
        y: titlePosition.y,
        width: imageWidth,
        height: adjustedHeight,
      }
      return
    }

    const displayTitle = (overrideTitle ?? title).trim() || t("imageGeneration.cover.previewPlaceholder")
    ctx.font = `${fontWeight} ${fontSize}px ${selectedFontFamily}`
    ctx.textBaseline = "top"
    ctx.textAlign = "left"
    const lines = wrapCanvasText(ctx, displayTitle, maxTitleWidth)
    const lineHeight = fontSize * 1.14
    const textWidth = Math.max(...lines.map((line) => ctx.measureText(line).width), 1)
    const textHeight = lines.length * lineHeight

    ctx.shadowColor = "rgba(15, 23, 42, 0.22)"
    ctx.shadowBlur = 24
    ctx.shadowOffsetY = 12
    ctx.strokeStyle = "rgba(255,255,255,0.72)"
    ctx.lineWidth = Math.max(2, fontSize * 0.045)
    ctx.fillStyle = titleColor
    lines.forEach((line, index) => {
      const y = titlePosition.y + index * lineHeight
      ctx.strokeText(line, titlePosition.x, y)
      ctx.fillText(line, titlePosition.x, y)
    })
    ctx.shadowColor = "transparent"

    titleBoundsRef.current = {
      x: titlePosition.x,
      y: titlePosition.y,
      width: textWidth,
      height: textHeight,
    }
  }, [
    backgroundImage,
    backgroundMode,
    customFontImage,
    fontMode,
    fontSize,
    fontWeight,
    gradientDirection,
    gradientFrom,
    gradientTo,
    height,
    selectedFontFamily,
    solidColor,
    t,
    title,
    titleColor,
    titlePosition.x,
    titlePosition.y,
    width,
  ])

  useEffect(() => {
    drawCover()
  }, [drawCover])

  const fetchMaterials = useCallback(async (queryOverride?: string) => {
    setIsLoadingMaterials(true)
    setMaterialLoadError(false)
    const query = typeof queryOverride === "string" ? queryOverride : materialQuery
    const result = await materialsClient.getMaterials({
      page: 1,
      page_size: 15,
      name: query.trim() || undefined,
      type: "image",
      article_id: typeof articleId === "number" ? articleId : undefined,
    })
    if ("error" in result) {
      setMaterialLoadError(true)
      toast({ variant: "destructive", title: t("imageGeneration.cover.toast.materialLoadFailed") })
    } else {
      setMaterials(result.list)
      if (result.list.length === 0) {
        setHasFetchedEmptyMaterials(true)
      }
    }
    setIsLoadingMaterials(false)
  }, [articleId, materialQuery, t, toast])

  useEffect(() => {
    if (open && backgroundMode === "material" && materials.length === 0 && !isLoadingMaterials && !hasFetchedEmptyMaterials) {
      void fetchMaterials("")
    }
  }, [backgroundMode, fetchMaterials, hasFetchedEmptyMaterials, isLoadingMaterials, materials.length, open])

  const handlePresetChange = (nextPresetId: string) => {
    const preset = COVER_PRESETS.find((item) => item.id === nextPresetId)
    setPresetId(nextPresetId)
    if (!preset) return

    setTitlePosition((current) => ({
      x: Math.round((current.x / width) * preset.width),
      y: Math.round((current.y / height) * preset.height),
    }))
    setWidth(preset.width)
    setHeight(preset.height)
  }

  const handleTitlePositionShortcut = (shortcut: "centerX" | "centerY" | "left" | "right") => {
    drawCover()
    const bounds = titleBoundsRef.current
    const margin = Math.max(24, Math.round(Math.min(width, height) * 0.08))
    const next = { ...titlePosition }

    if (shortcut === "centerX") {
      next.x = (width - bounds.width) / 2
    } else if (shortcut === "centerY") {
      next.y = (height - bounds.height) / 2
    } else if (shortcut === "left") {
      next.x = margin
    } else if (shortcut === "right") {
      next.x = width - bounds.width - margin
    }

    setTitlePosition({
      x: Math.max(0, Math.min(width - bounds.width, Math.round(next.x))),
      y: Math.max(0, Math.min(height - bounds.height, Math.round(next.y))),
    })
  }

  const generateStandardTitle = useCallback(async (options?: { silent?: boolean }) => {
    if (typeof articleId !== "number") {
      if (!options?.silent) {
        toast({ variant: "destructive", title: t("imageGeneration.cover.toast.articleRequired") })
      }
      return null
    }
    setIsGeneratingTitle(true)
    const result = await articlesClient.generateCoverTitle(articleId)
    setIsGeneratingTitle(false)

    if ("error" in result) {
      if (!options?.silent) {
        toast({ variant: "destructive", title: t("imageGeneration.cover.toast.titleGenerateFailed") })
      }
      return null
    }

    const nextTitle = result.title.trim()
    setTitle(nextTitle)
    if (!options?.silent) {
      toast({ title: t("imageGeneration.cover.toast.titleGenerated") })
    }
    return nextTitle
  }, [articleId, t, toast])

  const handleGenerateTitle = () => {
    void generateStandardTitle()
  }

  useEffect(() => {
    if (!open || typeof articleId !== "number") return
    if (isGeneratingTitle || !needsStandardCoverTitle(title)) return

    const articleKey = String(articleId)
    if (autoStandardizedTitleArticleRef.current === articleKey) return

    const timeoutId = window.setTimeout(() => {
      autoStandardizedTitleArticleRef.current = articleKey
      void generateStandardTitle({ silent: true })
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [articleId, generateStandardTitle, isGeneratingTitle, open, title])

  const handleSearchUnsplash = async () => {
    const query = unsplashQuery.trim() || title.trim()
    if (!query) {
      toast({ variant: "destructive", title: t("imageGeneration.cover.toast.unsplashQueryRequired") })
      return
    }

    setIsSearchingUnsplash(true)
    const result = await imageGenerationClient.searchUnsplash({
      query,
      orientation: width > height ? "landscape" : width < height ? "portrait" : "squarish",
      count: 12,
    })
    setIsSearchingUnsplash(false)

    if ("error" in result) {
      toast({ variant: "destructive", title: t("imageGeneration.cover.toast.unsplashSearchFailed") })
      return
    }

    setUnsplashPhotos(result.photos)
  }

  const handleSelectUnsplashPhoto = async (photo: UnsplashPhoto) => {
    setBackgroundMode("unsplash")
    setBackgroundImageUrl(photo.regular_url || photo.full_url)
    void imageGenerationClient.trackUnsplashDownload(photo.download_location)
  }

  const handleGenerateFontPreview = async () => {
    let fontTitle = title.trim()
    if (!fontTitle) {
      toast({ variant: "destructive", title: t("imageGeneration.cover.toast.titleRequired") })
      return
    }
    if (!customFontDescription.trim()) {
      toast({ variant: "destructive", title: t("imageGeneration.cover.toast.fontDescriptionRequired") })
      return
    }
    if (!selectedModel) {
      toast({ variant: "destructive", title: t("imageGeneration.cover.toast.modelRequired") })
      return
    }

    if (needsStandardCoverTitle(fontTitle) && typeof articleId === "number") {
      const generatedTitle = await generateStandardTitle({ silent: true })
      if (generatedTitle) {
        fontTitle = generatedTitle
      }
    }

    setIsGeneratingFont(true)
    const result = await imageGenerationClient.createFontPreviewTask({
      article_id: typeof articleId === "number" ? articleId : undefined,
      title: fontTitle,
      font_description: customFontDescription,
      model_name: selectedModel,
      width: 1536,
      height: 512,
    })

    if ("error" in result) {
      setIsGeneratingFont(false)
      toast({ variant: "destructive", title: t("imageGeneration.cover.toast.fontTaskCreateFailed") })
      return
    }

    const taskId = String(result.task_id)
    pendingFontTaskIdsRef.current.add(taskId)
    setActiveFontTaskId(taskId)
    setActiveFontTaskStatus("pending")
    onTaskSubmitted?.()
    toast({ title: t("imageGeneration.cover.toast.fontTaskCreated") })
  }

  const finishFontTaskFailure = useCallback((taskId: string) => {
    if (!pendingFontTaskIdsRef.current.has(taskId)) return

    pendingFontTaskIdsRef.current.delete(taskId)
    resolvingFontTaskIdsRef.current.delete(taskId)
    setIsGeneratingFont(pendingFontTaskIdsRef.current.size > 0)
    setActiveFontTaskId(null)
    setActiveFontTaskStatus("")
    toast({ variant: "destructive", title: t("imageGeneration.cover.toast.fontGenerateFailed") })
  }, [t, toast])

  const loadFontTaskDetail = useCallback(async (taskId: string) => {
    if (!pendingFontTaskIdsRef.current.has(taskId)) return
    if (resolvingFontTaskIdsRef.current.has(taskId)) return

    resolvingFontTaskIdsRef.current.add(taskId)
    const result = await imageGenerationClient.getTaskResult(taskId)
    resolvingFontTaskIdsRef.current.delete(taskId)

    if (!pendingFontTaskIdsRef.current.has(taskId)) return

    if ("error" in result) {
      return
    }

    setActiveFontTaskStatus(result.status)

    if (result.status === "success") {
      const imageUrl = extractFirstImageUrl(result.image_url)
      pendingFontTaskIdsRef.current.delete(taskId)
      setIsGeneratingFont(pendingFontTaskIdsRef.current.size > 0)
      setActiveFontTaskId(null)
      setActiveFontTaskStatus("")

      if (!imageUrl) {
        toast({ variant: "destructive", title: t("imageGeneration.cover.toast.fontGenerateFailed") })
        return
      }

      setCustomFontUrl(imageUrl)
      setFontMode("custom")
      toast({ title: t("imageGeneration.cover.toast.fontGenerated") })
    } else if (result.status === "failed") {
      finishFontTaskFailure(taskId)
    }
  }, [finishFontTaskFailure, t, toast])

  const completeFontTask = useCallback((payload: TaskUpdatePayload) => {
    const taskId = String(payload.task_id)
    const outputs = payload.outputs && typeof payload.outputs === "object"
      ? payload.outputs as Record<string, unknown>
      : {}

    if (payload.task_type !== "image") return
    if (outputs.gen_mode !== "font") return
    if (!pendingFontTaskIdsRef.current.has(taskId)) return

    void loadFontTaskDetail(taskId)
  }, [loadFontTaskDetail])

  const failFontTask = useCallback((payload: TaskUpdatePayload) => {
    const taskId = String(payload.task_id)
    const outputs = payload.outputs && typeof payload.outputs === "object"
      ? payload.outputs as Record<string, unknown>
      : {}

    if (payload.task_type !== "image") return
    if (outputs.gen_mode !== "font") return
    if (!pendingFontTaskIdsRef.current.has(taskId)) return

    finishFontTaskFailure(taskId)
  }, [finishFontTaskFailure])

  const updateFontTask = useCallback((payload: TaskUpdatePayload) => {
    const taskId = String(payload.task_id)
    const outputs = payload.outputs && typeof payload.outputs === "object"
      ? payload.outputs as Record<string, unknown>
      : {}

    if (payload.task_type !== "image") return
    if (outputs.gen_mode !== "font") return
    if (!pendingFontTaskIdsRef.current.has(taskId)) return

    setActiveFontTaskStatus(payload.status)
  }, [])

  useEffect(() => {
    webSocketService.on("image:task:update", updateFontTask)
    webSocketService.on("image:task:complete", completeFontTask)
    webSocketService.on("image:task:failed", failFontTask)
    return () => {
      webSocketService.off("image:task:update", updateFontTask)
      webSocketService.off("image:task:complete", completeFontTask)
      webSocketService.off("image:task:failed", failFontTask)
    }
  }, [completeFontTask, failFontTask, updateFontTask])

  useEffect(() => {
    if (!activeFontTaskId || !isGeneratingFont) return

    void loadFontTaskDetail(activeFontTaskId)
    const intervalId = window.setInterval(() => {
      void loadFontTaskDetail(activeFontTaskId)
    }, 8000)

    return () => window.clearInterval(intervalId)
  }, [activeFontTaskId, isGeneratingFont, loadFontTaskDetail])

  const panelCardClass = "rounded-2xl border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] p-5 shadow-[0_18px_44px_-36px_rgba(0,0,0,0.34)]"
  const panelTitleClass = "mb-5 flex items-center gap-2.5 border-b border-[var(--jw-border-subtle)] pb-3 text-[15px] font-semibold text-[var(--jw-heading)]"
  const inspectorSectionClass = "rounded-2xl border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] p-4 shadow-[0_18px_42px_-36px_rgba(0,0,0,0.34)]"
  const inspectorHeaderClass = "mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--jw-heading)]"
  const fieldLabelClass = "text-xs font-semibold uppercase tracking-[0.12em] text-[var(--jw-muted)]"
  const modeButtonClass = "h-10 justify-start gap-2 rounded-xl border-[var(--jw-border)] bg-[var(--jw-surface-strong)] text-sm font-semibold text-[var(--jw-heading)] shadow-[var(--jw-soft-shadow)] hover:border-[color-mix(in_srgb,var(--jw-accent)_42%,transparent)] hover:bg-[var(--jw-accent-soft)] hover:text-[var(--jw-accent)]"
  const selectedModeButtonClass = "border-[var(--jw-accent)] bg-[var(--jw-accent)] text-[var(--jw-accent-foreground)] shadow-[var(--jw-soft-shadow)] hover:border-[var(--jw-accent)] hover:bg-[var(--jw-accent-hover)] hover:text-[var(--jw-accent-foreground)]"
  const controlInputClass = "h-10 rounded-xl border-[var(--jw-border)] bg-[var(--jw-surface-strong)] text-sm text-[var(--jw-heading)] shadow-[0_10px_22px_-20px_rgba(0,0,0,0.28)] focus-visible:ring-[color-mix(in_srgb,var(--jw-accent)_22%,transparent)]"
  const colorInputClass = "h-10 rounded-xl border-[var(--jw-border)] bg-[var(--jw-surface-strong)] p-1 shadow-[0_10px_22px_-20px_rgba(0,0,0,0.28)]"
  const subtleButtonClass = "h-10 rounded-xl border-[var(--jw-border)] bg-[var(--jw-surface-strong)] font-semibold text-[var(--jw-heading)] shadow-[0_10px_22px_-20px_rgba(0,0,0,0.28)] hover:border-[color-mix(in_srgb,var(--jw-accent)_42%,transparent)] hover:bg-[var(--jw-accent-soft)] hover:text-[var(--jw-accent)]"
  const fontSwitchButtonClass = "h-10 flex-1 rounded-lg border-0 bg-transparent text-sm font-semibold text-[var(--jw-muted)] shadow-none hover:bg-[var(--jw-surface-strong)] hover:text-[var(--jw-accent)]"
  const selectedFontSwitchButtonClass = "bg-[var(--jw-accent)] text-[var(--jw-accent-foreground)] shadow-[var(--jw-soft-shadow)] hover:bg-[var(--jw-accent-hover)] hover:text-[var(--jw-accent-foreground)]"

  const renderBackgroundModeIcon = (mode: BackgroundMode) => {
    if (mode === "solid") return <PaintbrushIcon className="h-4 w-4" />
    if (mode === "gradient") return <SparklesIcon className="h-4 w-4" />
    if (mode === "unsplash") return <ImageIcon className="h-4 w-4" />
    return <ImagePlusIcon className="h-4 w-4" />
  }

  const getCanvasPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * width,
      y: ((event.clientY - rect.top) / rect.height) * height,
    }
  }

  const handleCanvasPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(event)
    const bounds = titleBoundsRef.current
    const inTitle =
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height

    if (!inTitle) return
    dragRef.current = {
      active: true,
      offsetX: point.x - titlePosition.x,
      offsetY: point.y - titlePosition.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleCanvasPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return
    const point = getCanvasPoint(event)
    const bounds = titleBoundsRef.current
    setTitlePosition({
      x: Math.max(0, Math.min(width - bounds.width, point.x - dragRef.current.offsetX)),
      y: Math.max(0, Math.min(height - bounds.height, point.y - dragRef.current.offsetY)),
    })
  }

  const handleCanvasPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    dragRef.current.active = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const exportCover = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (typeof articleId !== "number") {
      toast({ variant: "destructive", title: t("imageGeneration.cover.toast.articleRequired") })
      return
    }
    let coverTitle = title.trim()
    if (!coverTitle) {
      toast({ variant: "destructive", title: t("imageGeneration.cover.toast.titleRequired") })
      return
    }

    setIsExportingCover(true)
    const mimeType =
      exportFormat === "jpeg"
        ? "image/jpeg"
        : exportFormat === "webp"
        ? "image/webp"
        : "image/png"
    const extension = exportFormat === "jpeg" ? "jpg" : exportFormat

    try {
      if (needsStandardCoverTitle(coverTitle)) {
        const generatedTitle = await generateStandardTitle({ silent: true })
        if (generatedTitle) {
          coverTitle = generatedTitle
        }
      }

      drawCover(coverTitle)
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => (result ? resolve(result) : reject(new Error("export_failed"))),
          mimeType,
          exportFormat === "png" ? undefined : 0.92
        )
      })
      const filename = `article-cover-${articleId}-${Date.now()}.${extension}`
      const file = new File([blob], filename, { type: mimeType })
      const presigned = await materialsClient.getPresignedUrl(filename, mimeType)

      if ("error" in presigned) {
        throw new Error(presigned.error)
      }

      const uploaded = await uploadFileToPresignedUrl(presigned.upload_url, file, mimeType)
      if (!uploaded) {
        throw new Error("upload_failed")
      }

      const trimmedTitle = coverTitle
      const materialResult = await materialsClient.createMaterial({
        title: `${trimmedTitle} - ${t("imageGeneration.cover.altText")}`,
        material_type: "image",
        content: presigned.file_url,
        article_id: articleId,
      })

      if ("error" in materialResult) {
        throw new Error(materialResult.error)
      }

      const titleResult = await articlesClient.updateArticleMetadata(articleId, {
        title: trimmedTitle,
      })

      if ("error" in titleResult) {
        throw new Error(titleResult.error)
      }

      onArticleTitleUpdated?.(trimmedTitle)
      window.dispatchEvent(new CustomEvent("joyfulwords-insert-cover-image", {
        detail: {
          imageUrl: presigned.file_url,
          title: trimmedTitle,
        },
      }))
      window.dispatchEvent(new CustomEvent("joyfulwords-materials-refresh", {
        detail: { materialType: "image" },
      }))
      setBackgroundMode("material")
      setMaterialQuery("")
      void fetchMaterials("")
      toast({ title: t("imageGeneration.cover.toast.exported") })
    } catch {
      toast({ variant: "destructive", title: t("imageGeneration.cover.toast.exportFailed") })
    } finally {
      setIsExportingCover(false)
    }
  }

  return (
    <>
      <AIFeatureDialogShell
        open={open}
        onOpenChange={onOpenChange}
        title={t("imageGeneration.cover.title")}
        icon={<SparklesIcon className="h-5 w-5 text-[var(--jw-accent)]" />}
        size="large"
        overlayClassName="bg-black/75"
        contentClassName="jw-cover-dialog h-[min(86vh,900px)] w-[min(86vw,1600px)] max-w-[calc(100vw-2rem)] border-border bg-background sm:max-w-[min(86vw,1600px)]"
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <div className="min-w-0 text-xs font-medium text-[var(--jw-muted)]">
              {activeFontTaskId ? t("imageGeneration.cover.activeTask", { id: activeFontTaskId, status: activeFontTaskStatus || "pending" }) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
                <SelectTrigger className={cn(controlInputClass, "w-[132px]")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="jpeg">JPG</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className={cn(subtleButtonClass, "h-10 px-5")}>
                {t("common.cancel")}
              </Button>
              <Button type="button" onClick={exportCover} disabled={isExportingCover} className="h-10 rounded-xl bg-[var(--jw-accent)] px-5 text-[var(--jw-accent-foreground)] shadow-[var(--jw-soft-shadow)] hover:bg-[var(--jw-accent-hover)]">
                {isExportingCover ? (
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <DownloadIcon className="h-4 w-4" />
                )}
                {t("imageGeneration.cover.export")}
              </Button>
            </div>
          </div>
        }
      >
        <div className="jw-cover-layout min-h-0 flex-1 overflow-hidden bg-[var(--jw-surface-muted)]">
          <aside className="min-h-0 overflow-y-auto border-b border-[var(--jw-border)] bg-[var(--jw-surface-muted)] px-4 py-4 lg:border-b-0 lg:border-r">
            <div className={panelCardClass}>
              <div className={panelTitleClass}>
                <PaintbrushIcon className="h-4 w-4 text-[var(--jw-accent)]" />
                {t("imageGeneration.cover.panels.background")}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["solid", "gradient", "unsplash", "material"] as BackgroundMode[]).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    variant="outline"
                    className={cn(modeButtonClass, backgroundMode === mode ? selectedModeButtonClass : "")}
                    onClick={() => {
                      setBackgroundMode(mode)
                      if (mode === "unsplash" && unsplashPhotos.length === 0) {
                        void handleSearchUnsplash()
                      }
                    }}
                  >
                    {renderBackgroundModeIcon(mode)}
                    {t(`imageGeneration.cover.backgroundModes.${mode}`)}
                  </Button>
                ))}
              </div>

              {backgroundMode === "solid" ? (
                <div className="mt-5 space-y-2">
                  <Label>{t("imageGeneration.cover.solidColorLabel")}</Label>
                  <Input type="color" value={solidColor} onChange={(event) => setSolidColor(event.target.value)} className={colorInputClass} />
                </div>
              ) : null}

              {backgroundMode === "gradient" ? (
                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{t("imageGeneration.cover.gradientFromLabel")}</Label>
                      <Input type="color" value={gradientFrom} onChange={(event) => setGradientFrom(event.target.value)} className={colorInputClass} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("imageGeneration.cover.gradientToLabel")}</Label>
                      <Input type="color" value={gradientTo} onChange={(event) => setGradientTo(event.target.value)} className={colorInputClass} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("imageGeneration.cover.gradientDirectionLabel")}</Label>
                    <Select value={gradientDirection} onValueChange={(value) => setGradientDirection(value as GradientDirection)}>
                      <SelectTrigger className={controlInputClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="135">{t("imageGeneration.cover.gradientDirections.diagonal")}</SelectItem>
                        <SelectItem value="90">{t("imageGeneration.cover.gradientDirections.vertical")}</SelectItem>
                        <SelectItem value="180">{t("imageGeneration.cover.gradientDirections.horizontal")}</SelectItem>
                        <SelectItem value="45">{t("imageGeneration.cover.gradientDirections.reverse")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : null}

              {backgroundMode === "unsplash" ? (
                <div className="mt-5 space-y-4">
                  <div className="flex gap-2">
                    <Input value={unsplashQuery} onChange={(event) => setUnsplashQuery(event.target.value)} placeholder={t("imageGeneration.cover.unsplashPlaceholder")} className={controlInputClass} />
                    <Button type="button" onClick={handleSearchUnsplash} disabled={isSearchingUnsplash} className="h-11 shrink-0 rounded-xl bg-[var(--jw-accent)] px-3 text-[var(--jw-accent-foreground)] hover:bg-[var(--jw-accent-hover)]">
                      {isSearchingUnsplash ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {unsplashPhotos.map((photo) => (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => handleSelectUnsplashPhoto(photo)}
                        className={cn(
                          "overflow-hidden rounded-xl border bg-[var(--jw-surface-strong)] text-left shadow-[var(--jw-soft-shadow)] transition hover:border-[color-mix(in_srgb,var(--jw-accent)_48%,transparent)]",
                          backgroundImageUrl === photo.regular_url ? "border-[var(--jw-accent)] ring-2 ring-[color-mix(in_srgb,var(--jw-accent)_18%,transparent)]" : "border-[var(--jw-border)]"
                        )}
                      >
                        <img src={photo.thumb_url} alt={photo.author_name} className="aspect-video w-full object-cover" />
                        <span className="block truncate px-2 py-1 text-[11px] text-[var(--jw-muted)]">
                          {t("imageGeneration.cover.unsplashBy", { name: photo.author_name })}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {backgroundMode === "material" ? (
                <div className="mt-5 space-y-4">
                  <div className="flex gap-2">
                    <Input value={materialQuery} onChange={(event) => setMaterialQuery(event.target.value)} placeholder={t("imageGeneration.cover.materialSearchPlaceholder")} className={controlInputClass} />
                    <Button type="button" onClick={() => void fetchMaterials()} disabled={isLoadingMaterials} className="h-11 shrink-0 rounded-xl bg-[var(--jw-accent)] px-3 text-[var(--jw-accent-foreground)] hover:bg-[var(--jw-accent-hover)]">
                      {isLoadingMaterials ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
                    </Button>
                  </div>
                  {materialLoadError ? (
                    <Alert variant="destructive">
                      <AlertDescription>{t("imageGeneration.cover.materialLoadFailed")}</AlertDescription>
                    </Alert>
                  ) : null}
                  <div className="grid grid-cols-2 gap-2">
                    {materials.map((material) => (
                      <button
                        key={material.id}
                        type="button"
                        onClick={() => setBackgroundImageUrl(material.content)}
                        className={cn(
                          "overflow-hidden rounded-xl border bg-[var(--jw-surface-strong)] text-left shadow-[var(--jw-soft-shadow)] transition hover:border-[color-mix(in_srgb,var(--jw-accent)_48%,transparent)]",
                          backgroundImageUrl === material.content ? "border-[var(--jw-accent)] ring-2 ring-[color-mix(in_srgb,var(--jw-accent)_18%,transparent)]" : "border-[var(--jw-border)]"
                        )}
                      >
                        <img src={material.content} alt={material.title} className="aspect-video w-full object-cover" />
                        <span className="block truncate px-2 py-1 text-[11px] text-[var(--jw-muted)]">{material.title}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setIsImageCreatorOpen(true)}
                      className="flex aspect-video items-center justify-center gap-2 rounded-xl border border-dashed border-[color-mix(in_srgb,var(--jw-accent)_46%,transparent)] bg-[var(--jw-accent-soft)] text-sm font-semibold text-[var(--jw-accent)] transition hover:bg-[color-mix(in_srgb,var(--jw-accent-soft)_70%,var(--jw-surface-strong))]"
                    >
                      <ImagePlusIcon className="h-4 w-4" />
                      {t("imageGeneration.cover.aiImage")}
                    </button>
                  </div>
                  <Button type="button" variant="outline" onClick={() => void fetchMaterials()} disabled={isLoadingMaterials} className={cn(subtleButtonClass, "w-full")}>
                    {isLoadingMaterials ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <RefreshCwIcon className="h-4 w-4" />}
                    {t("imageGeneration.cover.refreshMaterials")}
                  </Button>
                </div>
              ) : null}
            </div>
          </aside>
          <div className="flex min-h-0 flex-col gap-3 overflow-hidden bg-[var(--jw-surface-muted)] px-5 py-4">
            <div className="flex items-center justify-between rounded-2xl border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] px-4 py-3 text-xs font-medium text-[var(--jw-muted)] shadow-[0_16px_40px_-36px_rgba(0,0,0,0.34)]">
              <div className="flex items-center gap-2">
                <SparklesIcon className="h-4 w-4 text-[var(--jw-accent)]" />
                <span>{t("imageGeneration.cover.canvasStatus")}</span>
              </div>
              <span className="font-mono text-[var(--jw-heading)]">{width} x {height}</span>
            </div>
            <div className="jw-cover-preview-stage flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-2xl border border-[var(--jw-border)] p-5 shadow-inner">
              <canvas
                ref={canvasRef}
                className="max-h-full max-w-full cursor-move rounded-xl bg-[var(--jw-surface-strong)] shadow-2xl shadow-slate-950/10 ring-1 ring-[var(--jw-border)]"
                style={{ aspectRatio: `${width} / ${height}` }}
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={handleCanvasPointerUp}
                onPointerCancel={handleCanvasPointerUp}
              />
            </div>
          </div>

          <div className="min-h-0 space-y-4 overflow-y-auto border-t border-[var(--jw-border)] bg-[var(--jw-surface-muted)] px-4 py-4 lg:border-l lg:border-t-0">
            {typeof articleId !== "number" ? (
              <Alert variant="destructive">
                <AlertDescription>{t("imageGeneration.cover.articleRequired")}</AlertDescription>
              </Alert>
            ) : null}

            <section className={inspectorSectionClass}>
              <div className={inspectorHeaderClass}>
                <TypeIcon className="h-4 w-4 text-[var(--jw-accent)]" />
                {t("imageGeneration.cover.panels.title")}
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="cover-title" className={fieldLabelClass}>{t("imageGeneration.cover.titleLabel")}</Label>
                <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-2">
                  <Input
                    id="cover-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={t("imageGeneration.cover.titlePlaceholder")}
                    className={controlInputClass}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateTitle}
                    disabled={isGeneratingTitle}
                    className={cn(subtleButtonClass, "px-2 text-sm")}
                  >
                    {isGeneratingTitle ? (
                      <LoaderIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <WandSparklesIcon className="h-4 w-4" />
                    )}
                    {t("imageGeneration.cover.generateTitle")}
                  </Button>
                </div>
              </div>
            </section>

            <section className={inspectorSectionClass}>
              <div className={inspectorHeaderClass}>
                <SparklesIcon className="h-4 w-4 text-[var(--jw-accent)]" />
                {t("imageGeneration.cover.fontFamilyLabel")}
              </div>
              <div className="space-y-4">
                <div className="flex rounded-lg bg-[color-mix(in_srgb,var(--jw-surface-muted)_82%,transparent)] p-1">
                  <Button
                    type="button"
                    variant="outline"
                    aria-pressed={fontMode === "preset"}
                    className={cn(fontSwitchButtonClass, fontMode === "preset" ? selectedFontSwitchButtonClass : "")}
                    onClick={() => setFontMode("preset")}
                  >
                    <TypeIcon className="h-4 w-4" />
                    {t("imageGeneration.cover.fontModes.preset")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    aria-pressed={fontMode === "custom"}
                    className={cn(fontSwitchButtonClass, fontMode === "custom" ? selectedFontSwitchButtonClass : "")}
                    onClick={() => setFontMode("custom")}
                  >
                    <WandSparklesIcon className="h-4 w-4" />
                    {t("imageGeneration.cover.fontModes.custom")}
                  </Button>
                </div>

                {fontMode === "preset" ? (
                  <div className="space-y-2.5">
                    <Label className={fieldLabelClass}>{t("imageGeneration.cover.fontFamilyLabel")}</Label>
                    <Select value={fontFamilyId} onValueChange={setFontFamilyId}>
                      <SelectTrigger className={controlInputClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((font) => (
                          <SelectItem key={font.id} value={font.id}>
                            {t(`imageGeneration.cover.fonts.${font.id}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {(["shock", "handwriting", "cartoon"] as const).map((preset) => (
                        <Button
                          key={preset}
                          type="button"
                          variant="outline"
                          className={subtleButtonClass}
                          onClick={() => setCustomFontDescription(t(`imageGeneration.cover.customFontPresets.${preset}Prompt`))}
                        >
                          {t(`imageGeneration.cover.customFontPresets.${preset}`)}
                        </Button>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom-font-description" className={fieldLabelClass}>{t("imageGeneration.cover.customFontDescriptionLabel")}</Label>
                      <Textarea
                        id="custom-font-description"
                        value={customFontDescription}
                        onChange={(event) => setCustomFontDescription(event.target.value)}
                        placeholder={t("imageGeneration.cover.customFontDescriptionPlaceholder")}
                        className="min-h-24 resize-none rounded-xl border-[var(--jw-border)] bg-[var(--jw-surface-strong)] text-[var(--jw-heading)] shadow-[var(--jw-soft-shadow)] focus-visible:ring-[color-mix(in_srgb,var(--jw-accent)_22%,transparent)]"
                      />
                    </div>
                    {modelLoadError ? (
                      <Alert variant="destructive">
                        <AlertDescription>{t("imageGeneration.model.fetchFailed")}</AlertDescription>
                      </Alert>
                    ) : null}
                    <ModelSelector
                      selectedModel={selectedModel}
                      availableModels={availableModels}
                      isLoading={isLoadingModels}
                      onModelChange={setSelectedModel}
                    />
                    <Button
                      type="button"
                      onClick={handleGenerateFontPreview}
                      disabled={isGeneratingFont || isLoadingModels}
                      className="h-10 w-full rounded-xl bg-[var(--jw-accent)] font-semibold text-[var(--jw-accent-foreground)] shadow-[var(--jw-soft-shadow)] hover:bg-[var(--jw-accent-hover)]"
                    >
                      {isGeneratingFont ? (
                        <LoaderIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImagePlusIcon className="h-4 w-4" />
                      )}
                      {t("imageGeneration.cover.generateFont")}
                    </Button>
                  </div>
                )}
              </div>
            </section>

            <section className={inspectorSectionClass}>
              <div className={inspectorHeaderClass}>
                <AlignCenterHorizontalIcon className="h-4 w-4 text-[var(--jw-accent)]" />
                {t("imageGeneration.cover.positionLabel")}
              </div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className={fieldLabelClass}>{t("imageGeneration.cover.fontSizeLabel")}</Label>
                    <span className="text-xs text-[var(--jw-muted)]">{fontSize}px</span>
                  </div>
                  <Slider className="py-1" value={[fontSize]} min={32} max={180} step={1} onValueChange={([value]) => setFontSize(value)} />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className={fieldLabelClass}>{t("imageGeneration.cover.fontWeightLabel")}</Label>
                    <span className="text-xs text-[var(--jw-muted)]">{fontWeight}</span>
                  </div>
                  <Slider className="py-1" value={[fontWeight]} min={300} max={900} step={100} onValueChange={([value]) => setFontWeight(value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className={fieldLabelClass}>{t("imageGeneration.cover.textColorLabel")}</Label>
                    <Input type="color" value={titleColor} onChange={(event) => setTitleColor(event.target.value)} className={colorInputClass} />
                  </div>
                  <div className="space-y-2">
                    <Label className={fieldLabelClass}>{t("imageGeneration.cover.positionLabel")}</Label>
                    <Button type="button" variant="outline" onClick={() => setTitlePosition(DEFAULT_TITLE_POSITION)} className={cn(subtleButtonClass, "w-full")}>
                      <RefreshCwIcon className="h-4 w-4" />
                      {t("imageGeneration.cover.resetPosition")}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" onClick={() => handleTitlePositionShortcut("centerX")} className={subtleButtonClass}>
                    <AlignCenterHorizontalIcon className="h-4 w-4" />
                    {t("imageGeneration.cover.positionActions.centerX")}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => handleTitlePositionShortcut("centerY")} className={subtleButtonClass}>
                    <AlignCenterVerticalIcon className="h-4 w-4" />
                    {t("imageGeneration.cover.positionActions.centerY")}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => handleTitlePositionShortcut("left")} className={subtleButtonClass}>
                    <AlignHorizontalJustifyStartIcon className="h-4 w-4" />
                    {t("imageGeneration.cover.positionActions.left")}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => handleTitlePositionShortcut("right")} className={subtleButtonClass}>
                    <AlignHorizontalJustifyEndIcon className="h-4 w-4" />
                    {t("imageGeneration.cover.positionActions.right")}
                  </Button>
                </div>
              </div>
            </section>

            <section className={inspectorSectionClass}>
              <div className={inspectorHeaderClass}>
                <CropIcon className="h-4 w-4 text-[var(--jw-accent)]" />
                {t("imageGeneration.cover.panels.crop")}
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className={fieldLabelClass}>{t("imageGeneration.cover.platformLabel")}</Label>
                  <Select value={presetId} onValueChange={handlePresetChange}>
                    <SelectTrigger className={controlInputClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COVER_PRESETS.map((preset) => (
                        <SelectItem key={preset.id} value={preset.id}>
                          {t(`imageGeneration.cover.presets.${preset.id}`)} · {preset.width}x{preset.height}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">{t("imageGeneration.cover.presets.custom")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="cover-width-inline" className={fieldLabelClass}>{t("imageGeneration.cover.widthLabel")}</Label>
                    <Input
                      id="cover-width-inline"
                      type="number"
                      min={256}
                      max={4096}
                      value={width}
                      className={controlInputClass}
                      onChange={(event) => {
                        setPresetId("custom")
                        setWidth(Number(event.target.value) || 256)
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cover-height-inline" className={fieldLabelClass}>{t("imageGeneration.cover.heightLabel")}</Label>
                    <Input
                      id="cover-height-inline"
                      type="number"
                      min={256}
                      max={4096}
                      value={height}
                      className={controlInputClass}
                      onChange={(event) => {
                        setPresetId("custom")
                        setHeight(Number(event.target.value) || 256)
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </AIFeatureDialogShell>

      <AIFeatureDialogShell
        open={isImageCreatorOpen}
        onOpenChange={setIsImageCreatorOpen}
        title={t("imageGeneration.cover.imageCreatorTitle")}
        icon={<ImagePlusIcon className="h-5 w-5 text-primary" />}
        size="compact"
      >
        <CreatorMode
          articleId={articleId}
          preferredModelKeywords={NANO_BANANA_FAST_MODEL_KEYWORDS}
          autoCopyToMaterials
          onGenerationComplete={() => {
            toast({ title: t("imageGeneration.cover.toast.aiImageGenerated") })
            setIsImageCreatorOpen(false)
            setBackgroundMode("material")
            void fetchMaterials("")
          }}
        />
      </AIFeatureDialogShell>
    </>
  )
}
