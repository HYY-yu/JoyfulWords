"use client"

import {
  ArrowRightIcon,
  FilePenLineIcon,
  ListTreeIcon,
  SearchIcon,
  Share2Icon,
} from "lucide-react"

import { SectionHeading } from "@/components/home/sections/section-heading"
import { useTranslation } from "@/lib/i18n/i18n-context"

const steps = [
  { key: "research", Icon: SearchIcon },
  { key: "outline", Icon: ListTreeIcon },
  { key: "draft", Icon: FilePenLineIcon },
  { key: "export", Icon: Share2Icon },
] as const

export function HowItWorksSection() {
  const { t } = useTranslation()

  return (
    <section className="px-5 py-11 md:px-10 md:py-20">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeading
          eyebrow={t("landing.howItWorks.eyebrow")}
          title={t("landing.howItWorks.title")}
          description={t("landing.howItWorks.description")}
        />

        <ol className="relative mt-7 grid gap-3 pl-5 md:mt-11 md:grid-cols-4 md:gap-5 md:pl-0">
          <span className="absolute top-4 bottom-6 left-[5px] w-px bg-gradient-to-b from-[var(--jw-accent)] to-[var(--jw-border)] md:top-[3.15rem] md:right-[12.5%] md:bottom-auto md:left-[12.5%] md:h-px md:w-auto" aria-hidden="true" />
          {steps.map(({ key, Icon }, index) => (
            <li key={key} className="relative">
              <span className="absolute top-5 -left-[1.46rem] size-3 rounded-full border-[3px] border-[var(--jw-surface-strong)] bg-[var(--jw-accent)] shadow-[0_0_0_1px_var(--jw-border)] md:hidden" aria-hidden="true" />
              <article className="relative h-full rounded-2xl border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] p-4 shadow-[var(--jw-soft-shadow)] transition-transform duration-200 hover:-translate-y-1 md:p-5">
                {index < steps.length - 1 ? (
                  <ArrowRightIcon className="absolute top-8 -right-4 hidden size-4 text-[var(--jw-accent)] md:block" strokeWidth={1.5} aria-hidden="true" />
                ) : null}
                <div className="mb-3 flex items-start justify-between gap-3 md:mb-5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--jw-accent-soft)] text-[var(--jw-accent)] md:size-10">
                    <Icon className="size-4.5" strokeWidth={1.65} aria-hidden="true" />
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-[var(--jw-accent)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold text-[var(--jw-heading)] md:text-base">
                  {t(`landing.howItWorks.steps.${key}.title`)}
                </h3>
                <p className="mt-1.5 text-[12.5px] leading-6 text-[var(--jw-muted)] md:mt-2 md:text-[13px]">
                  {t(`landing.howItWorks.steps.${key}.description`)}
                </p>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
