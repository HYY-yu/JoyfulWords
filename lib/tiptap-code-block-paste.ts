export function normalizeCodeBlockClipboardText(text: string): string {
  return text.replace(/\r\n?/g, "\n")
}

export function shouldInsertPlainTextIntoCodeBlock(parentNodeName: string | undefined, text: string): boolean {
  return parentNodeName === "codeBlock" && text.length > 0
}

export function getClipboardTextPasteMode(
  parentNodeName: string | undefined,
  text: string
): "plain-code-block" | "markdown" | "default" {
  if (!text.length) {
    return "default"
  }

  if (parentNodeName === "codeBlock") {
    return "plain-code-block"
  }

  return "markdown"
}
