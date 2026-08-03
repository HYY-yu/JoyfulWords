"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import {
  AlertCircleIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  DatabaseIcon,
  DownloadIcon,
  FileTextIcon,
  Loader2Icon,
  PaletteIcon,
  SparklesIcon,
  WandSparklesIcon,
} from "lucide-react"

import { JoyChartRenderer, type JoyChartRendererHandle } from "@/components/editor/joy-chart-renderer"
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
import { Slider } from "@/components/ui/base/slider"
import { Switch } from "@/components/ui/base/switch"
import { Textarea } from "@/components/ui/base/textarea"
import { useToast } from "@/hooks/use-toast"
import { billingClient } from "@/lib/api/billing/client"
import type { EChartsLogResponse, JoyChartDisplay, JoyChartSpec } from "@/lib/api/echarts/types"
import { toolboxClient } from "@/lib/api/toolbox/client"
import { useAuth } from "@/lib/auth/auth-context"
import { JOY_CHART_THEME_OPTIONS, mergeJoyChartDisplay } from "@/lib/echarts/joy-chart-defaults"
import { useAdaptivePolling } from "@/lib/hooks/use-adaptive-polling"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { cn } from "@/lib/utils"

const DATA_TEXT_MIN_LENGTH = 8
const REQUIREMENT_MIN_LENGTH = 4
const CHART_POLL_TIMEOUT_MS = 5 * 60 * 1000

type StepKey = "data" | "requirement" | "preview"

type RequiredJoyChartDisplay = Required<
  Omit<JoyChartDisplay, "layout" | "axis" | "style" | "bar" | "line" | "pie">
> & {
  layout: Required<NonNullable<JoyChartDisplay["layout"]>>
  axis: Required<NonNullable<JoyChartDisplay["axis"]>>
  style: Required<NonNullable<JoyChartDisplay["style"]>>
  bar: Required<NonNullable<JoyChartDisplay["bar"]>>
  line: Required<NonNullable<JoyChartDisplay["line"]>>
  pie: Required<NonNullable<JoyChartDisplay["pie"]>>
}

type ChartResultMeta = {
  mode: "guest" | "account"
  logId?: number
  title?: string
  chartType?: string
  status?: string
}

function isJoyChartSpec(value: unknown): value is JoyChartSpec {
  if (!value || typeof value !== "object") return false

  const candidate = value as Partial<JoyChartSpec>
  return Boolean(candidate.chart?.type && candidate.dataset?.source && candidate.dataset?.dimensions)
}

function isApiError(value: unknown): value is { error: string; status?: number; reason?: string; error_description?: string } {
  return Boolean(value && typeof value === "object" && "error" in value && typeof (value as { error?: unknown }).error === "string")
}

function isEChartsLogResponse(value: unknown): value is EChartsLogResponse {
  return Boolean(value && typeof value === "object" && "id" in value && "spec" in value)
}

function isToolboxEChartsTaskResponse(
  value: unknown
): value is { task_id: number; status: string; poll_url: string } {
  if (!value || typeof value !== "object") return false

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.task_id === "number" &&
    typeof candidate.status === "string" &&
    typeof candidate.poll_url === "string"
  )
}

function toRequiredDisplay(display?: JoyChartDisplay): RequiredJoyChartDisplay {
  return mergeJoyChartDisplay(display) as RequiredJoyChartDisplay
}

function patchDisplay(display: RequiredJoyChartDisplay, patch: JoyChartDisplay): RequiredJoyChartDisplay {
  return {
    ...display,
    ...patch,
    layout: { ...display.layout, ...patch.layout },
    axis: { ...display.axis, ...patch.axis },
    style: { ...display.style, ...patch.style },
    bar: { ...display.bar, ...patch.bar },
    line: { ...display.line, ...patch.line },
    pie: { ...display.pie, ...patch.pie },
  } as RequiredJoyChartDisplay
}

