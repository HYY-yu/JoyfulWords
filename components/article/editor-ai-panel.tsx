"use client"

import { useCallback, useMemo, useState, type ReactNode } from "react"
import {
  ClipboardListIcon,
  ImageIcon,
  LoaderIcon,
  NetworkIcon,
  PaletteIcon,
  PencilIcon,
  RefreshCwIcon,
  XIcon,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useToast } from "@/hooks/use-toast"
import { EditorTaskProgress, type TaskItem, type TaskType } from "./editor-task-progress"
import type { AIEditState } from "@/lib/hooks/use-ai-edit-state"
import { taskCenterClient } from "@/lib/api/taskcenter/client"
import type {
  TaskCenterTaskDetailResponse,
  TaskCenterTaskListItem,
  TaskCenterTaskReference,
} from "@/lib/api/taskcenter/types"
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
import { imageGenerationClient } from "@/lib/api/image-generation/client"
import { infographicsClient } from "@/lib/api/infographics/client"
import { CreatorMode } from "@/components/image-generator/creator-mode"
import { InversionMode } from "@/components/image-generator/modes/inversion-mode"
import { StyleMode } from "@/components/image-generator/modes/style-mode"
import { InfographicDialog } from "./infographic-dialog"
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
  | null

interface FeatureButton {
  id: ActiveDialog
  labelKey: string
  icon: React.ElementType
  bgColor: string
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
]

interface EditorAIPanelProps {
  articleId?: number | null
  aiEditTasks: Map<string, AIEditState>
  activeExecId: string | null
  onSetActiveExecId: (execId: string | null) => void
  onAddTask: (task: AIEditState) => void
  onRemoveTask: (execId: string) => void
}

function mapTaskCenterTaskToProgressItem(
  task: TaskCenterTaskListItem,
  t: (key: string) => string
): TaskItem {
  const status =
    task.status === "edit" || task.status === "success"
      ? "completed"
      : task.status === "failed"
      ? "failed"
      : "pending"

  return {
    id: `${task.type}-${task.id}`,
    type: "task-center" as TaskType,
    status,
    label: t(`contentWriting.taskCenter.taskTitles.${getTaskCenterTaskTitle(task)}`),
    description: getTaskCenterTaskSummary(task),
    startedAt: new Date(task.created_at).getTime(),
    removable: false,
    taskCenterData: task,
    originalType: task.type,
  }
}

export function EditorAIPanel({
  articleId,
  aiEditTasks,
  onSetActiveExecId,
  onRemoveTask,
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
  const [selectedInfographicText, setSelectedInfographicText] = useState("")

  const { tasks: liveTasks } = useTaskCenterLiveTasks({
    article_id: articleId ?? undefined,
    enabled: typeof articleId === "number",
    realtimeScope: "article",
  })

  const activeAiEditExecIds = useMemo(() => new Set(aiEditTasks.keys()), [aiEditTasks])

  const taskCenterTasks = useMemo(
    () =>
      liveTasks
        .filter((task) => {
          if (task.type !== "article") return true

          const execId = task.details.exec_id
          return !activeAiEditExecIds.has(execId)
        })
        .map((task) => mapTaskCenterTaskToProgressItem(task, t))
        .sort((left, right) => right.startedAt - left.startedAt)
        .slice(0, 10),
    [activeAiEditExecIds, liveTasks, t]
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
    if (!task.taskCenterData) return

    const taskRef = {
      id: task.taskCenterData.id,
      type: task.taskCenterData.type,
    } satisfies TaskCenterTaskReference

    setLoadingTaskDetail(true)
    setTaskDetailError(null)
    setSelectedTaskRef(taskRef)
    setCopyToMaterialsError(null)
    setCopyToMaterialsSuccess(null)

    try {
      const result = await taskCenterClient.getTaskDetail(taskRef.type, taskRef.id)
      if ("error" in result) {
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
    }
  }

  function renderImageFeatureDialog(
    open: boolean,
    onOpenChange: (nextOpen: boolean) => void,
    title: string,
    content: ReactNode
  ) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          overlayClassName="bg-black/75"
          className="flex h-screen w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 bg-background p-0 shadow-none sm:h-[calc(100vh-1rem)] sm:w-[calc(100vw-1rem)] sm:max-w-none sm:rounded-xl sm:border sm:border-border sm:shadow-2xl"
        >
          <div className="flex h-full min-h-0 flex-col bg-background">
            <div className="flex items-center justify-between border-b bg-background px-4 py-4">
              <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-full p-1.5 transition-colors hover:bg-muted"
                title="关闭"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-background">{content}</div>
          </div>
        </DialogContent>
      </Dialog>
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
            return (
              <button
                key={btn.id}
                onClick={() => handleOpenDialog(btn.id)}
                className="flex h-full min-h-24 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg bg-white p-3 shadow-sm transition-all duration-150 hover:bg-blue-50/50 hover:shadow-md"
              >
                <span className={`rounded-md p-1.5 ${btn.bgColor}`}>
                  <Icon className="h-4 w-4 text-foreground/70" />
                </span>
                <span className="text-center text-xs leading-tight text-foreground/80">
                  {t(btn.labelKey)}
                </span>
              </button>
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
            aiEditTasks={aiEditTasks}
            taskCenterTasks={taskCenterTasks}
            onRemoveTask={(id: string, type: TaskType) => {
              if (type === "ai-edit") {
                onRemoveTask(id)
              }
            }}
            onClickTask={(task: TaskItem) => {
              if (task.type === "ai-edit") {
                onSetActiveExecId(task.id)
              } else if (task.type === "task-center") {
                void fetchTaskDetail(task)
              }
            }}
          />
        </div>
      </div>

      <Dialog open={isTaskDetailOpen} onOpenChange={setIsTaskDetailOpen}>
        <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-[720px]">
          <DialogHeader>
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
              <div className="flex-1 overflow-y-auto pr-1">
                <TaskCenterTaskDetailView taskRef={selectedTaskRef} detail={taskDetail} />
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
    </div>
  )
}
