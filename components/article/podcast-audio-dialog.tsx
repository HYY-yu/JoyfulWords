"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  CheckCircle2Icon,
  CircleIcon,
  DownloadIcon,
  FileTextIcon,
  Loader2Icon,
  Mic2Icon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  SaveIcon,
  SkipBackIcon,
  SkipForwardIcon,
  SlidersHorizontalIcon,
  Volume2Icon,
} from "lucide-react"
import { AIFeatureDialogShell } from "@/components/ui/ai/ai-feature-dialog-shell"
import { Alert, AlertDescription } from "@/components/ui/base/alert"
import { Badge } from "@/components/ui/base/badge"
import { Button } from "@/components/ui/base/button"
import { Label } from "@/components/ui/base/label"
import { Progress } from "@/components/ui/base/progress"
import { Skeleton } from "@/components/ui/base/skeleton"
import { Textarea } from "@/components/ui/base/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/base/select"
import { useToast } from "@/hooks/use-toast"
import {
  PODCAST_LANGUAGES,
  PODCAST_TYPES,
  type PodcastTTSVoice,
  type PodcastTTSVoicesResponse,
  type PodcastLanguage,
  type PodcastType,
} from "@/lib/api/podcast/types"
import { podcastClient } from "@/lib/api/podcast/client"
import { getPodcastAudioMergeAvailability } from "@/lib/audio/podcast-audio-merge"
import { usePodcastAudioMerge } from "@/lib/hooks/use-podcast-audio-merge"
import { usePodcastGeneration, type PodcastGenerationPhaseState } from "@/lib/hooks/use-podcast-generation"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { cn } from "@/lib/utils"

interface PodcastAudioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  articleId?: number | null
}

const TTS_VOICE_CACHE_KEY = "joyfulwords-podcast-tts-voices-v1"
const TTS_VOICE_CACHE_TTL_MS = 60 * 60 * 1000

interface CachedTTSVoices {
  savedAt: number
  response: PodcastTTSVoicesResponse
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00"

