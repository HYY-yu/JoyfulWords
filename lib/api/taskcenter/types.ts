"use client"

export const TASK_CENTER_TASK_TYPES = ["article", "image", "infographic"] as const

export type TaskCenterTaskType = (typeof TASK_CENTER_TASK_TYPES)[number]

export type TaskCenterArticleStatus = "edit_doing" | "edit"
export type TaskCenterImageStatus = "pending" | "processing" | "success" | "failed"
export type TaskCenterInfographicStatus = "processing" | "success" | "failed"

export type TaskCenterTaskStatus =
  | TaskCenterArticleStatus
  | TaskCenterImageStatus
  | TaskCenterInfographicStatus

export interface TaskCenterArticleListDetails {
  article_id: number
  exec_id: string
  is_settle: boolean
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

export type TaskCenterTaskListDetails =
  | TaskCenterArticleListDetails
  | TaskCenterImageListDetails
  | TaskCenterInfographicListDetails

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

export type TaskCenterTaskListItem =
  | TaskCenterArticleTaskListItem
  | TaskCenterImageTaskListItem
  | TaskCenterInfographicTaskListItem

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
  operate_type: TaskCenterArticleStatus
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

export type TaskCenterTaskDetailResponse =
  | TaskCenterArticleTaskDetail
  | TaskCenterImageTaskDetail
  | TaskCenterInfographicTaskDetail

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
  return status === "edit" || status === "success" || status === "failed"
}
