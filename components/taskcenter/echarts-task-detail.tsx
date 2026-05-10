"use client"

import { useMemo, useState } from "react"
import { AlertCircleIcon, BarChart3Icon, CheckCircle2Icon, Loader2Icon, MapPinIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/base/alert"
import { Button } from "@/components/ui/base/button"
import { Badge } from "@/components/ui/base/badge"
import { JoyChartRenderer } from "@/components/editor/joy-chart-renderer"
import type { JoyChartSpec } from "@/lib/api/echarts/types"
import type { TaskCenterEChartsTaskDetail } from "@/lib/api/taskcenter/types"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/i18n-context"

interface EChartsTaskDetailProps {
  detail: TaskCenterEChartsTaskDetail
}

function isJoyChartSpec(value: unknown): value is JoyChartSpec {
  if (!value || typeof value !== "object") return false

  const candidate = value as Partial<JoyChartSpec>
  return Boolean(candidate.chart?.type && candidate.dataset?.source && candidate.dataset?.dimensions)
}

export function EChartsTaskDetail({ detail }: EChartsTaskDetailProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [inserting, setInserting] = useState(false)
  const [inserted, setInserted] = useState(false)
  const spec = useMemo(() => (isJoyChartSpec(detail.spec) ? detail.spec : null), [detail.spec])
  const referenceContext = spec?.extensions?.reference_context ?? null
  const canInsert = Boolean(spec && (detail.status === "success" || detail.status === "succeeded"))

  const handleInsert = () => {
    if (!spec) return

    if (!window.joyfulWordsCharts) {
      toast({
        variant: "destructive",
        title: t("echarts.taskDetail.insertFailed"),
        description: t("tiptapEditor.toast.editorNotReady"),
      })
      return
    }

    setInserting(true)
    try {
      const result = window.joyfulWordsCharts.insertChartAtReference(
        {
          logId: detail.id,
          version: detail.version,
          status: "ready",
          sourceMode: "article",
          chartType: detail.chart_type || spec.chart.type,
          title: detail.title || spec.chart.title,
          spec,
          display: spec.display,
        },
        referenceContext
      )

      if (!result.localId) {
        throw new Error(t("tiptapEditor.toast.editorNotReady"))
      }

      setInserted(true)
      toast({
        title: result.anchorFound
          ? t("echarts.taskDetail.inserted")
          : t("echarts.taskDetail.insertedAtCursor"),
      })
    } catch (error) {
      console.error("[EChartsTaskDetail] Failed to insert chart", {
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
          {detail.chart_type || spec?.chart.type || t("echarts.types.unknown")}
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

      {spec ? (
        <div className="rounded-lg border bg-background p-3">
          <div className="h-[320px]">
            <JoyChartRenderer spec={spec} />
          </div>
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
          {detail.status === "pending" || detail.status === "processing"
            ? t("echarts.taskDetail.waiting")
            : t("echarts.chart.emptySpec")}
        </div>
      )}

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
