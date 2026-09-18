import type { ArticleDesignState } from "@/lib/api/illustrations/types"

export type ChartDesign = NonNullable<ArticleDesignState["binding"]>["snapshot"]
export type ChartThemeDesign = Pick<ChartDesign, "style" | "palette">

// Approved chart recipes: data geometry stays independent of decorative style.
export const CHART_STYLE_RECIPES = {
  "minimal-business": { radius: 2, width: 2, symbol: "circle" },
  "editorial-story": { radius: 0, width: 2, symbol: "rect" },
  "hand-drawn": { radius: 3, width: 2.5, symbol: "emptyCircle" },
  "cute-chibi": { radius: 12, width: 3.5, symbol: "circle" },
  "premium-glass": { radius: 5, width: 2.5, symbol: "diamond" },
  "minimal-light": { radius: 3, width: 2, symbol: "circle" },
} as const

// Matches the minimal-business / green palette in the shared design catalog (v62).
const DEFAULT_PALETTE = {
  primary: "#176B50", background: "#F4F8F6", surface: "#FFFFFF",
  text: "#202832", muted_text: "#525D69", border: "#C5DAD3",
  chart: ["#176B50", "#C18136", "#2458A6", "#AA3544", "#866000", "#67419A"],
}

export function resolveJoyChartTheme(design?: ChartThemeDesign | null) {
  const slug = design?.style.slug ?? "minimal-business"
  const recipe = CHART_STYLE_RECIPES[slug as keyof typeof CHART_STYLE_RECIPES] ?? CHART_STYLE_RECIPES["minimal-business"]
  const palette = design?.palette ?? DEFAULT_PALETTE
  return {
    ...recipe,
    colors: palette.chart.length ? palette.chart : DEFAULT_PALETTE.chart,
    background: palette.background, text: palette.text, mutedText: palette.muted_text,
    surface: palette.surface, grid: palette.border, axis: palette.border,
    serif: slug === "editorial-story", dashed: slug === "hand-drawn",
    glass: slug === "premium-glass", quiet: slug === "minimal-light",
    fontFamily: slug === "editorial-story" ? 'Georgia, "Songti SC", serif' : '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  }
}
