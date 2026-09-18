"use client"
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react"
import { LoaderIcon, ImageIcon, WandSparklesIcon } from "lucide-react"
import { Button } from "@/components/ui/base/button"
import { Alert, AlertDescription } from "@/components/ui/base/alert"
import { ScrollArea } from "@/components/ui/base/scroll-area"
import { cn } from "@/lib/utils"
import { CoverPreview } from "./cover-preview"
import { notifyTaskCenterTaskSubmitted } from "@/lib/taskcenter/task-events"
import { illustrationsClient } from "@/lib/api/illustrations/client"
import type { CoverOptions, CoverPosition, CoverRecord } from "@/lib/api/illustrations/types"
import { useTranslation } from "@/lib/i18n/i18n-context"

export function CoverPanel({ articleId, ready }: { articleId: number; ready: boolean }) {
  const { t } = useTranslation()
  const [options, setOptions] = useState<CoverOptions | null>(null)
  const [items, setItems] = useState<CoverRecord[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [position, setPosition] = useState<CoverPosition>("center")
  const [preset, setPreset] = useState("blog")
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const submission = useRef<{ signature: string; key: string } | null>(null)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const active = items.find((item) => item.id === selected) ?? items[0]
  const pending = items.some((item) => !["succeeded", "failed"].includes(item.status))
  const output = options?.presets.find((item) => item.id === preset)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    Promise.all([illustrationsClient.coverOptions(controller.signal), illustrationsClient.covers(articleId, controller.signal)])
      .then(([opts, list]) => {
        if (controller.signal.aborted) return
        if ("error" in opts || "error" in list) throw new Error("Cover list unavailable")
        setOptions(opts); setItems(list.items); setError(null)
        setPreset(list.items[0]?.output_preset || "blog")
      }).catch((cause) => {
        if (controller.signal.aborted) return
        console.error("[Illustrations] Cover loading failed", { articleId, cause })
        setError("illustration.cover.loadFailed")
      }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [articleId, reload])

  useEffect(() => {
    if (!pending) return
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    let failures = 0
    const poll = async () => {
      try {
        const list = await illustrationsClient.covers(articleId, controller.signal)
        if (controller.signal.aborted) return
        if ("error" in list) throw new Error("Cover status unavailable")
        setItems(list.items); failures = 0
        timer = setTimeout(poll, 3000)
      } catch (cause) {
        if (controller.signal.aborted) return
        console.warn("[Illustrations] Cover polling failed", { articleId, cause })
        if (++failures < 3) timer = setTimeout(poll, 5000)
        else setError("illustration.cover.loadFailed")
      }
    }
    timer = setTimeout(poll, 1500)
    return () => { controller.abort(); clearTimeout(timer) }
  }, [articleId, pending, reload])

  const generate = useCallback(async () => {
    if (busy || pending || !ready || !options?.enabled) return
    const signature = JSON.stringify([articleId, position, preset])
    if (submission.current?.signature !== signature) submission.current = { signature, key: crypto.randomUUID() }
    setBusy(true); setError(null)
    try {
      const result = await illustrationsClient.createCover(articleId, {
        idempotency_key: submission.current.key, title_position: position,
        output_preset: preset,
      })
      if (!alive.current) return
      if ("error" in result) throw new Error(result.error)
      notifyTaskCenterTaskSubmitted({ type: "illustration_cover", taskId: result.id, articleId })
      submission.current = null
      setItems((previous) => [result, ...previous.filter((item) => item.id !== result.id)])
      setSelected(result.id)
    } catch (cause) {
      console.error("[Illustrations] Cover submission failed", { articleId, cause })
      if (alive.current) setError("illustration.cover.submitFailed")
    } finally { if (alive.current) setBusy(false) }
  }, [articleId, busy, pending, options, position, preset, ready])

  if (loading) return <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><LoaderIcon className="h-4 w-4 animate-spin" />{t("illustration.loading")}</p>
  return <div className="mt-4 grid min-w-0 grid-cols-1 min-h-[480px] overflow-hidden rounded-xl border lg:h-[min(680px,65vh)] lg:grid-cols-[minmax(400px,0.86fr)_minmax(420px,1fr)]">
    <ScrollArea className="min-w-0 min-h-0 border-b bg-background lg:border-r lg:border-b-0">
      <fieldset disabled={busy || pending} className="min-w-0 space-y-6 p-4 xl:p-5">
        <legend className="sr-only">{t("illustration.cover.generate")}</legend>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{t("illustration.cover.size")}</h3>
          <div className="grid grid-cols-2 gap-2">{options?.presets.map((value) => <button type="button" key={value.id} aria-pressed={preset === value.id} onClick={() => setPreset(value.id)} className={cn("flex min-h-24 flex-col items-start justify-between rounded-lg border p-3 text-left transition-colors motion-reduce:transition-none", preset === value.id ? "border-primary/50 bg-primary/5" : "hover:bg-muted/40")}>
            <span className="mb-3 block h-5 rounded-sm border-2" aria-hidden="true" style={{ aspectRatio: `${value.width}/${value.height}` }} />
            <span className="text-sm font-medium">{t(`illustration.cover.presets.${value.id}`)}</span><span className="mt-1 text-xs text-muted-foreground">{value.width} × {value.height}</span>
          </button>)}</div>
        </section>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{t("illustration.cover.position")}</h3>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label={t("illustration.cover.position")}>{(["top", "center", "bottom"] as const).map((value) => <button type="button" key={value} aria-pressed={position === value} onClick={() => setPosition(value)} className={cn("rounded-lg border p-3 text-xs transition-colors motion-reduce:transition-none", position === value ? "border-primary/50 bg-primary/5 text-primary" : "hover:bg-muted/40")}>
            <span aria-hidden="true" className={cn("mx-auto mb-2 flex h-12 w-16 flex-col rounded border bg-background px-2 py-2", value === "top" ? "justify-start" : value === "bottom" ? "justify-end" : "justify-center")}><span className="h-1 w-full rounded bg-current opacity-60" /><span className="mt-1 h-1 w-2/3 rounded bg-current opacity-30" /></span>{t(`illustration.cover.positions.${value}`)}
          </button>)}</div>
        </section>
        <p className="text-xs text-muted-foreground">{t("illustration.savedContent")}</p>
        {options && !options.enabled && <p className="text-sm text-muted-foreground">{t("illustration.cover.unavailable")}</p>}
      </fieldset>
    </ScrollArea>
    <div className="flex min-w-0 min-h-0 flex-col bg-muted/20">
      <div className="shrink-0 border-b bg-background/80 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">{t("infographicDialog.resultTitle")}</h3><p className="mt-1 text-xs text-muted-foreground">{options?.credits ?? 0} {t("illustration.cover.credits")}</p></div>
          <Button disabled={busy || pending || !ready || !options?.enabled} onClick={() => void generate()}>{busy || pending ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <WandSparklesIcon className="h-4 w-4" />}{t(active ? "illustration.cover.regenerate" : "illustration.cover.generate")}</Button>
        </div>
        {items.length > 0 && <label className="mt-3 flex items-center gap-2 text-xs"><span>{t("illustration.cover.history")}</span><select aria-label={t("illustration.cover.history")} className="min-w-0 flex-1 rounded-lg border bg-background p-2" value={active?.id} onChange={(e) => {
          const id = Number(e.target.value); setSelected(id)
          const version = items.find((item) => item.id === id)
          if (version) { setPreset(version.output_preset); setPosition(version.title_position) }
        }}>{items.map((item) => <option key={item.id} value={item.id}>#{item.id} · {t(`illustration.cover.status.${item.status}`)}</option>)}</select></label>}
      </div>
      <ScrollArea className="min-w-0 min-h-0 flex-1"><div className="space-y-4 p-5">
        {error && <Alert variant="destructive"><AlertDescription className="flex items-center justify-between gap-3">{t(error)}<Button variant="outline" size="sm" onClick={() => setReload((n) => n+1)}>{t("common.refresh")}</Button></AlertDescription></Alert>}
        {active && !["succeeded", "failed"].includes(active.status) && <div role="status" className="flex min-h-72 items-center justify-center gap-2 text-sm"><LoaderIcon className="h-4 w-4 animate-spin" />{t("illustration.cover.processing")}</div>}
        {active?.status === "failed" && <Alert variant="destructive"><AlertDescription>{t(active.error_code === "illustration_submission_uncertain" ? "illustration.cover.uncertain" : "illustration.cover.failed")}</AlertDescription></Alert>}
        {active?.result && output && <>
          <CoverPreview articleId={articleId} source={active.result.image_url} width={output.width} height={output.height} title={active.title} filename={`cover-${active.id}-${preset}.png`} />
          {preset !== active.output_preset && <p className="text-xs text-muted-foreground">{t("illustration.cover.resizeHint")}</p>}
        </>}
        {!active && <div className="flex min-h-72 flex-col items-center justify-center gap-4 text-center text-muted-foreground"><ImageIcon className="h-12 w-12 opacity-30" /><p className="text-sm">{t("illustration.cover.empty")}</p></div>}
      </div></ScrollArea>
    </div>
  </div>
}
