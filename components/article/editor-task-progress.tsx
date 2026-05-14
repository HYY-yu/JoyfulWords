"use client"

import { useEffect, useState } from "react"
import {
  XIcon,
  CheckIcon,
  AlertCircleIcon,
  LoaderIcon,
  ImageIcon,
  ClipboardListIcon,
  PaletteIcon,
  PencilIcon,
  LayersIcon,
  Presentation,
  BarChart3Icon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/i18n-context"

export type TaskType = "image-generation" | "task-center" | "local"
export type TaskStatus = "pending" | "completed" | "failed"

export interface TaskItem {
  id: string
  type: TaskType
  status: TaskStatus
  label: string
  description: string
  startedAt: number
  removable?: boolean
  taskCenterData?: any
  originalType?: string
}

interface EditorTaskProgressProps {
  imageGenerationTasks?: TaskItem[]
  localTasks?: TaskItem[]
  taskCenterTasks?: TaskItem[]
  showHeader?: boolean
  onRemoveTask: (task: TaskItem) => void
  onClickTask: (task: TaskItem) => void
}

function getTimeAgo(timestampMs: number): string {
  const diffMs = Date.now() - timestampMs
  const seconds = Math.floor(diffMs / 1000)

  if (seconds < 60) {
    return `${seconds}秒前`
  }
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes}分钟前`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}小时前`
  }

  const date = new Date(timestampMs)
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface TaskCardProps {
  task: TaskItem
  onRemove: () => void
  onClick: () => void
}

function TaskCard({ task, onRemove, onClick }: TaskCardProps) {
  const { t } = useTranslation()

  const isDone = task.status === "completed" || task.status === "failed"
  const canDelete =
    isDone &&
    task.removable !== false &&
    (task.type === "task-center" || task.type === "local")

  const statusIcon = () => {
    if (task.status === "completed") {
      return <CheckIcon className="w-4 h-4 shrink-0 text-green-500" />
    }
    if (task.status === "failed") {
      return <AlertCircleIcon className="w-4 h-4 shrink-0 text-red-500" />
    }
    return <LoaderIcon className="w-4 h-4 shrink-0 animate-spin text-[var(--jw-accent)]" />
  }

  const typeIcon = (() => {
    if (task.type === "image-generation") {
      return <ImageIcon className="h-4 w-4 shrink-0" />
    }
    switch (task.originalType) {
      case "image":
        return <ImageIcon className="h-4 w-4 shrink-0" />
      case "infographic":
        return <LayersIcon className="h-4 w-4 shrink-0" />
      case "presentation":
        return <Presentation className="h-4 w-4 shrink-0" />
      case "echarts":
        return <BarChart3Icon className="h-4 w-4 shrink-0" />
      case "article":
        return <PencilIcon className="h-4 w-4 shrink-0" />
      default:
        return <ClipboardListIcon className="h-4 w-4 shrink-0" />
    }
  })()

  const borderClass = cn(
    "group relative cursor-pointer rounded-lg border bg-[var(--jw-task-card-bg)] p-3 shadow-[0_10px_24px_-22px_rgba(0,0,0,0.28)] transition-colors",
    task.status === "pending" && "border-[var(--jw-task-card-border)] hover:bg-[var(--jw-task-card-hover-bg)]",
    task.status === "completed" && "border-emerald-200/80 hover:bg-emerald-50/45",
    task.status === "failed" && "border-red-200/80 hover:bg-red-50/45"
  )

  return (
    <div className={borderClass} onClick={onClick}>
      <div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              task.status === "pending" && "text-[var(--jw-accent)]",
              task.status === "completed" && "text-green-500",
              task.status === "failed" && "text-red-500"
            )}
          >
            {typeIcon}
          </span>

          <span className="flex-1 truncate text-xs font-semibold">{task.label}</span>

          <span className={cn("shrink-0 transition-opacity", canDelete ? "group-hover:opacity-0" : undefined)}>
            {statusIcon()}
          </span>
        </div>

        {task.description ? (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {task.description}
          </p>
        ) : null}

        <p className="mt-1.5 text-[10px] text-muted-foreground/70">{getTimeAgo(task.startedAt)}</p>
      </div>

      {canDelete ? (
        <button
          type="button"
          className="absolute right-2 top-2 z-10 inline-flex items-center justify-center text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
          onClick={(event) => {
            event.stopPropagation()
            onRemove()
          }}
          title={t("contentWriting.taskProgress.removeTask")}
          aria-label={t("contentWriting.taskProgress.removeTask")}
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  )
}

export function EditorTaskProgress(props: EditorTaskProgressProps) {
  const {
    imageGenerationTasks = [],
    localTasks = [],
    taskCenterTasks,
    showHeader = true,
    onRemoveTask,
    onClickTask,
  } = props
  const { t } = useTranslation()

  const allTasks: TaskItem[] = [...localTasks, ...imageGenerationTasks, ...(taskCenterTasks || [])]
  allTasks.sort((a, b) => b.startedAt - a.startedAt)

  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  if (allTasks.length === 0) {
    return (
      <div className="jw-task-empty mx-3 flex h-40 flex-col items-center justify-center gap-2 rounded-lg">
        <CheckIcon className="h-8 w-8 opacity-30" />
        <p className="text-sm">{t("contentWriting.taskProgress.empty")}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {showHeader ? (
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("contentWriting.taskProgress.title")}
          <span className="ml-1 text-foreground/70">({allTasks.length})</span>
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        {allTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onRemove={() => onRemoveTask(task)}
            onClick={() => onClickTask(task)}
          />
        ))}
      </div>
    </div>
  )
}
