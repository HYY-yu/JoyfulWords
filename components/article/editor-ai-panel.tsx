"use client"

import { CreatorMode } from "@/components/image-generator/creator-mode"
import { InversionMode } from "@/components/image-generator/modes/inversion-mode"
import { StyleMode } from "@/components/image-generator/modes/style-mode"
import {
  TaskCenterTaskDetailView,
  getTaskCenterTaskSummary,
  getTaskCenterTaskTitle,
} from "@/components/taskcenter/taskcenter-presenters"
import { AIFeatureDialogShell } from "@/components/ui/ai/ai-feature-dialog-shell"
import { ArticleAIHelpDialog } from "@/components/article/article-ai-help-dialog"
import { Alert, AlertDescription } from "@/components/ui/base/alert"
import { Button } from "@/components/ui/base/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/base/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/base/tooltip"
import { useToast } from "@/hooks/use-toast"
import { imageGenerationClient } from "@/lib/api/image-generation/client"
import { infographicsClient } from "@/lib/api/infographics/client"
import { isTaskCenterErrorResponse, taskCenterClient } from "@/lib/api/taskcenter/client"
import type {
  TaskCenterEChartsTaskListItem,
  TaskCenterTaskDetailResponse,
  TaskCenterTaskListItem,
  TaskCenterTaskReference,
} from "@/lib/api/taskcenter/types"
import { getTaskCenterTaskKey } from "@/lib/api/taskcenter/types"
import {
  clearEChartsArticleAnalysisSession,
  loadEChartsArticleAnalysisSession,
  saveEChartsArticleAnalysisSession,
  type EChartsArticleAnalysisSession,
} from "@/lib/echarts/article-analysis-session"
import { useTaskCenterLiveTasks } from "@/lib/hooks/use-taskcenter-live-tasks"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { cn } from "@/lib/utils"
import {
  BrainCircuitIcon,
  BarChart3Icon,
  ChartNoAxesCombinedIcon,
  GalleryHorizontalEndIcon,
  ImagePlusIcon,
  LoaderIcon,
  PaletteIcon,
  PresentationIcon,
  PenLineIcon,
  SparklesIcon,
  WandSparklesIcon
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState, type ReactNode, type UIEvent } from "react"
import { EditorTaskProgress, type TaskItem } from "./editor-task-progress"
import { InfographicDialog } from "./infographic-dialog"
import { PresentationDialog } from "./presentation-dialog"
import { EChartsDialog } from "./echarts-dialog"

type ActiveDialog =
  | "ai-edit"
  | "ai-write"
  | "mindmap"
  | "create-image"
  | "reversal-mode"
  | "image-style"
  | "infographic"
  | "echarts"
  | "presentation"
  | null

interface FeatureButton {
  id: ActiveDialog
  labelKey: string
  icon: React.ElementType
  bgColor: string
  iconColor: string
  groupKey: "writing" | "visual" | "structure"
  disabled?: boolean
  tooltipKey?: string
}

const FEATURE_GROUPS = [
  {
    id: "writing",
    titleKey: "tiptapEditor.aiPanel.groups.writing",
  },
  {
    id: "visual",
    titleKey: "tiptapEditor.aiPanel.groups.visual",
  },
  {
    id: "structure",
    titleKey: "tiptapEditor.aiPanel.groups.structure",
  },
] as const

