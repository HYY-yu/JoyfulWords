"use client"

import { useState } from "react"
import {
  PencilIcon,
  ImageIcon,
  FileTextIcon,
  RefreshCwIcon,
  PaletteIcon,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { ArticleAIHelpDialog } from "./article-ai-help-dialog"
import { EditorTaskProgress, type TaskItem, type TaskType } from "./editor-task-progress"
import type { AIEditState } from "@/lib/hooks/use-ai-edit-state"

type ActiveDialog =
  | "ai-edit"
  | "create-image"
  | "ai-generate"
  | "reversal-mode"
  | "image-style"
  | null

interface FeatureButton {
  id: ActiveDialog
  labelKey: string
  icon: React.ElementType
  bgColor: string
  colSpan?: boolean
}

const FEATURE_BUTTONS: FeatureButton[] = [
  {
    id: "ai-edit",
    labelKey: "tiptapEditor.aiPanel.aiEdit",
    icon: PencilIcon,
    bgColor: "bg-blue-50",
  },
  {
    id: "create-image",
    labelKey: "tiptapEditor.aiPanel.createImage",
    icon: ImageIcon,
    bgColor: "bg-indigo-50",
  },
  {
    id: "ai-generate",
    labelKey: "tiptapEditor.aiPanel.aiGenerate",
    icon: FileTextIcon,
    bgColor: "bg-green-50",
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
    colSpan: true,
  },
]

interface EditorAIPanelProps {
  aiEditTasks: Map<string, AIEditState>
  activeExecId: string | null
  onSetActiveExecId: (execId: string | null) => void
  onAddTask: (task: AIEditState) => void
  onRemoveTask: (execId: string) => void
}

export function EditorAIPanel({
  aiEditTasks,
  activeExecId,
  onSetActiveExecId,
  onAddTask,
  onRemoveTask,
}: EditorAIPanelProps) {
  const { t } = useTranslation()
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null)

  function handleOpenDialog(id: ActiveDialog) {
    setActiveDialog(id)
  }

  function handleCloseDialog() {
    setActiveDialog(null)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <h3 className="text-sm font-semibold text-foreground">
          {t("tiptapEditor.aiPanel.title")}
        </h3>
      </div>

      {/* Feature Buttons */}
      <div className="px-3 py-3 border-b">
        <div className="grid grid-cols-2 gap-2">
          {FEATURE_BUTTONS.map((btn) => {
            const Icon = btn.icon
            return (
              <button
                key={btn.id}
                onClick={() => handleOpenDialog(btn.id)}
                className={`
                  flex flex-col items-center justify-center gap-1.5 p-3
                  bg-white border border-border rounded-lg
                  hover:border-blue-400 hover:bg-blue-50/50
                  transition-colors duration-150 cursor-pointer
                  ${btn.colSpan ? "col-span-2" : ""}
                `}
              >
                <span className={`p-1.5 rounded-md ${btn.bgColor}`}>
                  <Icon className="w-4 h-4 text-foreground/70" />
                </span>
                <span className="text-xs text-foreground/80 text-center leading-tight">
                  {t(btn.labelKey)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Task Progress Section */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="px-4 py-2 border-b">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t("tiptapEditor.aiPanel.taskProgress")}
          </h4>
        </div>
        <div className="flex-1 overflow-y-auto">
          <EditorTaskProgress
            aiEditTasks={aiEditTasks}
            onRemoveTask={(id: string, _type: TaskType) => onRemoveTask(id)}
            onClickTask={(task: TaskItem) => {
              if (task.type === "ai-edit") {
                onSetActiveExecId(task.id)
              }
            }}
          />
        </div>
      </div>

      {/* AI Generate Article Dialog */}
      <ArticleAIHelpDialog
        open={activeDialog === "ai-generate"}
        onOpenChange={(open) => {
          if (!open) handleCloseDialog()
        }}
        onArticleCreated={() => {
          handleCloseDialog()
        }}
      />
    </div>
  )
}
