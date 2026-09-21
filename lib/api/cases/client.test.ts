import assert from "node:assert/strict"
import test from "node:test"
import { caseAssetUrl, caseText } from "./client"

test("case localization falls back to the source language without losing content", () => {
  assert.equal(caseText({ zh: "案例", en: "Case" }, "en"), "Case")
  assert.equal(caseText({ zh: "中文正文" }, "en"), "中文正文")
  assert.equal(caseText({}, "zh"), "")
})

test("case snapshot links reject executable and local file schemes", () => {
  for (const value of ["javascript:alert(1)", "data:text/html,test", "file:///tmp/test", "https://user:pass@example.com/x", "/private/article", ""]) {
    assert.equal(caseAssetUrl(value), undefined)
  }
  assert.equal(caseAssetUrl("https://assets.example.com/case.pptx"), "https://assets.example.com/case.pptx")
})
