"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  ClipboardListIcon,
  ImageIcon,
  LoaderIcon,
  NetworkIcon,
  PaletteIcon,
  PencilIcon,
  RefreshCwIcon,
  VideoIcon,
} from "lucide-react"
import { AIFeatureDialogShell } from "@/components/ui/ai/ai-feature-dialog-shell"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useToast } from "@/hooks/use-toast"
import { EditorTaskProgress, type TaskItem } from "./editor-task-progress"
import { isTaskCenterErrorResponse, taskCenterClient } from "@/lib/api/taskcenter/client"
import type {
  TaskCenterTaskDetailResponse,
  TaskCenterTaskListItem,
  TaskCenterTaskReference,
} from "@/lib/api/taskcenter/types"
import { getTaskCenterTaskKey } from "@/lib/api/taskcenter/types"
import { useTaskCenterLiveTasks } from "@/lib/hooks/use-taskcenter-live-tasks"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/base/dialog"
import { Alert, AlertDescription } from "@/components/ui/base/alert"
import { Button } from "@/components/ui/base/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/base/tooltip"
import { imageGenerationClient } from "@/lib/api/image-generation/client"
import { infographicsClient } from "@/lib/api/infographics/client"
import { CreatorMode } from "@/components/image-generator/creator-mode"
import { InversionMode } from "@/components/image-generator/modes/inversion-mode"
import { StyleMode } from "@/components/image-generator/modes/style-mode"
import { InfographicDialog } from "./infographic-dialog"
import { PresentationDialog } from "./presentation-dialog"
import {
  TaskCenterTaskDetailView,
  getTaskCenterTaskSummary,
  getTaskCenterTaskTitle,
} from "@/components/taskcenter/taskcenter-presenters"

type ActiveDialog =
  | "ai-edit"
  | "mindmap"
  | "create-image"
  | "reversal-mode"
  | "image-style"
  | "infographic"
  | "presentation"
  | "video"
  | null

interface FeatureButton {
  id: ActiveDialog
  labelKey: string
  icon: React.ElementType
  bgColor: string
  disabled?: boolean
  tooltipKey?: string
}

