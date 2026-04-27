"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircleIcon, Loader2Icon, RefreshCwIcon, XIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/base/alert"
import { Button } from "@/components/ui/base/button"
import { ScrollArea } from "@/components/ui/base/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/base/select"
import { Skeleton } from "@/components/ui/base/skeleton"
import { useTaskCenterLiveTasks } from "@/lib/hooks/use-taskcenter-live-tasks"
import { isTaskCenterErrorResponse, taskCenterClient } from "@/lib/api/taskcenter/client"
import type {
  TaskCenterTaskDetailResponse,
  TaskCenterTaskListItem,
  TaskCenterTaskReference,
  TaskCenterTaskStatus,
  TaskCenterTaskType,
} from "@/lib/api/taskcenter/types"
import { getTaskCenterTaskKey } from "@/lib/api/taskcenter/types"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  TaskCenterStatusBadge,
  TaskCenterTaskDetailView,
  TaskCenterTaskTypeBadge,
  formatTaskCenterTime,
  getTaskCenterTaskSummary,
  getTaskCenterTaskTitle,
  getTaskCenterTypeIcon,
} from "./taskcenter-presenters"

const TASK_TYPE_OPTIONS: TaskCenterTaskType[] = ["article", "image", "infographic", "presentation"]

interface TaskCenterBrowserProps {
  articleId?: number
  enabled?: boolean
  realtimeScope?: "global" | "article"
  initialTaskRef?: TaskCenterTaskReference | null
  onInitialTaskHandled?: () => void
  className?: string
  showHeader?: boolean
}

interface TaskCardProps {
  task: TaskCenterTaskListItem
  selected: boolean
  removable: boolean
  onClick: () => void
  onRemove: () => void
}

function TaskCard({ task, selected, removable, onClick, onRemove }: TaskCardProps) {
  const { t } = useTranslation()
  const Icon = getTaskCenterTypeIcon(task.type)

  return (
    <div className="group relative overflow-hidden rounded-2xl">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "relative w-full rounded-2xl border px-4 py-4 text-left transition-colors",
          selected
            ? "border-primary/40 bg-primary/5 shadow-sm"
            : "border-border/70 bg-background hover:bg-muted/40"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="rounded-xl bg-muted p-2 text-muted-foreground">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <TaskCenterTaskTypeBadge type={task.type} />
                <TaskCenterStatusBadge status={task.status as TaskCenterTaskStatus} />
              </div>
              <p className="truncate text-sm font-semibold text-foreground">
                {t(`contentWriting.taskCenter.taskTitles.${getTaskCenterTaskTitle(task)}`)}
              </p>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {getTaskCenterTaskSummary(task)}
              </p>
            </div>
          </div>
          <p className="shrink-0 text-xs text-muted-foreground">
            {formatTaskCenterTime(task.created_at)}
          </p>
        </div>
      </button>
      {removable ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onRemove()
          }}
          className="absolute right-3 top-3 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full border border-border/70 bg-background/90 text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
          aria-label={t("common.delete")}
          title={t("common.delete")}
        >
          <XIcon className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  )
}

