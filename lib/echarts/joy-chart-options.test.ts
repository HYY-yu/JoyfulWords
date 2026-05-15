import test from "node:test"
import assert from "node:assert/strict"

import type { JoyChartSpec } from "@/lib/api/echarts/types"
import { createJoyChartOption } from "@/lib/echarts/joy-chart-options"

function createBaseSpec(chartType: "bar" | "line" | "pie"): JoyChartSpec {
  return {
    schemaVersion: "joychart.v1",
    chart: { type: chartType, title: "Test Chart" },
    dataset: {
      dimensions: [],
      source: [],
    },
    encoding: {},
    display: {
      layout: { sort: "none" },
    },
  }
}

test("grouped bar uses encoding.series and deduplicates categories", () => {
  const spec = createBaseSpec("bar")
  spec.dataset.dimensions = [
    { id: "field", name: "业态类型", role: "category" },
    { id: "field_2", name: "时期", role: "series" },
    { id: "field_3", name: "数量", role: "value" },
  ]
  spec.dataset.source = [
    { field: "传统实体商铺", field_2: "变化前", field_3: 3 },
    { field: "传统实体商铺", field_2: "变化后", field_3: 0 },
    { field: "数字经济配套点", field_2: "变化前", field_3: 0 },
    { field: "数字经济配套点", field_2: "变化后", field_3: 3 },
  ]
  spec.encoding = { x: "field", y: "field_3", series: "field_2" }

  const option = createJoyChartOption(spec) as Record<string, unknown>
  const xAxis = option.xAxis as { data: string[] }
  const series = option.series as Array<{ name: string; data: number[] }>
  const simplifiedSeries = series.map((item) => ({ name: item.name, data: item.data }))

  assert.deepEqual(xAxis.data, ["传统实体商铺", "数字经济配套点"])
  assert.deepEqual(simplifiedSeries, [
    { name: "变化前", data: [3, 0] },
    { name: "变化后", data: [0, 3] },
  ])
})

test("grouped line uses encoding.series and fills missing category values with 0", () => {
  const spec = createBaseSpec("line")
  spec.dataset.dimensions = [
    { id: "month", name: "月份", role: "category" },
    { id: "status", name: "状态", role: "series" },
    { id: "value", name: "数量", role: "value" },
  ]
  spec.dataset.source = [
    { month: "1月", status: "完成", value: 5 },
    { month: "2月", status: "完成", value: 7 },
    { month: "2月", status: "未完成", value: 2 },
  ]
  spec.encoding = { x: "month", y: "value", series: "status" }

  const option = createJoyChartOption(spec) as Record<string, unknown>
  const xAxis = option.xAxis as { data: string[] }
  const series = option.series as Array<{ name: string; data: number[]; type: string }>
  const simplifiedSeries = series.map((item) => ({ name: item.name, type: item.type, data: item.data }))

  assert.deepEqual(xAxis.data, ["1月", "2月"])
  assert.deepEqual(simplifiedSeries, [
    { name: "完成", type: "line", data: [5, 7] },
    { name: "未完成", type: "line", data: [0, 2] },
  ])
})

test("legacy single-value bar without encoding.series remains compatible", () => {
  const spec = createBaseSpec("bar")
  spec.dataset.dimensions = [
    { id: "name", name: "类目", role: "category" },
    { id: "amount", name: "数量", role: "value" },
  ]
  spec.dataset.source = [
    { name: "A", amount: 10 },
    { name: "B", amount: 20 },
  ]
  spec.encoding = { x: "name", y: "amount" }

  const option = createJoyChartOption(spec) as Record<string, unknown>
  const xAxis = option.xAxis as { data: string[] }
  const series = option.series as Array<{ name: string; data: number[]; type: string }>
  const simplifiedSeries = series.map((item) => ({ name: item.name, type: item.type, data: item.data }))

  assert.deepEqual(xAxis.data, ["A", "B"])
  assert.deepEqual(simplifiedSeries, [
    { name: "数量", type: "bar", data: [10, 20] },
  ])
})

test("multi-value wide table supports encoding.y as string[]", () => {
  const spec = createBaseSpec("bar")
  spec.dataset.dimensions = [
    { id: "month", name: "月份", role: "category" },
    { id: "current", name: "当前值", role: "value" },
    { id: "target", name: "目标值", role: "value" },
  ]
  spec.dataset.source = [
    { month: "1月", current: 3, target: 4 },
    { month: "2月", current: 6, target: 8 },
  ]
  spec.encoding = { x: "month", y: ["current", "target"] }

  const option = createJoyChartOption(spec) as Record<string, unknown>
  const series = option.series as Array<{ name: string; data: number[] }>
  const simplifiedSeries = series.map((item) => ({ name: item.name, data: item.data }))

  assert.deepEqual(simplifiedSeries, [
    { name: "当前值", data: [3, 6] },
    { name: "目标值", data: [4, 8] },
  ])
})

test("pie chart ignores encoding.series and keeps itemName/value rendering", () => {
  const spec = createBaseSpec("pie")
  spec.dataset.dimensions = [
    { id: "label", name: "名称", role: "category" },
    { id: "segment", name: "分组", role: "series" },
    { id: "amount", name: "数量", role: "value" },
  ]
  spec.dataset.source = [
    { label: "A", segment: "组1", amount: 1 },
    { label: "B", segment: "组2", amount: 2 },
  ]
  spec.encoding = { itemName: "label", value: "amount", series: "segment" }

  const option = createJoyChartOption(spec) as Record<string, unknown>
  const series = option.series as Array<{ data: Array<{ name: string; value: number }> }>

  assert.deepEqual(series[0]?.data, [
    { name: "A", value: 1 },
    { name: "B", value: 2 },
  ])
})

test("grouped horizontal bar keeps category order and applies stack", () => {
  const spec = createBaseSpec("bar")
  spec.display = {
    layout: {
      sort: "none",
      orientation: "horizontal",
      stack: true,
    },
  }
  spec.dataset.dimensions = [
    { id: "category", name: "类目", role: "category" },
    { id: "group", name: "分组", role: "series" },
    { id: "value", name: "值", role: "value" },
  ]
  spec.dataset.source = [
    { category: "A", group: "G1", value: 10 },
    { category: "A", group: "G2", value: 5 },
    { category: "B", group: "G1", value: 7 },
    { category: "B", group: "G2", value: 3 },
  ]
  spec.encoding = { x: "category", y: "value", series: "group" }

  const option = createJoyChartOption(spec) as Record<string, unknown>
  const yAxis = option.yAxis as { data: string[] }
  const series = option.series as Array<{ name: string; data: number[]; stack?: string }>
  const simplifiedSeries = series.map((item) => ({ name: item.name, data: item.data, stack: item.stack }))

  assert.deepEqual(yAxis.data, ["A", "B"])
  assert.deepEqual(simplifiedSeries, [
    { name: "G1", data: [10, 7], stack: "total" },
    { name: "G2", data: [5, 3], stack: "total" },
  ])
})
