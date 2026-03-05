"use client"

import Link from "next/link"
import {
  Sparkles,
  Gem,
  Target,
  Square,
  LayoutGrid,
  MessageSquareMore,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/base/button"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { CookieBannerProvider } from "@/components/cookie-banner/cookie-banner-provider"

const featureKeys = [
  { key: "aiWriting", icon: Sparkles, color: "text-blue-600", bg: "bg-blue-600/10", border: "border-blue-600/20", num: "01" },
  { key: "imageGen", icon: Gem, color: "text-violet-600", bg: "bg-violet-600/10", border: "border-violet-600/20", num: "02" },
  { key: "seoGeo", icon: Target, color: "text-green-600", bg: "bg-green-600/10", border: "border-green-600/20", num: "03" },
  { key: "knowledgeCards", icon: Square, color: "text-amber-600", bg: "bg-amber-600/10", border: "border-amber-600/20", num: "04" },
  { key: "materialSearch", icon: LayoutGrid, color: "text-cyan-600", bg: "bg-cyan-600/10", border: "border-cyan-600/20", num: "05" },
  { key: "competitors", icon: MessageSquareMore, color: "text-red-600", bg: "bg-red-600/10", border: "border-red-600/20", num: "06" },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-bold text-white">
        J
      </div>
      <span className="text-base font-semibold tracking-tight">
        JoyfulWords
      </span>
    </div>
  )
}

export default function LandingPage() {
  const { t, locale, setLocale } = useTranslation()

  const stats = [
    { value: t("landing.stats.speed"), label: t("landing.stats.speedLabel") },
    { value: t("landing.stats.tools"), label: t("landing.stats.toolsLabel") },
    { value: t("landing.stats.seo"), label: t("landing.stats.seoLabel") },
  ]

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

      <section id="features" className="border-t bg-card px-10 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14">
            <div className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
              {t("landing.featuresLabel")}
            </div>
            <h2 className="font-serif text-4xl leading-tight tracking-tight">
              {t("landing.featuresHeading")}<em className="text-primary">{t("landing.featuresHeadingAccent")}</em>
            </h2>
          </div>

          <div className="overflow-hidden rounded-2xl bg-border">
            <div className="grid grid-cols-1 gap-px md:grid-cols-3">
              {featureKeys.map((f) => {
                const Icon = f.icon
                return (
                  <div
                    key={f.num}
                    className="bg-card p-9 transition hover:bg-background"
                  >
                    <div
                      className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg border ${f.bg} ${f.border}`}
                    >
                      <Icon className={`h-[17px] w-[17px] ${f.color}`} />
                    </div>
                    <div className="mb-1.5 text-xs tracking-widest text-muted-foreground">
                      {f.num}
                    </div>
                    <div className="mb-2 text-base font-semibold">
                      {t(`landing.features.${f.key}.title`)}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {t(`landing.features.${f.key}.desc`)}
                    </p>
                  </div>
                )
              })}
            </div>
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
