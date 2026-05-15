"use client"

import { useEffect, useState } from "react"
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

export function HomePageContent() {
  const router = useRouter()
  const { t, locale } = useTranslation()
  const [visibleFeatures, setVisibleFeatures] = useState<Record<string, boolean>>({})
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const blogHref = buildLocalizedPath(locale, "/blog")
  const mcpHref = buildLocalizedPath(locale, "/mcp")
  const pricingHref = buildLocalizedPath(locale, "/pricing")
  const toolsHref = buildLocalizedPath(locale, "/tools")

  const stats = [
    { value: t("landing.stats.speed"), label: t("landing.stats.speedLabel") },
    { value: t("landing.stats.tools"), label: t("landing.stats.toolsLabel") },
    { value: t("landing.stats.seo"), label: t("landing.stats.seoLabel") },
  ]
  const privacyPolicyHref = buildLocalizedPath(locale, "/privacy-policy")
  const termsOfUseHref = buildLocalizedPath(locale, "/terms-of-use")

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-feature-key]")

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return

          const key = entry.target.getAttribute("data-feature-key")
          if (!key) return

          setVisibleFeatures((current) => {
            if (current[key]) return current
            return { ...current, [key]: true }
          })

          observer.unobserve(entry.target)
        })
      },
      {
        threshold: 0.35,
        rootMargin: "0px 0px -12% 0px",
      }
    )

    elements.forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [])

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
            href={toolsHref}
            className="jw-themed-link rounded-full px-3.5 py-1.5 text-sm"
          >
            {t("landing.nav.tools")}
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
                href={toolsHref}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-foreground/85 hover:bg-accent hover:text-foreground"
              >
                {t("landing.nav.tools")}
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

          <div className="animate-fade-up animate-delay-2 relative mx-auto w-full max-w-xl">
            <div className="absolute -left-4 top-10 h-20 w-20 rounded-full bg-[#ffd66b]/40 blur-2xl" />
            <div className="absolute -right-4 bottom-12 h-24 w-24 rounded-full bg-teal-300/25 blur-2xl" />
            <div className="jw-surface-card relative overflow-hidden rounded-[28px] border p-4 backdrop-blur">
              <div className="jw-surface-muted rounded-2xl border p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--jw-accent)] text-[var(--jw-accent-foreground)]">
                      <FilePenLineIcon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">Article Canvas</p>
                      <p className="jw-muted-text text-xs">Material → Draft → Visual</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[var(--jw-accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--jw-accent)]">
                    Live
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
                  <div className="space-y-3">
                    {[
                      { icon: LibraryBigIcon, label: t("landing.features.materialSearch.title"), color: "bg-[#dcfce7] text-emerald-700" },
                      { icon: WandSparklesIcon, label: t("landing.features.aiWriting.title"), color: "bg-[#fef3c7] text-amber-700" },
                      { icon: ImagePlusIcon, label: t("landing.features.imageGen.title"), color: "bg-[#fce7f3] text-pink-700" },
                    ].map((item) => {
                      const Icon = item.icon
                      return (
                        <div key={item.label} className="jw-surface-strong flex items-center gap-3 rounded-xl border p-3">
                          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.color}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="text-sm font-medium text-[var(--jw-heading)]">{item.label}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="jw-surface-strong rounded-xl border p-4">
                    <div className="mb-3 h-3 w-2/3 rounded-full bg-[var(--jw-border)]" />
                    <div className="space-y-2">
                      <div className="h-2.5 rounded-full bg-[var(--jw-surface-muted)]" />
                      <div className="h-2.5 w-10/12 rounded-full bg-[var(--jw-surface-muted)]" />
                      <div className="h-2.5 w-8/12 rounded-full bg-[var(--jw-surface-muted)]" />
                    </div>
                    <div className="mt-5 rounded-lg border-l-4 border-[var(--jw-accent)] bg-[var(--jw-accent-soft)] p-3 text-sm text-[var(--jw-heading)]">
                      {t("landing.featuresSubheading")}
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
        className="border-t border-[var(--jw-border)] bg-[var(--jw-surface-strong)] px-6 py-24 md:px-10"
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

          <div className="relative space-y-10 md:space-y-14">
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
                        <h3 className="max-w-[16ch] font-serif text-4xl leading-[0.95] tracking-[-0.04em] md:text-6xl lg:text-7xl">
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

      <section className="jw-cta-band relative mx-4 my-16 overflow-hidden rounded-[28px] border px-6 py-20 text-center shadow-[var(--jw-card-shadow)] md:mx-10 md:px-16">
        <div className="pointer-events-none absolute inset-0 opacity-80" />
        <div className="relative">
          <h2 className="mb-4 font-serif text-5xl tracking-tight text-[var(--jw-cta-text)]">
            {t("landing.ctaHeading")}
          </h2>
          <p className="mb-9 text-base text-[var(--jw-cta-text)] opacity-75">
            {t("landing.ctaSubtitle")}
          </p>
          <Button
            size="lg"
            className="rounded-full bg-[var(--jw-surface-strong)] text-[var(--jw-heading)] hover:bg-white"
            asChild
          >
            <Link href="/articles">
              {t("landing.ctaCta")}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </Button>
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
