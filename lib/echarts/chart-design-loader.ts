import { illustrationsClient } from "@/lib/api/illustrations/client"
import type { ChartDesign } from "./joy-chart-theme"

// Share concurrent gallery requests, but never retain another user's design in a cache.
const pending = new Map<string, Promise<ChartDesign | null>>()
export async function fetchChartDesign(articleId?: number): Promise<ChartDesign | null> {
  if (articleId) {
    const article = await illustrationsClient.design(articleId)
    if ("error" in article) throw new Error(article.error)
    if (article.binding) return article.binding.snapshot
  }
  const preference = await illustrationsClient.preference()
  if ("error" in preference) throw new Error(preference.error)
  return preference.snapshot
}

export function loadChartDesign(userId: number, articleId?: number, revision = 0) {
  const key = `${userId}:${articleId ?? 0}:${revision}`
  const existing = pending.get(key)
  if (existing) return existing
  const request = fetchChartDesign(articleId).finally(() => pending.delete(key))
  pending.set(key, request)
  return request
}
