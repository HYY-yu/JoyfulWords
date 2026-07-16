import type { GenerationStage } from "@/lib/api/presentations/v2/types"

export const GENERATION_STAGE_ORDER: GenerationStage[] = [
  "queued",
  "preparing",
  "cataloging_images",
  "planning_images",
  "generating_images",
  "matching_templates",
  "selecting_pages",
  "filling_deck_input",
  "validating_input",
  "resolving_assets",
  "generating_pptx",
  "verifying_pptx",
  "uploading",
  "succeeded",
]

export function getGenerationStageIndex(stage: GenerationStage): number {
  if (stage === "failed") return -1
  return GENERATION_STAGE_ORDER.indexOf(stage)
}

export function getNonRegressingStageIndex(
  previousIndex: number,
  stage: GenerationStage
): number {
  return Math.max(previousIndex, getGenerationStageIndex(stage))
}

export function isGenerationTerminal(stage: GenerationStage): boolean {
  return stage === "succeeded" || stage === "failed"
}
