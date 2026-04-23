"use client"
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react"
import { AlertCircleIcon, CheckCircle2Icon, Loader2Icon, SparklesIcon } from "lucide-react"
import { AIFeatureDialogShell } from "@/components/ui/ai/ai-feature-dialog-shell"
import { Button } from "@/components/ui/base/button"
import { Label } from "@/components/ui/base/label"
import { Textarea } from "@/components/ui/base/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/base/select"
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
  { value: "professional", assetPath: "/images/infographics/styles/professional.svg" },
  { value: "rustic", assetPath: "/images/infographics/styles/rustic.svg" },
  { value: "academic", assetPath: "/images/infographics/styles/academic.svg" },
  { value: "handdrawn", assetPath: "/images/infographics/styles/handdrawn.svg" },
  { value: "magazine", assetPath: "/images/infographics/styles/magazine.svg" },
  { value: "minimal", assetPath: "/images/infographics/styles/minimal.svg" },
  { value: "fresh", assetPath: "/images/infographics/styles/fresh.svg" },
]

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

  return (
    <AIFeatureDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("infographicDialog.title")}
      description={t("infographicDialog.description")}
      size="compact"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("infographicDialog.close")}
          </Button>
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
          <Button type="button" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2Icon className="h-4 w-4 animate-spin" />
                {t("infographicDialog.generating")}
              </>
            ) : (
              t("infographicDialog.generate")
            )}
          </Button>
        </>
      }
    >
      <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <ScrollArea className="min-h-0 border-b lg:border-r lg:border-b-0">
            <div className="space-y-6 p-6">
              <div className="space-y-2">
                <Label>{t("infographicDialog.selectedTextLabel")}</Label>
                <Textarea
                  value={selectedTextPreview}
                  readOnly
                  className="min-h-32 resize-none text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {t("infographicDialog.selectedTextHint")}
                </p>
              </div>

              <div className="space-y-3">
                <Label>{t("infographicDialog.styleLabel")}</Label>
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                  {STYLE_PREVIEWS.map((style) => {
                    const isActive = formState.cardStyle === style.value
                    return (
                      <button
                        key={style.value}
                        type="button"
                        onClick={() =>
                          setFormState((prev) => ({ ...prev, cardStyle: style.value }))
                        }
                        className={cn(
                          "overflow-hidden rounded-xl border text-left transition-all",
                          isActive
                            ? "border-primary shadow-sm ring-2 ring-primary/15"
                            : "border-border hover:border-primary/40 hover:shadow-sm"
                        )}
                      >
                        <div className="aspect-[4/5] bg-muted">
                          <img
                            src={style.assetPath}
                            alt={t(`infographicDialog.styles.${style.value}.title`)}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="space-y-1 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">
                              {t(`infographicDialog.styles.${style.value}.title`)}
                            </p>
                            {isActive ? (
                              <CheckCircle2Icon className="h-4 w-4 text-primary" />
                            ) : null}
                          </div>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {t(`infographicDialog.styles.${style.value}.description`)}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("infographicDialog.orientationLabel")}</Label>
                  <Select
                    value={formState.screenOrientation}
                    onValueChange={(value) =>
                      setFormState((prev) => ({
                        ...prev,
                        screenOrientation: value as InfographicScreenOrientation,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="square">
                        {t("infographicDialog.orientations.square")}
                      </SelectItem>
                      <SelectItem value="landscape">
                        {t("infographicDialog.orientations.landscape")}
                      </SelectItem>
                      <SelectItem value="portrait">
                        {t("infographicDialog.orientations.portrait")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("infographicDialog.languageLabel")}</Label>
                  <Select
                    value={formState.language}
                    onValueChange={(value) =>
                      setFormState((prev) => ({
                        ...prev,
                        language: value as InfographicLanguage,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh">
                        {t("infographicDialog.languages.zh")}
                      </SelectItem>
                      <SelectItem value="en">
                        {t("infographicDialog.languages.en")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>{t("infographicDialog.decorationLabel")}</Label>
                  <Select
                    value={formState.decorationLevel}
                    onValueChange={(value) =>
                      setFormState((prev) => ({
                        ...prev,
                        decorationLevel: value as InfographicDecorationLevel,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">
                        {t("infographicDialog.decorations.simple")}
                      </SelectItem>
                      <SelectItem value="moderate">
                        {t("infographicDialog.decorations.moderate")}
                      </SelectItem>
                      <SelectItem value="rich">
                        {t("infographicDialog.decorations.rich")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("infographicDialog.customLabel")}</Label>
                <Textarea
                  value={formState.userCustom}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, userCustom: event.target.value }))
                  }
                  placeholder={t("infographicDialog.customPlaceholder")}
                  className="min-h-24 resize-y"
                />
              </div>
            </div>
          </ScrollArea>

          <div className="flex min-h-0 flex-col bg-muted/20">
            <div className="border-b px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">{t("infographicDialog.resultTitle")}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{statusText}</p>
                </div>
                {(pollingState === "pending" || pollingState === "processing") ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    {t("infographicDialog.generatingHint")}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="min-h-0 flex-1 p-6">
              {errorMessage ? (
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              ) : null}

              {activeImageUrl ? (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
                    <img
                      src={activeImageUrl}
                      alt={t("infographicDialog.resultImageAlt")}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  {imageUrls.length > 1 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {imageUrls.map((imageUrl, index) => (
                        <button
                          key={`${imageUrl}-${index}`}
                          type="button"
                          onClick={() => setActiveImageIndex(index)}
                          className={cn(
                            "overflow-hidden rounded-lg border bg-background",
                            activeImageIndex === index
                              ? "border-primary ring-2 ring-primary/15"
                              : "border-border"
                          )}
                        >
                          <img
                            src={imageUrl}
                            alt={`${t("infographicDialog.resultImageAlt")} ${index + 1}`}
                            className="aspect-square h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex h-full min-h-64 items-center justify-center rounded-2xl border border-dashed border-border bg-background/80 px-6 text-center">
                  <div className="space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {isGenerating ? (
                        <Loader2Icon className="h-5 w-5 animate-spin" />
                      ) : (
                        <SparklesIcon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {isGenerating
                          ? t("infographicDialog.generating")
                          : t("infographicDialog.resultEmptyTitle")}
                      </p>
                      <p className="text-sm text-muted-foreground">
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
