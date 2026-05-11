import type { JoyChartDisplay } from "@/lib/api/echarts/types"

export const JOY_CHART_THEME_OPTIONS = [
  "vintage",
  "dark",
  "macarons",
  "infographic",
  "shine",
  "roma",
] as const

export const DEFAULT_JOY_CHART_DISPLAY: Required<JoyChartDisplay> = {
  legend: true,
  tooltip: true,
  label: false,
  layout: {
    orientation: "vertical",
    stack: false,
    sort: "none",
  },
  axis: {
    showGrid: true,
    xLabelRotate: 0,
    yFormat: "number",
  },
  style: {
    theme: "vintage",
    emphasis: true,
  },
  bar: {
    borderRadius: 6,
    barWidth: 54,
  },
  line: {
    smooth: false,
    area: false,
    symbol: true,
  },
  pie: {
    donut: false,
    rose: false,
    showPercent: true,
  },
}

export function mergeJoyChartDisplay(display?: JoyChartDisplay): Required<JoyChartDisplay> {
  return {
    ...DEFAULT_JOY_CHART_DISPLAY,
    ...display,
    layout: {
      ...DEFAULT_JOY_CHART_DISPLAY.layout,
      ...display?.layout,
    },
    axis: {
      ...DEFAULT_JOY_CHART_DISPLAY.axis,
      ...display?.axis,
    },
    style: {
      ...DEFAULT_JOY_CHART_DISPLAY.style,
      ...display?.style,
    },
    bar: {
      ...DEFAULT_JOY_CHART_DISPLAY.bar,
      ...display?.bar,
    },
    line: {
      ...DEFAULT_JOY_CHART_DISPLAY.line,
      ...display?.line,
    },
    pie: {
      ...DEFAULT_JOY_CHART_DISPLAY.pie,
      ...display?.pie,
    },
  }
}
