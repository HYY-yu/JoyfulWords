"use client"
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  FileTextIcon,
  LanguagesIcon,
  LayoutTemplateIcon,
  Loader2Icon,
  MousePointer2Icon,
  PaletteIcon,
  SparklesIcon,
  WandSparklesIcon,
} from "lucide-react"
import { AIFeatureDialogShell } from "@/components/ui/ai/ai-feature-dialog-shell"
import { Button } from "@/components/ui/base/button"
import { Label } from "@/components/ui/base/label"
import { Textarea } from "@/components/ui/base/textarea"
import { Alert, AlertDescription } from "@/components/ui/base/alert"
import { ScrollArea } from "@/components/ui/base/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { useAsyncTaskToast } from "@/hooks/use-async-task-toast"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { infographicsClient } from "@/lib/api/infographics/client"
import {
  parseInfographicImageUrls,
  type GenerateInfographicFromArticleRequest,
  type GenerateInfographicRequest,
  type InfographicCardStyle,
  type InfographicDecorationLevel,
  type InfographicLanguage,
  type InfographicLogDetailResponse,
  type InfographicScreenOrientation,
} from "@/lib/api/infographics/types"
import {
  useInfographicBatchPolling,
  useInfographicPolling,
  type InfographicPollingState,
} from "@/lib/hooks/use-infographic-polling"
import { cn } from "@/lib/utils"

interface InfographicDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  articleId?: number | null
  selectedText: string
}

const STYLE_PREVIEWS: Array<{
  value: InfographicCardStyle
  assetPath: string
}> = [
  { value: "professional", assetPath: "/images/infographics/styles/professional.png" },
  { value: "rustic", assetPath: "/images/infographics/styles/rustic.png" },
  { value: "academic", assetPath: "/images/infographics/styles/academic.png" },
  { value: "handdrawn", assetPath: "/images/infographics/styles/handdrawn.png" },
  { value: "magazine", assetPath: "/images/infographics/styles/magazine.png" },
  { value: "minimal", assetPath: "/images/infographics/styles/minimal.png" },
  { value: "fresh", assetPath: "/images/infographics/styles/fresh.png" },
]

const ORIENTATION_OPTIONS: InfographicScreenOrientation[] = ["square", "landscape", "portrait"]
const LANGUAGE_OPTIONS: InfographicLanguage[] = ["zh", "en"]
const DECORATION_OPTIONS: InfographicDecorationLevel[] = ["simple", "moderate", "rich"]
const SELECTION_TEXT_LIMIT = 300
const MAX_IMAGE_OPTIONS = [1, 2, 3, 4, 5] as const
const SOFT_NATIVE_SCROLLBAR_CLASS =
  "[scrollbar-color:color-mix(in_oklch,var(--primary)_18%,transparent)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-0.5 [&::-webkit-scrollbar]:w-0.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-0 [&::-webkit-scrollbar-thumb]:bg-primary/12 hover:[&::-webkit-scrollbar-thumb]:bg-primary/28"
const SOFT_RADIX_SCROLLBAR_CLASS =
  "[&_[data-slot=scroll-area-scrollbar]]:w-0.5 [&_[data-slot=scroll-area-scrollbar]]:bg-transparent [&_[data-slot=scroll-area-scrollbar]]:opacity-25 hover:[&_[data-slot=scroll-area-scrollbar]]:opacity-60 [&_[data-slot=scroll-area-thumb]]:bg-primary/18 hover:[&_[data-slot=scroll-area-thumb]]:bg-primary/32"

type InfographicSourceMode = "selection" | "article"

type InfographicFormState = {
  cardStyle: InfographicCardStyle
  screenOrientation: InfographicScreenOrientation
  language: InfographicLanguage
  decorationLevel: InfographicDecorationLevel
  maxImages: number
  userCustom: string
}

type InfographicResultImageItem = {
  key: string
  url: string
  detail: InfographicLogDetailResponse | null
}

const DEFAULT_FORM_STATE_BY_LOCALE: Record<InfographicLanguage, InfographicFormState> = {
  zh: {
    cardStyle: "professional",
    screenOrientation: "square",
    language: "zh",
    decorationLevel: "moderate",
    maxImages: 5,
    userCustom: "",
  },
  en: {
    cardStyle: "professional",
    screenOrientation: "square",
    language: "en",
    decorationLevel: "moderate",
    maxImages: 5,
    userCustom: "",
  },
}

