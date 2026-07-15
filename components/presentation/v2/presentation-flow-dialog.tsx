"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  Loader2Icon,
  PresentationIcon,
  RefreshCwIcon,
  SaveIcon,
  SparklesIcon,
} from "lucide-react"
import { AIFeatureDialogShell } from "@/components/ui/ai/ai-feature-dialog-shell"
import { Alert, AlertDescription } from "@/components/ui/base/alert"
import { Button } from "@/components/ui/base/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/base/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth/auth-context"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { tokenStore } from "@/lib/tokens/token-store"
import { webSocketService, type TaskSocketEvent } from "@/lib/websocket/websocket-service"
import { presentationsV2Client } from "@/lib/api/presentations/v2/client"
import type {
  GenerationResponse,
  PPTLanguage,
  PPTTemplate,
  StorycardDocument,
  StorycardResponse,
} from "@/lib/api/presentations/v2/types"
import {
  cloneStorycardDocument,
  isStorycardDocument,
  validateStorycardDocument,
} from "@/lib/presentations/v2/storycard-validation"
import {
  clearPresentationFlowSession,
  loadPresentationFlowSession,
  savePresentationFlowSession,
} from "@/lib/presentations/v2/flow-session"
import { getNonRegressingStageIndex } from "@/lib/presentations/v2/generation-stage"
import { PresentationFlowStepper } from "./presentation-flow-stepper"
import { StorycardStep } from "./storycard-step"
import { TemplateStep } from "./template-step"
import { GenerationStep } from "./generation-step"

const STORYCARD_POLL_INTERVAL_MS = 1_800
const GENERATION_POLL_INTERVAL_MS = 2_000
const STORYCARD_POLL_TIMEOUT_MS = 10 * 60 * 1_000

type FlowStep = 0 | 1 | 2 | 3
type StorycardAction = "generating" | "saving" | "confirming" | null

export interface PresentationTaskChangedEvent {
  generationId: number
  articleId: number
  status: GenerationResponse["status"]
}

interface PresentationFlowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  articleId?: number | null
  onPresentationTaskChanged?: (event: PresentationTaskChangedEvent) => void
}

function triggerDownload(url: string) {
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = ""
  anchor.rel = "noreferrer"
  anchor.click()
}

function hasApiError(value: object): value is { error: string; status?: number; reason?: string } {
  return "error" in value
}

function isTransientNetworkError(value: { reason?: string; status?: number }): boolean {
  return value.reason === "network_error" || typeof value.status !== "number"
}

