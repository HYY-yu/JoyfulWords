"use client"

import {
  CheckIcon,
  LanguagesIcon,
  PenLineIcon,
  PresentationIcon,
  XIcon,
} from "lucide-react"

import { FeatureVideo } from "@/components/home/sections/feature-video"
import {
  BeforeAfterPreview,
  OneToManyPreview,
} from "@/components/home/sections/product-preview"
import { SectionHeading } from "@/components/home/sections/section-heading"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { LANDING_POSTER_BASE, LANDING_VIDEO_BASE } from "@/components/home/sections/landing-media"

const metricKeys = ["platform", "copyPaste", "outputs", "search"] as const
const pillarOneBeforeKeys = ["before1", "before2"] as const
const pillarOneAfterKeys = ["after1", "after2"] as const
const pillarTwoBeforeKeys = ["before1"] as const
const pillarTwoAfterKeys = ["after1", "after2"] as const
const scenes = [
  { key: "creator", Icon: PenLineIcon },
  { key: "globalTeam", Icon: LanguagesIcon },
  { key: "workReport", Icon: PresentationIcon },
] as const

function ComparisonList({
  namespace,
  beforeKeys,
  afterKeys,
}: {
  namespace: string
  beforeKeys: readonly string[]
  afterKeys: readonly string[]
}) {
  const { t } = useTranslation()

  return (
    <ul className="mt-5 space-y-3">
      {beforeKeys.map((key) => (
        <li key={key} className="flex items-start gap-3 text-[13px] leading-6 text-[var(--jw-muted)] md:text-sm">
          <span className="mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-red-500/10 text-red-600">
            <XIcon className="size-2.5" strokeWidth={2.5} aria-hidden="true" />
          </span>
          {t(`${namespace}.${key}`)}
        </li>
      ))}
      {afterKeys.map((key) => (
        <li key={key} className="flex items-start gap-3 text-[13px] leading-6 text-[var(--jw-page-text)] md:text-sm">
          <span className="mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-700">
            <CheckIcon className="size-2.5" strokeWidth={2.5} aria-hidden="true" />
          </span>
          {t(`${namespace}.${key}`)}
        </li>
      ))}
    </ul>
  )
}

export function OutcomesSection() {
  const { t } = useTranslation()

  return (
    <section className="border-y border-[var(--jw-border-subtle)] bg-[var(--jw-surface-muted)] px-5 py-11 md:px-10 md:py-20">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeading
          eyebrow={t("landing.outcomes.eyebrow")}
          title={t("landing.outcomes.title")}
          accent={t("landing.outcomes.titleAccent")}
          description={t("landing.outcomes.description")}
        />

        <div className="mt-7 grid grid-cols-2 gap-3 md:mt-10 md:grid-cols-4 md:gap-4">
          {metricKeys.map((key) => (
            <article key={key} className="rounded-2xl border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] p-4 shadow-[var(--jw-soft-shadow)] md:p-5">
              <strong className="block font-serif text-[1.35rem] font-semibold text-[var(--jw-accent)] md:text-[1.65rem]">
                {t(`landing.outcomes.metrics.${key}.value`)}
              </strong>
              <span className="mt-1.5 block text-[11.5px] leading-5 text-[var(--jw-muted)] md:mt-2 md:text-xs md:leading-6">
                {t(`landing.outcomes.metrics.${key}.label`)}
              </span>
            </article>
          ))}
        </div>

        <div className="mt-12 grid items-center gap-7 md:mt-16 md:grid-cols-2 md:gap-12 lg:gap-16">
          <div>
            <h3 className="font-serif text-[1.7rem] leading-tight font-semibold tracking-[-0.02em] text-[var(--jw-heading)] md:text-[2.25rem]">
              {t("landing.outcomes.pillarOne.title")}
            </h3>
            <ComparisonList
              namespace="landing.outcomes.pillarOne"
              beforeKeys={pillarOneBeforeKeys}
              afterKeys={pillarOneAfterKeys}
            />
          </div>
          <FeatureVideo
            srcBase={`${LANDING_VIDEO_BASE}/outcome-before-after`}
            posterBase={`${LANDING_POSTER_BASE}/outcome-before-after`}
            label={t("landing.outcomes.pillarOne.mediaLabel")}
            chromeLabel="workflow / before and after"
            analytics={false}
            preload="none"
            stageClassName="aspect-[16/10]"
            fallback={
              <BeforeAfterPreview
                before={t("landing.outcomes.pillarOne.beforeLabel")}
                after={t("landing.outcomes.pillarOne.afterLabel")}
              />
            }
          />
        </div>

        <div className="mt-12 grid items-center gap-7 md:mt-16 md:grid-cols-2 md:gap-12 lg:gap-16">
          <div className="md:order-2">
            <h3 className="font-serif text-[1.7rem] leading-tight font-semibold tracking-[-0.02em] text-[var(--jw-heading)] md:text-[2.25rem]">
              {t("landing.outcomes.pillarTwo.title")}
            </h3>
            <ComparisonList
              namespace="landing.outcomes.pillarTwo"
              beforeKeys={pillarTwoBeforeKeys}
              afterKeys={pillarTwoAfterKeys}
            />
          </div>
          <div className="overflow-hidden rounded-2xl border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] shadow-[var(--jw-card-shadow)] md:order-1">
            <div className="flex h-9 items-center gap-1.5 border-b border-[var(--jw-border-subtle)] bg-[var(--jw-surface-muted)] px-3 sm:h-10">
              <span className="size-2 rounded-full bg-[var(--jw-muted)] opacity-45" aria-hidden="true" />
              <span className="size-2 rounded-full border border-[var(--jw-border)] bg-[var(--jw-accent-soft)]" aria-hidden="true" />
              <span className="size-2 rounded-full bg-[var(--jw-accent)] opacity-60" aria-hidden="true" />
              <span className="ml-1.5 font-mono text-[10px] text-[var(--jw-muted)] sm:text-[11px]">
                content / one to many
              </span>
            </div>
            <OneToManyPreview
              source={t("landing.outcomes.pillarTwo.source")}
              outputs={[
                t("landing.outcomes.pillarTwo.outputInfographic"),
                t("landing.outcomes.pillarTwo.outputPpt"),
                t("landing.outcomes.pillarTwo.outputMindmap"),
              ]}
            />
          </div>
        </div>

        <div className="mt-12 grid gap-3 md:mt-16 md:grid-cols-[1.15fr_0.925fr_0.925fr] md:gap-4">
          {scenes.map(({ key, Icon }) => (
            <article key={key} className="flex gap-3 rounded-2xl border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] p-4 shadow-[var(--jw-soft-shadow)] md:block md:p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--jw-accent-soft)] text-[var(--jw-accent)]">
                <Icon className="size-4.5" strokeWidth={1.65} aria-hidden="true" />
              </span>
              <div>
                <h4 className="font-semibold text-[var(--jw-heading)] md:mt-4">
                  {t(`landing.outcomes.scenes.${key}.title`)}
                </h4>
                <p className="mt-1 text-xs leading-6 text-[var(--jw-muted)] md:mt-2 md:text-[13px]">
                  {t(`landing.outcomes.scenes.${key}.description`)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
