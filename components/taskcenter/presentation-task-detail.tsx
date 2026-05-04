"use client"

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircleIcon,
  DownloadIcon,
  Loader2Icon,
  RefreshCwIcon,
  SaveIcon,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/base/alert"
import { Badge } from "@/components/ui/base/badge"
import { Button } from "@/components/ui/base/button"
import { Input } from "@/components/ui/base/input"
import { Progress } from "@/components/ui/base/progress"
import { ScrollArea } from "@/components/ui/base/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/base/tabs"
import { Textarea } from "@/components/ui/base/textarea"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { presentationsClient } from "@/lib/api/presentations/client"
import { preparePresentationPreviewHTML } from "@/lib/api/presentations/preview-html"
import type {
  PresentationStorycardDocument,
  PresentationStorycardRecord,
} from "@/lib/api/presentations/types"
import type {
  TaskCenterPresentationSlideSummary,
  TaskCenterPresentationSlideTask,
  TaskCenterPresentationTaskDetail,
} from "@/lib/api/taskcenter/types"
import { getTaskCenterPresentationDownloadUrl } from "@/lib/api/taskcenter/types"
import { cn } from "@/lib/utils"

function cloneStorycard(storycard: PresentationStorycardDocument): PresentationStorycardDocument {
  return JSON.parse(JSON.stringify(storycard)) as PresentationStorycardDocument
}

function stringifyJSON(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch {
    return "{}"
  }
}

function parseJSONInput(input: string): PresentationStorycardDocument {
  const parsed = JSON.parse(input) as unknown
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("invalid_storycard_json")
  }

  return parsed as PresentationStorycardDocument
}

function triggerDownload(url: string) {
  if (typeof window === "undefined") return

  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = ""
  anchor.rel = "noreferrer"
  anchor.click()
}

function getSlideSummaryFromSlides(
  slides: TaskCenterPresentationSlideTask[]
): TaskCenterPresentationSlideSummary {
  return slides.reduce<TaskCenterPresentationSlideSummary>(
    (summary, slide) => {
      summary.total += 1
      summary[slide.status] += 1
      return summary
    },
    { total: 0, pending: 0, processing: 0, success: 0, failed: 0 }
  )
}

function getNormalizedSlideSummary(
  detail: TaskCenterPresentationTaskDetail
): TaskCenterPresentationSlideSummary | null {
  if (detail.slide_summary && detail.slide_summary.total > 0) {
    return detail.slide_summary
  }

  if (detail.slides?.length) {
    return getSlideSummaryFromSlides(detail.slides)
  }

  if (typeof detail.slide_count === "number" && detail.slide_count > 0) {
    return {
      total: detail.slide_count,
      pending: detail.status === "pending" ? detail.slide_count : 0,
      processing: detail.status === "processing" ? detail.slide_count : 0,
      success: detail.status === "success" ? detail.slide_count : 0,
      failed: detail.status === "failed" ? detail.slide_count : 0,
    }
  }

  return null
}

function getSlideStatusTone(status: TaskCenterPresentationSlideTask["status"]) {
  switch (status) {
    case "failed":
      return "border-destructive/40 bg-destructive/5"
    case "processing":
      return "border-primary/25 bg-primary/5"
    case "success":
      return "border-emerald-500/25 bg-emerald-500/5"
    default:
      return "border-border bg-background"
  }
}

type PresentationLayoutPreviewKind =
  | "cover_page"
  | "horizontal_with_text_and_image"
  | "vertical_main"
  | "timeline"
  | "quadrant_grid"
  | "component_composition"
  | "generic"

function getPresentationLayoutPreviewKind(
  layoutType?: string | null
): PresentationLayoutPreviewKind {
  switch (layoutType?.trim()) {
    case "cover_page":
      return "cover_page"
    case "horizontal_with_text_and_image":
      return "horizontal_with_text_and_image"
    case "vertical_main":
      return "vertical_main"
    case "timeline":
      return "timeline"
    case "quadrant_grid":
      return "quadrant_grid"
    case "component_composition":
      return "component_composition"
    default:
      return "generic"
  }
}

function LayoutPreviewBlock({ className }: { className: string }) {
  return <div className={cn("shrink-0 rounded-sm bg-foreground/15", className)} />
}

