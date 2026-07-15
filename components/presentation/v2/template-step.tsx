"use client"

/* eslint-disable @next/next/no-img-element */

import { useState } from "react"
import { ImageIcon, LayoutTemplateIcon, Maximize2Icon } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/base/dialog"
import type { PPTLanguage, PPTTemplate } from "@/lib/api/presentations/v2/types"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { cn } from "@/lib/utils"

interface TemplateStepProps {
  templates: PPTTemplate[]
  selectedTemplate: PPTTemplate | null
  language: PPTLanguage
  loading?: boolean
  onSelect: (template: PPTTemplate) => void
}

export function TemplateStep({
  templates,
  selectedTemplate,
  language,
  loading = false,
  onSelect,
}: TemplateStepProps) {
  const { t } = useTranslation()
  const [previewTemplate, setPreviewTemplate] = useState<PPTTemplate | null>(null)

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-auto px-5 py-7 sm:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <div className="max-w-2xl">
            <h3 className="text-xl font-semibold tracking-tight">
              {t("presentationV2.template.title")}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("presentationV2.template.description")}
            </p>
          </div>

          {loading ? (
            <div className="mt-8 h-64 animate-pulse rounded-xl bg-muted" />
          ) : templates.length === 0 ? (
            <div className="mt-8 grid min-h-64 place-items-center rounded-xl border border-dashed bg-muted/20 text-center">
              <div>
                <LayoutTemplateIcon className="mx-auto size-9 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">{t("presentationV2.template.empty")}</p>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => {
                const selected =
                  template.template_key === selectedTemplate?.template_key &&
                  template.version === selectedTemplate.version
                const templateName = template.name_i18n[language] || template.template_key

                return (
                  <div
                    key={`${template.template_key}:${template.version}`}
                    className={cn(
                      "group overflow-hidden rounded-xl border bg-background text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg",
                      selected && "border-primary ring-2 ring-primary/15"
                    )}
                  >
                    {template.cover_url ? (
                      <button
                        type="button"
                        onClick={() => setPreviewTemplate(template)}
                        className="relative block aspect-video w-full overflow-hidden bg-muted/50 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                        aria-label={t("presentationV2.template.previewCover", { name: templateName })}
                      >
                        <img
                          src={template.cover_url}
                          alt={templateName}
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25 group-focus-within:bg-black/25">
                          <span className="flex translate-y-1 items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-sm backdrop-blur-sm transition-all group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                            <Maximize2Icon className="size-3.5" />
                            {t("presentationV2.template.viewLarge")}
                          </span>
                        </span>
                      </button>
                    ) : (
                      <div className="grid aspect-video w-full place-items-center bg-muted/50 text-muted-foreground">
                        <ImageIcon className="size-8" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelect(template)}
                      className="block w-full p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold">{templateName}</p>
                        <span
                          className={cn(
                            "mt-0.5 size-4 shrink-0 rounded-full border transition-colors",
                            selected ? "border-primary bg-primary ring-2 ring-primary/20" : "border-border"
                          )}
                        />
                      </div>
                      <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
                        {template.description_i18n[language] || t("presentationV2.template.noDescription")}
                      </p>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={previewTemplate !== null}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
      >
        <DialogContent className="max-h-[96vh] w-[98vw] max-w-[98vw] gap-0 overflow-hidden p-0 sm:max-w-[min(98vw,1800px)]">
          <DialogTitle className="border-b px-5 py-4 pr-12 text-base">
            {previewTemplate?.name_i18n[language] || previewTemplate?.template_key}
          </DialogTitle>
          <div className="flex min-h-0 items-center justify-center bg-muted/30 p-3 sm:p-5">
            {previewTemplate?.cover_url ? (
              <img
                src={previewTemplate.cover_url}
                alt={previewTemplate.name_i18n[language] || previewTemplate.template_key}
                className="max-h-[calc(96vh-5rem)] max-w-full rounded-md object-contain shadow-xl"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