const FEATURE_BUTTONS: FeatureButton[] = [
  {
    id: "ai-edit",
    labelKey: "tiptapEditor.aiPanel.aiEdit",
    icon: WandSparklesIcon,
    bgColor: "bg-[var(--jw-accent-soft)] ring-[var(--jw-action-hover-border)]",
    iconColor: "text-[var(--jw-accent)]",
    groupKey: "writing",
  },
  {
    id: "ai-write",
    labelKey: "tiptapEditor.aiPanel.aiWrite",
    icon: PenLineIcon,
    bgColor: "bg-[var(--jw-accent-soft)] ring-[var(--jw-action-hover-border)]",
    iconColor: "text-[var(--jw-accent)]",
    groupKey: "writing",
  },
  {
    id: "mindmap",
    labelKey: "tiptapEditor.aiPanel.mindmap",
    icon: BrainCircuitIcon,
    bgColor: "bg-[var(--jw-accent-soft)] ring-[var(--jw-action-hover-border)]",
    iconColor: "text-[var(--jw-accent)]",
    groupKey: "structure",
  },
  {
    id: "create-image",
    labelKey: "tiptapEditor.aiPanel.createImage",
    icon: ImagePlusIcon,
    bgColor: "bg-[var(--jw-accent-soft)] ring-[var(--jw-action-hover-border)]",
    iconColor: "text-[var(--jw-accent)]",
    groupKey: "visual",
  },
  {
    id: "reversal-mode",
    labelKey: "tiptapEditor.aiPanel.reversalMode",
    icon: GalleryHorizontalEndIcon,
    bgColor: "bg-[var(--jw-accent-soft)] ring-[var(--jw-action-hover-border)]",
    iconColor: "text-[var(--jw-accent)]",
    groupKey: "visual",
  },
  {
    id: "image-style",
    labelKey: "tiptapEditor.aiPanel.imageStyle",
    icon: PaletteIcon,
    bgColor: "bg-[var(--jw-accent-soft)] ring-[var(--jw-action-hover-border)]",
    iconColor: "text-[var(--jw-accent)]",
    groupKey: "visual",
  },
  {
    id: "infographic",
    labelKey: "tiptapEditor.aiPanel.infographic",
    icon: ChartNoAxesCombinedIcon,
    bgColor: "bg-[var(--jw-accent-soft)] ring-[var(--jw-action-hover-border)]",
    iconColor: "text-[var(--jw-accent)]",
    groupKey: "structure",
  },
  {
    id: "echarts",
    labelKey: "tiptapEditor.aiPanel.aiCharts",
    icon: BarChart3Icon,
    bgColor: "bg-[var(--jw-accent-soft)] ring-[var(--jw-action-hover-border)]",
    iconColor: "text-[var(--jw-accent)]",
    groupKey: "structure",
  },
  {
    id: "presentation",
    labelKey: "tiptapEditor.aiPanel.generatePpt",
    icon: PresentationIcon,
    bgColor: "bg-[var(--jw-accent-soft)] ring-[var(--jw-action-hover-border)]",
    iconColor: "text-[var(--jw-accent)]",
    groupKey: "structure",
  },
]

function getCaughtErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message || fallback
  }

  if (typeof error === "string") {
    return error || fallback
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string" && message) {
      return message
    }
  }

  try {
    return JSON.stringify(error) || fallback
  } catch {
    return String(error) || fallback
  }
}

interface EditorAIPanelProps {
  articleId?: number | null
  submissionTick?: number
  onOpenArticleEditTask: (taskRef: TaskCenterTaskReference) => void
}

function mapTaskCenterTaskToProgressItem(
  task: TaskCenterTaskListItem,
  t: (key: string) => string,
  removable = true
): TaskItem {
  const status =
    task.status === "success" || task.status === "succeeded"
      ? "completed"
      : task.status === "failed"
      ? "failed"
      : "pending"

  return {
    id: `${task.type}-${task.id}`,
    type: "task-center",
    status,
    label: t(`contentWriting.taskCenter.taskTitles.${getTaskCenterTaskTitle(task)}`),
    description: getTaskCenterTaskSummary(task, t),
    startedAt: new Date(task.created_at).getTime(),
    removable: removable && (task.status === "success" || task.status === "succeeded" || task.status === "failed"),
    taskCenterData: task,
    originalType: task.type,
  }
}

function isArticleEditTask(task: TaskCenterTaskListItem): boolean {
  if (task.type !== "article") return false

  if (task.details.operate_type === "writer" || task.details.operation_type) {
    return false
  }

  return true
}

function mapEChartsArticleAnalysisToTaskItem(
  session: EChartsArticleAnalysisSession,
  t: (key: string, params?: Record<string, any>) => string
): TaskItem | null {
  const hasTaskRefs = (session.taskRefs?.length ?? 0) > 0
  if (session.status === "submitted" && hasTaskRefs) return null

  const status =
    session.status === "failed"
      ? "failed"
      : session.status === "empty"
      ? "completed"
      : "pending"

  const description =
    session.status === "submitting"
      ? t("echarts.dialog.analysisTaskDescription", { count: session.maxCharts })
      : session.status === "submitted"
      ? t("echarts.dialog.analysisSyncingDescription")
      : session.status === "empty"
      ? t("echarts.dialog.noChartsDescription")
      : session.errorMessage || t("echarts.dialog.analysisFailedDescription")

  return {
    id: `echarts-article-analysis-${session.requestId}`,
    type: "local",
    status,
    label: t("echarts.dialog.articleMode"),
    description,
    startedAt: session.startedAt,
    removable: session.status === "failed" || session.status === "empty",
    originalType: "echarts",
  }
}