function LayoutPreviewTitle({ className }: { className: string }) {
  return <LayoutPreviewBlock className={cn("h-2.5 rounded-full bg-foreground/35", className)} />
}

function PresentationLayoutPreview({ layoutType }: { layoutType?: string | null }) {
  const kind = getPresentationLayoutPreviewKind(layoutType)

  return (
    <div className="relative aspect-video overflow-hidden rounded-md border border-dashed bg-muted/30 p-1.5 text-muted-foreground">
      {kind === "cover_page" ? (
        <div className="flex h-full items-center justify-center rounded-[10px] bg-foreground/[0.04]">
          <LayoutPreviewTitle className="h-4 w-1/3 max-w-20" />
        </div>
      ) : kind === "horizontal_with_text_and_image" ? (
        <div className="grid h-full grid-cols-2 gap-1.5">
          <LayoutPreviewBlock className="h-full rounded-md bg-foreground/20" />
          <LayoutPreviewBlock className="h-full rounded-md bg-foreground/10" />
        </div>
      ) : kind === "vertical_main" ? (
        <div className="flex h-full flex-col gap-1.5">
          <LayoutPreviewTitle className="h-4 w-1/3 max-w-20" />
          <div className="grid min-h-0 flex-1 grid-rows-3 gap-1.5">
            <LayoutPreviewBlock className="rounded-md bg-foreground/15" />
            <LayoutPreviewBlock className="rounded-md bg-foreground/10" />
            <LayoutPreviewBlock className="rounded-md bg-foreground/15" />
          </div>
        </div>
      ) : kind === "timeline" ? (
        <div className="flex h-full flex-col gap-1.5">
          <LayoutPreviewTitle className="h-4 w-1/3 max-w-20" />
          <div className="relative min-h-0 flex-1 pt-2">
            <div className="absolute left-1 right-1 top-1/2 h-px -translate-y-1/2 bg-foreground/15" />
            <div className="absolute left-[15%] top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/35" />
            <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/35" />
            <div className="absolute left-[85%] top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/35" />
          </div>
        </div>
      ) : kind === "quadrant_grid" ? (
        <div className="flex h-full flex-col gap-1.5">
          <LayoutPreviewTitle className="h-4 w-1/3 max-w-20" />
          <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-1.5">
            {Array.from({ length: 4 }).map((_, index) => (
              <LayoutPreviewBlock
                key={index}
                className={cn(
                  "rounded-md border border-foreground/10",
                  index === 1 || index === 2 ? "bg-foreground/10" : "bg-foreground/15"
                )}
              />
            ))}
          </div>
        </div>
      ) : kind === "component_composition" ? (
        <div className="flex h-full flex-col gap-1.5">
          <LayoutPreviewTitle className="h-4 w-1/3 max-w-20" />
          <div className="grid min-h-0 flex-1 grid-cols-4 gap-1.5">
            <LayoutPreviewBlock className="rounded-full bg-foreground/15" />
            <LayoutPreviewBlock className="rounded-md bg-foreground/10" />
            <LayoutPreviewBlock className="rounded-full bg-foreground/15" />
            <LayoutPreviewBlock className="rounded-md bg-foreground/10" />
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col gap-1.5">
          <LayoutPreviewTitle className="h-4 w-1/3 max-w-20" />
          <LayoutPreviewBlock className="min-h-0 flex-1 rounded-md bg-foreground/10" />
        </div>
      )}
    </div>
  )
}

