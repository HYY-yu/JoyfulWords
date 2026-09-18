"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { loadChartDesign } from "./chart-design-loader"
import type { ChartDesign } from "./joy-chart-theme"

export function useChartDesign(articleId?: number) {
  const { user, loading } = useAuth()
  const [revision, setRevision] = useState(0)
  const key = `${user?.id ?? 0}:${articleId ?? 0}:${revision}`
  const [result, setResult] = useState<{ key: string; design: ChartDesign | null; error: boolean } | null>(null)
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1)
    window.addEventListener("illustration-design-changed", refresh)
    return () => window.removeEventListener("illustration-design-changed", refresh)
  }, [])
  useEffect(() => {
    if (loading || !user) return
    let active = true
    loadChartDesign(user.id, articleId, revision).then(design => {
      if (active) setResult({ key, design, error: false })
    }).catch(error => {
      if (!active) return
      console.warn("[JoyChart] Design loading failed", { articleId, error })
      setResult({ key, design: null, error: true })
    })
    return () => { active = false }
  }, [user, loading, articleId, revision, key])
  const current = result?.key === key ? result : null
  return {
    design: user ? current?.design ?? null : null,
    loading: loading || Boolean(user && !current),
    error: Boolean(user && current?.error),
    retry: () => setRevision(value => value + 1),
  }
}
