"use client"

import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react"
import {
  AlertCircleIcon,
  BarChart3Icon,
  ChevronDownIcon,
  LineChartIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PieChartIcon,
  RefreshCwIcon,
  SaveIcon,
  Settings2Icon,
} from "lucide-react"
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
import { useToast } from "@/hooks/use-toast"
import { echartsClient } from "@/lib/api/echarts/client"
import type { EChartsLogResponse, JoyChartDisplay, JoyChartSpec } from "@/lib/api/echarts/types"
import { mergeJoyChartDisplay } from "@/lib/echarts/joy-chart-defaults"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { cn } from "@/lib/utils"
import { JoyChartRenderer } from "./joy-chart-renderer"

type JoyChartNodeAttrs = {
  localId?: string
  logId?: number | null
  version?: number | null
  status?: "loading" | "ready" | "failed"
  sourceMode?: "selection" | "article"
  chartType?: string
  title?: string
  spec?: JoyChartSpec | null
  display?: JoyChartDisplay | null
  errorMessage?: string | null
}

function isApiError(value: EChartsLogResponse | { error?: string }): value is { error: string; status?: number } {
  return typeof value === "object" && value !== null && "error" in value && typeof value.error === "string"
}

function getChartIcon(chartType?: string) {
  if (chartType === "line") return LineChartIcon
  if (chartType === "pie") return PieChartIcon
  return BarChart3Icon
}

function patchDisplay(display: JoyChartDisplay, patch: JoyChartDisplay): JoyChartDisplay {
  return {
    ...display,
    ...patch,
    layout: { ...display.layout, ...patch.layout },
    axis: { ...display.axis, ...patch.axis },
    style: { ...display.style, ...patch.style },
    bar: { ...display.bar, ...patch.bar },
    line: { ...display.line, ...patch.line },
    pie: { ...display.pie, ...patch.pie },
  }
}

function SettingRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2">
      <Label className="text-xs font-medium text-foreground/80">{label}</Label>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export function JoyChartNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const attrs = node.attrs as JoyChartNodeAttrs
  const { t } = useTranslation()
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const spec = attrs.spec ?? null
  const chartType = attrs.chartType || spec?.chart.type || "bar"
  const chartTypeLabel =
    chartType === "bar" || chartType === "line" || chartType === "pie"
      ? t(`echarts.types.${chartType}`)
      : chartType
  const Icon = getChartIcon(chartType)
  const mergedDisplay = useMemo(
    () => mergeJoyChartDisplay(attrs.display ?? spec?.display),
    [attrs.display, spec?.display]
  )
  const [draftDisplay, setDraftDisplay] = useState<JoyChartDisplay>(mergedDisplay)

  useEffect(() => {
    setDraftDisplay(mergedDisplay)
  }, [mergedDisplay])

  const updateDraft = (patch: JoyChartDisplay) => {
    setDraftDisplay((current) => patchDisplay(current, patch))
  }

  const applyLocalDisplay = (nextDisplay: JoyChartDisplay) => {
    const nextSpec = spec
      ? {
          ...spec,
          display: patchDisplay(spec.display ?? {}, nextDisplay),
        }
      : spec

    updateAttributes({
      display: nextDisplay,
      spec: nextSpec,
    })
  }

  const handleSaveDisplay = async () => {
    if (!attrs.logId || !attrs.version) {
      applyLocalDisplay(draftDisplay)
      setEditing(false)
      return
    }

    setSaving(true)
    try {
      const result = await echartsClient.updateDisplay(attrs.logId, {
        version: attrs.version,
        display: draftDisplay,
      })

      if (isApiError(result)) {
        throw new Error(result.error)
      }

      updateAttributes({
        version: result.version,
        display: result.spec.display ?? draftDisplay,
        spec: result.spec,
        chartType: result.chart_type || result.spec.chart?.type,
        title: result.title || result.spec.chart?.title,
      })
      setEditing(false)
      toast({ title: t("echarts.chart.displaySaved") })
    } catch (error) {
      console.error("[JoyChartNodeView] Failed to update chart display", {
        logId: attrs.logId,
        version: attrs.version,
        error,
      })
      toast({
        variant: "destructive",
        title: t("echarts.chart.displaySaveFailed"),
        description: error instanceof Error ? error.message : t("common.unknownError"),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <NodeViewWrapper
      data-joy-chart-node
      className={cn(
        "my-6 rounded-lg border bg-background transition-colors",
        selected ? "border-primary/60 ring-2 ring-primary/10" : "border-border"
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/8 text-primary ring-1 ring-primary/15">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {attrs.title || spec?.chart.title || t("echarts.chart.untitled")}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {t("echarts.chart.meta", {
                type: chartTypeLabel,
              })}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {attrs.status === "loading" ? (
            <Loader2Icon className="h-4 w-4 animate-spin text-primary" />
          ) : null}
          {attrs.status === "failed" ? (
            <AlertCircleIcon className="h-4 w-4 text-destructive" />
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setEditing((current) => !current)}
            title={t("echarts.chart.editDisplay")}
          >
            {editing ? <ChevronDownIcon className="h-4 w-4" /> : <Settings2Icon className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled
            title={t("echarts.chart.moreComingSoon")}
          >
            <MoreHorizontalIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="min-h-[280px] px-4 py-4">
        {attrs.status === "loading" ? (
          <div className="flex h-[280px] items-end gap-3 rounded-md bg-muted/30 px-8 py-8">
            {[36, 62, 48, 76, 54, 68].map((height, index) => (
              <span
                key={index}
                className="flex-1 animate-pulse rounded-t-md bg-primary/20"
                style={{ height: `${height}%`, animationDelay: `${index * 90}ms` }}
              />
            ))}
          </div>
        ) : attrs.status === "failed" ? (
          <div className="flex h-[240px] flex-col items-center justify-center gap-2 rounded-md bg-destructive/5 text-center">
            <AlertCircleIcon className="h-8 w-8 text-destructive" />
            <p className="text-sm font-medium text-foreground">{t("echarts.chart.generateFailed")}</p>
            <p className="max-w-md text-xs leading-5 text-muted-foreground">
              {attrs.errorMessage || t("echarts.chart.generateFailedDesc")}
            </p>
          </div>
        ) : spec ? (
          <JoyChartRenderer spec={{ ...spec, display: mergedDisplay }} />
        ) : (
          <div className="flex h-[240px] items-center justify-center rounded-md bg-muted/30 text-sm text-muted-foreground">
            {t("echarts.chart.emptySpec")}
          </div>
        )}
      </div>

      {editing ? (
        <div className="border-t bg-muted/20 px-4 py-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <SettingRow label={t("echarts.display.theme")}>
              <Select
                value={draftDisplay.style?.theme ?? "clean"}
                onValueChange={(value) => updateDraft({ style: { theme: value } })}
              >
                <SelectTrigger className="h-8 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clean">{t("echarts.themes.clean")}</SelectItem>
                  <SelectItem value="infographic">{t("echarts.themes.infographic")}</SelectItem>
                  <SelectItem value="vintage">{t("echarts.themes.vintage")}</SelectItem>
                  <SelectItem value="dark">{t("echarts.themes.dark")}</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
            <SettingRow label={t("echarts.display.sort")}>
              <Select
                value={draftDisplay.layout?.sort ?? "none"}
                onValueChange={(value) => updateDraft({ layout: { sort: value as "none" | "asc" | "desc" } })}
              >
                <SelectTrigger className="h-8 w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("echarts.sort.none")}</SelectItem>
                  <SelectItem value="asc">{t("echarts.sort.asc")}</SelectItem>
                  <SelectItem value="desc">{t("echarts.sort.desc")}</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
            <SettingRow label={t("echarts.display.legend")}>
              <Switch
                checked={draftDisplay.legend ?? true}
                onCheckedChange={(checked) => updateDraft({ legend: checked })}
              />
            </SettingRow>
            <SettingRow label={t("echarts.display.tooltip")}>
              <Switch
                checked={draftDisplay.tooltip ?? true}
                onCheckedChange={(checked) => updateDraft({ tooltip: checked })}
              />
            </SettingRow>
            <SettingRow label={t("echarts.display.label")}>
              <Switch
                checked={draftDisplay.label ?? false}
                onCheckedChange={(checked) => updateDraft({ label: checked })}
              />
            </SettingRow>
            <SettingRow label={t("echarts.display.grid")}>
              <Switch
                checked={draftDisplay.axis?.showGrid ?? true}
                onCheckedChange={(checked) => updateDraft({ axis: { showGrid: checked } })}
              />
            </SettingRow>
          </div>

          {chartType === "bar" ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <SettingRow label={t("echarts.display.orientation")}>
                <Select
                  value={draftDisplay.layout?.orientation ?? "vertical"}
                  onValueChange={(value) =>
                    updateDraft({ layout: { orientation: value as "vertical" | "horizontal" } })
                  }
                >
                  <SelectTrigger className="h-8 w-32">
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
                  checked={draftDisplay.layout?.stack ?? false}
                  onCheckedChange={(checked) => updateDraft({ layout: { stack: checked } })}
                />
              </SettingRow>
              <SettingRow label={t("echarts.display.radius")}>
                <div className="w-32">
                  <Slider
                    value={[draftDisplay.bar?.borderRadius ?? 6]}
                    min={0}
                    max={18}
                    step={1}
                    onValueChange={([value]) => updateDraft({ bar: { borderRadius: value } })}
                  />
                </div>
              </SettingRow>
              <SettingRow label={t("echarts.display.barWidth")}>
                <div className="w-32">
                  <Slider
                    value={[draftDisplay.bar?.barWidth ?? 42]}
                    min={12}
                    max={80}
                    step={2}
                    onValueChange={([value]) => updateDraft({ bar: { barWidth: value } })}
                  />
                </div>
              </SettingRow>
            </div>
          ) : null}

          {chartType === "line" ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <SettingRow label={t("echarts.display.smooth")}>
                <Switch
                  checked={draftDisplay.line?.smooth ?? false}
                  onCheckedChange={(checked) => updateDraft({ line: { smooth: checked } })}
                />
              </SettingRow>
              <SettingRow label={t("echarts.display.area")}>
                <Switch
                  checked={draftDisplay.line?.area ?? false}
                  onCheckedChange={(checked) => updateDraft({ line: { area: checked } })}
                />
              </SettingRow>
              <SettingRow label={t("echarts.display.symbol")}>
                <Switch
                  checked={draftDisplay.line?.symbol ?? true}
                  onCheckedChange={(checked) => updateDraft({ line: { symbol: checked } })}
                />
              </SettingRow>
            </div>
          ) : null}

          {chartType === "pie" ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <SettingRow label={t("echarts.display.donut")}>
                <Switch
                  checked={draftDisplay.pie?.donut ?? false}
                  onCheckedChange={(checked) => updateDraft({ pie: { donut: checked } })}
                />
              </SettingRow>
              <SettingRow label={t("echarts.display.rose")}>
                <Switch
                  checked={draftDisplay.pie?.rose ?? false}
                  onCheckedChange={(checked) => updateDraft({ pie: { rose: checked } })}
                />
              </SettingRow>
              <SettingRow label={t("echarts.display.percent")}>
                <Switch
                  checked={draftDisplay.pie?.showPercent ?? true}
                  onCheckedChange={(checked) => updateDraft({ pie: { showPercent: checked } })}
                />
              </SettingRow>
            </div>
          ) : null}

          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setDraftDisplay(mergedDisplay)}>
              <RefreshCwIcon className="h-3.5 w-3.5" />
              {t("echarts.actions.reset")}
            </Button>
            <Button type="button" size="sm" onClick={handleSaveDisplay} disabled={saving}>
              {saving ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" /> : <SaveIcon className="h-3.5 w-3.5" />}
              {t("common.save")}
            </Button>
          </div>
        </div>
      ) : null}
    </NodeViewWrapper>
  )
}
