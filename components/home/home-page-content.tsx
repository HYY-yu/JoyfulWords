"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Globe, MenuIcon } from "lucide-react"
import { Button } from "@/components/ui/base/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/base/accordion"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/base/sheet"
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

function Logo({ showWordmark = true }: { showWordmark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/logo.jpeg"
        alt="JoyfulWords logo"
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 rounded-sm object-cover"
      />
      {showWordmark ? (
        <span className="text-base font-semibold tracking-tight">
          JoyfulWords
        </span>
      ) : null}
    </div>
  )
}

export function HomePageContent() {
  const router = useRouter()
  const { t, locale } = useTranslation()
  const [visibleFeatures, setVisibleFeatures] = useState<Record<string, boolean>>({})
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const blogHref = buildLocalizedPath(locale, "/blog")
  const mcpHref = buildLocalizedPath(locale, "/mcp")

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
    <div className="overflow-x-hidden">
      <header className="fixed top-0 right-0 left-0 z-50 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-2xl sm:px-6 md:px-10">
        <Logo />
        <div className="flex-1" />

        <div className="hidden items-center gap-3 md:flex">
          <button
            onClick={() => {
              const nextLocale = locale === "zh" ? "en" : "zh"
              persistLocalePreference(nextLocale)
              router.replace(buildLocalizedPath(nextLocale))
            }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
          >
            <Globe className="h-4 w-4" />
            {locale === "zh" ? "EN" : "中文"}
          </button>
          <a
            href="#features"
            className="rounded-lg px-3.5 py-1.5 text-sm text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
          >
            {t("landing.nav.features")}
          </a>
          <Link
            href={mcpHref}
            className="rounded-lg px-3.5 py-1.5 text-sm text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
          >
            {t("landing.nav.mcp")}
          </Link>
          <Link
            href={blogHref}
            className="rounded-lg px-3.5 py-1.5 text-sm text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
          >
            {t("landing.nav.blog")}
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href="/articles">{t("landing.nav.myArticles")}</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/articles">{t("landing.nav.startCreating")}</Link>
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

      <section className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgba(37,99,235,.07)_0%,transparent_70%),radial-gradient(ellipse_60%_40%_at_85%_60%,rgba(124,58,237,.05)_0%,transparent_60%)] px-6 pt-14 pb-20 text-center">
        <div className="animate-fade-up mb-7 inline-flex items-center gap-2 rounded-full border border-blue-600/20 bg-blue-600/10 px-4 py-1.5 text-[13px] font-medium text-blue-600">
          <span>✦</span> {t("landing.badge")}
        </div>

        <h1 className="animate-fade-up animate-delay-1 mb-6 font-serif text-6xl leading-tight tracking-tight md:text-7xl lg:text-8xl">
          {t("landing.heading")}
          <br />
          <em className="text-primary">{t("landing.headingAccent")}</em>
        </h1>

        <p className="animate-fade-up animate-delay-2 mb-10 max-w-lg text-lg leading-relaxed text-muted-foreground">
          {t("landing.description")}
        </p>

        <div className="animate-fade-up animate-delay-3 flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/articles">
              <span>✦</span> {t("landing.cta")}
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/articles">{t("landing.viewArticles")}</Link>
          </Button>
        </div>

        <div className="animate-fade-up animate-delay-4 mt-14 w-full max-w-md overflow-hidden rounded-2xl border bg-white shadow-[0_4px_32px_rgba(0,0,0,.06)] sm:mt-16 sm:max-w-2xl md:max-w-3xl">
          <div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {stats.map((stat) => (
              <div key={stat.label} className="px-6 py-5 text-center sm:px-8 sm:py-6 md:px-11">
                <div className="font-serif text-2xl tracking-tight sm:text-[28px]">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="features"
        className="border-t bg-background px-6 py-24 md:px-10"
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
                        <div className="mb-4 text-[11px] font-medium uppercase tracking-[0.34em] text-muted-foreground/75">
                          {t(`landing.features.${feature.key}.eyebrow`)}
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

      <section className="relative mx-10 my-16 overflow-hidden rounded-2xl bg-foreground px-16 py-20 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_50%,rgba(37,99,235,.2)_0%,transparent_70%)]" />
        <div className="relative">
          <h2 className="mb-4 font-serif text-5xl tracking-tight text-white">
            {t("landing.ctaHeading")}
          </h2>
          <p className="mb-9 text-base text-white/50">
            {t("landing.ctaSubtitle")}
          </p>
          <Button
            size="lg"
            className="bg-white text-foreground hover:bg-white/90"
            asChild
          >
            <Link href="/articles">{t("landing.ctaCta")}</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t px-4 py-6 sm:px-6 md:px-10">
        <div className="flex items-center justify-between gap-4">
          <Logo showWordmark={false} />

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
