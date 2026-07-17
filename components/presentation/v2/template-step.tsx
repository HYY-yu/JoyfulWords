"use client"

/* eslint-disable @next/next/no-img-element */

import { useState } from "react"
import {
  ImageIcon,
  LayoutTemplateIcon,
  Maximize2Icon,
  PaletteIcon,
  ScanLineIcon,
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/base/dialog"
import type {
  PPTImageStyle,
  PPTLanguage,
  PPTTemplate,
} from "@/lib/api/presentations/v2/types"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { resolveCatalogText } from "@/lib/presentations/v2/catalog-localization"
import { cn } from "@/lib/utils"

interface TemplateStepProps {
  templates: PPTTemplate[]
  selectedTemplate: PPTTemplate | null
  imageStyles: PPTImageStyle[]
  selectedImageStyle: PPTImageStyle | null
  templatesLoading?: boolean
  imageStylesLoading?: boolean
  onSelectTemplate: (template: PPTTemplate) => void
  onSelectImageStyle: (imageStyle: PPTImageStyle) => void
}

const PRIVATE_TEMPLATE_WECHAT_QR_URL =
  "https://cdn.joyword.link/materials/8/d5830bc566a8f5513802749f6b781378.jpg"

export function TemplateStep({
  templates,
  selectedTemplate,
  imageStyles,
  selectedImageStyle,
  templatesLoading = false,
  imageStylesLoading = false,
  onSelectTemplate,
  onSelectImageStyle,
}: TemplateStepProps) {
  const { t, locale } = useTranslation()
  const displayLanguage: PPTLanguage = locale
  const [previewTemplate, setPreviewTemplate] = useState<PPTTemplate | null>(null)
  const [privateTemplateQrPreviewOpen, setPrivateTemplateQrPreviewOpen] = useState(false)

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

          {templatesLoading ? (
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
                const templateName = resolveCatalogText(
                  template.name_i18n,
                  displayLanguage,
                  template.template_key
                )

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
                      onClick={() => onSelectTemplate(template)}
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
                        {resolveCatalogText(
                          template.description_i18n,
                          displayLanguage,
                          t("presentationV2.template.noDescription")
                        )}
                      </p>
                    </button>
                  </div>
                )
              })}

              <div className="group overflow-hidden rounded-xl border border-emerald-500/30 bg-background text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/60 hover:shadow-lg">
                <button
                  type="button"
                  onClick={() => setPrivateTemplateQrPreviewOpen(true)}
                  className="relative flex aspect-video w-full flex-col items-center justify-center gap-1.5 bg-emerald-50/70 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset dark:bg-emerald-950/20"
                  aria-label={t("presentationV2.template.privateTemplateQrPreview")}
                >
                  <div className="overflow-hidden rounded-lg border border-emerald-500/20 bg-white p-1.5 shadow-sm">
                    <img
                      src={PRIVATE_TEMPLATE_WECHAT_QR_URL}
                      alt={t("presentationV2.template.privateTemplateQrAlt")}
                      className="size-28 object-contain sm:size-32 lg:size-28 xl:size-32"
                    />
                  </div>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    <ScanLineIcon className="size-3.5" />
                    {t("presentationV2.template.privateTemplateQrHint")}
                  </p>
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25 group-focus-within:bg-black/25">
                    <span className="flex translate-y-1 items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-sm backdrop-blur-sm transition-all group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                      <Maximize2Icon className="size-3.5" />
                      {t("presentationV2.template.viewLarge")}
                    </span>
                  </span>
                </button>
                <div className="p-4">
                  <p className="font-semibold">
                    {t("presentationV2.template.privateTemplateTitle")}
                  </p>
                  <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">
                    {t("presentationV2.template.privateTemplateDescription")}
                  </p>
                </div>
              </div>
            </div>
          )}

          <section className="mt-10 border-t pt-8">
            <div className="max-w-2xl">
              <h3 className="text-xl font-semibold tracking-tight">
                {t("presentationV2.imageStyle.title")}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("presentationV2.imageStyle.description")}
              </p>
            </div>

            {imageStylesLoading ? (
              <div className="mt-6 h-24 animate-pulse rounded-xl bg-muted" />
            ) : imageStyles.length === 0 ? (
              <div className="mt-6 grid min-h-24 place-items-center rounded-xl border border-dashed bg-muted/20 text-center">
                <p className="text-sm font-medium">{t("presentationV2.imageStyle.empty")}</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {imageStyles.map((imageStyle) => {
                  const selected = imageStyle.id === selectedImageStyle?.id
                  const label = resolveCatalogText(
                    imageStyle.label_i18n,
                    displayLanguage,
                    imageStyle.id
                  )

                  return (
                    <button
                      key={imageStyle.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onSelectImageStyle(imageStyle)}
                      className={cn(
                        "flex min-h-20 items-center gap-3 rounded-xl border bg-background p-4 text-left transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        selected && "border-primary bg-primary/5 ring-2 ring-primary/15"
                      )}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <PaletteIcon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-medium">{label}</span>
                      <span
                        className={cn(
                          "size-4 shrink-0 rounded-full border transition-colors",
                          selected ? "border-primary bg-primary ring-2 ring-primary/20" : "border-border"
                        )}
                      />
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      <Dialog
        open={previewTemplate !== null}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
      >
        <DialogContent className="max-h-[96vh] w-[98vw] max-w-[98vw] gap-0 overflow-hidden p-0 sm:max-w-[min(98vw,1800px)]">
          <DialogTitle className="border-b px-5 py-4 pr-12 text-base">
            {previewTemplate
              ? resolveCatalogText(
                  previewTemplate.name_i18n,
                  displayLanguage,
                  previewTemplate.template_key
                )
              : null}
          </DialogTitle>
          <div className="flex min-h-0 items-center justify-center bg-muted/30 p-3 sm:p-5">
            {previewTemplate?.cover_url ? (
              <img
                src={previewTemplate.cover_url}
                alt={resolveCatalogText(
                  previewTemplate.name_i18n,
                  displayLanguage,
                  previewTemplate.template_key
                )}
                className="max-h-[calc(96vh-5rem)] max-w-full rounded-md object-contain shadow-xl"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={privateTemplateQrPreviewOpen}
        onOpenChange={setPrivateTemplateQrPreviewOpen}
      >
        <DialogContent className="max-h-[96vh] w-[98vw] max-w-[98vw] gap-0 overflow-hidden p-0 sm:max-w-[min(98vw,1800px)]">
          <DialogTitle className="border-b px-5 py-4 pr-12 text-base">
            {t("presentationV2.template.privateTemplateTitle")}
          </DialogTitle>
          <div className="flex min-h-0 items-center justify-center bg-muted/30 p-3 sm:p-5">
            <img
              src={PRIVATE_TEMPLATE_WECHAT_QR_URL}
              alt={t("presentationV2.template.privateTemplateQrAlt")}
              className="max-h-[calc(96vh-5rem)] max-w-full rounded-md object-contain shadow-xl"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
