"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertCircleIcon, DownloadIcon, Loader2Icon, RefreshCwIcon, SaveIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/base/alert"
import { Button } from "@/components/ui/base/button"
import { Input } from "@/components/ui/base/input"
import { ScrollArea } from "@/components/ui/base/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/base/tabs"
import { Textarea } from "@/components/ui/base/textarea"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { presentationsClient } from "@/lib/api/presentations/client"
import type {
  PresentationStorycardDocument,
  PresentationStorycardRecord,
} from "@/lib/api/presentations/types"
import type { TaskCenterPresentationTaskDetail } from "@/lib/api/taskcenter/types"

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

interface PresentationTaskDetailProps {
  detail: TaskCenterPresentationTaskDetail
  onSelectTask?: (taskRef: { id: number; type: "presentation" }) => void
}

export function PresentationTaskDetail({ detail, onSelectTask }: PresentationTaskDetailProps) {
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

  const hasPPTUrl = typeof detail.ppt_url === "string" && detail.ppt_url.trim().length > 0

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
    if (detail.status !== "success" || detail.task_kind !== "layout_generate") {
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

      setHTMLContent(result.html_content || "")
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
  }, [detail.id, detail.status, detail.task_kind])

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
      detail.status === "success" &&
      typeof detail.ppt_url === "string" &&
      detail.ppt_url.trim().length > 0
    ) {
      triggerDownload(detail.ppt_url)
      setPendingDownloadTaskId(null)
    }
  }, [detail.id, detail.ppt_url, detail.status, pendingDownloadTaskId])

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
    if (hasPPTUrl && detail.ppt_url) {
      triggerDownload(detail.ppt_url)
      return
    }

    setExportingPPT(true)

    try {
      const exported = await presentationsClient.exportPPT(detail.id)
      if ("error" in exported) {
        throw new Error(String(exported.error))
      }

      setPendingDownloadTaskId(exported.presentation_log_id)
      onSelectTask?.({
        id: exported.presentation_log_id,
        type: "presentation",
      })
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
  }, [detail.id, detail.ppt_url, hasPPTUrl, onSelectTask, t, toast])

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

  if (detail.task_kind === "ppt_export") {
    return (
      <div className="flex items-center justify-center rounded-2xl border bg-muted/20 px-6 py-8">
        <Button
          type="button"
          onClick={() => {
            if (hasPPTUrl && detail.ppt_url) {
              triggerDownload(detail.ppt_url)
            }
          }}
          disabled={detail.status !== "success" || !hasPPTUrl}
        >
          <DownloadIcon className="h-4 w-4" />
          {t("presentation.detail.preview.downloadPpt")}
        </Button>
      </div>
    )
  }

  if (detail.task_kind === "layout_generate") {
    return (
      <div className="flex flex-col min-h-0 overflow-hidden rounded-2xl border bg-background">
        <div className="flex-1 overflow-y-auto">
          {htmlError ? (
            <Alert variant="destructive" className="m-4">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{htmlError}</AlertDescription>
            </Alert>
          ) : null}

          {detail.status !== "success" ? (
            <div className="px-4 py-8 text-sm text-muted-foreground">
              {t("presentation.detail.preview.waiting")}
            </div>
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
        </div>

        <div className="border-t px-4 py-3">
          <div className="flex items-center justify-end gap-2">
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
                <ScrollArea className="h-[720px]">
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
                  className="h-[720px] min-h-[720px] font-mono text-xs"
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

          {detail.status !== "success" ? (
            <div className="px-4 py-8 text-sm text-muted-foreground">
              {t("presentation.detail.preview.waiting")}
            </div>
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
