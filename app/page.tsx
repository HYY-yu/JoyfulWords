"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/base/button"
import { useTranslation } from "@/lib/i18n/i18n-context"
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

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/logo.jpeg"
        alt="JoyfulWords logo"
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 rounded-sm object-cover"
      />
      <span className="text-base font-semibold tracking-tight">
        JoyfulWords
      </span>
    </div>
  )
}

export default function LandingPage() {
  const { t, locale, setLocale } = useTranslation()
  const [visibleFeatures, setVisibleFeatures] = useState<Record<string, boolean>>({})

  const stats = [
    { value: t("landing.stats.speed"), label: t("landing.stats.speedLabel") },
    { value: t("landing.stats.tools"), label: t("landing.stats.toolsLabel") },
    { value: t("landing.stats.seo"), label: t("landing.stats.seoLabel") },
  ]

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
      <header className="fixed top-0 right-0 left-0 z-50 flex h-14 items-center gap-3 border-b bg-background/90 px-10 backdrop-blur-2xl">
        <Logo />
        <div className="flex-1" />
        <button
          onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
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
          href="/blog"
          className="rounded-lg px-3.5 py-1.5 text-sm text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
        >
          {t("landing.nav.blog")}
        </Link>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">{t("landing.nav.myArticles")}</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/dashboard">{t("landing.nav.startCreating")}</Link>
        </Button>
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
            <Link href="/dashboard">
              <span>✦</span> {t("landing.cta")}
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/dashboard">{t("landing.viewArticles")}</Link>
          </Button>
        </div>

        <div className="animate-fade-up animate-delay-4 mt-16 flex overflow-hidden rounded-2xl border bg-white shadow-[0_4px_32px_rgba(0,0,0,.06)]">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`px-11 py-6 text-center ${i < stats.length - 1 ? "border-r" : ""}`}
            >
              <div className="font-serif text-[28px] tracking-tight">
                {stat.value}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
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

                      <div
                        className={`w-full text-sm text-muted-foreground transition-all duration-700 ease-out ${
                          isVisible
                            ? "translate-y-0 opacity-100"
                            : "translate-y-10 opacity-0"
                        }`}
                      >
                        <span className="max-w-xl text-muted-foreground/80">
                          {t(`landing.features.${feature.key}.highlight`)}
                        </span>
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
            <Link href="/dashboard">{t("landing.ctaCta")}</Link>
          </Button>
        </div>
      </section>

      <footer className="flex items-center justify-between border-t px-10 py-6">
        <Logo />
        <div className="flex items-center gap-6">
          <Link href="/privacy-policy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {t("landing.footer.privacyPolicy")}
          </Link>
          <Link href="/terms-of-use" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {t("landing.footer.termsOfUse")}
          </Link>
          <span className="text-xs text-muted-foreground">
            {t("landing.footer.version")}
          </span>
        </div>
      </footer>

      <CookieBannerProvider />
    </div>
  )
}
