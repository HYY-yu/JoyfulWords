"use client"

/* eslint-disable @next/next/no-img-element */

import { ImageIcon, LayoutTemplateIcon } from "lucide-react"
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

  return (
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
              return (
                <button
                  key={`${template.template_key}:${template.version}`}
                  type="button"
                  onClick={() => onSelect(template)}
                  className={cn(
                    "group overflow-hidden rounded-xl border bg-background text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg",
                    selected && "border-primary ring-2 ring-primary/15"
                  )}
                >
                  <div className="aspect-video overflow-hidden bg-muted/50">
                    {template.cover_url ? (
                      <img
                        src={template.cover_url}
                        alt={template.name_i18n[language] || template.template_key}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="grid size-full place-items-center text-muted-foreground">
                        <ImageIcon className="size-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold">
                        {template.name_i18n[language] || template.template_key}
                      </p>
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
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

