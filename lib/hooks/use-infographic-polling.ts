"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { infographicsClient } from "@/lib/api/infographics/client"
import type {
  InfographicLogDetailResponse,
  InfographicStatus,
} from "@/lib/api/infographics/types"
import type { ErrorResponse } from "@/lib/api/types"

export type InfographicPollingState = "idle" | "submitting" | InfographicStatus

type GetInfographicLogDetail = (
  logId: number
) => Promise<InfographicLogDetailResponse | ErrorResponse>

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

interface UseInfographicBatchPollingProgress {
  total: number
  completed: number
  success: number
  failed: number
}

interface UseInfographicBatchPollingReturn {
  batchId: string | null
  logIds: number[]
  details: InfographicLogDetailResponse[]
  errorMessage: string | null
  progress: UseInfographicBatchPollingProgress
  state: InfographicPollingState
  markSubmitting: () => void
  startPolling: (logIds: number[], batchId?: string) => Promise<void>
  stopPolling: () => void
  reset: () => void
}

function isInfographicTerminalStatus(status: InfographicStatus): boolean {
  return status === "success" || status === "failed"
}

function getBatchProgress(
  logIds: number[],
  details: InfographicLogDetailResponse[]
): UseInfographicBatchPollingProgress {
  const completed = details.filter((detail) => isInfographicTerminalStatus(detail.status)).length
  const success = details.filter((detail) => detail.status === "success").length
  const failed = details.filter((detail) => detail.status === "failed").length

  return {
    total: logIds.length,
    completed,
    success,
    failed,
  }
}

function getBatchPollingState(
  logIds: number[],
  details: InfographicLogDetailResponse[]
): InfographicPollingState {
  if (logIds.length === 0) return "idle"
  if (details.length < logIds.length) return "processing"

  const allTerminal = details.every((detail) => isInfographicTerminalStatus(detail.status))
  if (!allTerminal) return "processing"

  return details.some((detail) => detail.status === "success") ? "success" : "failed"
}

export function useInfographicPolling(
  getLogDetail: GetInfographicLogDetail = infographicsClient.getLogDetail
): UseInfographicPollingReturn {
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
      const result = await getLogDetail(logId)

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
  }, [getLogDetail, scheduleNextPoll, stopPolling])

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

export function useInfographicBatchPolling(
  getLogDetail: GetInfographicLogDetail = infographicsClient.getLogDetail
): UseInfographicBatchPollingReturn {
  const [batchId, setBatchId] = useState<string | null>(null)
  const [logIds, setLogIds] = useState<number[]>([])
  const [details, setDetails] = useState<InfographicLogDetailResponse[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [state, setState] = useState<InfographicPollingState>("idle")

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startedAtRef = useRef<number | null>(null)
  const logIdsRef = useRef<number[]>([])
  const batchIdRef = useRef<string | null>(null)
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
    const currentLogIds = logIdsRef.current
    if (!isActiveRef.current || currentLogIds.length === 0) {
      return
    }

    const startedAt = startedAtRef.current ?? Date.now()
    if (Date.now() - startedAt > POLLING_TIMEOUT_MS) {
      console.warn("[Infographics] Batch polling timed out:", {
        batchId: batchIdRef.current,
        logIds: currentLogIds,
      })
      stopPolling()
      setState("failed")
      setErrorMessage("polling_timeout")
      return
    }

    try {
      const results = await Promise.all(
        currentLogIds.map(async (logId) => {
          const result = await getLogDetail(logId)
          return { logId, result }
        })
      )

      const errorResult = results.find(({ result }) => "error" in result)
      if (errorResult && "error" in errorResult.result) {
        console.error("[Infographics] Failed to fetch infographic batch detail:", {
          batchId: batchIdRef.current,
          logId: errorResult.logId,
          error: errorResult.result.error,
        })
        stopPolling()
        setState("failed")
        setErrorMessage(String(errorResult.result.error))
        return
      }

      const nextDetails = results
        .map(({ result }) => result)
        .filter((result): result is InfographicLogDetailResponse => !("error" in result))
        .sort((first, second) => {
          const firstIndex = first.batch_index ?? currentLogIds.indexOf(first.id) + 1
          const secondIndex = second.batch_index ?? currentLogIds.indexOf(second.id) + 1
          return firstIndex - secondIndex
        })
      const nextState = getBatchPollingState(currentLogIds, nextDetails)

      console.debug("[Infographics] Batch polling detail status:", {
        batchId: batchIdRef.current,
        total: currentLogIds.length,
        progress: getBatchProgress(currentLogIds, nextDetails),
        state: nextState,
      })

      setDetails(nextDetails)
      setErrorMessage(
        nextState === "failed"
          ? nextDetails.find((detail) => detail.error_message)?.error_message || null
          : null
      )
      setState(nextState)

      if (nextState === "success") {
        console.info("[Infographics] Article infographic batch completed:", {
          batchId: batchIdRef.current,
          progress: getBatchProgress(currentLogIds, nextDetails),
        })
        stopPolling()
        return
      }

      if (nextState === "failed") {
        console.warn("[Infographics] Article infographic batch failed:", {
          batchId: batchIdRef.current,
          progress: getBatchProgress(currentLogIds, nextDetails),
        })
        stopPolling()
        return
      }

      scheduleNextPoll(() => {
        void poll()
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      console.error("[Infographics] Unexpected batch polling error:", {
        batchId: batchIdRef.current,
        error: message,
      })
      stopPolling()
      setState("failed")
      setErrorMessage(message)
    }
  }, [getLogDetail, scheduleNextPoll, stopPolling])

  const startPolling = useCallback(async (nextLogIds: number[], nextBatchId?: string) => {
    stopPolling()

    const normalizedLogIds = Array.from(new Set(nextLogIds.filter((logId) => logId > 0)))
    logIdsRef.current = normalizedLogIds
    batchIdRef.current = nextBatchId ?? null
    startedAtRef.current = Date.now()
    isActiveRef.current = normalizedLogIds.length > 0

    setBatchId(nextBatchId ?? null)
    setLogIds(normalizedLogIds)
    setDetails([])
    setErrorMessage(null)
    setState(normalizedLogIds.length > 0 ? "pending" : "success")

    // TODO(observability): add active batch polling gauge for article infographic generation.
    console.info("[Infographics] Starting batch polling:", {
      batchId: nextBatchId ?? null,
      logIds: normalizedLogIds,
    })

    if (normalizedLogIds.length > 0) {
      await poll()
    }
  }, [poll, stopPolling])

  const markSubmitting = useCallback(() => {
    setState("submitting")
    setErrorMessage(null)
    setDetails([])
  }, [])

  const reset = useCallback(() => {
    stopPolling()
    logIdsRef.current = []
    batchIdRef.current = null
    startedAtRef.current = null
    setBatchId(null)
    setLogIds([])
    setDetails([])
    setErrorMessage(null)
    setState("idle")
  }, [stopPolling])

  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  return {
    batchId,
    logIds,
    details,
    errorMessage,
    progress: getBatchProgress(logIds, details),
    state,
    markSubmitting,
    startPolling,
    stopPolling,
    reset,
  }
}
