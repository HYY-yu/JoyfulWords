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
  WECHAT_MARKDOWN_THEME_OPTIONS,
  copyWeChatHtml,
  renderWeChatMarkdown,
  type WeChatImageCaptionMode,
  type WeChatMarkdownExportOptions,
  type WeChatMarkdownTheme,
} from "@/lib/wechat-markdown-export"
import { cn } from "@/lib/utils"

interface WeChatMPExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  markdown: string
  articleId?: number | null
  articleTitle?: string
}

const COLOR_PRESETS = ["#16a34a", "#0ea5e9", "#ef4444", "#8b5cf6", "#f97316"]

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

  const exportResult = useMemo(
    () => renderWeChatMarkdown(markdown, options),
    [markdown, options]
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
    if (!hasContent || copying) return

    setCopying(true)
    setCopied(false)
    console.debug("[WeChatMPExportDialog] Copy button clicked", {
      markdownLength: markdown.length,
      theme: options.theme,
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
            disabled={!hasContent || copying}
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
              <Label htmlFor="wechat-export-theme">{t("wechatExport.controls.theme")}</Label>
              <Select
                value={options.theme}
                onValueChange={(value) =>
                  updateOptions({ theme: value as WeChatMarkdownTheme })
                }
              >
                <SelectTrigger id="wechat-export-theme" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WECHAT_MARKDOWN_THEME_OPTIONS.map((themeOption) => (
                    <SelectItem key={themeOption.value} value={themeOption.value}>
                      {t(themeOption.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs leading-5 text-muted-foreground">
                {t(
                  WECHAT_MARKDOWN_THEME_OPTIONS.find(
                    (themeOption) => themeOption.value === options.theme
                  )?.descriptionKey ?? "wechatExport.theme.defaultDesc"
                )}
              </p>
            </section>

            <section className="space-y-2">
              <Label htmlFor="wechat-export-color">{t("wechatExport.controls.primaryColor")}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="wechat-export-color"
                  type="color"
                  value={options.primaryColor}
                  onChange={(event) => updateOptions({ primaryColor: event.target.value })}
                  className="h-9 w-14 p-1"
                />
                <Input
                  value={options.primaryColor}
                  onChange={(event) => updateOptions({ primaryColor: event.target.value })}
                  className="h-9 font-mono text-xs"
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={color}
                    onClick={() => updateOptions({ primaryColor: color })}
                    className={cn(
                      "h-7 w-7 rounded-full border transition-transform hover:scale-105",
                      options.primaryColor === color && "ring-2 ring-ring ring-offset-2"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
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
          <div className="mx-auto w-full max-w-[720px] bg-background px-5 py-6 shadow-sm sm:px-8">
            {hasContent ? (
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