function PresentationSlideProgressPanel({ detail }: { detail: TaskCenterPresentationTaskDetail }) {
  const { t } = useTranslation()
  const summary = getNormalizedSlideSummary(detail)
  const slides = detail.slides ?? []
  const progressValue = summary && summary.total > 0 ? (summary.success / summary.total) * 100 : 0

  if (!summary && slides.length === 0) return null

  return (
    <section className="space-y-4 rounded-xl border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t("presentation.detail.slides.title")}
          </h3>
          {summary ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("presentation.detail.slides.progress", {
                success: summary.success,
                total: summary.total,
              })}
            </p>
          ) : null}
        </div>
        {summary ? (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              {t("presentation.detail.slides.pending", { count: summary.pending })}
            </Badge>
            <Badge variant="secondary">
              {t("presentation.detail.slides.processing", { count: summary.processing })}
            </Badge>
            <Badge variant="default">
              {t("presentation.detail.slides.success", { count: summary.success })}
            </Badge>
            <Badge variant={summary.failed > 0 ? "destructive" : "outline"}>
              {t("presentation.detail.slides.failed", { count: summary.failed })}
            </Badge>
          </div>
        ) : null}
      </div>

      {summary ? <Progress value={progressValue} className="h-2" /> : null}

      {slides.length > 0 ? (
        <div className="space-y-2">
          {slides.map((slide) => {
            const pageNumber = slide.slide_index + 1
            const layoutType = slide.layout_type

            return (
              <div
                key={slide.id}
                className={cn(
                  "grid gap-3 rounded-lg border p-3 text-sm md:grid-cols-[minmax(0,1fr)_96px]",
                  getSlideStatusTone(slide.status)
                )}
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">#{pageNumber}</span>
                    {slide.layout_type ? (
                      <span className="text-xs text-muted-foreground">{slide.layout_type}</span>
                    ) : null}
                    <Badge variant={slide.status === "failed" ? "destructive" : "outline"}>
                      <span className="inline-flex items-center gap-1">
                        {slide.status === "processing" ? (
                          <Loader2Icon className="h-3 w-3 animate-spin" />
                        ) : null}
                        {t(`contentWriting.taskCenter.statuses.${slide.status}`)}
                      </span>
                    </Badge>
                    {typeof slide.retry_count === "number" && slide.retry_count > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {t("presentation.detail.slides.retryCount", {
                          count: slide.retry_count,
                        })}
                      </span>
                    ) : null}
                  </div>

                  {slide.image_prompt ? (
                    <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {t("presentation.detail.slides.imagePrompt")}:
                      </span>{" "}
                      {slide.image_prompt}
                    </p>
                  ) : null}

                  {slide.error_message ? (
                    <p className="text-xs leading-5 text-destructive">{slide.error_message}</p>
                  ) : null}
                </div>

                <PresentationLayoutPreview layoutType={layoutType} />
              </div>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}

interface PresentationTaskDetailProps {
  detail: TaskCenterPresentationTaskDetail
}

function isPresentationHTMLReady(detail: TaskCenterPresentationTaskDetail): boolean {
  if (detail.task_kind !== "layout_generate") {
    return false
  }

  if (detail.status === "success") {
    return true
  }

  if (typeof detail.render_html === "string" && detail.render_html.trim().length > 0) {
    return true
  }

  return ["render_html", "render_ppt", "uploaded_ppt", "completed"].includes(detail.stage ?? "")
}

export function PresentationTaskDetail({ detail }: PresentationTaskDetailProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [storycardRecord, setStorycardRecord] = useState<PresentationStorycardRecord | null>(null)
  const [storycardDraft, setStorycardDraft] = useState<PresentationStorycardDocument | null>(null)
  const [storycardJSONText, setStorycardJSONText] = useState("{}")
  const [htmlContent, setHTMLContent] = useState<string | null>(null)
  const [storycardLoading, setStorycardLoading] = useState(false)
  const [htmlLoading, setHTMLLoading] = useState(false)
  const [savingStorycard, setSavingStorycard] = useState(false)
  const [regeneratingStorycard, setRegeneratingStorycard] = useState(false)
  const [exportingPPT, setExportingPPT] = useState(false)
  const [storycardError, setStorycardError] = useState<string | null>(null)
  const [htmlError, setHTMLError] = useState<string | null>(null)
  const [storycardTab, setStorycardTab] = useState("slides")
  const [pendingDownloadTaskId, setPendingDownloadTaskId] = useState<number | null>(null)

  const presentationDownloadUrl = getTaskCenterPresentationDownloadUrl(detail)
  const hasPPTUrl = typeof presentationDownloadUrl === "string"
  const hasSlideProgress = Boolean(getNormalizedSlideSummary(detail) || detail.slides?.length)
  const htmlReady = isPresentationHTMLReady(detail)
  const exportInProgress =
    detail.task_kind === "layout_generate" &&
    !hasPPTUrl &&
    (exportingPPT ||
      pendingDownloadTaskId === detail.id ||
      detail.stage === "render_ppt" ||
      detail.stage === "uploaded_ppt")

  const slides = useMemo(() => {
    if (!storycardDraft?.slides || !Array.isArray(storycardDraft.slides)) {
      return []
    }

    return storycardDraft.slides
  }, [storycardDraft])

  const syncStorycardDraft = useCallback((record: PresentationStorycardRecord | null) => {
    setStorycardRecord(record)
    const nextDraft = record ? cloneStorycard(record.storycard_json) : null
    setStorycardDraft(nextDraft)
    setStorycardJSONText(stringifyJSON(nextDraft ?? {}))
  }, [])

  const loadStorycard = useCallback(async () => {
    setStorycardLoading(true)
    setStorycardError(null)

    try {
      const result = await presentationsClient.getStorycard(detail.article_id)
      if ("error" in result) {
        throw new Error(String(result.error))
      }

      syncStorycardDraft(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load storycard"
      console.error("[PresentationTaskDetail] Failed to load storycard", {
        articleId: detail.article_id,
        detailId: detail.id,
        error,
      })
      setStorycardError(message)
      syncStorycardDraft(null)
    } finally {
      setStorycardLoading(false)
    }
  }, [detail.article_id, detail.id, syncStorycardDraft])

  const loadHTML = useCallback(async () => {
    if (!htmlReady) {
      setHTMLContent(null)
      setHTMLError(null)
      return
    }

    setHTMLLoading(true)
    setHTMLError(null)

    try {
      const result = await presentationsClient.getHTML(detail.id)
      if ("error" in result) {
        throw new Error(String(result.error))
      }

      setHTMLContent(preparePresentationPreviewHTML(result.html_content || ""))
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load HTML preview"
      console.error("[PresentationTaskDetail] Failed to load HTML preview", {
        detailId: detail.id,
        error,
      })
      setHTMLError(message)
      setHTMLContent(null)
    } finally {
      setHTMLLoading(false)
    }
  }, [detail.id, htmlReady])

  useEffect(() => {
    void loadStorycard()
  }, [loadStorycard])

  useEffect(() => {
    void loadHTML()
  }, [loadHTML])

  useEffect(() => {
    if (storycardTab !== "json") return
    setStorycardJSONText(stringifyJSON(storycardDraft ?? {}))
  }, [storycardDraft, storycardTab])

  useEffect(() => {
    if (
      pendingDownloadTaskId !== null &&
      detail.id === pendingDownloadTaskId &&
      hasPPTUrl &&
      presentationDownloadUrl
    ) {
      triggerDownload(presentationDownloadUrl)
      setPendingDownloadTaskId(null)
    }
  }, [detail.id, hasPPTUrl, pendingDownloadTaskId, presentationDownloadUrl])

  const handleStorycardFieldChange = useCallback(
    (key: "title", value: string) => {
      setStorycardDraft((current) => {
        const next = cloneStorycard(current ?? {})
        next[key] = value
        setStorycardJSONText(stringifyJSON(next))
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
        setStorycardJSONText(stringifyJSON(next))
        return next
      })
    },
    []
  )

  const handleJSONChange = useCallback((value: string) => {
    setStorycardJSONText(value)

    try {
      const parsed = parseJSONInput(value)
      setStorycardDraft(parsed)
      setStorycardError(null)
    } catch {
      // Keep invalid JSON local until save.
    }
  }, [])

  const handleSaveStorycard = useCallback(async () => {
    if (!storycardRecord) return

    let nextDraft = storycardDraft
    if (storycardTab === "json") {
      try {
        nextDraft = parseJSONInput(storycardJSONText)
      } catch {
        setStorycardError(t("presentation.detail.storycard.invalidJson"))
        return
      }
    }

    if (!nextDraft) {
      setStorycardError(t("presentation.detail.storycard.empty"))
      return
    }

    setSavingStorycard(true)
    setStorycardError(null)

    try {
      const result = await presentationsClient.updateStorycard(storycardRecord.id, {
        version: storycardRecord.version,
        storycard_json: nextDraft,
      })

      if ("error" in result) {
        throw new Error(String(result.error))
      }

      toast({
        description: t("presentation.detail.storycard.saveSuccess"),
      })

      await loadStorycard()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save storycard"
      console.error("[PresentationTaskDetail] Failed to save storycard", {
        storycardId: storycardRecord.id,
        error,
      })
      setStorycardError(message)
    } finally {
      setSavingStorycard(false)
    }
  }, [loadStorycard, storycardDraft, storycardJSONText, storycardRecord, storycardTab, t, toast])

  const handleRegenerateStorycard = useCallback(async () => {
    setRegeneratingStorycard(true)
    setStorycardError(null)

    try {
      const refreshed = await presentationsClient.refreshStorycard(
        detail.article_id,
        storycardRecord?.language === "en" ? "en" : "zh",
        true
      )

      if ("error" in refreshed) {
        throw new Error(String(refreshed.error))
      }

      if (refreshed.storycard) {
        syncStorycardDraft(refreshed.storycard)
      } else {
        await loadStorycard()
      }

      toast({
        description: t("presentation.detail.storycard.regenerateStarted"),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to regenerate storycard"
      console.error("[PresentationTaskDetail] Failed to regenerate storycard", {
        articleId: detail.article_id,
        error,
      })
      setStorycardError(message)
    } finally {
      setRegeneratingStorycard(false)
    }
  }, [detail.article_id, loadStorycard, storycardRecord?.language, syncStorycardDraft, t, toast])

  const handleExportPPT = useCallback(async () => {
    if (hasPPTUrl && presentationDownloadUrl) {
      triggerDownload(presentationDownloadUrl)
      return
    }

    setExportingPPT(true)

    try {
      const exported = await presentationsClient.exportPPT(detail.id)
      if ("error" in exported) {
        throw new Error(String(exported.error))
      }

      setPendingDownloadTaskId(detail.id)
      toast({
        description: t("presentation.detail.preview.exportStarted"),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export PPT"
      console.error("[PresentationTaskDetail] Failed to export PPT", {
        detailId: detail.id,
        error,
      })
      toast({
        variant: "destructive",
        description: message,
      })
    } finally {
      setExportingPPT(false)
    }
  }, [detail.id, hasPPTUrl, presentationDownloadUrl, t, toast])

  if (detail.task_kind === "storycard_generate") {
    return (
      <div className="flex items-center justify-center rounded-2xl border bg-muted/20 px-6 py-8">
        <div className="max-w-md text-center">
          <p className="text-sm text-muted-foreground">
            {t("presentation.detail.storycardGenerateHint")}
          </p>
        </div>
      </div>
    )
  }

  if (detail.task_kind === "layout_generate") {
    return (
      <div className="flex min-h-[320px] max-h-[calc(82vh-12rem)] flex-col overflow-hidden rounded-2xl border bg-background">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {htmlError ? (
            <Alert variant="destructive" className="m-4">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{htmlError}</AlertDescription>
            </Alert>
          ) : null}

          {hasSlideProgress ? (
            <div className="p-4">
              <PresentationSlideProgressPanel detail={detail} />
            </div>
          ) : null}

          {!htmlReady ? (
            hasSlideProgress ? null : (
              <div className="px-4 py-8 text-sm text-muted-foreground">
                {t("presentation.detail.preview.waiting")}
              </div>
            )
          ) : htmlLoading ? (
            <div className="flex items-center justify-center px-4 py-12">
              <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : htmlContent ? (
            <div className="flex min-h-full w-full bg-muted/20 p-4">
              <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
                <iframe
                  title={`presentation-preview-${detail.id}`}
                  srcDoc={htmlContent}
                  className="absolute inset-0 h-full w-full rounded-xl border bg-white"
                  sandbox="allow-same-origin allow-scripts allow-downloads"
                />
              </div>
            </div>
          ) : (
            <div className="px-4 py-8 text-sm text-muted-foreground">
              {t("presentation.detail.preview.empty")}
            </div>
          )}
        </div>

        <div className="border-t px-4 py-3">
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => void handleExportPPT()}
              disabled={exportInProgress || !htmlReady}
            >
              {exportInProgress ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <DownloadIcon className="h-4 w-4" />
              )}
              {hasPPTUrl
                ? t("presentation.detail.preview.downloadPpt")
                : t("presentation.detail.preview.exportPpt")}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <section className="min-h-0 overflow-hidden rounded-2xl border bg-muted/20">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {t("presentation.detail.storycard.title")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("presentation.detail.storycard.description")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleRegenerateStorycard()}
                disabled={regeneratingStorycard}
              >
                {regeneratingStorycard ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCwIcon className="h-4 w-4" />
                )}
                {t("presentation.detail.storycard.regenerate")}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleSaveStorycard()}
                disabled={savingStorycard || !storycardRecord}
              >
                {savingStorycard ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <SaveIcon className="h-4 w-4" />
                )}
                {t("presentation.detail.storycard.save")}
              </Button>
            </div>
          </div>

          {storycardError ? (
            <Alert variant="destructive" className="m-4">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{storycardError}</AlertDescription>
            </Alert>
          ) : null}

          {storycardLoading ? (
            <div className="flex items-center justify-center px-4 py-12">
              <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !storycardDraft ? (
            <div className="px-4 py-8 text-sm text-muted-foreground">
              {t("presentation.detail.storycard.empty")}
            </div>
          ) : (
            <Tabs
              value={storycardTab}
              onValueChange={setStorycardTab}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="border-b px-4 py-3">
                <TabsList className="w-full">
                  <TabsTrigger value="slides">{t("presentation.detail.storycard.slidesTab")}</TabsTrigger>
                  <TabsTrigger value="json">{t("presentation.detail.storycard.jsonTab")}</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="slides" className="min-h-0">
                <ScrollArea className="max-h-[60vh]">
                  <div className="space-y-5 p-4">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          {t("presentation.detail.storycard.storyTitle")}
                        </p>
                        <Input
                          value={storycardDraft.title ?? ""}
                          onChange={(event) =>
                            handleStorycardFieldChange("title", event.target.value)
                          }
                        />
                      </div>
                    </div>

                    {slides.map((slide, index) => (
                      <div key={slide.id || `slide-${index}`} className="space-y-3 rounded-2xl border bg-background p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {t("presentation.detail.storycard.slideTitle", { index: index + 1 })}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">{slide.id}</span>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                            {t("presentation.detail.storycard.headline")}
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
                            {t("presentation.detail.storycard.subheadline")}
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
                            {t("presentation.detail.storycard.body")}
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
                            {t("presentation.detail.storycard.notes")}
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
              </TabsContent>

              <TabsContent value="json" className="min-h-0 p-4">
                <Textarea
                  className="min-h-[320px] max-h-[60vh] overflow-y-auto font-mono text-xs"
                  value={storycardJSONText}
                  onChange={(event) => handleJSONChange(event.target.value)}
                />
              </TabsContent>
            </Tabs>
          )}
        </section>

        <section className="min-h-0 overflow-hidden rounded-2xl border bg-background">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {t("presentation.detail.preview.title")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("presentation.detail.preview.description")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadHTML()}
                disabled={htmlLoading || detail.status !== "success"}
              >
                {htmlLoading ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCwIcon className="h-4 w-4" />
                )}
                {t("common.refresh")}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleExportPPT()}
                disabled={exportingPPT || detail.status !== "success"}
              >
                {exportingPPT ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <DownloadIcon className="h-4 w-4" />
                )}
                {hasPPTUrl
                  ? t("presentation.detail.preview.downloadPpt")
                  : t("presentation.detail.preview.exportPpt")}
              </Button>
            </div>
          </div>

          {htmlError ? (
            <Alert variant="destructive" className="m-4">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{htmlError}</AlertDescription>
            </Alert>
          ) : null}

          {hasSlideProgress ? (
            <div className="p-4">
              <PresentationSlideProgressPanel detail={detail} />
            </div>
          ) : null}

          {detail.status !== "success" ? (
            hasSlideProgress ? null : (
              <div className="px-4 py-8 text-sm text-muted-foreground">
                {t("presentation.detail.preview.waiting")}
              </div>
            )
          ) : htmlLoading ? (
            <div className="flex items-center justify-center px-4 py-12">
              <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : htmlContent ? (
            <div className="w-full bg-muted/20 p-4">
              <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
                <iframe
                  title={`presentation-preview-${detail.id}`}
                  srcDoc={htmlContent}
                  className="absolute inset-0 h-full w-full rounded-xl border bg-white"
                  sandbox="allow-same-origin allow-scripts allow-downloads"
                />
              </div>
            </div>
          ) : (
            <div className="px-4 py-8 text-sm text-muted-foreground">
              {t("presentation.detail.preview.empty")}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
