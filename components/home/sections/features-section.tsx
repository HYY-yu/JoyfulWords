"use client"

import Link from "next/link"
import {
  ArrowRightIcon,
  ChartNoAxesCombinedIcon,
  CheckIcon,
  FileTextIcon,
  NetworkIcon,
  PresentationIcon,
} from "lucide-react"

import { FeatureVideo } from "@/components/home/sections/feature-video"
import { MindMapPreview, PosterPreview } from "@/components/home/sections/product-preview"
import { SectionHeading } from "@/components/home/sections/section-heading"
import { trackProductEvent } from "@/lib/analytics/client"
import { PRODUCT_ANALYTICS_EVENTS } from "@/lib/analytics/events"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { buildLocalizedPath } from "@/lib/i18n/route-locale"
import { LANDING_POSTER_BASE, LANDING_VIDEO_BASE } from "@/components/home/sections/landing-media"

const features = [
  {
    key: "article",
    Icon: FileTextIcon,
    srcBase: `${LANDING_VIDEO_BASE}/feature-article`,
    poster: "/og/topics/ai-writing.webp",
    chromeLabel: "articles / editor",
  },
  {
    key: "infographic",
    Icon: ChartNoAxesCombinedIcon,
    srcBase: `${LANDING_VIDEO_BASE}/feature-infographic`,
    poster: "/images/infographics/styles/professional.png",
    chromeLabel: "tools / infographic",
  },
  {
    key: "ppt",
    Icon: PresentationIcon,
    srcBase: `${LANDING_VIDEO_BASE}/feature-ppt`,
    poster: "/og/blog/how-to-turn-a-blog-post-into-a-presentation-with-ai.webp",
    chromeLabel: "articles / presentation preview",
  },
  {
    key: "mindmap",
    Icon: NetworkIcon,
    srcBase: `${LANDING_VIDEO_BASE}/feature-mindmap`,
    chromeLabel: "articles / mind map",
  },
] as const

const pointKeys = ["point1", "point2", "point3"] as const

export function FeaturesSection() {
  const { t, locale } = useTranslation()

  return (
    <section id="features" className="scroll-mt-20 px-5 py-11 md:px-10 md:py-20">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeading
          title={t("landing.featuresHeading")}
          accent={t("landing.featuresHeadingAccent")}
          description={t("landing.featuresSubheading")}
        />

        <div className="mt-9 space-y-14 md:mt-14 md:space-y-24">
          {features.map((feature, index) => {
            const Icon = feature.Icon
            const href = feature.key === "infographic"
              ? buildLocalizedPath(locale, "/tools/infographic")
              : "/articles"
            const media = (
              <FeatureVideo
                srcBase={feature.srcBase}
                posterBase={`${LANDING_POSTER_BASE}/feature-${feature.key}`}
                label={t(`landing.features.${feature.key}.mediaLabel`)}
                chromeLabel={feature.chromeLabel}
                featureKey={feature.key}
                preload="none"
                fallback={
                  "poster" in feature ? (
                    <PosterPreview
                      src={feature.poster}
                      alt={t(`landing.features.${feature.key}.posterAlt`)}
                      className="aspect-[16/10]"
                      imageClassName={feature.key === "infographic" ? "object-contain p-5" : "object-cover"}
                    />
                  ) : (
                    <MindMapPreview
                      label={t(`landing.features.${feature.key}.previewLabel`)}
                      branches={[
                        t("landing.features.mindmap.previewBranchStructure"),
                        t("landing.features.mindmap.previewBranchIdeas"),
                        t("landing.features.mindmap.previewBranchVisuals"),
                      ]}
                    />
                  )
                }
              />
            )

            return (
              <article
                key={feature.key}
                data-feature-key={feature.key}
                className="grid items-center gap-7 md:grid-cols-2 md:gap-12 lg:gap-16"
              >
                <div className={index % 2 === 1 ? "md:order-2" : undefined}>
                  <div className="mb-3 flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[color-mix(in_srgb,var(--jw-accent)_46%,transparent)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-[var(--jw-surface-muted)] px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-[var(--jw-muted)] uppercase">
                      <Icon className="size-3.5 text-[var(--jw-accent)]" strokeWidth={1.7} aria-hidden="true" />
                      {t(`landing.features.${feature.key}.eyebrow`)}
                    </span>
                  </div>
                  <h3 className="font-serif text-[1.8rem] leading-tight font-semibold tracking-[-0.02em] text-[var(--jw-heading)] md:text-[2.65rem]">
                    {t(`landing.features.${feature.key}.title`)}
                  </h3>
                  <p className="mt-3 max-w-[34rem] text-sm leading-7 text-[var(--jw-muted)] md:mt-4 md:text-base md:leading-8">
                    {t(`landing.features.${feature.key}.description`)}
                  </p>

                  <ul className="mt-4 space-y-2.5 md:mt-5">
                    {pointKeys.map((pointKey) => (
                      <li key={pointKey} className="flex items-start gap-2.5 text-[13px] leading-6 text-[var(--jw-page-text)] md:text-sm">
                        <span className="mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-[var(--jw-accent-soft)] text-[var(--jw-accent)]">
                          <CheckIcon className="size-2.5" strokeWidth={2.5} aria-hidden="true" />
                        </span>
                        {t(`landing.features.${feature.key}.${pointKey}`)}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={href}
                    prefetch={false}
                    className="mt-5 inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-[var(--jw-accent)] outline-none transition-colors hover:text-[var(--jw-accent-hover)] hover:underline focus-visible:ring-2 focus-visible:ring-[var(--jw-accent)] focus-visible:ring-offset-4 md:mt-6"
                    onClick={() =>
                      trackProductEvent(PRODUCT_ANALYTICS_EVENTS.LANDING_PRIMARY_CTA_CLICKED, {
                        section: `feature_${feature.key}`,
                      })
                    }
                  >
                    {t(`landing.features.${feature.key}.cta`)}
                    <ArrowRightIcon className="size-4" strokeWidth={1.7} aria-hidden="true" />
                  </Link>
                </div>
                <div className={index % 2 === 1 ? "md:order-1" : undefined}>{media}</div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
