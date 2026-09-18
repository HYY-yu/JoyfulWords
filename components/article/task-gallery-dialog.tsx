"use client"
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, type ReactNode } from "react"
import { DownloadIcon, ImagesIcon, LoaderIcon, FolderPlusIcon, CheckIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/base/dialog"
import { Button } from "@/components/ui/base/button"
import { JoyChartRenderer, type JoyChartRendererHandle } from "@/components/editor/joy-chart-renderer"
import { materialsClient } from "@/lib/api/materials/client"
import { uploadImageToR2 } from "@/lib/tiptap-image-upload"
import { centerCrop } from "@/lib/api/illustrations/crop-geometry"
import { GalleryChartPreview } from "./gallery-chart-preview"
import { CoverPreview } from "./illustration/cover-preview"
import { taskCenterClient } from "@/lib/api/taskcenter/client"
import { parseTaskCenterImageUrls, type TaskGalleryItem, type TaskGalleryPage } from "@/lib/api/taskcenter/types"
import { illustrationsClient } from "@/lib/api/illustrations/client"
import type { ArticleDesignState } from "@/lib/api/illustrations/types"
import { useTranslation } from "@/lib/i18n/i18n-context"

type ImageSelection = { item: TaskGalleryItem; source: string; width: number; height: number; index: number }

export function TaskGalleryDialog({ open, onOpenChange, articleId }: {
  open: boolean; onOpenChange: (open: boolean) => void; articleId: number
}) {
  const { t } = useTranslation()
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="flex h-[min(86dvh,900px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[1120px]">
      <DialogHeader className="shrink-0 px-6 pb-4 pt-6 text-left">
        <DialogTitle>{t("taskGallery.title")}</DialogTitle>
      </DialogHeader>
      {open && <GalleryContent key={articleId} articleId={articleId} />}
    </DialogContent>
  </Dialog>
}

function GalleryContent({ articleId }: { articleId: number }) {
  const { t, locale } = useTranslation()
  const [page, setPage] = useState<TaskGalleryPage>({ items: [], has_more: false })
  const [design, setDesign] = useState<ArticleDesignState["binding"]>(null)
  const [designError, setDesignError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)
  const [reload, setReload] = useState(0)
  const [selection, setSelection] = useState<ImageSelection | null>(null)
  const moreRequest = useRef<AbortController | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    moreRequest.current?.abort()
    moreRequest.current = null
    setLoading(true); setLoadingMore(false); setError(false); setDesignError(false)
    Promise.allSettled([
      taskCenterClient.getGallery(articleId, undefined, controller.signal),
      illustrationsClient.design(articleId, controller.signal),
    ]).then(([results, style]) => {
      if (controller.signal.aborted) return
      if (results.status === "fulfilled" && !("error" in results.value)) setPage(results.value)
      else {
        console.error("[TaskGallery] Results unavailable", { articleId, cause: results.status === "rejected" ? results.reason : results.value })
        setError(true)
      }
      if (style.status === "fulfilled" && !("error" in style.value)) setDesign(style.value.binding)
      else {
        console.warn("[TaskGallery] Design unavailable", { articleId, cause: style.status === "rejected" ? style.reason : style.value })
        setDesignError(true)
      }
      setLoading(false)
    })
    return () => { controller.abort(); moreRequest.current?.abort() }
  }, [articleId, reload])

  async function loadMore() {
    if (!page.next_cursor || moreRequest.current) return
    const controller = new AbortController()
    moreRequest.current = controller
    setLoadingMore(true); setError(false)
    try {
      const result = await taskCenterClient.getGallery(articleId, page.next_cursor, controller.signal)
      if (controller.signal.aborted) return
      if ("error" in result) throw new Error(result.error)
      setPage(current => ({ ...result, items: Array.from(new Map([...current.items, ...result.items].map(item => [`${item.type}:${item.id}`, item])).values()) }))
    } catch (cause) {
      if (controller.signal.aborted) return
      console.error("[TaskGallery] More results unavailable", { articleId, cause }); setError(true)
    } finally {
      if (!controller.signal.aborted) { setLoadingMore(false); moreRequest.current = null }
    }
  }

  const snapshot = design?.snapshot
  return <>
    <div className="mx-6 flex shrink-0 flex-wrap items-center justify-center gap-x-8 gap-y-3 border-y py-4">
      <div className="space-y-1"><p className="text-[11px] text-muted-foreground">{t("taskGallery.currentStyle")}</p><p className="text-sm font-medium">{loading ? "—" : snapshot?.style.name[locale] || t(designError ? "taskGallery.designFailed" : "taskGallery.noDesign")}</p></div>
      {snapshot && <div className="space-y-1"><p className="text-[11px] text-muted-foreground">{t("illustration.color")}</p><div className="flex items-center gap-3"><span className="text-sm font-medium">{snapshot.color_family.name[locale]}</span><div className="flex -space-x-1" aria-label={snapshot.color_family.name[locale]}>{[snapshot.palette.primary, snapshot.palette.secondary, snapshot.palette.background, snapshot.palette.text].map((color, i) => <span key={i} title={color} className="h-5 w-5 rounded-full border border-background ring-1 ring-border/40" style={{ backgroundColor: color }} />)}</div></div></div>}
      {designError && <Button variant="ghost" size="sm" onClick={() => setReload(n => n + 1)}>{t("common.refresh")}</Button>}
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6" aria-busy={loading}>
      {loading ? <div role="status" className="flex justify-center py-20"><LoaderIcon className="h-5 w-5 animate-spin" /><span className="sr-only">{t("common.loading")}</span></div> : <>
        {page.items.length > 0 && <ul className="grid grid-cols-1 gap-3 pt-5 sm:grid-cols-2 lg:grid-cols-3">{page.items.flatMap(item => item.type === "echarts"
          ? [<GalleryChart key={`${item.type}:${item.id}`} item={item} articleId={articleId} />]
          : parseTaskCenterImageUrls(item.image_urls).map((source, index) => <GalleryImage key={`${item.type}:${item.id}:${index}`} item={item} articleId={articleId} source={source} index={index} onPreview={setSelection} />))}</ul>}
        {!page.items.length && !error && <div className="flex flex-col items-center gap-3 py-24 text-sm text-muted-foreground"><ImagesIcon className="h-7 w-7 opacity-50" /><p>{t("taskGallery.empty")}</p></div>}
        {error && <div role="alert" className="flex items-center justify-center gap-3 py-5 text-sm text-destructive">{t("taskGallery.loadFailed")}<Button size="sm" variant="ghost" onClick={() => page.items.length && page.next_cursor ? void loadMore() : setReload(n => n + 1)}>{t("common.refresh")}</Button></div>}
        {page.has_more && <div className="flex justify-center pt-5"><Button size="sm" variant="outline" disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore && <LoaderIcon className="h-4 w-4 animate-spin" />}{t("taskGallery.loadMore")}</Button></div>}
      </>}
    </div>
    <Dialog open={selection !== null} onOpenChange={open => { if (!open) setSelection(null) }}>
      <DialogContent className="max-h-[88dvh] overflow-y-auto sm:max-w-[820px]">
        <DialogHeader className="sr-only"><DialogTitle>{t("taskGallery.preview")}</DialogTitle></DialogHeader>
        {selection && <CoverPreview key={`${selection.item.type}:${selection.item.id}:${selection.index}`} articleId={articleId} source={selection.source} width={selection.width} height={selection.height} title={selection.item.title} filename={`${selection.item.type}-${selection.item.id}-${selection.index + 1}.png`} />}
      </DialogContent>
    </Dialog>
  </>
}

