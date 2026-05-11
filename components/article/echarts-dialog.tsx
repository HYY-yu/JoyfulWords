"use client"

import { useEffect, useState } from "react"
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
  const [maxCharts, setMaxCharts] = useState("3")
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    const nextMode: ChartMode = selectedText.trim() ? "selection" : "article"
    setMode(nextMode)
    setPrompt(getDefaultPrompt(nextMode, locale))
    setMaxCharts("3")
    setSubmitting(false)
    setErrorMessage(null)
  }, [locale, open, selectedText])

  const canSubmit =
    !submitting &&
    (mode === "article" || prompt.trim().length >= 3) &&
    (mode === "selection" ? Boolean(selectedTextPreview) : typeof articleId === "number")

  const handleSelectionGenerate = async () => {
    const result = await echartsClient.generate({
      article_id: articleId ?? 0,
      display: DEFAULT_JOY_CHART_DISPLAY,
      prompt: `${prompt.trim()}\n\n${t("echarts.dialog.selectedTextPrefix")}\n${selectedTextPreview}`,
    })

    if (isErrorResponse(result)) {
      throw new Error(result.error)
    }

    onTasksSubmitted?.([{ id: result.id, type: "echarts" }])
    toast({
      title: t("echarts.dialog.selectionSubmittedTitle"),
      description: t("echarts.dialog.selectionSubmittedDescription"),
    })
  }

  const handleArticleGenerate = async () => {
    if (typeof articleId !== "number") {
      throw new Error(t("echarts.dialog.articleRequired"))
    }

    const result = await echartsClient.generateFromArticle({
      article_id: articleId,
      max_charts: Number(maxCharts),
      display: DEFAULT_JOY_CHART_DISPLAY,
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
          {mode === "selection" ? t("echarts.dialog.generate") : t("echarts.dialog.generateFromArticle")}
        </Button>
      }
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
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
    </AIFeatureDialogShell>
  )
}
