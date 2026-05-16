"use client"

/* eslint-disable @next/next/no-img-element */

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertCircleIcon,
  ImageIcon,
  Layers3Icon,
  Loader2Icon,
  LogInIcon,
  RefreshCwIcon,
  SplitIcon,
  SparklesIcon,
} from "lucide-react"
import { useCallback, useEffect, useState, type ReactNode } from "react"

import { CreatorMode, type CreatorModeClient } from "@/components/image-generator/creator-mode"
import { StyleMode, type StyleModeClient } from "@/components/image-generator/modes/style-mode"
import { Alert, AlertDescription } from "@/components/ui/base/alert"
import { Button } from "@/components/ui/base/button"
import { Input } from "@/components/ui/base/input"
import { Label } from "@/components/ui/base/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/base/select"
import { Textarea } from "@/components/ui/base/textarea"
import { useToast } from "@/hooks/use-toast"
import { imageGenerationClient } from "@/lib/api/image-generation/client"
import type { CreateGenerationTaskRequest } from "@/lib/api/image-generation/types"
import { uploadFileToPresignedUrl } from "@/lib/api/materials/client"
import { toolboxClient } from "@/lib/api/toolbox/client"
import type { ErrorResponse } from "@/lib/api/types"
import { useAuth } from "@/lib/auth/auth-context"
import {
  INFOGRAPHIC_CARD_STYLES,
  INFOGRAPHIC_DECORATION_LEVELS,
  INFOGRAPHIC_SCREEN_ORIENTATIONS,
  parseInfographicImageUrls,
  type InfographicCardStyle,
  type InfographicDecorationLevel,
  type InfographicLanguage,
  type InfographicScreenOrientation,
} from "@/lib/api/infographics/types"
import { buildLocalizedPath } from "@/lib/i18n/route-locale"
import type { Locale } from "@/lib/i18n/shared"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { validateImageFile } from "@/lib/tiptap-image-upload"
import { cn } from "@/lib/utils"
import { TOOL_SLUGS, type ToolSlug } from "@/lib/tools/catalog"

const TOOLBOX_GUEST_MODEL = "nano-banana-2-fast"
const INFOGRAPHIC_POLL_INTERVAL_MS = 8000

const toolIconMap = {
  "create-image": ImageIcon,
  "style-image": SparklesIcon,
  "image-split": SplitIcon,
  infographic: Layers3Icon,
} satisfies Record<ToolSlug, typeof ImageIcon>

type AsyncStatus = "idle" | "pending" | "processing" | "success" | "failed"

interface ToolboxWorkbenchProps {
  selectedToolSlug?: ToolSlug
}

interface ToolboxInfographicTaskState {
  logId: number
  status: AsyncStatus
  imageUrls: string[]
  error?: string
}

function isErrorResponse(result: unknown): result is ErrorResponse {
  return Boolean(result && typeof result === "object" && "error" in result)
}

function getErrorMessage(result: ErrorResponse, fallback: string): string {
  return result.error || result.error_description || fallback
}

function getLoginHref(locale: Locale, toolSlug: ToolSlug): string {
  return `/auth/login?redirect=${encodeURIComponent(buildLocalizedPath(locale, `/tools/${toolSlug}`))}`
}

const toolboxImageClient: CreatorModeClient & StyleModeClient = {
  async createGenerationTask(request: CreateGenerationTaskRequest) {
    const { article_id: _articleId, ...toolboxRequest } = request
    return toolboxClient.createImageGenerationTask(toolboxRequest)
  },
  async getTaskResult(taskId: string, signal?: AbortSignal) {
    return toolboxClient.getImageTaskResult(taskId, signal)
  },
  getModels: imageGenerationClient.getModels,
  copyToMaterials: imageGenerationClient.copyToMaterials,
}

const TOOLBOX_CREATOR_POLLING_CONFIG = {
  initialDelay: 10000,
  minDelay: 2000,
  maxDelay: 30000,
  timeout: 300000,
  maxAttempts: 20,
  storageKey: "joyfulwords-toolbox-create-image-task",
  taskExpiry: 3600000,
}

