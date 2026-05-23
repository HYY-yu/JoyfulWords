"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  DownloadIcon,
  FileTextIcon,
  Loader2Icon,
  RefreshCwIcon,
  SparklesIcon,
} from "lucide-react"
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
import { preparePresentationPreviewHTML } from "@/lib/api/presentations/preview-html"
import type {
  PresentationImageStyle,
  PresentationLanguage,
  PresentationLogDetailResponse,
  PresentationStorycardDocument,
  PresentationStorycardRecord,
  PresentationThemesResponse,
  PresentationTransition,
} from "@/lib/api/presentations/types"
import { normalizePresentationStorycardDocument } from "@/lib/api/presentations/types"
import type {
  TaskCenterPresentationTaskListItem,
  TaskCenterTaskReference,
} from "@/lib/api/taskcenter/types"
import { cn } from "@/lib/utils"

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
const COMPLETE_LAYOUT_STAGES = new Set([
  "slides_success",
  "render_html",
  "render_ppt",
  "uploaded_ppt",
  "completed",
])

type PresentationStepState = "active" | "complete" | "error" | "processing" | "waiting"

type PresentationLayoutDetail = PresentationLogDetailResponse & {
  slide_summary?: {
    total: number
    pending: number
    processing: number
    success: number
    failed: number
  }
}

function getPresentationLogDownloadUrl(detail: PresentationLayoutDetail | null): string | null {
  if (typeof detail?.ppt_url !== "string") return null

  const downloadUrl = detail.ppt_url.trim()
  return downloadUrl.length > 0 ? downloadUrl : null
}

function hasCompletedSlideSummary(detail: PresentationLayoutDetail | null): boolean {
  const summary = detail?.slide_summary
  if (!summary || summary.total <= 0) return false

  return summary.success >= summary.total && summary.failed === 0
}

function isPresentationLayoutHTMLReady(detail: PresentationLayoutDetail | null): boolean {
  if (!detail || detail.task_kind !== "layout_generate") {
    return false
  }

  if (detail.status === "success") {
    return true
  }

  if (typeof detail.render_html === "string" && detail.render_html.trim().length > 0) {
    return true
  }

  return COMPLETE_LAYOUT_STAGES.has(detail.stage ?? "") || hasCompletedSlideSummary(detail)
}

function isPresentationLayoutComplete(detail: PresentationLayoutDetail | null): boolean {
  return isPresentationLayoutHTMLReady(detail) || Boolean(getPresentationLogDownloadUrl(detail))
}

function isPresentationLayoutFailed(detail: PresentationLayoutDetail | null): boolean {
  return detail?.status === "failed" || detail?.stage === "failed"
}

function mapPresentationTaskToLayoutDetail(
  task: TaskCenterPresentationTaskListItem
): PresentationLayoutDetail {
  return {
    id: task.id,
    article_id: task.details.article_id,
    storycard_id: task.details.storycard_id ?? 0,
    task_kind: task.details.task_kind ?? "layout_generate",
    stage: task.details.stage ?? "layout_generate",
    status: task.status === "succeeded" ? "success" : task.status,
    slide_count: task.details.slide_count ?? task.details.slide_summary?.total ?? 0,
    slide_summary: task.details.slide_summary,
    model_name: task.details.model_name ?? "",
    error_message: task.details.error ?? "",
    ppt_url:
      task.details.ppt_url ??
      task.details.pptUrl ??
      task.details.PPT_URL ??
      task.details.artifact_url ??
      task.details.artifactUrl,
    created_at: task.created_at,
    updated_at: task.details.completed_at ?? task.created_at,
    completed_at: task.details.completed_at ?? null,
  }
}

function triggerDownload(url: string) {
  if (typeof window === "undefined") return

  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = ""
  anchor.rel = "noreferrer"
  anchor.click()
}

