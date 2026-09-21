"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, BookOpen, RefreshCw } from "lucide-react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { caseAssetUrl, casesClient, caseText, type CaseSummary } from "@/lib/api/cases/client"
import { Button } from "@/components/ui/base/button"
import { illustrationsClient } from "@/lib/api/illustrations/client"
import { DESIGN_CHANGED } from "@/components/article/illustration/design-style-picker"

export function CaseShowcase() {
  const { t, locale } = useTranslation()
  const [items, setItems] = useState<CaseSummary[]>([])
  const [styleSlug, setStyleSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const refresh = () => setAttempt((value) => value + 1)
    window.addEventListener(DESIGN_CHANGED, refresh)
    return () => window.removeEventListener(DESIGN_CHANGED, refresh)
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setFailed(false)
    Promise.all([casesClient.list(controller.signal), illustrationsClient.preference(controller.signal)]).then(([result, preference]) => {
      if (controller.signal.aborted) return
      if ("error" in result || "error" in preference) {
        const failure = "error" in result ? result : preference
        console.warn("[Cases] Showcase load failed", { failure })
        setFailed(true)
      } else {
        setItems(result.items)
        setStyleSlug(preference.snapshot?.style.slug ?? "minimal-business")
      }
      setLoading(false)
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      console.warn("[Cases] Showcase request rejected", { error })
      setFailed(true)
      setLoading(false)
    })
    return () => controller.abort()
  }, [attempt])

  const item = items.find((entry) => entry.style_slug === styleSlug)

  return (
    <section aria-labelledby="case-showcase-title" className="mb-5 border-b border-[var(--jw-border-subtle)] pb-5 md:mb-6 md:pb-6">
      <h2 id="case-showcase-title" className="jw-heading-text text-base font-semibold">{t("cases.title")}</h2>
      <p className="jw-muted-text mt-1 text-xs sm:text-sm">{t("cases.subtitle")}</p>
      {loading ? (
        <div role="status" aria-label={t("cases.loading")} className="mt-4 h-40 max-w-4xl animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
      ) : failed ? (
        <div role="alert" className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
          {t("cases.loadFailed")}<Button size="sm" variant="ghost" onClick={() => setAttempt((value) => value + 1)}><RefreshCw className="mr-2 h-3.5 w-3.5" />{t("cases.retry")}</Button>
        </div>
      ) : !item ? <p className="mt-4 text-sm text-muted-foreground">{t("cases.empty")}</p> : (
        <Link href={`/articles/cases/${encodeURIComponent(item.slug)}`} className="group mt-4 flex max-w-4xl overflow-hidden rounded-lg border border-[var(--jw-border-subtle)] bg-[var(--jw-surface-strong)] outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4">
          <div className="relative w-32 shrink-0 overflow-hidden bg-muted sm:w-60">
            {caseAssetUrl(item.cover_url) ? <img src={caseAssetUrl(item.cover_url)} alt="" className="absolute inset-0 h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none" /> : <BookOpen className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center p-4 sm:min-h-40 sm:p-5">
            <p className="jw-muted-text mb-1.5 text-xs">{t(`cases.styles.${item.style_slug}`)}</p>
            <h3 className="jw-heading-text line-clamp-2 text-sm font-semibold leading-6 sm:text-base">{caseText(item.title, locale)}</h3>
            <p className="jw-muted-text mt-2 line-clamp-2 text-xs leading-5 sm:text-sm sm:leading-6">{caseText(item.summary, locale)}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--jw-accent)]">{t("cases.view")}<ArrowUpRight className="h-3.5 w-3.5" /></span>
          </div>
        </Link>
      )}
    </section>
  )
}
