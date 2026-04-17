"use client"

import { useEffect, useState } from "react"
import { XIcon, CheckIcon, AlertCircleIcon, LoaderIcon, ImageIcon, ClipboardListIcon, RefreshCwIcon, PaletteIcon, PencilIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/i18n-context"

// ---- Types ----

export type TaskType = "image-generation" | "task-center"
export type TaskStatus = "pending" | "completed" | "failed"

export interface TaskItem {
    id: string
    type: TaskType
    status: TaskStatus
    label: string
    description: string
    startedAt: number
    removable?: boolean
    taskCenterData?: any // 存储任务中心任务的原始数据
    originalType?: string // 存储原始任务类型（image, article, infographic）
}

interface EditorTaskProgressProps {
    imageGenerationTasks?: TaskItem[]
    taskCenterTasks?: TaskItem[]
    onRemoveTask: (id: string, type: TaskType) => void
    onClickTask: (task: TaskItem) => void
}

// ---- Helpers ----

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
    // 超过24小时，显示具体日期
    const date = new Date(timestampMs)
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

interface TaskCardProps {
    task: TaskItem
    onRemove: () => void
    onClick: () => void
}

function TaskCard({ task, onRemove, onClick }: TaskCardProps) {
    const { t } = useTranslation()
    const [hovered, setHovered] = useState(false)

    const isDone = task.status === "completed" || task.status === "failed"
    const typeIcon =
        task.type === "image-generation" ? (
            <ImageIcon className="w-4 h-4 shrink-0" />
        ) : task.type === "task-center" && task.originalType === "image" ? (
            task.taskCenterData?.details?.gen_mode === 'split_images' || task.taskCenterData?.detail?.gen_mode === 'split_images' || task.taskCenterData?.gen_mode === 'split_images' ? (
                <RefreshCwIcon className="w-4 h-4 shrink-0" />
            ) : task.taskCenterData?.details?.gen_mode === 'creator' || task.taskCenterData?.detail?.gen_mode === 'creator' || task.taskCenterData?.gen_mode === 'creator' ? (
                <ImageIcon className="w-4 h-4 shrink-0" />
            ) : task.taskCenterData?.details?.gen_mode === 'style' || task.taskCenterData?.detail?.gen_mode === 'style' || task.taskCenterData?.gen_mode === 'style' ? (
                <PaletteIcon className="w-4 h-4 shrink-0" />
            ) : (
                <ImageIcon className="w-4 h-4 shrink-0" />
            )
        ) : task.type === "task-center" && task.originalType === "article" ? (
            <PencilIcon className="w-4 h-4 shrink-0" />
        ) : task.type === "task-center" && task.originalType === "infographic" ? (
            <ClipboardListIcon className="w-4 h-4 shrink-0" />
        ) : (
            <ClipboardListIcon className="w-4 h-4 shrink-0" />
        )

    const statusIcon = () => {
        if (task.status === "completed") {
            return <CheckIcon className="w-4 h-4 shrink-0 text-green-500" />
        }
        if (task.status === "failed") {
            return <AlertCircleIcon className="w-4 h-4 shrink-0 text-red-500" />
        }
        return (
            <LoaderIcon className="w-4 h-4 shrink-0 animate-spin text-blue-500" />
        )
    }

    const borderClass = cn(
        "rounded-lg border p-3 cursor-pointer transition-colors relative",
        task.status === "pending" && "border-blue-200 bg-blue-50/50 hover:bg-blue-50",
        task.status === "completed" && "border-green-200 bg-green-50/50 hover:bg-green-50",
        task.status === "failed" && "border-red-200 bg-red-50/50 hover:bg-red-50"
    )

  return (
        <div
            className={borderClass}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Header row */}
            <div className="flex items-center gap-2">
                {/* Type icon */}
                <span
                    className={cn(
                        task.status === "pending" && "text-blue-500",
                        task.status === "completed" && "text-green-500",
                        task.status === "failed" && "text-red-500"
                    )}
                >
                    {typeIcon}
                </span>

                {/* Label */}
                <span className="text-xs font-semibold flex-1 truncate">
                    {task.label}
                </span>

                {/* Right side: status icon or delete button */}
                {isDone && hovered && task.removable !== false ? (
                    <button
                        type="button"
                        className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => {
                            e.stopPropagation()
                            onRemove()
                        }}
                        title={t("contentWriting.taskProgress.removeTask")}
                    >
                        <XIcon className="w-3.5 h-3.5" />
                    </button>
                ) : (
                    statusIcon()
                )}
            </div>

            {/* Description (truncated) */}
            {task.description && (
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {task.description}
                </p>
            )}

            {/* 移除进度条展示 */}

            {/* Time ago */}
            <p className="mt-1.5 text-[10px] text-muted-foreground/70">
                {getTimeAgo(task.startedAt)}
            </p>
        </div>
    )
}

// ---- Main Component ----

export function EditorTaskProgress(props: EditorTaskProgressProps) {
    const { imageGenerationTasks = [], taskCenterTasks, onRemoveTask, onClickTask } = props
    const { t } = useTranslation()

    // Merge all tasks
    const allTasks: TaskItem[] = [...imageGenerationTasks, ...(taskCenterTasks || [])]

    // Sort newest first
    allTasks.sort((a, b) => b.startedAt - a.startedAt)

    // Re-render every second to keep time-ago fresh
    const [, setTick] = useState(0)
    // 用于触发任务列表更新的状态
    useEffect(() => {
        const interval = setInterval(() => setTick((n) => n + 1), 1000)
        return () => clearInterval(interval)
    }, [])

    if (allTasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
                <CheckIcon className="w-8 h-8 opacity-30" />
                <p className="text-sm">{t("contentWriting.taskProgress.empty")}</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-2 p-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("contentWriting.taskProgress.title")}
                <span className="ml-1 text-foreground/70">({allTasks.length})</span>
            </p>

            <div className="flex flex-col gap-2">
                {allTasks.map((task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onRemove={() => onRemoveTask(task.id, task.type)}
                        onClick={() => onClickTask(task)}
                    />
                ))}
            </div>
        </div>
    )
}
