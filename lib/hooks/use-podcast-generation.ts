"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ErrorResponse } from "@/lib/api/types"
import { podcastClient } from "@/lib/api/podcast/client"
import {
  getPodcastAudioProgress,
  getSortedPodcastAudioSegments,
  isPodcastTerminalStatus,
  type ArticlePodcastAudioManifest,
  type ArticlePodcastAudioTask,
  type ArticlePodcastScriptRecord,
  type CreateArticlePodcastAudioRequest,
  type CreateArticlePodcastScriptRequest,
  type PodcastGenerationStatus,
  type PodcastType,
  type RegenerateArticlePodcastAudioSegmentRequest,
  type UpdateArticlePodcastScriptRequest,
} from "@/lib/api/podcast/types"

export type PodcastGenerationPhaseState =
  | "idle"
  | "loading"
  | "submitting"
  | PodcastGenerationStatus

const POLL_INTERVAL_MS = 5000
const POLLING_TIMEOUT_MS = 10 * 60 * 1000

function isErrorResponse(result: unknown): result is ErrorResponse {
  return Boolean(result && typeof result === "object" && "error" in result)
}

function getErrorMessage(result: ErrorResponse, fallback: string): string {
  return result.error || result.error_description || result.reason || fallback
}

function getTaskManifest(task: ArticlePodcastAudioTask | null): ArticlePodcastAudioManifest | null {
  return task?.audio_manifest_json ?? null
}

export interface UsePodcastGenerationReturn {
  script: ArticlePodcastScriptRecord | null
  audioTask: ArticlePodcastAudioTask | null
  audioManifest: ArticlePodcastAudioManifest | null
  audioSegments: ReturnType<typeof getSortedPodcastAudioSegments>
  audioProgress: ReturnType<typeof getPodcastAudioProgress>
  scriptState: PodcastGenerationPhaseState
  audioState: PodcastGenerationPhaseState
  updatingScript: boolean
  scriptErrorMessage: string | null
  audioErrorMessage: string | null
  loadLatestScript: (articleId: number, podcastType: PodcastType) => Promise<void>
  createScript: (request: CreateArticlePodcastScriptRequest) => Promise<void>
  updateScript: (scriptId: number, request: UpdateArticlePodcastScriptRequest) => Promise<boolean>
  createAudio: (scriptId: number, request: CreateArticlePodcastAudioRequest) => Promise<void>
  regenerateAudioSegment: (
    scriptId: number,
    segmentId: string,
    request?: RegenerateArticlePodcastAudioSegmentRequest
  ) => Promise<boolean>
  reset: () => void
  stopPolling: () => void
}

