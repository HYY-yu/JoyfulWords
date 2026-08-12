import test from "node:test"
import assert from "node:assert/strict"

import { PRODUCT_ANALYTICS_EVENTS } from "@/lib/analytics/events"

test("keeps article activation and AI guide event names stable", () => {
  assert.equal(
    PRODUCT_ANALYTICS_EVENTS.ARTICLE_FIRST_KEYSTROKE,
    "article_first_keystroke"
  )
  assert.equal(PRODUCT_ANALYTICS_EVENTS.AI_WRITE_SUBMITTED, "ai_write_submitted")
  assert.equal(PRODUCT_ANALYTICS_EVENTS.EDITOR_AI_GUIDE_SHOWN, "editor_ai_guide_shown")
  assert.equal(PRODUCT_ANALYTICS_EVENTS.EDITOR_AI_GUIDE_CLICKED, "editor_ai_guide_click")
  assert.equal(PRODUCT_ANALYTICS_EVENTS.EDITOR_AI_GUIDE_DISMISSED, "editor_ai_guide_dismiss")
})
