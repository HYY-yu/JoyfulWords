import test from "node:test"
import assert from "node:assert/strict"

import {
  hasMeaningfulArticleContent,
  shouldConfirmAIWriteOverwrite,
  shouldTrackFirstArticleKeystroke,
} from "@/lib/article-content"

test("treats blank editor scaffolding as empty article content", () => {
  assert.equal(hasMeaningfulArticleContent({ html: "" }), false)
  assert.equal(hasMeaningfulArticleContent({ html: "<p></p>" }), false)
  assert.equal(hasMeaningfulArticleContent({ html: "<p><br></p>" }), false)
  assert.equal(hasMeaningfulArticleContent({ html: "<p>&nbsp;</p>" }), false)
  assert.equal(hasMeaningfulArticleContent({ html: "<p>\u00a0</p>" }), false)
})

test("recognizes text and non-text article nodes as meaningful content", () => {
  assert.equal(
    hasMeaningfulArticleContent({ html: "<p>Draft</p>", text: "Draft" }),
    true
  )
  assert.equal(
    hasMeaningfulArticleContent({ html: '<p><img src="cover.png"></p>', text: "" }),
    true
  )
  assert.equal(
    hasMeaningfulArticleContent({ html: "<table><tbody><tr><td></td></tr></tbody></table>" }),
    true
  )
})

test("requires overwrite confirmation only for saved articles with content", () => {
  assert.equal(shouldConfirmAIWriteOverwrite(undefined, true), false)
  assert.equal(shouldConfirmAIWriteOverwrite(123, false), false)
  assert.equal(shouldConfirmAIWriteOverwrite(123, true), true)
})

test("tracks the first keystroke once for an initially empty saved article", () => {
  assert.equal(
    shouldTrackFirstArticleKeystroke({
      articleId: undefined,
      articleStartedEmpty: true,
      alreadyTracked: false,
    }),
    false
  )
  assert.equal(
    shouldTrackFirstArticleKeystroke({
      articleId: 123,
      articleStartedEmpty: false,
      alreadyTracked: false,
    }),
    false
  )
  assert.equal(
    shouldTrackFirstArticleKeystroke({
      articleId: 123,
      articleStartedEmpty: true,
      alreadyTracked: true,
    }),
    false
  )
  assert.equal(
    shouldTrackFirstArticleKeystroke({
      articleId: 123,
      articleStartedEmpty: true,
      alreadyTracked: false,
    }),
    true
  )
})
