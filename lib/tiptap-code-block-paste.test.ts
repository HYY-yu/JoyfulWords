import test from "node:test"
import assert from "node:assert/strict"
import {
  getClipboardTextPasteMode,
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

test("routes clipboard text by the current editor parent node", () => {
  assert.equal(getClipboardTextPasteMode("codeBlock", "# Heading\n- item"), "plain-code-block")
  assert.equal(getClipboardTextPasteMode("paragraph", "# Heading\n- item"), "markdown")
  assert.equal(getClipboardTextPasteMode("heading", "plain paragraph"), "markdown")
  assert.equal(getClipboardTextPasteMode("paragraph", ""), "default")
})
