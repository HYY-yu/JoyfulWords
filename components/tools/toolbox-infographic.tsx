"use client"
/* eslint-disable @next/next/no-img-element */

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  ImageIcon,
  LanguagesIcon,
  LayoutTemplateIcon,
  Loader2Icon,
  PaletteIcon,
  SparklesIcon,
  WandSparklesIcon,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/base/alert"
import { Button } from "@/components/ui/base/button"
import { Label } from "@/components/ui/base/label"
import { ScrollArea } from "@/components/ui/base/scroll-area"
import { Textarea } from "@/components/ui/base/textarea"
import { useAsyncTaskToast } from "@/hooks/use-async-task-toast"
import { useToast } from "@/hooks/use-toast"
import { billingClient } from "@/lib/api/billing/client"
import {
  parseInfographicImageUrls,
  type GenerateInfographicRequest,
  type InfographicCardStyle,
  type InfographicDecorationLevel,
  type InfographicLanguage,
  type InfographicScreenOrientation,
} from "@/lib/api/infographics/types"
import { toolboxClient } from "@/lib/api/toolbox/client"
import { useAuth } from "@/lib/auth/auth-context"
import { useInfographicPolling, type InfographicPollingState } from "@/lib/hooks/use-infographic-polling"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { buildLocalizedPath } from "@/lib/i18n/route-locale"
import { cn } from "@/lib/utils"

const STYLE_PREVIEWS: Array<{
  value: InfographicCardStyle
  assetPath: string
}> = [
  { value: "professional", assetPath: "/images/infographics/styles/professional.png" },
  { value: "rustic", assetPath: "/images/infographics/styles/rustic.png" },
  { value: "academic", assetPath: "/images/infographics/styles/academic.png" },
  { value: "handdrawn", assetPath: "/images/infographics/styles/handdrawn.png" },
  { value: "magazine", assetPath: "/images/infographics/styles/magazine.png" },
  { value: "minimal", assetPath: "/images/infographics/styles/minimal.png" },
  { value: "fresh", assetPath: "/images/infographics/styles/fresh.png" },
]

const ORIENTATION_OPTIONS: InfographicScreenOrientation[] = ["square", "landscape", "portrait"]
const LANGUAGE_OPTIONS: InfographicLanguage[] = ["zh", "en"]
const DECORATION_OPTIONS: InfographicDecorationLevel[] = ["simple", "moderate", "rich"]
const SOFT_NATIVE_SCROLLBAR_CLASS =
  "[scrollbar-color:color-mix(in_oklch,var(--primary)_18%,transparent)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-0.5 [&::-webkit-scrollbar]:w-0.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-0 [&::-webkit-scrollbar-thumb]:bg-primary/12 hover:[&::-webkit-scrollbar-thumb]:bg-primary/28"
const SOFT_RADIX_SCROLLBAR_CLASS =
  "[&_[data-slot=scroll-area-scrollbar]]:w-0.5 [&_[data-slot=scroll-area-scrollbar]]:bg-transparent [&_[data-slot=scroll-area-scrollbar]]:opacity-25 hover:[&_[data-slot=scroll-area-scrollbar]]:opacity-60 [&_[data-slot=scroll-area-thumb]]:bg-primary/18 hover:[&_[data-slot=scroll-area-thumb]]:bg-primary/32"

type InfographicFormState = {
  cardStyle: InfographicCardStyle
  screenOrientation: InfographicScreenOrientation
  language: InfographicLanguage
  decorationLevel: InfographicDecorationLevel
  userCustom: string
}

const DEFAULT_FORM_STATE_BY_LOCALE: Record<InfographicLanguage, InfographicFormState> = {
  zh: {
    cardStyle: "professional",
    screenOrientation: "square",
    language: "zh",
    decorationLevel: "moderate",
    userCustom: "",
  },
  en: {
    cardStyle: "professional",
    screenOrientation: "square",
    language: "en",
    decorationLevel: "moderate",
    userCustom: "",
  },
}

