"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  AlertCircleIcon,
  ChevronRightIcon,
  Clock3Icon,
  ClipboardPasteIcon,
  Columns2Icon,
  EyeIcon,
  FileCode2Icon,
  FileTextIcon,
  Loader2Icon,
  LogInIcon,
  PencilLineIcon,
  PresentationIcon,
} from "lucide-react"

import { PresentationFlowDialog } from "@/components/presentation/v2/presentation-flow-dialog"
import { Alert, AlertDescription } from "@/components/ui/base/alert"
import { Button } from "@/components/ui/base/button"
import { Input } from "@/components/ui/base/input"
import { ScrollArea } from "@/components/ui/base/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/base/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/base/tabs"
import { Textarea } from "@/components/ui/base/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/base/toggle-group"
import { articlesClient } from "@/lib/api/articles/client"
import type { Article } from "@/lib/api/articles/types"
import { hasMeaningfulArticleContent } from "@/lib/article-content"
import { useAuth } from "@/lib/auth/auth-context"
import { buildLocalizedPath } from "@/lib/i18n/route-locale"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { markdownToHTML } from "@/lib/tiptap-utils"
import {
  findLatestPresentationFlowSession,
  touchPresentationFlowSession,
} from "@/lib/presentations/v2/flow-session"
import { cn } from "@/lib/utils"

function isApiError(value: object): value is { error: string } {
  return "error" in value
}

type PptSourceMode = "paste" | "article"
type MarkdownViewMode = "edit" | "preview" | "split"

function derivePastedArticleTitle(content: string, fallback: string) {
  const firstContentLine = content.split(/\r?\n/).find((line) => line.trim())?.trim() ?? ""
  const normalizedLine = firstContentLine
    .replace(/^#{1,6}\s+/, "")
    .replace(/^>\s+/, "")
    .replace(/^[-*+]\s+/, "")
    .trim()

  return (normalizedLine || fallback).slice(0, 200)
}

function MarkdownPreview({
  markdown,
  emptyTitle,
  emptyDescription,
}: {
  markdown: string
  emptyTitle: string
  emptyDescription: string
}) {
  if (!markdown.trim()) {
    return (
      <div className="flex h-[clamp(36rem,70vh,54rem)] items-center justify-center px-6 text-center">
        <div className="max-w-sm space-y-3">
          <span className="mx-auto flex size-11 items-center justify-center rounded-lg bg-[var(--jw-accent-soft)] text-[var(--jw-accent)]">
            <FileCode2Icon className="size-5" />
          </span>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-[var(--jw-heading)]">{emptyTitle}</h3>
            <p className="text-xs leading-5 text-[var(--jw-muted)]">{emptyDescription}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[clamp(36rem,70vh,54rem)]">
      <article className="min-w-0 break-words px-5 py-4 text-sm leading-7 text-[var(--jw-page-text)] [overflow-wrap:anywhere] [&_a]:font-medium [&_a]:text-[var(--jw-accent)] [&_a]:underline [&_a]:decoration-[color-mix(in_srgb,var(--jw-accent)_35%,transparent)] [&_a]:underline-offset-4 [&_blockquote]:my-4 [&_blockquote]:border-l-[3px] [&_blockquote]:border-[var(--jw-accent)] [&_blockquote]:pl-4 [&_blockquote]:text-[var(--jw-muted)] [&_code]:rounded-md [&_code]:bg-[var(--jw-accent-soft)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_del]:text-[var(--jw-muted)] [&_h1]:mb-4 [&_h1]:mt-1 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-[var(--jw-heading)] [&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[var(--jw-heading)] [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[var(--jw-heading)] [&_hr]:my-6 [&_hr]:border-[var(--jw-border)] [&_img]:my-5 [&_img]:max-w-full [&_img]:rounded-lg [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_pre]:my-5 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-[var(--jw-border-subtle)] [&_pre]:bg-[var(--jw-surface-muted)] [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-semibold [&_strong]:text-[var(--jw-heading)] [&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_td]:border [&_td]:border-[var(--jw-border)] [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-[var(--jw-border)] [&_th]:bg-[var(--jw-surface-muted)] [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_th]:text-[var(--jw-heading)] [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a({ href, children }) {
              return (
                <a href={href} target="_blank" rel="noreferrer">
                  {children}
                </a>
              )
            },
          }}
        >
          {markdown}
        </ReactMarkdown>
      </article>
    </ScrollArea>
  )
}

