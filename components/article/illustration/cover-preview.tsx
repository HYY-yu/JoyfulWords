"use client"
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react"
import { DownloadIcon, LoaderIcon } from "lucide-react"
import { Button } from "@/components/ui/base/button"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { centerCrop } from "@/lib/api/illustrations/crop-geometry"

type Preview = { key: string; url: string; width: number; height: number }
export function CoverPreview({ source, width, height, title, filename }: { source: string; width: number; height: number; title: string; filename: string }) {
  const { t } = useTranslation()
  const [preview, setPreview] = useState<Preview | null>(null)
  const [loaded, setLoaded] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const currentURL = useRef<string | null>(null)
  const key = JSON.stringify([source, width, height, retry])
  const loading = preview?.key !== key || loaded !== preview.url

  useEffect(() => {
    const controller = new AbortController()
    let sourceURL: string | undefined
    setError(null)
    async function render() {
      try {
        const response = await fetch(`/api/image-proxy?url=${encodeURIComponent(source)}`, { signal: controller.signal })
        if (!response.ok) throw new Error(`Cover image request failed: ${response.status}`)
        sourceURL = URL.createObjectURL(await response.blob())
        const img = new Image()
        img.src = sourceURL
        await img.decode()
        if (controller.signal.aborted) return
        const canvas = document.createElement("canvas")
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) throw new Error("Canvas unavailable")
        const rect = centerCrop(img.naturalWidth, img.naturalHeight, width, height)
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high"
        ctx.drawImage(img, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, width, height)
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("PNG encoding failed")), "image/png"))
        if (controller.signal.aborted) return
        const url = URL.createObjectURL(blob)
        if (currentURL.current) URL.revokeObjectURL(currentURL.current)
        currentURL.current = url
        setPreview({ key, url, width, height })
      } catch (cause) {
        if (controller.signal.aborted) return
        console.error("[Illustrations] Cover rendering failed", { width, height, cause })
        setError(key)
      } finally { if (sourceURL) URL.revokeObjectURL(sourceURL) }
    }
    void render()
    return () => controller.abort()
  }, [source, width, height, key])
  useEffect(() => () => { if (currentURL.current) URL.revokeObjectURL(currentURL.current) }, [])

  function download() {
    if (!preview || loading || error === key) return
    const link = document.createElement("a")
    link.href = preview.url; link.download = filename
    document.body.appendChild(link); link.click(); link.remove()
  }
  return <div className="space-y-3">
    <div className="flex items-center justify-between gap-3 text-sm"><span>{width} × {height}</span><Button variant="outline" size="sm" disabled={loading || error === key} onClick={download}><DownloadIcon className="mr-2 h-4 w-4" />{t("illustration.cover.download")}</Button></div>
    <div className="relative mx-auto max-w-[720px] overflow-hidden rounded-md bg-muted/30" aria-busy={loading} style={{ aspectRatio: preview ? `${preview.width} / ${preview.height}` : `${width} / ${height}`, minHeight: 160 }}>
      {preview && <img className="h-full w-full object-contain" src={preview.url} alt={title} onLoad={() => setLoaded(preview.url)} onError={() => setError(key)} />}
      {(loading || error === key) && <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/80 backdrop-blur-sm" role="status">
        {error === key ? <div className="space-y-3 p-5 text-center"><p>{t("illustration.cover.previewFailed")}</p><Button variant="outline" size="sm" onClick={() => setRetry((n) => n + 1)}>{t("common.refresh")}</Button></div> : <><LoaderIcon className="h-5 w-5 animate-spin" /><span className="text-sm">{t("illustration.cover.previewLoading")}</span></>}
      </div>}
    </div>
  </div>
}
