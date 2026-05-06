"use client"

import type { Locale } from "@/lib/i18n/shared"

export const IMAGE_TASK_ERROR_CODES = [
  "img_gen_prompt_rejected",
  "img_gen_moderation_unavailable",
  "generation_failed",
] as const

export type ImageTaskErrorCode = (typeof IMAGE_TASK_ERROR_CODES)[number]

const IMAGE_TASK_ERROR_CODE_SET = new Set<string>(IMAGE_TASK_ERROR_CODES)

const IMAGE_TASK_ERROR_MESSAGES: Record<
  Locale,
  Record<ImageTaskErrorCode, string>
> = {
  zh: {
    img_gen_prompt_rejected: "你的提示词无法处理，请修改后重新生成。本次不会扣费。",
    img_gen_moderation_unavailable: "提示词审核服务暂时不可用，请稍后重试。本次不会扣费。",
    generation_failed: "图片生成失败。本次不会扣费，请稍后重试。",
  },
  en: {
    img_gen_prompt_rejected:
      "Your prompt could not be processed. Please revise it and generate again. This attempt was not charged.",
    img_gen_moderation_unavailable:
      "Prompt review is temporarily unavailable. Please try again later. This attempt was not charged.",
    generation_failed:
      "Image generation failed. This attempt was not charged. Please try again later.",
  },
}

export function normalizeImageTaskErrorCode(
  errorCode: unknown
): ImageTaskErrorCode {
  if (
    typeof errorCode === "string" &&
    IMAGE_TASK_ERROR_CODE_SET.has(errorCode)
  ) {
    return errorCode as ImageTaskErrorCode
  }

  return "generation_failed"
}

export function getImageTaskErrorMessageKey(errorCode: unknown): string {
  return `contentWriting.taskCenter.imageErrors.${normalizeImageTaskErrorCode(errorCode)}`
}

export function getImageTaskErrorMessage(
  errorCode: unknown,
  locale: Locale
): string {
  return IMAGE_TASK_ERROR_MESSAGES[locale][normalizeImageTaskErrorCode(errorCode)]
}
