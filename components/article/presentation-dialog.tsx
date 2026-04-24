"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AlertCircleIcon, CheckCircle2Icon, FileTextIcon, Loader2Icon, SparklesIcon } from "lucide-react"
import { AIFeatureDialogShell } from "@/components/ui/ai/ai-feature-dialog-shell"
import { Alert, AlertDescription } from "@/components/ui/base/alert"
import { Button } from "@/components/ui/base/button"
import { Input } from "@/components/ui/base/input"
import { ScrollArea } from "@/components/ui/base/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/base/select"
import { Textarea } from "@/components/ui/base/textarea"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { presentationsClient } from "@/lib/api/presentations/client"
import type {
  PresentationImageStyle,
  PresentationLanguage,
  PresentationStorycardDocument,
  PresentationStorycardRecord,
  PresentationThemesResponse,
  PresentationTransition,
} from "@/lib/api/presentations/types"
import { normalizePresentationStorycardDocument } from "@/lib/api/presentations/types"
import type { TaskCenterTaskReference } from "@/lib/api/taskcenter/types"

function cloneStorycard(storycard: PresentationStorycardDocument): PresentationStorycardDocument {
  return normalizePresentationStorycardDocument(storycard)
}

function stringifyStorycard(storycard: PresentationStorycardDocument | null): string {
  try {
    return JSON.stringify(storycard ?? {}, null, 2)
  } catch {
    return "{}"
  }
}

function parseStorycardText(input: string): PresentationStorycardDocument {
  const parsed = JSON.parse(input) as unknown
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("invalid_storycard_json")
  }

  return parsed as PresentationStorycardDocument
}

const TRANSITIONS: PresentationTransition[] = ["none", "fade", "push", "wipe", "cut"]

interface PresentationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  articleId?: number | null
  onTaskSubmitted?: (taskRef: TaskCenterTaskReference) => void
}

