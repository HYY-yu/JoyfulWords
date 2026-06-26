"use client"

import { useEffect, useState } from "react"
import {
  AlertCircleIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  Clock3Icon,
  FileTextIcon,
  Loader2Icon,
  MousePointer2Icon,
  SparklesIcon,
} from "lucide-react"
import { AIFeatureDialogShell } from "@/components/ui/ai/ai-feature-dialog-shell"
import { Alert, AlertDescription } from "@/components/ui/base/alert"
import { Button } from "@/components/ui/base/button"
import { Badge } from "@/components/ui/base/badge"
import { Label } from "@/components/ui/base/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/base/select"
import { Textarea } from "@/components/ui/base/textarea"
import { useToast } from "@/hooks/use-toast"
import { echartsClient } from "@/lib/api/echarts/client"
import type {
  EChartsLogResponse,
  GenerateEChartsFromArticleItem,
  GenerateEChartsFromArticleResponse,
} from "@/lib/api/echarts/types"
import type { ErrorResponse } from "@/lib/api/types"
import { DEFAULT_JOY_CHART_DISPLAY } from "@/lib/echarts/joy-chart-defaults"
import type {
  TaskCenterEChartsTaskListItem,
  TaskCenterTaskReference,
} from "@/lib/api/taskcenter/types"
import type { EChartsArticleAnalysisSession } from "@/lib/echarts/article-analysis-session"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { cn } from "@/lib/utils"

interface EChartsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  articleId?: number | null
  selectedText: string
  articleAnalysisSession?: EChartsArticleAnalysisSession | null
  onArticleAnalysisSessionChange?: (session: EChartsArticleAnalysisSession | null) => void
  onTasksSubmitted?: (
    taskRefs: TaskCenterTaskReference[],
    taskItems?: TaskCenterEChartsTaskListItem[]
  ) => void
}

type ChartMode = "selection" | "article"

const SELECTION_TEXT_LIMIT = 300

function isErrorResponse<T extends object>(value: T | ErrorResponse): value is ErrorResponse {
  return "error" in value && typeof value.error === "string"
}

function getDefaultPrompt(mode: ChartMode, locale: "zh" | "en") {
  if (mode === "article") {
    return locale === "zh"
      ? "分析整篇文章，找出最适合用图表表达的数据关系。"
      : "Analyze the article and find the strongest data relationships to visualize."
  }

  return locale === "zh"
    ? "根据选中文本生成一张清晰、适合插入文章的图表。"
    : "Generate a clear chart from the selected text for insertion into the article."
}

function createRequestId(articleId: number): string {
  return `echarts-article-${articleId}-${Date.now()}`
}

function mapEChartsLogToTaskItem(log: EChartsLogResponse): TaskCenterEChartsTaskListItem {
  return {
    id: log.id,
    type: "echarts",
    status: log.status,
    created_at: log.created_at,
    details: {
      article_id: log.article_id,
      prompt: log.prompt,
      chart_type: log.chart_type,
      title: log.title,
      schema_version: log.schema_version,
      error_code: log.error_code,
      error_message: log.error_message,
      completed_at:
        log.status === "failed" || log.status === "succeeded" ? log.updated_at : undefined,
    },
  }
}

function getArticleResponseLogs(
  items: GenerateEChartsFromArticleItem[]
): EChartsLogResponse[] {
  return items
    .map((item) => item.log)
    .filter((log): log is EChartsLogResponse => Boolean(log?.id))
}

