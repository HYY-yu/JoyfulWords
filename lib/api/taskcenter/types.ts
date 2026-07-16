"use client"

import type { GenerationStage } from "@/lib/api/presentations/v2/types"

export const TASK_CENTER_TASK_TYPES = [
  "article",
  "image",
  "infographic",
  "presentation",
  "echarts",
  "podcast",
  "podcast_audio",
] as const

export type TaskCenterTaskType = (typeof TASK_CENTER_TASK_TYPES)[number]

export type TaskCenterArticleOperateType = "edit" | "writer"
export type TaskCenterArticleOperationType = "" | "edit" | "writer_create" | "writer_update"
export type TaskCenterArticleStatus = "pending" | "processing" | "success" | "failed"
export type TaskCenterImageStatus = "pending" | "processing" | "success" | "failed"
export type TaskCenterInfographicStatus = "processing" | "success" | "failed"
export type PresentationTaskStatus = "queued" | "processing" | "succeeded" | "failed"
export type TaskCenterPresentationStatus = PresentationTaskStatus
export type PresentationTaskStage = GenerationStage
export type TaskCenterEChartsStatus = "pending" | "processing" | "success" | "failed" | "succeeded"
export type TaskCenterPodcastStatus = "pending" | "processing" | "success" | "failed"

export type TaskCenterTaskStatus =
  | TaskCenterArticleStatus
  | TaskCenterImageStatus
  | TaskCenterInfographicStatus
  | TaskCenterPresentationStatus
  | TaskCenterEChartsStatus
  | TaskCenterPodcastStatus

export interface PptVerifyReport {
  passed?: boolean
  slides?: number
  notesParts?: number
  danglingRelationships?: string[]
  orphanRelationships?: string[]
  nativeSvgEmbeddings?: number
  invalidSvgEmbeddings?: string[]
  unreferencedSlideParts?: string[]
  dslLeaks?: string[]
  errors?: string[]
}

export interface PresentationTaskDetails {
  article_id: number
  storycard_id: number
  storycard_version: number
  template_id: number
  stage: PresentationTaskStage
  ppt_url: string
  pptx_url: string
  slide_count: number
  verify_report: PptVerifyReport
  attempt: number
  completed_at: string
  model_name: string
  error_code: string
  error_message: string
  billing_status: "pending" | "reported" | "skipped" | "failed"
}

export interface TaskCenterArticleListDetails {
  article_id: number
  exec_id: string
  is_settle: boolean
  operate_type?: TaskCenterArticleOperateType
  operation_type?: TaskCenterArticleOperationType
  status?: TaskCenterArticleStatus
  req_text?: string
  resp_text?: string
  error?: string
}

export interface TaskCenterImageListDetails {
  prompt?: string
  model_name?: string
  image_urls?: string | string[]
  reference_image_urls?: string | string[]
  is_settle?: boolean
  billing_charged?: boolean
  completed_at?: string | null
  gen_mode?: string
  article_id?: number
  source_image?: string
  num_layers?: number
  model_reference_id?: string
  error?: string
  error_code?: string
}

export interface TaskCenterInfographicListDetails {
  article_id: number
  card_name?: string
  card_type?: string
  image_urls?: string | string[]
  completed_at?: string | null
  model_name?: string
  model_reference_id?: string
}

export type TaskCenterPresentationListDetails = PresentationTaskDetails

export interface TaskCenterEChartsListDetails {
  article_id?: number
  prompt?: string
  chart_type?: string
  title?: string
  schema_version?: string
  error?: string
  error_code?: string
  error_message?: string
  completed_at?: string | null
}

export interface TaskCenterPodcastListDetails {
  article_id?: number
  exec_id?: string
  script_id?: number
  podcast_type?: string
  language?: string
  title?: string
  summary?: string
  revision?: number
  updated_at?: string
  model_name?: string
  completed_at?: string | null
  error?: string
  error_message?: string
}

export interface TaskCenterPodcastAudioListDetails {
  article_id?: number
  exec_id?: string
  audio_task_id?: number
  script_id?: number
  podcast_type?: string
  language?: string
  title?: string
  summary?: string
  output_format?: string
  sample_rate?: number
  provider?: string
  model_name?: string
  total_segments?: number
  completed_segments?: number
  failed_segments?: number
  provider_billable_units?: number
  provider_cost_usd?: number
  updated_at?: string
  completed_at?: string | null
  error?: string
  error_message?: string
}