export function PresentationFlowDialog({
  open,
  onOpenChange,
  articleId,
  onPresentationTaskChanged,
}: PresentationFlowDialogProps) {
  const { t, locale } = useTranslation()
  const { toast } = useToast()
  const { user } = useAuth()
  const mountedSequenceRef = useRef(0)
  const storycardPollStartedAtRef = useRef<number | null>(null)
  const lastNotifiedGenerationRef = useRef<string | null>(null)

  const [step, setStep] = useState<FlowStep>(0)
  const [language, setLanguage] = useState<PPTLanguage>(locale === "zh" ? "zh" : "en")
  const [loading, setLoading] = useState(false)
  const [storycard, setStorycard] = useState<StorycardResponse | null>(null)
  const [draft, setDraft] = useState<StorycardDocument | null>(null)
  const [dirty, setDirty] = useState(false)
  const [storycardAction, setStorycardAction] = useState<StorycardAction>(null)
  const [storycardPollingTimedOut, setStorycardPollingTimedOut] = useState(false)
  const [templates, setTemplates] = useState<PPTTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<PPTTemplate | null>(null)
  const [generation, setGeneration] = useState<GenerationResponse | null>(null)
  const [maxStageIndex, setMaxStageIndex] = useState(-1)
  const [generationSubmitting, setGenerationSubmitting] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const issues = useMemo(() => (draft ? validateStorycardDocument(draft) : []), [draft])
  const storycardBusy = storycardAction !== null
  const generationBusy = generation?.status === "queued" || generation?.status === "processing"
  const generationId = generation?.id ?? null

  const syncStorycard = useCallback((nextStorycard: StorycardResponse) => {
    setStorycard(nextStorycard)
    setLanguage(nextStorycard.language)
    if (isStorycardDocument(nextStorycard.storycard)) {
      setDraft(cloneStorycardDocument(nextStorycard.storycard))
      setDirty(false)
    } else {
      setDraft(null)
    }

    if (nextStorycard.status === "generating") {
      storycardPollStartedAtRef.current ??= Date.now()
    } else {
      storycardPollStartedAtRef.current = null
      setStorycardPollingTimedOut(false)
    }
  }, [])

  const reset = useCallback(() => {
    mountedSequenceRef.current += 1
    storycardPollStartedAtRef.current = null
    lastNotifiedGenerationRef.current = null
    setStep(0)
    setLanguage(locale === "zh" ? "zh" : "en")
    setLoading(false)
    setStorycard(null)
    setDraft(null)
    setDirty(false)
    setStorycardAction(null)
    setStorycardPollingTimedOut(false)
    setTemplates([])
    setTemplatesLoading(false)
    setSelectedTemplate(null)
    setGeneration(null)
    setMaxStageIndex(-1)
    setGenerationSubmitting(false)
    setRetrying(false)
    setDownloading(false)
    setErrorKey(null)
  }, [locale])

  const persistSession = useCallback(
    (nextGeneration: GenerationResponse | null, template: PPTTemplate | null = null) => {
      if (!user || typeof articleId !== "number") return

      const existing = loadPresentationFlowSession(user.id, articleId)

      savePresentationFlowSession({
        userId: user.id,
        articleId,
        generationId: nextGeneration?.id,
        templateKey: template?.template_key ?? existing?.templateKey,
        templateVersion: template?.version ?? existing?.templateVersion,
      })
    },
    [articleId, user]
  )

  const refreshGeneration = useCallback(
    async (generationId: number, options: { clearInvalid?: boolean; revealStep?: boolean } = {}) => {
      const result = await presentationsV2Client.getGeneration(generationId)
      if (hasApiError(result)) {
        if (result.status === 404 && options.clearInvalid && user && typeof articleId === "number") {
          console.warn("[PresentationV2] Clearing stale generation session", {
            generationId,
            articleId,
          })
          clearPresentationFlowSession(user.id, articleId)
          setGeneration(null)
          return
        }

        if (isTransientNetworkError(result)) {
          console.warn("[PresentationV2] Generation refresh will retry after network error", {
            generationId,
            error: result.error,
          })
          return
        }

        console.error("[PresentationV2] Failed to refresh generation", {
          generationId,
          status: result.status,
          error: result.error,
        })
        return
      }

      if (typeof articleId === "number" && result.article_id !== articleId) {
        console.warn("[PresentationV2] Ignoring generation from another article", {
          generationId,
          expectedArticleId: articleId,
          actualArticleId: result.article_id,
        })
        if (user) clearPresentationFlowSession(user.id, articleId)
        return
      }

      setGeneration(result)
      setMaxStageIndex((current) => getNonRegressingStageIndex(current, result.stage))
      if (options.revealStep) {
        setStep(result.status === "succeeded" ? 3 : 2)
      }
      persistSession(result)
      const notificationKey = `${result.id}:${result.status}`
      if (lastNotifiedGenerationRef.current !== notificationKey) {
        lastNotifiedGenerationRef.current = notificationKey
        onPresentationTaskChanged?.({
          generationId: result.id,
          articleId: result.article_id,
          status: result.status,
        })
      }
    },
    [articleId, onPresentationTaskChanged, persistSession, user]
  )

  useEffect(() => {
    if (!open) {
      reset()
      return
    }

    if (typeof articleId !== "number" || !user) return

    const sequence = ++mountedSequenceRef.current
    setLoading(true)
    setTemplatesLoading(true)
    setErrorKey(null)

    const load = async () => {
      const [storycardResult, templatesResult] = await Promise.all([
        presentationsV2Client.getStorycard(articleId),
        presentationsV2Client.listTemplates(),
      ])
      if (sequence !== mountedSequenceRef.current) return

      if (hasApiError(storycardResult)) {
        if (storycardResult.status !== 404) {
          console.error("[PresentationV2] Failed to load storycard", {
            articleId,
            status: storycardResult.status,
            error: storycardResult.error,
          })
          setErrorKey("presentationV2.errors.loadStorycard")
        }
      } else {
        syncStorycard(storycardResult)
        if (storycardResult.status === "confirmed") setStep(1)
      }

      if (hasApiError(templatesResult)) {
        console.error("[PresentationV2] Failed to load templates", {
          status: templatesResult.status,
          error: templatesResult.error,
        })
        setErrorKey((current) => current ?? "presentationV2.errors.loadTemplates")
      } else {
        setTemplates(templatesResult.templates)
      }

      const session = loadPresentationFlowSession(user.id, articleId)
      if (session?.templateKey && session.templateVersion) {
        const matchedTemplate = hasApiError(templatesResult)
          ? null
          : templatesResult.templates.find(
              (template) =>
                template.template_key === session.templateKey &&
                template.version === session.templateVersion
            ) ?? null
        setSelectedTemplate(matchedTemplate)
      }

      if (session?.generationId) {
        await refreshGeneration(session.generationId, { clearInvalid: true, revealStep: true })
      }

      if (sequence === mountedSequenceRef.current) {
        setLoading(false)
        setTemplatesLoading(false)
      }
    }

    void load()
    return () => {
      mountedSequenceRef.current += 1
    }
  }, [articleId, open, refreshGeneration, reset, syncStorycard, user])

  useEffect(() => {
    if (
      !open ||
      storycard?.status !== "generating" ||
      storycardPollingTimedOut ||
      typeof articleId !== "number"
    ) return

    let cancelled = false
    let timer: number | null = null
    let networkFailureCount = 0

    const schedule = (delay: number) => {
      if (cancelled) return
      timer = window.setTimeout(() => void poll(), delay)
    }

    const poll = async () => {
      const startedAt = storycardPollStartedAtRef.current ?? Date.now()
      storycardPollStartedAtRef.current = startedAt
      if (Date.now() - startedAt > STORYCARD_POLL_TIMEOUT_MS) {
        console.warn("[PresentationV2] Storycard polling timed out", { articleId })
        setErrorKey("presentationV2.errors.storycardTimeout")
        setStorycardPollingTimedOut(true)
        return
      }

      const result = await presentationsV2Client.getStorycard(articleId)
      if (hasApiError(result)) {
        networkFailureCount = isTransientNetworkError(result) ? networkFailureCount + 1 : 0
        const retryDelay = isTransientNetworkError(result)
          ? Math.min(15_000, STORYCARD_POLL_INTERVAL_MS * 2 ** networkFailureCount)
          : STORYCARD_POLL_INTERVAL_MS
        console.warn("[PresentationV2] Storycard poll failed and will retry", {
          articleId,
          status: result.status,
          error: result.error,
          retryDelay,
        })
        schedule(retryDelay)
        return
      }
      networkFailureCount = 0
      syncStorycard(result)
      if (result.status === "generating") schedule(STORYCARD_POLL_INTERVAL_MS)
    }

    schedule(STORYCARD_POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      if (timer !== null) window.clearTimeout(timer)
    }
  }, [articleId, open, storycard?.status, storycardPollingTimedOut, syncStorycard])

  useEffect(() => {
    if (!open || !generationBusy || typeof generationId !== "number") return
    const timer = window.setInterval(
      () => void refreshGeneration(generationId),
      GENERATION_POLL_INTERVAL_MS
    )
    return () => window.clearInterval(timer)
  }, [generationBusy, generationId, open, refreshGeneration])

  useEffect(() => {
    if (!open || typeof articleId !== "number" || typeof generationId !== "number") return
    const token = tokenStore.getAccessToken()
    if (token) webSocketService.ensureArticleConnection(articleId, token)

    const eventName = `task:event:article:${articleId}`
    const handleTaskEvent = (event: TaskSocketEvent) => {
      if (event.payload.task_type !== "presentation" || event.payload.task_id !== generationId) {
        return
      }
      console.debug("[PresentationV2] Refreshing generation after websocket event", {
        generationId,
        messageType: event.messageType,
      })
      void refreshGeneration(generationId)
    }

    webSocketService.on(eventName, handleTaskEvent)
    return () => {
      webSocketService.off(eventName, handleTaskEvent)
      if (token) webSocketService.releaseArticleConnection(articleId)
    }
  }, [articleId, generationId, open, refreshGeneration])

  const reloadLatestStorycard = useCallback(async () => {
    if (typeof articleId !== "number") return
    const result = await presentationsV2Client.getStorycard(articleId)
    if (!hasApiError(result)) syncStorycard(result)
  }, [articleId, syncStorycard])

  const handleGenerateStorycard = useCallback(async () => {
    if (typeof articleId !== "number") return
    setStorycardAction("generating")
    setStorycardPollingTimedOut(false)
    setErrorKey(null)
    try {
      const result = await presentationsV2Client.generateStorycard({ article_id: articleId, language })
      if (hasApiError(result)) {
        console.error("[PresentationV2] Storycard generation request failed", {
          articleId,
          status: result.status,
          error: result.error,
        })
        setErrorKey("presentationV2.errors.generateStorycard")
        toast({ variant: "destructive", description: t("presentationV2.toast.generateFailed") })
        return
      }
      syncStorycard(result)
      toast({ description: t("presentationV2.toast.generateSubmitted") })
    } finally {
      setStorycardAction(null)
    }
  }, [articleId, language, syncStorycard, t, toast])

  const saveStorycard = useCallback(async (): Promise<StorycardResponse | null> => {
    if (!storycard || !draft) return null
    const nextIssues = validateStorycardDocument(draft)
    if (nextIssues.length > 0) {
      setErrorKey("presentationV2.errors.validation")
      return null
    }

    setStorycardAction("saving")
    setErrorKey(null)
    try {
      const result = await presentationsV2Client.updateStorycard(storycard.id, {
        version: storycard.version,
        storycard: draft,
      })
      if (hasApiError(result)) {
        if (result.status === 409) {
          console.warn("[PresentationV2] Storycard version conflict", {
            storycardId: storycard.id,
            version: storycard.version,
          })
          setErrorKey("presentationV2.errors.versionConflict")
          toast({ variant: "destructive", description: t("presentationV2.toast.versionConflict") })
          await reloadLatestStorycard()
          return null
        }
        console.error("[PresentationV2] Storycard save failed", {
          storycardId: storycard.id,
          status: result.status,
          error: result.error,
        })
        setErrorKey("presentationV2.errors.saveStorycard")
        return null
      }
      syncStorycard(result)
      toast({ description: t("presentationV2.toast.saved") })
      return result
    } finally {
      setStorycardAction(null)
    }
  }, [draft, reloadLatestStorycard, storycard, syncStorycard, t, toast])

  const handleConfirmStorycard = useCallback(async () => {
    if (!storycard || !draft) return
    if (issues.length > 0) {
      setErrorKey("presentationV2.errors.validation")
      return
    }
    if (storycard.status === "confirmed" && !dirty) {
      setStep(1)
      return
    }

    let current = storycard
    if (dirty) {
      const saved = await saveStorycard()
      if (!saved) return
      current = saved
    }

    setStorycardAction("confirming")
    setErrorKey(null)
    try {
      const result = await presentationsV2Client.confirmStorycard(current.id, {
        version: current.version,
      })
      if (hasApiError(result)) {
        if (result.status === 409) {
          setErrorKey("presentationV2.errors.versionConflict")
          toast({ variant: "destructive", description: t("presentationV2.toast.versionConflict") })
          await reloadLatestStorycard()
          return
        }
        console.error("[PresentationV2] Storycard confirmation failed", {
          storycardId: current.id,
          status: result.status,
          error: result.error,
        })
        setErrorKey("presentationV2.errors.confirmStorycard")
        return
      }
      syncStorycard(result)
      setStep(1)
      toast({ description: t("presentationV2.toast.confirmed") })
    } finally {
      setStorycardAction(null)
    }
  }, [dirty, draft, issues.length, reloadLatestStorycard, saveStorycard, storycard, syncStorycard, t, toast])

  const handleCreateGeneration = useCallback(async () => {
    if (!storycard || storycard.status !== "confirmed" || !selectedTemplate) return
    setGenerationSubmitting(true)
    setErrorKey(null)
    try {
      const result = await presentationsV2Client.createGeneration({
        storycard_id: storycard.id,
        storycard_version: storycard.version,
        template_key: selectedTemplate.template_key,
        template_version: selectedTemplate.version,
      })
      if (hasApiError(result)) {
        console.error("[PresentationV2] Generation creation failed", {
          storycardId: storycard.id,
          status: result.status,
          error: result.error,
        })
        setErrorKey("presentationV2.errors.createGeneration")
        return
      }
      setGeneration(result)
      setMaxStageIndex(getNonRegressingStageIndex(-1, result.stage))
      setStep(result.status === "succeeded" ? 3 : 2)
      persistSession(result, selectedTemplate)
      lastNotifiedGenerationRef.current = `${result.id}:${result.status}`
      onPresentationTaskChanged?.({
        generationId: result.id,
        articleId: result.article_id,
        status: result.status,
      })
      toast({ description: t("presentationV2.toast.generationSubmitted") })
    } finally {
      setGenerationSubmitting(false)
    }
  }, [onPresentationTaskChanged, persistSession, selectedTemplate, storycard, t, toast])

  const handleRetry = useCallback(async () => {
    if (!generation) return
    setRetrying(true)
    setErrorKey(null)
    try {
      const result = await presentationsV2Client.retryGeneration(generation.id)
      if (hasApiError(result)) {
        console.error("[PresentationV2] Generation retry failed", {
          generationId: generation.id,
          status: result.status,
          error: result.error,
        })
        setErrorKey("presentationV2.errors.retryGeneration")
        return
      }
      setGeneration(result)
      setMaxStageIndex(getNonRegressingStageIndex(-1, result.stage))
      setStep(2)
      persistSession(result)
      lastNotifiedGenerationRef.current = `${result.id}:${result.status}`
      onPresentationTaskChanged?.({
        generationId: result.id,
        articleId: result.article_id,
        status: result.status,
      })
      toast({ description: t("presentationV2.toast.retrySubmitted") })
    } finally {
      setRetrying(false)
    }
  }, [generation, onPresentationTaskChanged, persistSession, t, toast])

  const handleDownload = useCallback(async () => {
    if (!generation) return
    setDownloading(true)
    try {
      const result = await presentationsV2Client.getGenerationPptx(generation.id)
      if (hasApiError(result) || result.status !== "succeeded" || !result.pptx_url) {
        console.error("[PresentationV2] PPTX download result unavailable", {
          generationId: generation.id,
          result,
        })
        setErrorKey("presentationV2.errors.download")
        return
      }
      console.info("[PresentationV2] Downloading presentation", {
        generationId: result.id,
        slideCount: result.slide_count,
      })
      triggerDownload(result.pptx_url)
    } finally {
      setDownloading(false)
    }
  }, [generation])

  const handleDialogOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && dirty && !window.confirm(t("presentationV2.storycard.closeConfirm"))) return
      onOpenChange(nextOpen)
    },
    [dirty, onOpenChange, t]
  )

  const stepLabels = [
    t("presentationV2.flow.storycard"),
    t("presentationV2.flow.template"),
    t("presentationV2.flow.generating"),
    t("presentationV2.flow.complete"),
  ]
  const highestReachableStep: FlowStep = generation
    ? generation.status === "succeeded"
      ? 3
      : 2
    : storycard?.status === "confirmed"
      ? 1
      : 0

  const footer = (() => {
    if (loading || typeof articleId !== "number") return null
    if (step === 0 && draft && storycard && ["draft", "confirmed"].includes(storycard.status)) {
      return (
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-muted-foreground">
            {dirty ? t("presentationV2.storycard.unsaved") : t("presentationV2.storycard.saved")}
          </span>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => void saveStorycard()} disabled={!dirty || storycardBusy}>
              {storycardAction === "saving" ? <Loader2Icon className="size-4 animate-spin" /> : <SaveIcon className="size-4" />}
              {t("presentationV2.storycard.save")}
            </Button>
            <Button onClick={() => void handleConfirmStorycard()} disabled={storycardBusy || issues.length > 0}>
              {storycardAction === "confirming" ? <Loader2Icon className="size-4 animate-spin" /> : <CheckCircle2Icon className="size-4" />}
              {t("presentationV2.storycard.confirm")}
            </Button>
          </div>
        </div>
      )
    }
    if (step === 1) {
      return (
        <div className="flex w-full items-center justify-between gap-3">
          <Button variant="outline" onClick={() => setStep(0)}>
            {t("presentationV2.back")}
          </Button>
          <Button
            onClick={() => void handleCreateGeneration()}
            disabled={!selectedTemplate || generationSubmitting || generation !== null}
          >
            {generationSubmitting ? <Loader2Icon className="size-4 animate-spin" /> : <SparklesIcon className="size-4" />}
            {t("presentationV2.template.generate")}
          </Button>
        </div>
      )
    }
    return null
  })()

  return (
    <AIFeatureDialogShell
      open={open}
      onOpenChange={handleDialogOpenChange}
      title={t("presentationV2.title")}
      description={t("presentationV2.description")}
      icon={<PresentationIcon className="size-5 text-primary" />}
      size="fullscreen"
      footer={footer}
    >
      <PresentationFlowStepper
        currentStep={step}
        labels={stepLabels}
        highestReachableStep={highestReachableStep}
        onStepChange={(nextStep) => {
          if (nextStep <= highestReachableStep) setStep(nextStep as FlowStep)
        }}
      />

      {errorKey ? (
        <Alert variant="destructive" className="mx-5 mt-4 w-auto shrink-0 sm:mx-8">
          <AlertCircleIcon className="size-4" />
          <AlertDescription>{t(errorKey)}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="grid min-h-0 flex-1 place-items-center">
          <div className="text-center text-sm text-muted-foreground">
            <Loader2Icon className="mx-auto mb-3 size-6 animate-spin text-primary" />
            {t("presentationV2.loading")}
          </div>
        </div>
      ) : typeof articleId !== "number" ? (
        <div className="grid min-h-0 flex-1 place-items-center px-6 text-center">
          <div>
            <AlertCircleIcon className="mx-auto size-9 text-muted-foreground" />
            <p className="mt-3 font-medium">{t("presentationV2.errors.saveArticleFirst")}</p>
          </div>
        </div>
      ) : step === 0 && draft ? (
        <StorycardStep
          document={draft}
          issues={issues}
          disabled={storycardBusy}
          onChange={(nextDraft) => {
            setDraft(nextDraft)
            setDirty(true)
            setErrorKey(null)
          }}
        />
      ) : step === 0 ? (
        <div className="grid min-h-0 flex-1 place-items-center overflow-auto px-6 py-10 text-center">
          <div className="max-w-lg">
            <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
              {storycard?.status === "generating" || storycardAction === "generating" ? (
                <Loader2Icon className="size-8 animate-spin" />
              ) : storycard?.status === "failed" ? (
                <RefreshCwIcon className="size-8" />
              ) : (
                <SparklesIcon className="size-8" />
              )}
            </span>
            <h3 className="mt-5 text-2xl font-semibold tracking-tight">
              {storycard?.status === "generating"
                ? t("presentationV2.storycard.generatingTitle")
                : storycard?.status === "failed"
                  ? t("presentationV2.storycard.failedTitle")
                  : t("presentationV2.storycard.startTitle")}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {storycard?.status === "generating"
                ? t("presentationV2.storycard.generatingDescription")
                : storycard?.status === "failed"
                  ? t("presentationV2.storycard.failedDescription")
                  : t("presentationV2.storycard.startDescription")}
            </p>
            {storycard?.status !== "generating" ? (
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Select value={language} onValueChange={(value) => setLanguage(value as PPTLanguage)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh">{t("presentationV2.languages.zh")}</SelectItem>
                    <SelectItem value="en">{t("presentationV2.languages.en")}</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => void handleGenerateStorycard()} disabled={storycardBusy}>
                  {storycardBusy ? <Loader2Icon className="size-4 animate-spin" /> : <SparklesIcon className="size-4" />}
                  {storycard?.status === "failed"
                    ? t("presentationV2.storycard.retry")
                    : t("presentationV2.storycard.generate")}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : step === 1 ? (
        <TemplateStep
          templates={templates}
          selectedTemplate={selectedTemplate}
          language={language}
          loading={templatesLoading}
          onSelect={(template) => {
            setSelectedTemplate(template)
            persistSession(generation, template)
          }}
        />
      ) : generation ? (
        <GenerationStep
          generation={generation}
          maxStageIndex={maxStageIndex}
          retrying={retrying}
          downloading={downloading}
          onRetry={() => void handleRetry()}
          onDownload={() => void handleDownload()}
        />
      ) : (
        <div className="grid min-h-0 flex-1 place-items-center text-sm text-muted-foreground">
          {t("presentationV2.errors.generationMissing")}
        </div>
      )}
    </AIFeatureDialogShell>
  )
}
