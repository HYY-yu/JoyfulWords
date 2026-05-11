"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import {
  AlertCircleIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  Loader2Icon,
  MapPinIcon,
  RefreshCwIcon,
  SaveIcon,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/base/alert"
import { Badge } from "@/components/ui/base/badge"
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
import { JoyChartRenderer, type JoyChartRendererHandle } from "@/components/editor/joy-chart-renderer"
import { echartsClient } from "@/lib/api/echarts/client"
import type { EChartsLogResponse, JoyChartDisplay, JoyChartSpec } from "@/lib/api/echarts/types"
import type { TaskCenterEChartsTaskDetail } from "@/lib/api/taskcenter/types"
import { JOY_CHART_THEME_OPTIONS, mergeJoyChartDisplay } from "@/lib/echarts/joy-chart-defaults"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { uploadImageToR2 } from "@/lib/tiptap-image-upload"

interface EChartsTaskDetailProps {
  detail: TaskCenterEChartsTaskDetail
}

function isJoyChartSpec(value: unknown): value is JoyChartSpec {
  if (!value || typeof value !== "object") return false

  const candidate = value as Partial<JoyChartSpec>
  return Boolean(candidate.chart?.type && candidate.dataset?.source && candidate.dataset?.dimensions)
}

function isApiError(value: EChartsLogResponse | { error?: string }): value is { error: string; status?: number } {
  return typeof value === "object" && value !== null && "error" in value && typeof value.error === "string"
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

function dataUrlToPngFile(dataUrl: string, filename: string): File {
  const [meta, payload] = dataUrl.split(",")
  if (!meta?.startsWith("data:image/png") || !payload) {
    throw new Error("Invalid PNG export")
  }

  const binary = atob(payload)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new File([bytes], filename, { type: "image/png" })
}

function createChartFileName(detail: TaskCenterEChartsTaskDetail): string {
  const safeTitle = (detail.title || `chart-${detail.id}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)

  return `${safeTitle || `chart-${detail.id}`}-${Date.now()}.png`
}

export function EChartsTaskDetail({ detail }: EChartsTaskDetailProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const rendererRef = useRef<JoyChartRendererHandle | null>(null)
  const initialSpec = useMemo(() => (isJoyChartSpec(detail.spec) ? detail.spec : null), [detail.spec])
  const [spec, setSpec] = useState<JoyChartSpec | null>(initialSpec)
  const [version, setVersion] = useState(detail.version)
  const [draftDisplay, setDraftDisplay] = useState<JoyChartDisplay>(() =>
    mergeJoyChartDisplay(initialSpec?.display)
  )
  const [saving, setSaving] = useState(false)
  const [inserting, setInserting] = useState(false)
  const [inserted, setInserted] = useState(false)

  useEffect(() => {
    setSpec(initialSpec)
    setVersion(detail.version)
    setDraftDisplay(mergeJoyChartDisplay(initialSpec?.display))
    setInserted(false)
  }, [detail.version, initialSpec])

  const chartType = detail.chart_type || spec?.chart.type || "bar"
  const referenceContext = spec?.extensions?.reference_context ?? null
  const currentSpec = useMemo(
    () => (spec ? { ...spec, display: draftDisplay } : null),
    [draftDisplay, spec]
  )
  const canInsert = Boolean(currentSpec && (detail.status === "success" || detail.status === "succeeded"))

  const updateDraft = (patch: JoyChartDisplay) => {
    setDraftDisplay((current) => patchDisplay(current, patch))
  }

  const handleSaveDisplay = async () => {
    if (!spec) return

    setSaving(true)
    try {
      const result = await echartsClient.updateDisplay(detail.id, {
        version,
        display: draftDisplay,
      })

      if (isApiError(result)) {
        throw new Error(result.error)
      }

      if (!isJoyChartSpec(result.spec)) {
        throw new Error(t("echarts.chart.emptySpec"))
      }

      setVersion(result.version)
      setSpec(result.spec)
      setDraftDisplay(mergeJoyChartDisplay(result.spec.display ?? draftDisplay))
      toast({ title: t("echarts.chart.displaySaved") })
    } catch (error) {
      console.error("[EChartsTaskDetail] Failed to update chart display", {
        logId: detail.id,
        version,
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

  const handleInsert = async () => {
    if (!currentSpec) return

    if (!window.joyfulWordsEditorImages) {
      toast({
        variant: "destructive",
        title: t("echarts.taskDetail.insertFailed"),
        description: t("tiptapEditor.toast.editorNotReady"),
      })
      return
    }

    const chartImageUrl = rendererRef.current?.exportPng()
    if (!chartImageUrl) {
      toast({
        variant: "destructive",
        title: t("echarts.taskDetail.insertFailed"),
        description: t("common.unknownError"),
      })
      return
    }

    setInserting(true)
    try {
      const chartFile = dataUrlToPngFile(chartImageUrl, createChartFileName(detail))

      console.info("[EChartsTaskDetail] Uploading exported chart PNG before insert", {
        logId: detail.id,
        fileName: chartFile.name,
        fileSize: chartFile.size,
      })

      const uploadedImageUrl = await uploadImageToR2(chartFile)
      const result = window.joyfulWordsEditorImages.insertImageAtReference(
        uploadedImageUrl,
        detail.title || currentSpec.chart.title || t("echarts.chart.untitled"),
        referenceContext
      )

      if (!result.inserted) {
        throw new Error(t("tiptapEditor.toast.editorNotReady"))
      }

      setInserted(true)
      console.info("[EChartsTaskDetail] Inserted uploaded chart PNG into editor", {
        logId: detail.id,
        anchorFound: result.anchorFound,
      })
      toast({
        title: result.anchorFound
          ? t("echarts.taskDetail.inserted")
          : t("echarts.taskDetail.insertedAtCursor"),
      })
    } catch (error) {
      console.error("[EChartsTaskDetail] Failed to insert chart image", {
        logId: detail.id,
        error,
      })
      toast({
        variant: "destructive",
        title: t("echarts.taskDetail.insertFailed"),
        description: error instanceof Error ? error.message : t("common.unknownError"),
      })
    } finally {
      setInserting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BarChart3Icon className="h-4 w-4 text-primary" />
            <h3 className="truncate text-sm font-semibold">
              {detail.title || spec?.chart.title || t("echarts.chart.untitled")}
            </h3>
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {detail.prompt}
          </p>
        </div>
        <Badge variant="outline">
          {chartType || t("echarts.types.unknown")}
        </Badge>
      </div>

      {detail.status === "failed" ? (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>
            {detail.error_message || detail.error || t("echarts.taskDetail.failed")}
          </AlertDescription>
        </Alert>
      ) : null}

      {currentSpec ? (
        <div className="overflow-hidden rounded-lg border bg-background p-3">
          <div className="h-[320px] rounded-md bg-white">
            <JoyChartRenderer ref={rendererRef} spec={currentSpec} />
          </div>
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
          {detail.status === "pending" || detail.status === "processing"
            ? t("echarts.taskDetail.waiting")
            : t("echarts.chart.emptySpec")}
        </div>
      )}

      {spec ? (
        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <SettingRow label={t("echarts.display.theme")}>
              <Select
                value={draftDisplay.style?.theme ?? "vintage"}
                onValueChange={(value) => updateDraft({ style: { theme: value } })}
              >
                <SelectTrigger className="h-8 w-32">
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
                    value={[draftDisplay.bar?.barWidth ?? 54]}
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDraftDisplay(mergeJoyChartDisplay(spec.display))}
            >
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

      {referenceContext ? (
        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <MapPinIcon className="h-3.5 w-3.5 text-primary" />
            {referenceContext.section_title || t("echarts.taskDetail.placement")}
          </div>
          <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
            {referenceContext.anchor_text || referenceContext.reason || "-"}
          </p>
        </div>
      ) : null}

      <Button type="button" className="w-full" disabled={!canInsert || inserted || inserting} onClick={handleInsert}>
        {inserting ? (
          <Loader2Icon className="h-4 w-4 animate-spin" />
        ) : inserted ? (
          <CheckCircle2Icon className="h-4 w-4" />
        ) : (
          <BarChart3Icon className="h-4 w-4" />
        )}
        {inserted ? t("echarts.taskDetail.inserted") : t("echarts.taskDetail.insert")}
      </Button>
    </div>
  )
}
