"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Download, Loader2, ArrowUpRight } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { Button } from "@/components/ui/base/button"
import { BrandLogo } from "@/components/brand/brand-logo"
import { CopyCaseButton } from "@/components/cases/copy-case-button"
import { CaseContent } from "@/components/cases/case-content"
import { casesClient, caseText, caseAssetUrl, type CaseDetail } from "@/lib/api/cases/client"

export default function CasePage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug || ""
  const { user, loading: authLoading } = useAuth()
  const { t, locale, setLocale } = useTranslation()
  const [item, setItem] = useState<CaseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<"notFound" | "loadFailed" | null>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (authLoading || !user) return
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    casesClient.detail(slug, controller.signal).then((result) => {
      if (controller.signal.aborted) return
      if ("error" in result) {
        console.warn("[Cases] Detail load failed", { slug, status: result.status, error: result.error })
        setError(result.status === 404 ? "notFound" : "loadFailed")
      } else setItem(result)
      setLoading(false)
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      console.warn("[Cases] Detail request rejected", { error })
      setError("loadFailed")
      setLoading(false)
    })
    return () => controller.abort()
  }, [slug, authLoading, user, attempt])

  const article = item?.articles.find((entry) => entry.locale === locale) || item?.articles[0]
  const images = item?.artifacts.filter((entry) => entry.artifact_key !== "cover" && (entry.artifact_type === "image" || entry.artifact_type === "infographic")) || []
  const ppts = item?.artifacts.filter((entry) => entry.artifact_type === "ppt") || []

  return <div className="jw-app-shell min-h-screen">
    <header className="jw-app-header border-b"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8"><Link href="/articles" aria-label="JoyfulWords"><BrandLogo /></Link><Button variant="ghost" size="sm" onClick={() => setLocale(locale === "zh" ? "en" : "zh")}>{locale === "zh" ? "English" : "中文"}</Button></div></header>
    <main className="mx-auto max-w-6xl px-5 py-7 sm:px-8 sm:py-10">
      <Link href="/articles" className="mb-7 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />{t("cases.back")}</Link>
      {!authLoading && !user ? <Link href={`/auth/login?redirect=${encodeURIComponent(`/articles/cases/${slug}`)}`}>{t("cases.login")}</Link> : loading || authLoading ? <div role="status" className="flex items-center gap-2 py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />{t("cases.loading")}</div> : error ? <div role="alert" className="space-y-4 py-12"><p>{t(`cases.${error}`)}</p>{error !== "notFound" && <Button variant="outline" onClick={() => setAttempt((value) => value + 1)}>{t("cases.retry")}</Button>}</div> : item && <>
        <div className="mb-8 max-w-3xl"><p className="mb-3 text-sm font-medium text-[var(--jw-accent)]">{t("cases.title")} / {t(`cases.styles.${item.style_slug}`)}</p><h1 className="jw-heading-text text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{caseText(item.title, locale)}</h1><p className="mt-4 text-base leading-7 text-muted-foreground">{caseText(item.summary, locale)}</p></div>
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
          <article className="min-w-0 rounded-xl bg-[var(--jw-surface-strong)] p-5 sm:p-9">
            {caseAssetUrl(item.cover_url) && !article?.content.includes(item.cover_url) && <img src={caseAssetUrl(item.cover_url)} alt={caseText(item.title, locale)} className="mb-8 w-full rounded-lg" />}
            {article ? <div lang={article.locale}><CaseContent content={article.content} /></div> : <p>{t("cases.noArticle")}</p>}
            {images.filter((entry) => !article?.content.includes(entry.asset_url)).map((entry) => caseAssetUrl(entry.asset_url) && <figure key={entry.artifact_key} className="mt-8"><a href={caseAssetUrl(entry.asset_url)} target="_blank" rel="noopener noreferrer"><img src={caseAssetUrl(entry.asset_url)} alt={entry.title} loading="lazy" className="w-full rounded-lg" /></a><figcaption className="mt-2 text-sm text-muted-foreground">{entry.title}</figcaption></figure>)}
          </article>
          <aside className="space-y-8 lg:sticky lg:top-8">
            {article && <CopyCaseButton slug={item.slug} />}
            {ppts.length > 0 && <section><h2 className="mb-3 text-sm font-semibold">{t("cases.presentation")}</h2>{ppts.map((entry) => caseAssetUrl(entry.asset_url) && <a key={entry.artifact_key} href={caseAssetUrl(entry.asset_url)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-lg border border-[var(--jw-border-subtle)] bg-[var(--jw-surface-strong)] p-4 text-sm hover:border-primary"><span>{t("cases.downloadPpt")}</span><Download className="h-4 w-4 shrink-0" /></a>)}</section>}
            <section><h2 className="mb-2 text-sm font-semibold">{t("cases.materials")} <span className="ml-1 font-normal text-muted-foreground">{item.materials.length}</span></h2><div className="divide-y divide-[var(--jw-border-subtle)]">{item.materials.map((material) => <details key={material.material_key} className="py-3"><summary className="cursor-pointer text-sm font-medium leading-6">{material.title}</summary><div className="mt-3 text-sm leading-7"><CaseContent content={material.content} />{caseAssetUrl(material.source_url) && <a href={caseAssetUrl(material.source_url)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-primary">{t("cases.source")}<ArrowUpRight className="h-3.5 w-3.5" /></a>}</div></details>)}</div></section>
          </aside>
        </div>
      </>}
    </main>
  </div>
}
