"use client"

import { useCallback, useRef, useState } from "react"
import { infographicsClient } from "@/lib/api/infographics/client"
import type {
  InfographicArticleRequestDetailResponse,
  InfographicLogDetailResponse,
  InfographicStatus,
} from "@/lib/api/infographics/types"
import type { ErrorResponse } from "@/lib/api/types"
import { useAdaptivePolling } from "@/lib/hooks/use-adaptive-polling"

export type InfographicPollingState = "idle" | "submitting" | InfographicStatus

type GetInfographicLogDetail = (
  logId: number,
  signal?: AbortSignal,
  pollUrl?: string
) => Promise<InfographicLogDetailResponse | ErrorResponse>

type GetInfographicArticleRequestDetail = (
  requestId: number,
  signal?: AbortSignal,
  pollUrl?: string
) => Promise<InfographicArticleRequestDetailResponse | ErrorResponse>

const POLLING_TIMEOUT_MS = 5 * 60 * 1000

interface UseInfographicPollingReturn {
  currentLogId: number | null
  detail: InfographicLogDetailResponse | null
  errorMessage: string | null
  state: InfographicPollingState
  markSubmitting: () => void
  startPolling: (logId: number, pollUrl?: string) => Promise<void>
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
  requestId: number | null
  requestDetail: InfographicArticleRequestDetailResponse | null
  batchId: string | null
  logIds: number[]
  details: InfographicLogDetailResponse[]
  errorMessage: string | null
  progress: UseInfographicBatchPollingProgress
  state: InfographicPollingState
  markSubmitting: () => void
  startPolling: (requestId: number, pollUrl: string, batchId?: string) => Promise<void>
  stopPolling: () => void
  reset: () => void
}

function isInfographicTerminalStatus(status: InfographicStatus): boolean {
  return status === "success" || status === "failed"
}

function isRetryablePollingError(result: ErrorResponse): boolean {
  return typeof result.status !== "number" || result.status === 429 || result.status >= 500
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
  if (!details.every((detail) => isInfographicTerminalStatus(detail.status))) {
    return "processing"
  }
  return details.some((detail) => detail.status === "success") ? "success" : "failed"
}

const INFOGRAPHIC_POLLING_POLICY = {
  fastIntervalMs: 3_000,
  standardIntervalMs: 5_000,
  slowIntervalMs: 10_000,
  timeoutMs: POLLING_TIMEOUT_MS,
}