  const totalSeconds = Math.floor(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`
}

function isBusyState(state: PodcastGenerationPhaseState): boolean {
  return state === "loading" || state === "submitting" || state === "pending" || state === "processing"
}

function getStepStatus(
  state: PodcastGenerationPhaseState,
  hasSuccessData: boolean
): "idle" | "active" | "done" | "failed" {
  if (state === "failed") return "failed"
  if (hasSuccessData || state === "success") return "done"
  if (isBusyState(state)) return "active"
  return "idle"
}

function isErrorResponse(result: unknown): result is { error: string; status?: number } {
  return Boolean(result && typeof result === "object" && "error" in result)
}

function getVoiceDisplayName(voice: PodcastTTSVoice): string {
  const languageText = voice.languages.length > 0 ? ` · ${voice.languages.join(", ")}` : ""
  return `${voice.display_name || voice.id}${languageText}`
}

function pickVoiceId(
  voices: PodcastTTSVoice[],
  preferredVoice: string | null,
  index: number,
  shouldRotate: boolean
): string {
  if (voices.length === 0) return ""
  const defaultIndex = Math.max(
    0,
    voices.findIndex((voice) => voice.id === preferredVoice)
  )
  if (!shouldRotate) {
    return voices[defaultIndex]?.id ?? voices[0].id
  }

  return voices[(defaultIndex + index) % voices.length]?.id ?? voices[0].id
}

function isValidTTSVoiceResponse(value: unknown): value is PodcastTTSVoicesResponse {
  if (!value || typeof value !== "object") return false

  const candidate = value as Partial<PodcastTTSVoicesResponse>
  return (
    typeof candidate.model_name === "string" &&
    typeof candidate.default_voice === "string" &&
    typeof candidate.source === "string" &&
    Array.isArray(candidate.voices) &&
    candidate.voices.every(
      (voice) =>
        voice &&
        typeof voice === "object" &&
        typeof (voice as PodcastTTSVoice).id === "string" &&
        typeof (voice as PodcastTTSVoice).display_name === "string" &&
        Array.isArray((voice as PodcastTTSVoice).languages)
    )
  )
}

function getStoredLocalePreviewLanguage(): string {
  if (typeof window === "undefined") return "en"

  const storedLocale = window.localStorage.getItem("locale")
  return storedLocale?.toLowerCase().startsWith("zh") ? "zh" : "en"
}

function resolveVoicePreviewLanguage(language: PodcastLanguage): string {
  if (language === "auto") {
    return getStoredLocalePreviewLanguage()
  }

  return language
}

function getVoicePreviewCacheKey(voiceId: string, language: string): string {
  return `${voiceId}:${language}`
}

function readCachedTTSVoices(): PodcastTTSVoicesResponse | null {
  if (typeof window === "undefined") return null

  try {
    const rawValue = window.localStorage.getItem(TTS_VOICE_CACHE_KEY)
    if (!rawValue) return null

    const parsed = JSON.parse(rawValue) as Partial<CachedTTSVoices>
    if (
      typeof parsed.savedAt !== "number" ||
      Date.now() - parsed.savedAt > TTS_VOICE_CACHE_TTL_MS ||
      !isValidTTSVoiceResponse(parsed.response)
    ) {
      window.localStorage.removeItem(TTS_VOICE_CACHE_KEY)
      return null
    }

    return parsed.response
  } catch (error) {
    console.warn("[PodcastAudioDialog] Failed to read cached TTS voices", { error })
    return null
  }
}

function writeCachedTTSVoices(response: PodcastTTSVoicesResponse) {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(
      TTS_VOICE_CACHE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        response,
      } satisfies CachedTTSVoices)
    )
  } catch (error) {
    console.warn("[PodcastAudioDialog] Failed to cache TTS voices", { error })
  }
}

export function PodcastAudioDialog({ open, onOpenChange, articleId }: PodcastAudioDialogProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const pendingSavedSegmentIdsRef = useRef<Set<string> | null>(null)
  const submittingSegmentRegenerationIdsRef = useRef<Set<string>>(new Set())
  const [podcastType, setPodcastType] = useState<PodcastType>("news_broadcast")
  const [language, setLanguage] = useState<PodcastLanguage>("auto")
  const [preferredVoice, setPreferredVoice] = useState<string | null>(null)
  const [ttsVoices, setTtsVoices] = useState<PodcastTTSVoice[]>([])
  const [loadingVoices, setLoadingVoices] = useState(false)
  const [voiceLoadError, setVoiceLoadError] = useState<string | null>(null)
  const [voiceMap, setVoiceMap] = useState<Record<string, string>>({})
  const [manuallySelectedSpeakerIds, setManuallySelectedSpeakerIds] = useState<Set<string>>(new Set())
  const [voicePreviewUrls, setVoicePreviewUrls] = useState<Record<string, string>>({})
  const [loadingPreviewKey, setLoadingPreviewKey] = useState<string | null>(null)
  const [playingPreviewKey, setPlayingPreviewKey] = useState<string | null>(null)
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState(0)
  const [segmentTextDrafts, setSegmentTextDrafts] = useState<Record<string, string>>({})
  const [regeneratingSegmentIds, setRegeneratingSegmentIds] = useState<Set<string>>(new Set())
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const {
    script,
    audioTask,
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
  } = usePodcastGeneration()
  const {
    mergeState,
    mergeProgress,
    mergeErrorMessage,
    mergeAndDownload,
    resetMerge,
  } = usePodcastAudioMerge()

  const hasArticleId = typeof articleId === "number"
  const scriptJson = script?.script_json ?? null
  const participants = useMemo(() => scriptJson?.participants ?? [], [scriptJson])
  const scriptSegments = useMemo(() => scriptJson?.segments ?? [], [scriptJson])
  const estimatedDurationSeconds = scriptJson?.estimated_duration_seconds ?? 0
  const changedScriptSegments = useMemo(
    () =>
      scriptSegments
        .map((segment) => ({
          id: segment.id,
          text: segmentTextDrafts[segment.id] ?? segment.text,
          originalText: segment.text,
        }))
        .filter((segment) => segment.text !== segment.originalText),
    [scriptSegments, segmentTextDrafts]
  )
  const hasScriptTextChanges = changedScriptSegments.length > 0
  const audioSegmentById = useMemo(
    () => new Map(audioSegments.map((segment) => [segment.id, segment])),
    [audioSegments]
  )
  const audioSegmentRows = useMemo(() => {
    if (scriptSegments.length > 0) {
      return scriptSegments.map((segment, index) => ({
        id: segment.id,
        index,
        speakerId: segment.speaker_id,
        text: segment.text,
      }))
    }

    return audioSegments.map((segment, index) => ({
      id: segment.id,
      index,
      speakerId: segment.speaker_id,
      text: segment.text,
    }))
  }, [audioSegments, scriptSegments])
  const activeAudioSegment = audioSegments[selectedSegmentIndex] ?? null
  const activeScriptSegment =
    activeAudioSegment
      ? scriptSegments.find((segment) => segment.id === activeAudioSegment.id) ?? scriptSegments[selectedSegmentIndex]
      : scriptSegments[selectedSegmentIndex] ?? null
  const speakerNames = useMemo(() => {
    return new Map(
      participants.map((participant) => [
        participant.id,
        participant.display_name || participant.role || participant.id,
      ])
    )
  }, [participants])
  const scriptStepStatus = getStepStatus(scriptState, Boolean(scriptJson))
  const audioStepStatus = getStepStatus(audioState, audioSegments.length > 0)
  const audioMergeAvailability = useMemo(
    () => getPodcastAudioMergeAvailability(audioSegments),
    [audioSegments]
  )
  const isMergingAudio =
    mergeState === "fetching" || mergeState === "decoding" || mergeState === "merging"
  const hasPlayableAudioSegments = audioSegments.some(
    (segment) => segment.provider_status === "success" && Boolean(segment.audio_url)
  )
  const isAudioTaskBusy =
    audioState === "submitting" || audioState === "pending" || audioState === "processing"
  const isWholeAudioGenerating = isAudioTaskBusy && !hasPlayableAudioSegments
  const playbackProgress =
    audioSegments.length > 0
      ? Math.min(
          100,
          ((selectedSegmentIndex + (duration > 0 ? currentTime / duration : 0)) / audioSegments.length) * 100
        )
      : 0
  const canGenerateScript = hasArticleId && !isBusyState(scriptState)
  const canSaveScriptText = Boolean(script?.id && scriptState === "success" && hasScriptTextChanges && !updatingScript)
  const hasVoiceOptions = ttsVoices.length > 0 && !voiceLoadError
  const hasValidVoiceMap =
    participants.length === 0 ||
    participants.every((participant) =>
      ttsVoices.some((voice) => voice.id === voiceMap[participant.id])
    )
  const canGenerateAudio = Boolean(
    script?.id &&
      scriptState === "success" &&
      !isBusyState(audioState) &&
      !updatingScript &&
      !hasScriptTextChanges &&
      !isMergingAudio &&
      regeneratingSegmentIds.size === 0 &&
      hasVoiceOptions &&
      hasValidVoiceMap
  )
  const canDownloadFullAudio = Boolean(
    audioTask?.status === "success" &&
      audioMergeAvailability.available &&
      !isMergingAudio &&
      !isBusyState(audioState) &&
      !hasScriptTextChanges
  )
  const hasParticipants = participants.length > 0
  const hasAudioSegmentQueue =
    audioSegmentRows.length > 0 && (audioSegments.length > 0 || isWholeAudioGenerating || Boolean(audioTask))

  useEffect(() => {
    if (!open) {
      stopPolling()
      resetMerge()
      submittingSegmentRegenerationIdsRef.current.clear()
      setRegeneratingSegmentIds(new Set())
      audioRef.current?.pause()
      previewAudioRef.current?.pause()
      setIsPlaying(false)
      setPlayingPreviewKey(null)
      return
    }

    if (!hasArticleId) {
      reset()
      return
    }

    void loadLatestScript(articleId, podcastType)
  }, [articleId, hasArticleId, loadLatestScript, open, podcastType, reset, resetMerge, stopPolling])

  useEffect(() => {
    if (!open || !hasArticleId) return

    let cancelled = false

    const applyVoiceResponse = (response: PodcastTTSVoicesResponse, source: "cache" | "network"): boolean => {
      if (response.voices.length === 0) {
        console.warn("[PodcastAudioDialog] TTS voices response is empty", {
          modelName: response.model_name,
          source: response.source,
          responseSource: source,
        })
        setVoiceLoadError("TTS voice list is empty")
        setTtsVoices([])
        setPreferredVoice(null)
        return false
      }

      const nextVoices = response.voices
      setTtsVoices(nextVoices)
      setPreferredVoice(
        nextVoices.some((voice) => voice.id === response.default_voice)
          ? response.default_voice
          : nextVoices[0].id
      )
      console.info("[PodcastAudioDialog] Loaded TTS voices", {
        modelName: response.model_name,
        source: response.source,
        responseSource: source,
        voiceCount: nextVoices.length,
      })
      return true
    }

    async function loadVoices() {
      setVoiceLoadError(null)

      const cachedResponse = readCachedTTSVoices()
      if (cachedResponse) {
        applyVoiceResponse(cachedResponse, "cache")
        setLoadingVoices(false)
        return
      }

      setLoadingVoices(true)

      try {
        const result = await podcastClient.getTTSVoices()

        if (cancelled) return

        if (isErrorResponse(result)) {
          console.warn("[PodcastAudioDialog] Failed to load TTS voices", {
            error: result.error,
            status: result.status,
          })
          setVoiceLoadError(result.error || "Failed to load TTS voices")
          setTtsVoices([])
          setPreferredVoice(null)
          return
        }

        const response = result as PodcastTTSVoicesResponse
        if (applyVoiceResponse(response, "network")) {
          writeCachedTTSVoices(response)
        }
      } catch (error) {
        if (cancelled) return
        console.error("[PodcastAudioDialog] Unexpected TTS voice load error", { error })
        setVoiceLoadError(error instanceof Error ? error.message : "Failed to load TTS voices")
        setTtsVoices([])
        setPreferredVoice(null)
      } finally {
        if (!cancelled) {
          setLoadingVoices(false)
        }
      }
    }

    void loadVoices()

    return () => {
      cancelled = true
    }
  }, [hasArticleId, open])

  useEffect(() => {
    if (participants.length === 0) return

    setVoiceMap((current) => {
      const next = { ...current }
      let changed = false
      const rotateVoices = participants.length > 1

      participants.forEach((participant, index) => {
        const hasValidVoice =
          next[participant.id] && ttsVoices.some((voice) => voice.id === next[participant.id])
        if (hasValidVoice && manuallySelectedSpeakerIds.has(participant.id)) return
        next[participant.id] = pickVoiceId(ttsVoices, preferredVoice, index, rotateVoices)
        changed = true
      })

      Object.keys(next).forEach((speakerId) => {
        if (participants.some((participant) => participant.id === speakerId)) return
        delete next[speakerId]
        changed = true
      })

      return changed ? next : current
    })
  }, [manuallySelectedSpeakerIds, participants, preferredVoice, ttsVoices])

  useEffect(() => {
    setManuallySelectedSpeakerIds((current) => {
      const participantIds = new Set(participants.map((participant) => participant.id))
      const next = new Set(Array.from(current).filter((speakerId) => participantIds.has(speakerId)))
      return next.size === current.size ? current : next
    })
  }, [participants])

  useEffect(() => {
    const savedSegmentIds = pendingSavedSegmentIdsRef.current
    pendingSavedSegmentIdsRef.current = null

    setSegmentTextDrafts((current) =>
      Object.fromEntries(
        scriptSegments.map((segment) => [
          segment.id,
          savedSegmentIds && !savedSegmentIds.has(segment.id) && current[segment.id] !== undefined
            ? current[segment.id]
            : segment.text,
        ])
      )
    )
  }, [script?.id, script?.revision, scriptSegments])

  useEffect(() => {
    if (audioSegments.length === 0) {
      setSelectedSegmentIndex(0)
      setCurrentTime(0)
      setDuration(0)
      return
    }

    if (selectedSegmentIndex > audioSegments.length - 1) {
      setSelectedSegmentIndex(0)
    }
  }, [audioSegments.length, selectedSegmentIndex])

  useEffect(() => {
    if (regeneratingSegmentIds.size === 0) return

    setRegeneratingSegmentIds((current) => {
      const next = new Set(current)
      let changed = false

      current.forEach((segmentId) => {
        if (submittingSegmentRegenerationIdsRef.current.has(segmentId)) return
        if (audioTask?.status !== "success" && audioTask?.status !== "failed") return

        const audioSegment = audioSegmentById.get(segmentId)
        if (
          audioSegment?.provider_status === "success" ||
          audioSegment?.provider_status === "failed"
        ) {
          next.delete(segmentId)
          changed = true
        }
      })

      return changed ? next : current
    })
  }, [audioSegmentById, audioTask?.status, regeneratingSegmentIds.size])

  useEffect(() => {
    setCurrentTime(0)
    setDuration(0)

    if (!activeAudioSegment || !isPlaying) return

    void audioRef.current?.play().catch((error) => {
      console.warn("[PodcastAudioDialog] Failed to continue segment playback", {
        segmentId: activeAudioSegment.id,
        error,
      })
      setIsPlaying(false)
    })
  }, [activeAudioSegment, isPlaying])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      audioRef.current?.pause()
      previewAudioRef.current?.pause()
      submittingSegmentRegenerationIdsRef.current.clear()
      setRegeneratingSegmentIds(new Set())
      setIsPlaying(false)
      setPlayingPreviewKey(null)
      stopPolling()
    }

    onOpenChange(nextOpen)
  }

  const handleGenerateScript = async () => {
    if (!hasArticleId || !canGenerateScript) return

    await createScript({
      article_id: articleId,
      podcast_type: podcastType,
      language,
    })
  }

  const buildVoiceMap = useCallback(() => {
    const nextVoiceMap: Record<string, string> = {}

    participants.forEach((participant) => {
      nextVoiceMap[participant.id] = voiceMap[participant.id]
    })

    return nextVoiceMap
  }, [participants, voiceMap])

  const handleGenerateAudio = async () => {
    if (!script?.id || !canGenerateAudio) return
    const nextVoiceMap = buildVoiceMap()
    const firstVoice = participants[0] ? nextVoiceMap[participants[0].id] : ttsVoices[0]?.id

    await createAudio(script.id, {
      default_voice: firstVoice,
      voice_map: nextVoiceMap,
      output_format: "mp3",
      sample_rate: 24000,
    })
  }

  const handleDownloadFullAudio = async () => {
    if (!canDownloadFullAudio) return

    audioRef.current?.pause()
    setIsPlaying(false)
    await mergeAndDownload({
      segments: audioSegments,
      title: scriptJson?.title || script?.title,
    })
  }

  const handlePreviewVoice = async (voiceId: string) => {
    if (!voiceId || loadingPreviewKey) return

    const previewLanguage = resolveVoicePreviewLanguage(language)
    const previewKey = getVoicePreviewCacheKey(voiceId, previewLanguage)

    if (playingPreviewKey === previewKey) {
      previewAudioRef.current?.pause()
      setPlayingPreviewKey(null)
      return
    }

    audioRef.current?.pause()
    setIsPlaying(false)
    setLoadingPreviewKey(previewKey)

    try {
      let previewUrl = voicePreviewUrls[previewKey]
      if (!previewUrl) {
        const result = await podcastClient.previewTTSVoice(voiceId, {
          language: previewLanguage,
        })

        if (isErrorResponse(result)) {
          console.warn("[PodcastAudioDialog] Failed to load TTS voice preview", {
            voiceId,
            language: previewLanguage,
            error: result.error,
            status: result.status,
          })
          toast({
            title: t("podcastAudioDialog.toast.voicePreviewFailed"),
            description: result.error || t("podcastAudioDialog.toast.voicePreviewFailedDesc"),
          })
          return
        }

        previewUrl = result.preview_url
        setVoicePreviewUrls((current) => ({
          ...current,
          [previewKey]: previewUrl,
        }))
        console.info("[PodcastAudioDialog] Loaded TTS voice preview", {
          voiceId,
          requestedLanguage: previewLanguage,
          cached: result.cached,
          language: result.language,
        })
      }

      if (!previewAudioRef.current) return

      previewAudioRef.current.src = previewUrl
      await previewAudioRef.current.play()
      setPlayingPreviewKey(previewKey)
    } catch (error) {
      console.error("[PodcastAudioDialog] Failed to play TTS voice preview", {
        voiceId,
        language: previewLanguage,
        error,
      })
      toast({
        title: t("podcastAudioDialog.toast.voicePreviewFailed"),
        description: error instanceof Error ? error.message : t("podcastAudioDialog.toast.voicePreviewFailedDesc"),
      })
      setPlayingPreviewKey(null)
    } finally {
      setLoadingPreviewKey(null)
    }
  }

  const handleSaveScriptText = async (segmentId: string) => {
    if (!script?.id || !canSaveScriptText) return

    const changedSegment = changedScriptSegments.find((segment) => segment.id === segmentId)
    if (!changedSegment) return

    pendingSavedSegmentIdsRef.current = new Set([changedSegment.id])
    const saved = await updateScript(script.id, {
      segments: [
        {
          id: changedSegment.id,
          text: changedSegment.text,
        },
      ],
    })

    if (!saved) {
      pendingSavedSegmentIdsRef.current = null
      return
    }

    audioRef.current?.pause()
    setIsPlaying(false)

    const existingAudioSegment = audioSegments.find((segment) => segment.id === changedSegment.id)
    const canRegenerateExistingAudioSegment =
      audioTask &&
      (audioTask.status === "success" || audioTask.status === "failed") &&
      (existingAudioSegment?.provider_status === "success" || existingAudioSegment?.provider_status === "failed")
    if (!canRegenerateExistingAudioSegment) {
      toast({
        title: t("podcastAudioDialog.toast.scriptSaved"),
        description: t("podcastAudioDialog.toast.scriptSavedNoAudioDesc"),
      })
      return
    }

    const scriptSegment = scriptSegments.find((segment) => segment.id === changedSegment.id)
    console.info("[PodcastAudioDialog] Regenerating saved podcast segment audio", {
      scriptId: script.id,
      segmentId: changedSegment.id,
      speakerId: scriptSegment?.speaker_id,
    })
    // TODO(observability): add UI action metric for script line save followed by segment audio regeneration.
    submittingSegmentRegenerationIdsRef.current.add(changedSegment.id)
    setRegeneratingSegmentIds((current) => {
      const next = new Set(current)
      next.add(changedSegment.id)
      return next
    })
    const regenerated = await regenerateAudioSegment(script.id, changedSegment.id, {
      voice: scriptSegment ? voiceMap[scriptSegment.speaker_id] : undefined,
    })
    submittingSegmentRegenerationIdsRef.current.delete(changedSegment.id)
    if (!regenerated) {
      setRegeneratingSegmentIds((current) => {
        const next = new Set(current)
        next.delete(changedSegment.id)
        return next
      })
    }

    if (saved) {
      toast({
        title: t("podcastAudioDialog.toast.scriptSaved"),
        description: regenerated
          ? t("podcastAudioDialog.toast.scriptSavedSegmentAudioDesc")
          : t("podcastAudioDialog.toast.scriptSavedSegmentAudioFailedDesc"),
      })
    }
  }

  const handlePlayPause = async () => {
    if (!activeAudioSegment?.audio_url || !audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }

    try {
      await audioRef.current.play()
      setIsPlaying(true)
    } catch (error) {
      console.warn("[PodcastAudioDialog] Failed to play podcast segment", {
        segmentId: activeAudioSegment.id,
        error,
      })
      toast({
        variant: "destructive",
        title: t("podcastAudioDialog.toast.playFailed"),
      })
    }
  }

  const handlePreviousSegment = () => {
    setSelectedSegmentIndex((current) => Math.max(0, current - 1))
  }

  const handleNextSegment = () => {
    setSelectedSegmentIndex((current) => Math.min(audioSegments.length - 1, current + 1))
  }

  const handleAudioEnded = () => {
    if (selectedSegmentIndex < audioSegments.length - 1) {
      setSelectedSegmentIndex((current) => current + 1)
      setIsPlaying(true)
      return
    }

    setIsPlaying(false)
  }

  const renderStep = (
    stepNumber: number,
    label: string,
    status: ReturnType<typeof getStepStatus>
  ) => {
    const isDone = status === "done"
    const isActive = status === "active"
    const isFailed = status === "failed"

    return (
      <div
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
          isDone && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
          isActive && "border-primary/30 bg-primary/10 text-primary",
          isFailed && "border-destructive/30 bg-destructive/10 text-destructive",
          status === "idle" && "bg-background text-muted-foreground"
        )}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-semibold">
          {isDone ? (
            <CheckCircle2Icon className="h-4 w-4" />
          ) : isActive ? (
            <Loader2Icon className="h-4 w-4 animate-spin" />
          ) : isFailed ? (
            "!"
          ) : (
            stepNumber
          )}
        </span>
        <span className="truncate text-sm font-semibold">{label}</span>
      </div>
    )
  }

  return (
    <AIFeatureDialogShell
      open={open}
      onOpenChange={handleOpenChange}
      title={t("podcastAudioDialog.title")}
      description={t("podcastAudioDialog.description")}
      icon={<Mic2Icon className="h-5 w-5 text-primary" />}
      size="fullscreen"
      footer={
        <div className="flex w-full justify-end text-xs leading-5 text-muted-foreground">
          {hasArticleId
            ? t("podcastAudioDialog.footerMeta", {
                participants: participants.length,
                segments: scriptSegments.length,
                duration: formatDuration(estimatedDurationSeconds),
                audioSegments: audioSegments.length,
              })
            : t("podcastAudioDialog.saveArticleFirst")}
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col bg-muted/20">
        <div className="shrink-0 border-b bg-background px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row">
            {renderStep(1, t("podcastAudioDialog.steps.script"), scriptStepStatus)}
            {renderStep(2, t("podcastAudioDialog.steps.audio"), audioStepStatus)}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[340px_minmax(0,1fr)_420px]">
          <aside className="min-h-0 overflow-y-auto border-b bg-background p-5 lg:border-b-0 lg:border-r">
            <div className="space-y-5">
              {!hasArticleId ? (
                <Alert variant="destructive">
                  <AlertDescription>{t("podcastAudioDialog.saveArticleFirst")}</AlertDescription>
                </Alert>
              ) : null}

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontalIcon className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">{t("podcastAudioDialog.settingsTitle")}</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="podcast-audio-type">{t("podcastAudioDialog.podcastTypeLabel")}</Label>
                  <Select
                    value={podcastType}
                    onValueChange={(value) => setPodcastType(value as PodcastType)}
                    disabled={isBusyState(scriptState)}
                  >
                    <SelectTrigger id="podcast-audio-type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PODCAST_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(`podcastAudioDialog.podcastTypes.${type}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="podcast-audio-language">{t("podcastAudioDialog.languageLabel")}</Label>
                  <Select value={language} onValueChange={(value) => setLanguage(value as PodcastLanguage)}>
                    <SelectTrigger id="podcast-audio-language" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PODCAST_LANGUAGES.map((item) => (
                        <SelectItem key={item} value={item}>
                          {t(`podcastAudioDialog.languages.${item}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {hasParticipants ? (
                  <div className="space-y-3">
                    {voiceLoadError ? (
                      <Alert variant="destructive">
                        <AlertDescription>{t("podcastAudioDialog.voiceLoadFailed")}</AlertDescription>
                      </Alert>
                    ) : null}

                    {participants.map((participant) => (
                      <div key={participant.id} className="space-y-2">
                        <Label htmlFor={`podcast-audio-voice-${participant.id}`}>
                          {participant.display_name || participant.role || participant.id}
                        </Label>
                        {loadingVoices ? (
                          <div className="flex gap-2">
                            <div className="h-9 min-w-0 flex-1 animate-pulse rounded-md border bg-muted" />
                            <div className="h-9 w-9 shrink-0 animate-pulse rounded-md border bg-muted" />
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Select
                              value={voiceMap[participant.id] || ""}
                              disabled={!hasVoiceOptions}
                              onValueChange={(value) => {
                                setManuallySelectedSpeakerIds((current) => {
                                  const next = new Set(current)
                                  next.add(participant.id)
                                  return next
                                })
                                setVoiceMap((current) => ({
                                  ...current,
                                  [participant.id]: value,
                                }))
                              }}
                            >
                              <SelectTrigger id={`podcast-audio-voice-${participant.id}`} className="min-w-0 flex-1">
                                <SelectValue placeholder={t("podcastAudioDialog.voiceSelectPlaceholder")} />
                              </SelectTrigger>
                              <SelectContent>
                                {ttsVoices.map((voice) => (
                                  <SelectItem key={voice.id} value={voice.id}>
                                    {getVoiceDisplayName(voice)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {(() => {
                              const selectedVoiceId = voiceMap[participant.id] || ""
                              const previewKey = selectedVoiceId
                                ? getVoicePreviewCacheKey(
                                    selectedVoiceId,
                                    resolveVoicePreviewLanguage(language)
                                  )
                                : ""

                              return (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 shrink-0"
                                  disabled={!hasVoiceOptions || !selectedVoiceId || Boolean(loadingPreviewKey)}
                                  title={t("podcastAudioDialog.previewVoice")}
                                  aria-label={t("podcastAudioDialog.previewVoice")}
                                  onClick={() => void handlePreviewVoice(selectedVoiceId)}
                                >
                                  {loadingPreviewKey === previewKey ? (
                                    <Loader2Icon className="h-4 w-4 animate-spin" />
                                  ) : playingPreviewKey === previewKey ? (
                                    <PauseIcon className="h-4 w-4" />
                                  ) : (
                                    <Volume2Icon className="h-4 w-4" />
                                  )}
                                </Button>
                              )
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>

              <section className="space-y-3 border-t pt-5">
                <Button
                  type="button"
                  className="w-full"
                  variant={scriptJson ? "outline" : "default"}
                  disabled={!canGenerateScript || updatingScript}
                  onClick={() => void handleGenerateScript()}
                >
                  {isBusyState(scriptState) ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : scriptJson ? (
                    <RotateCcwIcon className="h-4 w-4" />
                  ) : (
                    <FileTextIcon className="h-4 w-4" />
                  )}
                  {scriptJson
                    ? t("podcastAudioDialog.regenerateScript")
                    : t("podcastAudioDialog.generateScript")}
                </Button>

              </section>
            </div>
          </aside>

          <main className="min-h-0 overflow-y-auto p-5">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
              {(scriptErrorMessage || audioErrorMessage) ? (
                <Alert variant="destructive">
                  <AlertDescription>{scriptErrorMessage || audioErrorMessage}</AlertDescription>
                </Alert>
              ) : null}

              <section className="rounded-lg border bg-background">
                <div className="border-b px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t("podcastAudioDialog.scriptPreviewEyebrow")}
                      </p>
                      <h3 className="mt-1 truncate text-lg font-semibold">
                        {scriptJson?.title || script?.title || t("podcastAudioDialog.scriptEmptyTitle")}
                      </h3>
                      {scriptJson?.summary || script?.summary ? (
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {scriptJson?.summary || script?.summary}
                        </p>
                      ) : null}
                      {scriptJson ? (
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          {t("podcastAudioDialog.scriptReadonlyHint")}
                        </p>
                      ) : null}
                    </div>
                    {script ? (
                      <Badge variant="outline" className="shrink-0">
                        {t(`podcastAudioDialog.status.${script.status}`)}
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <div className="p-5">
                  {scriptState === "loading" ? (
                    <div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      {t("podcastAudioDialog.loadingLatest")}
                    </div>
                  ) : scriptJson ? (
                    <div className="space-y-5">
                      <div className="space-y-3">
                        {scriptSegments.map((segment, index) => (
                          <article
                            key={segment.id || index}
                            className={cn(
                              "rounded-lg border bg-background p-4 transition-colors",
                              activeScriptSegment?.id === segment.id && "border-primary/40 bg-primary/5"
                            )}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary">#{index + 1}</Badge>
                              <Badge variant="outline">
                                {speakerNames.get(segment.speaker_id) || segment.speaker_id}
                              </Badge>
                              {segment.speed ? (
                                <Badge variant="outline" className="font-normal text-muted-foreground">
                                  {t("podcastAudioDialog.segmentFields.speed")}: {segment.speed}
                                </Badge>
                              ) : null}
                              {segment.volume ? (
                                <Badge variant="outline" className="font-normal text-muted-foreground">
                                  {t("podcastAudioDialog.segmentFields.volume")}: {segment.volume}
                                </Badge>
                              ) : null}
                              {segment.pitch ? (
                                <Badge variant="outline" className="font-normal text-muted-foreground">
                                  {t("podcastAudioDialog.segmentFields.pitch")}: {segment.pitch}
                                </Badge>
                              ) : null}
                            </div>
                            <div className="mt-3 space-y-2">
                              <Label htmlFor={`podcast-script-segment-${segment.id}`} className="text-xs">
                                {t("podcastAudioDialog.segmentTextLabel")}
                              </Label>
                              <Textarea
                                id={`podcast-script-segment-${segment.id}`}
                                value={segmentTextDrafts[segment.id] ?? segment.text}
                                onChange={(event) =>
                                  setSegmentTextDrafts((current) => ({
                                    ...current,
                                    [segment.id]: event.target.value,
                                  }))
                                }
                                disabled={updatingScript || isBusyState(scriptState)}
                                className="min-h-24 resize-y text-sm leading-6"
                              />
                              {(segmentTextDrafts[segment.id] ?? segment.text) !== segment.text ? (
                                <div>
                                  <Button
                                    type="button"
                                    className="w-full"
                                    size="sm"
                                    disabled={!canSaveScriptText}
                                    onClick={() => void handleSaveScriptText(segment.id)}
                                  >
                                    {updatingScript ? (
                                      <Loader2Icon className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <SaveIcon className="h-4 w-4" />
                                    )}
                                    {t("podcastAudioDialog.saveScriptText")}
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                            {segment.voice_instruction ? (
                              <p className="mt-3 border-l-2 border-primary/30 pl-3 text-xs leading-5 text-muted-foreground">
                                {segment.voice_instruction}
                              </p>
                            ) : null}
                          </article>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                      <FileTextIcon className="h-10 w-10 text-muted-foreground/60" />
                      <h3 className="mt-4 text-sm font-semibold">{t("podcastAudioDialog.scriptEmptyTitle")}</h3>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                        {t("podcastAudioDialog.scriptEmptyDescription")}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </main>

          <aside className="min-h-0 overflow-y-auto border-t bg-background p-5 lg:border-l lg:border-t-0">
            <div className="space-y-5">
              <section className="space-y-4">
                <Button
                  type="button"
                  className="w-full"
                  disabled={!canGenerateAudio}
                  onClick={() => void handleGenerateAudio()}
                >
                  {isWholeAudioGenerating ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    <Volume2Icon className="h-4 w-4" />
                  )}
                  {audioSegments.length > 0
                    ? t("podcastAudioDialog.regenerateAudio")
                    : t("podcastAudioDialog.generateAudio")}
                </Button>

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("podcastAudioDialog.playerEyebrow")}
                    </p>
                    <h3 className="mt-1 text-base font-semibold">
                      {scriptJson?.title || t("podcastAudioDialog.playerEmptyTitle")}
                    </h3>
                  </div>
                  {audioTask ? (
                    <Badge variant="outline">{t(`podcastAudioDialog.status.${audioTask.status}`)}</Badge>
                  ) : null}
                </div>

                <div className="rounded-xl border bg-muted/20 p-4">
                  <div className="flex h-16 items-end gap-1 overflow-hidden">
                    {Array.from({ length: 42 }).map((_, index) => {
                      const height = 18 + ((index * 17) % 42)
                      const isActive = audioSegments.length > 0 && (index / 42) * 100 <= playbackProgress
                      return (
                        <span
                          key={index}
                          className={cn(
                            "w-full rounded-full transition-colors",
                            isActive ? "bg-primary" : "bg-border"
                          )}
                          style={{ height }}
                        />
                      )
                    })}
                  </div>

                  <div className="mt-4 space-y-2">
                    <Progress value={playbackProgress} className="h-1.5" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDuration(currentTime)}</span>
                      <span>{formatDuration(duration)}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      disabled={selectedSegmentIndex <= 0}
                      onClick={handlePreviousSegment}
                    >
                      <SkipBackIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      className="h-11 w-11 rounded-full"
                      disabled={!activeAudioSegment?.audio_url}
                      onClick={() => void handlePlayPause()}
                    >
                      {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      disabled={selectedSegmentIndex >= audioSegments.length - 1}
                      onClick={handleNextSegment}
                    >
                      <SkipForwardIcon className="h-4 w-4" />
                    </Button>
                  </div>

                  <audio
                    ref={audioRef}
                    src={activeAudioSegment?.audio_url}
                    preload="metadata"
                    onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                    onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={handleAudioEnded}
                  />
                  <audio
                    ref={previewAudioRef}
                    preload="metadata"
                    onEnded={() => setPlayingPreviewKey(null)}
                    onPause={() => setPlayingPreviewKey(null)}
                  />
                </div>

              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold">{t("podcastAudioDialog.audioSegmentsTitle")}</h3>
                {hasAudioSegmentQueue ? (
                  <div className="space-y-2">
                    {audioSegmentRows.map((row) => {
                      const segment = audioSegmentById.get(row.id)
                      const audioIndex = segment
                        ? audioSegments.findIndex((audioSegment) => audioSegment.id === segment.id)
                        : -1
                      const selected = audioIndex >= 0 && audioIndex === selectedSegmentIndex
                      const isSegmentGenerating =
                        regeneratingSegmentIds.has(row.id) ||
                        segment?.provider_status === "pending" ||
                        segment?.provider_status === "processing" ||
                        (isWholeAudioGenerating && !segment)
                      const isPlayable = Boolean(segment?.audio_url && segment.provider_status === "success")
                      return (
                        <button
                          key={row.id || row.index}
                          type="button"
                          className={cn(
                            "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                            isSegmentGenerating
                              ? "cursor-default border-dashed bg-muted/30"
                              : "hover:bg-muted/50",
                            selected && "border-primary/50 bg-primary/5"
                          )}
                          disabled={!isPlayable}
                          onClick={() => {
                            if (audioIndex >= 0) {
                              setSelectedSegmentIndex(audioIndex)
                            }
                          }}
                        >
                          {isSegmentGenerating ? (
                            <>
                              <span className="mt-0.5 shrink-0">
                                <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
                              </span>
                              <span className="min-w-0 flex-1 space-y-2">
                                <span className="flex items-center gap-2">
                                  <Skeleton className="h-3 w-8" />
                                  <Skeleton className="h-3 w-24" />
                                  <Skeleton className="h-3 w-20" />
                                </span>
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                                <span className="text-xs text-muted-foreground">
                                  {regeneratingSegmentIds.has(row.id)
                                    ? t("podcastAudioDialog.segmentRegenerating")
                                    : t("podcastAudioDialog.segmentGenerating")}
                                </span>
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="mt-0.5 shrink-0 text-primary">
                                {selected ? (
                                  <Volume2Icon className="h-4 w-4" />
                                ) : segment?.provider_status === "success" ? (
                                  <CheckCircle2Icon className="h-4 w-4" />
                                ) : (
                                  <CircleIcon className="h-4 w-4" />
                                )}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>#{row.index + 1}</span>
                                  <span>{speakerNames.get(row.speakerId) || row.speakerId}</span>
                                  {segment?.voice ? <span>{segment.voice}</span> : null}
                                </span>
                                <span className="mt-1 line-clamp-2 block text-sm leading-5 text-foreground">
                                  {segment?.text || row.text}
                                </span>
                              </span>
                            </>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-5 text-center text-sm leading-6 text-muted-foreground">
                    {audioState === "pending" || audioState === "processing"
                      ? t("podcastAudioDialog.audioGeneratingEmpty")
                      : t("podcastAudioDialog.audioEmptyDescription")}
                  </div>
                )}
                {isMergingAudio ? (
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <Progress value={mergeProgress.percent} className="h-2" />
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {t("podcastAudioDialog.mergeProgress", {
                        completed: mergeProgress.completedSegments,
                        total: mergeProgress.totalSegments,
                      })}
                    </p>
                  </div>
                ) : null}

                {mergeState === "failed" && mergeErrorMessage ? (
                  <Alert variant="destructive">
                    <AlertDescription>{t("podcastAudioDialog.mergeFailed")}</AlertDescription>
                  </Alert>
                ) : null}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={!canDownloadFullAudio}
                  onClick={() => void handleDownloadFullAudio()}
                >
                  {isMergingAudio ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    <DownloadIcon className="h-4 w-4" />
                  )}
                  {mergeState === "success"
                    ? t("podcastAudioDialog.downloadMergedAudio")
                    : isMergingAudio
                    ? t("podcastAudioDialog.mergeAudio")
                    : t("podcastAudioDialog.downloadFullAudio")}
                </Button>
                {!audioMergeAvailability.available && audioSegments.length > 0 && (
                  <p className="text-xs leading-5 text-muted-foreground">
                    {t("podcastAudioDialog.mergeUnavailable")}
                  </p>
                )}
              </section>
            </div>
          </aside>
        </div>
      </div>
    </AIFeatureDialogShell>
  )
}
