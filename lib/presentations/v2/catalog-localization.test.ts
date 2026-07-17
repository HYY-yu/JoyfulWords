import assert from "node:assert/strict"
import test from "node:test"
import { resolveCatalogText } from "./catalog-localization"

const translations = {
  zh: "商务演示",
  en: "Business presentation",
}

test("uses the current interface language for catalog text", () => {
  assert.equal(resolveCatalogText(translations, "en", "fallback"), "Business presentation")
  assert.equal(resolveCatalogText(translations, "zh", "fallback"), "商务演示")
})

test("falls back to the other translation when the requested language is missing", () => {
  assert.equal(resolveCatalogText({ zh: "商务演示" }, "en", "fallback"), "商务演示")
})

test("uses the supplied fallback when no translation is available", () => {
  assert.equal(resolveCatalogText({}, "en", "template-key"), "template-key")
})