export function TaskCenterBrowser({
  articleId,
  enabled = true,
  realtimeScope = "global",
  initialTaskRef,
  onInitialTaskHandled,
  className,
  showHeader = true,
}: TaskCenterBrowserProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const router = useRouter()
  const [taskType, setTaskType] = useState<TaskCenterTaskType | "all">("all")
  const [selectedTaskRef, setSelectedTaskRef] = useState<TaskCenterTaskReference | null>(null)
  const [taskDetail, setTaskDetail] = useState<TaskCenterTaskDetailResponse | null>(null)
  const [taskDetailLoading, setTaskDetailLoading] = useState(false)
  const [taskDetailError, setTaskDetailError] = useState<string | null>(null)
  const [deletingTaskKeys, setDeletingTaskKeys] = useState<Set<string>>(new Set())

  const {
    tasks,
    loading,
    refreshing,
    error,
    refetch,
    setTasks,
  } = useTaskCenterLiveTasks({
    enabled,
    realtimeScope,
    article_id: articleId,
    type: taskType === "all" ? undefined : taskType,
  })

  const selectedTask = useMemo(
    () =>
      selectedTaskRef
        ? tasks.find((task) => task.id === selectedTaskRef.id && task.type === selectedTaskRef.type) ||
          null
        : tasks[0] || null,
    [selectedTaskRef, tasks]
  )
  const selectedTaskFingerprint = selectedTask
    ? JSON.stringify({
        id: selectedTask.id,
        type: selectedTask.type,
        status: selectedTask.status,
        details: selectedTask.details,
      })
    : null

  const fetchTaskDetail = useCallback(async (taskRef: TaskCenterTaskReference) => {
    setTaskDetailLoading(true)
    setTaskDetailError(null)

    try {
      const result = await taskCenterClient.getTaskDetail(taskRef.type, taskRef.id)

      if (isTaskCenterErrorResponse(result)) {
        setTaskDetailError(String(result.error))
        setTaskDetail(null)
        return
      }

      setTaskDetail(result)
    } catch (error) {
      console.error("[TaskCenter] Failed to fetch task detail", {
        taskRef,
        error,
      })
      setTaskDetailError(error instanceof Error ? error.message : "Failed to fetch task detail")
      setTaskDetail(null)
    } finally {
      setTaskDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    if (!selectedTask) {
      setTaskDetail(null)
      setTaskDetailError(null)
      return
    }

    const nextTaskRef = {
      id: selectedTask.id,
      type: selectedTask.type,
    } satisfies TaskCenterTaskReference

    if (
      !selectedTaskRef ||
      selectedTaskRef.id !== nextTaskRef.id ||
      selectedTaskRef.type !== nextTaskRef.type
    ) {
      setSelectedTaskRef(nextTaskRef)
    }
  }, [enabled, selectedTask, selectedTaskRef])

  useEffect(() => {
    if (!enabled || !selectedTaskRef) return
    void fetchTaskDetail(selectedTaskRef)
  }, [enabled, fetchTaskDetail, selectedTaskRef])

  useEffect(() => {
    if (!enabled || !selectedTaskRef || !selectedTaskFingerprint) return
    void fetchTaskDetail(selectedTaskRef)
  }, [enabled, fetchTaskDetail, selectedTaskFingerprint, selectedTaskRef])

  useEffect(() => {
    if (!enabled || !initialTaskRef) return

    setSelectedTaskRef(initialTaskRef)
    void fetchTaskDetail(initialTaskRef)
    onInitialTaskHandled?.()
  }, [enabled, fetchTaskDetail, initialTaskRef, onInitialTaskHandled])

  const handleOpenArticle = useCallback(
    (nextArticleId: number) => {
      router.push(`/articles/${nextArticleId}/edit`)
    },
    [router]
  )

  const handleDeleteTask = useCallback(
    async (task: TaskCenterTaskListItem) => {
      if (task.status === "success") {
        const confirmed = window.confirm(t("contentWriting.taskCenter.deleteSuccessConfirm"))
        if (!confirmed) {
          return
        }
      }

      const taskKey = getTaskCenterTaskKey({ id: task.id, type: task.type })
      let startedDeletion = false

      setDeletingTaskKeys((current) => {
        if (current.has(taskKey)) {
          return current
        }

        startedDeletion = true
        const next = new Set(current)
        next.add(taskKey)
        return next
      })

      if (!startedDeletion) {
        return
      }

      try {
        const deletionResult = await taskCenterClient.deleteTask(task.type, task.id)
        if (deletionResult) {
          toast({
            variant: "destructive",
            title: t("contentWriting.taskCenter.deleteFailed"),
            description: deletionResult.error || t("contentWriting.taskCenter.deleteFailed"),
          })
          return
        }

        setTasks((currentTasks) =>
          currentTasks.filter(
            (currentTask) => !(currentTask.id === task.id && currentTask.type === task.type)
          )
        )

        if (selectedTaskRef?.id === task.id && selectedTaskRef.type === task.type) {
          setSelectedTaskRef(null)
          setTaskDetail(null)
          setTaskDetailError(null)
          setTaskDetailLoading(false)
        }
      } catch (error) {
        const fallbackMessage = t("contentWriting.taskCenter.deleteFailed")
        toast({
          variant: "destructive",
          title: fallbackMessage,
          description: error instanceof Error ? error.message : fallbackMessage,
        })
      } finally {
        setDeletingTaskKeys((current) => {
          if (!current.has(taskKey)) {
            return current
          }

          const next = new Set(current)
          next.delete(taskKey)
          return next
        })
      }
    },
    [selectedTaskRef, setTasks, t, toast]
  )

  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-4", className)}>
      {showHeader ? (
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">{t("contentWriting.taskCenter.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {articleId
              ? t("contentWriting.taskCenter.subtitleArticle")
              : t("contentWriting.taskCenter.subtitleGlobal")}
          </p>
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Select value={taskType} onValueChange={(value) => setTaskType(value as TaskCenterTaskType | "all")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t("contentWriting.taskCenter.filters.type")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("contentWriting.taskCenter.filters.allTypes")}</SelectItem>
            {TASK_TYPE_OPTIONS.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`contentWriting.taskCenter.types.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void refetch({ silent: true })}
          disabled={loading || refreshing}
        >
          <RefreshCwIcon className={cn("h-4 w-4", refreshing ? "animate-spin" : "")} />
          {t("common.refresh")}
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
        <div className="flex min-h-[360px] min-w-0 flex-col overflow-hidden rounded-3xl border bg-muted/20">
          <div className="border-b px-4 py-3">
            <p className="text-sm font-medium text-foreground">
              {t("contentWriting.taskCenter.listTitle", { count: tasks.length })}
            </p>
          </div>

          <ScrollArea className="h-full min-h-0 flex-1">
            <div className="space-y-3 p-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-2 rounded-2xl border bg-background p-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))
              ) : tasks.length === 0 ? (
                <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed bg-background/80 p-6 text-center">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      {t("contentWriting.taskCenter.emptyTitle")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("contentWriting.taskCenter.emptyDescription")}
                    </p>
                  </div>
                </div>
              ) : (
                tasks.map((task) => {
                  const taskKey = getTaskCenterTaskKey({ id: task.id, type: task.type })
                  const removable =
                    (task.status === "success" || task.status === "failed") &&
                    !deletingTaskKeys.has(taskKey)

                  return (
                    <TaskCard
                      key={taskKey}
                      task={task}
                      selected={selectedTaskRef?.id === task.id && selectedTaskRef.type === task.type}
                      removable={removable}
                      onRemove={() => void handleDeleteTask(task)}
                      onClick={() => {
                        setSelectedTaskRef({ id: task.id, type: task.type })
                      }}
                    />
                  )
                })
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="min-h-[360px] overflow-hidden rounded-3xl border bg-background">
          <ScrollArea className="h-full">
            <div className="p-5">
              {taskDetailLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : taskDetailError ? (
                <Alert variant="destructive">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertDescription>{taskDetailError}</AlertDescription>
                </Alert>
              ) : selectedTaskRef && taskDetail ? (
                <TaskCenterTaskDetailView
                  taskRef={selectedTaskRef}
                  detail={taskDetail}
                  onSelectTask={(taskRef) => setSelectedTaskRef(taskRef)}
                  onOpenArticle={handleOpenArticle}
                />
              ) : loading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="flex min-h-[300px] items-center justify-center text-center">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      {t("contentWriting.taskCenter.selectTaskTitle")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("contentWriting.taskCenter.selectTaskDescription")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