export type TaskCenterTaskListDetails =
  | TaskCenterArticleListDetails
  | TaskCenterImageListDetails
  | TaskCenterInfographicListDetails
  | TaskCenterPresentationListDetails
  | TaskCenterEChartsListDetails
  | TaskCenterPodcastListDetails
  | TaskCenterPodcastAudioListDetails

interface TaskCenterTaskListItemBase<
  TType extends TaskCenterTaskType,
  TStatus extends TaskCenterTaskStatus,
  TDetails,
> {
  id: number
  type: TType
  status: TStatus
  created_at: string
  details: TDetails
}

export type TaskCenterArticleTaskListItem = TaskCenterTaskListItemBase<
  "article",
  TaskCenterArticleStatus,
  TaskCenterArticleListDetails
>

export type TaskCenterImageTaskListItem = TaskCenterTaskListItemBase<
  "image",
  TaskCenterImageStatus,
  TaskCenterImageListDetails
>

export type TaskCenterInfographicTaskListItem = TaskCenterTaskListItemBase<
  "infographic",
  TaskCenterInfographicStatus,
  TaskCenterInfographicListDetails
>

export type TaskCenterPresentationTaskListItem = TaskCenterTaskListItemBase<
  "presentation",
  TaskCenterPresentationStatus,
  TaskCenterPresentationListDetails
>
export type PresentationTaskItem = TaskCenterPresentationTaskListItem

export type TaskCenterEChartsTaskListItem = TaskCenterTaskListItemBase<
  "echarts",
  TaskCenterEChartsStatus,
  TaskCenterEChartsListDetails
>

export type TaskCenterPodcastTaskListItem = TaskCenterTaskListItemBase<
  "podcast",
  TaskCenterPodcastStatus,
  TaskCenterPodcastListDetails
>

export type TaskCenterPodcastAudioTaskListItem = TaskCenterTaskListItemBase<
  "podcast_audio",
  TaskCenterPodcastStatus,
  TaskCenterPodcastAudioListDetails
>

export type TaskCenterTaskListItem =
  | TaskCenterArticleTaskListItem
  | TaskCenterImageTaskListItem
  | TaskCenterInfographicTaskListItem
  | TaskCenterPresentationTaskListItem
  | TaskCenterEChartsTaskListItem
  | TaskCenterPodcastTaskListItem
  | TaskCenterPodcastAudioTaskListItem

export interface TaskCenterTasksQuery {
  type?: TaskCenterTaskType
  article_id?: number
  status?: string
  sort?: "recent" | "rank"
  page_size?: number
  cursor?: string
  signal?: AbortSignal
}

export interface TaskCenterTaskListPage {
  items: TaskCenterTaskListItem[]
  next_cursor?: string
  has_more: boolean
}

export interface TaskCenterArticleTaskDetail {
  id: number
  article_id: number
  exec_id: string
  operate_type?: TaskCenterArticleOperateType
  operation_type?: TaskCenterArticleOperationType
  status: TaskCenterArticleStatus
  req_text: string
  resp_text?: string
  error?: string
  is_settle?: boolean
  created_at: string
  updated_at: string
}

export interface TaskCenterImageTaskDetail {
  id: number
  user_id?: number
  article_id?: number
  prompt?: string
  model_name?: string
  model_reference_id?: string
  gen_mode?: string
  config?: string
  referenced_material_ids?: string
  reference_image_urls?: string | string[]
  image_urls?: string | string[]
  status: TaskCenterImageStatus
  error?: string
  error_code?: string
  is_settle?: boolean
  billing_charged?: boolean
  completed_at?: string | null
  created_at: string
  updated_at: string
}

export interface TaskCenterInfographicTaskDetail {
  id: number
  user_id?: number
  article_id: number
  card_name?: string
  card_type?: string
  image_urls?: string | string[]
  model_name?: string
  model_reference_id?: string
  status: TaskCenterInfographicStatus
  error?: string
  completed_at?: string | null
  created_at: string
  updated_at: string
}

export interface TaskCenterPresentationTaskDetail {
  id: number
  user_id: number
  article_id: number
  storycard_id: number
  storycard_version: number
  template_id: number
  stage: PresentationTaskStage
  slide_count: number
  status: TaskCenterPresentationStatus
  ppt_url: string
  pptx_url: string
  verify_report: PptVerifyReport
  validation_report: Record<string, unknown>
  attempt: number
  model_name: string
  error_code: string
  error_message: string
  billing_status: "pending" | "reported" | "skipped" | "failed"
  billed_slide_count: number
  created_at: string
  updated_at: string
  completed_at: string
}

