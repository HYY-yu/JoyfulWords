"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ErrorResponse } from "@/lib/api/types"
import { podcastClient } from "@/lib/api/podcast/client"
import {
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
import { useAdaptivePolling } from "@/lib/hooks/use-adaptive-polling"
import { notifyTaskCenterTaskSubmitted } from "@/lib/taskcenter/task-events"

export type PodcastGenerationPhaseState =
  | "idle"
  | "loading"
  | "submitting"
  | PodcastGenerationStatus

const POLLING_TIMEOUT_MS = 10 * 60 * 1000
const AUDIO_MANIFEST_CACHE_PREFIX = "joyfulwords-podcast-audio-manifest-v1"
const AUDIO_MANIFEST_CACHE_TTL_MS = 60 * 60 * 1000

type AudioPollingMode = "full" | "segment"

interface CachedAudioManifestSnapshot {
  savedAt: number
  taskId: number
  scriptId: number
  manifest: ArticlePodcastAudioManifest
  pendingSegmentIds: string[]
}

function isErrorResponse(result: unknown): result is ErrorResponse {
  return Boolean(result && typeof result === "object" && "error" in result)
}

function getErrorMessage(result: ErrorResponse, fallback: string): string {
  return result.error || result.error_description || result.reason || fallback
}

function getTaskManifest(task: ArticlePodcastAudioTask | null): ArticlePodcastAudioManifest | null {
  return task?.audio_manifest_json ?? null
}

function hasPlayableAudioSegment(task: ArticlePodcastAudioTask | null): boolean {
  return Boolean(
    task?.audio_manifest_json?.segments.some(
      (segment) => segment.provider_status === "success" && Boolean(segment.audio_url)
    )
  )
}

function getAudioManifestCacheKey(taskId: number): string {
  return `${AUDIO_MANIFEST_CACHE_PREFIX}:${taskId}`
}

function hasManifestSegments(
  manifest: ArticlePodcastAudioManifest | null | undefined
): manifest is ArticlePodcastAudioManifest {
  return Array.isArray(manifest?.segments) && manifest.segments.length > 0
}

function readCachedAudioManifest(task: ArticlePodcastAudioTask): CachedAudioManifestSnapshot | null {
  if (typeof window === "undefined") return null

  try {
    const rawValue = window.localStorage.getItem(getAudioManifestCacheKey(task.id))
    if (!rawValue) return null

    const parsed = JSON.parse(rawValue) as Partial<CachedAudioManifestSnapshot>
    if (
      parsed.taskId !== task.id ||
      parsed.scriptId !== task.script_id ||
      typeof parsed.savedAt !== "number" ||
      Date.now() - parsed.savedAt > AUDIO_MANIFEST_CACHE_TTL_MS ||
      !hasManifestSegments(parsed.manifest)
    ) {
      window.localStorage.removeItem(getAudioManifestCacheKey(task.id))
      return null
    }

    return {
      savedAt: parsed.savedAt,
      taskId: parsed.taskId,
      scriptId: parsed.scriptId,
      manifest: parsed.manifest,
      pendingSegmentIds: Array.isArray(parsed.pendingSegmentIds) ? parsed.pendingSegmentIds : [],
    }
  } catch (error) {
    console.warn("[Podcast] Failed to read cached podcast audio manifest", {
      taskId: task.id,
      error,
    })
    return null
  }
}

function writeCachedAudioManifest(
  task: ArticlePodcastAudioTask,
  manifest: ArticlePodcastAudioManifest,
  pendingSegmentIds: Set<string>
) {
  if (typeof window === "undefined" || !hasManifestSegments(manifest)) return

  try {
    window.localStorage.setItem(
      getAudioManifestCacheKey(task.id),
      JSON.stringify({
        savedAt: Date.now(),
        taskId: task.id,
        scriptId: task.script_id,
        manifest,
        pendingSegmentIds: Array.from(pendingSegmentIds),
      } satisfies CachedAudioManifestSnapshot)
    )
  } catch (error) {
    console.warn("[Podcast] Failed to cache podcast audio manifest", {
      taskId: task.id,
      error,
    })
  }
}

function mergeAudioManifest(
  previousManifest: ArticlePodcastAudioManifest | null,
  nextManifest: ArticlePodcastAudioManifest | null | undefined,
  pendingSegmentIds: Set<string>,
  taskStatus: PodcastGenerationStatus
): ArticlePodcastAudioManifest | null {
  const baseManifest = hasManifestSegments(nextManifest)
    ? nextManifest
    : hasManifestSegments(previousManifest)
    ? previousManifest
    : null
  if (!baseManifest) return null

  const nextSegments = hasManifestSegments(nextManifest) ? nextManifest.segments : []
  const nextById = new Map(nextSegments.map((segment) => [segment.id, segment]))
  const previousSegments = hasManifestSegments(previousManifest) ? previousManifest.segments : []
  const previousById = new Map(previousSegments.map((segment) => [segment.id, segment]))
  const orderedIds = [
    ...previousSegments.map((segment) => segment.id),
    ...nextSegments.map((segment) => segment.id),
  ].filter((segmentId, index, segmentIds) => segmentIds.indexOf(segmentId) === index)

  const segments = orderedIds
    .map((segmentId) => {
      const nextSegment = nextById.get(segmentId)
      const previousSegment = previousById.get(segmentId)
      const pending = pendingSegmentIds.has(segmentId) && !isPodcastTerminalStatus(taskStatus)

      if (pending && (nextSegment || previousSegment)) {
        return {
          ...(nextSegment ?? previousSegment!),
          audio_url: "",
          provider_status: taskStatus,
        }
      }

      if (
        nextSegment &&
        previousSegment?.audio_url &&
        !nextSegment.audio_url &&
        !pendingSegmentIds.has(segmentId)
      ) {
        return previousSegment
      }

      return nextSegment ?? previousSegment ?? null
    })
    .filter((segment): segment is ArticlePodcastAudioManifest["segments"][number] => Boolean(segment))
    .sort((left, right) => left.index - right.index)

  return {
    ...baseManifest,
    ...nextManifest,
    segments,
  }
}

export interface UsePodcastGenerationReturn {
  script: ArticlePodcastScriptRecord | null
  audioTask: ArticlePodcastAudioTask | null
  audioManifest: ArticlePodcastAudioManifest | null
  audioSegments: ReturnType<typeof getSortedPodcastAudioSegments>
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

  const activeScriptIdRef = useRef<number | null>(null)
  const activeAudioTaskIdRef = useRef<number | null>(null)
  const lastKnownAudioManifestRef = useRef<ArticlePodcastAudioManifest | null>(null)
  const pendingAudioSegmentIdsRef = useRef<Set<string>>(new Set())
  const audioPollingModeRef = useRef<AudioPollingMode>("full")

  const audioManifest = useMemo(() => getTaskManifest(audioTask), [audioTask])
  const audioSegments = useMemo(() => getSortedPodcastAudioSegments(audioManifest), [audioManifest])

  const applyAudioTask = useCallback(
    (task: ArticlePodcastAudioTask, mode: AudioPollingMode = "full"): ArticlePodcastAudioTask => {
      if (isPodcastTerminalStatus(task.status)) {
        pendingAudioSegmentIdsRef.current.clear()
      }

      const cachedSnapshot = readCachedAudioManifest(task)
      if (!lastKnownAudioManifestRef.current && cachedSnapshot?.manifest) {
        lastKnownAudioManifestRef.current = cachedSnapshot.manifest
      }
      if (cachedSnapshot?.pendingSegmentIds.length && !isPodcastTerminalStatus(task.status)) {
        pendingAudioSegmentIdsRef.current = new Set([
          ...Array.from(pendingAudioSegmentIdsRef.current),
          ...cachedSnapshot.pendingSegmentIds,
        ])
      }

      const mergedManifest =
        mode === "segment" || pendingAudioSegmentIdsRef.current.size > 0
          ? mergeAudioManifest(
              lastKnownAudioManifestRef.current ?? cachedSnapshot?.manifest ?? null,
              task.audio_manifest_json,
              pendingAudioSegmentIdsRef.current,
              task.status
            )
          : hasManifestSegments(task.audio_manifest_json)
          ? task.audio_manifest_json
          : null

      if (mergedManifest) {
        lastKnownAudioManifestRef.current = mergedManifest
        writeCachedAudioManifest(task, mergedManifest, pendingAudioSegmentIdsRef.current)
        return {
          ...task,
          audio_manifest_json: mergedManifest,
        }
      }

      return task
    },
    []
  )

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

      const nextMode = hasPlayableAudioSegment(result) || readCachedAudioManifest(result) ? "segment" : "full"
      const nextTask = applyAudioTask(result, nextMode)
      setAudioTask(nextTask)
      setAudioState(nextTask.status)
      setAudioErrorMessage(nextTask.status === "failed" ? nextTask.error_message ?? null : null)

      if (!isPodcastTerminalStatus(nextTask.status)) {
        console.info("[Podcast] Loaded active existing podcast audio task", {
          taskId: nextTask.id,
          status: nextTask.status,
          mode: nextMode,
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
  }, [applyAudioTask])

  const {
    isPolling: isAudioPolling,
    startPolling: startAdaptiveAudioPolling,
    stopPolling: stopAdaptiveAudioPolling,
  } = useAdaptivePolling({
    poll: async ({ signal }) => {
      const taskId = activeAudioTaskIdRef.current
      if (taskId === null) return "stop"
      const result = await podcastClient.getAudioTask(taskId, signal)
      if (isErrorResponse(result)) {
        console.warn("[Podcast] Failed to poll podcast audio task; retrying", {
          taskId,
          error: result.error,
          status: result.status,
        })
        throw new Error(getErrorMessage(result, "Failed to load podcast audio"))
      }

      const pollingMode = audioPollingModeRef.current
      const nextTask = applyAudioTask(result, pollingMode)
      console.debug("[Podcast] Podcast audio task status", {
        taskId,
        status: nextTask.status,
        completedSegments: nextTask.completed_segments,
        totalSegments: nextTask.total_segments,
      })
      setAudioTask(nextTask)
      if (pollingMode === "full" || isPodcastTerminalStatus(nextTask.status)) {
        setAudioState(nextTask.status)
      }
      setAudioErrorMessage(nextTask.status === "failed" ? nextTask.error_message ?? null : null)

      if (nextTask.status === "success") {
        console.info("[Podcast] Podcast audio generation succeeded", {
          taskId,
          mode: pollingMode,
          totalSegments: nextTask.total_segments,
        })
        return "stop"
      }
      if (nextTask.status === "failed") {
        console.warn("[Podcast] Podcast audio generation failed", {
          taskId,
          mode: pollingMode,
          errorMessage: nextTask.error_message,
        })
        return "stop"
      }
      return "continue"
    },
    onTimeout: () => {
      console.warn("[Podcast] Audio polling timed out", {
        taskId: activeAudioTaskIdRef.current,
      })
      setAudioState("failed")
      setAudioErrorMessage("polling_timeout")
    },
    policy: {
      fastIntervalMs: 3_000,
      standardIntervalMs: 5_000,
      slowIntervalMs: 10_000,
      timeoutMs: POLLING_TIMEOUT_MS,
    },
    debugLabel: "podcast-audio",
  })

  const {
    startPolling: startAdaptiveScriptPolling,
    stopPolling: stopAdaptiveScriptPolling,
  } = useAdaptivePolling({
    poll: async ({ signal }) => {
      const scriptId = activeScriptIdRef.current
      if (scriptId === null) return "stop"
      const result = await podcastClient.getArticleScript(scriptId, signal)
      if (isErrorResponse(result)) {
        console.warn("[Podcast] Failed to poll podcast script; retrying", {
          scriptId,
          error: result.error,
          status: result.status,
        })
        throw new Error(getErrorMessage(result, "Failed to load podcast script"))
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
        await loadCurrentAudio(result.id)
        return "stop"
      }
      if (result.status === "failed") {
        console.warn("[Podcast] Podcast script generation failed", {
          scriptId,
          errorMessage: result.error_message,
        })
        return "stop"
      }
      return "continue"
    },
    onTimeout: () => {
      console.warn("[Podcast] Script polling timed out", {
        scriptId: activeScriptIdRef.current,
      })
      setScriptState("failed")
      setScriptErrorMessage("polling_timeout")
    },
    policy: {
      fastIntervalMs: 3_000,
      standardIntervalMs: 5_000,
      slowIntervalMs: 10_000,
      timeoutMs: POLLING_TIMEOUT_MS,
    },
    debugLabel: "podcast-script",
  })

  const stopAudioPolling = useCallback(() => {
    stopAdaptiveAudioPolling()
    activeAudioTaskIdRef.current = null
  }, [stopAdaptiveAudioPolling])

  const stopScriptPolling = useCallback(() => {
    stopAdaptiveScriptPolling()
    activeScriptIdRef.current = null
  }, [stopAdaptiveScriptPolling])

  const stopPolling = useCallback(() => {
    stopScriptPolling()
    stopAudioPolling()
  }, [stopAudioPolling, stopScriptPolling])

  const startAudioPolling = useCallback(
    (taskId: number, mode: AudioPollingMode = "full") => {
      stopAdaptiveAudioPolling()
      activeAudioTaskIdRef.current = taskId
      audioPollingModeRef.current = mode
      console.info("[Podcast] Starting adaptive podcast audio polling", { taskId, mode })
      // TODO(observability): add active podcast audio polling gauge.
      startAdaptiveAudioPolling()
    },
    [startAdaptiveAudioPolling, stopAdaptiveAudioPolling]
  )

  const startScriptPolling = useCallback(
    (scriptId: number) => {
      stopAdaptiveScriptPolling()
      activeScriptIdRef.current = scriptId
      console.info("[Podcast] Starting adaptive podcast script polling", { scriptId })
      // TODO(observability): add active podcast script polling gauge.
      startAdaptiveScriptPolling()
    },
    [startAdaptiveScriptPolling, stopAdaptiveScriptPolling]
  )

  const loadLatestScript = useCallback(
    async (articleId: number, podcastType: PodcastType) => {
      stopPolling()
      lastKnownAudioManifestRef.current = null
      pendingAudioSegmentIdsRef.current.clear()
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
      lastKnownAudioManifestRef.current = null
      pendingAudioSegmentIdsRef.current.clear()
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
        notifyTaskCenterTaskSubmitted({
          type: "podcast",
          taskId: result.id,
          articleId: request.article_id,
        })

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

        lastKnownAudioManifestRef.current = null
        pendingAudioSegmentIdsRef.current.clear()
        const nextTask = applyAudioTask(result, "full")
        setAudioTask(nextTask)
        setAudioState(nextTask.status)
        notifyTaskCenterTaskSubmitted({
          type: "podcast_audio",
          taskId: nextTask.id,
        })

        if (!isPodcastTerminalStatus(nextTask.status)) {
          startAudioPolling(nextTask.id, "full")
          return
        }

        if (nextTask.status === "failed") {
          setAudioErrorMessage(nextTask.error_message ?? null)
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
    [applyAudioTask, startAudioPolling, stopAudioPolling]
  )

  const regenerateAudioSegment = useCallback(
    async (
      scriptId: number,
      segmentId: string,
      request: RegenerateArticlePodcastAudioSegmentRequest = {}
    ) => {
      stopAudioPolling()
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
        pendingAudioSegmentIdsRef.current.add(segmentId)
        const nextTask = applyAudioTask(result, "segment")
        setAudioTask(nextTask)
        notifyTaskCenterTaskSubmitted({
          type: "podcast_audio",
          taskId: nextTask.id,
        })

        if (!isPodcastTerminalStatus(nextTask.status)) {
          startAudioPolling(nextTask.id, "segment")
          return true
        }

        if (nextTask.status === "failed") {
          setAudioErrorMessage(nextTask.error_message ?? null)
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
    [applyAudioTask, startAudioPolling, stopAudioPolling]
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
    lastKnownAudioManifestRef.current = null
    pendingAudioSegmentIdsRef.current.clear()
    audioPollingModeRef.current = "full"
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
    if (audioState === "loading" || audioState === "submitting" || audioState === "failed") return
    if (isAudioPolling && activeAudioTaskIdRef.current === audioTask.id) return

    startAudioPolling(audioTask.id, hasPlayableAudioSegment(audioTask) ? "segment" : "full")
  }, [audioState, audioTask, isAudioPolling, startAudioPolling])

  return {
    script,
    audioTask,
    audioManifest,
    audioSegments,
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
