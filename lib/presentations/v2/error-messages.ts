export const PRESENTATION_GENERATION_ERROR_CODES = [
  "dependency_unavailable",
  "invalid_storycard_snapshot",
  "invalid_template_snapshot",
  "invalid_runtime_manifest",
  "article_not_found",
  "image_catalog_failed",
  "image_generation_failed",
  "template_match_failed",
  "selected_pages_encode_failed",
  "deck_fill_failed",
  "deck_encode_failed",
  "asset_resolution_failed",
  "template_download_failed",
  "template_checksum_mismatch",
  "runtime_failed",
  "runtime_output_invalid",
  "upload_failed",
  "submit_failed",
] as const

export type PresentationGenerationErrorCode =
  (typeof PRESENTATION_GENERATION_ERROR_CODES)[number]

export function getPresentationGenerationErrorKey(errorCode: string): string {
  return PRESENTATION_GENERATION_ERROR_CODES.includes(
    errorCode as PresentationGenerationErrorCode
  )
    ? `presentationV2.errors.generation.${errorCode}`
    : "presentationV2.errors.generation.unknown"
}
