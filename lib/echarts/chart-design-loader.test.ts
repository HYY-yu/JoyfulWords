import test from "node:test"
import assert from "node:assert/strict"
import { illustrationsClient } from "@/lib/api/illustrations/client"
import { fetchChartDesign, loadChartDesign } from "./chart-design-loader"
import type { ChartDesign } from "./joy-chart-theme"

// The resolver only passes snapshots through; the renderer validates their use separately.
const snapshot = { schema_version: 1 } as ChartDesign

test("article binding wins over preference", async (t) => {
  t.mock.method(illustrationsClient, "design", async () => ({ binding: { snapshot } }))
  const preference = t.mock.method(illustrationsClient, "preference", async () => ({ snapshot: null }))
  assert.equal(await fetchChartDesign(42), snapshot)
  assert.equal(preference.mock.callCount(), 0)
})
test("unbound article falls back to preference", async (t) => {
  t.mock.method(illustrationsClient, "design", async () => ({ binding: null }))
  t.mock.method(illustrationsClient, "preference", async () => ({ snapshot }))
  assert.equal(await fetchChartDesign(42), snapshot)
})
test("loading errors propagate rather than silently exporting default colors", async (t) => {
  t.mock.method(illustrationsClient, "design", async () => ({ error: "unavailable" }))
  await assert.rejects(fetchChartDesign(42), /unavailable/)
})
test("concurrent charts share requests but users and revisions are isolated", async (t) => {
  const preference = t.mock.method(illustrationsClient, "preference", async () => ({ snapshot: null }))
  const first = loadChartDesign(1)
  assert.equal(loadChartDesign(1), first)
  const second = loadChartDesign(2)
  assert.notEqual(second, first)
  assert.notEqual(loadChartDesign(1, undefined, 1), first)
  await Promise.all([first, second])
  assert.equal(preference.mock.callCount(), 3)
  await loadChartDesign(1)
  assert.equal(preference.mock.callCount(), 4)
})
