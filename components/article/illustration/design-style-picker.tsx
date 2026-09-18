"use client"

import { useEffect, useState } from "react"
import { CheckIcon, LoaderIcon, PaletteIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/base/popover"
import { Button } from "@/components/ui/base/button"
import { illustrationsClient } from "@/lib/api/illustrations/client"
import type { ArticleDesignState, DesignCatalog } from "@/lib/api/illustrations/types"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { cn } from "@/lib/utils"

export const DESIGN_CHANGED = "illustration-design-changed"

export function DesignStylePicker() {
  const { t, locale } = useTranslation()
  const [open, setOpen] = useState(false)
  const [catalog, setCatalog] = useState<DesignCatalog | null>(null)
  const [saved, setSaved] = useState<NonNullable<ArticleDesignState["binding"]>["snapshot"] | null>(null)
  const [styleId, setStyleId] = useState<number | null>(null)
  const [familyId, setFamilyId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  const [reload, setReload] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError(false)
    Promise.all([illustrationsClient.catalog(controller.signal), illustrationsClient.preference(controller.signal)])
      .then(([next, preference]) => {
        if (controller.signal.aborted) return
        if ("error" in next || "error" in preference) throw new Error("Design preference unavailable")
        setCatalog(next); setSaved(preference.snapshot)
        setStyleId(preference.snapshot?.style.id ?? next.styles[0]?.id ?? null)
        setFamilyId(preference.snapshot?.color_family.id ?? next.color_families[0]?.id ?? null)
      }).catch((cause) => {
        if (controller.signal.aborted) return
        console.error("[Illustrations] Preference loading failed", { cause }); setError(true)
      }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [open, reload])
  const palette = catalog?.palettes.filter((p) => p.style_id === styleId && p.color_family_id === familyId).sort((a,b) => b.version-a.version)[0]
  async function save() {
    if (!palette || !styleId || saving) return
    setSaving(true); setError(false)
    try {
      const result = await illustrationsClient.savePreference(styleId, palette.id)
      if ("error" in result) throw new Error(result.error)
      setSaved(result.snapshot); setOpen(false)
      window.dispatchEvent(new Event(DESIGN_CHANGED))
    } catch (cause) { console.error("[Illustrations] Preference save failed", { cause }); setError(true) }
    finally { setSaving(false) }
  }
  return <Popover open={open} onOpenChange={(value) => { if (!saving) setOpen(value) }}>
    <PopoverTrigger asChild><Button type="button" variant="ghost" size="sm" className="jw-themed-link h-8 shrink-0 gap-2 rounded-full text-sm" aria-label={t("illustration.design")}><PaletteIcon className="h-4 w-4" /><span className="hidden sm:inline">{saved ? saved.style.name[locale] : t("illustration.design")}</span>{saved && <span className="h-3 w-3 rounded-full border" style={{ background: saved.palette.primary }} />}</Button></PopoverTrigger>
    <PopoverContent aria-label={t("illustration.design")} align="end" className="w-[min(420px,calc(100vw-2rem))] p-5">
      <h3 className="text-sm font-semibold">{t("illustration.design")}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{t("illustration.preferenceHint")}</p>
      {loading ? <LoaderIcon className="mx-auto my-8 h-5 w-5 animate-spin" /> : <fieldset disabled={saving} className="mt-4 space-y-5">
        <legend className="sr-only">{t("illustration.design")}</legend>
        <div className="grid grid-cols-2 gap-2">{catalog?.styles.map((style) => <button type="button" key={style.id} aria-pressed={style.id === styleId} onClick={() => setStyleId(style.id)} className={cn("rounded-lg border px-3 py-3 text-left text-sm transition-colors motion-reduce:transition-none", style.id === styleId ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted")}><span className="font-medium">{style.name[locale]}</span><span className="mt-1 block text-xs text-muted-foreground">{t(`illustration.scenes.${style.recommended_scene}`)}</span></button>)}</div>
        <div className="flex justify-between gap-2" role="group" aria-label={t("illustration.color")}>{catalog?.color_families.map((family) => {
          const swatch = catalog.palettes.filter((p) => p.style_id === styleId && p.color_family_id === family.id).sort((a,b) => b.version-a.version)[0]
          return <button type="button" key={family.id} aria-pressed={family.id === familyId} onClick={() => setFamilyId(family.id)} className="flex flex-col items-center gap-2 rounded-md p-1 text-xs"><span className="flex h-8 w-8 items-center justify-center rounded-full transition-transform motion-reduce:transition-none hover:scale-110" style={{ background: swatch?.primary, color: swatch?.on_primary }}>{family.id === familyId && <CheckIcon className="h-4 w-4" />}</span>{family.name[locale]}</button>
        })}</div>
        <Button className="w-full" disabled={!palette || saving} onClick={() => void save()}>{saving && <LoaderIcon className="h-4 w-4 animate-spin" />}{t("illustration.applyStyle")}</Button>
      </fieldset>}
      {error && <div role="alert" className="mt-3 flex items-center justify-between gap-2 text-xs text-destructive">{t("illustration.error")}<Button size="sm" variant="ghost" onClick={() => setReload((n) => n+1)}>{t("common.refresh")}</Button></div>}
    </PopoverContent>
  </Popover>
}
