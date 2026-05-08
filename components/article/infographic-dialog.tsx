"use client"
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  ImageIcon,
  LanguagesIcon,
  LayoutTemplateIcon,
  Loader2Icon,
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
  type GenerateInfographicRequest,
  type InfographicCardStyle,
  type InfographicDecorationLevel,
  type InfographicLanguage,
  type InfographicScreenOrientation,
} from "@/lib/api/infographics/types"
import {
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
const SOFT_NATIVE_SCROLLBAR_CLASS =
  "[scrollbar-color:color-mix(in_oklch,var(--primary)_18%,transparent)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-0.5 [&::-webkit-scrollbar]:w-0.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-0 [&::-webkit-scrollbar-thumb]:bg-primary/12 hover:[&::-webkit-scrollbar-thumb]:bg-primary/28"
const SOFT_RADIX_SCROLLBAR_CLASS =
  "[&_[data-slot=scroll-area-scrollbar]]:w-0.5 [&_[data-slot=scroll-area-scrollbar]]:bg-transparent [&_[data-slot=scroll-area-scrollbar]]:opacity-25 hover:[&_[data-slot=scroll-area-scrollbar]]:opacity-60 [&_[data-slot=scroll-area-thumb]]:bg-primary/18 hover:[&_[data-slot=scroll-area-thumb]]:bg-primary/32"

type InfographicFormState = {
  cardStyle: InfographicCardStyle
  screenOrientation: InfographicScreenOrientation
  language: InfographicLanguage
  decorationLevel: InfographicDecorationLevel
  userCustom: string
}

const DEFAULT_FORM_STATE_BY_LOCALE: Record<InfographicLanguage, InfographicFormState> = {
  zh: {
    cardStyle: "professional",
    screenOrientation: "square",
    language: "zh",
    decorationLevel: "moderate",
    userCustom: "",
  },
  en: {
    cardStyle: "professional",
    screenOrientation: "square",
    language: "en",
    decorationLevel: "moderate",
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

  const [formState, setFormState] = useState<InfographicFormState>(
    DEFAULT_FORM_STATE_BY_LOCALE[locale]
  )
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
      setCopyingToMaterials(false)
      setActiveImageIndex(0)
      setRequestErrorMessage(null)
      return
    }

    setFormState(DEFAULT_FORM_STATE_BY_LOCALE[locale])
    setCopyingToMaterials(false)
    setActiveImageIndex(0)
    setRequestErrorMessage(null)
    reset()
  }, [locale, open, reset])

  const imageUrls = useMemo(() => {
    return parseInfographicImageUrls(detail?.image_urls)
  }, [detail?.image_urls])

  useEffect(() => {
    if (activeImageIndex >= imageUrls.length) {
      setActiveImageIndex(0)
    }
  }, [activeImageIndex, imageUrls.length])

  const isGenerating = pollingState === "submitting" || pollingState === "pending" || pollingState === "processing"
  const canCopyToMaterials =
    pollingState === "success" && currentLogId !== null && imageUrls.length > 0 && !copyingToMaterials

  const activeImageUrl = imageUrls[activeImageIndex] ?? null
  const selectedTextPreview = selectedText.trim()
  const selectedStyle = STYLE_PREVIEWS.find((style) => style.value === formState.cardStyle) ?? STYLE_PREVIEWS[0]

  const statusText = (() => {
    if (pollingState === "pending" || pollingState === "processing") {
      return t(`infographicDialog.status.${pollingState}`)
    }
    if (pollingState === "success" || pollingState === "failed") {
      return t(`infographicDialog.status.${pollingState}`)
    }
    return t("infographicDialog.resultHint")
  })()

  const errorMessage =
    requestErrorMessage ||
    (pollingErrorMessage === "polling_timeout"
      ? t("infographicDialog.toast.pollingTimeout")
      : pollingErrorMessage)

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

  const handleGenerate = async () => {
    if (!selectedTextPreview) {
      toast({
        variant: "destructive",
        title: t("infographicDialog.toast.selectTextFirst"),
        description: t("infographicDialog.toast.selectTextFirstDesc"),
      })
      return
    }

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
                    <ImageIcon className="h-4 w-4 text-primary" />
                    {t("infographicDialog.selectedTextLabel")}
                  </Label>
                </div>
                <span className="rounded-full bg-background px-2.5 py-1 text-xs text-muted-foreground">
                  {t("infographicDialog.selectedTextCount", {
                    count: selectedTextPreview.length,
                  })}
                </span>
              </div>
              <div className="p-3">
                <Textarea
                  value={selectedTextPreview}
                  readOnly
                  className={cn(
                    "h-24 max-h-24 min-h-24 resize-none overflow-y-auto border-border/70 bg-muted/20 text-sm leading-relaxed shadow-none [field-sizing:fixed]",
                    SOFT_NATIVE_SCROLLBAR_CLASS
                  )}
                />
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {t("infographicDialog.selectedTextHint")}
                </p>
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

              <div className="grid gap-3 p-3 xl:grid-cols-3">
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
                        "h-9 rounded-md px-2 text-sm font-medium transition-colors",
                        formState.screenOrientation === value
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t(`infographicDialog.orientations.${value}`)}
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
                        "h-9 rounded-md px-2 text-sm font-medium transition-colors",
                        formState.language === value
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t(`infographicDialog.languages.${value}`)}
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
                        "h-9 rounded-md px-2 text-sm font-medium transition-colors",
                        formState.decorationLevel === value
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t(`infographicDialog.decorations.${value}`)}
                    </button>
                  ))}
                </div>
                </div>
              </div>
            </section>

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
                  disabled={isGenerating || !selectedTextPreview}
                >
                  {isGenerating ? (
                    <>
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                      {t("infographicDialog.generating")}
                    </>
                  ) : (
                    <>
                      <WandSparklesIcon className="h-4 w-4" />
                      {t("infographicDialog.generate")}
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2 xl:grid-cols-4">
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

            {(pollingState === "pending" || pollingState === "processing") ? (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
                <Loader2Icon className="h-4 w-4 animate-spin" />
                {t("infographicDialog.generatingHint")}
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

            {activeImageUrl ? (
              <div className="flex h-full min-h-0 flex-col gap-4">
                <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border bg-background shadow-sm">
                  <img
                    src={activeImageUrl}
                    alt={t("infographicDialog.resultImageAlt")}
                    className="max-h-full w-full object-contain"
                  />
                </div>

                {imageUrls.length > 1 ? (
                  <div className="grid shrink-0 grid-cols-3 gap-2">
                    {imageUrls.map((imageUrl, index) => (
                      <button
                        key={`${imageUrl}-${index}`}
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
                          src={imageUrl}
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
                        : t("infographicDialog.resultEmptyTitle")}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {isGenerating
                        ? t("infographicDialog.generatingHint")
                        : t("infographicDialog.resultEmptyDesc")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AIFeatureDialogShell>
  )
}
