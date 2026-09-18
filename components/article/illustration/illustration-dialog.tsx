"use client"

import { useCallback, useEffect, useState } from "react"
import { CheckIcon, ImageIcon, LoaderIcon, LockKeyholeIcon } from "lucide-react"
import { AIFeatureDialogShell } from "@/components/ui/ai/ai-feature-dialog-shell"
import { Button } from "@/components/ui/base/button"
import { Alert, AlertDescription } from "@/components/ui/base/alert"
import { illustrationsClient } from "@/lib/api/illustrations/client"
import type { ArticleDesignState, DesignCatalog } from "@/lib/api/illustrations/types"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { CoverPanel } from "./cover-panel"
import { cn } from "@/lib/utils"

type ImageKind = "cover" | "infographic" | "decorative"
const KINDS: ImageKind[] = ["cover", "infographic", "decorative"]

export function IllustrationDialog({ open, onOpenChange, articleId, articleTitle }: {
  open: boolean; onOpenChange: (open: boolean) => void; articleId?: number | null; articleTitle: string
}) {
  const { t, locale } = useTranslation()
  const language = locale === "zh" ? "zh" : "en"
  const [catalog, setCatalog] = useState<DesignCatalog | null>(null)
  const [state, setState] = useState<ArticleDesignState | null>(null)
  const [styleId, setStyleId] = useState<number | null>(null)
  const [familyId, setFamilyId] = useState<number | null>(null)
  const [kind, setKind] = useState<ImageKind>("cover")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!open || !articleId) return
    const controller = new AbortController()
    setLoading(true)
    setError(false)
    setState(null)
    setCatalog(null)
    setConfirmed(false)
    Promise.all([illustrationsClient.catalog(controller.signal), illustrationsClient.design(articleId, controller.signal)])
      .then(([nextCatalog, nextState]) => {
        if (controller.signal.aborted) return
        if ("error" in nextCatalog || "error" in nextState) throw new Error("Illustration design load failed")
        setCatalog(nextCatalog)
        setState(nextState)
        setStyleId(nextState.binding?.snapshot.style.id ?? nextCatalog.styles[0]?.id ?? null)
        setFamilyId(nextState.binding?.snapshot.color_family.id ?? nextCatalog.color_families[0]?.id ?? null)
      }).catch((cause: unknown) => {
        if (controller.signal.aborted) return
        console.error("[Illustrations] Unable to load design", { articleId, cause })
        setError(true)
      }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [open, articleId, reload])

  const status = state?.preparation?.status
  useEffect(() => {
    if (!open || !articleId || (status !== "pending" && status !== "processing")) return
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    let failures = 0
    const poll = async () => {
      try {
        const next = await illustrationsClient.design(articleId, controller.signal)
        if (controller.signal.aborted) return
        if ("error" in next) throw new Error("Illustration preparation status unavailable")
        setState(next)
        failures = 0
        if (next.preparation?.status === "pending" || next.preparation?.status === "processing") timer = setTimeout(poll, 3000)
      } catch (cause) {
        if (controller.signal.aborted) return
        console.warn("[Illustrations] Status refresh failed", { articleId, cause })
        failures += 1
        if (failures < 3) timer = setTimeout(poll, 5000)
        else setError(true)
      }
    }
    timer = setTimeout(poll, 1500)
    return () => { controller.abort(); clearTimeout(timer) }
  }, [open, articleId, status])

  const bound = state?.binding
  const style = bound?.snapshot.style ?? catalog?.styles.find((item) => item.id === styleId)
  const family = bound?.snapshot.color_family ?? catalog?.color_families.find((item) => item.id === familyId)
  const palette = bound?.snapshot.palette ?? catalog?.palettes
    .filter((item) => item.style_id === styleId && item.color_family_id === familyId)
    .sort((a, b) => b.version - a.version)[0]

  const save = useCallback(async (retry = false) => {
    if (!articleId || !style || !palette || (!retry && !confirmed)) return
    setSaving(true)
    setError(false)
    try {
      const result = retry ? await illustrationsClient.retry(articleId) : await illustrationsClient.bind(articleId, style.id, palette.id)
      if ("error" in result) {
        // Recover an already committed binding after a concurrent tab chose another style.
        const current = await illustrationsClient.design(articleId)
        if (!("error" in current)) setState(current)
        throw new Error("Illustration design save failed")
      }
      setState(result)
    } catch (cause) {
      console.error("[Illustrations] Unable to save design", { articleId, cause })
      setError(true)
    } finally { setSaving(false) }
  }, [articleId, style, palette, confirmed])

  return (
    <AIFeatureDialogShell open={open} onOpenChange={(value) => { if (!saving) onOpenChange(value) }}
      title={t("illustration.title")} description={t("illustration.description")} size="large"
      contentClassName="sm:max-w-[1080px] lg:max-w-[1080px] xl:max-w-[1080px]"
      icon={<ImageIcon className="h-5 w-5 text-primary" />}>
      <div className="overflow-y-auto p-5 sm:p-7">
        {!articleId ? <p className="text-sm text-muted-foreground">{t("illustration.saveArticleFirst")}</p> : loading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderIcon className="h-4 w-4 animate-spin" />{t("illustration.loading")}</div>
        ) : (
          <>
            {error && <Alert variant="destructive" className="mb-5"><AlertDescription className="flex items-center justify-between gap-3">{t("illustration.error")}<Button variant="outline" size="sm" onClick={() => setReload((n) => n + 1)} disabled={saving}>{t("common.refresh")}</Button></AlertDescription></Alert>}
            {catalog && state && style && palette && (
              <div className="grid gap-8 md:grid-cols-[1fr_1fr]">
                <section className="min-w-0 space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium">{t("illustration.design")}</h3>
                    {bound && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><LockKeyholeIcon className="h-3.5 w-3.5" />{t("illustration.locked")}</span>}
                  </div>
                  {bound ? (
                    <div className="space-y-2"><p className="text-xl font-semibold">{style.name[language]} · {family?.name[language]}</p><p className="text-sm leading-6 text-muted-foreground">{style.description[language]}</p><p className="text-xs leading-5 text-muted-foreground">{t("illustration.lockedHint")}</p></div>
                  ) : (
                    <fieldset disabled={saving} className="space-y-1">
                      <legend className="sr-only">{t("illustration.design")}</legend>
                      {catalog.styles.map((item) => (
                        <label key={item.id} className={cn("flex cursor-pointer items-start gap-3 rounded-md px-3 py-2.5 transition-colors motion-reduce:transition-none", styleId === item.id ? "bg-muted" : "hover:bg-muted/50")}>
                          <input type="radio" name="illustration-style" className="mt-1 accent-[var(--jw-accent)]" checked={styleId === item.id}
                            onChange={() => { setStyleId(item.id); setConfirmed(false) }} />
                          <span><span className="text-sm font-medium">{item.name[language]}</span><span className="ml-2 text-xs text-muted-foreground">{t(`illustration.scenes.${item.recommended_scene}`)}</span><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{item.description[language]}</span></span>
                        </label>
                      ))}
                    </fieldset>
                  )}
                  {!bound && <fieldset disabled={saving}><legend className="mb-3 text-sm font-medium">{t("illustration.color")}</legend><div className="flex flex-wrap gap-3">
                    {catalog.color_families.map((item) => {
                      const swatch = catalog.palettes.filter((p) => p.style_id === styleId && p.color_family_id === item.id).sort((a, b) => b.version - a.version)[0]
                      return <label key={item.id} className="flex cursor-pointer flex-col items-center gap-1.5 text-xs">
                        <input type="radio" name="illustration-color" className="peer sr-only" checked={familyId === item.id} onChange={() => { setFamilyId(item.id); setConfirmed(false) }} />
                        <span className="flex h-9 w-9 items-center justify-center rounded-full ring-offset-background peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2" style={{ backgroundColor: swatch?.primary, color: swatch?.on_primary }}>{familyId === item.id && <CheckIcon className="h-4 w-4" />}</span>{item.name[language]}
                      </label>
                    })}
                  </div></fieldset>}
                </section>
                <section className="min-w-0 space-y-5">
                  {!bound ? <><div className="flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-lg p-7 transition-colors duration-200 motion-reduce:transition-none" style={{ backgroundColor: palette.background, color: palette.text }}>
                    <span className="text-xs" style={{ color: palette.muted_text }}>{t("illustration.palettePreview")}</span>
                    <div><div className="mb-5 h-1 w-12" style={{ backgroundColor: palette.secondary }} /><p className="line-clamp-3 break-words text-2xl font-semibold leading-snug" style={{ color: palette.primary }}>{articleTitle || t("illustration.previewTitle")}</p><p className="mt-3 text-sm" style={{ color: palette.muted_text }}>{style.name[language]} · {family?.name[language]}</p></div>
                    <div className="flex gap-2" aria-hidden="true">{palette.chart.map((color, index) => <span key={index} className="h-3 flex-1 rounded-sm" style={{ backgroundColor: color }} />)}</div>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">{t("illustration.previewHint")}</p></> : <div className="flex items-center gap-2 pt-2" aria-label={t("illustration.palettePreview")}>{[palette.primary, palette.secondary, palette.background, palette.text].map((color, index) => <span key={index} className="h-7 w-7 rounded-full border" style={{ backgroundColor: color }} />)}</div>}
                  {!bound ? <div className="space-y-4 border-t pt-4">
                    <label className="flex items-start gap-2 text-sm leading-6"><input type="checkbox" className="mt-1.5" checked={confirmed} disabled={saving} onChange={(event) => setConfirmed(event.target.checked)} />{t("illustration.confirmLock")}</label>
                    <Button className="w-full" disabled={!confirmed || saving} onClick={() => void save()}>{saving && <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />}{t("illustration.bind")}</Button>
                  </div> : <div className="space-y-3 border-t pt-4" role="status" aria-live="polite">
                    <p className="flex items-center gap-2 text-sm">{status === "ready" ? <CheckIcon className="h-4 w-4" /> : status !== "failed" ? <LoaderIcon className="h-4 w-4 animate-spin" /> : null}{t(`illustration.status.${status ?? "pending"}`)}</p>
                    {status === "failed" && <Button variant="outline" disabled={saving} onClick={() => void save(true)}>{t("illustration.retry")}</Button>}
                  </div>}
                </section>
              </div>
            )}
            {state && <section className="mt-8 border-t pt-5">
              <div className="flex gap-5" role="group" aria-label={t("illustration.kindLabel")}>{KINDS.map((item) => <button key={item} type="button" aria-pressed={kind === item} onClick={() => setKind(item)} className={cn("border-b-2 pb-2 text-sm transition-colors motion-reduce:transition-none", kind === item ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>{t(`illustration.kinds.${item}.name`)}</button>)}</div>
              <p className="mt-4 text-sm text-muted-foreground">{t(`illustration.kinds.${kind}.description`)}</p>
              {kind === "cover" && articleId ? <CoverPanel articleId={articleId} ready={status === "ready"} /> : <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{t("illustration.notAvailable")}</p><Button disabled variant="outline">{t("illustration.generateLater")}</Button></div>}
            </section>}
          </>
        )}
      </div>
    </AIFeatureDialogShell>
  )
}
