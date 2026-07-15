"use client"

/* eslint-disable @next/next/no-img-element */

import { Badge } from "@/components/ui/base/badge"
import { Button } from "@/components/ui/base/button"
import { PresentationTaskDetail } from "@/components/taskcenter/presentation-task-detail"
import { EChartsTaskDetail } from "@/components/taskcenter/echarts-task-detail"
import { getImageTaskErrorMessageKey } from "@/lib/api/taskcenter/image-error-messages"
import { useTranslation } from "@/lib/i18n/i18n-context"
import type {
  TaskCenterArticleListDetails,
  TaskCenterArticleTaskDetail,
  TaskCenterPresentationTaskDetail,
  TaskCenterEChartsTaskDetail,
  TaskCenterTaskDetailResponse,
  TaskCenterTaskListItem,
  TaskCenterTaskReference,
  TaskCenterTaskStatus,
  TaskCenterTaskType,
} from "@/lib/api/taskcenter/types"
import {
  getTaskCenterPresentationDownloadUrl,
  isTaskCenterArticleWriterDetails,
  parseTaskCenterImageUrls,
} from "@/lib/api/taskcenter/types"
import { cn } from "@/lib/utils"
import {
  ExternalLinkIcon,
  FileTextIcon,
  ImageIcon,
  LayersIcon,
  LayoutTemplateIcon,
  Mic2Icon,
  Presentation,
  BarChart3Icon,
} from "lucide-react"

const STATUS_VARIANTS: Record<
  TaskCenterTaskStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  processing: "secondary",
  success: "default",
  succeeded: "default",
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
      return Presentation
    case "echarts":
      return BarChart3Icon
    case "podcast":
    case "podcast_audio":
      return Mic2Icon
    default:
      return FileTextIcon
  }
}

export function getTaskCenterTaskIcon(task: TaskCenterTaskListItem) {
  if (task.type === "image" && task.details.gen_mode === "split_images") {
    return LayersIcon
  }

  return getTaskCenterTypeIcon(task.type)
}

function getArticleTaskTitle(
  details: Pick<TaskCenterArticleListDetails, "operate_type" | "operation_type">
): string {
  if (isTaskCenterArticleWriterDetails(details)) {
    if (details.operation_type === "writer_create") return "articleWriteCreate"
    if (details.operation_type === "writer_update") return "articleWriteUpdate"
    return "articleWrite"
  }

  return "articleEdit"
}

export function getTaskCenterTaskTitle(
  task: TaskCenterTaskListItem
): string {
  if (task.type === "image") {
    const genMode = task.details.gen_mode
    if (genMode === "split_images") return "splitImages"
    if (genMode === "style") return "styleImage"
    if (genMode === "cover") return "articleCover"
    if (genMode === "font") return "articleFont"
    return "generateImage"
  }

  if (task.type === "infographic") return "infographic"
  if (task.type === "echarts") return "echarts"
  if (task.type === "podcast") return "podcast"
  if (task.type === "podcast_audio") return "podcastAudio"
  if (task.type === "presentation") return "presentation"

  if (task.type === "article") {
    return getArticleTaskTitle(task.details)
  }

  return "articleEdit"
}

type TaskCenterTranslate = (key: string, params?: Record<string, any>) => string

function getImageTaskErrorCode(detail: {
  error_code?: string
  status?: string
}): string | undefined {
  return detail.status === "failed" ? detail.error_code : undefined
}

function getImageTaskBillingCharged(detail: {
  billing_charged?: boolean
}): boolean | undefined {
  return detail.billing_charged
}

function getImageTaskUserErrorMessage(
  t: TaskCenterTranslate,
  detail: {
    error_code?: string
    status?: string
  }
): string | null {
  if (detail.status !== "failed") return null

  return t(getImageTaskErrorMessageKey(getImageTaskErrorCode(detail)))
}

function shouldShowImageNoCharge(detail: {
  billing_charged?: boolean
  status?: string
}): boolean {
  return detail.status === "failed" || getImageTaskBillingCharged(detail) === false
}

function isFontImageTask(
  taskRef: TaskCenterTaskReference,
  detail: TaskCenterTaskDetailResponse
): boolean {
  return taskRef.type === "image" && "gen_mode" in detail && detail.gen_mode === "font"
}

function shouldShowReferenceImages(
  taskRef: TaskCenterTaskReference,
  detail: TaskCenterTaskDetailResponse
): boolean {
  return !isFontImageTask(taskRef, detail)
}

