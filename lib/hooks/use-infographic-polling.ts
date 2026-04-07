"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { infographicsClient } from "@/lib/api/infographics/client"
import type {
  InfographicLogDetailResponse,
  InfographicStatus,
} from "@/lib/api/infographics/types"

export type InfographicPollingState = "idle" | "submitting" | InfographicStatus

const POLL_INTERVAL_MS = 5000
const POLLING_TIMEOUT_MS = 5 * 60 * 1000

interface UseInfographicPollingReturn {
  currentLogId: number | null
  detail: InfographicLogDetailResponse | null
  errorMessage: string | null
  state: InfographicPollingState
  markSubmitting: () => void
  startPolling: (logId: number) => Promise<void>
  stopPolling: () => void
  reset: () => void
}

export function useInfographicPolling(): UseInfographicPollingReturn {
  const [currentLogId, setCurrentLogId] = useState<number | null>(null)
  const [detail, setDetail] = useState<InfographicLogDetailResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [state, setState] = useState<InfographicPollingState>("idle")

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startedAtRef = useRef<number | null>(null)
  const currentLogIdRef = useRef<number | null>(null)
  const isActiveRef = useRef(false)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const stopPolling = useCallback(() => {
    isActiveRef.current = false
    clearTimer()
  }, [clearTimer])

  const scheduleNextPoll = useCallback((callback: () => void) => {
    clearTimer()
    timerRef.current = setTimeout(callback, POLL_INTERVAL_MS)
  }, [clearTimer])

  const poll = useCallback(async () => {
    const logId = currentLogIdRef.current
    if (!isActiveRef.current || logId === null) {
      return
    }

    const startedAt = startedAtRef.current ?? Date.now()
    if (Date.now() - startedAt > POLLING_TIMEOUT_MS) {
      console.warn("[Infographics] Polling timed out:", { logId })
      stopPolling()
      setState("failed")
      setErrorMessage("polling_timeout")
      return
    }

    try {
      const result = await infographicsClient.getLogDetail(logId)

      if ("error" in result) {
        console.error("[Infographics] Failed to fetch infographic detail:", {
          logId,
          error: result.error,
        })
        stopPolling()
        setState("failed")
        setErrorMessage(String(result.error))
        return
      }

      console.debug("[Infographics] Polling detail status:", {
        logId,
        status: result.status,
      })

      setDetail(result)
      setErrorMessage(result.status === "failed" ? result.error_message || null : null)
      setState(result.status)

      if (result.status === "success") {
        console.info("[Infographics] Infographic generation succeeded:", {
          logId,
          completedAt: result.completed_at ?? null,
        })
        stopPolling()
        return
      }

      if (result.status === "failed") {
        console.warn("[Infographics] Infographic generation failed:", {
          logId,
          errorMessage: result.error_message,
        })
        stopPolling()
        return
      }

      scheduleNextPoll(() => {
        void poll()
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      console.error("[Infographics] Unexpected polling error:", {
        logId,
        error: message,
      })
      stopPolling()
      setState("failed")
      setErrorMessage(message)
    }
  }, [scheduleNextPoll, stopPolling])

  const startPolling = useCallback(async (logId: number) => {
    stopPolling()

    currentLogIdRef.current = logId
    startedAtRef.current = Date.now()
    isActiveRef.current = true

    setCurrentLogId(logId)
    setDetail(null)
    setErrorMessage(null)
    setState("pending")

    // TODO(observability): add active polling gauge for infographic generation.
    console.info("[Infographics] Starting polling:", { logId })
    await poll()
  }, [poll, stopPolling])

  const markSubmitting = useCallback(() => {
    setState("submitting")
    setErrorMessage(null)
    setDetail(null)
  }, [])

  const reset = useCallback(() => {
    stopPolling()
    currentLogIdRef.current = null
    startedAtRef.current = null
    setCurrentLogId(null)
    setDetail(null)
    setErrorMessage(null)
    setState("idle")
  }, [stopPolling])

  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  return {
    currentLogId,
    detail,
    errorMessage,
    state,
    markSubmitting,
    startPolling,
    stopPolling,
    reset,
  }
}
