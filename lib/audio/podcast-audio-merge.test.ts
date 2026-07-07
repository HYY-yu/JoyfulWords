import assert from "node:assert/strict"
import test from "node:test"
import {
  createPodcastAudioFileName,
  encodePodcastAudioWav,
  getPodcastAudioMergeAvailability,
} from "./podcast-audio-merge"

async function blobToDataView(blob: Blob): Promise<DataView> {
  return new DataView(await blob.arrayBuffer())
}

function readAscii(view: DataView, offset: number, length: number): string {
  return Array.from({ length }, (_, index) => String.fromCharCode(view.getUint8(offset + index))).join("")
}

test("detects podcast audio merge availability", () => {
  assert.deepEqual(getPodcastAudioMergeAvailability([]), {
    available: false,
    reason: "empty",
  })
  assert.deepEqual(
    getPodcastAudioMergeAvailability([{ provider_status: "processing", audio_url: "https://example.com/1.mp3" }]),
    {
      available: false,
      reason: "not_complete",
    }
  )
  assert.deepEqual(getPodcastAudioMergeAvailability([{ provider_status: "success", audio_url: "" }]), {
    available: false,
    reason: "missing_url",
  })
  assert.deepEqual(
    getPodcastAudioMergeAvailability([{ provider_status: "success", audio_url: "https://example.com/1.mp3" }]),
    {
      available: true,
      reason: "ready",
    }
  )
})

test("creates safe podcast audio wav file names", () => {
  assert.equal(createPodcastAudioFileName("A/B: C*D?"), "A-B- C-D-.wav")
  assert.equal(createPodcastAudioFileName(""), "podcast-audio.wav")
})

test("encodes podcast PCM data as wav", async () => {
  const blob = encodePodcastAudioWav({
    sampleRate: 24000,
    channels: [
      new Float32Array([0, 0.5, -0.5]),
      new Float32Array([0.25, -0.25, 1]),
    ],
  })
  const view = await blobToDataView(blob)

  assert.equal(blob.type, "audio/wav")
  assert.equal(readAscii(view, 0, 4), "RIFF")
  assert.equal(readAscii(view, 8, 4), "WAVE")
  assert.equal(readAscii(view, 12, 4), "fmt ")
  assert.equal(view.getUint16(22, true), 2)
  assert.equal(view.getUint32(24, true), 24000)
  assert.equal(readAscii(view, 36, 4), "data")
  assert.equal(view.getUint32(40, true), 12)
  assert.equal(blob.size, 56)
})