function mergeTaskCenterTasks(
  currentTasks: TaskCenterTaskListItem[],
  incomingTasks: TaskCenterEChartsTaskListItem[]
): TaskCenterTaskListItem[] {
  if (incomingTasks.length === 0) return currentTasks

  const nextTasks = new Map<string, TaskCenterTaskListItem>()
  currentTasks.forEach((task) => {
    nextTasks.set(getTaskCenterTaskKey({ id: task.id, type: task.type }), task)
  })
  incomingTasks.forEach((task) => {
    nextTasks.set(getTaskCenterTaskKey({ id: task.id, type: task.type }), task)
  })

  return Array.from(nextTasks.values())
}

export function EditorAIPanel({
  articleId,
  submissionTick = 0,
  onOpenArticleEditTask,
}: EditorAIPanelProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false)
  const [selectedTaskRef, setSelectedTaskRef] = useState<TaskCenterTaskReference | null>(null)
  const [taskDetail, setTaskDetail] = useState<TaskCenterTaskDetailResponse | null>(null)
  const [loadingTaskDetail, setLoadingTaskDetail] = useState(false)
  const [taskDetailError, setTaskDetailError] = useState<string | null>(null)
  const [copyingToMaterials, setCopyingToMaterials] = useState(false)
  const [copyToMaterialsError, setCopyToMaterialsError] = useState<string | null>(null)
  const [copyToMaterialsSuccess, setCopyToMaterialsSuccess] = useState<string | null>(null)
  const [isCreateImageOpen, setIsCreateImageOpen] = useState(false)
  const [isAiWriteOpen, setIsAiWriteOpen] = useState(false)
  const [isReversalModeOpen, setIsReversalModeOpen] = useState(false)
  const [isImageStyleOpen, setIsImageStyleOpen] = useState(false)
  const [isInfographicOpen, setIsInfographicOpen] = useState(false)
  const [isEChartsOpen, setIsEChartsOpen] = useState(false)
  const [isPresentationOpen, setIsPresentationOpen] = useState(false)
  const [selectedInfographicText, setSelectedInfographicText] = useState("")
  const [selectedEChartsText, setSelectedEChartsText] = useState("")
  const [deletingTaskKeys, setDeletingTaskKeys] = useState<Set<string>>(new Set())
  const [echartsArticleAnalysisSession, setEchartsArticleAnalysisSession] =
    useState<EChartsArticleAnalysisSession | null>(null)

  const {
    tasks: liveTasks,
    refetch,
    loadMore,
    loadingMore,
    hasMore,
    setTasks: setLiveTasks,
  } = useTaskCenterLiveTasks({
    article_id: articleId ?? undefined,
    enabled: typeof articleId === "number",
    realtimeScope: "article",
  })

  const taskCenterTasks = useMemo(
    () =>
      liveTasks
        .map((task) => {
          const taskKey = getTaskCenterTaskKey({ id: task.id, type: task.type })
          return mapTaskCenterTaskToProgressItem(task, t, !deletingTaskKeys.has(taskKey))
        })
        .sort((left, right) => right.startedAt - left.startedAt),
    [deletingTaskKeys, liveTasks, t]
  )
  const localAnalysisTasks = useMemo(() => {
    if (!echartsArticleAnalysisSession) return []

    const task = mapEChartsArticleAnalysisToTaskItem(echartsArticleAnalysisSession, t)
    return task ? [task] : []
  }, [echartsArticleAnalysisSession, t])
  const selectedLiveTaskFingerprint = useMemo(() => {
    if (!selectedTaskRef) return null

    const matchedTask = liveTasks.find(
      (task) => task.id === selectedTaskRef.id && task.type === selectedTaskRef.type
    )

    if (!matchedTask) return null

    return JSON.stringify({
      id: matchedTask.id,
      type: matchedTask.type,
      status: matchedTask.status,
      details: matchedTask.details,
    })
  }, [liveTasks, selectedTaskRef])

  useEffect(() => {
    if (submissionTick === 0) return
    void refetch({ silent: true })
  }, [refetch, submissionTick])

  useEffect(() => {
    if (typeof articleId !== "number") {
      setEchartsArticleAnalysisSession(null)
      return
    }

    setEchartsArticleAnalysisSession(loadEChartsArticleAnalysisSession(articleId))
  }, [articleId])

  const handleEChartsArticleAnalysisSessionChange = useCallback(
    (session: EChartsArticleAnalysisSession | null) => {
      setEchartsArticleAnalysisSession(session)

      if (session) {
        saveEChartsArticleAnalysisSession(session)
        return
      }

      if (typeof articleId === "number") {
        clearEChartsArticleAnalysisSession(articleId)
      }
    },
    [articleId]
  )

  useEffect(() => {
    if (echartsArticleAnalysisSession?.status !== "submitted") return

    const timeoutId = window.setTimeout(() => {
      handleEChartsArticleAnalysisSessionChange(null)
    }, 45 * 1000)

    return () => window.clearTimeout(timeoutId)
  }, [echartsArticleAnalysisSession, handleEChartsArticleAnalysisSessionChange])

  const handleTaskProgressScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget
      const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight
      if (distanceToBottom <= 120 && hasMore && !loadingMore) {
        void loadMore()
      }
    },
    [hasMore, loadMore, loadingMore]
  )

  const getSelectedEditorText = () => {
    if (typeof window === "undefined") return ""

    const selectionGetter = (window as typeof window & {
      getJoyfulWordsSelectedText?: () => string
    }).getJoyfulWordsSelectedText

    if (typeof selectionGetter !== "function") {
      return ""
    }

    try {
      return selectionGetter()
    } catch (error) {
      console.warn("[EditorAIPanel] Failed to read editor selection:", error)
      return ""
    }
  }

  const fetchTaskDetail = useCallback(async (task: TaskItem) => {
    const taskCenterTask = task.taskCenterData as TaskCenterTaskListItem | undefined
    if (!taskCenterTask) return

    const taskRef = {
      id: taskCenterTask.id,
      type: taskCenterTask.type,
    } satisfies TaskCenterTaskReference

    setLoadingTaskDetail(true)
    setTaskDetailError(null)
    setSelectedTaskRef((current) => {
      if (current && current.id === taskRef.id && current.type === taskRef.type) {
        return current
      }

      return taskRef
    })
    setCopyToMaterialsError(null)
    setCopyToMaterialsSuccess(null)

    try {
      const result = await taskCenterClient.getTaskDetail(taskRef.type, taskRef.id)
      if (isTaskCenterErrorResponse(result)) {
        throw new Error(String(result.error))
      }

      setTaskDetail(result)
      setIsTaskDetailOpen(true)
    } catch (error) {
      const errorMessage = getCaughtErrorMessage(
        error,
        t("contentWriting.taskCenter.detailLoadFailed")
      )
      console.error("[EditorAIPanel] Failed to fetch task detail", errorMessage, { taskRef })
      setTaskDetailError(errorMessage)
      setTaskDetail(null)
      setIsTaskDetailOpen(true)
    } finally {
      setLoadingTaskDetail(false)
    }
  }, [t])

  useEffect(() => {
    if (!isTaskDetailOpen || !selectedTaskRef || !selectedLiveTaskFingerprint) return

    const matchedTask = liveTasks.find(
      (task) => task.id === selectedTaskRef.id && task.type === selectedTaskRef.type
    )

    if (!matchedTask) return

    void fetchTaskDetail(mapTaskCenterTaskToProgressItem(matchedTask, t))
  }, [
    fetchTaskDetail,
    isTaskDetailOpen,
    liveTasks,
    selectedLiveTaskFingerprint,
    selectedTaskRef,
    t,
  ])

  const handleRemoveTask = useCallback(
    async (task: TaskItem) => {
      if (task.type !== "task-center") return
      if (task.status === "completed") {
        const confirmed = window.confirm(t("contentWriting.taskCenter.deleteSuccessConfirm"))
        if (!confirmed) {
          return
        }
      }

      const taskCenterTask = task.taskCenterData as TaskCenterTaskListItem | undefined
      if (!taskCenterTask) return

      const taskKey = getTaskCenterTaskKey({
        id: taskCenterTask.id,
        type: taskCenterTask.type,
      })
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
        const deletionResult = await taskCenterClient.deleteTask(taskCenterTask.type, taskCenterTask.id)
        if (deletionResult) {
          toast({
            variant: "destructive",
            title: t("contentWriting.taskCenter.deleteFailed"),
            description: deletionResult.error || t("contentWriting.taskCenter.deleteFailed"),
          })
          return
        }

        setLiveTasks((currentTasks) =>
          currentTasks.filter(
            (currentTask) =>
              !(currentTask.id === taskCenterTask.id && currentTask.type === taskCenterTask.type)
          )
        )

        if (selectedTaskRef?.id === taskCenterTask.id && selectedTaskRef.type === taskCenterTask.type) {
          setIsTaskDetailOpen(false)
          setSelectedTaskRef(null)
          setTaskDetail(null)
          setTaskDetailError(null)
          setLoadingTaskDetail(false)
          setCopyToMaterialsError(null)
          setCopyToMaterialsSuccess(null)
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
    [selectedTaskRef, setLiveTasks, t, toast]
  )

  const copyToMaterials = async () => {
    if (!selectedTaskRef) return

    try {
      setCopyingToMaterials(true)
      setCopyToMaterialsError(null)
      setCopyToMaterialsSuccess(null)

      const result =
        selectedTaskRef.type === "image"
          ? await imageGenerationClient.copyToMaterials(
              selectedTaskRef.id,
              articleId ?? undefined
            )
          : selectedTaskRef.type === "infographic"
          ? await infographicsClient.copyToMaterials(
              selectedTaskRef.id,
              articleId ??
                (taskDetail && "article_id" in taskDetail ? taskDetail.article_id : undefined)
            )
          : null

      if (!result) {
        return
      }

      if ("error" in result) {
        throw new Error(String(result.error))
      }

      setCopyToMaterialsSuccess(t("contentWriting.taskCenter.copyToMaterialsSuccess"))
      console.info("[EditorAIPanel] Copied task outputs to materials", {
        taskId: selectedTaskRef.id,
        taskType: selectedTaskRef.type,
        articleId,
        count: result.count,
      })
    } catch (error) {
      console.error("[EditorAIPanel] Failed to copy outputs to materials", {
        taskId: selectedTaskRef.id,
        taskType: selectedTaskRef.type,
        error,
      })
      setCopyToMaterialsError(t("contentWriting.taskCenter.copyToMaterialsFailed"))
    } finally {
      setCopyingToMaterials(false)
    }
  }

  function handleOpenDialog(id: ActiveDialog) {
    if (id === "ai-edit") {
      window.dispatchEvent(new CustomEvent("joyfulwords-open-ai-edit"))
    } else if (id === "ai-write") {
      setIsAiWriteOpen(true)
    } else if (id === "mindmap") {
      window.dispatchEvent(new CustomEvent("joyfulwords-open-ai-mindmap"))
    } else if (id === "create-image") {
      setIsCreateImageOpen(true)
    } else if (id === "reversal-mode") {
      setIsReversalModeOpen(true)
    } else if (id === "image-style") {
      setIsImageStyleOpen(true)
    } else if (id === "infographic") {
      const selectedText = getSelectedEditorText().trim()

      if (!selectedText) {
        toast({
          variant: "destructive",
          title: t("infographicDialog.toast.selectTextFirst"),
          description: t("infographicDialog.toast.selectTextFirstDesc"),
        })
        return
      }

      setSelectedInfographicText(selectedText)
      setIsInfographicOpen(true)
    } else if (id === "echarts") {
      setSelectedEChartsText(getSelectedEditorText().trim())
      setIsEChartsOpen(true)
    } else if (id === "presentation") {
      setIsPresentationOpen(true)
    }
  }

  function renderImageFeatureDialog(
    open: boolean,
    onOpenChange: (nextOpen: boolean) => void,
    title: string,
    content: ReactNode
  ) {
    return (
      <AIFeatureDialogShell
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        size="compact"
      >
        {content}
      </AIFeatureDialogShell>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="jw-panel-header shrink-0 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">
              {t("tiptapEditor.aiPanel.studioTitle")}
            </h2>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-2 pb-3">
        <div className="min-h-0 flex-1 overflow-hidden px-2 py-3">
          <div className="h-full overflow-y-auto">
            <div className="space-y-4">
              {FEATURE_GROUPS.map((group) => {
                const groupButtons = FEATURE_BUTTONS.filter((btn) => btn.groupKey === group.id)

                return (
                  <section key={group.id} className="space-y-2">
                    <div className="px-1">
                      <h3 className="text-xs font-semibold text-foreground">
                        {t(group.titleKey)}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {groupButtons.map((btn) => {
                        const Icon = btn.icon
                        const featureButton = (
                          <button
                            key={btn.id}
                            type="button"
                            onClick={() => handleOpenDialog(btn.id)}
                            disabled={btn.disabled}
                            className={cn(
                              "jw-action-card group flex min-h-20 w-full flex-col items-start justify-between rounded-lg p-3 text-left transition-all duration-150",
                              btn.disabled
                                ? "cursor-not-allowed opacity-55"
                                : "cursor-pointer hover:-translate-y-0.5 hover:border-[var(--jw-action-hover-border)]"
                            )}
                          >
                            <span
                              className={cn(
                                "relative flex h-10 w-10 items-center justify-center rounded-xl ring-1 shadow-sm transition-transform duration-150",
                                btn.bgColor,
                                !btn.disabled && "group-hover:-rotate-3 group-hover:scale-105"
                              )}
                            >
                              <Icon
                                className={cn(
                                  "h-5 w-5 stroke-[1.8]",
                                  btn.disabled ? "text-muted-foreground" : btn.iconColor
                                )}
                              />
                              {!btn.disabled && (
                                <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--jw-control-active-bg)] text-[var(--jw-accent)] shadow-sm">
                                  <SparklesIcon className="h-2.5 w-2.5" />
                                </span>
                              )}
                            </span>
                            <span
                              className={
                                btn.disabled
                                  ? "mt-3 text-xs font-medium leading-tight text-muted-foreground"
                                  : "mt-3 text-xs font-semibold leading-tight text-foreground/85"
                              }
                            >
                              {t(btn.labelKey)}
                            </span>
                          </button>
                        )

                        if (!btn.disabled) {
                          return featureButton
                        }

                        return (
                          <Tooltip key={btn.id}>
                            <TooltipTrigger asChild>
                              <span className="block h-full">{featureButton}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <span>{t(btn.tooltipKey ?? "tiptapEditor.aiPanel.generateVideoComingSoon")}</span>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </div>
          </div>
        </div>

        <div className="jw-task-progress-shell mt-3 flex min-h-0 flex-1 flex-col overflow-hidden border-t border-[var(--jw-border-subtle)]">
          <div className="shrink-0 px-3 py-3">
            <h4 className="text-xs font-semibold text-foreground">
              {t("tiptapEditor.aiPanel.taskProgress")}
            </h4>
            <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
              {t("tiptapEditor.aiPanel.taskProgressSubtitle")}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto" onScroll={handleTaskProgressScroll}>
            <EditorTaskProgress
              localTasks={localAnalysisTasks}
              taskCenterTasks={taskCenterTasks}
              showHeader={false}
              onRemoveTask={(task) => {
                if (task.type === "local" && task.originalType === "echarts") {
                  handleEChartsArticleAnalysisSessionChange(null)
                  return
                }

                void handleRemoveTask(task)
              }}
              onClickTask={(task: TaskItem) => {
                if (task.type === "local" && task.originalType === "echarts") {
                  setSelectedEChartsText("")
                  setIsEChartsOpen(true)
                  return
                }

                const taskCenterTask = task.taskCenterData as TaskCenterTaskListItem | undefined
                if (task.type !== "task-center" || !taskCenterTask) return

                if (task.originalType === "article" && isArticleEditTask(taskCenterTask)) {
                  onOpenArticleEditTask({
                    id: taskCenterTask.id,
                    type: taskCenterTask.type,
                  })
                  return
                }

                void fetchTaskDetail(task)
              }}
            />
            {loadingMore ? (
              <div className="flex justify-center px-3 pb-3">
                <LoaderIcon className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <Dialog open={isTaskDetailOpen} onOpenChange={setIsTaskDetailOpen}>
        <DialogContent
          className={
            selectedTaskRef?.type === "presentation"
              ? "flex h-[82vh] max-h-[82vh] w-[calc(100vw-2rem)] flex-col overflow-hidden md:min-w-[720px] md:w-[min(50vw,880px)] md:!max-w-[880px]"
              : selectedTaskRef?.type === "echarts"
              ? "flex max-h-[min(82vh,760px)] w-[calc(100vw-2rem)] flex-col overflow-hidden md:min-w-[720px] md:w-[min(88vw,1080px)] md:!max-w-[1080px]"
              : "flex max-h-[80vh] flex-col sm:max-w-[720px]"
          }
        >
          <DialogHeader
            className={
              selectedTaskRef?.type === "presentation" || selectedTaskRef?.type === "echarts"
                ? "shrink-0"
                : undefined
            }
          >
            <DialogTitle>
              {selectedTaskRef?.type === "echarts"
                ? t("contentWriting.taskCenter.taskTitles.echarts")
                : t("contentWriting.taskCenter.detailTitle")}
            </DialogTitle>
            <DialogDescription>
              {selectedTaskRef
                ? t(`contentWriting.taskCenter.types.${selectedTaskRef.type}`)
                : t("contentWriting.taskCenter.selectTaskTitle")}
            </DialogDescription>
          </DialogHeader>

          {loadingTaskDetail ? (
            <div className="flex justify-center py-8">
              <LoaderIcon className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : taskDetailError ? (
            <Alert variant="destructive">
              <AlertDescription>{taskDetailError}</AlertDescription>
            </Alert>
          ) : selectedTaskRef && taskDetail ? (
            <>
              <div
                className={
                  selectedTaskRef.type === "presentation" || selectedTaskRef.type === "echarts"
                    ? "min-h-0 flex-1 overflow-y-auto pr-1"
                    : "min-h-0 max-h-[calc(80vh-8rem)] overflow-y-auto pr-1"
                }
              >
                <TaskCenterTaskDetailView
                  taskRef={selectedTaskRef}
                  detail={taskDetail}
                />
              </div>

              {selectedTaskRef.type === "image" || selectedTaskRef.type === "infographic" ? (
                <div className="border-t pt-4">
                  {copyToMaterialsSuccess ? (
                    <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-3">
                      <p className="text-sm text-green-700">{copyToMaterialsSuccess}</p>
                    </div>
                  ) : null}
                  {copyToMaterialsError ? (
                    <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-sm text-red-700">{copyToMaterialsError}</p>
                    </div>
                  ) : null}

                  <Button
                    type="button"
                    className="w-full"
                    onClick={copyToMaterials}
                    disabled={copyingToMaterials}
                  >
                    {copyingToMaterials ? (
                      <>
                        <LoaderIcon className="h-4 w-4 animate-spin" />
                        {t("common.generating")}
                      </>
                    ) : (
                      t("contentWriting.taskCenter.copyToMaterials")
                    )}
                  </Button>
                </div>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <ArticleAIHelpDialog
        open={isAiWriteOpen}
        onOpenChange={setIsAiWriteOpen}
        onArticleCreated={() => {
          void refetch({ silent: true })
        }}
        articleId={articleId ?? undefined}
        variant="feature-compact"
      />

      {renderImageFeatureDialog(
        isCreateImageOpen,
        setIsCreateImageOpen,
        t("tiptapEditor.aiPanel.createImage"),
        <CreatorMode articleId={articleId} />
      )}

      {renderImageFeatureDialog(
        isReversalModeOpen,
        setIsReversalModeOpen,
        t("tiptapEditor.aiPanel.reversalMode"),
        <InversionMode articleId={articleId} />
      )}

      {renderImageFeatureDialog(
        isImageStyleOpen,
        setIsImageStyleOpen,
        t("tiptapEditor.aiPanel.imageStyle"),
        <StyleMode articleId={articleId} />
      )}

      <InfographicDialog
        open={isInfographicOpen}
        onOpenChange={setIsInfographicOpen}
        articleId={articleId}
        selectedText={selectedInfographicText}
      />

      <EChartsDialog
        open={isEChartsOpen}
        onOpenChange={setIsEChartsOpen}
        articleId={articleId}
        selectedText={selectedEChartsText}
        articleAnalysisSession={echartsArticleAnalysisSession}
        onArticleAnalysisSessionChange={handleEChartsArticleAnalysisSessionChange}
        onTasksSubmitted={(taskRefs, taskItems = []) => {
          if (taskItems.length > 0) {
            setLiveTasks((currentTasks) => mergeTaskCenterTasks(currentTasks, taskItems))
          }
          void refetch({ silent: true })
          console.info("[EditorAIPanel] Submitted echarts tasks", {
            taskCount: taskRefs.length,
            articleId,
          })
        }}
      />

      <PresentationDialog
        open={isPresentationOpen}
        onOpenChange={setIsPresentationOpen}
        articleId={articleId}
        onTaskSubmitted={(taskRef) => {
          void refetch({ silent: true })
          console.info("[EditorAIPanel] Submitted presentation task", {
            taskId: taskRef.id,
            taskType: taskRef.type,
            articleId,
          })
        }}
      />
    </div>
  )
}