export function useInfographicPolling(
  getLogDetail: GetInfographicLogDetail = infographicsClient.getLogDetail
): UseInfographicPollingReturn {
  const [currentLogId, setCurrentLogId] = useState<number | null>(null)
  const [detail, setDetail] = useState<InfographicLogDetailResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [state, setState] = useState<InfographicPollingState>("idle")
  const currentLogIdRef = useRef<number | null>(null)
  const currentPollUrlRef = useRef<string | null>(null)

  const {
    startPolling: startAdaptivePolling,
    stopPolling: stopAdaptivePolling,
  } = useAdaptivePolling({
    poll: async ({ signal }) => {
      const logId = currentLogIdRef.current
      if (logId === null) return "stop"

      const result = await getLogDetail(logId, signal, currentPollUrlRef.current ?? undefined)
      if ("error" in result) {
        console.warn("[Infographics] Failed to fetch detail", {
          logId,
          status: result.status,
          error: result.error,
        })
        if (isRetryablePollingError(result)) throw new Error(String(result.error))
        setState("failed")
        setErrorMessage(String(result.error))
        return "stop"
      }

      console.debug("[Infographics] Polling detail status", {
        logId,
        status: result.status,
      })
      setDetail(result)
      setErrorMessage(result.status === "failed" ? result.error_message || null : null)
      setState(result.status)

      if (result.status === "success") {
        console.info("[Infographics] Infographic generation succeeded", { logId })
        return "stop"
      }
      if (result.status === "failed") {
        console.warn("[Infographics] Infographic generation failed", {
          logId,
          errorMessage: result.error_message,
        })
        return "stop"
      }
      return "continue"
    },
    onTimeout: () => {
      console.warn("[Infographics] Polling timed out", {
        logId: currentLogIdRef.current,
      })
      setState("failed")
      setErrorMessage("polling_timeout")
    },
    policy: INFOGRAPHIC_POLLING_POLICY,
    debugLabel: "infographic",
  })

  const stopPolling = useCallback(() => {
    stopAdaptivePolling()
  }, [stopAdaptivePolling])

  const startPolling = useCallback(async (logId: number, pollUrl?: string) => {
    stopAdaptivePolling()
    currentLogIdRef.current = logId
    currentPollUrlRef.current = pollUrl ?? null
    setCurrentLogId(logId)
    setDetail(null)
    setErrorMessage(null)
    setState("pending")
    // TODO(observability): add active polling gauge for infographic generation.
    console.info("[Infographics] Starting adaptive polling", {
      logId,
      pollUrl: pollUrl ?? null,
    })
    startAdaptivePolling()
  }, [startAdaptivePolling, stopAdaptivePolling])

  const markSubmitting = useCallback(() => {
    setState("submitting")
    setErrorMessage(null)
    setDetail(null)
  }, [])

  const reset = useCallback(() => {
    stopAdaptivePolling()
    currentLogIdRef.current = null
    currentPollUrlRef.current = null
    setCurrentLogId(null)
    setDetail(null)
    setErrorMessage(null)
    setState("idle")
  }, [stopAdaptivePolling])

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
  getLogDetail: GetInfographicLogDetail = infographicsClient.getLogDetail,
  getArticleRequestDetail: GetInfographicArticleRequestDetail =
    infographicsClient.getArticleRequestDetail
): UseInfographicBatchPollingReturn {
  const [requestId, setRequestId] = useState<number | null>(null)
  const [requestDetail, setRequestDetail] =
    useState<InfographicArticleRequestDetailResponse | null>(null)
  const [batchId, setBatchId] = useState<string | null>(null)
  const [logIds, setLogIds] = useState<number[]>([])
  const [details, setDetails] = useState<InfographicLogDetailResponse[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [state, setState] = useState<InfographicPollingState>("idle")
  const requestIdRef = useRef<number | null>(null)
  const requestPollUrlRef = useRef<string | null>(null)
  const requestResolvedRef = useRef(false)
  const logIdsRef = useRef<number[]>([])
  const logPollUrlsRef = useRef<Map<number, string>>(new Map())
  const batchIdRef = useRef<string | null>(null)

  const {
    startPolling: startAdaptivePolling,
    stopPolling: stopAdaptivePolling,
  } = useAdaptivePolling({
    poll: async ({ signal }) => {
      const currentRequestId = requestIdRef.current
      if (currentRequestId === null) return "stop"

      if (!requestResolvedRef.current) {
        const result = await getArticleRequestDetail(
          currentRequestId,
          signal,
          requestPollUrlRef.current ?? undefined
        )
        if ("error" in result) {
          console.warn("[Infographics] Failed to fetch article request detail", {
            requestId: currentRequestId,
            status: result.status,
            error: result.error,
          })
          if (isRetryablePollingError(result)) throw new Error(String(result.error))
          setState("failed")
          setErrorMessage(String(result.error))
          return "stop"
        }

        console.debug("[Infographics] Article request polling status", {
          requestId: currentRequestId,
          batchId: result.batch_id,
          status: result.status,
          count: result.count,
        })
        setRequestDetail(result)
        batchIdRef.current = result.batch_id
        setBatchId(result.batch_id)

        if (result.status === "failed") {
          console.warn("[Infographics] Article infographic analysis failed", {
            requestId: currentRequestId,
            batchId: result.batch_id,
            errorCode: result.error_code,
            errorMessage: result.error_message,
          })
          setState("failed")
          setErrorMessage(result.error_message || result.error_code || null)
          return "stop"
        }
        if (result.status !== "succeeded") {
          setState(result.status)
          return "continue"
        }

        const normalizedLogIds = Array.from(
          new Set(result.log_ids.filter((logId) => logId > 0))
        )
        requestResolvedRef.current = true
        logIdsRef.current = normalizedLogIds
        logPollUrlsRef.current = new Map(
          result.log_ids.flatMap((logId, index) => {
            const pollUrl = result.poll_urls[index]
            return logId > 0 && pollUrl ? [[logId, pollUrl] as const] : []
          })
        )
        setLogIds(normalizedLogIds)

        if (normalizedLogIds.length === 0) {
          console.info("[Infographics] Article analysis returned no infographic candidates", {
            requestId: currentRequestId,
            batchId: result.batch_id,
          })
          setState("success")
          return "stop"
        }

        setState("processing")
      }

      const currentLogIds = logIdsRef.current

      const results = await Promise.all(
        currentLogIds.map(async (logId) => ({
          logId,
          result: await getLogDetail(logId, signal, logPollUrlsRef.current.get(logId)),
        }))
      )
      const errorResult = results.find(({ result }) => "error" in result)
      if (errorResult && "error" in errorResult.result) {
        console.warn("[Infographics] Failed to fetch batch detail", {
          batchId: batchIdRef.current,
          logId: errorResult.logId,
          status: errorResult.result.status,
          error: errorResult.result.error,
        })
        if (isRetryablePollingError(errorResult.result)) {
          throw new Error(String(errorResult.result.error))
        }
        setState("failed")
        setErrorMessage(String(errorResult.result.error))
        return "stop"
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

      console.debug("[Infographics] Batch polling detail status", {
        batchId: batchIdRef.current,
        progress: getBatchProgress(currentLogIds, nextDetails),
        state: nextState,
      })
      setDetails(nextDetails)
      setErrorMessage(
        nextState === "failed"
          ? nextDetails.find((item) => item.error_message)?.error_message || null
          : null
      )
      setState(nextState)

      if (nextState === "success") {
        console.info("[Infographics] Article infographic batch completed", {
          batchId: batchIdRef.current,
        })
        return "stop"
      }
      if (nextState === "failed") {
        console.warn("[Infographics] Article infographic batch failed", {
          batchId: batchIdRef.current,
        })
        return "stop"
      }
      return "continue"
    },
    onTimeout: () => {
      console.warn("[Infographics] Batch polling timed out", {
        requestId: requestIdRef.current,
        batchId: batchIdRef.current,
        logIds: logIdsRef.current,
      })
      setState("failed")
      setErrorMessage("polling_timeout")
    },
    policy: INFOGRAPHIC_POLLING_POLICY,
    debugLabel: "infographic-batch",
  })

  const stopPolling = useCallback(() => {
    stopAdaptivePolling()
  }, [stopAdaptivePolling])

  const startPolling = useCallback(async (
    nextRequestId: number,
    nextPollUrl: string,
    nextBatchId?: string
  ) => {
    stopAdaptivePolling()
    requestIdRef.current = nextRequestId
    requestPollUrlRef.current = nextPollUrl
    requestResolvedRef.current = false
    logIdsRef.current = []
    logPollUrlsRef.current = new Map()
    batchIdRef.current = nextBatchId ?? null
    setRequestId(nextRequestId)
    setRequestDetail(null)
    setBatchId(nextBatchId ?? null)
    setLogIds([])
    setDetails([])
    setErrorMessage(null)
    setState("pending")

    // TODO(observability): add gauges for active article analysis and child-task polling.
    console.info("[Infographics] Starting article request polling", {
      requestId: nextRequestId,
      pollUrl: nextPollUrl,
      batchId: nextBatchId ?? null,
    })
    startAdaptivePolling()
  }, [startAdaptivePolling, stopAdaptivePolling])

  const markSubmitting = useCallback(() => {
    stopAdaptivePolling()
    requestIdRef.current = null
    requestPollUrlRef.current = null
    requestResolvedRef.current = false
    logIdsRef.current = []
    logPollUrlsRef.current = new Map()
    batchIdRef.current = null
    setRequestId(null)
    setRequestDetail(null)
    setBatchId(null)
    setLogIds([])
    setState("submitting")
    setErrorMessage(null)
    setDetails([])
  }, [stopAdaptivePolling])

  const reset = useCallback(() => {
    stopAdaptivePolling()
    requestIdRef.current = null
    requestPollUrlRef.current = null
    requestResolvedRef.current = false
    logIdsRef.current = []
    logPollUrlsRef.current = new Map()
    batchIdRef.current = null
    setRequestId(null)
    setRequestDetail(null)
    setBatchId(null)
    setLogIds([])
    setDetails([])
    setErrorMessage(null)
    setState("idle")
  }, [stopAdaptivePolling])

  return {
    requestId,
    requestDetail,
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
