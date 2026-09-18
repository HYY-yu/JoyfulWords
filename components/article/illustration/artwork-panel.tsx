"use client"
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react"
import { LoaderIcon, FileTextIcon, MousePointer2Icon, LayoutTemplateIcon, WandSparklesIcon, Maximize2Icon } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/base/dialog"
import { ScrollArea } from "@/components/ui/base/scroll-area"
import { cn } from "@/lib/utils"
import { artworkCards, isArtworkPending } from "@/lib/api/illustrations/artwork-state"
import { Button } from "@/components/ui/base/button"
import { Alert, AlertDescription } from "@/components/ui/base/alert"
import { CoverPreview } from "./cover-preview"
import { Textarea } from "@/components/ui/base/textarea"
import { notifyTaskCenterTaskSubmitted } from "@/lib/taskcenter/task-events"
import { illustrationsClient } from "@/lib/api/illustrations/client"
import type { ArtworkOptions, ArtworkRequest, ArtworkRecord } from "@/lib/api/illustrations/types"
import { useTranslation } from "@/lib/i18n/i18n-context"

export function ArtworkPanel({ articleId, ready, selectedText }: { articleId: number; ready: boolean; selectedText: string }) {
  const { t } = useTranslation()
  const [options, setOptions] = useState<ArtworkOptions | null>(null)
  const [items, setItems] = useState<ArtworkRecord[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [source, setSource] = useState<ArtworkRequest["source"]>(selectedText ? "selection" : "article")
  const [text, setText] = useState(selectedText)
  const [orientation, setOrientation] = useState<ArtworkRequest["orientation"]>("square")
  const [maxCount, setMaxCount] = useState(5)
  const [preview, setPreview] = useState<ArtworkRecord | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const submission = useRef<{ signature: string; key: string } | null>(null)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const active = items.find((item) => item.id === selected) ?? items[0]
  const pending = items.some(isArtworkPending)


  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    Promise.all([illustrationsClient.artworkOptions(controller.signal), illustrationsClient.artworks(articleId, controller.signal)])
      .then(([opts, list]) => {
        if (controller.signal.aborted) return
        if ("error" in opts || "error" in list) throw new Error("Artwork list unavailable")
        setOptions(opts); setItems(list.items); setError(null)
        if (!selectedText && list.items[0]) {
          const latest = list.items[0]
          setMaxCount(latest.max_count || 1); setSource(latest.source); setText(latest.source_text); setOrientation(latest.orientation)
        }

      }).catch((cause) => {
        if (controller.signal.aborted) return
        console.error("[Illustrations] Artwork loading failed", { articleId, cause })
        setError("illustration.artwork.loadFailed")
      }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [articleId, reload, selectedText])

  useEffect(() => {
    if (!pending) return
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    let failures = 0
    const poll = async () => {
      try {
        const list = await illustrationsClient.artworks(articleId, controller.signal)
        if (controller.signal.aborted) return
        if ("error" in list) throw new Error("Artwork status unavailable")
        setItems(list.items); failures = 0
        timer = setTimeout(poll, 3000)
      } catch (cause) {
        if (controller.signal.aborted) return
        console.warn("[Illustrations] Artwork polling failed", { articleId, cause })
        if (++failures < 3) timer = setTimeout(poll, 5000)
        else setError("illustration.artwork.loadFailed")
      }
    }
    timer = setTimeout(poll, 1500)
    return () => { controller.abort(); clearTimeout(timer) }
  }, [articleId, pending, reload])

  const generate = useCallback(async () => {
    if (busy || pending || !ready || !options?.enabled) return
    const signature = JSON.stringify([articleId, source, text, orientation, source === "article" ? maxCount : 1])
    if (submission.current?.signature !== signature) submission.current = { signature, key: crypto.randomUUID() }
    setBusy(true); setError(null)
    try {
      const result = await illustrationsClient.createArtwork(articleId, {
        idempotency_key: submission.current.key, max_count: source === "article" ? maxCount : 1, source, text: source === "selection" ? text : "", orientation,
      })
      if (!alive.current) return
      if ("error" in result) throw new Error(result.error)
      notifyTaskCenterTaskSubmitted({ type: "illustration_artwork", taskId: result.id, articleId })
      submission.current = null
      setItems((previous) => [result, ...previous.filter((item) => item.id !== result.id)])
      setSelected(result.id)
    } catch (cause) {
      console.error("[Illustrations] Artwork submission failed", { articleId, cause })
      if (alive.current) setError("illustration.artwork.submitFailed")
    } finally { if (alive.current) setBusy(false) }
  }, [articleId, busy, pending, options, source, text, orientation, maxCount, ready])

  const cards = artworkCards(active)
  const completed = cards.filter((card) => card.status === "succeeded").length
  const failed = cards.filter((card) => card.status === "failed").length
  const invalidSelection = source === "selection" && (!text.trim() || Array.from(text).length > 20000)
  const sectionClass = "overflow-hidden rounded-xl border bg-background shadow-sm"
  const headerClass = "flex items-center gap-2 border-b bg-muted/25 px-4 py-3 text-sm font-semibold"
  const segmentClass = "h-9 min-w-0 rounded-md px-2 text-xs font-medium transition-colors sm:text-[13px]"

  if (loading) return <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><LoaderIcon className="h-4 w-4 animate-spin" />{t("illustration.loading")}</p>
  return <>
    <div className="mt-4 grid min-w-0 grid-cols-1 min-h-[480px] gap-0 overflow-hidden rounded-xl border lg:h-[min(680px,65vh)] lg:grid-cols-[minmax(400px,0.86fr)_minmax(420px,1fr)]">
      <ScrollArea className="min-w-0 min-h-0 border-b bg-background lg:border-r lg:border-b-0">
        <fieldset disabled={busy} className="min-w-0 space-y-3.5 p-4 xl:p-5">
          <legend className="sr-only">{t("illustration.artwork.generate")}</legend>
          <section className={sectionClass}>
            <div className={headerClass}><span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] text-primary">1</span><FileTextIcon className="h-4 w-4 text-primary" />{t("infographicDialog.sourceLabel")}</div>
            <div className="space-y-3 p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {(["selection", "article"] as const).map((value) => <button key={value} type="button" aria-pressed={source === value} onClick={() => setSource(value)} className={cn("flex min-h-20 items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors", source === value ? "border-primary/50 bg-primary/5" : "border-border bg-muted/15 hover:bg-muted/35")}>
                  {value === "article" ? <FileTextIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : <MousePointer2Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
                  <span><span className="block text-sm font-semibold">{t(`illustration.artwork.sources.${value}`)}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{t(value === "article" ? "illustration.artwork.articleHint" : "illustration.artwork.selectionHint")}</span></span>
                </button>)}
              </div>
              {source === "article" ? <div className="rounded-lg border bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold">{t("infographicDialog.maxImagesLabel")}</span><span className="text-xs text-muted-foreground">{t("infographicDialog.maxImagesValue", { count: maxCount })}</span></div>
                <div className="mt-3 grid grid-cols-5 rounded-lg border border-border/70 bg-background p-1" role="group" aria-label={t("infographicDialog.maxImagesLabel")}>
                  {[1, 2, 3, 4, 5].map((value) => <button type="button" aria-pressed={maxCount === value} key={value} onClick={() => setMaxCount(value)} className={cn(segmentClass, maxCount === value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{value}</button>)}
                </div>
              </div> : <div>
                <div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>{t("infographicDialog.selectedTextLabel")}</span><span className={cn(invalidSelection && "text-destructive")}>{Array.from(text).length} / 20,000</span></div>
                <Textarea aria-label={t("illustration.artwork.sourceText")} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("illustration.artwork.sourceText")} className="h-32 min-h-32 resize-none overflow-y-auto border-border/70 bg-background text-sm leading-relaxed shadow-none [field-sizing:fixed]" />
              </div>}
            </div>
          </section>
          <section className={sectionClass}>
            <div className={headerClass}><span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] text-primary">2</span>{t("infographicDialog.orientationLabel")}</div>
            <div className="p-3">
              <div className="space-y-2"><span className="flex items-center gap-2 text-sm font-semibold"><LayoutTemplateIcon className="h-4 w-4 text-primary" />{t("illustration.artwork.orientation")}</span><div className="grid grid-cols-3 rounded-lg border border-border/70 bg-muted/20 p-1" role="group" aria-label={t("illustration.artwork.orientation")}>
                {(["square", "landscape", "portrait"] as const).map((value) => <button type="button" aria-pressed={orientation === value} key={value} onClick={() => setOrientation(value)} className={cn(segmentClass, orientation === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{t(`illustration.artwork.orientations.${value}`)}</button>)}
              </div></div>

            </div>
          </section>
          {options && !options.enabled && <p className="text-sm text-muted-foreground">{t("illustration.artwork.unavailable")}</p>}
        </fieldset>
      </ScrollArea>
      <div className="flex min-w-0 min-h-0 flex-col bg-muted/20">
        <div className="shrink-0 border-b bg-background/80 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-semibold">{t("infographicDialog.resultTitle")}</h3><p className="mt-1 text-xs text-muted-foreground">{t("illustration.artwork.priceHint", { price: options?.credits ?? 0, total: (options?.credits ?? 0) * (source === "article" ? maxCount : 1) })}</p></div>
            <Button disabled={busy || pending || !ready || !options?.enabled || invalidSelection} onClick={() => void generate()}>{busy || pending ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <WandSparklesIcon className="h-4 w-4" />}{t(source === "article" ? "infographicDialog.generateFromArticle" : "illustration.artwork.generate")}</Button>
          </div>
          {items.length > 0 && <label className="mt-3 flex items-center gap-2 text-xs"><span>{t("illustration.artwork.history")}</span><select aria-label={t("illustration.artwork.history")} className="min-w-0 flex-1 rounded-lg border bg-background p-2" value={active?.id} onChange={(e) => {
            const version = items.find((item) => item.id === Number(e.target.value)); if (!version) return
            setSelected(version.id); setSource(version.source); setText(version.source_text); setOrientation(version.orientation); setMaxCount(version.max_count || 1)
          }}>{items.map((item) => <option key={item.id} value={item.id}>#{item.id} · {t(`illustration.artwork.status.${item.status}`)}</option>)}</select></label>}
          {active && isArtworkPending(active) && <div role="status" className="mt-3 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary"><LoaderIcon className="h-4 w-4 animate-spin" />{t(active.is_batch && cards.length === 0 ? "illustration.artwork.analyzing" : "illustration.artwork.progress", { completed, failed, total: cards.length })}</div>}
        </div>
        <ScrollArea className="min-w-0 min-h-0 flex-1"><div className="space-y-4 p-5">
          {error && <Alert variant="destructive"><AlertDescription>{t(error)}<Button variant="outline" size="sm" className="ml-2" onClick={() => setReload((n) => n + 1)}>{t("common.refresh")}</Button></AlertDescription></Alert>}
          {active?.status === "failed" && <Alert variant="destructive"><AlertDescription>{t(active.error_code === "illustration_artwork_analysis_failed" ? "illustration.artwork.analysisFailed" : active.error_code === "illustration_submission_uncertain" ? "illustration.artwork.uncertain" : "illustration.artwork.failed")}</AlertDescription></Alert>}
          {active?.status === "partial" && <Alert><AlertDescription>{t("illustration.artwork.partial", { completed, failed })}</AlertDescription></Alert>}
          {active?.status === "empty" && <p className="py-12 text-center text-sm text-muted-foreground">{t("illustration.artwork.noCards")}</p>}
          {!active && <div className="flex min-h-72 flex-col items-center justify-center gap-4 text-center text-muted-foreground"><LayoutTemplateIcon className="h-12 w-12 opacity-30" /><p className="max-w-xs text-sm leading-6">{t("illustration.artwork.empty")}</p></div>}
          <div className={cn("grid gap-4", cards.length > 1 ? "sm:grid-cols-2" : "mx-auto max-w-md grid-cols-1")}>
            {cards.map((card, index) => <article key={card.id} className="min-w-0 space-y-3 rounded-xl border bg-background p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2"><h4 className="text-sm font-semibold">{card.card?.name || `#${card.id}`}</h4><span className="shrink-0 text-xs text-muted-foreground">{index + 1} / {cards.length}</span></div>
              {card.result ? <><CoverPreview articleId={articleId} source={card.result.image_url} width={card.result.width} height={card.result.height} title={card.card?.name || card.title} filename={`artwork-${card.id}.png`} /><Button variant="ghost" size="sm" onClick={() => setPreview(card)}><Maximize2Icon className="h-3.5 w-3.5" />{t("illustration.artwork.enlarge")}</Button></> : <div className="flex min-h-36 items-center justify-center gap-2 rounded-lg bg-muted/30 text-xs text-muted-foreground">{isArtworkPending(card) && <LoaderIcon className="h-4 w-4 animate-spin" />}{t(card.status === "failed" ? (card.error_code === "illustration_submission_uncertain" ? "illustration.artwork.uncertain" : "illustration.artwork.failed") : `illustration.artwork.status.${card.status}`)}</div>}
              {card.card && <details className="text-xs text-muted-foreground"><summary className="cursor-pointer">{t("illustration.artwork.cardEvidence")}</summary>{card.card.subjects?.length ? <p className="mt-2 font-medium">{t("illustration.artwork.subjects")}{card.card.subjects.map((subject) => subject.source_term).join(" / ")}</p> : null}<p className="mt-2 whitespace-pre-wrap leading-5">{card.card.article_excerpt}</p><p className="mt-2 leading-5">{card.card.selection_reason}</p></details>}
            </article>)}
          </div>
        </div></ScrollArea>
      </div>
    </div>
    <Dialog open={!!preview} onOpenChange={(open) => { if (!open) setPreview(null) }}><DialogContent className="max-h-[90vh] overflow-auto sm:max-w-3xl"><DialogTitle>{preview?.card?.name || t("infographicDialog.resultTitle")}</DialogTitle>{preview?.result && <CoverPreview articleId={articleId} source={preview.result.image_url} width={preview.result.width} height={preview.result.height} title={preview.card?.name || preview.title} filename={`artwork-${preview.id}.png`} />}</DialogContent></Dialog>
  </>
}
