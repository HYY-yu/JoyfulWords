"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckIcon, ClipboardIcon, CopyIcon, LoaderIcon, NewspaperIcon, WandSparklesIcon } from "lucide-react"
import { AIFeatureDialogShell } from "@/components/ui/ai/ai-feature-dialog-shell"
import { Button } from "@/components/ui/base/button"
import { Input } from "@/components/ui/base/input"
import { Label } from "@/components/ui/base/label"
import { articlesClient } from "@/lib/api/articles/client"
import type { GenerateWeChatHookSummaryResponse, WeChatHookOption } from "@/lib/api/articles/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/base/select"
import { Switch } from "@/components/ui/base/switch"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/i18n-context"
import {
  DEFAULT_WECHAT_MARKDOWN_EXPORT_OPTIONS,
  copyWeChatHtml,
  renderWeChatMarkdown,
  type WeChatImageCaptionMode,
  type WeChatMarkdownExportOptions,
} from "@/lib/wechat-markdown-export"
import { fetchArticleDesign, type ArticleDesignSnapshot } from "@/lib/design/article-design"
import { DESIGN_CHANGED } from "./illustration/design-style-picker"

interface WeChatMPExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  markdown: string
  articleId?: number | null
  articleTitle?: string
}

export function WeChatMPExportDialog({
  open,
  onOpenChange,
  markdown,
  articleId,
  articleTitle,
}: WeChatMPExportDialogProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [options, setOptions] = useState<WeChatMarkdownExportOptions>(
    DEFAULT_WECHAT_MARKDOWN_EXPORT_OPTIONS
  )
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [hookResult, setHookResult] = useState<GenerateWeChatHookSummaryResponse | null>(null)
  const [hookLoading, setHookLoading] = useState(false)
  const [hookError, setHookError] = useState<string | null>(null)

  const [designState, setDesignState] = useState<{ articleId: number | null | undefined; design: ArticleDesignSnapshot | null; status: "loading" | "ready" | "error" }>({ articleId, design: null, status: "loading" })
  const [designRevision, setDesignRevision] = useState(0)
  const designReady = designState.status === "ready" && designState.articleId === articleId
  useEffect(() => {
    const refresh = () => {
      setDesignState((current) => ({ ...current, status: "loading" }))
      setDesignRevision((value) => value + 1)
    }
    window.addEventListener(DESIGN_CHANGED, refresh)
    return () => window.removeEventListener(DESIGN_CHANGED, refresh)
  }, [])
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setDesignState({ articleId, design: null, status: "loading" })
    setCopied(false)
    fetchArticleDesign(articleId ?? undefined).then((design) => {
      if (cancelled) return
      setDesignState({ articleId, design, status: "ready" })
      console.debug("[WeChatMPExportDialog] Applied inherited design", { articleId, style: design?.style.slug ?? "minimal-business", paletteId: design?.palette.id })
    }).catch((error) => {
      if (cancelled) return
      console.error("[WeChatMPExportDialog] Failed to load inherited design", { articleId, error })
      setDesignState({ articleId, design: null, status: "error" })
    })
    return () => { cancelled = true }
  }, [open, articleId, designRevision])

  const exportResult = useMemo(
    () => renderWeChatMarkdown(markdown, options, designState.design),
    [markdown, options, designState.design]
  )
  const hasContent = markdown.trim().length > 0

  useEffect(() => {
    setHookResult(null)
    setHookError(null)
  }, [markdown])

  const updateOptions = (nextOptions: Partial<WeChatMarkdownExportOptions>) => {
    setOptions((current) => ({ ...current, ...nextOptions }))
    setCopied(false)
  }

  const handleGenerateHooks = async () => {
    if (!hasContent || hookLoading) return

    setHookLoading(true)
    setHookError(null)
    console.info("[WeChatMPExportDialog] Generating WeChat hook summary", {
      articleId,
      markdownLength: markdown.length,
    })

    try {
      const result = await articlesClient.generateWeChatHookSummary({
        article_id: articleId ?? undefined,
        title: articleTitle,
        content: markdown,
      })

      if ("error" in result) {
        throw new Error(result.error)
      }

      setHookResult(result)
      toast({
        title: t("wechatExport.hooks.toastSuccess"),
      })
    } catch (error) {
      console.error("[WeChatMPExportDialog] Failed to generate WeChat hooks", { error })
      const message = error instanceof Error ? error.message : t("wechatExport.hooks.toastFailed")
      setHookError(message)
      toast({
        variant: "destructive",
        title: t("wechatExport.hooks.toastFailed"),
        description: t("wechatExport.hooks.toastFailedDesc"),
      })
    } finally {
      setHookLoading(false)
    }
  }

  const handleCopyHook = async (hook: WeChatHookOption) => {
    try {
      await navigator.clipboard.writeText(hook.hook)
      toast({ title: t("wechatExport.hooks.copySuccess") })
    } catch (error) {
      console.warn("[WeChatMPExportDialog] Failed to copy hook text", { error })
      toast({
        variant: "destructive",
        title: t("wechatExport.hooks.copyFailed"),
      })
    }
  }

  const handleCopy = async () => {
    if (!hasContent || copying || !designReady) return

    setCopying(true)
    setCopied(false)
    console.debug("[WeChatMPExportDialog] Copy button clicked", {
      markdownLength: markdown.length,
      style: designState.design?.style.slug,
    })

    try {
      await copyWeChatHtml(exportResult.html, exportResult.plainText)
      setCopied(true)
      toast({
        title: t("wechatExport.toast.copySuccess"),
        description: t("wechatExport.toast.copySuccessDesc"),
      })
    } catch (error) {
      console.error("[WeChatMPExportDialog] Failed to copy WeChat export", { error })
      toast({
        variant: "destructive",
        title: t("wechatExport.toast.copyFailed"),
        description: t("wechatExport.toast.copyFailedDesc"),
      })
    } finally {
      setCopying(false)
    }
  }

  return (
    <AIFeatureDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("wechatExport.title")}
      description={t("wechatExport.description")}
      icon={<NewspaperIcon className="h-5 w-5 text-primary" />}
      size="fullscreen"
      footer={
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            {t("wechatExport.meta", {
              words: exportResult.wordCount,
              minutes: exportResult.readingMinutes,
            })}
          </div>
          <Button
            type="button"
            size="lg"
            className="w-full sm:w-auto"
            disabled={!hasContent || copying || !designReady}
            onClick={handleCopy}
          >
            {copying ? (
              <LoaderIcon className="h-4 w-4 animate-spin" />
            ) : copied ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <ClipboardIcon className="h-4 w-4" />
            )}
            {copied ? t("wechatExport.copied") : t("wechatExport.copy")}
          </Button>
        </div>
      }
    >
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden bg-muted/20 lg:grid-cols-[400px_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-y-auto border-b bg-background p-5 lg:border-b-0 lg:border-r">
          <div className="space-y-5">
            <section className="space-y-3 rounded-lg border bg-muted/20 p-3">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  {t("wechatExport.hooks.title")}
                </h3>
                <p className="text-xs leading-5 text-muted-foreground">
                  {t("wechatExport.hooks.subtitle")}
                </p>
              </div>
              <Button
                type="button"
                className="w-full"
                disabled={!hasContent || hookLoading}
                onClick={handleGenerateHooks}
              >
                {hookLoading ? (
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <WandSparklesIcon className="h-4 w-4" />
                )}
                {hookLoading ? t("wechatExport.hooks.generating") : t("wechatExport.hooks.generate")}
              </Button>

              {hookError ? (
                <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive">
                  {hookError}
                </p>
              ) : null}

              {hookResult ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {hookResult.hooks.map((hook) => (
                      <article key={hook.type} className="rounded-md border bg-background p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground">
                              {hook.name || t(`wechatExport.hooks.types.${hook.type}`)}
                            </p>
                            {hook.best_for ? (
                              <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                                {hook.best_for}
                              </p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            onClick={() => void handleCopyHook(hook)}
                            aria-label={t("wechatExport.hooks.copy")}
                          >
                            <CopyIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-foreground">
                          {hook.hook}
                        </p>
                        {hook.rationale ? (
                          <p className="mt-2 border-t pt-2 text-xs leading-5 text-muted-foreground">
                            {hook.rationale}
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            <section className="space-y-2">
              <Label htmlFor="wechat-export-font-size">{t("wechatExport.controls.fontSize")}</Label>
              <Input
                id="wechat-export-font-size"
                type="number"
                min={14}
                max={20}
                value={options.fontSize}
                onChange={(event) =>
                  updateOptions({
                    fontSize: Number.isFinite(event.target.valueAsNumber)
                      ? event.target.valueAsNumber
                      : DEFAULT_WECHAT_MARKDOWN_EXPORT_OPTIONS.fontSize,
                  })
                }
                className="h-9"
              />
            </section>

            <section className="space-y-2">
              <Label htmlFor="wechat-export-caption">{t("wechatExport.controls.caption")}</Label>
              <Select
                value={options.imageCaption}
                onValueChange={(value) =>
                  updateOptions({ imageCaption: value as WeChatImageCaptionMode })
                }
              >
                <SelectTrigger id="wechat-export-caption" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alt">{t("wechatExport.caption.alt")}</SelectItem>
                  <SelectItem value="title">{t("wechatExport.caption.title")}</SelectItem>
                  <SelectItem value="none">{t("wechatExport.caption.none")}</SelectItem>
                </SelectContent>
              </Select>
            </section>

            <section className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="wechat-export-cite" className="text-sm">
                  {t("wechatExport.controls.citeLinks")}
                </Label>
                <Switch
                  id="wechat-export-cite"
                  checked={options.citeLinks}
                  onCheckedChange={(checked) => updateOptions({ citeLinks: checked })}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="wechat-export-reading" className="text-sm">
                  {t("wechatExport.controls.readingTime")}
                </Label>
                <Switch
                  id="wechat-export-reading"
                  checked={options.showReadingTime}
                  onCheckedChange={(checked) => updateOptions({ showReadingTime: checked })}
                />
              </div>
            </section>
          </div>
        </aside>

        <main className="min-h-0 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto w-full max-w-[480px] bg-white shadow-sm">
            {!designReady ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground" role="status">
                {designState.status === "error" ? <>
                  <p>{t("wechatExport.designError")}</p>
                  <Button variant="outline" onClick={() => setDesignRevision((value) => value + 1)}>{t("common.refresh")}</Button>
                </> : <><LoaderIcon className="h-5 w-5 animate-spin" /><p>{t("wechatExport.designLoading")}</p></>}
              </div>
            ) : hasContent ? (
              <div
                className="wechat-export-preview"
                dangerouslySetInnerHTML={{ __html: exportResult.html }}
              />
            ) : (
              <div className="flex min-h-[320px] items-center justify-center text-center text-sm text-muted-foreground">
                {t("wechatExport.empty")}
              </div>
            )}
          </div>
        </main>
      </div>
    </AIFeatureDialogShell>
  )
}
