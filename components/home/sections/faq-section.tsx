"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/base/accordion"
import { SectionHeading } from "@/components/home/sections/section-heading"
import { trackProductEvent } from "@/lib/analytics/client"
import { PRODUCT_ANALYTICS_EVENTS } from "@/lib/analytics/events"
import { useTranslation } from "@/lib/i18n/i18n-context"

const faqKeys = ["free", "chatgpt", "exports", "copyright", "collaboration"] as const

export function FaqSection() {
  const { t } = useTranslation()

  return (
    <section className="px-5 py-11 md:px-10 md:py-20">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeading title={t("landing.faq.title")} />

        <Accordion
          type="single"
          collapsible
          defaultValue="free"
          className="mt-7 max-w-3xl md:mt-10"
          onValueChange={(value) => {
            if (!value) return
            trackProductEvent(PRODUCT_ANALYTICS_EVENTS.LANDING_FAQ_EXPANDED, {
              question_key: value,
            })
          }}
        >
          {faqKeys.map((key) => (
            <AccordionItem
              key={key}
              value={key}
              className="mb-3 overflow-hidden rounded-xl border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] px-4 shadow-[var(--jw-soft-shadow)] last:border-b md:px-5"
            >
              <AccordionTrigger className="py-4 text-[14px] leading-6 font-semibold text-[var(--jw-heading)] hover:no-underline md:py-5 md:text-base">
                {t(`landing.faq.items.${key}.question`)}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-[13px] leading-7 text-[var(--jw-muted)] md:pb-5 md:text-sm">
                {t(`landing.faq.items.${key}.answer`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