export function ToolboxInfographic() {
  const { locale, t } = useTranslation()
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const taskToast = useAsyncTaskToast()
  const getLogDetail = useCallback((logId: number) => toolboxClient.getInfographicLog(logId), [])
  const {
    currentLogId,
    detail,
    errorMessage: pollingErrorMessage,
    state: pollingState,
    markSubmitting,
    startPolling,
    reset,
  } = useInfographicPolling(getLogDetail)

  const [sourceText, setSourceText] = useState("")
  const [formState, setFormState] = useState<InfographicFormState>(
    DEFAULT_FORM_STATE_BY_LOCALE[locale]
  )
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [requestErrorMessage, setRequestErrorMessage] = useState<string | null>(null)
  const lastAnnouncedPollingStateRef = useRef<InfographicPollingState>("idle")
  const styleListRef = useRef<HTMLDivElement | null>(null)
  const styleButtonRefs = useRef<Partial<Record<InfographicCardStyle, HTMLButtonElement | null>>>({})
  const selectedTextPreview = sourceText.trim()
  const selectedStyle = STYLE_PREVIEWS.find((style) => style.value === formState.cardStyle) ?? STYLE_PREVIEWS[0]
  const taskLabel = t("toolsPage.tools.infographic.title")
  const submittingToastTitle = t("asyncTaskToast.submittingTitle", { task: taskLabel })
  const submittingToastDescription = t("asyncTaskToast.submittingDescription", { task: taskLabel })
  const pollingToastTitle = t("asyncTaskToast.pollingTitle", { task: taskLabel })
  const pollingToastDescription = t("asyncTaskToast.pollingDescription", { task: taskLabel })
  const loginHref = `/auth/login?redirect=${encodeURIComponent(buildLocalizedPath(locale, "/tools/infographic"))}`

  useEffect(() => {
    if (!user) {
      setCreditBalance(null)
      setIsLoadingBalance(false)
      return
    }

    let isCancelled = false

    const refreshBalance = async () => {
      setIsLoadingBalance(true)

      try {
        const result = await billingClient.refreshBalance()

        if (isCancelled) return

        if ("error" in result) {
          console.warn("[ToolboxInfographic] Failed to refresh account credit balance", {
            userId: user.id,
            error: result.error,
          })
          setCreditBalance(null)
          return
        }

        console.info("[ToolboxInfographic] Account credit balance refreshed", {
          userId: user.id,
          balanceCents: result.balance_cents,
          isCached: result.is_cached,
        })

        setCreditBalance(result.balance_cents)
      } catch (error) {
        if (isCancelled) return

        console.warn("[ToolboxInfographic] Unexpected balance refresh error", {
          userId: user.id,
          error: error instanceof Error ? error.message : String(error),
        })
        setCreditBalance(null)
      } finally {
        if (!isCancelled) {
          setIsLoadingBalance(false)
        }
      }
    }

    void refreshBalance()

    return () => {
      isCancelled = true
    }
  }, [user])

  useEffect(() => {
    setFormState((prev) => ({
      ...DEFAULT_FORM_STATE_BY_LOCALE[locale],
      cardStyle: prev.cardStyle,
      screenOrientation: prev.screenOrientation,
      decorationLevel: prev.decorationLevel,
      userCustom: prev.userCustom,
    }))
  }, [locale])

  const imageUrls = useMemo(() => {
    return parseInfographicImageUrls(detail?.image_urls)
  }, [detail?.image_urls])

  useEffect(() => {
    if (activeImageIndex >= imageUrls.length) {
      setActiveImageIndex(0)
    }
  }, [activeImageIndex, imageUrls.length])

  const isGenerating = pollingState === "submitting" || pollingState === "pending" || pollingState === "processing"
  const activeImageUrl = imageUrls[activeImageIndex] ?? null
  const canGenerate = Boolean(user) && !loading && !isGenerating && selectedTextPreview.length > 0

  const statusText = (() => {
    if (pollingState === "pending" || pollingState === "processing") {
      return t(`infographicDialog.status.${pollingState}`)
    }
    if (pollingState === "success" || pollingState === "failed") {
      return t(`infographicDialog.status.${pollingState}`)
    }
    if (!user && !loading) {
      return t("toolsPage.infographic.loginRequiredDescription")
    }
    return t("infographicDialog.resultHint")
  })()

  const errorMessage =
    requestErrorMessage ||
    (pollingErrorMessage === "polling_timeout"
      ? t("infographicDialog.toast.pollingTimeout")
      : pollingErrorMessage)

  useEffect(() => {
    if (pollingState === lastAnnouncedPollingStateRef.current) return

    lastAnnouncedPollingStateRef.current = pollingState

    if (pollingState === "success") {
      taskToast.showSuccess({
        title: t("infographicDialog.status.success"),
      })
      return
    }

    if (pollingState === "failed") {
      taskToast.showFailure({
        title: t("infographicDialog.status.failed"),
      })
    }
  }, [pollingState, t, taskToast])

  const handleGenerate = async () => {
    if (!selectedTextPreview) {
      toast({
        variant: "destructive",
        title: t("toolsPage.infographic.toast.enterTextFirst"),
        description: t("toolsPage.infographic.toast.enterTextFirstDesc"),
      })
      return
    }

    if (!user) {
      toast({
        title: t("toolsPage.infographic.loginRequiredTitle"),
        description: t("toolsPage.infographic.loginRequiredDescription"),
      })
      return
    }

    const request: GenerateInfographicRequest = {
      text: selectedTextPreview,
      article_id: 0,
      card_style: formState.cardStyle,
      screen_orientation: formState.screenOrientation,
      language: formState.language,
      decoration_level: formState.decorationLevel,
      user_custom: formState.userCustom.trim() || undefined,
    }

    setRequestErrorMessage(null)
    markSubmitting()
    taskToast.showSubmitting({
      title: submittingToastTitle,
      description: submittingToastDescription,
    })

    try {
      const result = await toolboxClient.createInfographicTask(request)

      if ("error" in result) {
        console.error("[ToolboxInfographic] Failed to create infographic", {
          error: result.error,
        })
        reset()
        setRequestErrorMessage(String(result.error))
        taskToast.showFailure({
          title: t("infographicDialog.toast.createFailed"),
        })
        return
      }

      taskToast.showPolling({
        title: pollingToastTitle,
        description: pollingToastDescription,
      })

      await startPolling(result.log_id)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      console.error("[ToolboxInfographic] Unexpected infographic creation error", {
        error: message,
      })
      reset()
      setRequestErrorMessage(message)
      taskToast.showFailure({
        title: t("infographicDialog.toast.createFailed"),
      })
    }
  }

  const handleSelectAdjacentStyle = (direction: -1 | 1) => {
    const currentIndex = STYLE_PREVIEWS.findIndex((style) => style.value === formState.cardStyle)
    const normalizedIndex = currentIndex >= 0 ? currentIndex : 0
    const nextIndex = (normalizedIndex + direction + STYLE_PREVIEWS.length) % STYLE_PREVIEWS.length
    const isWrappingForward = direction > 0 && normalizedIndex === STYLE_PREVIEWS.length - 1
    const isWrappingBackward = direction < 0 && normalizedIndex === 0
    const styleList = styleListRef.current
    const currentButton = styleButtonRefs.current[STYLE_PREVIEWS[normalizedIndex].value]
    const nextButton = styleButtonRefs.current[STYLE_PREVIEWS[nextIndex].value]

    if (styleList) {
      const hasVerticalOverflow = styleList.scrollHeight > styleList.clientHeight + 1
      const hasHorizontalOverflow = styleList.scrollWidth > styleList.clientWidth + 1

      if (isWrappingForward || isWrappingBackward) {
        styleList.scrollTo({
          top: isWrappingForward ? 0 : styleList.scrollHeight,
          left: isWrappingForward ? 0 : styleList.scrollWidth,
          behavior: "smooth",
        })
      } else {
        const verticalDistance =
          currentButton && nextButton
            ? Math.abs(nextButton.offsetTop - currentButton.offsetTop)
            : (currentButton?.offsetHeight ?? nextButton?.offsetHeight ?? 44) + 8
        const horizontalDistance =
          currentButton && nextButton
            ? Math.abs(nextButton.offsetLeft - currentButton.offsetLeft)
            : (currentButton?.offsetWidth ?? nextButton?.offsetWidth ?? 128) + 8

        styleList.scrollBy({
          top: hasVerticalOverflow ? direction * verticalDistance : 0,
          left: hasHorizontalOverflow ? direction * horizontalDistance : 0,
          behavior: "smooth",
        })
      }
    }

    setFormState((prev) => ({
      ...prev,
      cardStyle: STYLE_PREVIEWS[nextIndex].value,
    }))
  }

  return (
    <section className="tools-image-workbench tools-infographic-workbench">
      <div className="tools-image-workbench-header">
        <div className="flex min-w-0 items-center gap-3">
          <span className="tools-image-workbench-icon">
            <ImageIcon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="tools-tool-category">{t("toolsPage.tools.infographic.category")}</p>
            <h1 className="tools-image-workbench-title">
              {t("toolsPage.tools.infographic.title")}
            </h1>
          </div>
        </div>
        <div className="tools-image-workbench-status">
          <SparklesIcon className="size-4" />
          <span>
            {loading
              ? t("toolsPage.imageGenerator.authChecking")
              : user
                ? isLoadingBalance
                  ? t("toolsPage.imageGenerator.balanceLoading")
                  : creditBalance === null
                    ? t("toolsPage.infographic.signedIn")
                    : t("toolsPage.imageGenerator.signedInBalance", {
                        credits: creditBalance.toLocaleString(),
                      })
                : t("toolsPage.infographic.loginRequiredTitle")}
          </span>
        </div>
      </div>

      <div className="tools-image-workbench-body">
        <div className="grid h-full min-h-0 gap-0 lg:grid-cols-[minmax(500px,0.86fr)_minmax(460px,1fr)] xl:grid-cols-[minmax(540px,0.82fr)_minmax(560px,1fr)]">
          <ScrollArea
            className={cn(
              "min-h-0 border-b bg-background lg:border-r lg:border-b-0",
              SOFT_RADIX_SCROLLBAR_CLASS
            )}
          >
            <div className="space-y-3.5 p-4 xl:p-5">
              {!user && !loading ? (
                <Alert className="border-primary/25 bg-primary/5">
                  <AlertCircleIcon />
                  <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span>{t("toolsPage.infographic.loginRequiredDescription")}</span>
                    <Button size="sm" asChild>
                      <Link href={loginHref}>{t("toolsPage.nav.login")}</Link>
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : null}

              <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b bg-muted/25 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                      1
                    </span>
                    <Label htmlFor="toolbox-infographic-source" className="flex items-center gap-2 text-sm font-semibold">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      {t("toolsPage.infographic.sourceTextLabel")}
                    </Label>
                  </div>
                  <span className="rounded-full bg-background px-2.5 py-1 text-xs text-muted-foreground">
                    {t("infographicDialog.selectedTextCount", {
                      count: selectedTextPreview.length,
                    })}
                  </span>
                </div>
                <div className="p-3">
                  <Textarea
                    id="toolbox-infographic-source"
                    value={sourceText}
                    onChange={(event) => setSourceText(event.target.value)}
                    placeholder={t("toolsPage.infographic.sourceTextPlaceholder")}
                    className={cn(
                      "h-32 max-h-56 min-h-32 resize-y overflow-y-auto border-border/70 bg-muted/20 text-sm leading-relaxed shadow-none",
                      SOFT_NATIVE_SCROLLBAR_CLASS
                    )}
                  />
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t("toolsPage.infographic.sourceTextHint")}
                  </p>
                </div>
              </section>

              <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b bg-muted/25 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                      2
                    </span>
                    <Label className="flex items-center gap-2 text-sm font-semibold">
                      <PaletteIcon className="h-4 w-4 text-primary" />
                      {t("infographicDialog.styleLabel")}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {t(`infographicDialog.styles.${selectedStyle.value}.title`)}
                    </span>
                    <div className="flex rounded-lg border bg-background p-0.5">
                      <button
                        type="button"
                        aria-label={locale === "zh" ? "上一个视觉风格" : "Previous visual style"}
                        onClick={() => handleSelectAdjacentStyle(-1)}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <ChevronUpIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={locale === "zh" ? "下一个视觉风格" : "Next visual style"}
                        onClick={() => handleSelectAdjacentStyle(1)}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <ChevronDownIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid items-stretch gap-4 p-3 xl:grid-cols-[140px_minmax(0,1fr)]">
                  <div
                    ref={styleListRef}
                    className={cn(
                      "flex max-w-full gap-2 overflow-x-auto pb-1 xl:grid xl:h-full xl:max-h-none xl:grid-cols-1 xl:overflow-x-hidden xl:overflow-y-auto xl:pb-0 xl:pr-1",
                      SOFT_NATIVE_SCROLLBAR_CLASS
                    )}
                  >
                    {STYLE_PREVIEWS.map((style) => {
                      const isActive = formState.cardStyle === style.value
                      return (
                        <button
                          key={style.value}
                          type="button"
                          ref={(node) => {
                            styleButtonRefs.current[style.value] = node
                          }}
                          onClick={() =>
                            setFormState((prev) => ({ ...prev, cardStyle: style.value }))
                          }
                          className={cn(
                            "group flex min-w-32 items-center gap-2 rounded-lg border border-transparent bg-muted/30 px-2 py-1.5 text-left transition-all hover:bg-muted/50 xl:min-w-0",
                            isActive
                              ? "border-primary/60 bg-primary/8 text-primary shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <span className="flex h-9 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                            <img
                              src={style.assetPath}
                              alt={t(`infographicDialog.styles.${style.value}.title`)}
                              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.04]"
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium leading-5">
                              {t(`infographicDialog.styles.${style.value}.title`)}
                            </span>
                          </span>
                          {isActive ? (
                            <CheckCircle2Icon className="h-4 w-4 shrink-0 text-primary" />
                          ) : null}
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-muted/20">
                    <div className="flex h-56 items-center justify-center p-2 sm:h-60 xl:h-72">
                      <img
                        src={selectedStyle.assetPath}
                        alt={t(`infographicDialog.styles.${selectedStyle.value}.title`)}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="flex items-start justify-between gap-3 border-t bg-background/80 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-5">
                          {t(`infographicDialog.styles.${selectedStyle.value}.title`)}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {t(`infographicDialog.styles.${selectedStyle.value}.description`)}
                        </p>
                      </div>
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <CheckCircle2Icon className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
                <div className="flex items-center gap-2 border-b bg-muted/25 px-4 py-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    3
                  </span>
                  <Label className="text-sm font-semibold">
                    {t("infographicDialog.orientationLabel")} / {t("infographicDialog.languageLabel")} / {t("infographicDialog.decorationLabel")}
                  </Label>
                </div>

                <div className="grid gap-3 p-3 lg:grid-cols-2 2xl:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-semibold">
                      <LayoutTemplateIcon className="h-4 w-4 text-primary" />
                      {t("infographicDialog.orientationLabel")}
                    </Label>
                    <div className="grid grid-cols-3 rounded-lg border border-border/70 bg-muted/20 p-1">
                      {ORIENTATION_OPTIONS.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setFormState((prev) => ({ ...prev, screenOrientation: value }))
                          }
                          className={cn(
                            "h-9 min-w-0 overflow-hidden rounded-md px-1 text-xs font-medium leading-none transition-colors sm:px-1.5 sm:text-[13px]",
                            formState.screenOrientation === value
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <span className="block min-w-0 truncate">
                            {t(`infographicDialog.orientations.${value}`)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-semibold">
                      <LanguagesIcon className="h-4 w-4 text-primary" />
                      {t("infographicDialog.languageLabel")}
                    </Label>
                    <div className="grid grid-cols-2 rounded-lg border border-border/70 bg-muted/20 p-1">
                      {LANGUAGE_OPTIONS.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setFormState((prev) => ({ ...prev, language: value }))}
                          className={cn(
                            "h-9 min-w-0 overflow-hidden rounded-md px-1 text-xs font-medium leading-none transition-colors sm:px-1.5 sm:text-[13px]",
                            formState.language === value
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <span className="block min-w-0 truncate">
                            {t(`infographicDialog.languages.${value}`)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-semibold">
                      <SparklesIcon className="h-4 w-4 text-primary" />
                      {t("infographicDialog.decorationLabel")}
                    </Label>
                    <div className="grid grid-cols-3 rounded-lg border border-border/70 bg-muted/20 p-1">
                      {DECORATION_OPTIONS.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setFormState((prev) => ({ ...prev, decorationLevel: value }))
                          }
                          className={cn(
                            "h-9 min-w-0 overflow-hidden rounded-md px-1 text-xs font-medium leading-none transition-colors sm:px-1.5 sm:text-[13px]",
                            formState.decorationLevel === value
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <span className="block min-w-0 truncate">
                            {t(`infographicDialog.decorations.${value}`)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
                <div className="flex items-center gap-2 border-b bg-muted/25 px-4 py-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    4
                  </span>
                  <Label className="text-sm font-semibold">{t("infographicDialog.customLabel")}</Label>
                </div>
                <div className="p-3">
                  <Textarea
                    value={formState.userCustom}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, userCustom: event.target.value }))
                    }
                    placeholder={t("infographicDialog.customPlaceholder")}
                    className="h-20 max-h-32 min-h-20 resize-y border-border/70 bg-muted/20 shadow-none"
                  />
                </div>
              </section>
            </div>
          </ScrollArea>

          <div className="flex min-h-0 flex-col bg-muted/20">
            <div className="shrink-0 border-b bg-background/80 px-5 py-4 xl:px-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{t("infographicDialog.resultTitle")}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{statusText}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {!user && !loading ? (
                    <Button type="button" variant="outline" asChild>
                      <Link href={loginHref}>{t("toolsPage.nav.login")}</Link>
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                        {t("infographicDialog.generating")}
                      </>
                    ) : (
                      <>
                        <WandSparklesIcon className="h-4 w-4" />
                        {t("infographicDialog.generate")}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border bg-background px-3 py-2">
                  <span className="block text-muted-foreground">{t("infographicDialog.styleLabel")}</span>
                  <span className="mt-1 block truncate font-medium">
                    {t(`infographicDialog.styles.${selectedStyle.value}.title`)}
                  </span>
                </div>
                <div className="rounded-lg border bg-background px-3 py-2">
                  <span className="block text-muted-foreground">{t("infographicDialog.orientationLabel")}</span>
                  <span className="mt-1 block truncate font-medium">
                    {t(`infographicDialog.orientations.${formState.screenOrientation}`)}
                  </span>
                </div>
                <div className="rounded-lg border bg-background px-3 py-2">
                  <span className="block text-muted-foreground">{t("infographicDialog.languageLabel")}</span>
                  <span className="mt-1 block truncate font-medium">
                    {t(`infographicDialog.languages.${formState.language}`)}
                  </span>
                </div>
                <div className="rounded-lg border bg-background px-3 py-2">
                  <span className="block text-muted-foreground">{t("infographicDialog.decorationLabel")}</span>
                  <span className="mt-1 block truncate font-medium">
                    {t(`infographicDialog.decorations.${formState.decorationLevel}`)}
                  </span>
                </div>
              </div>

              {pollingState === "pending" || pollingState === "processing" ? (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  {t("infographicDialog.generatingHint")}
                </div>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 p-5 xl:p-6">
              {errorMessage ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircleIcon />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              ) : null}

              {activeImageUrl ? (
                <div className="flex h-full min-h-0 flex-col gap-4">
                  <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border bg-background shadow-sm">
                    <img
                      src={activeImageUrl}
                      alt={t("infographicDialog.resultImageAlt")}
                      className="max-h-full w-full object-contain"
                    />
                  </div>

                  {imageUrls.length > 1 ? (
                    <div className="grid shrink-0 grid-cols-3 gap-2">
                      {imageUrls.map((imageUrl, index) => (
                        <button
                          key={`${imageUrl}-${index}`}
                          type="button"
                          onClick={() => setActiveImageIndex(index)}
                          className={cn(
                            "overflow-hidden rounded-lg border bg-background transition-all",
                            activeImageIndex === index
                              ? "border-primary ring-2 ring-primary/15"
                              : "border-border hover:border-primary/40"
                          )}
                        >
                          <img
                            src={imageUrl}
                            alt={`${t("infographicDialog.resultImageAlt")} ${index + 1}`}
                            className="aspect-video h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex h-full min-h-72 items-center justify-center rounded-lg border border-dashed border-primary/20 bg-background/75 px-6 text-center">
                  <div className="max-w-sm space-y-3">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {isGenerating ? (
                        <Loader2Icon className="h-5 w-5 animate-spin" />
                      ) : (
                        <SparklesIcon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">
                        {isGenerating
                          ? t("infographicDialog.generating")
                          : t("infographicDialog.resultEmptyTitle")}
                      </p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {isGenerating
                          ? t("infographicDialog.generatingHint")
                          : t("infographicDialog.resultEmptyDesc")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
