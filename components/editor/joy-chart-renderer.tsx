"use client"

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import * as echarts from "echarts"
import type { ECharts } from "echarts"
import type { JoyChartSpec } from "@/lib/api/echarts/types"
import { createJoyChartOption, getJoyChartBackgroundColor } from "@/lib/echarts/joy-chart-options"
import { cn } from "@/lib/utils"

interface JoyChartRendererProps {
  spec: JoyChartSpec
  className?: string
}

export interface JoyChartRendererHandle {
  exportPng: () => string | null
}

export const JoyChartRenderer = forwardRef<JoyChartRendererHandle, JoyChartRendererProps>(
  function JoyChartRenderer({ spec, className }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const chartRef = useRef<ECharts | null>(null)
    const [viewport, setViewport] = useState({ width: 0, height: 0 })
    const option = useMemo(() => createJoyChartOption(spec, viewport), [spec, viewport])

    useImperativeHandle(ref, () => ({
      exportPng: () =>
        chartRef.current?.getDataURL({
          type: "png",
          pixelRatio: 2,
          backgroundColor: getJoyChartBackgroundColor(spec.display?.style?.theme),
        }) ?? null,
    }), [spec.display?.style?.theme])

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
      <div
        ref={containerRef}
        className={cn("h-full min-h-[260px] w-full", className)}
        role="img"
        aria-label={spec.chart.title || "AI chart"}
      />
    )
  }
)
