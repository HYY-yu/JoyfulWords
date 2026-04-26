"use client"

export const TASK_CENTER_TASK_TYPES = ["article", "image", "infographic", "presentation"] as const

export type TaskCenterTaskType = (typeof TASK_CENTER_TASK_TYPES)[number]

export type TaskCenterArticleOperateType = "edit"
export type TaskCenterArticleStatus = "pending" | "processing" | "success" | "failed"
export type TaskCenterImageStatus = "pending" | "processing" | "success" | "failed"
export type TaskCenterInfographicStatus = "processing" | "success" | "failed"
export type TaskCenterPresentationStatus = "pending" | "processing" | "success" | "failed"

export type TaskCenterTaskStatus =
  | TaskCenterArticleStatus
  | TaskCenterImageStatus
  | TaskCenterInfographicStatus
  | TaskCenterPresentationStatus

export interface TaskCenterArticleListDetails {
  article_id: number
  exec_id: string
  is_settle: boolean
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
  completed_at?: string | null
  gen_mode?: string
  article_id?: number
  source_image?: string
  num_layers?: number
  model_reference_id?: string
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

export interface TaskCenterPresentationSlideSummary {
  total: number
  pending: number
  processing: number
  success: number
  failed: number
}

export interface TaskCenterPresentationListDetails {
  article_id: number
  storycard_id?: number
  task_kind?: string
  stage?: string
  slide_count?: number
  slide_summary?: TaskCenterPresentationSlideSummary
  model_name?: string
  completed_at?: string | null
  ppt_url?: string
  cached?: boolean
  error?: string
}

export type TaskCenterTaskListDetails =
  | TaskCenterArticleListDetails
  | TaskCenterImageListDetails
  | TaskCenterInfographicListDetails
  | TaskCenterPresentationListDetails

interface TaskCenterTaskListItemBase<TType extends TaskCenterTaskType, TDetails> {
  id: number
  type: TType
  status: TaskCenterTaskStatus
  created_at: string
  details: TDetails
}

export type TaskCenterArticleTaskListItem = TaskCenterTaskListItemBase<
  "article",
  TaskCenterArticleListDetails
>

export type TaskCenterImageTaskListItem = TaskCenterTaskListItemBase<
  "image",
  TaskCenterImageListDetails
>

export type TaskCenterInfographicTaskListItem = TaskCenterTaskListItemBase<
  "infographic",
  TaskCenterInfographicListDetails
>

export type TaskCenterPresentationTaskListItem = TaskCenterTaskListItemBase<
  "presentation",
  TaskCenterPresentationListDetails
>

export type TaskCenterTaskListItem =
  | TaskCenterArticleTaskListItem
  | TaskCenterImageTaskListItem
  | TaskCenterInfographicTaskListItem
  | TaskCenterPresentationTaskListItem

export interface TaskCenterTasksQuery {
  type?: TaskCenterTaskType
  article_id?: number
  status?: string
  signal?: AbortSignal
}

export interface TaskCenterArticleTaskDetail {
  id: number
  article_id: number
  exec_id: string
  operate_type: TaskCenterArticleOperateType
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
  is_settle?: boolean
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

export interface TaskCenterPresentationSlideTask {
  id: number
  presentation_log_id: number
  slide_index: number
  storycard_node_id: string
  layout_type?: string
  status: TaskCenterPresentationStatus
  error_message?: string
  image_prompt?: string
  image_url?: string
  image_task_id?: number
  retry_count?: number
  created_at?: string
  updated_at?: string
  completed_at?: string | null
}

export interface TaskCenterPresentationTaskDetail {
  id: number
  article_id: number
  storycard_id?: number
  task_kind?: string
  stage?: string
  slide_count?: number
  slide_summary?: TaskCenterPresentationSlideSummary
  slides?: TaskCenterPresentationSlideTask[]
  model_name?: string
  status: TaskCenterPresentationStatus
  error?: string
  error_message?: string
  cached?: boolean
  layouts_json?: unknown
  deck_model_json?: unknown
  render_html?: string
  ppt_url?: string
  created_at: string
  updated_at: string
  completed_at?: string | null
}

export type TaskCenterTaskDetailResponse =
  | TaskCenterArticleTaskDetail
  | TaskCenterImageTaskDetail
  | TaskCenterInfographicTaskDetail
  | TaskCenterPresentationTaskDetail

export interface TaskCenterTaskReference {
  id: number
  type: TaskCenterTaskType
}

export function getTaskCenterTaskKey(task: TaskCenterTaskReference): string {
  return `${task.type}:${task.id}`
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

export function isTaskCenterTerminalStatus(status: TaskCenterTaskStatus): boolean {
  return status === "success" || status === "failed"
}