export function EChartsDialog({
  open,
  onOpenChange,
  articleId,
  selectedText,
  articleAnalysisSession,
  onArticleAnalysisSessionChange,
  onTasksSubmitted,
}: EChartsDialogProps) {
  const { locale, t } = useTranslation()
  const { toast } = useToast()
  const selectedTextPreview = selectedText.trim()
  const selectedTextLength = selectedTextPreview.length
  const hasSelectedText = selectedTextLength > 0
  const isSelectionTooLong = selectedTextLength > SELECTION_TEXT_LIMIT
  const inferredMode: ChartMode = selectedTextPreview ? "selection" : "article"
  const [mode, setMode] = useState<ChartMode>(inferredMode)
  const [prompt, setPrompt] = useState(getDefaultPrompt(inferredMode, locale))
  const [maxCharts, setMaxCharts] = useState("3")
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const activeArticleAnalysisSession =
    articleAnalysisSession &&
    typeof articleId === "number" &&
    articleAnalysisSession.articleId === articleId
      ? articleAnalysisSession
      : null
  const isArticleAnalysisSubmitting = activeArticleAnalysisSession?.status === "submitting"

  useEffect(() => {
    if (!open) return

    if (activeArticleAnalysisSession) {
      setMode("article")
      setMaxCharts(String(activeArticleAnalysisSession.maxCharts))
      setSubmitting(activeArticleAnalysisSession.status === "submitting")
      setErrorMessage(null)
      return
    }

    const nextMode: ChartMode = selectedText.trim() ? "selection" : "article"
    setMode(nextMode)
    setPrompt(getDefaultPrompt(nextMode, locale))
    setMaxCharts("3")
    setSubmitting(false)
    setErrorMessage(null)
  }, [activeArticleAnalysisSession, locale, open, selectedText, t])

  const canSubmit =
    !submitting &&
    !isArticleAnalysisSubmitting &&
    (mode === "article" || prompt.trim().length >= 3) &&
    (mode === "selection"
      ? hasSelectedText && !isSelectionTooLong
      : typeof articleId === "number")

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isArticleAnalysisSubmitting) {
      toast({
        title: t("echarts.dialog.analysisKeptTitle"),
        description: t("echarts.dialog.analysisKeptDescription"),
      })
    }

    onOpenChange(nextOpen)
  }

  const handleSelectionGenerate = async () => {
    const result = await echartsClient.generate({
      article_id: articleId ?? 0,
      display: DEFAULT_JOY_CHART_DISPLAY,
      prompt: `${prompt.trim()}\n\n${t("echarts.dialog.selectedTextPrefix")}\n${selectedTextPreview}`,
    })

    if (isErrorResponse(result)) {
      throw new Error(result.error)
    }

    onTasksSubmitted?.([{ id: result.id, type: "echarts" }], [mapEChartsLogToTaskItem(result)])
    toast({
      title: t("echarts.dialog.selectionSubmittedTitle"),
      description: t("echarts.dialog.selectionSubmittedDescription"),
    })
  }

  const handleArticleGenerate = async () => {
    if (typeof articleId !== "number") {
      throw new Error(t("echarts.dialog.articleRequired"))
    }

    const startedAt = Date.now()
    const pendingSession: EChartsArticleAnalysisSession = {
      requestId: createRequestId(articleId),
      articleId,
      maxCharts: Number(maxCharts),
      status: "submitting",
      startedAt,
      updatedAt: startedAt,
    }
    onArticleAnalysisSessionChange?.(pendingSession)

    let result: GenerateEChartsFromArticleResponse | ErrorResponse
    try {
      result = await echartsClient.generateFromArticle({
        article_id: articleId,
        max_charts: Number(maxCharts),
        display: DEFAULT_JOY_CHART_DISPLAY,
      })
    } catch (error) {
      onArticleAnalysisSessionChange?.({
        ...pendingSession,
        status: "failed",
        updatedAt: Date.now(),
        errorMessage: error instanceof Error ? error.message : t("common.unknownError"),
      })
      throw error
    }

    if (isErrorResponse(result)) {
      onArticleAnalysisSessionChange?.({
        ...pendingSession,
        status: "failed",
        updatedAt: Date.now(),
        errorMessage: result.error,
      })
      throw new Error(result.error)
    }

    const response = result as GenerateEChartsFromArticleResponse
    const logs = getArticleResponseLogs(response.items)
    const taskRefs = logs.map((log) => ({ id: log.id, type: "echarts" as const }))
    const taskItems = logs.map(mapEChartsLogToTaskItem)

    onTasksSubmitted?.(taskRefs, taskItems)

    if (response.total === 0) {
      onArticleAnalysisSessionChange?.({
        ...pendingSession,
        status: "empty",
        updatedAt: Date.now(),
        total: 0,
        taskRefs,
      })
      toast({
        title: t("echarts.dialog.noChartsTitle"),
        description: t("echarts.dialog.noChartsDescription"),
      })
      return
    }

    onArticleAnalysisSessionChange?.({
      ...pendingSession,
      status: "submitted",
      updatedAt: Date.now(),
      total: response.total,
      taskRefs,
    })
    toast({
      title: t("echarts.dialog.articleSubmittedTitle"),
      description: t("echarts.dialog.articleSubmittedDescription", { count: response.total }),
    })
  }

  const handleSubmit = async () => {
    if (mode === "selection" && isSelectionTooLong) {
      toast({
        variant: "destructive",
        title: t("echarts.dialog.selectionTooLongTitle"),
        description: t("echarts.dialog.selectionTooLongDescription", {
          limit: SELECTION_TEXT_LIMIT,
          count: selectedTextLength,
        }),
      })
      return
    }

    if (!canSubmit) return

    setSubmitting(true)
    setErrorMessage(null)
    try {
      if (mode === "selection") {
        await handleSelectionGenerate()
        onOpenChange(false)
        return
      }

      await handleArticleGenerate()
    } catch (error) {
      console.error("[EChartsDialog] Failed to generate chart", {
        mode,
        articleId,
        error,
      })
      setErrorMessage(
        mode === "article"
          ? null
          : error instanceof Error
          ? error.message
          : t("common.unknownError")
      )
    } finally {
      setSubmitting(false)
    }
  }

  const articleStatusBlock = (() => {
    if (mode !== "article" || !activeArticleAnalysisSession) return null

    const status = activeArticleAnalysisSession.status
    const isFailed = status === "failed"
    const isEmpty = status === "empty"
    const isSubmitted = status === "submitted"
    const Icon = isFailed ? AlertCircleIcon : isEmpty || isSubmitted ? CheckCircle2Icon : Clock3Icon

    return (
      <div
        className={cn(
          "rounded-xl border p-4",
          isFailed
            ? "border-destructive/30 bg-destructive/5"
            : isSubmitted || isEmpty
            ? "border-emerald-200 bg-emerald-50/70 text-emerald-950"
            : "border-primary/20 bg-primary/5"
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              isFailed
                ? "bg-destructive/10 text-destructive"
                : isSubmitted || isEmpty
                ? "bg-emerald-100 text-emerald-700"
                : "bg-primary/10 text-primary"
            )}
          >
            <Icon className={cn("h-4 w-4", status === "submitting" && "animate-pulse")} />
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold">
                {status === "submitting"
                  ? t("echarts.dialog.analysisSubmittingTitle")
                  : status === "submitted"
                  ? t("echarts.dialog.analysisSubmittedInlineTitle")
                  : status === "empty"
                  ? t("echarts.dialog.noChartsTitle")
                  : t("echarts.dialog.analysisFailedTitle")}
              </p>
              <Badge variant="outline" className="bg-background/80">
                {t("echarts.dialog.maxChartsValue", {
                  count: activeArticleAnalysisSession.maxCharts,
                })}
              </Badge>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              {status === "submitting"
                ? t("echarts.dialog.analysisSubmittingDescription")
                : status === "submitted"
                ? t("echarts.dialog.analysisSubmittedInlineDescription", {
                    count: activeArticleAnalysisSession.total ?? 0,
                  })
                : status === "empty"
                ? t("echarts.dialog.noChartsDescription")
                : activeArticleAnalysisSession.errorMessage ||
                  t("echarts.dialog.analysisFailedDescription")}
            </p>
          </div>
        </div>
      </div>
    )
  })()

  return (
    <AIFeatureDialogShell
      open={open}
      onOpenChange={handleDialogOpenChange}
      title={t("echarts.dialog.title")}
      icon={<BarChart3Icon className="h-5 w-5 text-primary" />}
      size="large"
      contentClassName="w-[calc(100vw-2rem)] sm:w-[min(92vw,860px)] sm:max-w-[860px] lg:max-w-[860px] xl:max-w-[860px]"
      footer={
        <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <SparklesIcon className="h-4 w-4" />}
          {mode === "selection" ? t("echarts.dialog.generate") : t("echarts.dialog.generateFromArticle")}
        </Button>
      }
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
              mode === "selection" ? "border-primary/50 bg-primary/5" : "border-border hover:bg-muted/40",
              (!hasSelectedText || isArticleAnalysisSubmitting) && "cursor-not-allowed opacity-50"
            )}
            disabled={!hasSelectedText || isArticleAnalysisSubmitting}
            onClick={() => setMode("selection")}
          >
            <MousePointer2Icon className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">{t("echarts.dialog.selectionMode")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("echarts.dialog.selectionModeDesc", { limit: SELECTION_TEXT_LIMIT })}
              </p>
            </div>
          </button>
          <button
            type="button"
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
              mode === "article" ? "border-primary/50 bg-primary/5" : "border-border hover:bg-muted/40"
            )}
            onClick={() => setMode("article")}
          >
            <FileTextIcon className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">{t("echarts.dialog.articleMode")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("echarts.dialog.articleModeDesc")}</p>
            </div>
          </button>
        </div>

        {mode === "selection" ? (
          <>
            <div className="mt-5 space-y-2">
              <Label>{t("echarts.dialog.prompt")}</Label>
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                className="min-h-28 resize-none"
              />
            </div>
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label>{t("echarts.dialog.selectedText")}</Label>
                <span
                  className={cn(
                    "text-xs",
                    isSelectionTooLong ? "font-medium text-destructive" : "text-muted-foreground"
                  )}
                >
                  {t("echarts.dialog.selectedTextCount", {
                    count: selectedTextLength,
                    limit: SELECTION_TEXT_LIMIT,
                  })}
                </span>
              </div>
              <div
                className={cn(
                  "max-h-52 overflow-y-auto rounded-lg border bg-muted/30 p-3 text-sm leading-6 text-muted-foreground",
                  isSelectionTooLong && "border-destructive/50 bg-destructive/5 text-destructive"
                )}
              >
                {selectedTextPreview || t("echarts.dialog.noSelection")}
              </div>
              <p
                className={cn(
                  "text-xs leading-5",
                  isSelectionTooLong ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {isSelectionTooLong
                  ? t("echarts.dialog.selectedTextTooLongHint", {
                      limit: SELECTION_TEXT_LIMIT,
                      count: selectedTextLength,
                    })
                  : t("echarts.dialog.selectedTextHint", {
                      limit: SELECTION_TEXT_LIMIT,
                    })}
              </p>
            </div>
          </>
        ) : (
          <div className="mt-5 space-y-4">
            {articleStatusBlock}

            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Label>{t("echarts.dialog.maxCharts")}</Label>
                <Select
                  value={maxCharts}
                  onValueChange={setMaxCharts}
                  disabled={isArticleAnalysisSubmitting}
                >
                  <SelectTrigger className="h-9 w-32 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 5, 8].map((count) => (
                      <SelectItem key={count} value={String(count)}>
                        {count}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {t("echarts.dialog.articleAnalysisHint")}
              </p>
            </div>
          </div>
        )}

        {errorMessage ? (
          <Alert variant="destructive" className="mt-5">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    </AIFeatureDialogShell>
  )
}
