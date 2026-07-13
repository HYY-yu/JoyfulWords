"use client"

import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/base/button"
import { trackProductEvent } from "@/lib/analytics/client"
import { PRODUCT_ANALYTICS_EVENTS } from "@/lib/analytics/events"
import { useTranslation } from "@/lib/i18n/i18n-context"

export function FinalCtaSection() {
  const { t } = useTranslation()

  return (
    <section className="px-4 pt-2 pb-9 md:px-10 md:pt-0 md:pb-16">
      <div
        className="relative mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 overflow-hidden rounded-[1.25rem] border border-white/15 px-6 py-9 text-center text-[var(--jw-cta-text)] shadow-[var(--jw-card-shadow)] md:flex-row md:rounded-[1.75rem] md:px-12 md:py-12 md:text-left lg:px-16"
        style={{ background: "var(--jw-cta-bg)" }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.32)_1px,transparent_0)] [background-size:26px_26px]" aria-hidden="true" />
        <div className="relative">
          <h2 className="font-serif text-[1.65rem] leading-tight font-semibold tracking-[-0.02em] md:text-[2.35rem]">
            {t("landing.finalCta.title")}
          </h2>
          <p className="mt-2 text-sm opacity-80 md:text-base">
            {t("landing.finalCta.description")}
          </p>
        </div>
        <Button
          size="lg"
          className="relative h-12 w-full rounded-full bg-[var(--jw-surface-strong)] px-6 text-[var(--jw-heading)] shadow-lg hover:bg-white active:scale-[0.98] sm:w-auto"
          asChild
        >
          <Link
            href="/articles"
            prefetch={false}
            onClick={() =>
              trackProductEvent(PRODUCT_ANALYTICS_EVENTS.LANDING_PRIMARY_CTA_CLICKED, {
                section: "final",
              })
            }
          >
            {t("landing.finalCta.cta")}
            <ArrowRightIcon className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
