"use client"

import { useState } from "react"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
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
import type { TaskCenterPresentationTaskDetail } from "@/lib/api/taskcenter/types"
import { GENERATION_STAGE_ORDER } from "@/lib/presentations/v2/generation-stage"
import { getPresentationGenerationErrorKey } from "@/lib/presentations/v2/error-messages"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { cn } from "@/lib/utils"

interface PresentationTaskDetailV2Props {
  detail: TaskCenterPresentationTaskDetail
  onContinuePresentation?: (articleId: number) => void
  onRetried?: () => void | Promise<void>
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

function formatTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString()
}

function isUnsetCompletedAt(value: string): boolean {
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) || timestamp <= 0
}

export function PresentationTaskDetailV2({
  detail,
  onContinuePresentation,
  onRetried,
}: PresentationTaskDetailV2Props) {
  const { t } = useTranslation()
  const [retrying, setRetrying] = useState(false)
  const [retrySubmitted, setRetrySubmitted] = useState(false)
  const [retryError, setRetryError] = useState(false)

  const status = retrySubmitted ? "queued" : detail.status
  const stage = retrySubmitted ? "queued" : detail.stage
  const failed = status === "failed"
  const succeeded = status === "succeeded"
  const progressStages = GENERATION_STAGE_ORDER.slice(0, -1)
  const stageIndex = progressStages.indexOf(stage)
  const verifyErrors = detail.verify_report?.errors ?? []
  const downloadUrl = detail.pptx_url?.trim()

  const retry = async () => {
    setRetrying(true)
    setRetryError(false)

    const result = await presentationsV2Client.retryGeneration(detail.id)
    if (hasApiError(result)) {
      console.error("[TaskCenter][PresentationV2] Failed to retry generation", {
        generationId: detail.id,
        status: result.status,
        error: result.error,
      })
      // authenticatedApiRequest already opens the shared recharge dialog for 402.
      if (result.status !== 402) setRetryError(true)
    } else {
      setRetrySubmitted(true)
      await onRetried?.()
    }

    setRetrying(false)
  }

  return (
    <div className="space-y-6">
      {retryError ? (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertDescription>{t("presentationV2.errors.retryGeneration")}</AlertDescription>
        </Alert>
      ) : null}

      <section className="flex items-start gap-4 rounded-xl border bg-muted/15 p-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <PresentationIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{t("contentWriting.taskCenter.taskTitles.presentation")}</h3>
            <Badge variant={failed ? "destructive" : succeeded ? "default" : "secondary"}>
              {t(`presentationV2.generation.status.${status}`)}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {failed
              ? t(getPresentationGenerationErrorKey(detail.error_code))
              : t(`presentationV2.generation.stage.${stage}`)}
          </p>
        </div>
      </section>

      {!failed && !succeeded ? (
        <section className="space-y-3 rounded-xl border p-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">{t(`presentationV2.generation.stage.${stage}`)}</span>
            <span className="text-muted-foreground">
              {t("presentationV2.generation.stageProgress", {
                current: Math.max(stageIndex + 1, 1),
                total: progressStages.length,
              })}
            </span>
          </div>
          <div className="flex gap-1.5" aria-label={t("presentationV2.generation.progressLabel")}>
            {progressStages.map((progressStage, index) => (
              <span
                key={progressStage}
                className={cn(
                  "h-2 flex-1 rounded-full",
                  index <= stageIndex ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </section>
      ) : null}

      <dl className="grid gap-px overflow-hidden rounded-xl border bg-border text-sm sm:grid-cols-2 lg:grid-cols-3">
        {[
          [t("presentationV2.generation.jobId"), `#${detail.id}`],
          [t("contentWriting.taskCenter.fields.stage"), t(`presentationV2.generation.stage.${stage}`)],
          [t("contentWriting.taskCenter.fields.templateId"), String(detail.template_id)],
          [t("contentWriting.taskCenter.fields.storycardVersion"), String(detail.storycard_version)],
          [t("contentWriting.taskCenter.fields.slideCount"), detail.slide_count > 0 ? String(detail.slide_count) : "—"],
          [t("contentWriting.taskCenter.fields.attempt"), String(detail.attempt)],
          [t("contentWriting.taskCenter.fields.createdAt"), formatTime(detail.created_at)],
          [
            t("contentWriting.taskCenter.fields.completedAt"),
            isUnsetCompletedAt(detail.completed_at)
              ? t("contentWriting.taskCenter.notCompleted")
              : formatTime(detail.completed_at),
          ],
          [
            t("contentWriting.taskCenter.fields.verifyPassed"),
            typeof detail.verify_report?.passed === "boolean"
              ? detail.verify_report.passed
                ? t("contentWriting.taskCenter.boolean.yes")
                : t("contentWriting.taskCenter.boolean.no")
              : "—",
          ],
        ].map(([label, value]) => (
          <div key={label} className="bg-background p-4">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 break-words font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      {verifyErrors.length > 0 ? (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertDescription>
            <p className="font-medium">{t("contentWriting.taskCenter.fields.verifyErrors")}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {verifyErrors.map((verifyError, index) => (
                <li key={`${verifyError}-${index}`}>{verifyError}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : detail.verify_report?.passed ? (
        <div className="flex items-center gap-2 text-sm text-emerald-600">
          <CheckCircle2Icon className="size-4" />
          {t("contentWriting.taskCenter.verifyPassed")}
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        {onContinuePresentation ? (
          <Button variant="outline" onClick={() => onContinuePresentation(detail.article_id)}>
            <ExternalLinkIcon className="size-4" />
            {t("presentationV2.taskCenter.continueInArticle")}
          </Button>
        ) : null}
        {failed ? (
          <Button onClick={() => void retry()} disabled={retrying}>
            {retrying ? <Loader2Icon className="size-4 animate-spin" /> : <RefreshCwIcon className="size-4" />}
            {t("presentationV2.generation.retry")}
          </Button>
        ) : null}
        {succeeded && downloadUrl ? (
          <Button onClick={() => triggerDownload(downloadUrl)}>
            <DownloadIcon className="size-4" />
            {t("presentationV2.complete.download")}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