function isPodcastTaskType(type: TaskCenterTaskType): boolean {
  return type === "podcast" || type === "podcast_audio"
}

function formatPodcastTypeValue(t: TaskCenterTranslate, podcastType?: string): string {
  if (!podcastType) return "-"

  if (podcastType === "news_broadcast" || podcastType === "two_person_interview") {
    return t(`podcastAudioDialog.podcastTypes.${podcastType}`)
  }

  return podcastType
}

function formatNumberValue(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "-"
}

export function getTaskCenterTaskSummary(
  task: TaskCenterTaskListItem,
  t?: TaskCenterTranslate
): string {
  if (task.type === "article") {
    return task.details.req_text || task.details.resp_text || task.details.exec_id
  }

  if (task.type === "image") {
    if (task.status === "failed" && t) {
      return t(getImageTaskErrorMessageKey(task.details.error_code))
    }

    return task.details.prompt || task.details.model_name || "-"
  }

  if (task.type === "presentation") {
    const summaryParts = [
      task.details.stage && t
        ? t(`presentationV2.generation.stage.${task.details.stage}`)
        : task.details.stage,
      typeof task.details.slide_count === "number"
        ? t
          ? t("contentWriting.taskCenter.taskSummaries.presentationSlideCount", {
              count: task.details.slide_count,
            })
          : String(task.details.slide_count)
        : null,
    ].filter(Boolean)

    return summaryParts.join(" / ") || "-"
  }

  if (task.type === "echarts") {
    return task.details.title || task.details.prompt || task.details.chart_type || "-"
  }

  if (task.type === "podcast_audio") {
    const segmentSummary =
      typeof task.details.total_segments === "number" && t
        ? t("contentWriting.taskCenter.taskSummaries.podcastAudioSegments", {
            completed: task.details.completed_segments ?? 0,
            total: task.details.total_segments,
          })
        : null

    return task.details.title || segmentSummary || task.details.model_name || task.details.exec_id || "-"
  }

  if (task.type === "podcast") {
    return task.details.title || task.details.summary || task.details.model_name || task.details.exec_id || "-"
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
  preview = false,
}: {
  label: string
  value: string
  className?: string
  preview?: boolean
}) {
  return (
    <div className={className}>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-foreground",
          preview && "max-h-48 overflow-y-auto rounded-md border bg-muted/20 p-3"
        )}
      >
        {value || "-"}
      </p>
    </div>
  )
}

