"use client"

import Link from "next/link"
import {
  Sparkles,
  Globe,
  ImagePlus,
  Library,
  PanelsTopLeft,
  Radar,
  ScanSearch,
} from "lucide-react"
import { Button } from "@/components/ui/base/button"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { CookieBannerProvider } from "@/components/cookie-banner/cookie-banner-provider"

const featureKeys = [
  {
    key: "aiWriting",
    icon: Sparkles,
    num: "01",
    variant: "hero",
    gridClass: "md:col-span-7",
    heightClass: "min-h-[22rem]",
    iconClass: "text-blue-700",
    iconWrapClass: "border-blue-500/20 bg-blue-500/12",
    cardClass:
      "border-blue-500/18 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))]",
    accentClass: "from-blue-500/14 via-sky-500/10 to-transparent",
  },
  {
    key: "materialSearch",
    icon: Library,
    num: "02",
    variant: "hero",
    gridClass: "md:col-span-5",
    heightClass: "min-h-[22rem] md:translate-y-8",
    iconClass: "text-emerald-700",
    iconWrapClass: "border-emerald-500/20 bg-emerald-500/12",
    cardClass:
      "border-emerald-500/18 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_40%),linear-gradient(160deg,rgba(255,255,255,0.98),rgba(244,251,247,0.94))]",
    accentClass: "from-emerald-500/16 via-teal-500/10 to-transparent",
  },
  {
    key: "imageGen",
    icon: ImagePlus,
    num: "03",
    variant: "standard",
    gridClass: "md:col-span-3",
    heightClass: "min-h-[15rem] md:-translate-y-5",
    iconClass: "text-fuchsia-700",
    iconWrapClass: "border-fuchsia-500/20 bg-fuchsia-500/12",
    cardClass:
      "border-fuchsia-500/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,247,255,0.94))]",
    accentClass: "from-fuchsia-500/16 to-transparent",
  },
  {
    key: "knowledgeCards",
    icon: PanelsTopLeft,
    num: "04",
    variant: "standard",
    gridClass: "md:col-span-3",
    heightClass: "min-h-[17rem] md:translate-y-6",
    iconClass: "text-amber-700",
    iconWrapClass: "border-amber-500/20 bg-amber-500/12",
    cardClass:
      "border-amber-500/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,251,240,0.95))]",
    accentClass: "from-amber-500/16 to-transparent",
  },
  {
    key: "seoGeo",
    icon: Radar,
    num: "05",
    variant: "standard",
    gridClass: "md:col-span-3",
    heightClass: "min-h-[16rem] md:-translate-y-2",
    iconClass: "text-cyan-700",
    iconWrapClass: "border-cyan-500/20 bg-cyan-500/12",
    cardClass:
      "border-cyan-500/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(242,251,253,0.95))]",
    accentClass: "from-cyan-500/16 to-transparent",
  },
  {
    key: "competitors",
    icon: ScanSearch,
    num: "06",
    variant: "standard",
    gridClass: "md:col-span-3",
    heightClass: "min-h-[18rem] md:translate-y-10",
    iconClass: "text-rose-700",
    iconWrapClass: "border-rose-500/20 bg-rose-500/12",
    cardClass:
      "border-rose-500/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,245,246,0.95))]",
    accentClass: "from-rose-500/16 to-transparent",
  },
] as const

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

      <section
        id="features"
        className="border-t bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(255,255,255,1))] px-6 py-24 md:px-10"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 max-w-2xl">
            <div className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
              {t("landing.featuresLabel")}
            </div>
            <h2 className="font-serif text-4xl leading-tight tracking-tight">
              {t("landing.featuresHeading")}<em className="text-primary">{t("landing.featuresHeadingAccent")}</em>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {t("landing.featuresSubheading")}
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-white/80 p-3 shadow-[0_24px_80px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.07),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.08),transparent_26%)]" />
            <div className="relative grid grid-cols-1 gap-3 md:grid-cols-12">
              {featureKeys.map((feature) => {
                const Icon = feature.icon
                const isHero = feature.variant === "hero"

                return (
                  <article
                    key={feature.key}
                    className={`${feature.gridClass} ${feature.heightClass} group relative overflow-hidden rounded-[1.75rem] border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] md:p-7 ${feature.cardClass}`}
                  >
                    <div className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${feature.accentClass}`} />
                    <div className="pointer-events-none absolute top-5 right-5 h-24 w-24 rounded-full border border-white/60 bg-white/30 blur-2xl" />
                    <div className="pointer-events-none absolute -right-10 bottom-0 h-28 w-28 rounded-full border border-black/5 bg-white/60" />

                    <div className="relative flex h-full flex-col">
                      <div className="flex items-start justify-between gap-4">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl border backdrop-blur-sm ${feature.iconWrapClass}`}
                        >
                          <Icon className={`h-5 w-5 ${feature.iconClass}`} />
                        </div>
                        <div className="text-[11px] font-medium tracking-[0.26em] text-muted-foreground/80">
                          {feature.num}
                        </div>
                      </div>

                      <div className={`mt-8 flex-1 ${isHero ? "max-w-md" : ""}`}>
                        <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground/80">
                          {t(`landing.features.${feature.key}.eyebrow`)}
                        </div>
                        <h3 className={isHero ? "text-2xl font-semibold tracking-tight md:text-[2rem]" : "text-lg font-semibold tracking-tight"}>
                          {t(`landing.features.${feature.key}.title`)}
                        </h3>
                        <p className={`mt-3 leading-relaxed text-muted-foreground ${isHero ? "max-w-sm text-[15px]" : "text-sm"}`}>
                          {t(`landing.features.${feature.key}.desc`)}
                        </p>
                      </div>

                      <div className={`mt-6 flex items-center justify-between ${isHero ? "text-sm" : "text-xs"} text-muted-foreground`}>
                        <span>{t(`landing.features.${feature.key}.highlight`)}</span>
                        <span className="rounded-full border border-black/5 bg-white/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-foreground/70">
                          {isHero ? t("landing.featuresBadgePrimary") : t("landing.featuresBadgeSupport")}
                        </span>
                      </div>
                    </div>
                  </article>
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
