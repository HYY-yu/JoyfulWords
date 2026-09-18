"use client"

import { LoaderIcon, CheckIcon, AlertCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/base/button"
import { CoverPreview } from "@/components/article/illustration/cover-preview"
import type { IllustrationTaskDetails, IllustrationTaskType } from "@/lib/api/taskcenter/types"
import { useTranslation } from "@/lib/i18n/i18n-context"

export function IllustrationTaskDetail({ detail, type, onOpenArticle }: { detail: IllustrationTaskDetails; type: IllustrationTaskType; onOpenArticle?: (id: number) => void }) {
  const { t } = useTranslation()
  const active = detail.status === "pending" || detail.status === "processing"
  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="text-base font-semibold">{detail.title || t(`contentWriting.taskCenter.taskTitles.${type}`)}</h3><p role="status" className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">{active ? <LoaderIcon className="h-4 w-4 animate-spin" /> : detail.status === "failed" ? <AlertCircleIcon className="h-4 w-4 text-destructive" /> : <CheckIcon className="h-4 w-4" />}{t(`illustration.progress.stages.${detail.stage}`)}{detail.card_index > 0 && ` · #${detail.card_index}`}</p></div>
      {onOpenArticle && <Button size="sm" variant="outline" onClick={() => onOpenArticle(detail.article_id)}>{t("illustration.progress.openArticle")}</Button>}
    </div>
    <div className="flex flex-wrap items-center gap-3 border-y py-3 text-xs text-muted-foreground"><span>{t(`illustration.progress.billing.${detail.billing_status}`)}</span>{detail.credits > 0 && <span>{t("illustration.progress.credits", { count: detail.credits })}</span>}</div>
    {detail.status === "failed" && <p className="text-sm text-destructive">{t(detail.error_code === "illustration_submission_uncertain" ? "illustration.cover.uncertain" : "illustration.progress.failed")}</p>}
    {detail.image_url && detail.width > 0 && detail.height > 0 && <CoverPreview source={detail.image_url} width={detail.output_width || detail.width} height={detail.output_height || detail.height} title={detail.title} filename={`${type}-${detail.id}.png`} articleId={detail.article_id} />}
  </div>
}
