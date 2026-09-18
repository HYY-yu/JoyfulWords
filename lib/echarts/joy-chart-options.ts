import type { EChartsOption } from "echarts"
import type { JoyChartSpec } from "@/lib/api/echarts/types"
import { resolveJoyChartTheme, type ChartThemeDesign } from "./joy-chart-theme"
import { mergeJoyChartDisplay } from "./joy-chart-defaults"

export interface JoyChartViewport {
  width: number
  height: number
}

const DEFAULT_VIEWPORT: JoyChartViewport = { width: 640, height: 360 }
const TITLE_SAFE_SIZE = 40
const HORIZONTAL_LEGEND_SAFE_SIZE = 32
const VERTICAL_LEGEND_SAFE_SIZE = 112
const CARTESIAN_AXIS_NAME_TOP_SAFE_SIZE = 40

export function getJoyChartBackgroundColor(design?: ChartThemeDesign | null): string {
  return resolveJoyChartTheme(design).background
}

function getDimensionName(spec: JoyChartSpec, id: string | undefined): string {
  if (!id) return ""
  const matched = spec.dataset.dimensions.find((dimension) => dimension.id === id)
  return matched?.name || id
}

function toEncodingKeys(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.length > 0)
  }
  if (typeof value === "string" && value.length > 0) {
    return [value]
  }
  return []
}

function getCategoryKey(spec: JoyChartSpec): string {
  const xEncoding = toEncodingKeys(spec.encoding?.x)
  const categoryEncoding = toEncodingKeys(spec.encoding?.category)
  return (
    xEncoding[0] ||
    categoryEncoding[0] ||
    spec.dataset.dimensions.find((dimension) => dimension.role === "category")?.id ||
    spec.dataset.dimensions[0]?.id ||
    "category"
  )
}

function getValueKeys(spec: JoyChartSpec, categoryKey: string): string[] {
  const encodedY = toEncodingKeys(spec.encoding?.y)
  if (encodedY.length > 0) return encodedY

  const encodedValue = toEncodingKeys(spec.encoding?.value)
  if (encodedValue.length > 0) return encodedValue

  const valueDimensions = spec.dataset.dimensions
    .filter((dimension) => dimension.id !== categoryKey && dimension.role !== "category")
    .map((dimension) => dimension.id)

  if (valueDimensions.length > 0) return valueDimensions

  return spec.dataset.dimensions
    .map((dimension) => dimension.id)
    .filter((dimensionId) => dimensionId !== categoryKey)
}

function getSeriesKeys(spec: JoyChartSpec): string[] {
  return toEncodingKeys(spec.encoding?.series)
}