export interface TaskCenterEChartsTaskDetail {
  id: number
  user_id?: number
  article_id?: number
  prompt: string
  schema_version?: string
  chart_type?: string
  title?: string
  status: TaskCenterEChartsStatus
  spec?: unknown
  error_code?: string
  error_message?: string
  error?: string
  version: number
  created_at: string
  updated_at: string
  completed_at?: string | null
}

export interface TaskCenterPodcastTaskDetail {
  id: number
  user_id?: number
  article_id?: number
  exec_id?: string
  script_id?: number
  podcast_type?: string
  language?: string
  title?: string
  summary?: string
  revision?: number
  model_name?: string
  status: TaskCenterPodcastStatus
  error?: string
  error_message?: string
  created_at: string
  updated_at: string
  completed_at?: string | null
}

export interface TaskCenterPodcastAudioTaskDetail {
  id: number
  user_id?: number
  article_id?: number
  exec_id?: string
  audio_task_id?: number
  script_id?: number
  podcast_type?: string
  language?: string
  title?: string
  summary?: string
  output_format?: string
  sample_rate?: number
  provider?: string
  model_name?: string
  status: TaskCenterPodcastStatus
  total_segments?: number
  completed_segments?: number
  failed_segments?: number
  provider_billable_units?: number
  provider_cost_usd?: number
  error?: string
  error_message?: string
  created_at: string
  updated_at: string
  completed_at?: string | null
}

export type TaskCenterTaskDetailResponse =
  | TaskCenterArticleTaskDetail
  | TaskCenterImageTaskDetail
  | TaskCenterInfographicTaskDetail
  | TaskCenterPresentationTaskDetail
  | TaskCenterEChartsTaskDetail
  | TaskCenterPodcastTaskDetail
  | TaskCenterPodcastAudioTaskDetail

export interface TaskCenterTaskReference {
  id: number
  type: TaskCenterTaskType
}

type TaskCenterArticleOperationDetails = {
  operate_type?: TaskCenterArticleOperateType | string
  operation_type?: TaskCenterArticleOperationType | string
}

export function isTaskCenterArticleWriterDetails(
  details: TaskCenterArticleOperationDetails | null | undefined
): boolean {
  if (!details) return false

  return (
    details.operate_type === "writer" ||
    details.operation_type === "writer_create" ||
    details.operation_type === "writer_update"
  )
}

export function getTaskCenterTaskKey(task: TaskCenterTaskReference): string {
  return `${task.type}:${task.id}`
}

type TaskCenterPresentationDownloadSource = Partial<
  Pick<TaskCenterPresentationListDetails, "pptx_url">
>

export function getTaskCenterPresentationDownloadUrl(
  value: TaskCenterPresentationDownloadSource | null | undefined
): string | null {
  const downloadUrl = value?.pptx_url?.trim()
  return downloadUrl || null
}

export function parseTaskCenterImageUrls(value: unknown): string[] {
  if (!value) return []

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
  }

  if (typeof value !== "string") return []

  const trimmed = value.trim()
  if (!trimmed) return []

  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0
      )
    }

    if (typeof parsed === "string" && parsed.trim().length > 0) {
      return [parsed.trim()]
    }
  } catch {
    // Ignore JSON parse failure and fall back to comma-separated values.
  }

  return trimmed
    .split(",")
    .map((item) => item.trim().replace(/[`"']/g, ""))
    .filter(Boolean)
}

export function getTaskCenterTaskArticleId(task: TaskCenterTaskListItem): number | null {
  if ("article_id" in task.details && typeof task.details.article_id === "number") {
    return task.details.article_id
  }

  return null
}

export function isTaskCenterTerminalTask(task: TaskCenterTaskListItem): boolean {
  if (task.type === "presentation") {
    return task.status === "succeeded" || task.status === "failed"
  }

  return task.status === "success" || task.status === "succeeded" || task.status === "failed"
}

export function isTaskCenterSucceededTask(task: TaskCenterTaskListItem): boolean {
  if (task.type === "presentation") {
    return task.status === "succeeded"
  }

  return task.status === "success" || task.status === "succeeded"
}