export function PresentationDialog({
  open,
  onOpenChange,
  articleId,
  onTaskSubmitted,
}: PresentationDialogProps) {
  const { locale, t } = useTranslation()
  const { toast } = useToast()
  const pollSequenceRef = useRef(0)
  const [selectedLanguage, setSelectedLanguage] = useState<PresentationLanguage>(
    locale === "zh" ? "zh" : "en"
  )
  const [storycardRecord, setStorycardRecord] = useState<PresentationStorycardRecord | null>(null)
  const [storycardDraft, setStorycardDraft] = useState<PresentationStorycardDocument | null>(null)
  const [storycardText, setStorycardText] = useState("{}")
  const [storycardStatus, setStorycardStatus] = useState<
    "idle" | "checking" | "generating" | "ready" | "error"
  >("idle")
  const [storycardError, setStorycardError] = useState<string | null>(null)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [submittingLayout, setSubmittingLayout] = useState(false)
  const [themes, setThemes] = useState<PresentationThemesResponse["themes"]>({})
  const [theme, setTheme] = useState("")
  const [imageStyles, setImageStyles] = useState<PresentationImageStyle[]>([])
  const [imageStyleId, setImageStyleId] = useState("")
  const [transition, setTransition] = useState<PresentationTransition>("push")
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [author, setAuthor] = useState("")

  const syncStorycardRecord = useCallback((record: PresentationStorycardRecord | null) => {
    setStorycardRecord(record)
    const nextDraft = record ? cloneStorycard(record.storycard_json) : null
    setStorycardDraft(nextDraft)
    setStorycardText(stringifyStorycard(nextDraft))
  }, [])

  const resetState = useCallback(() => {
    pollSequenceRef.current += 1
    setStorycardRecord(null)
    setStorycardDraft(null)
    setStorycardText("{}")
    setStorycardStatus("idle")
    setStorycardError(null)
    setLoadingOptions(false)
    setSubmittingLayout(false)
    setThemes({})
    setTheme("")
    setImageStyles([])
    setImageStyleId("")
    setTransition("push")
    setTitle("")
    setSubtitle("")
    setAuthor("")
    setSelectedLanguage(locale === "zh" ? "zh" : "en")
  }, [locale])

  const pollStorycard = useCallback(
    async (articleIdValue: number, sequence: number) => {
      for (let attempt = 0; attempt < 40; attempt += 1) {
        if (pollSequenceRef.current !== sequence) {
          return
        }

        const result = await presentationsClient.getStorycard(articleIdValue)
        if (!("error" in result)) {
          if (result.status === "success") {
            syncStorycardRecord(result)
            setStorycardStatus("ready")
            setStorycardError(null)
            if (!title) {
              setTitle(result.storycard_json?.title || result.title || "")
            }
            return
          }

          if (result.status === "failed") {
            setStorycardStatus("error")
            setStorycardError(result.error_message || t("presentation.dialog.storycard.generateFailed"))
            return
          }
        } else if (result.status && result.status !== 404) {
          setStorycardStatus("error")
          setStorycardError(String(result.error))
          return
        }

        await new Promise((resolve) => setTimeout(resolve, 1500))
      }

      if (pollSequenceRef.current === sequence) {
        setStorycardStatus("error")
        setStorycardError(t("presentation.dialog.storycard.generateTimeout"))
      }
    },
    [syncStorycardRecord, t, title]
  )

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true)

    try {
      const [themesResult, stylesResult] = await Promise.all([
        presentationsClient.getThemes(),
        presentationsClient.getImageStyles(),
      ])

      if (!("error" in themesResult)) {
        setThemes(themesResult.themes)
        setTheme((current) => current || themesResult.default_theme || "")
      }

      if (!("error" in stylesResult)) {
        setImageStyles(stylesResult.style)
        setImageStyleId((current) => current || stylesResult.default_style || stylesResult.style[0]?.id || "")
      }
    } catch (error) {
      console.error("[PresentationDialog] Failed to load presentation options", { error })
    } finally {
      setLoadingOptions(false)
    }
  }, [])

  const loadExistingStorycard = useCallback(async () => {
    if (typeof articleId !== "number") return

    const sequence = ++pollSequenceRef.current
    setStorycardStatus("checking")
    setStorycardError(null)
    syncStorycardRecord(null)

    try {
      const result = await presentationsClient.getStorycard(articleId)

      if (pollSequenceRef.current !== sequence) {
        return
      }

      if ("error" in result) {
        if (result.status === 404) {
          setStorycardStatus("idle")
          return
        }

        throw new Error(String(result.error))
      }

      setSelectedLanguage(result.language === "en" ? "en" : "zh")
      if (result.status === "success") {
        syncStorycardRecord(result)
        setStorycardStatus("ready")
        setTitle(result.storycard_json?.title || result.title || "")
        return
      }

      if (result.status === "failed") {
        setStorycardStatus("error")
        setStorycardError(result.error_message || t("presentation.dialog.storycard.generateFailed"))
        return
      }

      setStorycardStatus("generating")
      await pollStorycard(articleId, sequence)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load storycard"
      console.error("[PresentationDialog] Failed to load existing storycard", {
        articleId,
        error,
      })
      setStorycardStatus("error")
      setStorycardError(message)
    }
  }, [articleId, pollStorycard, syncStorycardRecord, t])

  const startFlow = useCallback(async (forceRegenerate = false) => {
    if (typeof articleId !== "number") return

    const sequence = ++pollSequenceRef.current
    setStorycardStatus("generating")
    setStorycardError(null)
    syncStorycardRecord(null)
    await loadOptions()

    try {
      const result = await presentationsClient.refreshStorycard(
        articleId,
        selectedLanguage,
        forceRegenerate
      )

      if ("error" in result) {
        throw new Error(String(result.error))
      }

      if (pollSequenceRef.current !== sequence) {
        return
      }

      if (result.storycard && result.storycard.status === "success") {
        syncStorycardRecord(result.storycard)
        setStorycardStatus("ready")
        setTitle(result.storycard.storycard_json?.title || result.storycard.title || "")
        return
      }

      await pollStorycard(articleId, sequence)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate storycard"
      console.error("[PresentationDialog] Failed to start storycard flow", {
        articleId,
        error,
      })
      setStorycardStatus("error")
      setStorycardError(message)
    }
  }, [articleId, loadOptions, pollStorycard, selectedLanguage, syncStorycardRecord])

  useEffect(() => {
    if (!open) {
      resetState()
      return
    }

    void loadOptions()
    void loadExistingStorycard()
  }, [loadExistingStorycard, loadOptions, open, resetState])

  const slides = useMemo(() => {
    if (!storycardDraft?.slides || !Array.isArray(storycardDraft.slides)) {
      return []
    }

    return storycardDraft.slides
  }, [storycardDraft])

  const selectedImageStyle = useMemo(
    () => imageStyles.find((item) => item.id === imageStyleId) ?? null,
    [imageStyleId, imageStyles]
  )

  const handleStorycardFieldChange = useCallback(
    (field: "title", value: string) => {
      setStorycardDraft((current) => {
        const next = cloneStorycard(current ?? {})
        next[field] = value
        setStorycardText(stringifyStorycard(next))
        return next
      })
    },
    []
  )

  const handleSlideChange = useCallback(
    (
      slideIndex: number,
      field: "headline" | "subheadline" | "speaker_notes" | "body",
      value: string
    ) => {
      setStorycardDraft((current) => {
        const next = cloneStorycard(current ?? {})
        const nextSlides = Array.isArray(next.slides) ? [...next.slides] : []
        const originalSlide = nextSlides[slideIndex] ?? { id: `slide_${slideIndex + 1}` }
        const nextSlide = { ...originalSlide }

        if (field === "body") {
          nextSlide.body = value
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean)
        } else {
          nextSlide[field] = value
        }

        nextSlides[slideIndex] = nextSlide
        next.slides = nextSlides
        setStorycardText(stringifyStorycard(next))
        return next
      })
    },
    []
  )

  const handleGenerateLayout = useCallback(async () => {
    if (!storycardRecord) return

    const nextDraft = storycardDraft
    if (!nextDraft) {
      setStorycardError(t("presentation.dialog.storycard.empty"))
      return
    }

    if (!theme || !selectedImageStyle) {
      setStorycardError(t("presentation.dialog.layout.missingOptions"))
      return
    }

    setSubmittingLayout(true)
    setStorycardError(null)

    try {
      const updated = await presentationsClient.updateStorycard(storycardRecord.id, {
        version: storycardRecord.version,
        storycard_json: nextDraft,
      })

      if ("error" in updated) {
        throw new Error(String(updated.error))
      }

      const layoutResult = await presentationsClient.generateLayout({
        storycard_id: storycardRecord.id,
        storycard_version: updated.version,
        storycard_json: nextDraft,
        theme,
        transition,
        image_style: selectedImageStyle,
        title: title.trim() || undefined,
        subtitle: subtitle.trim() || undefined,
        author: author.trim() || undefined,
      })

      if ("error" in layoutResult) {
        throw new Error(String(layoutResult.error))
      }

      toast({
        description: t("presentation.dialog.layout.submitSuccess"),
      })

      onTaskSubmitted?.({
        id: layoutResult.presentation_log_id,
        type: "presentation",
      })
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate layout"
      console.error("[PresentationDialog] Failed to generate layout", {
        storycardId: storycardRecord.id,
        error,
      })
      setStorycardError(message)
    } finally {
      setSubmittingLayout(false)
    }
  }, [
    author,
    onOpenChange,
    onTaskSubmitted,
    selectedImageStyle,
    storycardDraft,
    storycardRecord,
    subtitle,
    t,
    theme,
    title,
    toast,
    transition,
  ])

  return (
    <AIFeatureDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("presentation.dialog.title")}
      description={t("presentation.dialog.description")}
      icon={<FileTextIcon className="h-5 w-5 text-primary" />}
      size="compact"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {storycardStatus === "generating"
              ? t("presentation.dialog.storycard.generating")
              : storycardStatus === "checking"
              ? t("presentation.dialog.storycard.checking")
              : storycardStatus === "ready"
              ? t("presentation.dialog.storycard.ready")
              : storycardStatus === "error"
              ? t("presentation.dialog.storycard.error")
              : ""}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.close")}
            </Button>
            <Button
              type="button"
              onClick={() => void handleGenerateLayout()}
              disabled={storycardStatus !== "ready" || submittingLayout}
            >
              {submittingLayout ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <SparklesIcon className="h-4 w-4" />
              )}
              {t("presentation.dialog.layout.generate")}
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,420px)]">
        <section className="flex h-full min-h-0 flex-col overflow-hidden border-b lg:border-r lg:border-b-0">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b px-6 py-4 shrink-0">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {t("presentation.dialog.storycard.sectionTitle")}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedLanguage}
                onValueChange={(value) => setSelectedLanguage(value as PresentationLanguage)}
                disabled={storycardStatus === "checking" || storycardStatus === "generating"}
              >
                <SelectTrigger className="w-[132px] bg-background">
                  <SelectValue placeholder={t("presentation.dialog.storycard.selectLanguage")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh">{t("presentation.dialog.storycard.languageZh")}</SelectItem>
                  <SelectItem value="en">{t("presentation.dialog.storycard.languageEn")}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant={storycardStatus === "ready" ? "outline" : "default"}
                onClick={() => void startFlow(storycardStatus === "ready")}
                disabled={
                  storycardStatus === "checking" ||
                  storycardStatus === "generating" ||
                  typeof articleId !== "number"
                }
              >
                {storycardStatus === "checking" || storycardStatus === "generating" ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <SparklesIcon className="h-4 w-4" />
                )}
                {storycardStatus === "ready"
                  ? t("presentation.dialog.storycard.regenerate")
                  : t("presentation.dialog.storycard.generate")}
              </Button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {storycardError ? (
              <Alert variant="destructive" className="m-6">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertDescription>{storycardError}</AlertDescription>
              </Alert>
            ) : storycardStatus === "checking" ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
                <div className="space-y-2">
                  <p className="text-base font-semibold text-foreground">
                    {t("presentation.dialog.storycard.checkingTitle")}
                  </p>
                </div>
              </div>
            ) : storycardStatus === "generating" ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
                <div className="space-y-2">
                  <p className="text-base font-semibold text-foreground">
                    {t("presentation.dialog.storycard.generatingTitle")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("presentation.dialog.storycard.generatingDescription")}
                  </p>
                </div>
              </div>
            ) : storycardStatus === "ready" && storycardDraft ? (
              <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-5 p-6">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {t("presentation.dialog.storycard.storyTitle")}
                    </p>
                    <Input
                      value={storycardDraft.title ?? ""}
                      onChange={(event) =>
                        handleStorycardFieldChange("title", event.target.value)
                      }
                    />
                  </div>

                  {slides.map((slide, index) => (
                    <div
                      key={slide.id || `slide-${index}`}
                      className="space-y-3 rounded-2xl border bg-muted/20 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {t("presentation.dialog.storycard.slideTitle", { index: index + 1 })}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">{slide.id}</span>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          {t("presentation.dialog.storycard.headline")}
                        </p>
                        <Input
                          value={slide.headline ?? ""}
                          onChange={(event) =>
                            handleSlideChange(index, "headline", event.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          {t("presentation.dialog.storycard.subheadline")}
                        </p>
                        <Input
                          value={slide.subheadline ?? ""}
                          onChange={(event) =>
                            handleSlideChange(index, "subheadline", event.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          {t("presentation.dialog.storycard.body")}
                        </p>
                        <Textarea
                          className="min-h-28"
                          value={Array.isArray(slide.body) ? slide.body.join("\n") : ""}
                          onChange={(event) =>
                            handleSlideChange(index, "body", event.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          {t("presentation.dialog.storycard.notes")}
                        </p>
                        <Textarea
                          className="min-h-24"
                          value={slide.speaker_notes ?? ""}
                          onChange={(event) =>
                            handleSlideChange(index, "speaker_notes", event.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 text-sm text-muted-foreground">
              {t("presentation.dialog.storycard.empty")}
            </div>
          )}
        </div>
        </section>

        <section className="flex h-full min-h-0 flex-col overflow-hidden bg-muted/20">
          <div className="border-b px-6 py-4 shrink-0">
            <h3 className="text-sm font-semibold text-foreground">
              {t("presentation.dialog.layout.sectionTitle")}
            </h3>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-5 p-6">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {t("presentation.dialog.layout.theme")}
                </p>
                <Select value={theme} onValueChange={setTheme} disabled={loadingOptions}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("presentation.dialog.layout.selectTheme")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(themes).map((themeId) => (
                      <SelectItem key={themeId} value={themeId}>
                        {themeId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {t("presentation.dialog.layout.imageStyle")}
                </p>
                <Select value={imageStyleId} onValueChange={setImageStyleId} disabled={loadingOptions}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("presentation.dialog.layout.selectImageStyle")} />
                  </SelectTrigger>
                  <SelectContent>
                    {imageStyles.map((style) => (
                      <SelectItem key={style.id} value={style.id}>
                        {locale === "en" ? style.id : style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedImageStyle ? (
                  <p className="text-sm text-muted-foreground">
                    {selectedImageStyle.prompt_suffix}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {t("presentation.dialog.layout.transition")}
                </p>
                <Select
                  value={transition}
                  onValueChange={(value) => setTransition(value as PresentationTransition)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("presentation.dialog.layout.selectTransition")} />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSITIONS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {t("presentation.dialog.layout.title")}
                </p>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {t("presentation.dialog.layout.subtitle")}
                </p>
                <Input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {t("presentation.dialog.layout.author")}
                </p>
                <Input value={author} onChange={(event) => setAuthor(event.target.value)} />
              </div>
            </div>
          </ScrollArea>
        </section>
      </div>
    </AIFeatureDialogShell>
  )
}
