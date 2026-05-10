"use client"

import { useEffect, useMemo, useRef } from "react"
import * as echarts from "echarts"
import type { ECharts } from "echarts"
import type { JoyChartSpec } from "@/lib/api/echarts/types"
import { createJoyChartOption } from "@/lib/echarts/joy-chart-options"
import { cn } from "@/lib/utils"

interface JoyChartRendererProps {
  spec: JoyChartSpec
  className?: string
}

export function JoyChartRenderer({ spec, className }: JoyChartRendererProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<ECharts | null>(null)
  const option = useMemo(() => createJoyChartOption(spec), [spec])

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
