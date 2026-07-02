import type { JSONContent } from "@tiptap/core"

export function normalizeParsedMarkdownContentForEditor(content: JSONContent): JSONContent[] {
  const nodes = content.type === "doc" ? content.content ?? [] : [content]

  return nodes.map((node) => {
    if (node.type !== "paragraph" || node.content?.length !== 1) {
      return node
    }

    const [onlyChild] = node.content

    if (onlyChild?.type !== "customImage") {
      return node
    }

    const { content: _content, ...imageNode } = onlyChild
    return imageNode
  })
}
