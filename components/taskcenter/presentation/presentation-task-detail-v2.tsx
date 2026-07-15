"use client"

import { useCallback, useEffect, useState } from "react"
import {
  AlertCircleIcon,
  DownloadIcon,
  ExternalLinkIcon,
  Loader2Icon,
  PresentationIcon,
  RefreshCwIcon,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/base/alert"
import { Badge } from "@/components/ui/base/badge"
import { Button } from "@/components/ui/base/button"
import { presentationsV2Client } from "@/lib/api/presentations/v2/client"
import type { GenerationResponse } from "@/lib/api/presentations/v2/types"
import type { TaskCenterPresentationTaskDetail } from "@/lib/api/taskcenter/types"
import { getPresentationGenerationErrorKey } from "@/lib/presentations/v2/error-messages"
import { useTranslation } from "@/lib/i18n/i18n-context"

const POLL_INTERVAL_MS = 2_000

interface PresentationTaskDetailV2Props {
  detail: TaskCenterPresentationTaskDetail
  onContinuePresentation?: (articleId: number) => void
}

function hasApiError(value: object): value is { error: string; status?: number } {
  return "error" in value
}

function triggerDownload(url: string) {
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = ""
  anchor.rel = "noreferrer"
  anchor.click()
}

export function PresentationTaskDetailV2({
  detail,
  onContinuePresentation,
}: PresentationTaskDetailV2Props) {
  const { t } = useTranslation()
  const generationId = detail.generation_id ?? detail.id
  const [generation, setGeneration] = useState<GenerationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState(false)

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    const result = await presentationsV2Client.getGeneration(generationId)
    if (hasApiError(result)) {
      console.error("[TaskCenter][PresentationV2] Failed to load generation", {
        generationId,
        status: result.status,
        error: result.error,
      })
      setError(true)
    } else {
      setGeneration(result)
      setError(false)
    }
    setLoading(false)
  }, [generationId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!generation || (generation.status !== "queued" && generation.status !== "processing")) {
      return
    }
    const timer = window.setInterval(() => void refresh(true), POLL_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [generation, refresh])

  const retry = async () => {
    setRetrying(true)
    const result = await presentationsV2Client.retryGeneration(generationId)
    if (hasApiError(result)) {
      console.error("[TaskCenter][PresentationV2] Failed to retry generation", {
        generationId,
        status: result.status,
        error: result.error,
      })
      setError(true)
    } else {
      setGeneration(result)
      setError(false)
    }
    setRetrying(false)
  }

  const download = async () => {
    setDownloading(true)
    const result = await presentationsV2Client.getGenerationPptx(generationId)
    if (hasApiError(result) || result.status !== "succeeded" || !result.pptx_url) {
      console.error("[TaskCenter][PresentationV2] PPTX result unavailable", {
        generationId,
        result,
      })
      setError(true)
    } else {
      triggerDownload(result.pptx_url)
    }
    setDownloading(false)
  }

  if (loading && !generation) {
    return (
      <div className="flex min-h-56 items-center justify-center text-muted-foreground">
        <Loader2Icon className="size-5 animate-spin" />
      </div>
    )
  }

  const status = generation?.status ?? detail.status
  const statusKey = status === "success" ? "succeeded" : status === "pending" ? "queued" : status
  const stage = generation?.stage ?? detail.stage ?? "queued"
  const failed = status === "failed"
  const succeeded = status === "success" || status === "succeeded"
  const errorCode = generation?.error_code || detail.error_code || ""

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertDescription>{t("presentationV2.errors.loadGeneration")}</AlertDescription>
        </Alert>
      ) : null}

      <section className="flex items-start gap-4 rounded-xl border bg-muted/15 p-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <PresentationIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{t("presentationV2.title")}</h3>
            <Badge variant={failed ? "destructive" : succeeded ? "default" : "secondary"}>
              {t(`presentationV2.generation.status.${statusKey}`)}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {failed && errorCode
              ? t(getPresentationGenerationErrorKey(errorCode))
              : t(`presentationV2.generation.stage.${stage}`)}
          </p>
        </div>
      </section>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border text-sm sm:grid-cols-3">
        <div className="bg-background p-4">
          <dt className="text-xs text-muted-foreground">{t("presentationV2.generation.jobId")}</dt>
          <dd className="mt-1 font-medium">#{generationId}</dd>
        </div>
        <div className="bg-background p-4">
          <dt className="text-xs text-muted-foreground">{t("presentationV2.generation.slideCount")}</dt>
          <dd className="mt-1 font-medium">{generation?.slide_count ?? detail.slide_count ?? "—"}</dd>
        </div>
        <div className="bg-background p-4">
          <dt className="text-xs text-muted-foreground">{t("presentationV2.generation.statusLabel")}</dt>
          <dd className="mt-1 font-medium">{t(`presentationV2.generation.stage.${stage}`)}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap justify-end gap-2">
        {onContinuePresentation ? (
          <Button variant="outline" onClick={() => onContinuePresentation(detail.article_id)}>
            <ExternalLinkIcon className="size-4" />
            {t("presentation.detail.storycardGenerate.continueToDeck")}
          </Button>
        ) : null}
        {failed ? (
          <Button onClick={() => void retry()} disabled={retrying}>
            {retrying ? <Loader2Icon className="size-4 animate-spin" /> : <RefreshCwIcon className="size-4" />}
            {t("presentationV2.generation.retry")}
          </Button>
        ) : null}
        {succeeded ? (
          <Button onClick={() => void download()} disabled={downloading}>
            {downloading ? <Loader2Icon className="size-4 animate-spin" /> : <DownloadIcon className="size-4" />}
            {t("presentationV2.complete.download")}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