const overlayButtonClass = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-default disabled:opacity-40 motion-reduce:transition-none"

function GalleryOverlay({ item, children }: { item: TaskGalleryItem; children: ReactNode }) {
  const { t } = useTranslation()
  return <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 bg-gradient-to-b from-black/[0.1875] via-black/[0.0875] to-transparent px-3 pb-10 pt-3 text-white">
    <span className="pt-2 text-xs font-medium drop-shadow-sm">{t(`contentWriting.taskCenter.types.${item.type}`)}</span>
    <div className="pointer-events-auto flex shrink-0 gap-1">{children}</div>
  </div>
}

function useGalleryFileActions(item: TaskGalleryItem, articleId: number, getFile: () => Promise<File>) {
  const [busy, setBusy] = useState<"save" | "download" | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<"save" | "download" | null>(null)
  const inFlight = useRef(false)
  async function run(action: "save" | "download") {
    if (inFlight.current || (action === "save" && saved)) return
    inFlight.current = true; setBusy(action); setError(null)
    try {
      const file = await getFile()
      if (action === "save") {
        const content = await uploadImageToR2(file)
        const result = await materialsClient.createMaterial({ title: Array.from(item.title || file.name).slice(0, 200).join(""), material_type: "image", content, article_id: articleId, file_name: file.name })
        if ("error" in result) throw new Error(result.error)
        setSaved(true)
        window.dispatchEvent(new CustomEvent("joyfulwords-materials-refresh", { detail: { materialType: "image" } }))
        console.info("[TaskGallery] Result saved to materials", { type: item.type, taskId: item.id, articleId, materialId: result.id })
      } else {
        const url = URL.createObjectURL(file)
        const link = document.createElement("a")
        link.href = url; link.download = file.name
        document.body.appendChild(link); link.click(); link.remove()
        // Keep the blob alive until the browser has consumed the download click.
        window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
      }
    } catch (cause) {
      console.error("[TaskGallery] Result action failed", { type: item.type, taskId: item.id, action, cause }); setError(action)
    } finally { inFlight.current = false; setBusy(null) }
  }
  return { busy, saved, error, run }
}

