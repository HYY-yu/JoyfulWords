import test from "node:test"
import assert from "node:assert/strict"

import {
  getImageTaskErrorMessage,
  getImageTaskErrorMessageKey,
  normalizeImageTaskErrorCode,
} from "./image-error-messages"

test("normalizes unknown image task errors to generation_failed", () => {
  assert.equal(normalizeImageTaskErrorCode("unknown_error"), "generation_failed")
  assert.equal(normalizeImageTaskErrorCode(undefined), "generation_failed")
})

test("builds task center i18n keys from image task error codes", () => {
  assert.equal(
    getImageTaskErrorMessageKey("img_gen_prompt_rejected"),
    "contentWriting.taskCenter.imageErrors.img_gen_prompt_rejected"
  )
  assert.equal(
    getImageTaskErrorMessageKey("unknown_error"),
    "contentWriting.taskCenter.imageErrors.generation_failed"
  )
})

test("returns locale-specific fallback-safe image task messages", () => {
  assert.equal(
    getImageTaskErrorMessage("img_gen_moderation_unavailable", "zh"),
    "提示词审核服务暂时不可用，请稍后重试。本次不会扣费。"
  )
  assert.equal(
    getImageTaskErrorMessage(undefined, "en"),
    "Image generation failed. This attempt was not charged. Please try again later."
  )
})
