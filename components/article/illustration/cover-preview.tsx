"use client"
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react"
import { DownloadIcon, LoaderIcon, FolderPlusIcon, CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/base/button"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { materialsClient } from "@/lib/api/materials/client"
import { uploadImageToR2 } from "@/lib/tiptap-image-upload"
import { centerCrop } from "@/lib/api/illustrations/crop-geometry"

type Preview = { key: string; url: string; width: number; height: number }
export function CoverPreview({ source, width, height, title, filename, articleId }: { articleId?: number; source: string; width: number; height: number; title: string; filename: string }) {
  const { t } = useTranslation()
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [savedKeys, setSavedKeys] = useState<Set<string>>(() => new Set())
  const [materialError, setMaterialError] = useState<string | null>(null)
  const saving = useRef(false)
  const materialKey = JSON.stringify([source, width, height])
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
  async function saveMaterial() {
    if (!preview || loading || error === key || saving.current || savedKeys.has(materialKey)) return
    saving.current = true; setSavingKey(materialKey); setMaterialError(null)
    try {
      // Upload the rendered crop, so materials and download contain exactly the same image.
      const response = await fetch(preview.url)
      if (!response.ok) throw new Error("Preview image unavailable")
      const content = await uploadImageToR2(new File([await response.blob()], filename, { type: "image/png" }))
      const result = await materialsClient.createMaterial({ title: Array.from(title || filename).slice(0, 200).join(""), material_type: "image", content, article_id: articleId, file_name: filename })
      if ("error" in result) throw new Error(result.error)
      window.dispatchEvent(new CustomEvent("joyfulwords-materials-refresh", { detail: { materialType: "image" } }))
      setSavedKeys((previous) => new Set(previous).add(materialKey))
      console.info("[Illustrations] Image saved to materials", { articleId, materialId: result.id, width, height })
    } catch (cause) {
      console.error("[Illustrations] Saving material failed", { articleId, cause }); setMaterialError(materialKey)
    } finally { saving.current = false; setSavingKey(null) }
  }
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>{width} × {height}</span><div className="flex flex-wrap gap-1">
      <Button variant="ghost" size="sm" disabled={loading || error === key || savingKey !== null || savedKeys.has(materialKey)} onClick={() => void saveMaterial()}>{savingKey === materialKey ? <LoaderIcon className="h-4 w-4 animate-spin" /> : savedKeys.has(materialKey) ? <CheckIcon className="h-4 w-4" /> : <FolderPlusIcon className="h-4 w-4" />}{t(savedKeys.has(materialKey) ? "illustration.materialSaved" : "illustration.saveMaterial")}</Button>
      <Button variant="ghost" size="sm" disabled={loading || error === key} onClick={download}><DownloadIcon className="h-4 w-4" />{t("illustration.cover.download")}</Button>
    </div></div>
    {materialError === materialKey && <p role="alert" className="text-xs text-destructive">{t("illustration.materialFailed")}</p>}
    <div className="relative mx-auto w-full max-w-[720px] overflow-hidden rounded-md bg-muted/30" aria-busy={loading} style={{ aspectRatio: preview ? `${preview.width} / ${preview.height}` : `${width} / ${height}` }}>
      {preview && <img className="h-full w-full object-contain" src={preview.url} alt={title} onLoad={() => setLoaded(preview.url)} onError={() => setError(key)} />}
      {(loading || error === key) && <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/80 backdrop-blur-sm" role="status">
        {error === key ? <div className="space-y-3 p-5 text-center"><p>{t("illustration.cover.previewFailed")}</p><Button variant="outline" size="sm" onClick={() => setRetry((n) => n + 1)}>{t("common.refresh")}</Button></div> : <><LoaderIcon className="h-5 w-5 animate-spin" /><span className="text-sm">{t("illustration.cover.previewLoading")}</span></>}
      </div>}
    </div>
  </div>
}
