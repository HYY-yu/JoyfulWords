"use client"

import { useEffect, useMemo, useState } from "react"
import { FileTextIcon } from "lucide-react"
import { Badge } from "@/components/ui/base/badge"
import { Input } from "@/components/ui/base/input"
import { ScrollArea } from "@/components/ui/base/scroll-area"
import { Textarea } from "@/components/ui/base/textarea"
import type {
  StorycardDocument,
  StorycardSlide,
} from "@/lib/api/presentations/v2/types"
import type { StorycardValidationIssue } from "@/lib/presentations/v2/storycard-validation"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { cn } from "@/lib/utils"

interface StorycardStepProps {
  document: StorycardDocument
  issues: StorycardValidationIssue[]
  disabled?: boolean
  onChange: (document: StorycardDocument) => void
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-semibold text-foreground">{children}</span>
}

export function StorycardStep({
  document,
  issues,
  disabled = false,
  onChange,
}: StorycardStepProps) {
  const { t } = useTranslation()
  const [selectedSlideId, setSelectedSlideId] = useState(document.slides[0]?.id ?? "")

  useEffect(() => {
    if (!document.slides.some((slide) => slide.id === selectedSlideId)) {
      setSelectedSlideId(document.slides[0]?.id ?? "")
    }
  }, [document.slides, selectedSlideId])

  const selectedIndex = Math.max(
    0,
    document.slides.findIndex((slide) => slide.id === selectedSlideId)
  )
  const selectedSlide = document.slides[selectedIndex]
  const selectedIssues = useMemo(
    () => issues.filter((issue) => issue.slideIndex === selectedIndex),
    [issues, selectedIndex]
  )

  const updateDocument = (
    field: "title" | "audience" | "presentation_goal" | "narrative_structure",
    value: string
  ) => onChange({ ...document, [field]: value })

  const updateSlide = (patch: Partial<StorycardSlide>) => {
    const slides = document.slides.map((slide, index) =>
      index === selectedIndex ? { ...slide, ...patch } : slide
    )
    onChange({ ...document, slides })
  }

  if (!selectedSlide) return null

  return (
    <div className="grid min-h-0 flex-1 md:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="flex min-h-0 flex-col border-b bg-muted/10 md:border-r md:border-b-0">
        <div className="border-b px-5 py-4">
          <p className="text-sm font-semibold">{t("presentationV2.storycard.slides")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("presentationV2.storycard.slideCount", { count: document.slides.length })}
          </p>
        </div>
        <ScrollArea className="h-40 flex-1 md:h-auto">
          <div className="space-y-1 p-2">
            {document.slides.map((slide, index) => {
              const hasIssue = issues.some((issue) => issue.slideIndex === index)
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setSelectedSlideId(slide.id)}
                  className={cn(
                    "group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-all",
                    slide.id === selectedSlideId
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border bg-background text-[11px] font-semibold">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">
                      {slide.title || t("presentationV2.storycard.untitled")}
                    </span>
                    <span className="mt-1 block truncate text-[11px]">
                      {t(`presentationV2.pageTypes.${slide.page_type}`)}
                    </span>
                  </span>
                  {hasIssue ? <span className="mt-2 size-1.5 rounded-full bg-destructive" /> : null}
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </aside>

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto max-w-4xl space-y-8 px-5 py-6 sm:px-8">
          <section className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">{t("presentationV2.storycard.overview")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("presentationV2.storycard.overviewDescription")}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <FieldLabel>{t("presentationV2.storycard.title")}</FieldLabel>
                <Input
                  value={document.title}
                  disabled={disabled}
                  onChange={(event) => updateDocument("title", event.target.value)}
                />
              </label>
              <label className="space-y-2">
                <FieldLabel>{t("presentationV2.storycard.audience")}</FieldLabel>
                <Textarea
                  className="min-h-20 resize-y"
                  value={document.audience}
                  disabled={disabled}
                  onChange={(event) => updateDocument("audience", event.target.value)}
                />
              </label>
              <label className="space-y-2">
                <FieldLabel>{t("presentationV2.storycard.goal")}</FieldLabel>
                <Textarea
                  className="min-h-20 resize-y"
                  value={document.presentation_goal}
                  disabled={disabled}
                  onChange={(event) => updateDocument("presentation_goal", event.target.value)}
                />
              </label>
              <label className="space-y-2 sm:col-span-2">
                <FieldLabel>{t("presentationV2.storycard.narrative")}</FieldLabel>
                <Textarea
                  className="min-h-20 resize-y"
                  value={document.narrative_structure}
                  disabled={disabled}
                  onChange={(event) => updateDocument("narrative_structure", event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="space-y-5 border-t pt-7">
            <div className="flex flex-wrap items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <FileTextIcon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold">
                  {t("presentationV2.storycard.slideNumber", { index: selectedIndex + 1 })}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t(`presentationV2.pageTypes.${selectedSlide.page_type}`)}
                </p>
              </div>
              <Badge variant="outline">{selectedSlide.id}</Badge>
            </div>

            {selectedIssues.length > 0 ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {selectedIssues.map((issue) => (
                  <p key={`${issue.code}:${issue.path}`}>
                    {t(`presentationV2.validation.${issue.code}`)}
                  </p>
                ))}
              </div>
            ) : null}

            <div className="grid gap-4">
              <label className="space-y-2">
                <FieldLabel>{t("presentationV2.storycard.slideTitle")}</FieldLabel>
                <Input
                  value={selectedSlide.title}
                  disabled={disabled}
                  onChange={(event) => updateSlide({ title: event.target.value })}
                />
              </label>
              <label className="space-y-2">
                <FieldLabel>{t("presentationV2.storycard.keyMessage")}</FieldLabel>
                <Textarea
                  className="min-h-20 resize-y"
                  value={selectedSlide.key_message}
                  disabled={disabled}
                  onChange={(event) => updateSlide({ key_message: event.target.value })}
                />
              </label>
              <label className="space-y-2">
                <FieldLabel>{t("presentationV2.storycard.contentPoints")}</FieldLabel>
                <Textarea
                  className="min-h-28 resize-y"
                  value={selectedSlide.content_points.join("\n")}
                  disabled={disabled}
                  placeholder={t("presentationV2.storycard.contentPointsHint")}
                  onChange={(event) =>
                    updateSlide({
                      content_points: event.target.value.split("\n"),
                    })
                  }
                  onBlur={(event) =>
                    updateSlide({
                      content_points: event.target.value
                        .split("\n")
                        .map((point) => point.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <FieldLabel>{t("presentationV2.storycard.relationHint")}</FieldLabel>
                  <Textarea
                    className="min-h-20 resize-y"
                    value={selectedSlide.relation_hint}
                    disabled={disabled}
                    onChange={(event) => updateSlide({ relation_hint: event.target.value })}
                  />
                </label>
                <label className="space-y-2">
                  <FieldLabel>{t("presentationV2.storycard.visualHint")}</FieldLabel>
                  <Textarea
                    className="min-h-20 resize-y"
                    value={selectedSlide.visual_hint}
                    disabled={disabled}
                    onChange={(event) => updateSlide({ visual_hint: event.target.value })}
                  />
                </label>
              </div>
              <div className="space-y-2">
                <FieldLabel>{t("presentationV2.storycard.sourceRefs")}</FieldLabel>
                <div className="flex min-h-10 flex-wrap gap-2 rounded-md border bg-muted/20 px-3 py-2">
                  {selectedSlide.source_refs.length > 0 ? (
                    selectedSlide.source_refs.map((ref) => (
                      <Badge key={ref} variant="secondary">
                        {ref}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t("presentationV2.storycard.noSourceRefs")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  )
}
