import test from "node:test"
import assert from "node:assert/strict"
import {
  normalizeCodeBlockClipboardText,
  shouldInsertPlainTextIntoCodeBlock,
} from "./tiptap-code-block-paste"

test("handles plain text input only when the selection is inside a code block", () => {
  assert.equal(shouldInsertPlainTextIntoCodeBlock("codeBlock", "# Heading\n- item"), true)
  assert.equal(shouldInsertPlainTextIntoCodeBlock("paragraph", "# Heading\n- item"), false)
  assert.equal(shouldInsertPlainTextIntoCodeBlock("codeBlock", ""), false)
})

test("normalizes clipboard line endings before inserting into a code block", () => {
  assert.equal(
    normalizeCodeBlockClipboardText("# Role\r\nline 2\rline 3"),
    "# Role\nline 2\nline 3"
  )
})