const FEATURE_BUTTONS: FeatureButton[] = [
  {
    id: "ai-edit",
    labelKey: "tiptapEditor.aiPanel.aiEdit",
    icon: PencilIcon,
    bgColor: "bg-blue-50",
  },
  {
    id: "mindmap",
    labelKey: "tiptapEditor.aiPanel.mindmap",
    icon: NetworkIcon,
    bgColor: "bg-emerald-50",
  },
  {
    id: "create-image",
    labelKey: "tiptapEditor.aiPanel.createImage",
    icon: ImageIcon,
    bgColor: "bg-indigo-50",
  },
  {
    id: "reversal-mode",
    labelKey: "tiptapEditor.aiPanel.reversalMode",
    icon: RefreshCwIcon,
    bgColor: "bg-pink-50",
  },
  {
    id: "image-style",
    labelKey: "tiptapEditor.aiPanel.imageStyle",
    icon: PaletteIcon,
    bgColor: "bg-amber-50",
  },
  {
    id: "infographic",
    labelKey: "tiptapEditor.aiPanel.infographic",
    icon: ClipboardListIcon,
    bgColor: "bg-cyan-50",
  },
  {
    id: "presentation",
    labelKey: "tiptapEditor.aiPanel.generatePpt",
    icon: ClipboardListIcon,
    bgColor: "bg-violet-50",
  },
  {
    id: "video",
    labelKey: "tiptapEditor.aiPanel.generateVideo",
    icon: VideoIcon,
    bgColor: "bg-slate-100",
    disabled: true,
    tooltipKey: "tiptapEditor.aiPanel.generateVideoComingSoon",
  },
]

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
    task.status === "success"
      ? "completed"
      : task.status === "failed"
      ? "failed"
      : "pending"

  return {
    id: `${task.type}-${task.id}`,
    type: "task-center",
    status,
    label: t(`contentWriting.taskCenter.taskTitles.${getTaskCenterTaskTitle(task)}`),
    description: getTaskCenterTaskSummary(task),
    startedAt: new Date(task.created_at).getTime(),
    removable: removable && (task.status === "success" || task.status === "failed"),
    taskCenterData: task,
    originalType: task.type,
  }
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
  const [isReversalModeOpen, setIsReversalModeOpen] = useState(false)
  const [isImageStyleOpen, setIsImageStyleOpen] = useState(false)
  const [isInfographicOpen, setIsInfographicOpen] = useState(false)
  const [isPresentationOpen, setIsPresentationOpen] = useState(false)
  const [selectedInfographicText, setSelectedInfographicText] = useState("")
  const [deletingTaskKeys, setDeletingTaskKeys] = useState<Set<string>>(new Set())

  const { tasks: liveTasks, refetch, setTasks: setLiveTasks } = useTaskCenterLiveTasks({
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
        .sort((left, right) => right.startedAt - left.startedAt)
        .slice(0, 10),
    [deletingTaskKeys, liveTasks, t]
  )
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
      console.error("[EditorAIPanel] Failed to fetch task detail", {
        taskRef,
        error,
      })
      setTaskDetailError(
        error instanceof Error ? error.message : t("contentWriting.taskCenter.detailLoadFailed")
      )
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
      <div className="border-b px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("tiptapEditor.aiPanel.title")}
        </h3>
      </div>

      <div className="px-3 py-3">
        <div className="grid grid-cols-2 auto-rows-fr gap-2">
          {FEATURE_BUTTONS.map((btn) => {
            const Icon = btn.icon
            const featureButton = (
              <button
                key={btn.id}
                type="button"
                onClick={() => handleOpenDialog(btn.id)}
                disabled={btn.disabled}
                className={
                  btn.disabled
                    ? "flex h-full min-h-24 w-full cursor-not-allowed flex-col items-center justify-center gap-1.5 rounded-lg bg-muted/40 p-3 opacity-55 shadow-sm"
                    : "flex h-full min-h-24 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg bg-white p-3 shadow-sm transition-all duration-150 hover:bg-blue-50/50 hover:shadow-md"
                }
              >
                <span className={`rounded-md p-1.5 ${btn.bgColor}`}>
                  <Icon className={btn.disabled ? "h-4 w-4 text-muted-foreground" : "h-4 w-4 text-foreground/70"} />
                </span>
                <span className={btn.disabled ? "text-center text-xs leading-tight text-muted-foreground" : "text-center text-xs leading-tight text-foreground/80"}>
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
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="px-4 py-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("tiptapEditor.aiPanel.taskProgress")}
          </h4>
        </div>
        <div className="flex-1 overflow-y-auto">
          <EditorTaskProgress
            taskCenterTasks={taskCenterTasks}
            onRemoveTask={(task) => void handleRemoveTask(task)}
            onClickTask={(task: TaskItem) => {
              const taskCenterTask = task.taskCenterData as TaskCenterTaskListItem | undefined
              if (task.type === "task-center" && task.originalType === "article") {
                if (!taskCenterTask) return
                onOpenArticleEditTask({
                  id: taskCenterTask.id,
                  type: taskCenterTask.type,
                })
              } else if (task.type === "task-center") {
                void fetchTaskDetail(task)
              }
            }}
          />
        </div>
      </div>

      <Dialog open={isTaskDetailOpen} onOpenChange={setIsTaskDetailOpen}>
        <DialogContent
          className={
            selectedTaskRef?.type === "presentation"
              ? "flex h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-none flex-col overflow-hidden sm:max-w-none"
              : "flex max-h-[80vh] flex-col sm:max-w-[720px]"
          }
        >
          <DialogHeader className={selectedTaskRef?.type === "presentation" ? "shrink-0" : undefined}>
            <DialogTitle>{t("contentWriting.taskCenter.detailTitle")}</DialogTitle>
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
                  selectedTaskRef.type === "presentation"
                    ? "min-h-0 flex-1 overflow-y-auto pr-1"
                    : "min-h-0 max-h-[calc(80vh-8rem)] overflow-y-auto pr-1"
                }
              >
                <TaskCenterTaskDetailView
                  taskRef={selectedTaskRef}
                  detail={taskDetail}
                  onSelectTask={(taskRef) => {
                    setSelectedTaskRef(taskRef)
                    const matchedTask = liveTasks.find(
                      (task) => task.id === taskRef.id && task.type === taskRef.type
                    )
                    if (matchedTask) {
                      void fetchTaskDetail(mapTaskCenterTaskToProgressItem(matchedTask, t))
                    }
                  }}
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
