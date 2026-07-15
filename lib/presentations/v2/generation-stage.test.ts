import test from "node:test"
import assert from "node:assert/strict"
import {
  GENERATION_STAGE_ORDER,
  getGenerationStageIndex,
  getNonRegressingStageIndex,
  isGenerationTerminal,
} from "./generation-stage"

test("keeps segmented progress from moving backwards", () => {
  const generatingIndex = getGenerationStageIndex("generating_pptx")
  assert.equal(
    getNonRegressingStageIndex(generatingIndex, "matching_templates"),
    generatingIndex
  )
  assert.equal(
    getNonRegressingStageIndex(generatingIndex, "uploading"),
    GENERATION_STAGE_ORDER.indexOf("uploading")
  )
})

test("only terminal stages stop status polling", () => {
  assert.equal(isGenerationTerminal("succeeded"), true)
  assert.equal(isGenerationTerminal("failed"), true)
  assert.equal(isGenerationTerminal("uploading"), false)
})

