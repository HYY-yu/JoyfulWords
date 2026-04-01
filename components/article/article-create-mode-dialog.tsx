"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/base/dialog"
import { FileTextIcon, LoaderIcon, SparklesIcon } from "lucide-react"
import { useTranslation } from "@/lib/i18n/i18n-context"

interface ArticleCreateModeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectManual: () => void
  onSelectAI: () => void
  isCreatingManual?: boolean
}

export function ArticleCreateModeDialog({
  open,
  onOpenChange,
  onSelectManual,
  onSelectAI,
  isCreatingManual = false,
}: ArticleCreateModeDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {t("contentWriting.createModeDialog.title")}
          </DialogTitle>
          <DialogDescription>
            {t("contentWriting.createModeDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onSelectManual}
            disabled={isCreatingManual}
            className="group flex min-h-[88px] items-center rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {isCreatingManual ? (
                  <LoaderIcon className="h-5 w-5 animate-spin" />
                ) : (
                  <FileTextIcon className="h-5 w-5" />
                )}
              </div>
              <div className="text-sm font-semibold text-foreground">
                {t("contentWriting.createModeDialog.manual.title")}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={onSelectAI}
            disabled={isCreatingManual}
            className="group flex min-h-[88px] items-center rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <SparklesIcon className="h-5 w-5" />
              </div>
              <div className="text-sm font-semibold text-foreground">
                {t("contentWriting.createModeDialog.ai.title")}
              </div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
