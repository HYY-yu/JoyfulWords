"use client"
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react"
import { LoaderIcon } from "lucide-react"
import { Button } from "@/components/ui/base/button"
import { Alert, AlertDescription } from "@/components/ui/base/alert"
import { CoverPreview } from "./cover-preview"
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
      submission.current = null
      setItems((previous) => [result, ...previous.filter((item) => item.id !== result.id)])
      setSelected(result.id)
    } catch (cause) {
      console.error("[Illustrations] Cover submission failed", { articleId, cause })
      if (alive.current) setError("illustration.cover.submitFailed")
    } finally { if (alive.current) setBusy(false) }
  }, [articleId, busy, pending, options, position, preset, ready])

  if (loading) return <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><LoaderIcon className="h-4 w-4 animate-spin" />{t("illustration.loading")}</p>
  return <div className="mt-5 space-y-5">
    {error && <Alert variant="destructive"><AlertDescription className="flex items-center justify-between gap-3">{t(error)}<Button variant="outline" size="sm" onClick={() => setReload((n) => n + 1)}>{t("common.refresh")}</Button></AlertDescription></Alert>}
    <div className="flex flex-wrap items-end gap-4">
      <label className="space-y-2 text-sm"><span className="block">{t("illustration.cover.position")}</span><select aria-label={t("illustration.cover.position")} className="h-9 rounded-md border bg-background px-3" value={position} disabled={busy} onChange={(e) => setPosition(e.target.value as CoverPosition)}>
        {(["center", "top", "bottom"] as const).map((value) => <option key={value} value={value}>{t(`illustration.cover.positions.${value}`)}</option>)}
      </select></label>
      <label className="space-y-2 text-sm"><span className="block">{t("illustration.cover.size")}</span><select aria-label={t("illustration.cover.size")} className="h-9 rounded-md border bg-background px-3" value={preset} disabled={busy} onChange={(e) => setPreset(e.target.value)}>
        {options?.presets.map((value) => <option key={value.id} value={value.id}>{t(`illustration.cover.presets.${value.id}`)} · {value.width} × {value.height}</option>)}
      </select></label>
      <Button disabled={busy || pending || !ready || !options?.enabled} onClick={() => void generate()}>{busy && <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />}{t(active ? "illustration.cover.regenerate" : "illustration.cover.generate")} · {options?.credits ?? 0} {t("illustration.cover.credits")}</Button>
    </div>
    <p className="text-xs leading-5 text-muted-foreground">{t("illustration.cover.hint")}</p>
    {!ready && <p className="text-sm text-muted-foreground">{t("illustration.cover.bindFirst")}</p>}
    {options && !options.enabled && <p className="text-sm text-muted-foreground">{t("illustration.cover.unavailable")}</p>}
    {items.length > 0 && <label className="flex flex-wrap items-center gap-3 text-sm"><span>{t("illustration.cover.history")}</span><select aria-label={t("illustration.cover.history")} className="max-w-full rounded-md border bg-background p-2" value={active?.id} onChange={(e) => {
      const id = Number(e.target.value)
      setSelected(id)
      const version = items.find((item) => item.id === id)
      if (version) { setPreset(version.output_preset); setPosition(version.title_position) }
    }}>
      {items.map((item) => <option key={item.id} value={item.id}>#{item.id} · {t(`illustration.cover.status.${item.status}`)}</option>)}
    </select></label>}
    {active && !["succeeded", "failed"].includes(active.status) && <div role="status" className="flex min-h-48 items-center justify-center gap-2 rounded-md bg-muted/40 text-sm"><LoaderIcon className="h-4 w-4 animate-spin" />{t("illustration.cover.processing")}</div>}
    {active?.status === "failed" && <Alert variant="destructive"><AlertDescription>{t(active.error_code === "illustration_submission_uncertain" ? "illustration.cover.uncertain" : "illustration.cover.failed")}</AlertDescription></Alert>}
    {active?.result && output && <>
      <CoverPreview source={active.result.image_url} width={output.width} height={output.height} title={active.title} filename={`cover-${active.id}-${preset}.png`} />
      <p className="text-xs text-muted-foreground">{t("illustration.cover.generatedPosition")}: {t(`illustration.cover.positions.${active.title_position}`)} · {t("illustration.cover.generatedSize")}: {t(`illustration.cover.presets.${active.output_preset}`)}</p>
      {preset !== active.output_preset && <p className="text-xs text-muted-foreground">{t("illustration.cover.resizeHint")}</p>}
    </>}
    {!active && <p className="py-5 text-sm text-muted-foreground">{t("illustration.cover.empty")}</p>}
  </div>
}