function FileActionButtons({ actions, disabled = false }: { actions: ReturnType<typeof useGalleryFileActions>; disabled?: boolean }) {
  const { t } = useTranslation()
  const saveLabel = t(actions.saved ? "illustration.materialSaved" : "illustration.saveMaterial")
  return <>
    <button type="button" className={overlayButtonClass} title={saveLabel} aria-label={saveLabel} disabled={disabled || actions.busy !== null || actions.saved} onClick={() => void actions.run("save")}>
      {actions.busy === "save" ? <LoaderIcon className="h-4 w-4 animate-spin" /> : actions.saved ? <CheckIcon className="h-4 w-4" /> : <FolderPlusIcon className="h-4 w-4" />}
    </button>
    <button type="button" className={overlayButtonClass} title={t("illustration.cover.download")} aria-label={t("illustration.cover.download")} disabled={disabled || actions.busy !== null} onClick={() => void actions.run("download")}>
      {actions.busy === "download" ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <DownloadIcon className="h-4 w-4" />}
    </button>
  </>
}

function ActionError({ error }: { error: "save" | "download" | null }) {
  const { t } = useTranslation()
  return error && <p role="alert" className="absolute inset-x-0 bottom-0 z-10 bg-background/95 p-3 text-xs text-destructive">{t(error === "save" ? "illustration.materialFailed" : "taskGallery.exportFailed")}</p>
}

