"use client"

import {
  AlertCircleIcon,
  CheckCircle2Icon,
  DownloadIcon,
  Loader2Icon,
  PresentationIcon,
  RefreshCwIcon,
} from "lucide-react"
import { Button } from "@/components/ui/base/button"
import type { GenerationResponse } from "@/lib/api/presentations/v2/types"
import { GENERATION_STAGE_ORDER } from "@/lib/presentations/v2/generation-stage"
import { getPresentationGenerationErrorKey } from "@/lib/presentations/v2/error-messages"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { cn } from "@/lib/utils"

interface GenerationStepProps {
  generation: GenerationResponse
  maxStageIndex: number
  retrying?: boolean
  downloading?: boolean
  onRetry: () => void
  onDownload: () => void
}

export function GenerationStep({
  generation,
  maxStageIndex,
  retrying = false,
  downloading = false,
  onRetry,
  onDownload,
}: GenerationStepProps) {
  const { t } = useTranslation()
  const succeeded = generation.status === "succeeded"
  const failed = generation.status === "failed"

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto px-5 py-10">
      <div className="w-full max-w-3xl">
        <div className="text-center">
          <span
            className={cn(
              "mx-auto grid size-16 place-items-center rounded-2xl transition-all duration-300",
              succeeded
                ? "bg-emerald-500/10 text-emerald-600"
                : failed
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
            )}
          >
            {succeeded ? (
              <CheckCircle2Icon className="size-8" />
            ) : failed ? (
              <AlertCircleIcon className="size-8" />
            ) : (
              <PresentationIcon className="size-8 animate-pulse" />
            )}
          </span>
          <h3 className="mt-5 text-2xl font-semibold tracking-tight">
            {succeeded
              ? t("presentationV2.complete.title")
              : failed
                ? t("presentationV2.generation.failedTitle")
                : t("presentationV2.generation.title")}
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            {succeeded
              ? t("presentationV2.complete.description", { count: generation.slide_count })
              : failed
                ? t(getPresentationGenerationErrorKey(generation.error_code))
                : t(`presentationV2.generation.stage.${generation.stage}`)}
          </p>
        </div>

        {!succeeded && !failed ? (
          <div className="mt-10">
            <div className="flex gap-1.5" aria-label={t("presentationV2.generation.progressLabel")}>
              {GENERATION_STAGE_ORDER.slice(0, -1).map((stage, index) => (
                <span
                  key={stage}
                  className={cn(
                    "h-2 flex-1 rounded-full transition-colors duration-500",
                    index <= maxStageIndex ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin text-primary" />
              {t(`presentationV2.generation.stage.${generation.stage}`)}
            </div>
          </div>
        ) : null}

        <div className="mt-10 flex justify-center gap-3">
          {failed ? (
            <Button onClick={onRetry} disabled={retrying}>
              {retrying ? <Loader2Icon className="size-4 animate-spin" /> : <RefreshCwIcon className="size-4" />}
              {t("presentationV2.generation.retry")}
            </Button>
          ) : null}
          {succeeded ? (
            <Button onClick={onDownload} disabled={downloading || !generation.pptx_url}>
              {downloading ? <Loader2Icon className="size-4 animate-spin" /> : <DownloadIcon className="size-4" />}
              {t("presentationV2.complete.download")}
            </Button>
          ) : null}
        </div>

        <div className="mt-10 grid grid-cols-2 divide-x border-y py-4 text-center text-xs text-muted-foreground sm:grid-cols-3">
          <div>
            <span className="block font-medium text-foreground">#{generation.id}</span>
            {t("presentationV2.generation.jobId")}
          </div>
          <div>
            <span className="block font-medium text-foreground">{generation.slide_count || "—"}</span>
            {t("presentationV2.generation.slideCount")}
          </div>
          <div className="hidden sm:block">
            <span className="block font-medium text-foreground">
              {t(`presentationV2.generation.status.${generation.status}`)}
            </span>
            {t("presentationV2.generation.statusLabel")}
          </div>
        </div>
      </div>
    </div>
  )
}