function createChartFileName(title: string | undefined) {
  const safeTitle = (title || "ai-chart")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)

  return `${safeTitle || "ai-chart"}-${Date.now()}.png`
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const anchor = document.createElement("a")
  anchor.href = dataUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

function StepTimeline({
  activeStep,
  completed,
}: {
  activeStep: StepKey
  completed: Partial<Record<StepKey, boolean>>
}) {
  const { t } = useTranslation()
  const steps: Array<{ key: StepKey; icon: typeof DatabaseIcon }> = [
    { key: "data", icon: DatabaseIcon },
    { key: "requirement", icon: FileTextIcon },
    { key: "preview", icon: BarChart3Icon },
  ]
  const activeIndex = steps.findIndex((step) => step.key === activeStep)

  return (
    <div className="grid gap-2 md:grid-cols-3" aria-label={t("toolsPage.aiCharts.timelineLabel")}>
      {steps.map((step, index) => {
        const Icon = step.icon
        const isActive = step.key === activeStep
        const isComplete = completed[step.key] || index < activeIndex

        return (
          <div
            key={step.key}
            className={cn(
              "flex min-h-14 items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
              isActive
                ? "border-primary/45 bg-primary/8 text-foreground"
                : isComplete
                  ? "border-primary/20 bg-primary/4 text-foreground"
                  : "border-border/70 bg-background/75 text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                isActive || isComplete ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              {isComplete ? <CheckCircle2Icon className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">
                {t(`toolsPage.aiCharts.steps.${step.key}.title`)}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {t(`toolsPage.aiCharts.steps.${step.key}.description`)}
              </span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function ToolboxAICharts() {
  const { t } = useTranslation()
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const rendererRef = useRef<JoyChartRendererHandle | null>(null)
  const pollingTaskRef = useRef<{
    taskId: number
    mode: "guest" | "account"
    preferAuth: boolean
  } | null>(null)
  const [dataText, setDataText] = useState("")
  const [requirement, setRequirement] = useState("")
  const [draftDisplay, setDraftDisplay] = useState<RequiredJoyChartDisplay>(() =>
    toRequiredDisplay()
  )
  const [resultSpec, setResultSpec] = useState<JoyChartSpec | null>(null)
  const [resultMeta, setResultMeta] = useState<ChartResultMeta | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const trimmedDataText = dataText.trim()
  const trimmedRequirement = requirement.trim()
  const preferAuth = loading || Boolean(user)
  const canGenerate =
    trimmedDataText.length >= DATA_TEXT_MIN_LENGTH &&
    trimmedRequirement.length >= REQUIREMENT_MIN_LENGTH &&
    !isGenerating
  const currentSpec = useMemo(
    () => (resultSpec ? { ...resultSpec, display: draftDisplay } : null),
    [draftDisplay, resultSpec]
  )
  const chartType = currentSpec?.chart.type || resultMeta?.chartType || "bar"
  const activeStep: StepKey = resultSpec
    ? "preview"
    : trimmedRequirement.length > 0 || trimmedDataText.length >= DATA_TEXT_MIN_LENGTH
      ? "requirement"
      : "data"
  const completed = {
    data: trimmedDataText.length >= DATA_TEXT_MIN_LENGTH,
    requirement: trimmedRequirement.length >= REQUIREMENT_MIN_LENGTH,
    preview: Boolean(resultSpec),
  }

  useEffect(() => {
    if (!user) {
      setCreditBalance(null)
      setIsLoadingBalance(false)
      return
    }

    let isCancelled = false

    const refreshBalance = async () => {
      setIsLoadingBalance(true)

      try {
        const result = await billingClient.refreshBalance()

        if (isCancelled) return

        if ("error" in result) {
          console.warn("[ToolboxAICharts] Failed to refresh account credit balance", {
            userId: user.id,
            error: result.error,
          })
          setCreditBalance(null)
          return
        }

        console.info("[ToolboxAICharts] Account credit balance refreshed", {
          userId: user.id,
          balanceCents: result.balance_cents,
          isCached: result.is_cached,
        })

        setCreditBalance(result.balance_cents)
      } catch (error) {
        if (isCancelled) return

        console.warn("[ToolboxAICharts] Unexpected balance refresh error", {
          userId: user.id,
          error: error instanceof Error ? error.message : String(error),
        })
        setCreditBalance(null)
      } finally {
        if (!isCancelled) {
          setIsLoadingBalance(false)
        }
      }
    }

    void refreshBalance()

    return () => {
      isCancelled = true
    }
  }, [user])

  const {
    startPolling: startChartPolling,
    stopPolling: stopChartPolling,
  } = useAdaptivePolling({
    poll: async ({ signal, consecutiveErrors }) => {
      const pollingTask = pollingTaskRef.current
      if (!pollingTask) return "stop"

      const task = await toolboxClient.getEChartTask(pollingTask.taskId, {
        preferAuth: pollingTask.preferAuth,
        signal,
      })
      if (signal.aborted) return "stop"

      if (isApiError(task)) {
        console.warn("[ToolboxAICharts] Chart task polling failed", {
          mode: pollingTask.mode,
          taskId: pollingTask.taskId,
          attempt: consecutiveErrors + 1,
          status: task.status ?? null,
          reason: task.reason ?? null,
        })

        if (
          task.reason === "network_error" ||
          (typeof task.status === "number" && task.status >= 500)
        ) {
          throw new Error(task.reason || task.error)
        }

        pollingTaskRef.current = null
        setIsGenerating(false)
        setErrorMessage(t("toolsPage.aiCharts.generationFailed"))
        return "stop"
      }

      const taskMode = isEChartsLogResponse(task) ? "account" : "guest"
      const taskLogId = isEChartsLogResponse(task) ? task.id : task.task_id

      console.debug("[ToolboxAICharts] Chart task status received", {
        mode: taskMode,
        taskId: taskLogId,
        status: task.status,
      })

      setResultMeta({
        mode: taskMode,
        logId: taskLogId,
        title: task.title,
        chartType: task.chart_type,
        status: task.status,
      })

      if (task.status === "failed") {
        console.warn("[ToolboxAICharts] Chart task failed", {
          mode: taskMode,
          taskId: taskLogId,
          errorCode: task.error_code ?? null,
          errorMessage: task.error_message ?? null,
        })
        pollingTaskRef.current = null
        setIsGenerating(false)
        setErrorMessage(t("toolsPage.aiCharts.generationFailed"))
        return "stop"
      }

      if (task.status !== "succeeded") {
        return "continue"
      }

      if (!isJoyChartSpec(task.spec)) {
        console.error("[ToolboxAICharts] Succeeded chart task returned an empty spec", {
          mode: taskMode,
          taskId: taskLogId,
        })
        pollingTaskRef.current = null
        setIsGenerating(false)
        setErrorMessage(t("echarts.chart.emptySpec"))
        return "stop"
      }

      setResultSpec(task.spec)
      setDraftDisplay(toRequiredDisplay(task.spec.display ?? draftDisplay))
      setResultMeta({
        mode: taskMode,
        logId: taskLogId,
        title: task.title || task.spec.chart.title,
        chartType: task.chart_type || task.spec.chart.type,
        status: task.status,
      })
      pollingTaskRef.current = null
      setIsGenerating(false)

      console.info("[ToolboxAICharts] Chart task succeeded", {
        mode: taskMode,
        taskId: taskLogId,
        chartType: task.spec.chart.type,
      })
      toast({ title: t("toolsPage.aiCharts.toast.generated") })
      return "stop"
    },
    onTimeout: () => {
      const pollingTask = pollingTaskRef.current
      console.warn("[ToolboxAICharts] Chart task polling timed out", {
        mode: pollingTask?.mode ?? null,
        taskId: pollingTask?.taskId ?? null,
        timeoutMs: CHART_POLL_TIMEOUT_MS,
      })
      pollingTaskRef.current = null
      setIsGenerating(false)
      setErrorMessage(t("toolsPage.aiCharts.generationTimeout"))
    },
    policy: {
      timeoutMs: CHART_POLL_TIMEOUT_MS,
    },
    debugLabel: "toolbox-echarts",
  })

  const updateDraft = (patch: JoyChartDisplay) => {
    setDraftDisplay((current) => patchDisplay(current, patch))
  }

  const loadExample = () => {
    setDataText(t("toolsPage.aiCharts.example.data"))
    setRequirement(t("toolsPage.aiCharts.example.requirement"))
    setErrorMessage(null)
  }

  const handleGenerate = async () => {
    if (!canGenerate) {
      toast({
        variant: "destructive",
        title: t("toolsPage.aiCharts.toast.enterInputTitle"),
        description: t("toolsPage.aiCharts.toast.enterInputDescription"),
      })
      return
    }

    setIsGenerating(true)
    setErrorMessage(null)
    stopChartPolling()
    let taskCreated = false

    try {
      const result = await toolboxClient.generateEChart(
        {
          data_text: trimmedDataText,
          requirement: trimmedRequirement,
          display: draftDisplay,
        },
        { preferAuth }
      )

      if (isApiError(result)) {
        console.warn("[ToolboxAICharts] Chart generation rejected", {
          status: result.status ?? null,
          reason: result.reason ?? null,
        })
        setErrorMessage(result.error_description || result.error)
        return
      }

      const isAccountResult = isEChartsLogResponse(result)
      if (!isAccountResult && !isToolboxEChartsTaskResponse(result)) {
        console.error("[ToolboxAICharts] Chart creation returned an unknown response", {
          response: result,
        })
        setErrorMessage(t("toolsPage.aiCharts.generationFailed"))
        return
      }

      const taskId = isAccountResult ? result.id : result.task_id
      const mode = isAccountResult ? "account" : "guest"

      setResultSpec(null)
      setResultMeta({
        mode,
        logId: taskId,
        status: result.status,
      })

      console.info("[ToolboxAICharts] Chart task created; starting polling", {
        mode,
        taskId,
        pollUrl: result.poll_url,
      })
      pollingTaskRef.current = { taskId, mode, preferAuth }
      taskCreated = true
      startChartPolling()
    } catch (error) {
      const message = error instanceof Error ? error.message : t("common.unknownError")
      console.error("[ToolboxAICharts] Unexpected chart generation error", { error: message })
      setErrorMessage(t("toolsPage.aiCharts.generationFailed"))
    } finally {
      if (!taskCreated) {
        setIsGenerating(false)
      }
    }
  }

  const handleDownload = () => {
    if (!currentSpec) return

    setIsDownloading(true)
    try {
      const dataUrl = rendererRef.current?.exportPng()
      if (!dataUrl) {
        throw new Error(t("toolsPage.aiCharts.toast.downloadFailed"))
      }

      downloadDataUrl(dataUrl, createChartFileName(resultMeta?.title || currentSpec.chart.title))
      console.info("[ToolboxAICharts] Downloaded chart PNG", {
        mode: resultMeta?.mode ?? null,
        logId: resultMeta?.logId ?? null,
        chartType: currentSpec.chart.type,
      })
      toast({ title: t("toolsPage.aiCharts.toast.downloaded") })
    } catch (error) {
      console.error("[ToolboxAICharts] Failed to download chart PNG", { error })
      toast({
        variant: "destructive",
        title: t("toolsPage.aiCharts.toast.downloadFailed"),
        description: error instanceof Error ? error.message : t("common.unknownError"),
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <section className="tools-image-workbench tools-chart-workbench">
      <div className="tools-image-workbench-header">
        <div className="flex min-w-0 items-center gap-3">
          <span className="tools-image-workbench-icon">
            <BarChart3Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="tools-tool-category">{t("toolsPage.tools.ai-charts.category")}</p>
            <h1 className="tools-image-workbench-title">
              {t("toolsPage.tools.ai-charts.title")}
            </h1>
          </div>
        </div>
        <div className="tools-image-workbench-status">
          <SparklesIcon className="size-4" />
          <span>
            {loading
              ? t("toolsPage.imageGenerator.authChecking")
              : user
                ? isLoadingBalance
                  ? t("toolsPage.imageGenerator.balanceLoading")
                  : creditBalance === null
                    ? t("toolsPage.aiCharts.signedIn")
                    : t("toolsPage.imageGenerator.signedInBalance", {
                        credits: creditBalance.toLocaleString(),
                      })
                : t("toolsPage.aiCharts.guestTrial")}
          </span>
        </div>
      </div>

      <div className="tools-image-workbench-body">
        <div className="grid min-h-full gap-4 p-4 xl:grid-cols-[minmax(420px,0.82fr)_minmax(520px,1fr)] xl:p-5">
          <div className="min-w-0 space-y-4">
            <StepTimeline activeStep={activeStep} completed={completed} />

            {errorMessage ? (
              <Alert variant="destructive">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b bg-muted/25 px-4 py-3">
                <Label htmlFor="toolbox-ai-chart-data" className="flex items-center gap-2 text-sm font-semibold">
                  <DatabaseIcon className="h-4 w-4 text-primary" />
                  {t("toolsPage.aiCharts.dataTextLabel")}
                </Label>
                <span className="rounded-full bg-background px-2.5 py-1 text-xs text-muted-foreground">
                  {t("toolsPage.aiCharts.charCount", { count: trimmedDataText.length })}
                </span>
              </div>
              <div className="space-y-3 p-3">
                <Textarea
                  id="toolbox-ai-chart-data"
                  value={dataText}
                  onChange={(event) => setDataText(event.target.value)}
                  placeholder={t("toolsPage.aiCharts.dataTextPlaceholder")}
                  className="min-h-40 resize-y border-border/70 bg-muted/20 text-sm leading-relaxed shadow-none"
                />
                <Button type="button" variant="outline" size="sm" onClick={loadExample}>
                  {t("toolsPage.aiCharts.useExample")}
                </Button>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b bg-muted/25 px-4 py-3">
                <Label htmlFor="toolbox-ai-chart-requirement" className="flex items-center gap-2 text-sm font-semibold">
                  <WandSparklesIcon className="h-4 w-4 text-primary" />
                  {t("toolsPage.aiCharts.requirementLabel")}
                </Label>
              </div>
              <div className="space-y-3 p-3">
                <Textarea
                  id="toolbox-ai-chart-requirement"
                  value={requirement}
                  onChange={(event) => setRequirement(event.target.value)}
                  placeholder={t("toolsPage.aiCharts.requirementPlaceholder")}
                  className="min-h-24 resize-y border-border/70 bg-muted/20 text-sm leading-relaxed shadow-none"
                />
                <div className="grid gap-2 rounded-lg bg-muted/20 p-2 sm:grid-cols-3">
                  <Select
                    value={draftDisplay.style.theme}
                    onValueChange={(value) => updateDraft({ style: { theme: value } })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JOY_CHART_THEME_OPTIONS.map((themeOption) => (
                        <SelectItem key={themeOption} value={themeOption}>
                          {t(`echarts.themes.${themeOption}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={draftDisplay.layout.sort}
                    onValueChange={(value) => updateDraft({ layout: { sort: value as "none" | "asc" | "desc" } })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("echarts.sort.none")}</SelectItem>
                      <SelectItem value="asc">{t("echarts.sort.asc")}</SelectItem>
                      <SelectItem value="desc">{t("echarts.sort.desc")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={handleGenerate} disabled={!canGenerate} className="h-9">
                    {isGenerating ? (
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : (
                      <WandSparklesIcon className="h-4 w-4" />
                    )}
                    {t("toolsPage.aiCharts.generate")}
                  </Button>
                </div>
              </div>
            </section>
          </div>

          <div className="min-w-0 space-y-4">
            <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b bg-muted/25 px-4 py-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold">
                    {resultMeta?.title || currentSpec?.chart.title || t("toolsPage.aiCharts.previewTitle")}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {resultMeta?.mode === "account"
                      ? t("toolsPage.aiCharts.accountResult", { id: resultMeta.logId ?? "-" })
                      : resultMeta?.mode === "guest"
                        ? t("toolsPage.aiCharts.guestResult")
                        : t("toolsPage.aiCharts.previewEmpty")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!currentSpec || isDownloading}
                  onClick={handleDownload}
                >
                  {isDownloading ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    <DownloadIcon className="h-4 w-4" />
                  )}
                  {t("toolsPage.aiCharts.downloadPng")}
                </Button>
              </div>

              <div className="p-3">
                {currentSpec ? (
                  <div className="h-[360px] overflow-hidden rounded-lg bg-white p-2 sm:h-[440px]">
                    <JoyChartRenderer ref={rendererRef} spec={currentSpec} />
                  </div>
                ) : (
                  <div className="flex h-[360px] items-center justify-center rounded-lg border border-dashed bg-muted/20 px-6 text-center text-sm leading-6 text-muted-foreground sm:h-[440px]">
                    {isGenerating ? t("toolsPage.aiCharts.generatingPreview") : t("toolsPage.aiCharts.emptyPreview")}
                  </div>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
              <div className="flex items-center gap-2 border-b bg-muted/25 px-4 py-3">
                <PaletteIcon className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">{t("toolsPage.aiCharts.displaySettings")}</h2>
              </div>
              <div className="grid gap-2 p-3 sm:grid-cols-2">
                <SettingRow label={t("echarts.display.title")}>
                  <Switch
                    checked={draftDisplay.title}
                    onCheckedChange={(checked) => updateDraft({ title: checked })}
                  />
                </SettingRow>
                {draftDisplay.title ? (
                  <>
                    <SettingRow label={t("echarts.display.titlePosition")}>
                      <Select
                        value={draftDisplay.layout.titlePosition}
                        onValueChange={(value) =>
                          updateDraft({ layout: { titlePosition: value as "top" | "bottom" } })
                        }
                      >
                        <SelectTrigger className="h-8 w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top">{t("echarts.positions.top")}</SelectItem>
                          <SelectItem value="bottom">{t("echarts.positions.bottom")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingRow>
                    <SettingRow label={t("echarts.display.titleAlign")}>
                      <Select
                        value={draftDisplay.layout.titleAlign}
                        onValueChange={(value) =>
                          updateDraft({ layout: { titleAlign: value as "left" | "center" | "right" } })
                        }
                      >
                        <SelectTrigger className="h-8 w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">{t("echarts.alignments.left")}</SelectItem>
                          <SelectItem value="center">{t("echarts.alignments.center")}</SelectItem>
                          <SelectItem value="right">{t("echarts.alignments.right")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingRow>
                  </>
                ) : null}
                <SettingRow label={t("echarts.display.legend")}>
                  <Switch
                    checked={draftDisplay.legend}
                    onCheckedChange={(checked) => updateDraft({ legend: checked })}
                  />
                </SettingRow>
                {draftDisplay.legend ? (
                  <SettingRow label={t("echarts.display.legendPosition")}>
                    <Select
                      value={draftDisplay.layout.legendPosition}
                      onValueChange={(value) =>
                        updateDraft({ layout: { legendPosition: value as "top" | "bottom" | "left" | "right" } })
                      }
                    >
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">{t("echarts.positions.top")}</SelectItem>
                        <SelectItem value="bottom">{t("echarts.positions.bottom")}</SelectItem>
                        <SelectItem value="left">{t("echarts.positions.left")}</SelectItem>
                        <SelectItem value="right">{t("echarts.positions.right")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingRow>
                ) : null}
                <SettingRow label={t("echarts.display.label")}>
                  <Switch
                    checked={draftDisplay.label}
                    onCheckedChange={(checked) => updateDraft({ label: checked })}
                  />
                </SettingRow>
                <SettingRow label={t("echarts.display.grid")}>
                  <Switch
                    checked={draftDisplay.axis.showGrid}
                    onCheckedChange={(checked) => updateDraft({ axis: { showGrid: checked } })}
                  />
                </SettingRow>
                <SettingRow label={t("echarts.display.tooltip")}>
                  <Switch
                    checked={draftDisplay.tooltip}
                    onCheckedChange={(checked) => updateDraft({ tooltip: checked })}
                  />
                </SettingRow>

                {chartType === "bar" ? (
                  <>
                    <SettingRow label={t("echarts.display.orientation")}>
                      <Select
                        value={draftDisplay.layout.orientation}
                        onValueChange={(value) =>
                          updateDraft({ layout: { orientation: value as "vertical" | "horizontal" } })
                        }
                      >
                        <SelectTrigger className="h-8 w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vertical">{t("echarts.orientation.vertical")}</SelectItem>
                          <SelectItem value="horizontal">{t("echarts.orientation.horizontal")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingRow>
                    <SettingRow label={t("echarts.display.stack")}>
                      <Switch
                        checked={draftDisplay.layout.stack}
                        onCheckedChange={(checked) => updateDraft({ layout: { stack: checked } })}
                      />
                    </SettingRow>
                    <SettingSlider
                      label={t("echarts.display.radius")}
                      value={draftDisplay.bar.borderRadius}
                      min={0}
                      max={18}
                      step={1}
                      onChange={(value) => updateDraft({ bar: { borderRadius: value } })}
                    />
                    <SettingSlider
                      label={t("echarts.display.barWidth")}
                      value={draftDisplay.bar.barWidth}
                      min={12}
                      max={80}
                      step={2}
                      onChange={(value) => updateDraft({ bar: { barWidth: value } })}
                    />
                  </>
                ) : null}

                {chartType === "line" ? (
                  <>
                    <SettingRow label={t("echarts.display.smooth")}>
                      <Switch
                        checked={draftDisplay.line.smooth}
                        onCheckedChange={(checked) => updateDraft({ line: { smooth: checked } })}
                      />
                    </SettingRow>
                    <SettingRow label={t("echarts.display.area")}>
                      <Switch
                        checked={draftDisplay.line.area}
                        onCheckedChange={(checked) => updateDraft({ line: { area: checked } })}
                      />
                    </SettingRow>
                    <SettingRow label={t("echarts.display.symbol")}>
                      <Switch
                        checked={draftDisplay.line.symbol}
                        onCheckedChange={(checked) => updateDraft({ line: { symbol: checked } })}
                      />
                    </SettingRow>
                  </>
                ) : null}

                {chartType === "pie" ? (
                  <>
                    <SettingRow label={t("echarts.display.donut")}>
                      <Switch
                        checked={draftDisplay.pie.donut}
                        onCheckedChange={(checked) => updateDraft({ pie: { donut: checked } })}
                      />
                    </SettingRow>
                    <SettingRow label={t("echarts.display.rose")}>
                      <Switch
                        checked={draftDisplay.pie.rose}
                        onCheckedChange={(checked) => updateDraft({ pie: { rose: checked } })}
                      />
                    </SettingRow>
                    <SettingRow label={t("echarts.display.percent")}>
                      <Switch
                        checked={draftDisplay.pie.showPercent}
                        onCheckedChange={(checked) => updateDraft({ pie: { showPercent: checked } })}
                      />
                    </SettingRow>
                  </>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  )
}

function SettingRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3 rounded-lg bg-muted/20 px-3 py-2">
      <Label className="text-xs font-medium text-foreground/80">{label}</Label>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function SettingSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) {
  return (
    <div className="rounded-lg bg-muted/20 px-3 py-2">
      <div className="mb-2 flex items-center justify-between gap-3">
        <Label className="text-xs font-medium text-foreground/80">{label}</Label>
        <span className="text-xs text-muted-foreground">{value}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([nextValue]) => {
          if (typeof nextValue === "number") {
            onChange(nextValue)
          }
        }}
      />
    </div>
  )
}
