import { fetchArticleDesign as fetchChartDesign } from "@/lib/design/article-design"
export { fetchArticleDesign as fetchChartDesign } from "@/lib/design/article-design"
import type { ChartDesign } from "./joy-chart-theme"

// Share concurrent gallery requests, but never retain another user's design in a cache.
const pending = new Map<string, Promise<ChartDesign | null>>()

export function loadChartDesign(userId: number, articleId?: number, revision = 0) {
  const key = `${userId}:${articleId ?? 0}:${revision}`
  const existing = pending.get(key)
  if (existing) return existing
  const request = fetchChartDesign(articleId).finally(() => pending.delete(key))
  pending.set(key, request)
  return request
}
