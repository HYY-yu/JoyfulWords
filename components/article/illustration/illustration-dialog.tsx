"use client"

import { useEffect, useState } from "react"
import { ImageIcon, LoaderIcon } from "lucide-react"
import { AIFeatureDialogShell } from "@/components/ui/ai/ai-feature-dialog-shell"
import { Button } from "@/components/ui/base/button"
import { Alert, AlertDescription } from "@/components/ui/base/alert"
import { illustrationsClient } from "@/lib/api/illustrations/client"
import type { ArticleDesignState } from "@/lib/api/illustrations/types"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { ArtworkPanel } from "./artwork-panel"
import { InfographicPanel } from "./infographic-panel"
import { CoverPanel } from "./cover-panel"
import { DESIGN_CHANGED } from "./design-style-picker"
import { cn } from "@/lib/utils"

type ImageKind = "cover" | "infographic" | "decorative"
const KINDS: ImageKind[] = ["cover", "infographic", "decorative"]

export function IllustrationDialog({ open, onOpenChange, articleId, selectedText = "" }: {
  open: boolean; onOpenChange: (open: boolean) => void; articleId?: number | null; articleTitle: string; selectedText?: string
}) {
  const { t } = useTranslation()
  const [state, setState] = useState<ArticleDesignState | null>(null)
  const [kind, setKind] = useState<ImageKind>("cover")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!open || !articleId) return
    const controller = new AbortController()
    setLoading(true)
    setError(false)
    setState(null)
    illustrationsClient.design(articleId, controller.signal)
      .then((nextState) => {
        if (controller.signal.aborted) return
        if ("error" in nextState) throw new Error("Illustration design load failed")
        setState(nextState)
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

  useEffect(() => {
    const refresh = () => setReload((n) => n + 1)
    window.addEventListener(DESIGN_CHANGED, refresh)
    return () => { window.removeEventListener(DESIGN_CHANGED, refresh) }
  }, [])

  async function retry() {
    if (!articleId || saving) return
    setSaving(true); setError(false)
    try {
      const result = await illustrationsClient.retry(articleId)
      if ("error" in result) throw new Error(result.error)
      setState(result)
    } catch (cause) { console.error("[Illustrations] Preparation retry failed", { articleId, cause }); setError(true) }
    finally { setSaving(false) }
  }

  return (
    <AIFeatureDialogShell open={open} onOpenChange={(value) => { if (!saving) onOpenChange(value) }}
      title={t("illustration.title")} description={<span className="sr-only">{t("illustration.description")}</span>} size="large"
      contentClassName="sm:max-w-[1200px] lg:max-w-[1200px] xl:max-w-[1320px]"
      icon={<ImageIcon className="h-5 w-5 text-primary" />}>
      <div className="overflow-y-auto p-5 sm:p-7">
        {!articleId ? <p className="text-sm text-muted-foreground">{t("illustration.saveArticleFirst")}</p> : loading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderIcon className="h-4 w-4 animate-spin" />{t("illustration.loading")}</div>
        ) : (
          <>
            {error && <Alert variant="destructive" className="mb-5"><AlertDescription className="flex items-center justify-between gap-3">{t("illustration.error")}<Button variant="outline" size="sm" onClick={() => setReload((n) => n + 1)} disabled={saving}>{t("common.refresh")}</Button></AlertDescription></Alert>}
            {state && !state.binding && <p className="mb-4 text-sm text-muted-foreground">{t("illustration.chooseStyle")}</p>}
            {state?.binding && status !== "ready" && <div role="status" className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">{t(`illustration.status.${status ?? "pending"}`)}{status === "failed" && <Button size="sm" variant="outline" disabled={saving} onClick={() => void retry()}>{t("illustration.retry")}</Button>}</div>}
            {state && <section>
              <div className="flex gap-5" role="group" aria-label={t("illustration.kindLabel")}>{KINDS.map((item) => <button key={item} type="button" aria-pressed={kind === item} onClick={() => setKind(item)} className={cn("border-b-2 pb-2 text-sm transition-colors motion-reduce:transition-none", kind === item ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>{t(`illustration.kinds.${item}.name`)}</button>)}</div>
              {kind === "cover" && articleId ? <CoverPanel key={articleId} articleId={articleId} ready={status === "ready"} /> : kind === "infographic" && articleId ? <InfographicPanel key={articleId} articleId={articleId} ready={status === "ready"} selectedText={selectedText} /> : kind === "decorative" && articleId ? <ArtworkPanel key={articleId} articleId={articleId} ready={status === "ready"} selectedText={selectedText} /> : <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{t("illustration.notAvailable")}</p><Button disabled variant="outline">{t("illustration.generateLater")}</Button></div>}
            </section>}
          </>
        )}
      </div>
    </AIFeatureDialogShell>
  )
}
