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

export function isToolSlug(value: string): value is ToolSlug {
  return (TOOL_SLUGS as readonly string[]).includes(value)
}
