"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRightIcon,
  BookOpenTextIcon,
  FilePenLineIcon,
  Globe,
  ImagePlusIcon,
  LibraryBigIcon,
  MenuIcon,
  PanelTopIcon,
  SearchCheckIcon,
  SparklesIcon,
  WandSparklesIcon,
} from "lucide-react"
import { Button } from "@/components/ui/base/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/base/accordion"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/base/sheet"
import { BrandLogo } from "@/components/brand/brand-logo"
import { persistLocalePreference, useTranslation } from "@/lib/i18n/i18n-context"
import { buildLocalizedPath } from "@/lib/i18n/route-locale"
import { CookieBannerProvider } from "@/components/cookie-banner/cookie-banner-provider"
import { JoyfulThemeSwitcher } from "@/components/theme/joyful-theme-switcher"

const featureKeys = [
  {
    key: "aiWriting",
    num: "01",
  },
  {
    key: "materialSearch",
    num: "02",
  },
  {
    key: "imageGen",
    num: "03",
  },
  {
    key: "knowledgeCards",
    num: "04",
  },
  {
    key: "seoGeo",
    num: "05",
  },
  {
    key: "competitors",
    num: "06",
  },
] as const

const featureIcons = {
  aiWriting: WandSparklesIcon,
  materialSearch: LibraryBigIcon,
  imageGen: ImagePlusIcon,
  knowledgeCards: BookOpenTextIcon,
  seoGeo: PanelTopIcon,
  competitors: SearchCheckIcon,
} as const

const workflowStepKeys = ["collect", "draft", "visual", "publish"] as const

const workflowStepIcons = {
  collect: LibraryBigIcon,
  draft: WandSparklesIcon,
  visual: ImagePlusIcon,
  publish: PanelTopIcon,
} as const

const ctaSignalKeys = ["material", "outline", "image", "presentation"] as const

