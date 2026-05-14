"use client"

import type { TaskCenterTaskReference } from "@/lib/api/taskcenter/types"

export type EChartsArticleAnalysisSessionStatus =
  | "submitting"
  | "submitted"
  | "empty"
  | "failed"

export interface EChartsArticleAnalysisSession {
  requestId: string
  articleId: number
  maxCharts: number
  status: EChartsArticleAnalysisSessionStatus
  startedAt: number
  updatedAt: number
  total?: number
  taskRefs?: TaskCenterTaskReference[]
  errorMessage?: string
}

const STORAGE_KEY_PREFIX = "joyfulwords-echarts-article-analysis"
const SESSION_EXPIRY_MS = 15 * 60 * 1000
const SUBMITTED_SESSION_EXPIRY_MS = 45 * 1000

function getStorageKey(articleId: number): string {
  return `${STORAGE_KEY_PREFIX}:${articleId}`
}

function isValidSession(value: unknown): value is EChartsArticleAnalysisSession {
  if (!value || typeof value !== "object") return false

  const candidate = value as Partial<EChartsArticleAnalysisSession>
  return (
    typeof candidate.requestId === "string" &&
    typeof candidate.articleId === "number" &&
    typeof candidate.maxCharts === "number" &&
    typeof candidate.startedAt === "number" &&
    typeof candidate.updatedAt === "number" &&
    (candidate.status === "submitting" ||
      candidate.status === "submitted" ||
      candidate.status === "empty" ||
      candidate.status === "failed")
  )
}

function isSessionExpired(session: EChartsArticleAnalysisSession): boolean {
  const ttl =
    session.status === "submitted" ? SUBMITTED_SESSION_EXPIRY_MS : SESSION_EXPIRY_MS

  return Date.now() - session.updatedAt > ttl
}

export function loadEChartsArticleAnalysisSession(
  articleId: number
): EChartsArticleAnalysisSession | null {
  if (typeof window === "undefined") return null

  const storageKey = getStorageKey(articleId)
  const rawValue = window.localStorage.getItem(storageKey)
  if (!rawValue) return null

  try {
    const parsed = JSON.parse(rawValue) as unknown
    if (!isValidSession(parsed) || parsed.articleId !== articleId || isSessionExpired(parsed)) {
      window.localStorage.removeItem(storageKey)
      return null
    }

    return parsed
  } catch {
    window.localStorage.removeItem(storageKey)
    return null
  }
}

export function saveEChartsArticleAnalysisSession(
  session: EChartsArticleAnalysisSession
): void {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(getStorageKey(session.articleId), JSON.stringify(session))
  } catch (error) {
    console.warn("[ECharts] Failed to persist article analysis session", { error })
  }
}

export function clearEChartsArticleAnalysisSession(articleId: number): void {
  if (typeof window === "undefined") return

  window.localStorage.removeItem(getStorageKey(articleId))
}
