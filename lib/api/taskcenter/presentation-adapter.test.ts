import test from "node:test"
import assert from "node:assert/strict"
import { getPresentationTaskContract } from "./presentation-adapter"

test("detects explicit and generation-backed V2 TaskCenter records", () => {
  assert.equal(getPresentationTaskContract({ contract_version: "v2" }), "v2")
  assert.equal(getPresentationTaskContract({ generation_id: 10 }), "v2")
})

test("keeps historical presentation logs on the V1 detail", () => {
  assert.equal(getPresentationTaskContract({}), "v1")
  assert.equal(getPresentationTaskContract({ contract_version: "v1" }), "v1")
})