function PresentationFlowStep({
  step,
  title,
  description,
  state,
  statusLabel,
}: {
  step: number
  title: string
  description: string
  state: PresentationStepState
  statusLabel: string
}) {
  const complete = state === "complete"
  const active = state === "active"
  const error = state === "error"
  const processing = state === "processing"

  return (
    <div className="flex min-w-0 items-center gap-4">
      <span
        className={cn(
          "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
          complete
            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
            : error
            ? "bg-destructive text-destructive-foreground"
            : processing
            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
            : active
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-background text-muted-foreground"
        )}
      >
        {complete ? (
          <>
            <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
            <CheckCircle2Icon className="relative h-4 w-4" />
          </>
        ) : error ? (
          <AlertCircleIcon className="h-4 w-4" />
        ) : processing ? (
          <>
            <span className="absolute -inset-1 rounded-full border border-primary/30 animate-pulse" />
            <Loader2Icon className="relative h-4 w-4 animate-spin" />
          </>
        ) : (
          step
        )}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Step {String(step).padStart(2, "0")}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium",
              complete
                ? "bg-emerald-500/10 text-emerald-700"
                : error
                ? "bg-destructive/10 text-destructive"
                : processing
                ? "bg-primary/10 text-primary"
                : active
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {statusLabel}
          </span>
        </div>
        <p className="mt-1 text-base font-semibold text-foreground">{title}</p>
        <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

interface PresentationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  articleId?: number | null
  latestPresentationTask?: TaskCenterPresentationTaskListItem | null
  onTaskSubmitted?: (taskRef: TaskCenterTaskReference) => void
}

export function PresentationDialog({
  open,
  onOpenChange,
  articleId,
  latestPresentationTask,
  onTaskSubmitted,
}: PresentationDialogProps) {
  const { locale, t } = useTranslation()
  const { toast } = useToast()
  const requestSequenceRef = useRef(0)
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
  const [layoutTaskId, setLayoutTaskId] = useState<number | null>(null)
  const [layoutDetail, setLayoutDetail] = useState<PresentationLayoutDetail | null>(null)
  const [layoutError, setLayoutError] = useState<string | null>(null)
  const [layoutHTML, setLayoutHTML] = useState<string | null>(null)
  const [layoutHTMLLoading, setLayoutHTMLLoading] = useState(false)
  const [exportingLayoutPPT, setExportingLayoutPPT] = useState(false)
  const [pendingLayoutDownloadTaskId, setPendingLayoutDownloadTaskId] = useState<number | null>(null)
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
    requestSequenceRef.current += 1
    setStorycardRecord(null)
    setStorycardDraft(null)
    setStorycardText("{}")
    setStorycardStatus("idle")
    setStorycardError(null)
    setLayoutTaskId(null)
    setLayoutDetail(null)
    setLayoutError(null)
    setLayoutHTML(null)
    setLayoutHTMLLoading(false)
    setExportingLayoutPPT(false)
    setPendingLayoutDownloadTaskId(null)
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

    const sequence = ++requestSequenceRef.current
    setStorycardStatus("checking")
    setStorycardError(null)
    syncStorycardRecord(null)

    try {
      const result = await presentationsClient.getStorycard(articleId)

      if (requestSequenceRef.current !== sequence) {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load storycard"
      console.error("[PresentationDialog] Failed to load existing storycard", {
        articleId,
        error,
      })
      setStorycardStatus("error")
      setStorycardError(message)
    }
  }, [articleId, syncStorycardRecord, t])

  const loadLayoutDetail = useCallback(async (id: number | null = layoutTaskId) => {
    if (typeof id !== "number") return

    setLayoutError(null)

    try {
      const result = await presentationsClient.getLogDetail(id)
      if ("error" in result) {
        throw new Error(String(result.error))
      }

      setLayoutDetail((current) => ({
        ...result,
        slide_summary: current?.id === result.id ? current.slide_summary : undefined,
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load presentation task"
      console.error("[PresentationDialog] Failed to load layout detail", {
        layoutTaskId: id,
        error,
      })
      setLayoutError(message)
    }
  }, [layoutTaskId])

  const loadLayoutHTML = useCallback(async (detail: PresentationLayoutDetail | null = layoutDetail) => {
    if (!detail || !isPresentationLayoutHTMLReady(detail)) {
      setLayoutHTML(null)
      return
    }

    if (typeof detail?.render_html === "string" && detail.render_html.trim().length > 0) {
      setLayoutHTML(preparePresentationPreviewHTML(detail.render_html))
      setLayoutHTMLLoading(false)
      return
    }

    setLayoutHTMLLoading(true)

    try {
      const result = await presentationsClient.getHTML(detail.id)
      if ("error" in result) {
        throw new Error(String(result.error))
      }

      setLayoutHTML(preparePresentationPreviewHTML(result.html_content || ""))
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load HTML preview"
      console.error("[PresentationDialog] Failed to load layout HTML preview", {
        layoutTaskId: detail.id,
        error,
      })
      setLayoutError(message)
      setLayoutHTML(null)
    } finally {
      setLayoutHTMLLoading(false)
    }
  }, [layoutDetail])

  const startFlow = useCallback(async (forceRegenerate = false) => {
    if (typeof articleId !== "number") return

    const sequence = ++requestSequenceRef.current
    setStorycardStatus("generating")
    setStorycardError(null)
    setLayoutTaskId(null)
    setLayoutDetail(null)
    setLayoutError(null)
    setLayoutHTML(null)
    setPendingLayoutDownloadTaskId(null)
    syncStorycardRecord(null)

    try {
      const result = await presentationsClient.generateStorycard({
        article_id: articleId,
        language: selectedLanguage,
        force_regenerate: forceRegenerate,
      })

      if ("error" in result) {
        throw new Error(String(result.error))
      }

      if (requestSequenceRef.current !== sequence) {
        return
      }

      if (result.status === "success" || result.status === "already_created") {
        const storycard = await presentationsClient.getStorycard(articleId)
        if ("error" in storycard) {
          throw new Error(String(storycard.error))
        }

        if (requestSequenceRef.current !== sequence) {
          return
        }

        syncStorycardRecord(storycard)
        setStorycardStatus("ready")
        setSelectedLanguage(storycard.language === "en" ? "en" : "zh")
        setTitle(storycard.storycard_json?.title || storycard.title || "")
        return
      }

      if (typeof result.presentation_log_id === "number") {
        onTaskSubmitted?.({
          id: result.presentation_log_id,
          type: "presentation",
        })
      } else {
        console.warn("[PresentationDialog] Storycard task started without presentation_log_id", {
          articleId,
          status: result.status,
        })
      }

      toast({
        description: t("presentation.dialog.storycard.submitSuccess"),
      })
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate storycard"
      console.error("[PresentationDialog] Failed to start storycard flow", {
        articleId,
        error,
      })
      setStorycardStatus("error")
      setStorycardError(message)
    }
  }, [articleId, onOpenChange, onTaskSubmitted, selectedLanguage, syncStorycardRecord, t, toast])

  useEffect(() => {
    if (!open) {
      resetState()
      return
    }

    void loadOptions()
    void loadExistingStorycard()
  }, [loadExistingStorycard, loadOptions, open, resetState])

  useEffect(() => {
    if (
      !open ||
      !latestPresentationTask ||
      typeof articleId !== "number" ||
      latestPresentationTask.details.article_id !== articleId ||
      latestPresentationTask.details.task_kind === "storycard_generate"
    ) {
      return
    }

    if (typeof layoutTaskId === "number" && layoutTaskId !== latestPresentationTask.id) {
      return
    }

    const nextDetail = mapPresentationTaskToLayoutDetail(latestPresentationTask)
    setLayoutTaskId(latestPresentationTask.id)
    setLayoutDetail((current) => ({
      ...nextDetail,
      render_html: current?.id === nextDetail.id ? current.render_html : undefined,
    }))
    void loadLayoutDetail(latestPresentationTask.id)
  }, [articleId, latestPresentationTask, layoutTaskId, loadLayoutDetail, open])

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
    setLayoutTaskId(null)
    setLayoutDetail(null)
    setLayoutError(null)
    setLayoutHTML(null)
    setPendingLayoutDownloadTaskId(null)

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
      setLayoutTaskId(layoutResult.presentation_log_id)
      void loadLayoutDetail(layoutResult.presentation_log_id)
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
    loadLayoutDetail,
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

  const storycardBusy = storycardStatus === "checking" || storycardStatus === "generating"
  const storycardReady = storycardStatus === "ready"
  const layoutDownloadUrl = getPresentationLogDownloadUrl(layoutDetail)
  const layoutHTMLReady = isPresentationLayoutHTMLReady(layoutDetail)
  const layoutComplete = isPresentationLayoutComplete(layoutDetail)
  const layoutFailed = isPresentationLayoutFailed(layoutDetail)
  const layoutProcessing =
    submittingLayout || (typeof layoutTaskId === "number" && !layoutComplete && !layoutFailed)
  const layoutWaitingForDownload =
    !layoutDownloadUrl &&
    (pendingLayoutDownloadTaskId === layoutDetail?.id ||
      layoutDetail?.stage === "render_ppt" ||
      layoutDetail?.stage === "uploaded_ppt")
  const layoutExportInProgress = exportingLayoutPPT || layoutWaitingForDownload
  const outlineStepState: PresentationStepState =
    storycardStatus === "error"
      ? "error"
      : storycardReady
      ? "complete"
      : storycardBusy
      ? "processing"
      : "active"
  const deckStepState: PresentationStepState = layoutFailed
    ? "error"
    : layoutComplete
    ? "complete"
    : layoutProcessing
    ? "processing"
    : storycardReady
    ? "active"
    : "waiting"
  const primaryBusy = storycardReady ? layoutProcessing : storycardBusy
  const primaryDisabled = storycardReady
    ? layoutProcessing || layoutComplete
    : storycardBusy || typeof articleId !== "number"
  const footerStatus = layoutComplete
    ? t("presentation.dialog.flow.footerDeckReady")
    : layoutProcessing
    ? t("presentation.dialog.flow.footerDeckGenerating")
    : layoutFailed
    ? t("presentation.dialog.flow.footerDeckError")
    : storycardReady
    ? t("presentation.dialog.flow.footerReady")
    : storycardStatus === "checking"
    ? t("presentation.dialog.flow.footerChecking")
    : storycardStatus === "generating"
    ? t("presentation.dialog.flow.footerGenerating")
    : storycardStatus === "error"
    ? t("presentation.dialog.flow.footerError")
    : t("presentation.dialog.flow.footerStart")
  const outlineStatusLabel = t(`presentation.dialog.flow.stepStatus.${outlineStepState}`)
  const deckStatusLabel = t(`presentation.dialog.flow.stepStatus.${deckStepState}`)

  useEffect(() => {
    if (
      !open ||
      typeof layoutTaskId !== "number" ||
      ((layoutComplete || layoutFailed) && !layoutWaitingForDownload)
    ) {
      return
    }

    const timer = window.setInterval(() => {
      void loadLayoutDetail(layoutTaskId)
    }, 3000)

    return () => window.clearInterval(timer)
  }, [
    layoutComplete,
    layoutFailed,
    layoutTaskId,
    layoutWaitingForDownload,
    loadLayoutDetail,
    open,
  ])

  useEffect(() => {
    if (!open || !layoutDetail) {
      setLayoutHTML(null)
      return
    }

    void loadLayoutHTML(layoutDetail)
  }, [layoutDetail, loadLayoutHTML, open])

  useEffect(() => {
    if (
      pendingLayoutDownloadTaskId !== null &&
      layoutDetail?.id === pendingLayoutDownloadTaskId &&
      layoutDownloadUrl
    ) {
      setPendingLayoutDownloadTaskId(null)
    }
  }, [layoutDetail?.id, layoutDownloadUrl, pendingLayoutDownloadTaskId])

  const handleLayoutExportPPT = useCallback(async () => {
    const currentTaskId = layoutDetail?.id ?? layoutTaskId
    if (typeof currentTaskId !== "number") return

    if (layoutDownloadUrl) {
      triggerDownload(layoutDownloadUrl)
      return
    }

    setExportingLayoutPPT(true)

    try {
      const existingPPT = await presentationsClient.getPPT(currentTaskId)
      if (!("error" in existingPPT) && existingPPT.ppt_url) {
        setLayoutDetail((current) =>
          current?.id === currentTaskId
            ? {
                ...current,
                ppt_url: existingPPT.ppt_url,
                status: existingPPT.status,
              }
            : current
        )
        triggerDownload(existingPPT.ppt_url)
        return
      }

      const exported = await presentationsClient.exportPPT(currentTaskId)
      if ("error" in exported) {
        throw new Error(String(exported.error))
      }

      setPendingLayoutDownloadTaskId(currentTaskId)
      toast({
        description: t("presentation.dialog.layoutResult.exportStarted"),
      })
      void loadLayoutDetail(currentTaskId)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export PPT"
      console.error("[PresentationDialog] Failed to export layout PPT", {
        layoutTaskId: currentTaskId,
        error,
      })
      setLayoutError(message)
    } finally {
      setExportingLayoutPPT(false)
    }
  }, [layoutDetail?.id, layoutDownloadUrl, layoutTaskId, loadLayoutDetail, t, toast])

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
            {footerStatus}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.close")}
            </Button>
            <Button
              type="button"
              onClick={() =>
                storycardReady ? void handleGenerateLayout() : void startFlow(false)
              }
              disabled={primaryDisabled}
            >
              {primaryBusy ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <SparklesIcon className="h-4 w-4" />
              )}
              {storycardReady
                ? t("presentation.dialog.layout.generate")
                : t("presentation.dialog.storycard.generate")}
            </Button>
          </div>
        </div>
      }
    >
      <div className="shrink-0 border-b bg-muted/20 px-6 py-4">
        <div className="mx-auto max-w-6xl rounded-2xl border border-border/70 bg-background/75 px-5 py-4 shadow-sm shadow-primary/5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(72px,120px)_minmax(0,1fr)] lg:items-center">
            <PresentationFlowStep
              step={1}
              title={t("presentation.dialog.flow.outlineTitle")}
              description={t("presentation.dialog.flow.outlineDescription")}
              state={outlineStepState}
              statusLabel={outlineStatusLabel}
            />
            <div className="hidden items-center lg:flex">
              <span
                className={cn(
                  "relative h-1 w-full overflow-hidden rounded-full bg-border",
                  layoutComplete ? "bg-emerald-500/25" : layoutProcessing ? "bg-primary/15" : ""
                )}
              >
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                    layoutComplete
                      ? "w-full bg-emerald-500"
                      : layoutProcessing
                      ? "w-2/3 bg-primary animate-pulse"
                      : storycardReady
                      ? "w-1/2 bg-primary/60"
                      : "w-0 bg-primary/40"
                  )}
                />
              </span>
            </div>
            <PresentationFlowStep
              step={2}
              title={t("presentation.dialog.flow.deckTitle")}
              description={t("presentation.dialog.flow.deckDescription")}
              state={deckStepState}
              statusLabel={deckStatusLabel}
            />
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,420px)]">
        <section className="flex h-full min-h-0 flex-col overflow-hidden border-b lg:border-r lg:border-b-0">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b px-6 py-4 shrink-0">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {t("presentation.dialog.storycard.sectionTitle")}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("presentation.dialog.storycard.sectionDescription")}
              </p>
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
                  storycardBusy ||
                  typeof articleId !== "number"
                }
              >
                {storycardBusy ? (
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
                  <div className="flex items-start gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3">
                    <CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {t("presentation.dialog.flow.readyCalloutTitle")}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {t("presentation.dialog.flow.readyCalloutDescription")}
                      </p>
                    </div>
                  </div>

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
            <div className="flex flex-1 items-center justify-center px-6 text-center">
              <div className="max-w-sm space-y-3">
                <p className="text-base font-semibold text-foreground">
                  {t("presentation.dialog.storycard.emptyTitle")}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t("presentation.dialog.storycard.emptyDescription")}
                </p>
                <Button
                  type="button"
                  onClick={() => void startFlow(false)}
                  disabled={storycardBusy || typeof articleId !== "number"}
                >
                  {storycardBusy ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    <SparklesIcon className="h-4 w-4" />
                  )}
                  {t("presentation.dialog.storycard.generate")}
                </Button>
              </div>
            </div>
          )}
        </div>
        </section>

        <section className="flex h-full min-h-0 flex-col overflow-hidden bg-muted/20">
          <div className="border-b px-6 py-4 shrink-0">
            <h3 className="text-sm font-semibold text-foreground">
              {t("presentation.dialog.layout.sectionTitle")}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {layoutComplete
                ? t("presentation.dialog.layoutResult.readyDescription")
                : layoutFailed
                ? t("presentation.dialog.layoutResult.failedDescription")
                : layoutProcessing
                ? t("presentation.dialog.layoutResult.processingDescription")
                : storycardReady
                ? t("presentation.dialog.layout.readyDescription")
                : t("presentation.dialog.layout.waitingDescription")}
            </p>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            {layoutTaskId ? (
              <div className="space-y-4 p-6">
                <div
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-4",
                    layoutFailed
                      ? "border-destructive/25 bg-destructive/5"
                      : layoutComplete
                      ? "border-emerald-500/25 bg-emerald-500/5"
                      : "border-primary/25 bg-primary/5"
                  )}
                >
                  <span
                    className={cn(
                      "relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      layoutFailed
                        ? "bg-destructive/10 text-destructive"
                        : layoutComplete
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {layoutFailed ? (
                      <AlertCircleIcon className="h-4 w-4" />
                    ) : layoutComplete ? (
                      <>
                        <span className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
                        <CheckCircle2Icon className="relative h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <span className="absolute -inset-1 rounded-full border border-primary/30 animate-pulse" />
                        <Loader2Icon className="relative h-4 w-4 animate-spin" />
                      </>
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {layoutFailed
                        ? t("presentation.dialog.layoutResult.failedTitle")
                        : layoutComplete
                        ? t("presentation.dialog.layoutResult.readyTitle")
                        : t("presentation.dialog.layoutResult.processingTitle")}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {layoutFailed
                        ? t("presentation.dialog.layoutResult.failedDescription")
                        : layoutComplete
                        ? t("presentation.dialog.layoutResult.readyDescription")
                        : t("presentation.dialog.layoutResult.processingDescription")}
                    </p>
                  </div>
                </div>

                {layoutError ? (
                  <Alert variant="destructive">
                    <AlertCircleIcon className="h-4 w-4" />
                    <AlertDescription>{layoutError}</AlertDescription>
                  </Alert>
                ) : null}

                <div className="rounded-xl border bg-background">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        {t("presentation.dialog.layoutResult.previewTitle")}
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {layoutComplete
                          ? t("presentation.dialog.layoutResult.previewReady")
                          : t("presentation.dialog.layoutResult.previewWaiting")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void loadLayoutDetail(layoutTaskId)}
                        disabled={layoutHTMLLoading}
                      >
                        {layoutHTMLLoading ? (
                          <Loader2Icon className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCwIcon className="h-4 w-4" />
                        )}
                        {t("common.refresh")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void handleLayoutExportPPT()}
                        disabled={layoutExportInProgress || (!layoutHTMLReady && !layoutDownloadUrl)}
                      >
                        {layoutExportInProgress ? (
                          <Loader2Icon className="h-4 w-4 animate-spin" />
                        ) : (
                          <DownloadIcon className="h-4 w-4" />
                        )}
                        {layoutDownloadUrl
                          ? t("presentation.detail.preview.downloadPpt")
                          : t("presentation.detail.preview.exportPpt")}
                      </Button>
                    </div>
                  </div>

                  <div className="p-4">
                    <div
                      className="relative flex min-h-[220px] w-full items-center justify-center overflow-hidden rounded-lg border bg-muted/20"
                      style={{ aspectRatio: "16 / 9" }}
                    >
                      {!layoutHTMLReady ? (
                        <div className="flex flex-col items-center gap-3 px-6 text-center text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            {[0, 1, 2].map((index) => (
                              <span
                                key={index}
                                className="h-2 w-2 rounded-full bg-primary animate-bounce"
                                style={{ animationDelay: `${index * 120}ms` }}
                              />
                            ))}
                          </div>
                          {t("presentation.dialog.layoutResult.previewWaiting")}
                        </div>
                      ) : layoutHTMLLoading ? (
                        <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : layoutHTML ? (
                        <iframe
                          title={`presentation-preview-${layoutTaskId}`}
                          srcDoc={layoutHTML}
                          className="absolute inset-0 h-full w-full bg-white"
                          sandbox="allow-same-origin allow-scripts allow-downloads"
                        />
                      ) : (
                        <div className="px-6 text-center text-sm text-muted-foreground">
                          {t("presentation.dialog.layoutResult.previewEmpty")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
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
                  <Select
                    value={imageStyleId}
                    onValueChange={setImageStyleId}
                    disabled={loadingOptions}
                  >
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
            )}
          </ScrollArea>
        </section>
      </div>
    </AIFeatureDialogShell>
  )
}
