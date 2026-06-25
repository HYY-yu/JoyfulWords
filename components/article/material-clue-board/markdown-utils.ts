export function normalizeMarkdownLinksWithSpaceDestinations(markdown: string) {
  return markdown.replace(
    /(?<!!)\[([^\]\n]+)\]\(([^)\n<>]*\s[^)\n<>]*)\)/g,
    (_match, label: string, destination: string) => {
      const normalizedDestination = destination.trim().replace(/>/g, "%3E")
      return `[${label}](<${normalizedDestination}>)`
    }
  )
}

