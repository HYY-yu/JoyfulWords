"use client"

import Link from "next/link"
import { ArrowRightIcon, PlayIcon, SparklesIcon } from "lucide-react"

import { FeatureVideo } from "@/components/home/sections/feature-video"
import { PosterPreview } from "@/components/home/sections/product-preview"
import { Button } from "@/components/ui/base/button"
import { trackProductEvent } from "@/lib/analytics/client"
import { PRODUCT_ANALYTICS_EVENTS } from "@/lib/analytics/events"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { cn } from "@/lib/utils"
import { LANDING_POSTER_BASE, LANDING_VIDEO_BASE } from "@/components/home/sections/landing-media"

const statKeys = ["subscription", "workflow", "credit"] as const

export function HeroSection() {
  const { t, locale } = useTranslation()

  return (
    <section className="relative isolate scroll-mt-16 overflow-hidden px-5 pt-[5.5rem] pb-12 md:px-10 md:pt-[9.5rem] md:pb-16">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--jw-hero-bg)" }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.15] [background-image:radial-gradient(circle_at_1px_1px,color-mix(in_srgb,var(--jw-accent)_18%,transparent)_1px,transparent_0)] [background-size:28px_28px]" aria-hidden="true" />

      <div className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
        <div className="min-w-0">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--jw-border)] bg-[var(--jw-accent-soft)] px-3.5 py-1.5 text-xs font-semibold text-[var(--jw-accent)] shadow-[var(--jw-soft-shadow)] md:mb-6 md:px-4 md:text-[13px]">
            <SparklesIcon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            {t("landing.badge")}
          </div>

          <h1
            aria-label={`${t("landing.heading")} ${t("landing.headingAccent")} ${t("landing.headingAccentSuffix")}`}
            className={cn(
              "font-serif leading-[1.15] font-semibold tracking-[-0.025em] text-[var(--jw-heading)] md:leading-[1.12]",
              locale === "zh"
                ? "max-w-[14ch] text-[2.15rem] sm:text-[2.8rem] md:text-[3.875rem]"
                : "max-w-[20ch] text-[2rem] sm:text-[2.5rem] md:text-[3.2rem]"
            )}
          >
            {t("landing.heading")}
            <span className="block text-[var(--jw-accent)]">{t("landing.headingAccent")}</span>
            <span className="block text-[var(--jw-accent)]">{t("landing.headingAccentSuffix")}</span>
          </h1>

          <p className="mt-4 max-w-[34rem] text-[14.5px] leading-[1.8] text-[var(--jw-muted)] md:mt-6 md:text-[17px]">
            {t("landing.description")}
          </p>

          <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap md:mt-8">
            <Button size="lg" className="jw-primary-button h-12 rounded-full px-5 text-sm sm:px-6 md:text-base" asChild>
              <Link
                href="/articles"
                prefetch={false}
                onClick={() =>
                  trackProductEvent(PRODUCT_ANALYTICS_EVENTS.LANDING_PRIMARY_CTA_CLICKED, {
                    section: "hero",
                  })
                }
              >
                <SparklesIcon className="size-4" strokeWidth={1.75} aria-hidden="true" />
                {t("landing.cta")}
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="jw-secondary-button h-12 rounded-full px-5 text-sm sm:px-6 md:text-base" asChild>
              <a
                href="#hero-demo"
                onClick={() =>
                  trackProductEvent(PRODUCT_ANALYTICS_EVENTS.LANDING_DEMO_CTA_CLICKED, {
                    section: "hero",
                  })
                }
              >
                <PlayIcon className="size-4" fill="currentColor" strokeWidth={1.5} aria-hidden="true" />
                {t("landing.watchDemo")}
              </a>
            </Button>
          </div>

          <div className="mt-6 grid max-w-[35rem] grid-cols-3 overflow-hidden rounded-xl border border-[var(--jw-border)] bg-[var(--jw-surface)] shadow-[var(--jw-card-shadow)] md:mt-10 md:rounded-2xl">
            {statKeys.map((key) => (
              <div key={key} className="border-r border-[var(--jw-border)] px-2 py-3 text-center last:border-r-0 md:px-3 md:py-4">
                <strong className="block font-serif text-lg font-semibold tracking-tight text-[var(--jw-heading)] md:text-2xl">
                  {t(`landing.stats.${key}.value`)}
                </strong>
                <span className="mt-1 block text-[10px] leading-4 text-[var(--jw-muted)] md:text-xs md:leading-5">
                  {t(`landing.stats.${key}.label`)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div id="hero-demo" className="scroll-mt-24">
          <FeatureVideo
            srcBase={`${LANDING_VIDEO_BASE}/hero-overview`}
            posterBase={`${LANDING_POSTER_BASE}/hero-overview`}
            label={t("landing.media.heroLabel")}
            chromeLabel="joyword.link / workspace"
            preload="metadata"
            analytics="hero"
            stageClassName="aspect-video"
            fallback={
              <PosterPreview
                src="/og/topics/content-workflow.webp"
                alt={t("landing.media.heroPosterAlt")}
                className="aspect-video"
                imageClassName="object-cover"
              />
            }
          />
          <div className="mt-3 flex items-center justify-between gap-4 px-1 text-xs text-[var(--jw-muted)]">
            <span>{t("landing.media.heroCaption")}</span>
            <a href="#features" className="inline-flex shrink-0 items-center gap-1 font-semibold text-[var(--jw-accent)] hover:underline">
              {t("landing.media.exploreFeatures")}
              <ArrowRightIcon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
