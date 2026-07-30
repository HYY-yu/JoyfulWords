import test from "node:test"
import assert from "node:assert/strict"

import {
  getPodcastAudioProgress,
  getSortedPodcastAudioSegments,
  isPodcastTerminalStatus,
  selectLatestPodcastScript,
  type ArticlePodcastAudioManifest,
  type ArticlePodcastScriptRecord,
} from "@/lib/api/podcast/types"

const manifest = {
  schema_version: "article_podcast_audio.v1",
  script_id: 1,
  script_revision: 2,
  podcast_type: "news_broadcast",
  language: "zh-CN",
  title: "Podcast",
  output_format: "mp3",
  sample_rate: 24000,
  segments: [
    {
      id: "seg_002",
      index: 1,
      speaker_id: "host",
      voice: "stokie_en",
      audio_url: "https://cdn.example.com/2.mp3",
      text: "Second",
      output_format: "mp3",
      sample_rate: 24000,
      provider_status: "pending",
    },
    {
      id: "seg_001",
      index: 0,
      speaker_id: "host",
      voice: "stokie_en",
      audio_url: "https://cdn.example.com/1.mp3",
      text: "First",
      output_format: "mp3",
      sample_rate: 24000,
      provider_status: "success",
    },
  ],
} satisfies ArticlePodcastAudioManifest

test("sorts podcast audio manifest segments by index", () => {
  assert.deepEqual(
    getSortedPodcastAudioSegments(manifest).map((segment) => segment.id),
    ["seg_001", "seg_002"]
  )
})

test("summarizes podcast audio progress from task and manifest", () => {
  assert.deepEqual(
    getPodcastAudioProgress(
      {
        total_segments: 4,
        completed_segments: 2,
        failed_segments: 1,
      },
      manifest
    ),
    {
      total: 4,
      completed: 2,
      failed: 1,
      percent: 75,
    }
  )
})

test("detects podcast terminal statuses", () => {
  assert.equal(isPodcastTerminalStatus("success"), true)
  assert.equal(isPodcastTerminalStatus("failed"), true)
  assert.equal(isPodcastTerminalStatus("pending"), false)
  assert.equal(isPodcastTerminalStatus("processing"), false)
})

test("selects the most recently updated podcast script across podcast types", () => {
  const baseScript = {
    article_id: 100,
    language: "zh-CN",
    exec_id: "podcast-script",
    status: "success",
    revision: 1,
    created_at: "2026-07-30T08:00:00.000Z",
  } satisfies Omit<ArticlePodcastScriptRecord, "id" | "podcast_type" | "updated_at">
  const newsScript = {
    ...baseScript,
    id: 8,
    podcast_type: "news_broadcast",
    updated_at: "2026-07-30T08:30:00.000Z",
  } satisfies ArticlePodcastScriptRecord
  const interviewScript = {
    ...baseScript,
    id: 9,
    podcast_type: "two_person_interview",
    updated_at: "2026-07-30T08:52:30.000Z",
  } satisfies ArticlePodcastScriptRecord

  assert.equal(
    selectLatestPodcastScript([newsScript, interviewScript])?.id,
    interviewScript.id
  )
  assert.equal(selectLatestPodcastScript([]), null)
})
