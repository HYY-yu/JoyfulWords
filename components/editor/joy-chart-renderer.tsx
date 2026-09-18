"use client"

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import * as echarts from "echarts"
import type { ECharts } from "echarts"
import type { JoyChartSpec } from "@/lib/api/echarts/types"
import { createJoyChartOption, getJoyChartBackgroundColor } from "@/lib/echarts/joy-chart-options"
import { useChartDesign } from "@/lib/echarts/use-chart-design"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { cn } from "@/lib/utils"

interface JoyChartRendererProps {
  articleId?: number
  spec: JoyChartSpec
  className?: string
}

export interface JoyChartRendererHandle {
  exportPng: () => string | null
}

export const JoyChartRenderer = forwardRef<JoyChartRendererHandle, JoyChartRendererProps>(
  function JoyChartRenderer({ spec, className, articleId }, ref) {
    const design = useChartDesign(articleId)
    const { t } = useTranslation()
    const containerRef = useRef<HTMLDivElement | null>(null)
    const chartRef = useRef<ECharts | null>(null)
    const [viewport, setViewport] = useState({ width: 0, height: 0 })
    const option = useMemo(() => createJoyChartOption(spec, viewport, design.design), [spec, viewport, design.design])

    useImperativeHandle(ref, () => ({
      exportPng: () => {
        if (design.loading || design.error || !chartRef.current) return null
        // Apply the exact resolved option before capture, including after a preference change.
        chartRef.current.setOption({ ...option, animation: false }, true)
        return chartRef.current.getDataURL({
          type: "png",
          pixelRatio: 2,
          backgroundColor: getJoyChartBackgroundColor(design.design),
        })
      },
    }), [design.design, design.loading, design.error, option])

    useEffect(() => {
      if (!containerRef.current) return

      const chart = echarts.init(containerRef.current)
      chartRef.current = chart

      const resizeObserver = new ResizeObserver(([entry]) => {
        chart.resize()
        const width = Math.round(entry?.contentRect.width ?? 0)
        const height = Math.round(entry?.contentRect.height ?? 0)
        setViewport((current) =>
          current.width === width && current.height === height ? current : { width, height }
        )
      })
      resizeObserver.observe(containerRef.current)

      return () => {
        resizeObserver.disconnect()
        chart.dispose()
        chartRef.current = null
      }
    }, [])

    useEffect(() => {
      chartRef.current?.setOption(option, true)
    }, [option])

    return (
      <div className="relative h-full w-full">
      {(design.loading || design.error) && <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/95 p-4 text-sm" role="status">
        {design.error ? <button type="button" onClick={design.retry} className="underline">{t("echarts.designRetry")}</button> : t("echarts.designLoading")}
      </div>}
      <div
        ref={containerRef}
        className={cn("h-full min-h-[260px] w-full", className)}
        role="img"
        aria-label={spec.chart.title || "AI chart"}
      />
      </div>
    )
  }
)
