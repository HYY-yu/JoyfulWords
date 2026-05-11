import type { EChartsOption } from "echarts"
import type { JoyChartSpec } from "@/lib/api/echarts/types"
import { mergeJoyChartDisplay } from "./joy-chart-defaults"

const THEME_PALETTES: Record<string, string[]> = {
  vintage: ["#d87c7c", "#919e8b", "#d7ab82", "#6e7074", "#61a0a8", "#efa18d"],
  dark: ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#22d3ee"],
  macarons: ["#2ec7c9", "#b6a2de", "#5ab1ef", "#ffb980", "#d87a80", "#8d98b3"],
  infographic: ["#0f766e", "#f97316", "#4f46e5", "#db2777", "#84cc16", "#0891b2"],
  shine: ["#c12e34", "#e6b600", "#0098d9", "#2b821d", "#005eaa", "#339ca8"],
  roma: ["#e01f54", "#001852", "#f5e8c8", "#b8d2c7", "#c6b38e", "#a4d8c2"],
}

const THEME_SURFACES: Record<string, {
  background: string
  text: string
  mutedText: string
  grid: string
  axis: string
}> = {
  dark: {
    background: "#1f2937",
    text: "#f8fafc",
    mutedText: "#cbd5e1",
    grid: "#334155",
    axis: "#94a3b8",
  },
}

export function getJoyChartBackgroundColor(theme?: string): string {
  return THEME_SURFACES[theme ?? ""]?.background ?? "#ffffff"
}

function getJoyChartSurface(theme?: string) {
  return THEME_SURFACES[theme ?? ""] ?? {
    background: "#ffffff",
    text: "#0f172a",
    mutedText: "#64748b",
    grid: "#e2e8f0",
    axis: "#94a3b8",
  }
}

function getDimensionName(spec: JoyChartSpec, id: string | undefined): string {
  if (!id) return ""
  const matched = spec.dataset.dimensions.find((dimension) => dimension.id === id)
  return matched?.name || id
}

function getCategoryKey(spec: JoyChartSpec): string {
  return (
    spec.encoding?.x ||
    spec.encoding?.category ||
    spec.dataset.dimensions.find((dimension) => dimension.role === "category")?.id ||
    spec.dataset.dimensions[0]?.id ||
    "category"
  )
}

function getValueKeys(spec: JoyChartSpec, categoryKey: string): string[] {
  const encodedValue = spec.encoding?.y || spec.encoding?.value
  if (encodedValue) return [encodedValue]

  const valueDimensions = spec.dataset.dimensions
    .filter((dimension) => dimension.id !== categoryKey && dimension.role !== "category")
    .map((dimension) => dimension.id)

  if (valueDimensions.length > 0) return valueDimensions

  return spec.dataset.dimensions
    .map((dimension) => dimension.id)
    .filter((dimensionId) => dimensionId !== categoryKey)
}

function sortSource(
  source: JoyChartSpec["dataset"]["source"],
  valueKey: string | undefined,
  sort: "none" | "asc" | "desc"
) {
  if (sort === "none" || !valueKey) return source

  return [...source].sort((left, right) => {
    const leftValue = Number(left[valueKey] ?? 0)
    const rightValue = Number(right[valueKey] ?? 0)
    return sort === "asc" ? leftValue - rightValue : rightValue - leftValue
  })
}

function formatPercent(params: { name?: string; percent?: number; value?: unknown }) {
  const percent = typeof params.percent === "number" ? `${params.percent}%` : ""
  return percent ? `${params.name ?? ""} ${percent}` : String(params.value ?? "")
}

export function createJoyChartOption(spec: JoyChartSpec): EChartsOption {
  const display = mergeJoyChartDisplay(spec.display)
  const chartType = spec.chart.type
  const categoryKey = getCategoryKey(spec)
  const valueKeys = getValueKeys(spec, categoryKey)
  const firstValueKey = valueKeys[0] || categoryKey
  const source = sortSource(spec.dataset.source, firstValueKey, display.layout.sort ?? "none")
  const palette = THEME_PALETTES[display.style.theme ?? "vintage"] ?? THEME_PALETTES.vintage
  const surface = getJoyChartSurface(display.style.theme)
  const title = spec.chart.title

  if (chartType === "pie") {
    return {
      backgroundColor: surface.background,
      color: palette,
      title: title ? { text: title, left: "center", top: 4, textStyle: { fontSize: 14, color: surface.text } } : undefined,
      tooltip: display.tooltip ? { trigger: "item" } : undefined,
      legend: display.legend ? { bottom: 0, type: "scroll", textStyle: { color: surface.mutedText } } : undefined,
      series: [
        {
          type: "pie",
          radius: display.pie.donut ? ["42%", "70%"] : "70%",
          roseType: display.pie.rose ? "radius" : undefined,
          center: ["50%", display.legend ? "44%" : "52%"],
          label: {
            show: display.label || display.pie.showPercent,
            formatter: display.pie.showPercent ? formatPercent : "{b}",
          },
          emphasis: display.style.emphasis ? { scale: true, scaleSize: 6 } : undefined,
          data: source.map((item) => ({
            name: String(item[categoryKey] ?? ""),
            value: Number(item[firstValueKey] ?? 0),
          })),
        },
      ],
    }
  }

  const isHorizontal = chartType === "bar" && display.layout.orientation === "horizontal"
  const categoryAxis = {
    type: "category" as const,
    data: source.map((item) => String(item[categoryKey] ?? "")),
    axisLabel: { rotate: isHorizontal ? 0 : display.axis.xLabelRotate, color: surface.mutedText },
    axisLine: { lineStyle: { color: surface.axis } },
    axisTick: { lineStyle: { color: surface.axis } },
  }
  const valueAxis = {
    type: "value" as const,
    name: getDimensionName(spec, firstValueKey),
    nameTextStyle: { color: surface.mutedText },
    axisLabel: { color: surface.mutedText },
    axisLine: { lineStyle: { color: surface.axis } },
    splitLine: { show: display.axis.showGrid, lineStyle: { color: surface.grid } },
  }

  return {
    backgroundColor: surface.background,
    color: palette,
    title: title ? { text: title, left: 4, top: 0, textStyle: { fontSize: 14, color: surface.text } } : undefined,
    tooltip: display.tooltip ? { trigger: "axis" } : undefined,
    legend: display.legend ? { top: title ? 28 : 4, right: 4, type: "scroll", textStyle: { color: surface.mutedText } } : undefined,
    grid: {
      left: isHorizontal ? 72 : 44,
      right: 24,
      top: display.legend || title ? 64 : 24,
      bottom: 36,
      containLabel: true,
    },
    xAxis: isHorizontal ? valueAxis : categoryAxis,
    yAxis: isHorizontal ? categoryAxis : valueAxis,
    series: valueKeys.map((valueKey) => ({
      name: getDimensionName(spec, valueKey),
      type: chartType === "line" ? "line" : "bar",
      data: source.map((item) => Number(item[valueKey] ?? 0)),
      stack: display.layout.stack ? "total" : undefined,
      smooth: chartType === "line" ? display.line.smooth : undefined,
      symbol: chartType === "line" && !display.line.symbol ? "none" : undefined,
      areaStyle: chartType === "line" && display.line.area ? {} : undefined,
      barWidth: chartType === "bar" ? display.bar.barWidth : undefined,
      itemStyle:
        chartType === "bar"
          ? { borderRadius: display.bar.borderRadius }
          : undefined,
      label: display.label ? { show: true, position: isHorizontal ? "right" : "top" } : undefined,
      emphasis: display.style.emphasis ? { focus: "series" } : undefined,
    })),
  }
}
