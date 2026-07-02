export function normalizeCodeBlockClipboardText(text: string): string {
  return text.replace(/\r\n?/g, "\n")
}

export function shouldInsertPlainTextIntoCodeBlock(parentNodeName: string | undefined, text: string): boolean {
  return parentNodeName === "codeBlock" && text.length > 0
}
