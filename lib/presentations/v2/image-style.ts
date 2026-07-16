import type {
  PPTImageStyle,
  PPTImageStyleID,
} from "@/lib/api/presentations/v2/types"

export function resolveImageStyle(
  styles: PPTImageStyle[],
  defaultStyleId: PPTImageStyleID,
  preferredStyleId?: PPTImageStyleID
): PPTImageStyle | null {
  return (
    styles.find((style) => style.id === preferredStyleId) ??
    styles.find((style) => style.id === defaultStyleId) ??
    styles[0] ??
    null
  )
}
