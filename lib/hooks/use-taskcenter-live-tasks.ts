"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { taskCenterClient } from "@/lib/api/taskcenter/client"
import type {
  TaskCenterTaskListItem,
  TaskCenterTasksQuery,
} from "@/lib/api/taskcenter/types"
import { isTaskCenterTerminalTask } from "@/lib/api/taskcenter/types"
import { useAdaptivePolling } from "@/lib/hooks/use-adaptive-polling"

interface UseTaskCenterLiveTasksOptions extends Omit<TaskCenterTasksQuery, "signal" | "page_size" | "cursor"> {
  enabled?: boolean
  realtimeScope?: "global" | "article"
  pageSize?: number
}

const DEFAULT_TASK_PAGE_SIZE = 20
const ACTIVE_TASK_POLL_INTERVAL_MS = 5000
const IDLE_TASK_POLL_INTERVAL_MS = 30_000

function dedupeTasks(tasks: TaskCenterTaskListItem[]): TaskCenterTaskListItem[] {
  const deduped = new Map<string, TaskCenterTaskListItem>()

  tasks.forEach((task) => {
    deduped.set(`${task.type}:${task.id}`, task)
  })

  return Array.from(deduped.values())
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
    async ({
      silent = false,
      signal,
    }: {
      silent?: boolean
      signal?: AbortSignal
    } = {}) => {
      if (!enabled) return null
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
          signal,
        })

        if (currentSequence !== fetchSequenceRef.current) {
          return null
        }

        if ("error" in result) {
          const nextError = "error" in result ? String(result.error) : "Failed to fetch tasks"
          setError(nextError)
          setTasks([])
          setNextCursor(null)
          setHasMore(false)
          return null
        }

        const nextTasks = dedupeTasks(result.items)
        tasksRef.current = nextTasks
        setTasks(nextTasks)
        setNextCursor(result.next_cursor ?? null)
        setHasMore(result.has_more)
        return nextTasks
      } catch (error) {
        if (currentSequence !== fetchSequenceRef.current) return null
        if (signal?.aborted) return null

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
        return null
      } finally {
        if (currentSequence === fetchSequenceRef.current) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    [enabled, pageSize, queryArticleId, querySort, queryStatus, queryType]
  )

  const {
    startPolling: startAdaptivePolling,
    stopPolling: stopAdaptivePolling,
    pollNow,
  } = useAdaptivePolling({
    poll: async ({ signal }) => {
      const refreshedTasks = await fetchTasks({ silent: true, signal })
      if (!refreshedTasks) {
        throw new Error("Failed to refresh Task Center tasks")
      }
      const hasActiveTasks = refreshedTasks.some(
        (task) => !isTaskCenterTerminalTask(task)
      )

      return {
        action: "continue",
        delayMs: hasActiveTasks
          ? ACTIVE_TASK_POLL_INTERVAL_MS
          : IDLE_TASK_POLL_INTERVAL_MS,
      }
    },
    policy: {
      timeoutMs: Number.POSITIVE_INFINITY,
    },
    debugLabel: `taskcenter:${realtimeScope}`,
  })

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
    if (!enabled) {
      stopAdaptivePolling()
      return
    }

    startAdaptivePolling({ immediate: false })
    return stopAdaptivePolling
  }, [enabled, startAdaptivePolling, stopAdaptivePolling])

  const refetch = useCallback(async (options: { silent?: boolean; signal?: AbortSignal } = {}) => {
    await fetchTasks(options)
  }, [fetchTasks])

  return {
    tasks,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    refetch,
    pollNow,
    loadMore,
    setTasks,
  }
}
