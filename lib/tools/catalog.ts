export const TOOL_SLUGS = [
  "create-image",
  "style-image",
  "image-split",
  "infographic",
] as const

export type ToolSlug = (typeof TOOL_SLUGS)[number]

export function isToolSlug(value: string): value is ToolSlug {
  return (TOOL_SLUGS as readonly string[]).includes(value)
}
