"use client"

import { XIcon, Wallet } from "lucide-react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/base/dialog"
import { BillingPage } from "./billing-page"

interface BillingFullscreenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BillingFullscreenDialog({
  open,
  onOpenChange,
}: BillingFullscreenDialogProps) {
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
              <Wallet className="h-4 w-4 text-primary" />
              {t("sidebar.billing")}
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
            <BillingPage />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
