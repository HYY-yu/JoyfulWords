import type { CSSProperties } from "react"
import type { Theme } from "mind-elixir"
import type { ArticleThemeDesign } from "@/lib/design/article-design"
import { DEFAULT_DESIGN_PALETTE } from "@/lib/design/default-palette"

export function createMindMapDesign(design: ArticleThemeDesign | null) {
  const p = design?.palette ?? DEFAULT_DESIGN_PALETTE
  // Keep branches in the selected color family. Text uses the catalog's contrast-safe colors.
  const palette = [p.primary, p.secondary, p.primary, p.muted_text]
  const theme: Theme = {
    name: "JoyfulWords", type: "light", palette,
    cssVar: {
      "--node-gap-x": "42px", "--node-gap-y": "14px",
      "--main-gap-x": "88px", "--main-gap-y": "46px",
      "--main-color": p.text, "--main-bgcolor": `${p.surface}f5`,
      "--main-bgcolor-transparent": `${p.surface}d1`, "--color": p.text,
      "--bgcolor": p.background, "--selected": p.primary, "--accent-color": p.primary,
      "--root-color": p.on_primary, "--root-bgcolor": p.primary,
      "--root-border-color": `${p.surface}2e`, "--root-radius": "999px",
      "--main-radius": "18px", "--topic-padding": "8px 14px",
      "--panel-color": p.text, "--panel-bgcolor": `${p.surface}f5`,
      "--panel-border-color": p.border, "--map-padding": "90px 120px",
    },
  }
  const variables = {
    "--mm-primary": p.primary, "--mm-on-primary": p.on_primary,
    "--mm-secondary": p.secondary, "--mm-bg": p.background,
    "--mm-surface": p.surface, "--mm-text": p.text,
    "--mm-border": p.border,
  } as CSSProperties
  return { theme, variables }
}
