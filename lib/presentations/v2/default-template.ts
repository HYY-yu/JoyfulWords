import type { PPTTemplate } from "@/lib/api/presentations/v2/types"

// Published metadata connects the existing design catalog to immutable template versions.
export function defaultPresentationTemplate(templates: PPTTemplate[], styleSlug?: string): PPTTemplate | null {
  if (!styleSlug) return null
  return templates
    .filter(template => template.metadata?.style_slug === styleSlug)
    .sort((a, b) => b.version - a.version || a.template_key.localeCompare(b.template_key))[0] ?? null
}
