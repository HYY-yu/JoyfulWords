"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import {
  getAdaptivePollingDelay,
  mergeAdaptivePollingPolicy,
  type AdaptivePollingPolicy,
} from "@/lib/polling/adaptive-polling"

export interface AdaptivePollingContext {
  attempt: number
  elapsedMs: number
  consecutiveErrors: number
  signal: AbortSignal
}

export type AdaptivePollingDecision =
  | "continue"
  | "stop"
  | {
      action: "continue" | "stop"
      delayMs?: number
    }

interface UseAdaptivePollingOptions {
  poll: (context: AdaptivePollingContext) => Promise<AdaptivePollingDecision | void>
  onError?: (
    error: unknown,
    context: Omit<AdaptivePollingContext, "signal">
  ) => AdaptivePollingDecision | void
  onTimeout?: (elapsedMs: number) => void
  policy?: Partial<AdaptivePollingPolicy>
  pauseWhenHidden?: boolean
  debugLabel?: string
}

interface StartAdaptivePollingOptions {
  immediate?: boolean
  delayMs?: number
}

interface UseAdaptivePollingReturn {
  isPolling: boolean
  startPolling: (options?: StartAdaptivePollingOptions) => void
  stopPolling: () => void
  pollNow: () => void
}

function normalizeDecision(
  decision: AdaptivePollingDecision | void
): { action: "continue" | "stop"; delayMs?: number } {
  if (!decision || decision === "continue") return { action: "continue" }
  if (decision === "stop") return { action: "stop" }
  return decision
}

export function useAdaptivePolling(
  options: UseAdaptivePollingOptions
): UseAdaptivePollingReturn {
  const optionsRef = useRef(options)
  optionsRef.current = options

  const [isPolling, setIsPolling] = useState(false)
  const isActiveRef = useRef(false)
  const startedAtRef = useRef(0)
  const attemptRef = useRef(0)
  const consecutiveErrorsRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  const requestControllerRef = useRef<AbortController | null>(null)
  const inFlightRef = useRef(false)
  const runRef = useRef<() => void>(() => undefined)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const stopPolling = useCallback(() => {
    isActiveRef.current = false
    inFlightRef.current = false
    clearTimer()
    requestControllerRef.current?.abort()
    requestControllerRef.current = null
    setIsPolling(false)
  }, [clearTimer])

  const schedule = useCallback(
    (delayMs: number) => {
      clearTimer()
      if (!isActiveRef.current) return

      const { pauseWhenHidden = true } = optionsRef.current
      if (
        pauseWhenHidden &&
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        return
      }

      timerRef.current = window.setTimeout(() => {
        runRef.current()
      }, Math.max(0, delayMs))
    },
    [clearTimer]
  )

  const run = useCallback(async () => {
    if (!isActiveRef.current || inFlightRef.current) return

    const currentOptions = optionsRef.current
    const policy = mergeAdaptivePollingPolicy(currentOptions.policy)
    const elapsedMs = Date.now() - startedAtRef.current
    if (elapsedMs > policy.timeoutMs) {
      console.warn("[AdaptivePolling] Polling timed out", {
        label: currentOptions.debugLabel ?? null,
        elapsedMs,
        attempts: attemptRef.current,
      })
      currentOptions.onTimeout?.(elapsedMs)
      stopPolling()
      return
    }

    const controller = new AbortController()
    requestControllerRef.current = controller
    inFlightRef.current = true
    const context: AdaptivePollingContext = {
      attempt: attemptRef.current,
      elapsedMs,
      consecutiveErrors: consecutiveErrorsRef.current,
      signal: controller.signal,
    }

    try {
      const decision = normalizeDecision(await currentOptions.poll(context))
      if (!isActiveRef.current || controller.signal.aborted) return

      attemptRef.current += 1
      consecutiveErrorsRef.current = 0
      if (decision.action === "stop") {
        stopPolling()
        return
      }

      schedule(
        getAdaptivePollingDelay(
          {
            elapsedMs: Date.now() - startedAtRef.current,
            consecutiveErrors: 0,
            requestedDelayMs: decision.delayMs,
          },
          policy
        )
      )
    } catch (error) {
      if (!isActiveRef.current || controller.signal.aborted) return

      consecutiveErrorsRef.current += 1
      const errorContext = {
        attempt: attemptRef.current,
        elapsedMs: Date.now() - startedAtRef.current,
        consecutiveErrors: consecutiveErrorsRef.current,
      }
      console.warn("[AdaptivePolling] Poll attempt failed", {
        label: currentOptions.debugLabel ?? null,
        ...errorContext,
        error: error instanceof Error ? error.message : String(error),
      })

      const decision = normalizeDecision(currentOptions.onError?.(error, errorContext))
      if (decision.action === "stop") {
        stopPolling()
        return
      }

      schedule(
        getAdaptivePollingDelay(
          {
            elapsedMs: errorContext.elapsedMs,
            consecutiveErrors: errorContext.consecutiveErrors,
            requestedDelayMs: decision.delayMs,
          },
          policy
        )
      )
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null
      }
      inFlightRef.current = false
    }
  }, [schedule, stopPolling])

  runRef.current = () => {
    void run()
  }

  const startPolling = useCallback(
    ({ immediate = true, delayMs }: StartAdaptivePollingOptions = {}) => {
      stopPolling()
      isActiveRef.current = true
      startedAtRef.current = Date.now()
      attemptRef.current = 0
      consecutiveErrorsRef.current = 0
      setIsPolling(true)
      schedule(
        typeof delayMs === "number"
          ? delayMs
          : immediate
            ? 0
            : mergeAdaptivePollingPolicy(optionsRef.current.policy).fastIntervalMs
      )
    },
    [schedule, stopPolling]
  )

  const pollNow = useCallback(() => {
    if (!isActiveRef.current) {
      startPolling()
      return
    }
    schedule(0)
  }, [schedule, startPolling])

  useEffect(() => {
    const resumePolling = () => {
      if (
        isActiveRef.current &&
        (typeof document === "undefined" || document.visibilityState === "visible")
      ) {
        schedule(0)
      }
    }

    document.addEventListener("visibilitychange", resumePolling)
    window.addEventListener("focus", resumePolling)
    return () => {
      document.removeEventListener("visibilitychange", resumePolling)
      window.removeEventListener("focus", resumePolling)
      stopPolling()
    }
  }, [schedule, stopPolling])

  return {
    isPolling,
    startPolling,
    stopPolling,
    pollNow,
  }
}
