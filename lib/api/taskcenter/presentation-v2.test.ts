import assert from "node:assert/strict"
import test from "node:test"
import {
  getTaskCenterPresentationDownloadUrl,
  isTaskCenterSucceededTask,
  isTaskCenterTerminalTask,
  type PresentationTaskItem,
} from "./types"

function createPresentationTask(
  status: PresentationTaskItem["status"]
): PresentationTaskItem {
  return {
    id: 10,
    type: "presentation",
    status,
    created_at: "2026-07-15T00:00:00Z",
    details: {
      article_id: 123,
      storycard_id: 1,
      storycard_version: 2,
      template_id: 3,
      stage: status === "succeeded" || status === "failed" ? status : "queued",
      ppt_url: "",
      pptx_url: status === "succeeded" ? "https://example.com/deck.pptx" : "",
      slide_count: 8,
      verify_report: {},
      attempt: 1,
      completed_at: "1970-01-01T00:00:00Z",
      model_name: "test-model",
      error_code: "",
      error_message: "",
      billing_status: "pending",
    },
  }
}

test("returns the V2 pptx_url after trimming whitespace", () => {
  assert.equal(
    getTaskCenterPresentationDownloadUrl({ pptx_url: "  https://example.com/deck.pptx  " }),
    "https://example.com/deck.pptx"
  )
})

test("returns null when the V2 pptx_url is missing", () => {
  assert.equal(getTaskCenterPresentationDownloadUrl({}), null)
  assert.equal(getTaskCenterPresentationDownloadUrl({ pptx_url: "   " }), null)
})

test("uses the presentation-specific terminal status contract", () => {
  assert.equal(isTaskCenterTerminalTask(createPresentationTask("queued")), false)
  assert.equal(isTaskCenterTerminalTask(createPresentationTask("processing")), false)
  assert.equal(isTaskCenterTerminalTask(createPresentationTask("succeeded")), true)
  assert.equal(isTaskCenterTerminalTask(createPresentationTask("failed")), true)
})

test("only succeeded presentation jobs are treated as successful", () => {
  assert.equal(isTaskCenterSucceededTask(createPresentationTask("succeeded")), true)
  assert.equal(isTaskCenterSucceededTask(createPresentationTask("failed")), false)
})