async function uploadToolboxTempImage(file: File): Promise<string> {
  const validation = validateImageFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const presigned = await toolboxClient.createTempUploadURL({
    filename: file.name,
    content_type: file.type,
  })

  if ("error" in presigned) {
    throw new Error(presigned.error)
  }

  const uploaded = await uploadFileToPresignedUrl(presigned.upload_url, file, file.type)
  if (!uploaded) {
    throw new Error("fileUploadFailed")
  }

  return presigned.file_url
}

export function ToolboxWorkbench({ selectedToolSlug }: ToolboxWorkbenchProps) {
  const router = useRouter()
  const { t, locale } = useTranslation()
  const { user } = useAuth()
  const activeToolSlug = selectedToolSlug ?? "create-image"

  const tools = TOOL_SLUGS.map((slug) => {
    const Icon = toolIconMap[slug]
    return {
      slug,
      Icon,
      title: t(`toolsPage.tools.${slug}.title`),
      description: t(`toolsPage.tools.${slug}.description`),
      auth: t(`toolsPage.tools.${slug}.auth`),
    }
  })

  const activeTool = tools.find((tool) => tool.slug === activeToolSlug) ?? tools[0]
  const ActiveToolIcon = activeTool.Icon

  const handleSelectTool = (slug: ToolSlug) => {
    router.push(buildLocalizedPath(locale, `/tools/${slug}`))
  }

  return (
    <div className="grid min-h-[calc(100svh-8rem)] gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="min-w-0 space-y-3">
        <div className="px-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--jw-muted)]">
            {t("toolsPage.toolbox.toolsLabel")}
          </p>
          <h1 className="jw-heading-text mt-2 text-3xl font-semibold tracking-tight">
            {t("toolsPage.title")}
          </h1>
        </div>

        <div className="grid gap-2">
          {tools.map((tool) => {
            const Icon = tool.Icon
            const selected = tool.slug === activeToolSlug

            return (
              <button
                key={tool.slug}
                type="button"
                onClick={() => handleSelectTool(tool.slug)}
                className={cn(
                  "jw-action-card group flex min-h-24 w-full flex-col items-start justify-between rounded-lg p-3 text-left transition-all duration-150",
                  selected
                    ? "border-[var(--jw-action-hover-border)] bg-[var(--jw-control-active-bg)]"
                    : "hover:-translate-y-0.5 hover:border-[var(--jw-action-hover-border)]"
                )}
              >
                <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--jw-accent-soft)] text-[var(--jw-accent)] ring-1 ring-[var(--jw-action-hover-border)] shadow-sm transition-transform duration-150 group-hover:-rotate-3 group-hover:scale-105">
                  <Icon className="h-5 w-5 stroke-[1.8]" />
                  {selected ? (
                    <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--jw-control-active-bg)] text-[var(--jw-accent)] shadow-sm">
                      <SparklesIcon className="h-2.5 w-2.5" />
                    </span>
                  ) : null}
                </span>
                <span className="mt-3 text-sm font-semibold leading-tight text-foreground/90">
                  {tool.title}
                </span>
                <span className="mt-1 line-clamp-2 text-xs leading-4 text-muted-foreground">
                  {tool.description}
                </span>
              </button>
            )
          })}
        </div>
      </aside>

      <section className="min-w-0 overflow-hidden rounded-lg border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] shadow-[var(--jw-card-shadow)]">
        <div className="border-b border-[var(--jw-border-subtle)] px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <ActiveToolIcon className="h-5 w-5 text-[var(--jw-accent)]" />
                <h2 className="truncate text-lg font-semibold text-foreground">{activeTool.title}</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{activeTool.auth}</p>
            </div>
            {!user ? (
              <Button asChild size="sm" className="jw-primary-button rounded-full">
                <Link href={getLoginHref(locale, activeToolSlug)}>
                  <LogInIcon className="h-4 w-4" />
                  {t("toolsPage.guest.loginAction")}
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        <div className={activeToolSlug === "create-image" || activeToolSlug === "style-image" ? "p-0" : "p-5"}>
          {activeToolSlug === "create-image" ? (
            <ToolboxFeatureFrame>
              <CreatorMode
                articleId={0}
                client={toolboxImageClient}
                lockedModel={!user ? TOOLBOX_GUEST_MODEL : undefined}
                pollingConfig={TOOLBOX_CREATOR_POLLING_CONFIG}
                enableSaveToMaterials={Boolean(user)}
                allowReferenceMaterialSelector={false}
                uploadReferenceImage={uploadToolboxTempImage}
              />
            </ToolboxFeatureFrame>
          ) : null}
          {activeToolSlug === "style-image" ? (
            <ToolboxFeatureFrame>
              <StyleMode
                articleId={0}
                client={toolboxImageClient}
                lockedModel={!user ? TOOLBOX_GUEST_MODEL : undefined}
                uploadImage={uploadToolboxTempImage}
                allowMaterialSelector={false}
                enableSaveToMaterials={Boolean(user)}
              />
            </ToolboxFeatureFrame>
          ) : null}
          {activeToolSlug === "image-split" ? <ImageSplitTool /> : null}
          {activeToolSlug === "infographic" ? <InfographicTool /> : null}
        </div>
      </section>

    </div>
  )
}

function ToolboxFeatureFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[min(94vh,1100px)] min-h-[720px] flex-col overflow-hidden">
      {children}
    </div>
  )
}

function ImageSplitTool() {
  const { t, locale } = useTranslation()
  const { user } = useAuth()
  const { toast } = useToast()
  const [imageUrl, setImageUrl] = useState("")
  const [prompt, setPrompt] = useState("")
  const [numLayers, setNumLayers] = useState("4")
  const [submitting, setSubmitting] = useState(false)
  const [submittedTaskId, setSubmittedTaskId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!user) {
      setError(t("toolsPage.guest.loginRequiredDescription"))
      return
    }

    const trimmedImageUrl = imageUrl.trim()
    if (!trimmedImageUrl) {
      setError(t("toolsPage.imageSplit.imageRequired"))
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const result = await toolboxClient.createImageSplitTask({
        image_url: trimmedImageUrl,
        prompt: prompt.trim() || undefined,
        num_layers: Number(numLayers) || 4,
      })

      if (isErrorResponse(result)) {
        const message = getErrorMessage(result, t("toolsPage.errors.submitFailed"))
        setError(message)
        toast({
          variant: "destructive",
          title: t("toolsPage.errors.submitFailed"),
          description: message,
        })
        return
      }

      console.info("[Toolbox] Image split task submitted", {
        taskId: result.task_id,
        numLayers: result.num_layers,
      })

      setSubmittedTaskId(String(result.task_id))
      toast({
        title: t("toolsPage.imageSplit.submitted"),
        description: t("toolsPage.tasks.subtitle"),
      })
    } catch (caughtError) {
      console.error("[Toolbox] Unexpected image split error", { error: caughtError })
      setError(t("toolsPage.errors.submitFailed"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        {!user ? <LoginRequiredNotice toolSlug="image-split" /> : null}

        <div className="space-y-2">
          <Label htmlFor="toolbox-split-image">{t("toolsPage.imageSplit.imageUrl")}</Label>
          <Input
            id="toolbox-split-image"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder={t("toolsPage.imageSplit.imagePlaceholder")}
            disabled={!user}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
          <div className="space-y-2">
            <Label htmlFor="toolbox-split-layers">{t("toolsPage.imageSplit.numLayers")}</Label>
            <Input
              id="toolbox-split-layers"
              type="number"
              min={2}
              max={8}
              value={numLayers}
              onChange={(event) => setNumLayers(event.target.value)}
              disabled={!user}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="toolbox-split-prompt">{t("toolsPage.imageSplit.prompt")}</Label>
            <Input
              id="toolbox-split-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={t("toolsPage.imageSplit.promptPlaceholder")}
              disabled={!user}
            />
          </div>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="button"
          className="jw-primary-button w-full rounded-full"
          onClick={handleSubmit}
          disabled={!user || submitting}
        >
          {submitting ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <SplitIcon className="h-4 w-4" />}
          {t("toolsPage.imageSplit.submit")}
        </Button>
      </div>

      <div className="rounded-lg border border-[var(--jw-border-subtle)] bg-background p-4">
        <h3 className="text-sm font-semibold text-foreground">{t("toolsPage.imageSplit.result")}</h3>
        <div className="mt-4 flex min-h-[260px] items-center justify-center rounded-lg border border-dashed border-[var(--jw-border-subtle)] p-5 text-center">
          <div className="space-y-2">
            <RefreshCwIcon className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {submittedTaskId
                ? t("toolsPage.imageSplit.taskSubmitted", { id: submittedTaskId })
                : t("toolsPage.imageSplit.emptyResult")}
            </p>
            {!user ? (
              <Button asChild size="sm" className="jw-primary-button rounded-full">
                <Link href={getLoginHref(locale, "image-split")}>{t("toolsPage.guest.loginAction")}</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfographicTool() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { toast } = useToast()
  const [text, setText] = useState("")
  const [custom, setCustom] = useState("")
  const [cardStyle, setCardStyle] = useState<InfographicCardStyle>("professional")
  const [screenOrientation, setScreenOrientation] = useState<InfographicScreenOrientation>("portrait")
  const [language, setLanguage] = useState<InfographicLanguage>("zh")
  const [decorationLevel, setDecorationLevel] = useState<InfographicDecorationLevel>("moderate")
  const [submitting, setSubmitting] = useState(false)
  const [task, setTask] = useState<ToolboxInfographicTaskState | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isRunning = task?.status === "pending" || task?.status === "processing"

  const pollTask = useCallback(async (logId: number, signal?: AbortSignal) => {
    const result = await toolboxClient.getInfographicLogDetail(logId)
    if (signal?.aborted) return

    if (isErrorResponse(result)) {
      const message = getErrorMessage(result, t("toolsPage.errors.pollFailed"))
      setTask((current) => (current?.logId === logId ? { ...current, status: "failed", error: message } : current))
      setError(message)
      return
    }

    if (result.status === "success") {
      setTask({
        logId,
        status: "success",
        imageUrls: parseInfographicImageUrls(result.image_urls),
      })
      return
    }

    if (result.status === "failed") {
      setTask({
        logId,
        status: "failed",
        imageUrls: [],
        error: result.error_message || t("toolsPage.errors.taskFailed"),
      })
      return
    }

    setTask((current) => (current?.logId === logId ? { ...current, status: result.status, error: undefined } : current))
  }, [t])

  useEffect(() => {
    if (!task || (task.status !== "pending" && task.status !== "processing")) return

    const controller = new AbortController()
    void pollTask(task.logId, controller.signal)
    const intervalId = window.setInterval(() => {
      void pollTask(task.logId)
    }, INFOGRAPHIC_POLL_INTERVAL_MS)

    return () => {
      controller.abort()
      window.clearInterval(intervalId)
    }
  }, [pollTask, task])

  const handleSubmit = async () => {
    if (!user) {
      setError(t("toolsPage.guest.loginRequiredDescription"))
      return
    }

    const trimmedText = text.trim()
    if (!trimmedText) {
      setError(t("toolsPage.infographic.textRequired"))
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const result = await toolboxClient.generateInfographic({
        text: trimmedText,
        card_style: cardStyle,
        screen_orientation: screenOrientation,
        language,
        decoration_level: decorationLevel,
        user_custom: custom.trim() || undefined,
      })

      if (isErrorResponse(result)) {
        const message = getErrorMessage(result, t("toolsPage.errors.submitFailed"))
        setError(message)
        toast({
          variant: "destructive",
          title: t("toolsPage.errors.submitFailed"),
          description: message,
        })
        return
      }

      console.info("[Toolbox] Infographic task submitted", {
        logId: result.log_id,
        status: result.status,
      })

      setTask({ logId: result.log_id, status: result.status, imageUrls: [] })
      toast({
        title: t("toolsPage.infographic.submitted"),
        description: t("toolsPage.tasks.subtitle"),
      })
    } catch (caughtError) {
      console.error("[Toolbox] Unexpected infographic error", { error: caughtError })
      setError(t("toolsPage.errors.submitFailed"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        {!user ? <LoginRequiredNotice toolSlug="infographic" /> : null}

        <div className="space-y-2">
          <Label htmlFor="toolbox-infographic-text">{t("toolsPage.infographic.text")}</Label>
          <Textarea
            id="toolbox-infographic-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t("toolsPage.infographic.textPlaceholder")}
            className="min-h-40 resize-none"
            disabled={!user}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Select value={cardStyle} onValueChange={(value) => setCardStyle(value as InfographicCardStyle)} disabled={!user}>
            <SelectTrigger>
              <SelectValue placeholder={t("infographicDialog.styleLabel")} />
            </SelectTrigger>
            <SelectContent>
              {INFOGRAPHIC_CARD_STYLES.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`infographicDialog.styles.${value}.title`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={screenOrientation} onValueChange={(value) => setScreenOrientation(value as InfographicScreenOrientation)} disabled={!user}>
            <SelectTrigger>
              <SelectValue placeholder={t("infographicDialog.orientationLabel")} />
            </SelectTrigger>
            <SelectContent>
              {INFOGRAPHIC_SCREEN_ORIENTATIONS.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`infographicDialog.orientations.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={language} onValueChange={(value) => setLanguage(value as InfographicLanguage)} disabled={!user}>
            <SelectTrigger>
              <SelectValue placeholder={t("infographicDialog.languageLabel")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zh">{t("infographicDialog.languages.zh")}</SelectItem>
              <SelectItem value="en">{t("infographicDialog.languages.en")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={decorationLevel} onValueChange={(value) => setDecorationLevel(value as InfographicDecorationLevel)} disabled={!user}>
            <SelectTrigger>
              <SelectValue placeholder={t("infographicDialog.decorationLabel")} />
            </SelectTrigger>
            <SelectContent>
              {INFOGRAPHIC_DECORATION_LEVELS.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`infographicDialog.decorations.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="toolbox-infographic-custom">{t("infographicDialog.customLabel")}</Label>
          <Input
            id="toolbox-infographic-custom"
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            placeholder={t("infographicDialog.customPlaceholder")}
            disabled={!user}
          />
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="button"
          className="jw-primary-button w-full rounded-full"
          onClick={handleSubmit}
          disabled={!user || submitting || isRunning}
        >
          {submitting || isRunning ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <Layers3Icon className="h-4 w-4" />}
          {isRunning ? t("toolsPage.statuses.running") : t("toolsPage.infographic.submit")}
        </Button>
      </div>

      <ToolResultPanel
        title={t("toolsPage.infographic.result")}
        status={task?.status ?? "idle"}
        imageUrls={task?.imageUrls ?? []}
        emptyText={t("toolsPage.infographic.emptyResult")}
        error={task?.error}
      />
    </div>
  )
}

function LoginRequiredNotice({ toolSlug }: { toolSlug: ToolSlug }) {
  const { t, locale } = useTranslation()

  return (
    <Alert>
      <AlertCircleIcon className="h-4 w-4" />
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{t("toolsPage.guest.loginRequiredDescription")}</span>
        <Button asChild size="sm" className="jw-primary-button shrink-0 rounded-full">
          <Link href={getLoginHref(locale, toolSlug)}>
            <LogInIcon className="h-4 w-4" />
            {t("toolsPage.guest.loginAction")}
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}

function ToolResultPanel({
  title,
  status,
  imageUrls,
  emptyText,
  error,
}: {
  title: string
  status: AsyncStatus
  imageUrls: string[]
  emptyText: string
  error?: string
}) {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-[var(--jw-border-subtle)] bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {status !== "idle" ? (
          <span className="rounded-full border border-[var(--jw-border-subtle)] px-2.5 py-1 text-xs text-muted-foreground">
            {t(`toolsPage.statuses.${status}`)}
          </span>
        ) : null}
      </div>

      {error ? (
        <Alert variant="destructive" className="mt-4">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-4 min-h-[260px] rounded-lg border border-dashed border-[var(--jw-border-subtle)] bg-[var(--jw-surface-muted)] p-3">
        {imageUrls.length > 0 ? (
          <div className="grid gap-3">
            {imageUrls.map((url, index) => (
              <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border bg-background">
                <img src={url} alt={`${title} ${index + 1}`} className="aspect-square w-full object-cover" />
              </a>
            ))}
          </div>
        ) : status === "pending" || status === "processing" ? (
          <div className="flex min-h-[240px] items-center justify-center text-center">
            <div className="space-y-2">
              <Loader2Icon className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t("toolsPage.statuses.running")}</p>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[240px] items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">{emptyText}</p>
          </div>
        )}
      </div>
    </div>
  )
}
