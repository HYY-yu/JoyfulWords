"use client"

import { useCallback, useRef, useState } from "react"
import type { ArticlePodcastAudioSegment } from "@/lib/api/podcast/types"
import {
  createPodcastAudioFileName,
  mergePodcastAudioSegmentsToWav,
  type PodcastAudioMergePhase,
} from "@/lib/audio/podcast-audio-merge"

export type PodcastAudioMergeState =
  | "idle"
  | PodcastAudioMergePhase
  | "success"
  | "failed"

export interface PodcastAudioMergeProgressState {
  completedSegments: number
  totalSegments: number
  percent: number
}

export interface PodcastAudioMergeRequest {
  segments: ArticlePodcastAudioSegment[]
  title?: string | null
}

export interface UsePodcastAudioMergeReturn {
  mergeState: PodcastAudioMergeState
  mergeProgress: PodcastAudioMergeProgressState
  mergeErrorMessage: string | null
  mergeAndDownload: (request: PodcastAudioMergeRequest) => Promise<boolean>
  resetMerge: () => void
}

const EMPTY_PROGRESS: PodcastAudioMergeProgressState = {
  completedSegments: 0,
  totalSegments: 0,
  percent: 0,
}

function getCaughtErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "podcast_audio_merge_aborted"
  }

  return error instanceof Error ? error.message : "podcast_audio_merge_failed"
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = fileName
  anchor.rel = "noopener"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function usePodcastAudioMerge(): UsePodcastAudioMergeReturn {
  const [mergeState, setMergeState] = useState<PodcastAudioMergeState>("idle")
  const [mergeProgress, setMergeProgress] = useState<PodcastAudioMergeProgressState>(EMPTY_PROGRESS)
  const [mergeErrorMessage, setMergeErrorMessage] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const resetMerge = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setMergeState("idle")
    setMergeProgress(EMPTY_PROGRESS)
    setMergeErrorMessage(null)
  }, [])

  const mergeAndDownload = useCallback(async ({ segments, title }: PodcastAudioMergeRequest) => {
    abortControllerRef.current?.abort()
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    setMergeState("fetching")
    setMergeProgress({
      completedSegments: 0,
      totalSegments: segments.length,
      percent: 0,
    })
    setMergeErrorMessage(null)

    console.info("[PodcastAudioMerge] Starting client-side audio merge", {
      segmentCount: segments.length,
      title,
    })
    // TODO(observability): add podcast client merge duration, output size, and failure reason metrics.

    try {
      const startedAt = performance.now()
      const blob = await mergePodcastAudioSegmentsToWav(segments, {
        signal: abortController.signal,
        onProgress: (progress) => {
          setMergeState(progress.phase)
          setMergeProgress({
            completedSegments: progress.completedSegments,
            totalSegments: progress.totalSegments,
            percent: progress.percent,
          })
        },
      })

      if (abortController.signal.aborted) return false

      triggerBlobDownload(blob, createPodcastAudioFileName(title))
      setMergeState("success")
      setMergeProgress({
        completedSegments: segments.length,
        totalSegments: segments.length,
        percent: 100,
      })
      console.info("[PodcastAudioMerge] Client-side audio merge completed", {
        segmentCount: segments.length,
        outputBytes: blob.size,
        durationMs: Math.round(performance.now() - startedAt),
      })
      return true
    } catch (error) {
      if (abortController.signal.aborted) {
        console.debug("[PodcastAudioMerge] Client-side audio merge aborted")
        return false
      }

      const errorMessage = getCaughtErrorMessage(error)
      console.error("[PodcastAudioMerge] Client-side audio merge failed", {
        segmentCount: segments.length,
        error,
      })
      setMergeState("failed")
      setMergeErrorMessage(errorMessage)
      return false
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
      }
    }
  }, [])

  return {
    mergeState,
    mergeProgress,
    mergeErrorMessage,
    mergeAndDownload,
    resetMerge,
  }
}
