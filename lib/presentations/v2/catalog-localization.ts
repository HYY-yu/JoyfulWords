import type { PPTLanguage } from "@/lib/api/presentations/v2/types"

export function resolveCatalogText(
  translations: Partial<Record<PPTLanguage, string>>,
  displayLanguage: PPTLanguage,
  fallback: string
): string {
  const alternateLanguage: PPTLanguage = displayLanguage === "zh" ? "en" : "zh"

  return translations[displayLanguage] || translations[alternateLanguage] || fallback
}