export function HomePageContent() {
  const router = useRouter()
  const { t, locale } = useTranslation()
  const [visibleFeatures, setVisibleFeatures] = useState<Record<string, boolean>>({})
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0)
  const [spritePosition, setSpritePosition] = useState({
    x: 0,
    y: 0,
    facing: 1,
    visible: false,
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const featuresStageRef = useRef<HTMLDivElement | null>(null)
  const blogHref = buildLocalizedPath(locale, "/blog")
  const mcpHref = buildLocalizedPath(locale, "/mcp")
  const pricingHref = buildLocalizedPath(locale, "/pricing")

  const stats = [
    { value: t("landing.stats.speed"), label: t("landing.stats.speedLabel") },
    { value: t("landing.stats.tools"), label: t("landing.stats.toolsLabel") },
    { value: t("landing.stats.seo"), label: t("landing.stats.seoLabel") },
  ]
  const workflowSteps = workflowStepKeys.map((key) => {
    const Icon = workflowStepIcons[key]
    return {
      key,
      Icon,
      title: t(`landing.workflow.steps.${key}.title`),
      meta: t(`landing.workflow.steps.${key}.meta`),
    }
  })
  const ctaSignals = ctaSignalKeys.map((key) => ({
    key,
    label: t(`landing.ctaVisual.signals.${key}`),
  }))
  const privacyPolicyHref = buildLocalizedPath(locale, "/privacy-policy")
  const termsOfUseHref = buildLocalizedPath(locale, "/terms-of-use")

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-feature-key]")

    const observer = new IntersectionObserver(
      (entries) => {
        const activeEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => {
            const aDistance = Math.abs(a.boundingClientRect.top + a.boundingClientRect.height / 2 - window.innerHeight * 0.48)
            const bDistance = Math.abs(b.boundingClientRect.top + b.boundingClientRect.height / 2 - window.innerHeight * 0.48)
            return aDistance - bDistance
          })[0]

        if (activeEntry) {
          const index = Number(activeEntry.target.getAttribute("data-feature-index") ?? 0)
          setActiveFeatureIndex(index)
        }

        entries.forEach((entry) => {
          if (!entry.isIntersecting) return

          const key = entry.target.getAttribute("data-feature-key")
          if (!key) return

          setVisibleFeatures((current) => {
            if (current[key]) return current
            return { ...current, [key]: true }
          })
        })
      },
      {
        threshold: 0.42,
        rootMargin: "-22% 0px -38% 0px",
      }
    )

    elements.forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const stage = featuresStageRef.current
    if (!stage) return

    const updateSpritePosition = () => {
      const title = stage.querySelector<HTMLElement>(`[data-feature-title="${activeFeatureIndex}"]`)
      if (!title) return

      const stageRect = stage.getBoundingClientRect()
      const titleRect = title.getBoundingClientRect()
      const x = titleRect.right - stageRect.left + 34
      const y = titleRect.top - stageRect.top + titleRect.height * 0.1

      setSpritePosition({
        x,
        y,
        facing: 1,
        visible: true,
      })
    }

    updateSpritePosition()
    window.addEventListener("resize", updateSpritePosition)

    return () => window.removeEventListener("resize", updateSpritePosition)
  }, [activeFeatureIndex, locale])

  return (
    <div className="jw-app-shell overflow-x-hidden">
      <header className="jw-app-header fixed top-0 right-0 left-0 z-50 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-2xl sm:px-6 md:px-10">
        <BrandLogo />
        <div className="flex-1" />

        <div className="hidden items-center gap-3 lg:flex">
          <JoyfulThemeSwitcher variant="compact" />
          <button
            onClick={() => {
              const nextLocale = locale === "zh" ? "en" : "zh"
              persistLocalePreference(nextLocale)
              router.replace(buildLocalizedPath(nextLocale))
            }}
            className="jw-themed-link flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm"
          >
            <Globe className="h-4 w-4" />
            {locale === "zh" ? "EN" : "中文"}
          </button>
          <a
            href="#features"
            className="jw-themed-link rounded-full px-3.5 py-1.5 text-sm"
          >
            {t("landing.nav.features")}
          </a>
          <Link
            href={pricingHref}
            className="jw-themed-link rounded-full px-3.5 py-1.5 text-sm"
          >
            {t("landing.nav.pricing")}
          </Link>
          <Link
            href={mcpHref}
            className="jw-themed-link rounded-full px-3.5 py-1.5 text-sm"
          >
            {t("landing.nav.mcp")}
          </Link>
          <Link
            href={blogHref}
            className="jw-themed-link rounded-full px-3.5 py-1.5 text-sm"
          >
            {t("landing.nav.blog")}
          </Link>
          <Button variant="outline" size="sm" className="jw-secondary-button rounded-full shadow-sm" asChild>
            <Link href="/articles">{t("landing.nav.myArticles")}</Link>
          </Button>
          <Button size="sm" className="jw-primary-button rounded-full" asChild>
            <Link href="/articles">
              {t("landing.nav.startCreating")}
            </Link>
          </Button>
        </div>

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label={t("landing.nav.menu")}
            >
              <MenuIcon className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="gap-0">
            <SheetHeader className="pb-2">
              <SheetTitle>{t("landing.nav.menu")}</SheetTitle>
              <SheetDescription className="sr-only">
                {t("landing.nav.menuDescription")}
              </SheetDescription>
            </SheetHeader>

            <nav className="flex flex-col gap-1 px-4 pb-6">
              <div className="mb-2">
                <JoyfulThemeSwitcher variant="compact" className="w-full justify-between" />
              </div>
              <button
                onClick={() => {
                  const nextLocale = locale === "zh" ? "en" : "zh"
                  persistLocalePreference(nextLocale)
                  router.replace(buildLocalizedPath(nextLocale))
                  setMobileMenuOpen(false)
                }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/85 hover:bg-accent hover:text-foreground"
              >
                <Globe className="h-4 w-4" />
                {locale === "zh" ? "EN" : "中文"}
              </button>

              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-foreground/85 hover:bg-accent hover:text-foreground"
              >
                {t("landing.nav.features")}
              </a>

              <Link
                href={pricingHref}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-foreground/85 hover:bg-accent hover:text-foreground"
              >
                {t("landing.nav.pricing")}
              </Link>

              <Link
                href={mcpHref}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-foreground/85 hover:bg-accent hover:text-foreground"
              >
                {t("landing.nav.mcp")}
              </Link>

              <Link
                href={blogHref}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-foreground/85 hover:bg-accent hover:text-foreground"
              >
                {t("landing.nav.blog")}
              </Link>

              <div className="my-2 h-px bg-border" />

              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/articles" onClick={() => setMobileMenuOpen(false)}>
                  {t("landing.nav.myArticles")}
                </Link>
              </Button>
              <Button className="w-full justify-start" asChild>
                <Link href="/articles" onClick={() => setMobileMenuOpen(false)}>
                  {t("landing.nav.startCreating")}
                </Link>
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      <section className="relative isolate min-h-screen overflow-hidden px-6 pt-28 pb-16 md:px-10">
        <div className="jw-hero-wash pointer-events-none absolute inset-0 -z-10" />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.22] [background-image:radial-gradient(circle_at_1px_1px,rgba(93,75,47,0.22)_1px,transparent_0)] [background-size:30px_30px]" />

        <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="text-center lg:text-left">
            <div className="animate-fade-up mb-7 inline-flex items-center gap-2 rounded-full border border-[var(--jw-border)] bg-[var(--jw-accent-soft)] px-4 py-1.5 text-[13px] font-semibold text-[var(--jw-accent)] shadow-[var(--jw-soft-shadow)]">
              <SparklesIcon className="h-3.5 w-3.5" />
              {t("landing.badge")}
            </div>

            <h1 className="jw-heading-text animate-fade-up animate-delay-1 mb-6 font-serif text-5xl leading-[1.08] tracking-tight md:text-7xl lg:text-[88px]">
              {t("landing.heading")}
              <br />
              <em className="not-italic text-[var(--jw-accent)]">{t("landing.headingAccent")}</em>
            </h1>

            <p className="jw-muted-text animate-fade-up animate-delay-2 mx-auto mb-9 max-w-xl text-lg leading-relaxed lg:mx-0">
              {t("landing.description")}
            </p>

            <div className="animate-fade-up animate-delay-3 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Button size="lg" className="jw-primary-button rounded-full px-6" asChild>
                <Link href="/articles">
                  <SparklesIcon className="h-4 w-4" />
                  {t("landing.cta")}
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="jw-secondary-button rounded-full px-6 shadow-sm" asChild>
                <Link href="/articles">
                  {t("landing.viewArticles")}
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="jw-surface-card animate-fade-up animate-delay-4 mt-12 grid w-full max-w-xl grid-cols-3 overflow-hidden rounded-xl border">
              {stats.map((stat) => (
                <div key={stat.label} className="border-r border-[var(--jw-border)] px-4 py-4 text-center last:border-r-0">
                  <div className="jw-heading-text font-serif text-2xl tracking-tight sm:text-[28px]">
                    {stat.value}
                  </div>
                  <div className="jw-muted-text mt-1 text-xs">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-fade-up animate-delay-2 relative mx-auto w-full max-w-xl lg:max-w-[39rem]">
            <div className="jw-ambient-orb absolute -left-8 top-12 h-24 w-24 rounded-full bg-[#ffd66b]/45 blur-2xl" />
            <div className="jw-ambient-orb jw-ambient-orb-late absolute -right-6 bottom-12 h-28 w-28 rounded-full bg-teal-300/30 blur-2xl" />
            <div className="jw-workspace-card jw-surface-card relative overflow-hidden rounded-[28px] border p-5 backdrop-blur">
              <div className="jw-workspace-sheen pointer-events-none absolute inset-x-0 top-0 h-px" />
              <div className="relative mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--jw-accent)] text-[var(--jw-accent-foreground)] shadow-[var(--jw-soft-shadow)]">
                    <FilePenLineIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-[var(--jw-heading)]">{t("landing.workflow.title")}</p>
                    <p className="jw-muted-text text-sm">{t("landing.workflow.subtitle")}</p>
                  </div>
                </div>
                <span className="jw-live-pill rounded-full bg-[var(--jw-accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--jw-accent)]">
                  {t("landing.workflow.live")}
                </span>
              </div>

              <div className="jw-article-stage relative overflow-hidden rounded-2xl border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] p-5">
                <div className="jw-stage-grid pointer-events-none absolute inset-0" />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--jw-accent)]">
                      {t("landing.workflow.canvasLabel")}
                    </p>
                    <h3 className="mt-2 max-w-[18rem] text-2xl font-semibold leading-tight text-[var(--jw-heading)]">
                      {t("landing.workflow.canvasTitle")}
                    </h3>
                  </div>
                  <span className="rounded-full border border-[var(--jw-border)] bg-[var(--jw-surface-muted)] px-3 py-1 text-xs text-[var(--jw-muted)]">
                    {t("landing.workflow.canvasStatus")}
                  </span>
                </div>

                <div className="relative mt-7 max-w-[88%] space-y-3">
                  <div className="jw-live-line h-2.5 w-full rounded-full" />
                  <div className="jw-live-line h-2.5 w-11/12 rounded-full" />
                  <div className="jw-live-line h-2.5 w-7/12 rounded-full" />
                </div>

                <div className="relative mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {workflowSteps.map((step, index) => {
                    const Icon = step.Icon
                    return (
                      <div
                        key={step.key}
                        className="jw-workflow-step rounded-xl border border-[var(--jw-border-subtle)] bg-[var(--jw-surface-muted)] px-3 py-3"
                        style={{ animationDelay: `${index * 0.28}s` }}
                      >
                        <Icon className="mb-2 h-4 w-4 text-[var(--jw-accent)]" />
                        <div className="truncate text-sm font-semibold text-[var(--jw-heading)]">{step.title}</div>
                        <div className="jw-muted-text mt-0.5 truncate text-[11px]">{step.meta}</div>
                      </div>
                    )
                  })}
                </div>

                <div className="jw-insight-card relative mt-4 rounded-xl border border-[var(--jw-border-subtle)] bg-[var(--jw-accent-soft)] p-3 text-sm text-[var(--jw-heading)]">
                  <div className="flex items-start gap-2">
                    <SparklesIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--jw-accent)]" />
                    <div>
                      <div className="font-semibold">{t("landing.workflow.insightTitle")}</div>
                      <p className="jw-muted-text mt-1 text-xs leading-5">
                        {t("landing.workflow.insight")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="jw-features-section px-6 py-20 md:px-10 md:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 max-w-2xl">
            <h2 className="font-serif text-4xl leading-tight tracking-tight">
              {t("landing.featuresHeading")}<em className="text-primary">{t("landing.featuresHeadingAccent")}</em>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {t("landing.featuresSubheading")}
            </p>
          </div>

          <div ref={featuresStageRef} className="relative space-y-10 overflow-visible md:space-y-14">
            <div
              aria-hidden="true"
              className={`jw-feature-sprite hidden md:block ${spritePosition.visible ? "opacity-100" : "opacity-0"}`}
              style={{
                transform: `translate3d(${spritePosition.x}px, ${spritePosition.y}px, 0)`,
              }}
            >
              <div className="jw-feature-sprite-shadow" />
              <div
                className="jw-feature-sprite-body"
                style={{ transform: `scaleX(${spritePosition.facing})` }}
              >
                <div className="jw-feature-sprite-hop">
                  <div className="jw-feature-sprite-page">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="jw-feature-sprite-pencil">
                    <span />
                  </div>
                  <div className="jw-feature-sprite-spark">
                    <SparklesIcon className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </div>
            {featureKeys.map((feature, index) => {
                const isVisible = Boolean(visibleFeatures[feature.key])
                const isRightAligned = index % 2 === 1
                const [leadingDigit, trailingDigit] = feature.num
                const contentAlignClass = isRightAligned
                  ? "items-end text-right"
                  : "items-start text-left"
                const articleOffsetClass = isRightAligned
                  ? "md:ml-20 lg:ml-28"
                  : "md:mr-20 lg:mr-28"

                return (
                  <article
                    key={feature.key}
                    data-feature-index={index}
                    data-feature-key={feature.key}
                    className={`group relative overflow-visible bg-transparent px-2 py-2 transition duration-500 ${articleOffsetClass}`}
                  >
                    <div
                      aria-hidden="true"
                      className={`pointer-events-none absolute top-0 h-[6rem] w-[5.8rem] font-mono tabular-nums leading-none md:h-[9rem] md:w-[8.6rem] lg:h-[11rem] lg:w-[10.4rem] ${
                        isRightAligned ? "left-0" : "right-0"
                      }`}
                    >
                      <span className="absolute top-[0.45rem] left-0 font-sans text-[4.35rem] tracking-[-0.08em] text-foreground/[0.025] md:top-[0.7rem] md:text-[6.45rem] lg:top-[0.8rem] lg:text-[7.85rem]">
                        {leadingDigit}
                      </span>
                      <span className="absolute top-0 -right-[0.35rem] text-[6rem] tracking-[-0.08em] text-foreground/[0.06] md:-right-[0.5rem] md:text-[9rem] lg:-right-[0.7rem] lg:text-[11rem]">
                        {trailingDigit}
                      </span>
                      <span
                        className={`absolute bottom-[0.35rem] h-px w-[3.25rem] bg-foreground/[0.08] md:bottom-[0.5rem] md:w-[4.75rem] lg:bottom-[0.7rem] lg:w-[5.75rem] ${
                          isRightAligned ? "left-0" : "right-0"
                        }`}
                      />
                    </div>

                    <div className={`relative flex min-h-[16rem] flex-col justify-between gap-10 ${contentAlignClass} md:min-h-[19rem]`}>
                      <div className={`flex max-w-4xl flex-1 flex-col ${contentAlignClass}`}>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--jw-surface-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--jw-muted)]">
                          {(() => {
                            const Icon = featureIcons[feature.key]
                            return <Icon className="h-3.5 w-3.5 text-[var(--jw-accent)]" />
                          })()}
                          <span>{t(`landing.features.${feature.key}.eyebrow`)}</span>
                        </div>
                        <h3
                          data-feature-title={index}
                          className="max-w-[16ch] font-serif text-4xl leading-[0.95] tracking-[-0.04em] md:text-6xl lg:text-7xl"
                        >
                          {t(`landing.features.${feature.key}.title`)}
                        </h3>
                        <p
                          className={`mt-8 max-w-[30rem] text-base leading-relaxed text-muted-foreground/72 transition-all duration-700 ease-out md:text-lg ${
                            isVisible
                              ? "translate-y-0 opacity-100"
                              : "translate-y-8 opacity-0"
                          }`}
                        >
                          {t(`landing.features.${feature.key}.desc`)}
                        </p>
                      </div>

                    </div>
                  </article>
                )
              })}
          </div>
        </div>
      </section>

      <section id="start-writing" className="jw-cta-band relative mx-4 my-16 overflow-hidden rounded-[28px] border px-6 py-16 shadow-[var(--jw-card-shadow)] md:mx-10 md:px-12 lg:px-16">
        <div className="jw-cta-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-semibold text-[var(--jw-cta-text)]">
              <SparklesIcon className="h-4 w-4" />
              {t("landing.ctaVisual.badge")}
            </div>
            <h2 className="mb-4 max-w-xl font-serif text-4xl leading-tight tracking-tight text-[var(--jw-cta-text)] sm:text-5xl">
              {t("landing.ctaHeading")}
            </h2>
            <p className="mb-8 max-w-lg text-base leading-7 text-[var(--jw-cta-text)] opacity-75">
              {t("landing.ctaSubtitle")}
            </p>
            <Button
              size="lg"
              className="rounded-full bg-[var(--jw-surface-strong)] px-6 text-[var(--jw-heading)] hover:bg-white"
              asChild
            >
              <Link href="/articles">
                {t("landing.ctaCta")}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="relative">
            <div className="jw-cta-orbit pointer-events-none absolute -inset-5 rounded-[30px]" />
            <div className="jw-cta-showcase relative rounded-[24px] border border-white/15 bg-white/10 p-5 text-[var(--jw-cta-text)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                    {t("landing.ctaVisual.label")}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold">
                    {t("landing.ctaVisual.title")}
                  </h3>
                </div>
                <span className="jw-live-pill rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  {t("landing.workflow.live")}
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {ctaSignals.map((signal, index) => (
                  <div
                    key={signal.key}
                    className="jw-cta-signal flex items-center justify-between rounded-xl border border-white/10 bg-white/10 px-4 py-3"
                    style={{ animationDelay: `${index * 0.12}s` }}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className="h-2 w-2 rounded-full bg-[#ffd66b]" />
                      {signal.label}
                    </span>
                    <span className="font-mono text-xs opacity-70">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7 rounded-2xl border border-white/10 bg-black/10 p-4">
                <div className="mb-3 flex justify-between text-xs opacity-75">
                  <span>{t("landing.ctaVisual.progressLabel")}</span>
                  <span>{t("landing.ctaVisual.progressValue")}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/15">
                  <div className="jw-cta-progress h-full rounded-full bg-[#ffd66b]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="jw-app-header border-t px-4 py-6 sm:px-6 md:px-10">
        <div className="flex items-center justify-between gap-4">
          <BrandLogo showWordmark={false} compact />

          <div className="hidden items-center gap-6 md:flex">
            <Link
              href={privacyPolicyHref}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("landing.footer.privacyPolicy")}
            </Link>
            <Link
              href={termsOfUseHref}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("landing.footer.termsOfUse")}
            </Link>
            <span className="text-xs text-muted-foreground">
              {t("landing.footer.version")}
            </span>
          </div>

          <div className="md:hidden">
            <Accordion type="single" collapsible>
              <AccordionItem value="footer-links" className="border-b-0">
                <AccordionTrigger className="py-2 text-sm font-medium no-underline hover:no-underline">
                  {t("landing.footer.more")}
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="flex flex-col items-end gap-3">
                    <Link
                      href={privacyPolicyHref}
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {t("landing.footer.privacyPolicy")}
                    </Link>
                    <Link
                      href={termsOfUseHref}
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {t("landing.footer.termsOfUse")}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {t("landing.footer.version")}
                    </span>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </footer>

    </div>
  )
}