function GalleryChart({ item, articleId }: { item: TaskGalleryItem; articleId: number }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const chartRef = useRef<JoyChartRendererHandle | null>(null)
  const expandedRef = useRef<JoyChartRendererHandle | null>(null)
  const chart = item.spec?.chart && item.spec?.dataset ? item.spec : null
  const actions = useGalleryFileActions(item, articleId, async () => {
    const url = (expanded ? expandedRef : chartRef).current?.exportPng()
    if (!url) throw new Error("Chart is not ready")
    const response = await fetch(url)
    return new File([await response.blob()], `chart-${item.id}.png`, { type: "image/png" })
  })
  return <li className="relative aspect-[4/3] min-w-0 overflow-hidden rounded-xl bg-white">
    {chart && <GalleryChartPreview ref={chartRef} spec={chart} />}
    <button type="button" className="absolute inset-0 cursor-zoom-in focus-visible:outline-2 focus-visible:outline-primary" aria-label={t("taskGallery.preview")} onClick={() => setExpanded(true)} disabled={!chart} />
    <GalleryOverlay item={item}>
      <FileActionButtons actions={actions} disabled={!chart} />
    </GalleryOverlay>
    <ActionError error={actions.error} />
    <Dialog open={expanded} onOpenChange={setExpanded}>
      <DialogContent className="sm:max-w-[960px]">
        <DialogHeader className="sr-only"><DialogTitle>{t("taskGallery.preview")}</DialogTitle></DialogHeader>
        <div className="relative mt-4 overflow-hidden rounded-lg bg-white">
          <div className="h-[min(65dvh,600px)]">{chart && <JoyChartRenderer ref={expandedRef} spec={chart} />}</div>
          <GalleryOverlay item={item}><FileActionButtons actions={actions} /></GalleryOverlay>
          <ActionError error={actions.error} />
        </div>
      </DialogContent>
    </Dialog>
  </li>
}

async function imageFile(source: string, width: number, height: number, filename: string): Promise<File> {
  const response = await fetch(`/api/image-proxy?url=${encodeURIComponent(source)}`)
  if (!response.ok) throw new Error(`Image request failed: ${response.status}`)
  const url = URL.createObjectURL(await response.blob())
  try {
    const img = new Image()
    img.src = url; await img.decode()
    const canvas = document.createElement("canvas")
    canvas.width = width; canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas unavailable")
    const crop = centerCrop(img.naturalWidth, img.naturalHeight, width, height)
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high"
    ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height)
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("PNG encoding failed")), "image/png"))
    return new File([blob], filename, { type: "image/png" })
  } finally { URL.revokeObjectURL(url) }
}

function GalleryImage({ item, source, index, articleId, onPreview }: {
  item: TaskGalleryItem; source: string; index: number; articleId: number; onPreview: (selection: ImageSelection) => void
}) {
  const { t } = useTranslation()
  const [size, setSize] = useState({ width: item.width, height: item.height })
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const actions = useGalleryFileActions(item, articleId, () => imageFile(source, size.width, size.height, `${item.type}-${item.id}-${index + 1}.png`))
  const preview = () => onPreview({ item, source, index, ...size })
  return <li className="group relative aspect-[4/3] min-w-0 overflow-hidden rounded-xl bg-muted/30">
    <button type="button" disabled={!loaded || failed} aria-label={t("taskGallery.previewImage", { title: item.title || t("taskGallery.preview"), index: index + 1 })} className="block h-full w-full cursor-zoom-in focus-visible:outline-2 focus-visible:outline-primary" onClick={preview}>
      <img key={attempt} src={source} alt={item.title || t("taskGallery.preview")} loading="lazy" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.025] motion-reduce:transition-none" onLoad={event => { setSize({ width: item.width || event.currentTarget.naturalWidth, height: item.height || event.currentTarget.naturalHeight }); setLoaded(true) }} onError={() => { console.warn("[TaskGallery] Image unavailable", { taskId: item.id, type: item.type, index }); setFailed(true) }} />
    </button>
    <GalleryOverlay item={item}>
      <FileActionButtons actions={actions} disabled={!loaded || failed} />
    </GalleryOverlay>
    <ActionError error={actions.error} />
    {failed && <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted text-xs text-muted-foreground"><span>{t("illustration.cover.previewFailed")}</span><Button variant="ghost" size="sm" onClick={() => { setFailed(false); setLoaded(false); setAttempt(n => n + 1) }}>{t("common.refresh")}</Button></div>}
  </li>
}