export function TaskCenterTaskDetailView({
  taskRef,
  detail,
  onOpenArticle,
  onContinuePresentation,
  className,
}: {
  taskRef: TaskCenterTaskReference
  detail: TaskCenterTaskDetailResponse
  onOpenArticle?: (articleId: number) => void
  onContinuePresentation?: (articleId: number) => void
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
  const imageTaskErrorMessage =
    taskRef.type === "image"
      ? getImageTaskUserErrorMessage(t, {
          error_code: "error_code" in detail ? detail.error_code : undefined,
          status: status || undefined,
        })
      : null
  const rawErrorMessage =
    taskRef.type === "image" || taskRef.type === "echarts"
      ? null
      : ("error" in detail && detail.error) ||
        ("error_message" in detail && detail.error_message) ||
        null
  const imageNoCharge =
    taskRef.type === "image"
      ? shouldShowImageNoCharge({
          billing_charged:
            "billing_charged" in detail ? detail.billing_charged : undefined,
          status: status || undefined,
        })
      : false
  const presentationDownloadUrl =
    taskRef.type === "presentation"
      ? getTaskCenterPresentationDownloadUrl(detail as TaskCenterPresentationTaskDetail)
      : null
  const articleDetail = taskRef.type === "article" ? (detail as TaskCenterArticleTaskDetail) : null
  const isWriterArticleTask = isTaskCenterArticleWriterDetails(articleDetail)
  const articleReqTextLabel = isWriterArticleTask
    ? t("contentWriting.taskCenter.fields.writingPrompt")
    : t("contentWriting.taskCenter.fields.sourceText")
  const articleRespTextLabel = isWriterArticleTask
    ? t("contentWriting.taskCenter.fields.generatedContent")
    : t("contentWriting.taskCenter.fields.resultText")
  const showGenericFields = taskRef.type !== "echarts"

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

      {showGenericFields ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {"exec_id" in detail ? (
          <DetailField label={t("contentWriting.taskCenter.fields.execId")} value={detail.exec_id || "-"} />
          ) : null}
          {taskRef.type === "podcast" ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.scriptId")}
            value={formatNumberValue("script_id" in detail ? detail.script_id : detail.id)}
          />
          ) : null}
          {taskRef.type === "podcast_audio" && "script_id" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.scriptId")}
            value={formatNumberValue(detail.script_id)}
          />
          ) : null}
          {taskRef.type === "podcast_audio" ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.audioTaskId")}
            value={formatNumberValue("audio_task_id" in detail ? detail.audio_task_id : detail.id)}
          />
          ) : null}
          {isPodcastTaskType(taskRef.type) && "podcast_type" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.podcastType")}
            value={formatPodcastTypeValue(t, detail.podcast_type)}
          />
          ) : null}
          {isPodcastTaskType(taskRef.type) && "language" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.language")}
            value={detail.language || "-"}
          />
          ) : null}
          {isPodcastTaskType(taskRef.type) && "title" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.title")}
            value={detail.title || "-"}
            className="sm:col-span-2"
          />
          ) : null}
          {isPodcastTaskType(taskRef.type) && "summary" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.summary")}
            value={detail.summary || "-"}
            className="sm:col-span-2"
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
          {taskRef.type === "podcast_audio" && "provider" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.provider")}
            value={detail.provider || "-"}
          />
          ) : null}
          {taskRef.type === "podcast_audio" && "output_format" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.outputFormat")}
            value={detail.output_format || "-"}
          />
          ) : null}
          {taskRef.type === "podcast_audio" && "sample_rate" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.sampleRate")}
            value={formatNumberValue(detail.sample_rate)}
          />
          ) : null}
          {isPodcastTaskType(taskRef.type) && "revision" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.revision")}
            value={formatNumberValue(detail.revision)}
          />
          ) : null}
          {taskRef.type === "podcast_audio" && "total_segments" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.totalSegments")}
            value={formatNumberValue(detail.total_segments)}
          />
          ) : null}
          {taskRef.type === "podcast_audio" && "completed_segments" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.completedSegments")}
            value={formatNumberValue(detail.completed_segments)}
          />
          ) : null}
          {taskRef.type === "podcast_audio" && "failed_segments" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.failedSegments")}
            value={formatNumberValue(detail.failed_segments)}
          />
          ) : null}
          {taskRef.type === "podcast_audio" && "provider_cost_usd" in detail ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.providerCost")}
            value={formatNumberValue(detail.provider_cost_usd)}
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
          {"prompt" in detail && !isFontImageTask(taskRef, detail) ? (
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
            label={articleReqTextLabel}
            value={detail.req_text || "-"}
            className="sm:col-span-2"
            preview={isWriterArticleTask}
          />
          ) : null}
          {"resp_text" in detail ? (
          <DetailField
            label={articleRespTextLabel}
            value={detail.resp_text || "-"}
            className="sm:col-span-2"
            preview={isWriterArticleTask}
          />
          ) : null}
          {"is_settle" in detail && !(taskRef.type === "image" && status === "failed") ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.settlement")}
            value={
              detail.is_settle
                ? t("contentWriting.taskCenter.settlement.settled")
                : t("contentWriting.taskCenter.settlement.unsettled")
            }
          />
          ) : null}
          {imageNoCharge ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.billing")}
            value={t("contentWriting.taskCenter.billing.noCharge")}
          />
          ) : null}
          {taskRef.type === "presentation" && presentationDownloadUrl ? (
          <DetailField
            label={t("contentWriting.taskCenter.fields.pptUrl")}
            value={presentationDownloadUrl}
            className="sm:col-span-2"
          />
          ) : null}
        </div>
      ) : null}

      {imageTaskErrorMessage || rawErrorMessage ? (
        <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-destructive">
            {t("contentWriting.taskCenter.fields.error")}
          </p>
          <p className="mt-2 text-sm leading-6 text-destructive">
            {imageTaskErrorMessage || rawErrorMessage}
          </p>
          {imageTaskErrorMessage ? (
            <p className="mt-2 text-sm font-medium text-destructive">
              {t("contentWriting.taskCenter.imageErrorCta")}
            </p>
          ) : null}
        </div>
      ) : null}

      {taskRef.type === "presentation" ? (
        <PresentationTaskDetail
          detail={detail as TaskCenterPresentationTaskDetail}
          onContinuePresentation={onContinuePresentation}
        />
      ) : taskRef.type === "echarts" ? (
        <EChartsTaskDetail detail={detail as TaskCenterEChartsTaskDetail} />
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

      {shouldShowReferenceImages(taskRef, detail) && referenceImageUrls.length > 0 ? (
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
