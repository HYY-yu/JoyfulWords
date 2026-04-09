"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { taskCenterClient } from "@/lib/api/taskcenter/client"
import type {
  TaskCenterTaskListItem,
  TaskCenterTasksQuery,
} from "@/lib/api/taskcenter/types"
import { webSocketService, type TaskSocketEvent } from "@/lib/websocket/websocket-service"

interface UseTaskCenterLiveTasksOptions extends Omit<TaskCenterTasksQuery, "signal"> {
  enabled?: boolean
  realtimeScope?: "global" | "article"
}

function dedupeTasks(tasks: TaskCenterTaskListItem[]): TaskCenterTaskListItem[] {
  const deduped = new Map<string, TaskCenterTaskListItem>()

  tasks.forEach((task) => {
    deduped.set(`${task.type}:${task.id}`, task)
  })

  return Array.from(deduped.values())
}

function mergeTaskFromSocketEvent(
  currentTask: TaskCenterTaskListItem,
  event: TaskSocketEvent
): TaskCenterTaskListItem {
  const mergedDetails =
    event.payload.outputs && typeof event.payload.outputs === "object"
      ? {
          ...currentTask.details,
          ...event.payload.outputs,
        }
      : currentTask.details

  return {
    ...currentTask,
    status: event.payload.status as TaskCenterTaskListItem["status"],
    details: mergedDetails as TaskCenterTaskListItem["details"],
  } as TaskCenterTaskListItem
}

export function useTaskCenterLiveTasks({
  enabled = true,
  realtimeScope = "global",
  ...query
}: UseTaskCenterLiveTasksOptions) {
  const queryType = query.type
  const queryArticleId = query.article_id
  const queryStatus = query.status
  const [tasks, setTasks] = useState<TaskCenterTaskListItem[]>([])
  const [loading, setLoading] = useState(enabled)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchSequenceRef = useRef(0)

  const fetchTasks = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!enabled) return
      const currentSequence = ++fetchSequenceRef.current

      if (silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      try {
        const result = await taskCenterClient.getTasks({
          type: queryType,
          article_id: queryArticleId,
          status: queryStatus,
        })

        if (currentSequence !== fetchSequenceRef.current) {
          return
        }

        if (!Array.isArray(result)) {
          const nextError = "error" in result ? String(result.error) : "Failed to fetch tasks"
          setError(nextError)
          setTasks([])
          return
        }

        setTasks(dedupeTasks(result))
      } catch (error) {
        if (currentSequence !== fetchSequenceRef.current) return

        const nextError = error instanceof Error ? error.message : "Failed to fetch tasks"
        console.error("[TaskCenter] Failed to fetch tasks", {
          query: {
            type: queryType,
            article_id: queryArticleId,
            status: queryStatus,
          },
          error,
        })
        setError(nextError)
      } finally {
        if (currentSequence === fetchSequenceRef.current) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    [enabled, queryArticleId, queryStatus, queryType]
  )

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    void fetchTasks()

    return () => {
      fetchSequenceRef.current += 1
    }
  }, [enabled, fetchTasks])

  useEffect(() => {
    if (!enabled) return

    const token = localStorage.getItem("access_token")
    const articleId = typeof queryArticleId === "number" ? queryArticleId : null
    const eventName =
      realtimeScope === "article" && articleId
        ? `task:event:article:${articleId}`
        : "task:event"
    const reconnectEventName =
      realtimeScope === "article" && articleId
        ? `connection:reconnected:article:${articleId}`
        : "connection:reconnected"

    if (realtimeScope === "article" && articleId && token) {
      webSocketService.ensureArticleConnection(articleId, token)
    }

    const handleTaskEvent = (event: TaskSocketEvent) => {
      setTasks((currentTasks) => {
        const taskIndex = currentTasks.findIndex(
          (task) => task.id === event.payload.task_id && task.type === event.payload.task_type
        )

        if (taskIndex === -1) {
          void fetchTasks({ silent: true })
          return currentTasks
        }

        const nextTasks = [...currentTasks]
        nextTasks[taskIndex] = mergeTaskFromSocketEvent(nextTasks[taskIndex], event)
        return dedupeTasks(nextTasks)
      })
    }

    const handleReconnect = () => {
      console.info("[TaskCenter] Refetching after websocket reconnect", {
        realtimeScope,
        articleId,
      })
      void fetchTasks({ silent: true })
    }

    webSocketService.on(eventName, handleTaskEvent)
    webSocketService.on(reconnectEventName, handleReconnect)

    return () => {
      webSocketService.off(eventName, handleTaskEvent)
      webSocketService.off(reconnectEventName, handleReconnect)

      if (realtimeScope === "article" && articleId) {
        webSocketService.releaseArticleConnection(articleId)
      }
    }
  }, [enabled, fetchTasks, queryArticleId, realtimeScope])

  return {
    tasks,
    loading,
    refreshing,
    error,
    refetch: fetchTasks,
    setTasks,
  }
}