export function usePodcastGeneration(): UsePodcastGenerationReturn {
  const [script, setScript] = useState<ArticlePodcastScriptRecord | null>(null)
  const [audioTask, setAudioTask] = useState<ArticlePodcastAudioTask | null>(null)
  const [scriptState, setScriptState] = useState<PodcastGenerationPhaseState>("idle")
  const [audioState, setAudioState] = useState<PodcastGenerationPhaseState>("idle")
  const [updatingScript, setUpdatingScript] = useState(false)
  const [scriptErrorMessage, setScriptErrorMessage] = useState<string | null>(null)
  const [audioErrorMessage, setAudioErrorMessage] = useState<string | null>(null)

  const scriptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scriptStartedAtRef = useRef<number | null>(null)
  const audioStartedAtRef = useRef<number | null>(null)
  const activeScriptIdRef = useRef<number | null>(null)
  const activeAudioTaskIdRef = useRef<number | null>(null)
  const scriptPollingActiveRef = useRef(false)
  const audioPollingActiveRef = useRef(false)

  const audioManifest = useMemo(() => getTaskManifest(audioTask), [audioTask])
  const audioSegments = useMemo(() => getSortedPodcastAudioSegments(audioManifest), [audioManifest])
  const audioProgress = useMemo(
    () => getPodcastAudioProgress(audioTask, audioManifest),
    [audioManifest, audioTask]
  )

  const clearScriptTimer = useCallback(() => {
    if (!scriptTimerRef.current) return
    clearTimeout(scriptTimerRef.current)
    scriptTimerRef.current = null
  }, [])

  const clearAudioTimer = useCallback(() => {
    if (!audioTimerRef.current) return
    clearTimeout(audioTimerRef.current)
    audioTimerRef.current = null
  }, [])

  const stopScriptPolling = useCallback(() => {
    scriptPollingActiveRef.current = false
    clearScriptTimer()
  }, [clearScriptTimer])

  const stopAudioPolling = useCallback(() => {
    audioPollingActiveRef.current = false
    clearAudioTimer()
  }, [clearAudioTimer])

  const stopPolling = useCallback(() => {
    stopScriptPolling()
    stopAudioPolling()
  }, [stopAudioPolling, stopScriptPolling])

  const loadCurrentAudio = useCallback(async (scriptId: number) => {
    try {
      const result = await podcastClient.getArticleScriptAudio(scriptId)

      if (isErrorResponse(result)) {
        if (result.status === 404) {
          console.debug("[Podcast] No existing podcast audio task for script", { scriptId })
          setAudioTask(null)
          setAudioState("idle")
          setAudioErrorMessage(null)
          return
        }

        console.warn("[Podcast] Failed to fetch existing podcast audio task", {
          scriptId,
          error: result.error,
          status: result.status,
        })
        setAudioErrorMessage(getErrorMessage(result, "Failed to load podcast audio"))
        setAudioState("failed")
        return
      }

      setAudioTask(result)
      setAudioState(result.status)
      setAudioErrorMessage(result.status === "failed" ? result.error_message ?? null : null)

      if (!isPodcastTerminalStatus(result.status)) {
        console.info("[Podcast] Loaded active existing podcast audio task", {
          taskId: result.id,
          status: result.status,
        })
      }
    } catch (error) {
      console.error("[Podcast] Unexpected error while loading existing podcast audio", {
        scriptId,
        error,
      })
      setAudioErrorMessage(error instanceof Error ? error.message : "Failed to load podcast audio")
      setAudioState("failed")
    }
  }, [])

  const pollAudioTask = useCallback(async function pollAudioTask(taskId: number) {
    if (!audioPollingActiveRef.current || activeAudioTaskIdRef.current !== taskId) return

    const startedAt = audioStartedAtRef.current ?? Date.now()
    if (Date.now() - startedAt > POLLING_TIMEOUT_MS) {
      console.warn("[Podcast] Audio polling timed out", { taskId })
      stopAudioPolling()
      setAudioState("failed")
      setAudioErrorMessage("polling_timeout")
      return
    }

    try {
      const result = await podcastClient.getAudioTask(taskId)

      if (isErrorResponse(result)) {
        console.error("[Podcast] Failed to poll podcast audio task", {
          taskId,
          error: result.error,
          status: result.status,
        })
        stopAudioPolling()
        setAudioState("failed")
        setAudioErrorMessage(getErrorMessage(result, "Failed to load podcast audio"))
        return
      }

      console.debug("[Podcast] Podcast audio task status", {
        taskId,
        status: result.status,
        completedSegments: result.completed_segments,
        totalSegments: result.total_segments,
      })

      setAudioTask(result)
      setAudioState(result.status)
      setAudioErrorMessage(result.status === "failed" ? result.error_message ?? null : null)

      if (result.status === "success") {
        console.info("[Podcast] Podcast audio generation succeeded", {
          taskId,
          totalSegments: result.total_segments,
        })
        stopAudioPolling()
        return
      }

      if (result.status === "failed") {
        console.warn("[Podcast] Podcast audio generation failed", {
          taskId,
          errorMessage: result.error_message,
        })
        stopAudioPolling()
        return
      }

      clearAudioTimer()
      audioTimerRef.current = setTimeout(() => {
        void pollAudioTask(taskId)
      }, POLL_INTERVAL_MS)
    } catch (error) {
      console.error("[Podcast] Unexpected podcast audio polling error", {
        taskId,
        error,
      })
      stopAudioPolling()
      setAudioState("failed")
      setAudioErrorMessage(error instanceof Error ? error.message : "Failed to poll podcast audio")
    }
  }, [clearAudioTimer, stopAudioPolling])

  const startAudioPolling = useCallback(
    (taskId: number) => {
      stopAudioPolling()
      activeAudioTaskIdRef.current = taskId
      audioStartedAtRef.current = Date.now()
      audioPollingActiveRef.current = true
      console.info("[Podcast] Starting podcast audio polling", { taskId })
      // TODO(observability): add active podcast audio polling gauge.
      void pollAudioTask(taskId)
    },
    [pollAudioTask, stopAudioPolling]
  )

  const pollScript = useCallback(async function pollScript(scriptId: number) {
    if (!scriptPollingActiveRef.current || activeScriptIdRef.current !== scriptId) return

    const startedAt = scriptStartedAtRef.current ?? Date.now()
    if (Date.now() - startedAt > POLLING_TIMEOUT_MS) {
      console.warn("[Podcast] Script polling timed out", { scriptId })
      stopScriptPolling()
      setScriptState("failed")
      setScriptErrorMessage("polling_timeout")
      return
    }

    try {
      const result = await podcastClient.getArticleScript(scriptId)

      if (isErrorResponse(result)) {
        console.error("[Podcast] Failed to poll podcast script", {
          scriptId,
          error: result.error,
          status: result.status,
        })
        stopScriptPolling()
        setScriptState("failed")
        setScriptErrorMessage(getErrorMessage(result, "Failed to load podcast script"))
        return
      }

      console.debug("[Podcast] Podcast script status", {
        scriptId,
        status: result.status,
      })

      setScript(result)
      setScriptState(result.status)
      setScriptErrorMessage(result.status === "failed" ? result.error_message ?? null : null)

      if (result.status === "success") {
        console.info("[Podcast] Podcast script generation succeeded", { scriptId })
        stopScriptPolling()
        await loadCurrentAudio(result.id)
        return
      }

      if (result.status === "failed") {
        console.warn("[Podcast] Podcast script generation failed", {
          scriptId,
          errorMessage: result.error_message,
        })
        stopScriptPolling()
        return
      }

      clearScriptTimer()
      scriptTimerRef.current = setTimeout(() => {
        void pollScript(scriptId)
      }, POLL_INTERVAL_MS)
    } catch (error) {
      console.error("[Podcast] Unexpected podcast script polling error", {
        scriptId,
        error,
      })
      stopScriptPolling()
      setScriptState("failed")
      setScriptErrorMessage(error instanceof Error ? error.message : "Failed to poll podcast script")
    }
  }, [clearScriptTimer, loadCurrentAudio, stopScriptPolling])

  const startScriptPolling = useCallback(
    (scriptId: number) => {
      stopScriptPolling()
      activeScriptIdRef.current = scriptId
      scriptStartedAtRef.current = Date.now()
      scriptPollingActiveRef.current = true
      console.info("[Podcast] Starting podcast script polling", { scriptId })
      // TODO(observability): add active podcast script polling gauge.
      void pollScript(scriptId)
    },
    [pollScript, stopScriptPolling]
  )

  const loadLatestScript = useCallback(
    async (articleId: number, podcastType: PodcastType) => {
      stopPolling()
      setScriptState("loading")
      setScriptErrorMessage(null)
      setAudioTask(null)
      setAudioState("idle")
      setAudioErrorMessage(null)

      try {
        const result = await podcastClient.getLatestArticleScript(articleId, podcastType)

        if (isErrorResponse(result)) {
          if (result.status === 404) {
            console.debug("[Podcast] No latest podcast script found", { articleId, podcastType })
            setScript(null)
            setScriptState("idle")
            return
          }

          console.warn("[Podcast] Failed to load latest podcast script", {
            articleId,
            podcastType,
            error: result.error,
            status: result.status,
          })
          setScript(null)
          setScriptState("failed")
          setScriptErrorMessage(getErrorMessage(result, "Failed to load podcast script"))
          return
        }

        setScript(result)
        setScriptState(result.status)
        setScriptErrorMessage(result.status === "failed" ? result.error_message ?? null : null)

        if (result.status === "success") {
          await loadCurrentAudio(result.id)
        } else if (!isPodcastTerminalStatus(result.status)) {
          startScriptPolling(result.id)
        }
      } catch (error) {
        console.error("[Podcast] Unexpected error while loading latest podcast script", {
          articleId,
          podcastType,
          error,
        })
        setScript(null)
        setScriptState("failed")
        setScriptErrorMessage(error instanceof Error ? error.message : "Failed to load podcast script")
      }
    },
    [loadCurrentAudio, startScriptPolling, stopPolling]
  )

  const createScript = useCallback(
    async (request: CreateArticlePodcastScriptRequest) => {
      stopPolling()
      setScriptState("submitting")
      setScriptErrorMessage(null)
      setAudioTask(null)
      setAudioState("idle")
      setAudioErrorMessage(null)

      try {
        const result = await podcastClient.createArticleScript(request)

        if (isErrorResponse(result)) {
          console.warn("[Podcast] Podcast script creation failed", {
            articleId: request.article_id,
            podcastType: request.podcast_type,
            error: result.error,
            status: result.status,
          })
          setScriptState("failed")
          setScriptErrorMessage(getErrorMessage(result, "Failed to create podcast script"))
          return
        }

        setScript(result)
        setScriptState(result.status)

        if (isPodcastTerminalStatus(result.status)) {
          if (result.status === "success") {
            await loadCurrentAudio(result.id)
          }
          return
        }

        startScriptPolling(result.id)
      } catch (error) {
        console.error("[Podcast] Unexpected podcast script creation error", {
          articleId: request.article_id,
          podcastType: request.podcast_type,
          error,
        })
        setScriptState("failed")
        setScriptErrorMessage(error instanceof Error ? error.message : "Failed to create podcast script")
      }
    },
    [loadCurrentAudio, startScriptPolling, stopPolling]
  )

  const createAudio = useCallback(
    async (scriptId: number, request: CreateArticlePodcastAudioRequest) => {
      stopAudioPolling()
      setAudioState("submitting")
      setAudioErrorMessage(null)

      try {
        const result = await podcastClient.createArticleScriptAudio(scriptId, request)

        if (isErrorResponse(result)) {
          console.warn("[Podcast] Podcast audio creation failed", {
            scriptId,
            error: result.error,
            status: result.status,
          })
          setAudioState("failed")
          setAudioErrorMessage(getErrorMessage(result, "Failed to create podcast audio"))
          return
        }

        setAudioTask(result)
        setAudioState(result.status)

        if (!isPodcastTerminalStatus(result.status)) {
          startAudioPolling(result.id)
          return
        }

        if (result.status === "failed") {
          setAudioErrorMessage(result.error_message ?? null)
        }
      } catch (error) {
        console.error("[Podcast] Unexpected podcast audio creation error", {
          scriptId,
          error,
        })
        setAudioState("failed")
        setAudioErrorMessage(error instanceof Error ? error.message : "Failed to create podcast audio")
      }
    },
    [startAudioPolling, stopAudioPolling]
  )

  const regenerateAudioSegment = useCallback(
    async (
      scriptId: number,
      segmentId: string,
      request: RegenerateArticlePodcastAudioSegmentRequest = {}
    ) => {
      stopAudioPolling()
      setAudioState("submitting")
      setAudioErrorMessage(null)

      try {
        const result = await podcastClient.regenerateArticleScriptAudioSegment(
          scriptId,
          segmentId,
          request
        )

        if (isErrorResponse(result)) {
          console.warn("[Podcast] Podcast audio segment regeneration failed", {
            scriptId,
            segmentId,
            error: result.error,
            status: result.status,
          })
          setAudioState("failed")
          setAudioErrorMessage(getErrorMessage(result, "Failed to regenerate podcast audio segment"))
          return false
        }

        console.info("[Podcast] Podcast audio segment regeneration accepted", {
          scriptId,
          segmentId,
          taskId: result.id,
          status: result.status,
        })
        setAudioTask(result)
        setAudioState(result.status)

        if (!isPodcastTerminalStatus(result.status)) {
          startAudioPolling(result.id)
          return true
        }

        if (result.status === "failed") {
          setAudioErrorMessage(result.error_message ?? null)
          return false
        }

        return true
      } catch (error) {
        console.error("[Podcast] Unexpected podcast audio segment regeneration error", {
          scriptId,
          segmentId,
          error,
        })
        setAudioState("failed")
        setAudioErrorMessage(
          error instanceof Error ? error.message : "Failed to regenerate podcast audio segment"
        )
        return false
      }
    },
    [startAudioPolling, stopAudioPolling]
  )

  const updateScript = useCallback(async (scriptId: number, request: UpdateArticlePodcastScriptRequest) => {
    setUpdatingScript(true)
    setScriptErrorMessage(null)

    try {
      const result = await podcastClient.updateArticleScript(scriptId, request)

      if (isErrorResponse(result)) {
        console.warn("[Podcast] Podcast script text update failed", {
          scriptId,
          segmentCount: request.segments?.length ?? 0,
          error: result.error,
          status: result.status,
        })
        setScriptErrorMessage(getErrorMessage(result, "Failed to update podcast script"))
        return false
      }

      console.info("[Podcast] Podcast script text update succeeded", {
        scriptId,
        revision: result.revision,
        segmentCount: result.script_json?.segments.length ?? 0,
      })
      setScript(result)
      setScriptState(result.status)
      setAudioErrorMessage(null)
      return true
    } catch (error) {
      console.error("[Podcast] Unexpected podcast script text update error", {
        scriptId,
        error,
      })
      setScriptErrorMessage(error instanceof Error ? error.message : "Failed to update podcast script")
      return false
    } finally {
      setUpdatingScript(false)
    }
  }, [])

  const reset = useCallback(() => {
    stopPolling()
    activeScriptIdRef.current = null
    activeAudioTaskIdRef.current = null
    scriptStartedAtRef.current = null
    audioStartedAtRef.current = null
    setScript(null)
    setAudioTask(null)
    setScriptState("idle")
    setAudioState("idle")
    setUpdatingScript(false)
    setScriptErrorMessage(null)
    setAudioErrorMessage(null)
  }, [stopPolling])

  useEffect(() => {
    if (!audioTask || isPodcastTerminalStatus(audioTask.status)) return
    if (audioState === "loading" || audioState === "submitting") return
    if (audioPollingActiveRef.current && activeAudioTaskIdRef.current === audioTask.id) return

    startAudioPolling(audioTask.id)
  }, [audioState, audioTask, startAudioPolling])

  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  return {
    script,
    audioTask,
    audioManifest,
    audioSegments,
    audioProgress,
    scriptState,
    audioState,
    updatingScript,
    scriptErrorMessage,
    audioErrorMessage,
    loadLatestScript,
    createScript,
    updateScript,
    createAudio,
    regenerateAudioSegment,
    reset,
    stopPolling,
  }
}
