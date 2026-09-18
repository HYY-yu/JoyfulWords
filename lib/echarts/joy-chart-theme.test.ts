import test from "node:test"
import assert from "node:assert/strict"
import { CHART_STYLE_RECIPES, resolveJoyChartTheme, type ChartDesign } from "./joy-chart-theme"
import { createJoyChartOption, getJoyChartBackgroundColor } from "./joy-chart-options"
import type { JoyChartSpec } from "@/lib/api/echarts/types"

const design: ChartDesign = {
  schema_version: 1,
  style: { id: 1, slug: "minimal-business", name: { zh: "商务", en: "Business" }, description: { zh: "", en: "" }, recommended_scene: "work-report", version: 1 },
  color_family: { id: 1, slug: "green", name: { zh: "绿", en: "Green" } },
  palette: { id: 1, style_id: 1, color_family_id: 1, version: 1, primary: "#176B50", on_primary: "#FFFFFF", secondary: "#C18136", background: "#F4F8F6", surface: "#FFFFFF", text: "#202832", muted_text: "#525D69", border: "#C5DAD3", chart: ["#176B50", "#C18136", "#2458A6"] },
}
const spec: JoyChartSpec = {
  schemaVersion: "joychart.v1", chart: { type: "bar", title: "增长" },
  dataset: { dimensions: [{ id: "x" }, { id: "y" }], source: [{ x: "A", y: 42 }, { x: "B", y: -12 }] },
  encoding: { x: "x", y: "y" }, display: { style: { theme: "dark" } },
}

test("all six styles render three chart types with catalog colors and unchanged data", () => {
  const original = JSON.stringify(spec)
  for (const slug of Object.keys(CHART_STYLE_RECIPES)) {
    for (const type of ["bar", "line", "pie"]) {
      const selected = { ...design, style: { ...design.style, slug } }
      const option = createJoyChartOption({ ...spec, chart: { ...spec.chart, type } }, undefined, selected)
      assert.deepEqual(option.color, design.palette.chart)
      assert.equal(option.backgroundColor, getJoyChartBackgroundColor(selected))
      const series = option.series as Array<{ data: unknown[] }>
      assert.deepEqual(series[0].data, type === "pie" ? [{ name: "A", value: 42 }, { name: "B", value: -12 }] : [42, -12])
    }
  }
  assert.equal(JSON.stringify(spec), original)
})

test("legacy theme cannot override the inherited design or the default", () => {
  for (const theme of ["dark", "vintage", "roma", "unknown"]) {
    const option = createJoyChartOption({ ...spec, display: { style: { theme } } })
    assert.equal(option.backgroundColor, "#F4F8F6")
    assert.deepEqual(option.color, resolveJoyChartTheme().colors)
  }
})

test("horizontal bars rotate theme corners, line controls still work", () => {
  const cute = { ...design, style: { ...design.style, slug: "cute-chibi" } }
  const bar = createJoyChartOption({ ...spec, display: { layout: { orientation: "horizontal" } } }, undefined, cute)
  assert.deepEqual((bar.series as Array<{ itemStyle: { borderRadius: number[] } }>)[0].itemStyle.borderRadius, [0, 12, 12, 0])
  const line = createJoyChartOption({ ...spec, chart: { type: "line" }, display: { line: { symbol: false, smooth: false, area: true } } }, undefined, cute)
  const series = (line.series as Array<{ symbol: string; smooth: boolean; areaStyle: unknown }>)[0]
  assert.equal(series.symbol, "none")
  assert.equal(series.smooth, false)
  assert.ok(series.areaStyle)
})

test("unknown style retains catalog palette with business geometry", () => {
  const resolved = resolveJoyChartTheme({ ...design, style: { ...design.style, slug: "future-style" } })
  assert.equal(resolved.radius, 2)
  assert.deepEqual(resolved.colors, design.palette.chart)
})
