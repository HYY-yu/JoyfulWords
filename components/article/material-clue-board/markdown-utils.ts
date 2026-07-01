export function normalizeMarkdownLinksWithSpaceDestinations(markdown: string) {
  return markdown.replace(
    /(?<!!)\[([^\]\n]+)\]\(([^)\n<>]*\s[^)\n<>]*)\)/g,
    (_match, label: string, destination: string) => {
      const normalizedDestination = destination.trim().replace(/>/g, "%3E")
      return `[${label}](<${normalizedDestination}>)`
    }
  )
}

function stripOptionalAngleBrackets(value: string) {
  const trimmed = value.trim()
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

function isMarkdownDestination(destination: string) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\/|\.{1,2}\/)/i.test(destination)
    || /^[^\s/]+\.[^\s/]+/.test(destination)
}

function isClueBoardSearchLink(label: string, destination: string) {
  const normalizedLabel = label.trim().toLowerCase()
  const normalizedDestination = stripOptionalAngleBrackets(destination).toLowerCase()

  return Boolean(normalizedLabel)
    && normalizedLabel === normalizedDestination
    && !isMarkdownDestination(normalizedDestination)
}

export function sanitizeClueBoardMaterialContent(markdown: string) {
  return markdown.replace(
    /(?<!!)\[([^\]\n]+)\]\s*\((<?[^)\n]+>?)\)/g,
    (match, label: string, destination: string) => {
      if (!isClueBoardSearchLink(label, destination)) return match
      return label.trim()
    }
  )
}