export function ToolboxPptGenerator() {
  const { user, loading: isAuthLoading } = useAuth()
  const { t, locale } = useTranslation()
  const [articles, setArticles] = useState<Article[]>([])
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null)
  const [isLoadingArticles, setIsLoadingArticles] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [sourceMode, setSourceMode] = useState<PptSourceMode>("paste")
  const [markdownViewMode, setMarkdownViewMode] = useState<MarkdownViewMode>("split")
  const [pastedTitle, setPastedTitle] = useState("")
  const [pastedContent, setPastedContent] = useState("")
  const [preparedPastedArticleId, setPreparedPastedArticleId] = useState<number | null>(null)
  const [isPreparingPastedArticle, setIsPreparingPastedArticle] = useState(false)
  const [prepareError, setPrepareError] = useState("")
  const [isPresentationOpen, setIsPresentationOpen] = useState(false)
  const [activePresentationArticleId, setActivePresentationArticleId] = useState<number | null>(null)

  const eligibleArticles = useMemo(
    () => articles.filter((article) =>
      article.status !== "archived" && hasMeaningfulArticleContent({ html: article.content })
    ),
    [articles]
  )

  const loadArticles = useCallback(async () => {
    if (!user) return

    setIsLoadingArticles(true)
    setLoadError("")
    try {
      const result = await articlesClient.getArticles({ page: 1, page_size: 100 })
      if (isApiError(result)) {
        console.error("[ToolboxPptGenerator] Failed to load articles", result.error)
        setLoadError(t("toolsPage.pptGenerator.loadError"))
        return
      }
      setArticles(result.list)
    } catch (error) {
      console.error("[ToolboxPptGenerator] Failed to load articles", error)
      setLoadError(t("toolsPage.pptGenerator.loadError"))
    } finally {
      setIsLoadingArticles(false)
    }
  }, [t, user])

  useEffect(() => {
    if (!isAuthLoading && user) void loadArticles()
  }, [isAuthLoading, loadArticles, user])

  useEffect(() => {
    if (typeof user?.id !== "number") {
      setActivePresentationArticleId(null)
      return
    }

    const session = findLatestPresentationFlowSession(user.id)
    setActivePresentationArticleId(session?.articleId ?? null)
  }, [user?.id])

  useEffect(() => {
    if (sourceMode !== "article") return

    if (eligibleArticles.length === 0) {
      setSelectedArticleId(null)
      return
    }
    if (!eligibleArticles.some((article) => article.id === selectedArticleId)) {
      setSelectedArticleId(eligibleArticles[0].id)
    }
  }, [eligibleArticles, selectedArticleId, sourceMode])

  const loginHref = `/auth/login?redirect=${encodeURIComponent(
    buildLocalizedPath(locale, "/tools/ppt-generator")
  )}`

  const handleStartFromPaste = async () => {
    const content = pastedContent.trim()
    if (!content) {
      setPrepareError(t("toolsPage.pptGenerator.pasteContentRequired"))
      return
    }

    const title = pastedTitle.trim() || derivePastedArticleTitle(
      content,
      t("toolsPage.pptGenerator.untitledArticle")
    )

    setIsPreparingPastedArticle(true)
    setPrepareError("")
    try {
      const articleContent = await markdownToHTML(content)
      if (!articleContent.trim()) {
        setPrepareError(t("toolsPage.pptGenerator.prepareError"))
        return
      }

      const result = await articlesClient.createArticle({
        title: title.slice(0, 200),
        content: articleContent,
      })
      if (isApiError(result)) {
        console.error("[ToolboxPptGenerator] Failed to save pasted content", result.error)
        setPrepareError(t("toolsPage.pptGenerator.prepareError"))
        return
      }

      setSelectedArticleId(result.id)
      setPreparedPastedArticleId(result.id)
      setActivePresentationArticleId(result.id)
      if (typeof user?.id === "number") {
        touchPresentationFlowSession(user.id, result.id)
      }
      setIsPresentationOpen(true)
    } catch (error) {
      console.error("[ToolboxPptGenerator] Failed to save pasted content", error)
      setPrepareError(t("toolsPage.pptGenerator.prepareError"))
    } finally {
      setIsPreparingPastedArticle(false)
    }
  }

  const handleStart = () => {
    if (sourceMode === "paste") {
      if (preparedPastedArticleId !== null) {
        setSelectedArticleId(preparedPastedArticleId)
        setActivePresentationArticleId(preparedPastedArticleId)
        setIsPresentationOpen(true)
        return
      }

      void handleStartFromPaste()
      return
    }

    if (selectedArticleId !== null) {
      setActivePresentationArticleId(selectedArticleId)
      if (typeof user?.id === "number") {
        touchPresentationFlowSession(user.id, selectedArticleId)
      }
      setIsPresentationOpen(true)
    }
  }

  const isStartDisabled = sourceMode === "paste"
    ? isPreparingPastedArticle || (preparedPastedArticleId === null && !pastedContent.trim())
    : !selectedArticleId
  const isResumingPastedFlow = sourceMode === "paste" && preparedPastedArticleId !== null
  const isResumingSelectedArticleFlow = sourceMode === "article"
    && selectedArticleId !== null
    && selectedArticleId === activePresentationArticleId

  const handleOpenPresentationProgress = () => {
    if (activePresentationArticleId === null) return
    setSelectedArticleId(activePresentationArticleId)
    setIsPresentationOpen(true)
  }

  if (isAuthLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] p-6 shadow-[var(--jw-card-shadow)] sm:p-8">
        <div className="animate-pulse space-y-7 motion-reduce:animate-none" aria-live="polite">
          <span className="sr-only">{t("toolsPage.pptGenerator.authLoading")}</span>
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-lg bg-[var(--jw-accent-soft)]" />
            <div className="space-y-2">
              <div className="h-5 w-40 rounded bg-[var(--jw-accent-soft)]" />
              <div className="h-3 w-72 max-w-full rounded bg-[var(--jw-surface-muted)]" />
            </div>
          </div>
          <div className="h-11 w-full rounded-lg bg-[var(--jw-surface-muted)]" />
          <div className="h-80 w-full rounded-xl bg-[var(--jw-surface-muted)]" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-[440px] items-center justify-center overflow-hidden rounded-xl border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] p-6 shadow-[var(--jw-card-shadow)]">
        <section className="flex max-w-xl flex-col items-start gap-5 rounded-xl border border-[var(--jw-border-subtle)] bg-[var(--jw-surface)] p-6 sm:p-8">
          <span className="inline-flex size-12 items-center justify-center rounded-lg bg-[var(--jw-accent-soft)] text-[var(--jw-accent)]">
            <PresentationIcon className="size-5" />
          </span>
          <div className="space-y-2">
            <h1 className="jw-heading-text text-xl font-semibold">
              {t("toolsPage.pptGenerator.loginTitle")}
            </h1>
            <p className="text-sm leading-6 text-[var(--jw-muted)]">
              {t("toolsPage.pptGenerator.loginDescription")}
            </p>
          </div>
          <Button asChild size="lg" className="jw-primary-button rounded-lg active:translate-y-px">
            <Link href={loginHref}>
              <LogInIcon className="size-4" />
              {t("toolsPage.pptGenerator.loginAction")}
            </Link>
          </Button>
        </section>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] shadow-[var(--jw-card-shadow)]">
      <header className="flex flex-col gap-5 px-5 py-5 sm:px-7 sm:py-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg bg-[var(--jw-accent-soft)] text-[var(--jw-accent)]">
            <PresentationIcon className="size-5" />
          </span>
          <div className="min-w-0 space-y-1.5">
            <h1 className="jw-heading-text text-2xl font-bold tracking-tight">
              {t("toolsPage.pptGenerator.title")}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[var(--jw-muted)]">
              {t("toolsPage.pptGenerator.description")}
            </p>
          </div>
        </div>

        <div
          className="hidden shrink-0 items-center gap-2 rounded-lg border border-[var(--jw-border-subtle)] bg-[var(--jw-surface-muted)] px-4 py-3 text-xs font-medium text-[var(--jw-muted)] xl:flex"
          aria-label={t("toolsPage.pptGenerator.workflowLabel")}
        >
          <span className="text-[var(--jw-heading)]">{t("toolsPage.pptGenerator.workflowInput")}</span>
          <ChevronRightIcon className="size-3.5" />
          <span>{t("toolsPage.pptGenerator.workflowReview")}</span>
          <ChevronRightIcon className="size-3.5" />
          <span>{t("toolsPage.pptGenerator.workflowExport")}</span>
        </div>
      </header>

      {prepareError ? (
        <div className="border-t border-[var(--jw-border-subtle)] px-5 pt-5 sm:px-7">
          <Alert variant="destructive">
            <AlertCircleIcon className="size-4" />
            <AlertDescription>{prepareError}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      <Tabs
        value={sourceMode}
        onValueChange={(value) => {
          setSourceMode(value as PptSourceMode)
          setPrepareError("")
        }}
        className="gap-0"
      >
        <div className="flex flex-col gap-4 border-y border-[var(--jw-border-subtle)] bg-[var(--jw-surface-muted)] px-5 py-4 sm:px-7 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--jw-heading)]">
              {t("toolsPage.pptGenerator.sourceLabel")}
            </p>
            <p className="text-xs leading-5 text-[var(--jw-muted)]">
              {t("toolsPage.pptGenerator.sourceDescription")}
            </p>
          </div>
          <TabsList
            className="grid h-11 w-full grid-cols-2 rounded-lg border border-[var(--jw-border-subtle)] bg-[var(--jw-surface)] p-1 md:w-[420px]"
            aria-label={t("toolsPage.pptGenerator.sourceLabel")}
          >
            <TabsTrigger value="paste" className="rounded-md">
              <ClipboardPasteIcon />
              {t("toolsPage.pptGenerator.sourcePaste")}
            </TabsTrigger>
            <TabsTrigger value="article" className="rounded-md">
              <FileTextIcon />
              {t("toolsPage.pptGenerator.sourceArticle")}
            </TabsTrigger>
          </TabsList>
        </div>

        {activePresentationArticleId !== null ? (
          <div className="flex flex-col gap-3 border-b border-[var(--jw-border-subtle)] bg-[var(--jw-accent-soft)]/45 px-5 py-3 sm:px-7 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--jw-surface)] text-[var(--jw-accent)] shadow-sm">
                <Clock3Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--jw-heading)]">
                  {t("toolsPage.pptGenerator.progressTitle")}
                </p>
                <p className="text-xs leading-5 text-[var(--jw-muted)]">
                  {t("toolsPage.pptGenerator.progressDescription")}
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              className="jw-primary-button w-full shrink-0 rounded-lg px-4 active:translate-y-px md:w-auto"
              onClick={handleOpenPresentationProgress}
            >
              <Clock3Icon className="size-3.5" />
              {t("toolsPage.pptGenerator.viewProgress")}
            </Button>
          </div>
        ) : null}

        <TabsContent value="paste" className="m-0 space-y-5 px-4 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full max-w-2xl space-y-2">
              <label className="text-sm font-semibold text-[var(--jw-heading)]" htmlFor="toolbox-ppt-title">
                {t("toolsPage.pptGenerator.pasteTitleLabel")}
              </label>
              <Input
                id="toolbox-ppt-title"
                value={pastedTitle}
                maxLength={200}
                className="h-11 rounded-lg border-[var(--jw-border)] bg-[var(--jw-surface)] px-4 text-[var(--jw-heading)] placeholder:text-[var(--jw-muted)]"
                placeholder={t("toolsPage.pptGenerator.pasteTitlePlaceholder")}
                onChange={(event) => setPastedTitle(event.target.value)}
              />
            </div>

            <Button
              type="button"
              size="lg"
              className="jw-primary-button w-full shrink-0 rounded-lg px-6 active:translate-y-px lg:w-auto"
              disabled={isStartDisabled}
              onClick={handleStart}
            >
              {isPreparingPastedArticle ? (
                <Loader2Icon className="size-4 animate-spin motion-reduce:animate-none" />
              ) : (
                <PresentationIcon className="size-4" />
              )}
              {isPreparingPastedArticle
                ? t("toolsPage.pptGenerator.preparing")
                : isResumingPastedFlow
                  ? t("toolsPage.pptGenerator.viewProgress")
                  : t("toolsPage.pptGenerator.start")}
            </Button>
          </div>

          <section className="overflow-hidden rounded-xl border border-[var(--jw-border)] bg-[var(--jw-surface)] shadow-[var(--jw-soft-shadow)]">
            <div className="flex flex-col gap-3 border-b border-[var(--jw-border-subtle)] bg-[var(--jw-surface-muted)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <FileCode2Icon className="size-4 shrink-0 text-[var(--jw-accent)]" />
                <span className="text-sm font-semibold text-[var(--jw-heading)]">
                  {t("toolsPage.pptGenerator.workspaceLabel")}
                </span>
                <span className="text-xs text-[var(--jw-muted)]">
                  {t("toolsPage.pptGenerator.charCount", { count: pastedContent.length })}
                </span>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <ToggleGroup
                  type="single"
                  value={markdownViewMode}
                  onValueChange={(value) => {
                    if (value) setMarkdownViewMode(value as MarkdownViewMode)
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full rounded-lg border-[var(--jw-border)] bg-[var(--jw-surface)] sm:w-auto"
                  aria-label={t("toolsPage.pptGenerator.viewLabel")}
                >
                  <ToggleGroupItem value="edit" className="gap-1.5 px-3">
                    <PencilLineIcon className="size-3.5" />
                    {t("toolsPage.pptGenerator.viewEdit")}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="preview" className="gap-1.5 px-3">
                    <EyeIcon className="size-3.5" />
                    {t("toolsPage.pptGenerator.viewPreview")}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="split" className="gap-1.5 px-3">
                    <Columns2Icon className="size-3.5" />
                    {t("toolsPage.pptGenerator.viewSplit")}
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            <div
              className={cn(
                "grid min-w-0",
                markdownViewMode === "split" && "lg:grid-cols-2"
              )}
            >
              {markdownViewMode !== "preview" ? (
                <div className={cn(
                  "min-w-0",
                  markdownViewMode === "split" && "border-b border-[var(--jw-border-subtle)] lg:border-r lg:border-b-0"
                )}>
                  <div className="border-b border-[var(--jw-border-subtle)] px-4 py-2 text-xs font-medium text-[var(--jw-muted)]">
                    {t("toolsPage.pptGenerator.editorPane")}
                  </div>
                  <Textarea
                    id="toolbox-ppt-content"
                    value={pastedContent}
                    className="h-[clamp(36rem,70vh,54rem)] min-h-0 resize-none rounded-none border-0 bg-transparent px-5 py-4 font-mono text-sm leading-7 text-[var(--jw-page-text)] shadow-none placeholder:font-sans placeholder:text-[var(--jw-muted)] focus-visible:ring-0"
                    placeholder={t("toolsPage.pptGenerator.pasteContentPlaceholder")}
                    aria-label={t("toolsPage.pptGenerator.pasteContentLabel")}
                    aria-invalid={Boolean(prepareError && !pastedContent.trim())}
                    spellCheck="true"
                    onChange={(event) => {
                      setPastedContent(event.target.value)
                      if (event.target.value.trim()) setPrepareError("")
                    }}
                  />
                </div>
              ) : null}

              {markdownViewMode !== "edit" ? (
                <div className="min-w-0">
                  <div className="border-b border-[var(--jw-border-subtle)] px-4 py-2 text-xs font-medium text-[var(--jw-muted)]">
                    {t("toolsPage.pptGenerator.previewPane")}
                  </div>
                  <MarkdownPreview
                    markdown={pastedContent}
                    emptyTitle={t("toolsPage.pptGenerator.previewEmptyTitle")}
                    emptyDescription={t("toolsPage.pptGenerator.previewEmptyDescription")}
                  />
                </div>
              ) : null}
            </div>
          </section>

          <div className="border-t border-[var(--jw-border-subtle)] pt-5">
            <div className="max-w-2xl space-y-1 text-xs leading-5 text-[var(--jw-muted)]">
              <p>{t("toolsPage.pptGenerator.markdownHint")}</p>
              <p>{t("toolsPage.pptGenerator.pasteHint")}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="article" className="m-0 px-4 py-6 sm:px-7 sm:py-8">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold text-[var(--jw-heading)]">
                {t("toolsPage.pptGenerator.articleModeTitle")}
              </h2>
              <p className="text-sm leading-6 text-[var(--jw-muted)]">
                {t("toolsPage.pptGenerator.articleModeDescription")}
              </p>
            </div>

            {loadError ? (
              <Alert variant="destructive">
                <AlertCircleIcon className="size-4" />
                <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                  <span>{loadError}</span>
                  <Button type="button" variant="outline" size="sm" onClick={() => void loadArticles()}>
                    {t("toolsPage.pptGenerator.retry")}
                  </Button>
                </AlertDescription>
              </Alert>
            ) : null}

            {isLoadingArticles ? (
              <div className="animate-pulse space-y-3 motion-reduce:animate-none" aria-live="polite">
                <div className="h-4 w-28 rounded bg-[var(--jw-accent-soft)]" />
                <div className="h-11 w-full rounded-lg bg-[var(--jw-surface-muted)]" />
                <span className="sr-only">{t("toolsPage.pptGenerator.loadingArticles")}</span>
              </div>
            ) : eligibleArticles.length === 0 && !loadError ? (
              <section className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-[var(--jw-border)] bg-[var(--jw-surface)] p-6">
                <FileTextIcon className="size-6 text-[var(--jw-muted)]" />
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-[var(--jw-heading)]">
                    {t("toolsPage.pptGenerator.emptyTitle")}
                  </h3>
                  <p className="text-sm leading-6 text-[var(--jw-muted)]">
                    {t("toolsPage.pptGenerator.emptyDescription")}
                  </p>
                </div>
                <Button asChild variant="outline" className="rounded-lg">
                  <Link href="/articles">{t("toolsPage.pptGenerator.createArticle")}</Link>
                </Button>
              </section>
            ) : !isLoadingArticles ? (
              <>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <label className="text-sm font-semibold text-[var(--jw-heading)]" htmlFor="toolbox-ppt-article">
                      {t("toolsPage.pptGenerator.articleLabel")}
                    </label>
                    <Select
                      value={selectedArticleId ? String(selectedArticleId) : ""}
                      onValueChange={(value) => setSelectedArticleId(Number(value))}
                    >
                      <SelectTrigger id="toolbox-ppt-article" className="h-11 w-full rounded-lg bg-[var(--jw-surface)]">
                        <SelectValue placeholder={t("toolsPage.pptGenerator.articlePlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleArticles.map((article) => (
                          <SelectItem key={article.id} value={String(article.id)}>
                            {article.title || t("toolsPage.pptGenerator.untitledArticle")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs leading-5 text-[var(--jw-muted)]">
                      {t("toolsPage.pptGenerator.articleHint")}
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="lg"
                    className="jw-primary-button w-full shrink-0 rounded-lg px-6 active:translate-y-px sm:w-auto sm:self-center"
                    disabled={isStartDisabled}
                    onClick={handleStart}
                  >
                    <PresentationIcon className="size-4" />
                    {isResumingSelectedArticleFlow
                      ? t("toolsPage.pptGenerator.viewProgress")
                      : t("toolsPage.pptGenerator.start")}
                  </Button>
                </div>

              </>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>

      <PresentationFlowDialog
        open={isPresentationOpen}
        onOpenChange={setIsPresentationOpen}
        articleId={selectedArticleId}
        onPresentationTaskChanged={(event) => {
          setActivePresentationArticleId(event.articleId)
        }}
      />
    </div>
  )
}
