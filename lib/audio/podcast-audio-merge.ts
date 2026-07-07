import type { ArticlePodcastAudioSegment } from "@/lib/api/podcast/types"

export type PodcastAudioMergePhase = "fetching" | "decoding" | "merging"

export interface PodcastAudioMergeProgress {
  phase: PodcastAudioMergePhase
  completedSegments: number
  totalSegments: number
  percent: number
}

export interface PodcastAudioMergeOptions {
  signal?: AbortSignal
  onProgress?: (progress: PodcastAudioMergeProgress) => void
}

export interface PodcastAudioPCMData {
  sampleRate: number
  channels: Float32Array[]
}

export interface PodcastAudioMergeAvailability {
  available: boolean
  reason: "ready" | "empty" | "not_complete" | "missing_url"
}

type AudioContextConstructor = typeof AudioContext

function getAudioContextConstructor(): AudioContextConstructor {
  const candidate =
    typeof window !== "undefined"
      ? window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext
      : undefined

  if (!candidate) {
    throw new Error("audio_context_unavailable")
  }

  return candidate
}

function emitMergeProgress(
  options: PodcastAudioMergeOptions,
  phase: PodcastAudioMergePhase,
  completedSegments: number,
  totalSegments: number
) {
  options.onProgress?.({
    phase,
    completedSegments,
    totalSegments,
    percent: totalSegments > 0 ? Math.round((completedSegments / totalSegments) * 100) : 0,
  })
}

function clampPcmSample(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(-1, Math.min(1, value))
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index))
  }
}

export function getPodcastAudioMergeAvailability(
  segments: Pick<ArticlePodcastAudioSegment, "audio_url" | "provider_status">[]
): PodcastAudioMergeAvailability {
  if (segments.length === 0) {
    return { available: false, reason: "empty" }
  }

  if (segments.some((segment) => segment.provider_status !== "success")) {
    return { available: false, reason: "not_complete" }
  }

  if (segments.some((segment) => !segment.audio_url)) {
    return { available: false, reason: "missing_url" }
  }

  return { available: true, reason: "ready" }
}

export function createPodcastAudioFileName(title?: string | null): string {
  const baseName = (title || "podcast-audio")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 80)

  return `${baseName || "podcast-audio"}.wav`
}

export function encodePodcastAudioWav(data: PodcastAudioPCMData): Blob {
  const channelCount = data.channels.length
  if (channelCount === 0) {
    throw new Error("wav_channel_empty")
  }

  const frameCount = data.channels[0]?.length ?? 0
  if (frameCount === 0) {
    throw new Error("wav_audio_empty")
  }

  if (data.channels.some((channel) => channel.length !== frameCount)) {
    throw new Error("wav_channel_length_mismatch")
  }

  const bytesPerSample = 2
  const blockAlign = channelCount * bytesPerSample
  const byteRate = data.sampleRate * blockAlign
  const dataByteLength = frameCount * blockAlign
  const buffer = new ArrayBuffer(44 + dataByteLength)
  const view = new DataView(buffer)

  writeAscii(view, 0, "RIFF")
  view.setUint32(4, 36 + dataByteLength, true)
  writeAscii(view, 8, "WAVE")
  writeAscii(view, 12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channelCount, true)
  view.setUint32(24, data.sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeAscii(view, 36, "data")
  view.setUint32(40, dataByteLength, true)

  let offset = 44
  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      const sample = clampPcmSample(data.channels[channelIndex][frameIndex])
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      offset += bytesPerSample
    }
  }

  return new Blob([buffer], { type: "audio/wav" })
}

export function mergePodcastAudioBuffers(
  audioContext: AudioContext,
  buffers: AudioBuffer[]
): AudioBuffer {
  if (buffers.length === 0) {
    throw new Error("audio_segments_empty")
  }

  const sampleRate = audioContext.sampleRate
  const channelCount = Math.max(...buffers.map((buffer) => buffer.numberOfChannels))
  const frameCount = buffers.reduce((total, buffer) => total + buffer.length, 0)
  const mergedBuffer = audioContext.createBuffer(channelCount, frameCount, sampleRate)
  let writeOffset = 0

  buffers.forEach((buffer) => {
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      const sourceChannel = Math.min(channelIndex, buffer.numberOfChannels - 1)
      mergedBuffer.copyToChannel(buffer.getChannelData(sourceChannel), channelIndex, writeOffset)
    }
    writeOffset += buffer.length
  })

  return mergedBuffer
}

export function audioBufferToPCMData(audioBuffer: AudioBuffer): PodcastAudioPCMData {
  return {
    sampleRate: audioBuffer.sampleRate,
    channels: Array.from({ length: audioBuffer.numberOfChannels }, (_, index) =>
      audioBuffer.getChannelData(index)
    ),
  }
}

export async function mergePodcastAudioSegmentsToWav(
  segments: ArticlePodcastAudioSegment[],
  options: PodcastAudioMergeOptions = {}
): Promise<Blob> {
  const sortedSegments = [...segments].sort((left, right) => left.index - right.index)
  const availability = getPodcastAudioMergeAvailability(sortedSegments)
  if (!availability.available) {
    throw new Error(`podcast_audio_merge_${availability.reason}`)
  }

  const AudioContextCtor = getAudioContextConstructor()
  const audioContext = new AudioContextCtor()
  const decodedBuffers: AudioBuffer[] = []

  try {
    for (let index = 0; index < sortedSegments.length; index += 1) {
      options.signal?.throwIfAborted()
      emitMergeProgress(options, "fetching", index, sortedSegments.length)

      const segment = sortedSegments[index]
      console.debug("[PodcastAudioMerge] Fetching segment audio", {
        segmentId: segment.id,
        index: segment.index,
      })
      const response = await fetch(segment.audio_url, { signal: options.signal })
      if (!response.ok) {
        throw new Error(`podcast_audio_fetch_failed:${response.status}`)
      }

      options.signal?.throwIfAborted()
      emitMergeProgress(options, "decoding", index, sortedSegments.length)
      const audioData = await response.arrayBuffer()
      const decodedBuffer = await audioContext.decodeAudioData(audioData.slice(0))
      decodedBuffers.push(decodedBuffer)
      emitMergeProgress(options, "decoding", index + 1, sortedSegments.length)
    }

    options.signal?.throwIfAborted()
    emitMergeProgress(options, "merging", sortedSegments.length, sortedSegments.length)
    const mergedBuffer = mergePodcastAudioBuffers(audioContext, decodedBuffers)
    return encodePodcastAudioWav(audioBufferToPCMData(mergedBuffer))
  } finally {
    void audioContext.close().catch((error) => {
      console.warn("[PodcastAudioMerge] Failed to close audio context", { error })
    })
  }
}