export function InfographicDialog({
  open,
  onOpenChange,
  articleId,
  selectedText,
}: InfographicDialogProps) {
  const { locale, t } = useTranslation()
  const { toast } = useToast()
  const taskToast = useAsyncTaskToast()
  const {
    currentLogId,
    detail,
    errorMessage: pollingErrorMessage,
    state: pollingState,
    markSubmitting,
    startPolling,
    reset,
  } = useInfographicPolling()
  const {
    details: batchDetails,
    errorMessage: batchPollingErrorMessage,
    progress: batchProgress,
    state: batchPollingState,
    markSubmitting: markBatchSubmitting,
    startPolling: startBatchPolling,
    reset: resetBatch,
  } = useInfographicBatchPolling()

  const [formState, setFormState] = useState<InfographicFormState>(
    DEFAULT_FORM_STATE_BY_LOCALE[locale]
  )
  const [sourceMode, setSourceMode] = useState<InfographicSourceMode>("article")
  const [resultMode, setResultMode] = useState<InfographicSourceMode>("article")
  const [selectionTextDraft, setSelectionTextDraft] = useState("")
  const [copyingToMaterials, setCopyingToMaterials] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [requestErrorMessage, setRequestErrorMessage] = useState<string | null>(null)
  const lastAnnouncedPollingStateRef = useRef<InfographicPollingState>("idle")
  const styleListRef = useRef<HTMLDivElement | null>(null)
  const styleButtonRefs = useRef<Partial<Record<InfographicCardStyle, HTMLButtonElement | null>>>({})
  const taskLabel = t("tiptapEditor.aiPanel.infographic")
  const submittingToastTitle = t("asyncTaskToast.submittingTitle", { task: taskLabel })
  const submittingToastDescription = t("asyncTaskToast.submittingDescription", { task: taskLabel })
  const pollingToastTitle = t("asyncTaskToast.pollingTitle", { task: taskLabel })
  const pollingToastDescription = t("asyncTaskToast.pollingDescription", { task: taskLabel })

  useEffect(() => {
    if (!open) {
      reset()
      resetBatch()
      setSelectionTextDraft("")
      setCopyingToMaterials(false)
      setActiveImageIndex(0)
      setRequestErrorMessage(null)
      lastAnnouncedPollingStateRef.current = "idle"
      return
    }

    const nextSelectedText = selectedText.trim()
    setSelectionTextDraft(nextSelectedText)
    setFormState(DEFAULT_FORM_STATE_BY_LOCALE[locale])
    setSourceMode(nextSelectedText ? "selection" : "article")
    setResultMode(nextSelectedText ? "selection" : "article")
    setCopyingToMaterials(false)
    setActiveImageIndex(0)
    setRequestErrorMessage(null)
    lastAnnouncedPollingStateRef.current = "idle"
    reset()
    resetBatch()
  }, [locale, open, reset, resetBatch, selectedText])

  const singleImageUrls = useMemo(() => {
    return parseInfographicImageUrls(detail?.image_urls)
  }, [detail?.image_urls])

  const singleImageItems = useMemo<InfographicResultImageItem[]>(() => {
    return singleImageUrls.map((url, index) => ({
      key: `single-${detail?.id ?? "pending"}-${index}`,
      url,
      detail,
    }))
  }, [detail, singleImageUrls])

  const batchImageItems = useMemo<InfographicResultImageItem[]>(() => {
    return batchDetails.flatMap((batchDetail) =>
      parseInfographicImageUrls(batchDetail.image_urls).map((url, index) => ({
        key: `batch-${batchDetail.id}-${index}`,
        url,
        detail: batchDetail,
      }))
    )
  }, [batchDetails])

  const resultImageItems = resultMode === "article" ? batchImageItems : singleImageItems
  const resultPollingState = resultMode === "article" ? batchPollingState : pollingState
  const resultPollingErrorMessage =
    resultMode === "article" ? batchPollingErrorMessage : pollingErrorMessage

  useEffect(() => {
    if (activeImageIndex >= resultImageItems.length) {
      setActiveImageIndex(0)
    }
  }, [activeImageIndex, resultImageItems.length])

  const isSelectionGenerating =
    pollingState === "submitting" || pollingState === "pending" || pollingState === "processing"
  const isArticleGenerating =
    batchPollingState === "submitting" || batchPollingState === "pending" || batchPollingState === "processing"
  const isGenerating = sourceMode === "article" ? isArticleGenerating : isSelectionGenerating
  const canCopyToMaterials =
    resultMode === "article"
      ? batchPollingState === "success" &&
        batchDetails.some((batchDetail) => batchDetail.status === "success" && parseInfographicImageUrls(batchDetail.image_urls).length > 0) &&
        !copyingToMaterials
      : pollingState === "success" && currentLogId !== null && singleImageUrls.length > 0 && !copyingToMaterials

  const activeImageItem = resultImageItems[activeImageIndex] ?? null
  const selectedTextPreview = selectionTextDraft.trim()
  const selectedTextLength = selectedTextPreview.length
  const hasSelectedText = selectedTextLength > 0
  const isSelectionTooLong = selectedTextLength > SELECTION_TEXT_LIMIT
  const isArticleMode = sourceMode === "article"
  const canGenerateSelection =
    sourceMode === "selection" && hasSelectedText && !isSelectionTooLong && !isGenerating
  const canSubmitArticleAnalysis =
    sourceMode === "article" && typeof articleId === "number" && !isGenerating
  const selectedStyle = STYLE_PREVIEWS.find((style) => style.value === formState.cardStyle) ?? STYLE_PREVIEWS[0]

  const statusText = (() => {
    if (resultMode === "article" && (batchPollingState === "pending" || batchPollingState === "processing")) {
      return t("infographicDialog.status.batchProcessing", {
        completed: batchProgress.completed,
        total: batchProgress.total,
      })
    }
    if (resultPollingState === "pending" || resultPollingState === "processing") {
      return t(`infographicDialog.status.${resultPollingState}`)
    }
    if (resultMode === "article" && resultPollingState === "success") {
      return t("infographicDialog.status.batchSuccess", {
        success: batchProgress.success,
        total: batchProgress.total,
      })
    }
    if (resultPollingState === "success" || resultPollingState === "failed") {
      return t(`infographicDialog.status.${resultPollingState}`)
    }
    return resultMode === "article" || isArticleMode
      ? t("infographicDialog.articleResultHint")
      : t("infographicDialog.resultHint")
  })()

  const errorMessage =
    requestErrorMessage ||
    (resultPollingErrorMessage === "polling_timeout"
      ? t("infographicDialog.toast.pollingTimeout")
      : resultPollingErrorMessage)

  useEffect(() => {
    if (pollingState === lastAnnouncedPollingStateRef.current) return

    lastAnnouncedPollingStateRef.current = pollingState

    if (pollingState === "success") {
      taskToast.showSuccess({
        title: t("infographicDialog.status.success"),
      })
      return
    }

    if (pollingState === "failed") {
      taskToast.showFailure({
        title: t("infographicDialog.status.failed"),
      })
    }
  }, [pollingState, t, taskToast])

  useEffect(() => {
    if (batchPollingState === lastAnnouncedPollingStateRef.current) return

    lastAnnouncedPollingStateRef.current = batchPollingState

    if (batchPollingState === "success") {
      taskToast.showSuccess({
        title: t("infographicDialog.status.batchSuccess", {
          success: batchProgress.success,
          total: batchProgress.total,
        }),
      })
      return
    }

    if (batchPollingState === "failed") {
      taskToast.showFailure({
        title: t("infographicDialog.status.failed"),
      })
    }
  }, [batchPollingState, batchProgress.success, batchProgress.total, t, taskToast])

  const handleGenerate = async () => {
    if (sourceMode === "article") {
      if (typeof articleId !== "number") {
        toast({
          variant: "destructive",
          title: t("infographicDialog.toast.articleRequired"),
          description: t("infographicDialog.toast.articleRequiredDesc"),
        })
        return
      }

      const request: GenerateInfographicFromArticleRequest = {
        article_id: articleId,
        max_count: formState.maxImages,
        card_style: formState.cardStyle,
        screen_orientation: formState.screenOrientation,
        language: formState.language,
        decoration_level: formState.decorationLevel,
      }

      setResultMode("article")
      setRequestErrorMessage(null)
      lastAnnouncedPollingStateRef.current = "idle"
      reset()
      markBatchSubmitting()
      taskToast.showSubmitting({
        title: submittingToastTitle,
        description: submittingToastDescription,
      })

      try {
        const result = await infographicsClient.generateFromArticle(request)

        if ("error" in result) {
          console.error("[InfographicDialog] Failed to create article infographic batch:", {
            articleId,
            error: result.error,
          })
          resetBatch()
          setRequestErrorMessage(String(result.error))
          taskToast.showFailure({
            title: t("infographicDialog.toast.createFailed"),
          })
          return
        }

        if (result.count === 0 || result.log_ids.length === 0) {
          console.info("[InfographicDialog] Article infographic batch returned no candidates:", {
            articleId,
            batchId: result.batch_id,
            count: result.count,
          })
          resetBatch()
          toast({
            title: t("infographicDialog.toast.noArticleImages"),
            description: t("infographicDialog.toast.noArticleImagesDesc"),
          })
          return
        }

        taskToast.showPolling({
          title: pollingToastTitle,
          description: t("infographicDialog.toast.batchPolling", {
            count: result.count,
          }),
        })

        await startBatchPolling(result.log_ids, result.batch_id)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        console.error("[InfographicDialog] Unexpected article infographic batch creation error:", {
          articleId,
          error: message,
        })
        resetBatch()
        setRequestErrorMessage(message)
        taskToast.showFailure({
          title: t("infographicDialog.toast.createFailed"),
        })
      }
      return
    }

    if (!hasSelectedText) {
      toast({
        variant: "destructive",
        title: t("infographicDialog.toast.selectTextFirst"),
        description: t("infographicDialog.toast.selectTextFirstDesc"),
      })
      return
    }

    if (isSelectionTooLong) {
      toast({
        variant: "destructive",
        title: t("infographicDialog.toast.selectionTooLong"),
        description: t("infographicDialog.toast.selectionTooLongDesc", {
          limit: SELECTION_TEXT_LIMIT,
          count: selectedTextLength,
        }),
      })
      return
    }

    setResultMode("selection")
    lastAnnouncedPollingStateRef.current = "idle"
    const request: GenerateInfographicRequest = {
      text: selectedTextPreview,
      article_id: articleId ?? 0,
      card_style: formState.cardStyle,
      screen_orientation: formState.screenOrientation,
      language: formState.language,
      decoration_level: formState.decorationLevel,
      user_custom: formState.userCustom.trim() || undefined,
    }

    setRequestErrorMessage(null)
    resetBatch()
    markSubmitting()
    taskToast.showSubmitting({
      title: submittingToastTitle,
      description: submittingToastDescription,
    })

    try {
      const result = await infographicsClient.generate(request)

      if ("error" in result) {
        console.error("[InfographicDialog] Failed to create infographic:", {
          error: result.error,
        })
        reset()
        setRequestErrorMessage(String(result.error))
        taskToast.showFailure({
          title: t("infographicDialog.toast.createFailed"),
        })
        return
      }

      taskToast.showPolling({
        title: pollingToastTitle,
        description: pollingToastDescription,
      })

      await startPolling(result.log_id)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      console.error("[InfographicDialog] Unexpected infographic creation error:", {
        error: message,
      })
      reset()
      setRequestErrorMessage(message)
      taskToast.showFailure({
        title: t("infographicDialog.toast.createFailed"),
      })
    }
  }

  const handleCopyToMaterials = async () => {
    const successfulBatchLogIds = batchDetails
      .filter((batchDetail) => batchDetail.status === "success" && parseInfographicImageUrls(batchDetail.image_urls).length > 0)
      .map((batchDetail) => batchDetail.id)

    if (resultMode === "article") {
      if (successfulBatchLogIds.length === 0) {
        return
      }

      try {
        setCopyingToMaterials(true)
        const results = await Promise.all(
          successfulBatchLogIds.map(async (logId) => ({
            logId,
            result: await infographicsClient.copyToMaterials(logId, articleId ?? undefined),
          }))
        )
        const failedLogIds: number[] = []
        const successLogIds: number[] = []
        let copiedCount = 0

        results.forEach(({ logId, result }) => {
          if ("error" in result) {
            failedLogIds.push(logId)
            return
          }

          successLogIds.push(logId)
          copiedCount += result.count
        })

        if (failedLogIds.length > 0) {
          console.warn("[InfographicDialog] Partially failed to copy article infographic batch to materials:", {
            articleId,
            failedLogIds,
            successLogIds,
          })
          toast({
            variant: copiedCount > 0 ? "default" : "destructive",
            title:
              copiedCount > 0
                ? t("infographicDialog.toast.copyPartialSuccess", { count: copiedCount })
                : t("infographicDialog.toast.copyFailed"),
          })
          return
        }

        toast({
          title: t("infographicDialog.toast.copySuccess", { count: copiedCount }),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        console.error("[InfographicDialog] Unexpected batch copy-to-materials error:", {
          articleId,
          logIds: successfulBatchLogIds,
          error: message,
        })
        toast({
          variant: "destructive",
          title: t("infographicDialog.toast.copyFailed"),
        })
      } finally {
        setCopyingToMaterials(false)
      }
      return
    }

    if (!currentLogId) {
      return
    }

    try {
      setCopyingToMaterials(true)
      const result = await infographicsClient.copyToMaterials(
        currentLogId,
        articleId ?? undefined
      )

      if ("error" in result) {
        console.error("[InfographicDialog] Failed to copy infographic to materials:", {
          logId: currentLogId,
          error: result.error,
        })
        toast({
          variant: "destructive",
          title: t("infographicDialog.toast.copyFailed"),
        })
        return
      }

      toast({
        title: t("infographicDialog.toast.copySuccess", { count: result.count }),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      console.error("[InfographicDialog] Unexpected copy-to-materials error:", {
        logId: currentLogId,
        error: message,
      })
      toast({
        variant: "destructive",
        title: t("infographicDialog.toast.copyFailed"),
      })
    } finally {
      setCopyingToMaterials(false)
    }
  }

  const handleSelectAdjacentStyle = (direction: -1 | 1) => {
    const currentIndex = STYLE_PREVIEWS.findIndex((style) => style.value === formState.cardStyle)
    const normalizedIndex = currentIndex >= 0 ? currentIndex : 0
    const nextIndex = (normalizedIndex + direction + STYLE_PREVIEWS.length) % STYLE_PREVIEWS.length
    const isWrappingForward = direction > 0 && normalizedIndex === STYLE_PREVIEWS.length - 1
    const isWrappingBackward = direction < 0 && normalizedIndex === 0
    const styleList = styleListRef.current
    const currentButton = styleButtonRefs.current[STYLE_PREVIEWS[normalizedIndex].value]
    const nextButton = styleButtonRefs.current[STYLE_PREVIEWS[nextIndex].value]

    if (styleList) {
      const hasVerticalOverflow = styleList.scrollHeight > styleList.clientHeight + 1
      const hasHorizontalOverflow = styleList.scrollWidth > styleList.clientWidth + 1

      if (isWrappingForward || isWrappingBackward) {
        styleList.scrollTo({
          top: isWrappingForward ? 0 : styleList.scrollHeight,
          left: isWrappingForward ? 0 : styleList.scrollWidth,
          behavior: "smooth",
        })
      } else {
        const verticalDistance =
          currentButton && nextButton
            ? Math.abs(nextButton.offsetTop - currentButton.offsetTop)
            : (currentButton?.offsetHeight ?? nextButton?.offsetHeight ?? 44) + 8
        const horizontalDistance =
          currentButton && nextButton
            ? Math.abs(nextButton.offsetLeft - currentButton.offsetLeft)
            : (currentButton?.offsetWidth ?? nextButton?.offsetWidth ?? 128) + 8

        styleList.scrollBy({
          top: hasVerticalOverflow ? direction * verticalDistance : 0,
          left: hasHorizontalOverflow ? direction * horizontalDistance : 0,
          behavior: "smooth",
        })
      }
    }

    setFormState((prev) => ({
      ...prev,
      cardStyle: STYLE_PREVIEWS[nextIndex].value,
    }))
  }

  return (
    <AIFeatureDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("infographicDialog.title")}
      description={t("infographicDialog.description")}
      size="compact"
      footer={
        <div className="flex w-full justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("infographicDialog.close")}
          </Button>
        </div>
      }
    >
      <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(500px,0.86fr)_minmax(460px,1fr)] xl:grid-cols-[minmax(540px,0.82fr)_minmax(560px,1fr)]">
        <ScrollArea
          className={cn(
            "min-h-0 border-b bg-background lg:border-r lg:border-b-0",
            SOFT_RADIX_SCROLLBAR_CLASS
          )}
        >
          <div className="space-y-3.5 p-4 xl:p-5">
            <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b bg-muted/25 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    1
                  </span>
                  <Label className="flex items-center gap-2 text-sm font-semibold">
                    <FileTextIcon className="h-4 w-4 text-primary" />
                    {t("infographicDialog.sourceLabel")}
                  </Label>
                </div>
                {sourceMode === "selection" ? (
                  <span
                    className={cn(
                      "rounded-full bg-background px-2.5 py-1 text-xs",
                      isSelectionTooLong ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    {t("infographicDialog.selectedTextCount", {
                      count: selectedTextLength,
                      limit: SELECTION_TEXT_LIMIT,
                    })}
                  </span>
                ) : null}
              </div>
              <div className="space-y-3 p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => hasSelectedText && setSourceMode("selection")}
                    disabled={!hasSelectedText}
                    className={cn(
                      "flex min-h-20 items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                      sourceMode === "selection"
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-muted/15 hover:bg-muted/35",
                      !hasSelectedText && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <MousePointer2Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {t("infographicDialog.selectionMode")}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                        {t("infographicDialog.selectionModeDesc", {
                          limit: SELECTION_TEXT_LIMIT,
                        })}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSourceMode("article")}
                    className={cn(
                      "flex min-h-20 items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                      sourceMode === "article"
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-muted/15 hover:bg-muted/35"
                    )}
                  >
                    <FileTextIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {t("infographicDialog.articleMode")}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                        {t("infographicDialog.articleModeDesc")}
                      </span>
                    </span>
                  </button>
                </div>

                {sourceMode === "selection" ? (
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        {t("infographicDialog.selectedTextLabel")}
                      </Label>
                      <span
                        className={cn(
                          "text-xs",
                          isSelectionTooLong ? "font-medium text-destructive" : "text-muted-foreground"
                        )}
                      >
                        {t("infographicDialog.selectedTextCount", {
                          count: selectedTextLength,
                          limit: SELECTION_TEXT_LIMIT,
                        })}
                      </span>
                    </div>
                    <Textarea
                      value={selectionTextDraft}
                      onChange={(event) => setSelectionTextDraft(event.target.value)}
                      placeholder={t("infographicDialog.selectedTextPlaceholder")}
                      className={cn(
                        "mt-2 h-24 max-h-24 min-h-24 resize-none overflow-y-auto border-border/70 bg-background text-sm leading-relaxed shadow-none [field-sizing:fixed]",
                        isSelectionTooLong && "border-destructive/50 bg-destructive/5 text-destructive",
                        SOFT_NATIVE_SCROLLBAR_CLASS
                      )}
                    />
                    <p
                      className={cn(
                        "mt-2 text-xs leading-relaxed",
                        isSelectionTooLong ? "text-destructive" : "text-muted-foreground"
                      )}
                    >
                      {isSelectionTooLong
                        ? t("infographicDialog.selectedTextTooLongHint", {
                            limit: SELECTION_TEXT_LIMIT,
                            count: selectedTextLength,
                          })
                        : t("infographicDialog.selectedTextHint", {
                            limit: SELECTION_TEXT_LIMIT,
                          })}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Label className="text-sm font-semibold">
                        {t("infographicDialog.maxImagesLabel")}
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {t("infographicDialog.maxImagesValue", {
                          count: formState.maxImages,
                        })}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-5 rounded-lg border border-border/70 bg-background p-1">
                      {MAX_IMAGE_OPTIONS.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setFormState((prev) => ({ ...prev, maxImages: value }))
                          }
                          className={cn(
                            "h-9 min-w-0 rounded-md px-1 text-xs font-medium transition-colors sm:text-[13px]",
                            formState.maxImages === value
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {t("infographicDialog.maxImagesHint")}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b bg-muted/25 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    2
                  </span>
                  <Label className="flex items-center gap-2 text-sm font-semibold">
                    <PaletteIcon className="h-4 w-4 text-primary" />
                    {t("infographicDialog.styleLabel")}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {t(`infographicDialog.styles.${selectedStyle.value}.title`)}
                  </span>
                  <div className="flex rounded-lg border bg-background p-0.5">
                    <button
                      type="button"
                      aria-label={locale === "zh" ? "上一个视觉风格" : "Previous visual style"}
                      onClick={() => handleSelectAdjacentStyle(-1)}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <ChevronUpIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={locale === "zh" ? "下一个视觉风格" : "Next visual style"}
                      onClick={() => handleSelectAdjacentStyle(1)}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <ChevronDownIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid items-stretch gap-4 p-3 xl:grid-cols-[140px_minmax(0,1fr)]">
                <div
                  ref={styleListRef}
                  className={cn(
                    "flex max-w-full gap-2 overflow-x-auto pb-1 xl:grid xl:h-full xl:max-h-none xl:grid-cols-1 xl:overflow-x-hidden xl:overflow-y-auto xl:pb-0 xl:pr-1",
                    SOFT_NATIVE_SCROLLBAR_CLASS
                  )}
                >
                  {STYLE_PREVIEWS.map((style) => {
                    const isActive = formState.cardStyle === style.value
                    return (
                      <button
                        key={style.value}
                        type="button"
                        ref={(node) => {
                          styleButtonRefs.current[style.value] = node
                        }}
                        onClick={() =>
                          setFormState((prev) => ({ ...prev, cardStyle: style.value }))
                        }
                        className={cn(
                          "group flex min-w-32 items-center gap-2 rounded-lg border border-transparent bg-muted/30 px-2 py-1.5 text-left transition-all hover:bg-muted/50 xl:min-w-0",
                          isActive
                            ? "border-primary/60 bg-primary/8 text-primary shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span className="flex h-9 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                          <img
                            src={style.assetPath}
                            alt={t(`infographicDialog.styles.${style.value}.title`)}
                            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.04]"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium leading-5">
                            {t(`infographicDialog.styles.${style.value}.title`)}
                          </span>
                        </span>
                        {isActive ? (
                          <CheckCircle2Icon className="h-4 w-4 shrink-0 text-primary" />
                        ) : null}
                      </button>
                    )
                  })}
                </div>

                <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-muted/20">
                  <div className="flex h-56 items-center justify-center p-2 sm:h-60 xl:h-72">
                    <img
                      src={selectedStyle.assetPath}
                      alt={t(`infographicDialog.styles.${selectedStyle.value}.title`)}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="flex items-start justify-between gap-3 border-t bg-background/80 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-5">
                        {t(`infographicDialog.styles.${selectedStyle.value}.title`)}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {t(`infographicDialog.styles.${selectedStyle.value}.description`)}
                      </p>
                    </div>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <CheckCircle2Icon className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
              <div className="flex items-center gap-2 border-b bg-muted/25 px-4 py-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                  3
                </span>
                <Label className="text-sm font-semibold">
                  {t("infographicDialog.orientationLabel")} / {t("infographicDialog.languageLabel")} / {t("infographicDialog.decorationLabel")}
                </Label>
              </div>

              <div className="grid gap-3 p-3 lg:grid-cols-2 2xl:grid-cols-3">
                <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <LayoutTemplateIcon className="h-4 w-4 text-primary" />
                  {t("infographicDialog.orientationLabel")}
                </Label>
                <div className="grid grid-cols-3 rounded-lg border border-border/70 bg-muted/20 p-1">
                  {ORIENTATION_OPTIONS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setFormState((prev) => ({ ...prev, screenOrientation: value }))
                      }
                      className={cn(
                        "h-9 min-w-0 overflow-hidden rounded-md px-1 text-xs font-medium leading-none transition-colors sm:px-1.5 sm:text-[13px]",
                        formState.screenOrientation === value
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="block min-w-0 truncate">
                        {t(`infographicDialog.orientations.${value}`)}
                      </span>
                    </button>
                  ))}
                </div>
                </div>

                <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <LanguagesIcon className="h-4 w-4 text-primary" />
                  {t("infographicDialog.languageLabel")}
                </Label>
                <div className="grid grid-cols-2 rounded-lg border border-border/70 bg-muted/20 p-1">
                  {LANGUAGE_OPTIONS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormState((prev) => ({ ...prev, language: value }))}
                      className={cn(
                        "h-9 min-w-0 overflow-hidden rounded-md px-1 text-xs font-medium leading-none transition-colors sm:px-1.5 sm:text-[13px]",
                        formState.language === value
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="block min-w-0 truncate">
                        {t(`infographicDialog.languages.${value}`)}
                      </span>
                    </button>
                  ))}
                </div>
                </div>

                <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <SparklesIcon className="h-4 w-4 text-primary" />
                  {t("infographicDialog.decorationLabel")}
                </Label>
                <div className="grid grid-cols-3 rounded-lg border border-border/70 bg-muted/20 p-1">
                  {DECORATION_OPTIONS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setFormState((prev) => ({ ...prev, decorationLevel: value }))
                      }
                      className={cn(
                        "h-9 min-w-0 overflow-hidden rounded-md px-1 text-xs font-medium leading-none transition-colors sm:px-1.5 sm:text-[13px]",
                        formState.decorationLevel === value
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="block min-w-0 truncate">
                        {t(`infographicDialog.decorations.${value}`)}
                      </span>
                    </button>
                  ))}
                </div>
                </div>
              </div>
            </section>

            {sourceMode === "selection" ? (
              <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
                <div className="flex items-center gap-2 border-b bg-muted/25 px-4 py-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    4
                  </span>
                  <Label className="text-sm font-semibold">{t("infographicDialog.customLabel")}</Label>
                </div>
                <div className="p-3">
                  <Textarea
                    value={formState.userCustom}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, userCustom: event.target.value }))
                    }
                    placeholder={t("infographicDialog.customPlaceholder")}
                    className="h-20 max-h-32 min-h-20 resize-y border-border/70 bg-muted/20 shadow-none"
                  />
                </div>
              </section>
            ) : null}
          </div>
        </ScrollArea>

        <div className="flex min-h-0 flex-col bg-muted/20">
          <div className="shrink-0 border-b bg-background/80 px-5 py-4 xl:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">{t("infographicDialog.resultTitle")}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{statusText}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyToMaterials}
                  disabled={!canCopyToMaterials}
                >
                  {copyingToMaterials ? (
                    <>
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                      {t("infographicDialog.addToMaterialsLoading")}
                    </>
                  ) : (
                    t("infographicDialog.addToMaterials")
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleGenerate}
                  disabled={sourceMode === "selection" ? !canGenerateSelection : !canSubmitArticleAnalysis}
                >
                  {isGenerating ? (
                    <>
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                      {t("infographicDialog.generating")}
                    </>
                  ) : (
                    <>
                      <WandSparklesIcon className="h-4 w-4" />
                      {sourceMode === "article"
                        ? t("infographicDialog.generateFromArticle")
                        : t("infographicDialog.generate")}
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-lg border bg-background px-3 py-2">
                <span className="block text-muted-foreground">{t("infographicDialog.sourceSummaryLabel")}</span>
                <span className="mt-1 block truncate font-medium">
                  {sourceMode === "article"
                    ? t("infographicDialog.articleMode")
                    : t("infographicDialog.selectionMode")}
                </span>
              </div>
              <div className="rounded-lg border bg-background px-3 py-2">
                <span className="block text-muted-foreground">{t("infographicDialog.styleLabel")}</span>
                <span className="mt-1 block truncate font-medium">
                  {t(`infographicDialog.styles.${selectedStyle.value}.title`)}
                </span>
              </div>
              <div className="rounded-lg border bg-background px-3 py-2">
                <span className="block text-muted-foreground">{t("infographicDialog.orientationLabel")}</span>
                <span className="mt-1 block truncate font-medium">
                  {t(`infographicDialog.orientations.${formState.screenOrientation}`)}
                </span>
              </div>
              <div className="rounded-lg border bg-background px-3 py-2">
                <span className="block text-muted-foreground">{t("infographicDialog.languageLabel")}</span>
                <span className="mt-1 block truncate font-medium">
                  {t(`infographicDialog.languages.${formState.language}`)}
                </span>
              </div>
              <div className="rounded-lg border bg-background px-3 py-2">
                <span className="block text-muted-foreground">{t("infographicDialog.decorationLabel")}</span>
                <span className="mt-1 block truncate font-medium">
                  {t(`infographicDialog.decorations.${formState.decorationLevel}`)}
                </span>
              </div>
            </div>

            {(resultPollingState === "pending" || resultPollingState === "processing") ? (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
                <Loader2Icon className="h-4 w-4 animate-spin" />
                {resultMode === "article"
                  ? t("infographicDialog.generatingBatchHint", {
                      completed: batchProgress.completed,
                      total: batchProgress.total,
                    })
                  : t("infographicDialog.generatingHint")}
              </div>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 p-5 xl:p-6">
            {errorMessage ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircleIcon />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            {activeImageItem ? (
              <div className="flex h-full min-h-0 flex-col gap-4">
                <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border bg-background shadow-sm">
                  <img
                    src={activeImageItem.url}
                    alt={t("infographicDialog.resultImageAlt")}
                    className="max-h-full w-full object-contain"
                  />
                </div>

                {activeImageItem.detail?.article_excerpt || activeImageItem.detail?.selection_reason ? (
                  <div className="shrink-0 rounded-lg border bg-background px-3 py-2 text-xs leading-5 text-muted-foreground">
                    {activeImageItem.detail.article_excerpt ? (
                      <p className="line-clamp-2">
                        <span className="font-medium text-foreground">
                          {t("infographicDialog.articleExcerptLabel")}
                        </span>
                        {activeImageItem.detail.article_excerpt}
                      </p>
                    ) : null}
                    {activeImageItem.detail.selection_reason ? (
                      <p className="mt-1 line-clamp-2">
                        <span className="font-medium text-foreground">
                          {t("infographicDialog.selectionReasonLabel")}
                        </span>
                        {activeImageItem.detail.selection_reason}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {resultImageItems.length > 1 ? (
                  <div className="grid shrink-0 grid-cols-3 gap-2">
                    {resultImageItems.map((imageItem, index) => (
                      <button
                        key={imageItem.key}
                        type="button"
                        onClick={() => setActiveImageIndex(index)}
                        className={cn(
                          "overflow-hidden rounded-lg border bg-background transition-all",
                          activeImageIndex === index
                            ? "border-primary ring-2 ring-primary/15"
                            : "border-border hover:border-primary/40"
                        )}
                      >
                        <img
                          src={imageItem.url}
                          alt={`${t("infographicDialog.resultImageAlt")} ${index + 1}`}
                          className="aspect-video h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex h-full min-h-72 items-center justify-center rounded-lg border border-dashed border-primary/20 bg-background/75 px-6 text-center">
                <div className="max-w-sm space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {isGenerating ? (
                      <Loader2Icon className="h-5 w-5 animate-spin" />
                    ) : (
                      <SparklesIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      {isGenerating
                        ? t("infographicDialog.generating")
                        : sourceMode === "article"
                          ? t("infographicDialog.articleResultEmptyTitle")
                          : t("infographicDialog.resultEmptyTitle")}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {isGenerating
                        ? t("infographicDialog.generatingHint")
                        : sourceMode === "article"
                          ? t("infographicDialog.articleResultEmptyDesc")
                          : t("infographicDialog.resultEmptyDesc")}
                    </p>
                  </div>
                  {sourceMode === "article" && !isGenerating ? (
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      {[0, 1, 2].map((index) => (
                        <div
                          key={index}
                          className="aspect-[4/3] rounded-md border border-dashed bg-muted/30"
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AIFeatureDialogShell>
  )
}
