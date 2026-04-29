'use client'

import { AlertTriangleIcon, CheckCircle2Icon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/custom/toast'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const isError = props.variant === 'destructive'
        const StatusIcon = isError ? AlertTriangleIcon : CheckCircle2Icon

        return (
          <Toast key={id} {...props}>
            <div
              className={
                isError
                  ? 'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#ffe9e3] text-[#b64332]'
                  : 'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700'
              }
              aria-hidden="true"
            >
              <StatusIcon className="h-4 w-4" />
            </div>
            <div className="grid min-w-0 flex-1 gap-0.5">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
