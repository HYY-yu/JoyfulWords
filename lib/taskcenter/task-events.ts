"use client"

import type { TaskCenterTaskType } from "@/lib/api/taskcenter/types"

const TASK_CENTER_TASK_SUBMITTED_EVENT = "joyfulwords-taskcenter-task-submitted"

export interface TaskCenterTaskSubmittedDetail {
  type: TaskCenterTaskType
  taskId?: number | string
  articleId?: number | null
}

export function notifyTaskCenterTaskSubmitted(detail: TaskCenterTaskSubmittedDetail): void {
  if (typeof window === "undefined") return

  window.dispatchEvent(
    new CustomEvent<TaskCenterTaskSubmittedDetail>(TASK_CENTER_TASK_SUBMITTED_EVENT, {
      detail,
    })
  )
}

export function subscribeTaskCenterTaskSubmitted(
  listener: (detail: TaskCenterTaskSubmittedDetail) => void
): () => void {
  if (typeof window === "undefined") return () => undefined

  const handleTaskSubmitted = (event: Event) => {
    listener((event as CustomEvent<TaskCenterTaskSubmittedDetail>).detail)
  }

  window.addEventListener(TASK_CENTER_TASK_SUBMITTED_EVENT, handleTaskSubmitted)
  return () => {
    window.removeEventListener(TASK_CENTER_TASK_SUBMITTED_EVENT, handleTaskSubmitted)
  }
}
