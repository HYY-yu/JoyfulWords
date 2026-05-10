"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BarChart3Icon,
  FileTextIcon,
  Loader2Icon,
  MousePointer2Icon,
  SparklesIcon,
} from "lucide-react"
import { AIFeatureDialogShell } from "@/components/ui/ai/ai-feature-dialog-shell"
import { Alert, AlertDescription } from "@/components/ui/base/alert"
import { Button } from "@/components/ui/base/button"
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
  GenerateEChartsFromArticleResponse,
  JoyChartDisplay,
  JoyChartSpec,
} from "@/lib/api/echarts/types"
import type { ErrorResponse } from "@/lib/api/types"
import { DEFAULT_JOY_CHART_DISPLAY } from "@/lib/echarts/joy-chart-defaults"
import type { TaskCenterTaskReference } from "@/lib/api/taskcenter/types"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { cn } from "@/lib/utils"

interface EChartsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  articleId?: number | null
  selectedText: string
  onTasksSubmitted?: (taskRefs: TaskCenterTaskReference[]) => void
}

type ChartMode = "selection" | "article"

function isErrorResponse<T extends object>(value: T | ErrorResponse): value is ErrorResponse {
  return "error" in value && typeof value.error === "string"
}

function isGeneratedChart(result: EChartsLogResponse): result is EChartsLogResponse & { spec: JoyChartSpec } {
  return Boolean("chart" in result.spec && result.spec.chart?.type && "dataset" in result.spec)
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

export function EChartsDialog({
  open,
  onOpenChange,
  articleId,
  selectedText,
  onTasksSubmitted,
}: EChartsDialogProps) {
  const { locale, t } = useTranslation()
  const { toast } = useToast()
  const selectedTextPreview = selectedText.trim()
  const inferredMode: ChartMode = selectedTextPreview ? "selection" : "article"
  const [mode, setMode] = useState<ChartMode>(inferredMode)
  const [prompt, setPrompt] = useState(getDefaultPrompt(inferredMode, locale))
  const [theme, setTheme] = useState(DEFAULT_JOY_CHART_DISPLAY.style.theme)
  const [maxCharts, setMaxCharts] = useState("3")
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    const nextMode: ChartMode = selectedText.trim() ? "selection" : "article"
    setMode(nextMode)
    setPrompt(getDefaultPrompt(nextMode, locale))
    setTheme(DEFAULT_JOY_CHART_DISPLAY.style.theme)
    setMaxCharts("3")
    setSubmitting(false)
    setErrorMessage(null)
  }, [locale, open, selectedText])

  const display = useMemo<JoyChartDisplay>(
    () => ({
      style: { theme },
      legend: DEFAULT_JOY_CHART_DISPLAY.legend,
      tooltip: DEFAULT_JOY_CHART_DISPLAY.tooltip,
      label: DEFAULT_JOY_CHART_DISPLAY.label,
      axis: { showGrid: DEFAULT_JOY_CHART_DISPLAY.axis.showGrid },
    }),
    [theme]
  )

  const canSubmit =
    !submitting &&
    (mode === "article" || prompt.trim().length >= 3) &&
    (mode === "selection" ? Boolean(selectedTextPreview) : typeof articleId === "number")

  const handleSelectionGenerate = async () => {
    if (!window.joyfulWordsCharts) {
      throw new Error(t("tiptapEditor.toast.editorNotReady"))
    }

    const localId = window.joyfulWordsCharts.insertChart({
      status: "loading",
      sourceMode: "selection",
      title: t("echarts.dialog.generatingTitle"),
      display,
    })

    if (!localId) {
      throw new Error(t("tiptapEditor.toast.editorNotReady"))
    }

    const result = await echartsClient.generate({
      article_id: articleId ?? 0,
      display,
      prompt: `${prompt.trim()}\n\n${t("echarts.dialog.selectedTextPrefix")}\n${selectedTextPreview}`,
    })

    if (isErrorResponse(result)) {
      window.joyfulWordsCharts.updateChart(localId, {
        status: "failed",
        errorMessage: result.error,
      })
      throw new Error(result.error)
    }

    if (!isGeneratedChart(result)) {
      window.joyfulWordsCharts.updateChart(localId, {
        status: "failed",
        errorMessage: t("echarts.chart.emptySpec"),
      })
      throw new Error(t("echarts.chart.emptySpec"))
    }

    window.joyfulWordsCharts.updateChart(localId, {
      status: "ready",
      logId: result.id,
      version: result.version,
      chartType: result.chart_type || result.spec.chart?.type,
      title: result.title || result.spec.chart?.title,
      spec: result.spec,
      display: result.spec.display ?? display,
      errorMessage: null,
    })
  }

  const handleArticleGenerate = async () => {
    if (typeof articleId !== "number") {
      throw new Error(t("echarts.dialog.articleRequired"))
    }

    const result = await echartsClient.generateFromArticle({
      article_id: articleId,
      max_charts: Number(maxCharts),
      display,
    })

    if (isErrorResponse(result)) {
      throw new Error(result.error)
    }

    const response = result as GenerateEChartsFromArticleResponse
    const taskRefs = response.items
      .map((item) => item.log)
      .filter((log): log is EChartsLogResponse => Boolean(log?.id))
      .map((log) => ({ id: log.id, type: "echarts" as const }))

    onTasksSubmitted?.(taskRefs)

    if (response.total === 0) {
      toast({
        title: t("echarts.dialog.noChartsTitle"),
        description: t("echarts.dialog.noChartsDescription"),
      })
      return
    }

    toast({
      title: t("echarts.dialog.articleSubmittedTitle"),
      description: t("echarts.dialog.articleSubmittedDescription", { count: response.total }),
    })
  }

  const handleSubmit = async () => {
    if (!canSubmit) return

    setSubmitting(true)
    setErrorMessage(null)
    try {
      if (mode === "selection") {
        await handleSelectionGenerate()
        toast({ title: t("echarts.dialog.insertedTitle") })
        onOpenChange(false)
        return
      }

      await handleArticleGenerate()
      onOpenChange(false)
    } catch (error) {
      console.error("[EChartsDialog] Failed to generate chart", {
        mode,
        articleId,
        error,
      })
      setErrorMessage(error instanceof Error ? error.message : t("common.unknownError"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AIFeatureDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("echarts.dialog.title")}
      icon={<BarChart3Icon className="h-5 w-5 text-primary" />}
      size="large"
      footer={
        <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <SparklesIcon className="h-4 w-4" />}
          {mode === "selection" ? t("echarts.dialog.generateAndInsert") : t("echarts.dialog.generateFromArticle")}
        </Button>
      }
    >
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-h-0 overflow-y-auto px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                mode === "selection" ? "border-primary/50 bg-primary/5" : "border-border hover:bg-muted/40",
                !selectedTextPreview && "cursor-not-allowed opacity-50"
              )}
              disabled={!selectedTextPreview}
              onClick={() => setMode("selection")}
            >
              <MousePointer2Icon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">{t("echarts.dialog.selectionMode")}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("echarts.dialog.selectionModeDesc")}</p>
              </div>
            </button>
            <button
              type="button"
              className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
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
                <Label>{t("echarts.dialog.selectedText")}</Label>
                <div className="max-h-52 overflow-y-auto rounded-lg border bg-muted/30 p-3 text-sm leading-6 text-muted-foreground">
                  {selectedTextPreview || t("echarts.dialog.noSelection")}
                </div>
              </div>
            </>
          ) : (
            <div className="mt-5 space-y-2">
              <Label>{t("echarts.dialog.maxCharts")}</Label>
              <Select value={maxCharts} onValueChange={setMaxCharts}>
                <SelectTrigger className="w-36">
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
          )}

          {errorMessage ? (
            <Alert variant="destructive" className="mt-5">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        <aside className="border-t bg-muted/20 px-6 py-5 lg:border-l lg:border-t-0">
          <div className="space-y-2">
            <Label>{t("echarts.display.theme")}</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clean">{t("echarts.themes.clean")}</SelectItem>
                <SelectItem value="infographic">{t("echarts.themes.infographic")}</SelectItem>
                <SelectItem value="vintage">{t("echarts.themes.vintage")}</SelectItem>
                <SelectItem value="dark">{t("echarts.themes.dark")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-5 rounded-lg border bg-background p-4">
            <p className="text-xs font-semibold text-foreground">{t("echarts.dialog.displayPreset")}</p>
            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
              <p>{t("echarts.dialog.displayPresetLegend")}</p>
              <p>{t("echarts.dialog.displayPresetTooltip")}</p>
              <p>{t("echarts.dialog.displayPresetGrid")}</p>
            </div>
          </div>
        </aside>
      </div>
    </AIFeatureDialogShell>
  )
}
