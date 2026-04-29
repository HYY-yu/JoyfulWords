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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/base/sheet"
import { BrandLogo } from "@/components/brand/brand-logo"
import { persistLocalePreference, useTranslation } from "@/lib/i18n/i18n-context"
import { buildLocalizedPath } from "@/lib/i18n/route-locale"
import { CookieBannerProvider } from "@/components/cookie-banner/cookie-banner-provider"

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
    <div className="overflow-x-hidden bg-[#fbf7ec] text-[#221f1a]">
      <header className="fixed top-0 right-0 left-0 z-50 flex h-16 items-center gap-3 border-b border-[#ded4c4]/80 bg-[#fffdf7]/90 px-4 shadow-[0_10px_28px_-24px_rgba(84,64,38,0.45)] backdrop-blur-2xl sm:px-6 md:px-10">
        <BrandLogo />
        <div className="flex-1" />

        <div className="hidden items-center gap-3 md:flex">
          <button
            onClick={() => {
              const nextLocale = locale === "zh" ? "en" : "zh"
              persistLocalePreference(nextLocale)
              router.replace(buildLocalizedPath(nextLocale))
            }}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-[#6b6255] transition-all hover:bg-[#f4eee1] hover:text-[#221f1a]"
          >
            <Globe className="h-4 w-4" />
            {locale === "zh" ? "EN" : "中文"}
          </button>
          <a
            href="#features"
            className="rounded-full px-3.5 py-1.5 text-sm text-[#6b6255] transition-all hover:bg-[#f4eee1] hover:text-[#221f1a]"
          >
            {t("landing.nav.features")}
          </a>
          <Link
            href={blogHref}
            className="rounded-full px-3.5 py-1.5 text-sm text-[#6b6255] transition-all hover:bg-[#f4eee1] hover:text-[#221f1a]"
          >
            {t("landing.nav.blog")}
          </Link>
          <Button variant="outline" size="sm" className="rounded-full border-[#ded4c4] bg-[#fffdf7] shadow-sm" asChild>
            <Link href="/articles">{t("landing.nav.myArticles")}</Link>
          </Button>
          <Button size="sm" className="rounded-full bg-teal-700 text-white shadow-[0_12px_24px_-18px_rgba(15,118,110,0.8)] hover:bg-teal-800" asChild>
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
              className="md:hidden"
              aria-label={t("landing.nav.menu")}
            >
              <MenuIcon className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="gap-0">
            <SheetHeader className="pb-2">
              <SheetTitle>{t("landing.nav.menu")}</SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col gap-1 px-4 pb-6">
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
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_20%,rgba(255,214,107,0.24),transparent_30%),radial-gradient(circle_at_80%_12%,rgba(20,184,166,0.16),transparent_32%),linear-gradient(180deg,#fffdf7_0%,#fbf7ec_58%,#f5efe3_100%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.22] [background-image:radial-gradient(circle_at_1px_1px,rgba(93,75,47,0.22)_1px,transparent_0)] [background-size:30px_30px]" />

        <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="text-center lg:text-left">
            <div className="animate-fade-up mb-7 inline-flex items-center gap-2 rounded-full border border-teal-700/18 bg-teal-50/90 px-4 py-1.5 text-[13px] font-semibold text-teal-800 shadow-[0_12px_28px_-24px_rgba(15,118,110,0.8)]">
              <SparklesIcon className="h-3.5 w-3.5 text-[#d89916]" />
              {t("landing.badge")}
            </div>

            <h1 className="animate-fade-up animate-delay-1 mb-6 font-serif text-5xl leading-[1.08] tracking-tight text-[#16130f] md:text-7xl lg:text-[88px]">
              {t("landing.heading")}
              <br />
              <em className="not-italic text-teal-700">{t("landing.headingAccent")}</em>
            </h1>

            <p className="animate-fade-up animate-delay-2 mx-auto mb-9 max-w-xl text-lg leading-relaxed text-[#6b6255] lg:mx-0">
              {t("landing.description")}
            </p>

            <div className="animate-fade-up animate-delay-3 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Button size="lg" className="rounded-full bg-teal-700 px-6 text-white shadow-[0_16px_30px_-20px_rgba(15,118,110,0.9)] hover:bg-teal-800" asChild>
                <Link href="/articles">
                  <SparklesIcon className="h-4 w-4" />
                  {t("landing.cta")}
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="rounded-full border-[#ded4c4] bg-[#fffdf7]/90 px-6 shadow-sm" asChild>
                <Link href="/articles">
                  {t("landing.viewArticles")}
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="animate-fade-up animate-delay-4 mt-12 grid w-full max-w-xl grid-cols-3 overflow-hidden rounded-xl border border-[#ded4c4] bg-[#fffdf7]/86 shadow-[0_20px_60px_-44px_rgba(84,64,38,0.55)]">
              {stats.map((stat) => (
                <div key={stat.label} className="border-r border-[#ded4c4]/80 px-4 py-4 text-center last:border-r-0">
                  <div className="font-serif text-2xl tracking-tight text-[#16130f] sm:text-[28px]">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs text-[#7a7165]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-fade-up animate-delay-2 relative mx-auto w-full max-w-xl">
            <div className="absolute -left-4 top-10 h-20 w-20 rounded-full bg-[#ffd66b]/40 blur-2xl" />
            <div className="absolute -right-4 bottom-12 h-24 w-24 rounded-full bg-teal-300/25 blur-2xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-[#ded4c4] bg-[#fffdf7]/88 p-4 shadow-[0_32px_80px_-46px_rgba(84,64,38,0.58)] backdrop-blur">
              <div className="rounded-2xl border border-[#e5dbc9] bg-[#fbf7ec] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-700 text-white">
                      <FilePenLineIcon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">Article Canvas</p>
                      <p className="text-xs text-[#7a7165]">Material → Draft → Visual</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#e9fff7] px-2.5 py-1 text-xs font-semibold text-teal-800">
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
                        <div key={item.label} className="flex items-center gap-3 rounded-xl border border-[#e5dbc9] bg-[#fffdf7] p-3">
                          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.color}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="text-sm font-medium text-[#342f27]">{item.label}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="rounded-xl border border-[#e5dbc9] bg-[#fffef9] p-4">
                    <div className="mb-3 h-3 w-2/3 rounded-full bg-[#d8cdbb]" />
                    <div className="space-y-2">
                      <div className="h-2.5 rounded-full bg-[#eee6d7]" />
                      <div className="h-2.5 w-10/12 rounded-full bg-[#eee6d7]" />
                      <div className="h-2.5 w-8/12 rounded-full bg-[#eee6d7]" />
                    </div>
                    <div className="mt-5 rounded-lg border-l-4 border-teal-600 bg-teal-50/70 p-3 text-sm text-teal-900">
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
        className="border-t border-[#ded4c4]/80 bg-[#fffdf7] px-6 py-24 md:px-10"
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
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#fbf7ec] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7165]">
                          {(() => {
                            const Icon = featureIcons[feature.key]
                            return <Icon className="h-3.5 w-3.5 text-teal-700" />
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

      <section className="relative mx-4 my-16 overflow-hidden rounded-[28px] border border-teal-700/15 bg-teal-800 px-6 py-20 text-center shadow-[0_30px_80px_-48px_rgba(15,118,110,0.8)] md:mx-10 md:px-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,214,107,.28),transparent_28%),radial-gradient(circle_at_78%_68%,rgba(45,212,191,.26),transparent_34%)]" />
        <div className="relative">
          <h2 className="mb-4 font-serif text-5xl tracking-tight text-[#fffdf7]">
            {t("landing.ctaHeading")}
          </h2>
          <p className="mb-9 text-base text-teal-50/75">
            {t("landing.ctaSubtitle")}
          </p>
          <Button
            size="lg"
            className="rounded-full bg-[#fffdf7] text-teal-900 hover:bg-white"
            asChild
          >
            <Link href="/articles">
              {t("landing.ctaCta")}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-[#ded4c4]/80 bg-[#fffdf7] px-4 py-6 sm:px-6 md:px-10">
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

      <CookieBannerProvider />
    </div>
  )
}
