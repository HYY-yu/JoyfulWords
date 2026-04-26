"use client"

/* eslint-disable @next/next/no-img-element */

import { Badge } from "@/components/ui/base/badge"
import { Button } from "@/components/ui/base/button"
import { PresentationTaskDetail } from "@/components/taskcenter/presentation-task-detail"
import { useTranslation } from "@/lib/i18n/i18n-context"
import type {
  TaskCenterPresentationSlideSummary,
  TaskCenterPresentationTaskDetail,
  TaskCenterTaskDetailResponse,
  TaskCenterTaskListItem,
  TaskCenterTaskReference,
  TaskCenterTaskStatus,
  TaskCenterTaskType,
} from "@/lib/api/taskcenter/types"
import { parseTaskCenterImageUrls } from "@/lib/api/taskcenter/types"
import { cn } from "@/lib/utils"
import { ExternalLinkIcon, FileTextIcon, ImageIcon, LayoutTemplateIcon } from "lucide-react"

const STATUS_VARIANTS: Record<
  TaskCenterTaskStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  processing: "secondary",
  success: "default",
  failed: "destructive",
}

export function formatTaskCenterTime(dateString?: string | null): string {
  if (!dateString) return "-"

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleString()
}

export function getTaskCenterTypeIcon(type: TaskCenterTaskType) {
  switch (type) {
    case "article":
      return FileTextIcon
    case "image":
      return ImageIcon
    case "infographic":
      return LayoutTemplateIcon
    case "presentation":
      return FileTextIcon
    default:
      return FileTextIcon
  }
}

export function getTaskCenterTaskTitle(
  task: TaskCenterTaskListItem
): string {
  if (task.type === "image") {
    const genMode = task.details.gen_mode
    if (genMode === "split_images") return "splitImages"
    if (genMode === "style") return "styleImage"
    return "generateImage"
  }

  if (task.type === "infographic") return "infographic"
  if (task.type === "presentation") {
    const taskKind = task.details.task_kind
    if (taskKind === "storycard_generate") return "presentationStorycard"
    if (taskKind === "ppt_export") return "presentationPptExport"
    return "presentationLayout"
  }
  return "articleEdit"
}

function getPresentationSlideSummaryStage(summary: TaskCenterPresentationSlideSummary): string {
  if (summary.processing > 0) return "slides_processing"
  if (summary.pending > 0) return "slides_pending"
  if (summary.success >= summary.total && summary.total > 0) return "slides_success"
  return "slides_processing"
}

export function getTaskCenterTaskSummary(task: TaskCenterTaskListItem): string {
  if (task.type === "article") {
    return task.details.req_text || task.details.resp_text || task.details.exec_id
  }

  if (task.type === "image") {
    return task.details.prompt || task.details.model_name || "-"
  }

  if (task.type === "presentation") {
    const slideSummary = task.details.slide_summary
    if (slideSummary && slideSummary.total > 0) {
      if (slideSummary.failed > 0) {
        return `${slideSummary.failed} failed / ${slideSummary.total} slides`
      }

      return `${slideSummary.success}/${slideSummary.total} slides · ${getPresentationSlideSummaryStage(slideSummary)}`
    }

    const summaryParts = [
      task.details.task_kind,
      task.details.stage,
      typeof task.details.slide_count === "number"
        ? `${task.details.slide_count} slides`
        : null,
    ].filter(Boolean)

    return summaryParts.join(" / ") || task.details.model_name || "-"
  }

  return task.details.card_name || task.details.card_type || "-"
}

export function getTaskCenterStatusLabel(
  t: (key: string) => string,
  status: TaskCenterTaskStatus
): string {
  return t(`contentWriting.taskCenter.statuses.${status}`)
}

export function TaskCenterTaskTypeBadge({
  type,
}: {
  type: TaskCenterTaskType
}) {
  const { t } = useTranslation()

  return (
    <Badge variant="outline" className="capitalize">
      {t(`contentWriting.taskCenter.types.${type}`)}
    </Badge>
  )
}

export function TaskCenterStatusBadge({
  status,
}: {
  status: TaskCenterTaskStatus
}) {
  const { t } = useTranslation()

  return (
    <Badge variant={STATUS_VARIANTS[status] ?? "outline"}>
      {getTaskCenterStatusLabel(t, status)}
    </Badge>
  )
}

function DetailField({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-foreground">{value || "-"}</p>
    </div>
  )
}