function getPieItemNameKey(spec: JoyChartSpec, categoryKey: string): string {
  return toEncodingKeys(spec.encoding?.itemName)[0] || categoryKey
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
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

export function createJoyChartOption(
  spec: JoyChartSpec,
  viewport: JoyChartViewport = DEFAULT_VIEWPORT,
  design?: ChartThemeDesign | null
): EChartsOption {
  const display = mergeJoyChartDisplay(spec.display)
  const chartType = spec.chart.type
  const categoryKey = getCategoryKey(spec)
  const seriesKeys = getSeriesKeys(spec)
  const hasGroupedSeries = (chartType === "bar" || chartType === "line") && seriesKeys.length > 0
  const valueKeys = getValueKeys(spec, categoryKey)
  const firstValueKey = valueKeys[0] || categoryKey
  const source = sortSource(spec.dataset.source, firstValueKey, display.layout.sort ?? "none")
  const surface = resolveJoyChartTheme(design)
  const palette = surface.colors
  const tooltipStyle = { backgroundColor: surface.surface, borderColor: surface.axis, textStyle: { color: surface.text }, confine: true }
  const title = spec.chart.title
  const showTitle = Boolean(title && display.title)
  const titlePosition = display.layout.titlePosition
  const titleAlign = display.layout.titleAlign
  const legendPosition = display.layout.legendPosition
  const viewportWidth = Math.max(240, Math.round(viewport.width || DEFAULT_VIEWPORT.width))
  const viewportHeight = Math.max(220, Math.round(viewport.height || DEFAULT_VIEWPORT.height))
  const titleTop = showTitle && titlePosition === "top" ? TITLE_SAFE_SIZE : 0
  const titleBottom = showTitle && titlePosition === "bottom" ? TITLE_SAFE_SIZE : 0
  const legendTop = display.legend && legendPosition === "top" ? HORIZONTAL_LEGEND_SAFE_SIZE : 0
  const legendBottom = display.legend && legendPosition === "bottom" ? HORIZONTAL_LEGEND_SAFE_SIZE : 0
  const legendLeft = display.legend && legendPosition === "left" ? VERTICAL_LEGEND_SAFE_SIZE : 0
  const legendRight = display.legend && legendPosition === "right" ? VERTICAL_LEGEND_SAFE_SIZE : 0
  const titleOption = showTitle
    ? {
        text: title,
        top: titlePosition === "top" ? 8 : undefined,
        bottom: titlePosition === "bottom" ? 8 : undefined,
        left: titleAlign === "left" ? 8 : titleAlign === "center" ? "center" : undefined,
        right: titleAlign === "right" ? 8 : undefined,
        textStyle: {
          fontSize: 16,
          fontFamily: surface.fontFamily,
          fontWeight: surface.serif ? 500 : 600,
          color: surface.text,
          width: Math.max(120, viewportWidth - 24),
          overflow: "truncate" as const,
        },
      }
    : undefined
  const legendOption = display.legend
    ? legendPosition === "left" || legendPosition === "right"
      ? {
          orient: "vertical" as const,
          type: "scroll" as const,
          left: legendPosition === "left" ? 4 : undefined,
          right: legendPosition === "right" ? 4 : undefined,
          top: titleTop + 8,
          bottom: titleBottom + 8,
          width: VERTICAL_LEGEND_SAFE_SIZE - 12,
          textStyle: {
            color: surface.mutedText,
            width: VERTICAL_LEGEND_SAFE_SIZE - 36,
            overflow: "truncate" as const,
          },
        }
      : {
          orient: "horizontal" as const,
          type: "scroll" as const,
          left: "center" as const,
          top: legendPosition === "top" ? titleTop + 4 : undefined,
          bottom: legendPosition === "bottom" ? titleBottom + 4 : undefined,
          width: Math.max(120, viewportWidth - 16),
          textStyle: { color: surface.mutedText },
        }
    : undefined

  if (chartType === "pie") {
    const pieItemNameKey = getPieItemNameKey(spec, categoryKey)
    const safeLeft = legendLeft + 8
    const safeRight = legendRight + 8
    const safeTop = titleTop + legendTop + 8
    const safeBottom = titleBottom + legendBottom + 8
    const safeWidth = Math.max(120, viewportWidth - safeLeft - safeRight)
    const safeHeight = Math.max(120, viewportHeight - safeTop - safeBottom)
    const outerRadius = Math.max(42, Math.floor(Math.min(safeWidth, safeHeight) * 0.35))
    return {
      backgroundColor: surface.background,
      textStyle: { fontFamily: surface.fontFamily, color: surface.text },
      color: palette,
      title: titleOption,
      tooltip: display.tooltip ? { ...tooltipStyle, trigger: "item" } : undefined,
      legend: legendOption,
      series: [
        {
          type: "pie",
          radius: display.pie.donut
            ? [Math.round(outerRadius * 0.6), outerRadius]
            : outerRadius,
          roseType: display.pie.rose ? "radius" : undefined,
          center: [safeLeft + safeWidth / 2, safeTop + safeHeight / 2],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: surface.background, borderWidth: 3, borderRadius: surface.radius },
          labelLine: { lineStyle: { color: surface.axis } },
          minShowLabelAngle: 3,
          label: {
            show: display.label || display.pie.showPercent,
            color: surface.text,
            formatter: display.pie.showPercent ? formatPercent : "{b}",
            overflow: "truncate",
            width: 96,
          },
          labelLayout: { moveOverlap: "shiftY", hideOverlap: true },
          emphasis: display.style.emphasis ? { scale: true, scaleSize: 6 } : undefined,
          data: source.map((item) => ({
            name: String(item[pieItemNameKey] ?? ""),
            value: toFiniteNumber(item[firstValueKey]),
          })),
        },
      ],
    }
  }

  const isHorizontal = chartType === "bar" && display.layout.orientation === "horizontal"
  const categoryAxis = {
    type: "category" as const,
    data: hasGroupedSeries
      ? Array.from(
        source.reduce((categories, item) => {
          categories.add(String(item[categoryKey] ?? ""))
          return categories
        }, new Set<string>())
      )
      : source.map((item) => String(item[categoryKey] ?? "")),
    axisLabel: { rotate: isHorizontal ? 0 : display.axis.xLabelRotate, color: surface.mutedText },
    axisLine: { show: !surface.quiet, lineStyle: { color: surface.axis } },
    axisTick: { show: false },
  }
  const valueAxis = {
    type: "value" as const,
    name: getDimensionName(spec, firstValueKey),
    nameTextStyle: { color: surface.mutedText },
    axisLabel: { color: surface.mutedText },
    axisLine: { lineStyle: { color: surface.axis } },
    splitLine: { show: display.axis.showGrid, lineStyle: { color: surface.grid, opacity: surface.quiet ? 0.45 : 0.65, type: surface.dashed ? "dashed" as const : "solid" as const } },
  }

  const groupedSeriesData = hasGroupedSeries
    ? (() => {
      const categories = categoryAxis.data
      const groupedNames: string[] = []
      const groupedCategoryValues = new Map<string, Map<string, number>>()

      for (const item of source) {
        const category = String(item[categoryKey] ?? "")
        const groupName = seriesKeys.map((seriesKey) => String(item[seriesKey] ?? "")).join(" / ")
        const value = toFiniteNumber(item[firstValueKey])

        if (!groupedCategoryValues.has(groupName)) {
          groupedNames.push(groupName)
          groupedCategoryValues.set(groupName, new Map())
        }

        groupedCategoryValues.get(groupName)?.set(category, value)
      }

      return groupedNames.map((groupName) => ({
        name: groupName,
        data: categories.map((category) => groupedCategoryValues.get(groupName)?.get(category) ?? 0),
      }))
    })()
    : null

  return {
    backgroundColor: surface.background,
      textStyle: { fontFamily: surface.fontFamily, color: surface.text },
    color: palette,
    title: titleOption,
    tooltip: display.tooltip ? { ...tooltipStyle, trigger: "axis" } : undefined,
    legend: legendOption,
    grid: {
      left: (isHorizontal ? 72 : 44) + legendLeft,
      right: 24 + legendRight,
      top: Math.max(CARTESIAN_AXIS_NAME_TOP_SAFE_SIZE, 24 + titleTop + legendTop),
      bottom: 36 + titleBottom + legendBottom,
      containLabel: true,
    },
    xAxis: isHorizontal ? valueAxis : categoryAxis,
    yAxis: isHorizontal ? categoryAxis : valueAxis,
    series: (groupedSeriesData ?? valueKeys.map((valueKey) => ({
      name: getDimensionName(spec, valueKey),
      data: source.map((item) => toFiniteNumber(item[valueKey])),
    }))).map((seriesItem, index) => ({
      name: seriesItem.name,
      type: chartType === "line" ? "line" : "bar",
      data: seriesItem.data,
      stack: display.layout.stack ? "total" : undefined,
      smooth: chartType === "line" ? display.line.smooth : undefined,
      symbol: chartType === "line" ? (display.line.symbol ? surface.symbol : "none") : undefined,
      symbolSize: surface.radius === 12 ? 8 : 6,
      lineStyle: { width: surface.width, type: index % 3 === 2 ? "dotted" : index % 3 === 1 ? "dashed" : "solid" },
      areaStyle: chartType === "line" && display.line.area ? { opacity: surface.glass || surface.quiet ? 0.08 : 0.15 } : undefined,
      barWidth: chartType === "bar" ? display.bar.barWidth : undefined,
      itemStyle:
        chartType === "bar"
          ? {
              borderRadius: isHorizontal ? [0, surface.radius, surface.radius, 0] : [surface.radius, surface.radius, 0, 0],
              color: surface.glass ? {
                type: "linear", x: 0, y: 0, x2: isHorizontal ? 1 : 0, y2: isHorizontal ? 0 : 1,
                colorStops: [{ offset: 0, color: palette[index % palette.length] }, { offset: 1, color: palette[index % palette.length] + "88" }],
              } : palette[index % palette.length],
              shadowBlur: surface.quiet ? 6 : 0,
              shadowColor: palette[index % palette.length] + "25",
            }
          : undefined,
      label: display.label ? { show: true, position: isHorizontal ? "right" : "top" } : undefined,
      emphasis: display.style.emphasis ? { focus: "series" } : undefined,
    })),
  }
}
