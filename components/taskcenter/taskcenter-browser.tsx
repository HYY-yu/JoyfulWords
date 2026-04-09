"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircleIcon, Loader2Icon, RefreshCwIcon } from "lucide-react"
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
import { taskCenterClient } from "@/lib/api/taskcenter/client"
import type {
  TaskCenterTaskDetailResponse,
  TaskCenterTaskListItem,
  TaskCenterTaskReference,
  TaskCenterTaskStatus,
  TaskCenterTaskType,
} from "@/lib/api/taskcenter/types"
import { getTaskCenterTaskKey } from "@/lib/api/taskcenter/types"
import { useTranslation } from "@/lib/i18n/i18n-context"
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

const TASK_TYPE_OPTIONS: TaskCenterTaskType[] = ["article", "image", "infographic"]

interface TaskCenterBrowserProps {
  articleId?: number
  enabled?: boolean
  realtimeScope?: "global" | "article"
  initialTaskRef?: TaskCenterTaskReference | null
  onInitialTaskHandled?: () => void
  className?: string
  showHeader?: boolean
}

function TaskCard({
  task,
  selected,
  onClick,
}: {
  task: TaskCenterTaskListItem
  selected: boolean
  onClick: () => void
}) {
  const { t } = useTranslation()
  const Icon = getTaskCenterTypeIcon(task.type)

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border px-4 py-4 text-left transition-colors",
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
  const router = useRouter()
  const [taskType, setTaskType] = useState<TaskCenterTaskType | "all">("all")
  const [selectedTaskRef, setSelectedTaskRef] = useState<TaskCenterTaskReference | null>(null)
  const [taskDetail, setTaskDetail] = useState<TaskCenterTaskDetailResponse | null>(null)
  const [taskDetailLoading, setTaskDetailLoading] = useState(false)
  const [taskDetailError, setTaskDetailError] = useState<string | null>(null)

  const {
    tasks,
    loading,
    refreshing,
    error,
    refetch,
  } = useTaskCenterLiveTasks({
    enabled,
    realtimeScope,
    article_id: articleId,
    type: taskType === "all" ? undefined : taskType,
  })

  const selectedTask = useMemo(
    () =>
      selectedTaskRef
        ? tasks.find(
            (task) =>
              task.id === selectedTaskRef.id && task.type === selectedTaskRef.type
          ) ||
          tasks.find(
            (task) =>
              task.id === selectedTaskRef.id && task.type === selectedTaskRef.type
          ) ||
          null
        : tasks[0] || null,
    [selectedTaskRef, tasks]
  )

  const fetchTaskDetail = useCallback(async (taskRef: TaskCenterTaskReference) => {
    setTaskDetailLoading(true)
    setTaskDetailError(null)

    try {
      const result = await taskCenterClient.getTaskDetail(taskRef.type, taskRef.id)

      if ("error" in result) {
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
                tasks.map((task) => (
                  <TaskCard
                    key={getTaskCenterTaskKey({ id: task.id, type: task.type })}
                    task={task}
                    selected={
                      selectedTaskRef?.id === task.id && selectedTaskRef.type === task.type
                    }
                    onClick={() => {
                      setSelectedTaskRef({ id: task.id, type: task.type })
                    }}
                  />
                ))
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