export function TaskCenterTaskDetailView({
  taskRef,
  detail,
  onOpenArticle,
  onSelectTask,
  className,
}: {
  taskRef: TaskCenterTaskReference
  detail: TaskCenterTaskDetailResponse
  onOpenArticle?: (articleId: number) => void
  onSelectTask?: (taskRef: TaskCenterTaskReference) => void
  className?: string
}) {
  const { t } = useTranslation()
  const imageUrls =
    "image_urls" in detail ? parseTaskCenterImageUrls(detail.image_urls) : []
  const referenceImageUrls =
    "reference_image_urls" in detail
      ? parseTaskCenterImageUrls(detail.reference_image_urls)
      : []
  const articleId = "article_id" in detail ? detail.article_id : null
  const status = "status" in detail ? detail.status : null

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <TaskCenterTaskTypeBadge type={taskRef.type} />
            {status ? <TaskCenterStatusBadge status={status as TaskCenterTaskStatus} /> : null}
          </div>
          <p className="text-xs text-muted-foreground">
            #{detail.id} · {formatTaskCenterTime(detail.created_at)}
          </p>
        </div>

        {typeof articleId === "number" && onOpenArticle ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenArticle(articleId)}
          >
            <ExternalLinkIcon className="h-4 w-4" />
            {t("contentWriting.taskCenter.openArticle")}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {"exec_id" in detail ? (
          <DetailField label={t("contentWriting.taskCenter.fields.execId")} value={detail.exec_id} />
        ) : null}
        {"task_kind" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.taskKind")}
            value={detail.task_kind || "-"}
          />
        ) : null}
        {"stage" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.stage")}
            value={detail.stage || "-"}
          />
        ) : null}
        {"storycard_id" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.storycardId")}
            value={detail.storycard_id ? String(detail.storycard_id) : "-"}
          />
        ) : null}
        {"slide_count" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.slideCount")}
            value={
              typeof detail.slide_count === "number" ? String(detail.slide_count) : "-"
            }
          />
        ) : null}
        {"model_name" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.model")}
            value={detail.model_name || "-"}
          />
        ) : null}
        {"card_name" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.cardName")}
            value={detail.card_name || "-"}
          />
        ) : null}
        {"card_type" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.cardType")}
            value={detail.card_type || "-"}
          />
        ) : null}
        {"prompt" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.prompt")}
            value={detail.prompt || "-"}
            className="sm:col-span-2"
          />
        ) : null}
        {"gen_mode" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.genMode")}
            value={detail.gen_mode || "-"}
          />
        ) : null}
        {"completed_at" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.completedAt")}
            value={formatTaskCenterTime(detail.completed_at)}
          />
        ) : null}
        {"updated_at" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.updatedAt")}
            value={formatTaskCenterTime(detail.updated_at)}
          />
        ) : null}
        {"req_text" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.sourceText")}
            value={detail.req_text || "-"}
            className="sm:col-span-2"
          />
        ) : null}
        {"resp_text" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.resultText")}
            value={detail.resp_text || "-"}
            className="sm:col-span-2"
          />
        ) : null}
        {"is_settle" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.settlement")}
            value={
              detail.is_settle
                ? t("contentWriting.taskCenter.settlement.settled")
                : t("contentWriting.taskCenter.settlement.unsettled")
            }
          />
        ) : null}
        {"ppt_url" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.pptUrl")}
            value={detail.ppt_url || "-"}
            className="sm:col-span-2"
          />
        ) : null}
      </div>

      {("error" in detail && detail.error) || ("error_message" in detail && detail.error_message) ? (
        <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-destructive">
            {t("contentWriting.taskCenter.fields.error")}
          </p>
          <p className="mt-2 text-sm leading-6 text-destructive">
            {("error" in detail && detail.error) || ("error_message" in detail && detail.error_message)}
          </p>
        </div>
      ) : null}

      {taskRef.type === "presentation" ? (
        <PresentationTaskDetail
          detail={detail as TaskCenterPresentationTaskDetail}
          onSelectTask={onSelectTask}
        />
      ) : null}

      {imageUrls.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {t("contentWriting.taskCenter.fields.outputImages")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {imageUrls.map((imageUrl, index) => (
              <div
                key={`${imageUrl}-${index}`}
                className="overflow-hidden rounded-xl border bg-muted/20"
              >
                <img
                  src={imageUrl}
                  alt={`${t("contentWriting.taskCenter.fields.outputImages")} ${index + 1}`}
                  className="aspect-square w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {referenceImageUrls.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {t("contentWriting.taskCenter.fields.referenceImages")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {referenceImageUrls.map((imageUrl, index) => (
              <div
                key={`${imageUrl}-${index}`}
                className="overflow-hidden rounded-xl border bg-muted/20"
              >
                <img
                  src={imageUrl}
                  alt={`${t("contentWriting.taskCenter.fields.referenceImages")} ${index + 1}`}
                  className="aspect-square w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
