export const TOOL_SLUGS = [
  "ai-writer",
  "smart-rewrite",
  "image-generator",
  "infographic",
  "mind-map",
  "ai-charts",
  "ppt-generator",
] as const

export type ToolSlug = (typeof TOOL_SLUGS)[number]

export function isToolSlug(value: string): value is ToolSlug {
  return (TOOL_SLUGS as readonly string[]).includes(value)
}
