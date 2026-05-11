"use client"

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react"
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
    const option = useMemo(() => createJoyChartOption(spec), [spec])

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

      const resizeObserver = new ResizeObserver(() => {
        chart.resize()
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
