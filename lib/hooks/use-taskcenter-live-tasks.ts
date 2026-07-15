"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { taskCenterClient } from "@/lib/api/taskcenter/client"
import type {
  TaskCenterTaskListItem,
  TaskCenterTasksQuery,
} from "@/lib/api/taskcenter/types"
import {
  shouldRefetchPresentationTask,
  webSocketService,
  type TaskSocketEvent,
} from "@/lib/websocket/websocket-service"
import { tokenStore } from "@/lib/tokens/token-store"

interface UseTaskCenterLiveTasksOptions extends Omit<TaskCenterTasksQuery, "signal" | "page_size" | "cursor"> {
  enabled?: boolean
  realtimeScope?: "global" | "article"
  pageSize?: number
}

const DEFAULT_TASK_PAGE_SIZE = 20

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
  const socketDetails = {
    ...(event.payload.outputs && typeof event.payload.outputs === "object"
      ? event.payload.outputs
      : {}),
    ...(event.payload.error_code ? { error_code: event.payload.error_code } : {}),
  }
  const mergedDetails =
    Object.keys(socketDetails).length > 0
      ? {
          ...currentTask.details,
          ...socketDetails,
        }
      : currentTask.details

  const nextDetails =
    event.payload.error && mergedDetails && typeof mergedDetails === "object"
      ? {
          ...mergedDetails,
          error: event.payload.error,
        }
      : mergedDetails

  return {
    ...currentTask,
    status: event.payload.status as TaskCenterTaskListItem["status"],
    details: nextDetails as TaskCenterTaskListItem["details"],
  } as TaskCenterTaskListItem
}

export function useTaskCenterLiveTasks({
  enabled = true,
  realtimeScope = "global",
  pageSize = DEFAULT_TASK_PAGE_SIZE,
  ...query
}: UseTaskCenterLiveTasksOptions) {
  const queryType = query.type
  const queryArticleId = query.article_id
  const queryStatus = query.status
  const querySort = query.sort ?? "recent"
  const [tasks, setTasks] = useState<TaskCenterTaskListItem[]>([])
  const [loading, setLoading] = useState(enabled)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchSequenceRef = useRef(0)
  const tasksRef = useRef<TaskCenterTaskListItem[]>([])

  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

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
          sort: querySort,
          page_size: silent ? Math.max(pageSize, tasksRef.current.length || pageSize) : pageSize,
        })

        if (currentSequence !== fetchSequenceRef.current) {
          return
        }

        if ("error" in result) {
          const nextError = "error" in result ? String(result.error) : "Failed to fetch tasks"
          setError(nextError)
          setTasks([])
          setNextCursor(null)
          setHasMore(false)
          return
        }

        setTasks(dedupeTasks(result.items))
        setNextCursor(result.next_cursor ?? null)
        setHasMore(result.has_more)
      } catch (error) {
        if (currentSequence !== fetchSequenceRef.current) return

        const nextError = error instanceof Error ? error.message : "Failed to fetch tasks"
        console.error("[TaskCenter] Failed to fetch tasks", {
          query: {
            type: queryType,
            article_id: queryArticleId,
            status: queryStatus,
            sort: querySort,
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
    [enabled, pageSize, queryArticleId, querySort, queryStatus, queryType]
  )

  const loadMore = useCallback(async () => {
    if (!enabled || loading || refreshing || loadingMore || !hasMore || !nextCursor) {
      return
    }

    const currentSequence = fetchSequenceRef.current
    setLoadingMore(true)
    setError(null)

    try {
      const result = await taskCenterClient.getTasks({
        type: queryType,
        article_id: queryArticleId,
        status: queryStatus,
        sort: querySort,
        page_size: pageSize,
        cursor: nextCursor,
      })

      if (currentSequence !== fetchSequenceRef.current) {
        return
      }

      if ("error" in result) {
        setError(String(result.error))
        return
      }

      setTasks((currentTasks) => dedupeTasks([...currentTasks, ...result.items]))
      setNextCursor(result.next_cursor ?? null)
      setHasMore(result.has_more)
    } catch (error) {
      const nextError = error instanceof Error ? error.message : "Failed to fetch tasks"
      console.error("[TaskCenter] Failed to load more tasks", {
        query: {
          type: queryType,
          article_id: queryArticleId,
          status: queryStatus,
          sort: querySort,
          cursor: nextCursor,
        },
        error,
      })
      setError(nextError)
    } finally {
      setLoadingMore(false)
    }
  }, [
    enabled,
    hasMore,
    loading,
    loadingMore,
    nextCursor,
    pageSize,
    queryArticleId,
    querySort,
    queryStatus,
    queryType,
    refreshing,
  ])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      setLoadingMore(false)
      setNextCursor(null)
      setHasMore(false)
      return
    }

    void fetchTasks()

    return () => {
      fetchSequenceRef.current += 1
    }
  }, [enabled, fetchTasks])

  useEffect(() => {
    if (!enabled) return

    const token = tokenStore.getAccessToken()
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
      if (queryType && event.payload.task_type !== queryType) return
      if (
        typeof queryArticleId === "number" &&
        typeof event.payload.article_id === "number" &&
        event.payload.article_id !== queryArticleId
      ) {
        return
      }

      if (shouldRefetchPresentationTask(event)) {
        console.debug("[TaskCenter] Refetching presentation task after websocket event", {
          taskId: event.payload.task_id,
          messageType: event.messageType,
          status: event.payload.status,
        })
        // Presentation socket payloads are refresh signals. The TaskCenter API remains
        // the source of truth for all three update/complete/failed message types.
        void fetchTasks({ silent: true })
        return
      }

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
  }, [enabled, fetchTasks, queryArticleId, queryType, realtimeScope])

  return {
    tasks,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    refetch: fetchTasks,
    loadMore,
    setTasks,
  }
}
