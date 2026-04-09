"use client"

import { type ReactNode } from "react"
import { SparklesIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/base/dialog"
import { cn } from "@/lib/utils"

export type AIFeatureDialogSize = "compact" | "large" | "fullscreen"

const SIZE_CLASSES: Record<AIFeatureDialogSize, string> = {
  compact:
    "flex h-[min(900px,calc(100vh-2rem))] flex-col overflow-hidden p-0 sm:max-w-5xl",
  large:
    "flex h-auto max-h-[min(900px,calc(100vh-2rem))] w-[calc(100vw-2rem)] max-w-none flex-col overflow-hidden p-0 sm:max-w-[1200px] lg:max-w-[1400px] xl:max-w-[1600px]",
  fullscreen:
    "flex h-screen w-screen max-w-none flex-col overflow-hidden rounded-none border-0 p-0 sm:h-[calc(100vh-1rem)] sm:w-[calc(100vw-1rem)] sm:max-w-none sm:rounded-xl sm:border sm:border-border sm:shadow-2xl",
}

export interface AIFeatureDialogShellProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  icon?: ReactNode
  description?: ReactNode
  size?: AIFeatureDialogSize
  children: ReactNode
  footer?: ReactNode
  overlayClassName?: string
  contentClassName?: string
  showCloseButton?: boolean
}

export function AIFeatureDialogShell({
  open,
  onOpenChange,
  title,
  icon = <SparklesIcon className="h-5 w-5 text-primary" />,
  description,
  size = "compact",
  children,
  footer,
  overlayClassName,
  contentClassName,
  showCloseButton = true,
}: AIFeatureDialogShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={showCloseButton}
        overlayClassName={overlayClassName}
        className={cn(SIZE_CLASSES[size], contentClassName)}
      >
        <DialogHeader className="shrink-0 border-b px-6 py-5 text-left">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            {icon}
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="mt-1">{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>

        {footer ? (
          <DialogFooter className="shrink-0 border-t px-6 py-4">
            {footer}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
