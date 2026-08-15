export const TOOL_SLUGS = [
  "ai-writer",
  "image-generator",
  "infographic",
  "mind-map",
  "ai-charts",
  "ppt-generator",
  "markdown-to-word",
  "ppt-to-word",
  "word-to-ppt",
  "meme-inserter",
] as const

export type ToolSlug = (typeof TOOL_SLUGS)[number]

export const TOOL_INDEX_SLUGS = [
  "image-generator",
  "infographic",
  "ai-charts",
  "ppt-generator",
  "markdown-to-word",
  "ppt-to-word",
] as const satisfies readonly ToolSlug[]

export const AVAILABLE_TOOL_SLUGS = [
  "image-generator",
  "infographic",
  "ai-charts",
  "ppt-generator",
  "markdown-to-word",
  "ppt-to-word",
] as const satisfies readonly ToolSlug[]

export function isToolSlug(value: string): value is ToolSlug {
  return (TOOL_SLUGS as readonly string[]).includes(value)
}

export function isAvailableToolSlug(value: ToolSlug): boolean {
  return (AVAILABLE_TOOL_SLUGS as readonly ToolSlug[]).includes(value)
}
