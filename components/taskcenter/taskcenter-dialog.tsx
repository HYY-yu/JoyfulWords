"use client"

import { CheckSquareIcon, XIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/base/dialog"
import type { TaskCenterTaskReference } from "@/lib/api/taskcenter/types"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { TaskCenterBrowser } from "./taskcenter-browser"

interface TaskCenterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTaskRef?: TaskCenterTaskReference | null
  onInitialTaskHandled?: () => void
}

export function TaskCenterDialog({
  open,
  onOpenChange,
  initialTaskRef,
  onInitialTaskHandled,
}: TaskCenterDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/75"
        className="flex h-screen w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 bg-background p-0 shadow-none sm:h-[calc(100vh-1rem)] sm:w-[calc(100vw-1rem)] sm:max-w-none sm:rounded-xl sm:border sm:border-border sm:shadow-2xl"
      >
        <div className="flex h-full min-h-0 flex-col bg-background">
          <div className="flex items-center justify-between border-b bg-background px-4 py-4">
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
              <CheckSquareIcon className="h-4 w-4 text-primary" />
              {t("contentWriting.taskCenter.title")}
            </DialogTitle>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full p-1.5 transition-colors hover:bg-muted"
              title="Close"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-auto bg-background p-6 sm:p-8">
          <TaskCenterBrowser
            enabled={open}
            initialTaskRef={initialTaskRef}
            onInitialTaskHandled={onInitialTaskHandled}
            showHeader={false}
          />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
