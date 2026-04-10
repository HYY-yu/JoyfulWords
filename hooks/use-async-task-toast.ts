"use client"

import { useCallback, useMemo, useRef, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"

const SUBMITTING_TOAST_DURATION_MS = 60_000
const POLLING_TOAST_DURATION_MS = 12_000

interface AsyncTaskToastContent {
  title: ReactNode
  description?: ReactNode
}

export function useAsyncTaskToast() {
  const { toast, dismiss } = useToast()
  const statusToastIdRef = useRef<string | null>(null)

  const clearStatusToast = useCallback(() => {
    if (!statusToastIdRef.current) return

    dismiss(statusToastIdRef.current)
    statusToastIdRef.current = null
  }, [dismiss])

  const showStatusToast = useCallback(
    (content: AsyncTaskToastContent, duration: number) => {
      clearStatusToast()
      const nextToast = toast({
        title: content.title,
        description: content.description,
        duration,
      })
      statusToastIdRef.current = nextToast.id
    },
    [clearStatusToast, toast]
  )

  const showSubmitting = useCallback(
    (content: AsyncTaskToastContent) => {
      showStatusToast(content, SUBMITTING_TOAST_DURATION_MS)
    },
    [showStatusToast]
  )

  const showPolling = useCallback(
    (content: AsyncTaskToastContent) => {
      showStatusToast(content, POLLING_TOAST_DURATION_MS)
    },
    [showStatusToast]
  )

  const showSuccess = useCallback(
    (content: AsyncTaskToastContent) => {
      clearStatusToast()
      toast({
        title: content.title,
        description: content.description,
      })
    },
    [clearStatusToast, toast]
  )

  const showFailure = useCallback(
    (content: AsyncTaskToastContent) => {
      clearStatusToast()
      toast({
        variant: "destructive",
        title: content.title,
        description: content.description,
      })
    },
    [clearStatusToast, toast]
  )

  return useMemo(
    () => ({
      clearStatusToast,
      showSubmitting,
      showPolling,
      showSuccess,
      showFailure,
    }),
    [clearStatusToast, showSubmitting, showPolling, showSuccess, showFailure]
  )
}
