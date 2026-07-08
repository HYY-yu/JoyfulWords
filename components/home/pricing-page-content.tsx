"use client"

import { useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRightIcon,
  CoinsIcon,
  CreditCardIcon,
  ImageIcon,
  PresentationIcon,
  ReceiptTextIcon,
  SparklesIcon,
} from "lucide-react"
import { LandingHeader } from "@/components/home/landing-header"
import { Button } from "@/components/ui/base/button"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { buildLocalizedPath } from "@/lib/i18n/route-locale"

const imageRows = [
  ["nano-banana-2", "8"],
  ["flux-2-max", "7"],
  ["gpt-image-2", "8"],
  ["nano-banana-2-lite", "4"],
  ["seedream-v4.5", "4"],
  ["seeddream-v5.0-lite", "4"],
  ["z-image-turbo", "1"],
] as const

const billingGuideKeys = ["llm", "image", "audio", "search", "free"] as const

function PricingLogo({ href }: { href: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <Image
        src="/logo.jpeg"
        alt="JoyfulWords logo"
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 rounded-sm object-cover"
        priority
      />
      <span className="text-base font-semibold tracking-tight text-[var(--jw-heading)]">JoyfulWords</span>
    </Link>
  )
}

export function PricingPageContent() {
  const { t, locale } = useTranslation()
  const homeHref = buildLocalizedPath(locale)
  const rechargeHref = "/articles?tab=billing"
  const privacyPolicyHref = buildLocalizedPath(locale, "/privacy-policy")
  const termsOfUseHref = buildLocalizedPath(locale, "/terms-of-use")

  const estimateRows = useMemo(
    () => [
      {
        icon: CreditCardIcon,
        value: t("pricing.visual.estimates.subscription.value"),
        label: t("pricing.visual.estimates.subscription.label"),
        description: t("pricing.visual.estimates.subscription.description"),
      },
      {
        icon: SparklesIcon,
        value: t("pricing.visual.estimates.article.value"),
        label: t("pricing.visual.estimates.article.label"),
        description: t("pricing.visual.estimates.article.description"),
      },
      {
        icon: PresentationIcon,
        value: t("pricing.visual.estimates.ppt.value"),
        label: t("pricing.visual.estimates.ppt.label"),
        description: t("pricing.visual.estimates.ppt.description"),
      },
      {
        icon: ImageIcon,
        value: t("pricing.visual.estimates.image.value"),
        label: t("pricing.visual.estimates.image.label"),
        description: t("pricing.visual.estimates.image.description"),
      },
    ],
    [t],
  )

  const pricingRows = useMemo(
    () => [
      {
        module: t("pricing.sections.ai.title"),
        item: t("pricing.sections.ai.standard.input"),
        price: `1 ${t("pricing.units.perKInput")}`,
      },
      {
        module: t("pricing.sections.ai.title"),
        item: t("pricing.sections.ai.standard.output"),
        price: `3 ${t("pricing.units.perKOutput")}`,
      },
      {
        module: t("pricing.sections.ai.title"),
        item: t("pricing.sections.ai.premium.input"),
        price: `2 ${t("pricing.units.perKInput")}`,
      },
      {
        module: t("pricing.sections.ai.title"),
        item: t("pricing.sections.ai.premium.output"),
        price: `10 ${t("pricing.units.perKOutput")}`,
      },
      ...imageRows.map(([model, price]) => ({
        module: t("pricing.sections.image.title"),
        item: model,
        price: `${price} ${t("pricing.units.perImage")}`,
      })),
      {
        module: t("pricing.sections.materials.title"),
        item: t("pricing.sections.search.info"),
        price: `1 ${t("pricing.units.perSearch")}`,
      },
      {
        module: t("pricing.sections.materials.title"),
        item: t("pricing.sections.search.news"),
        price: `1 ${t("pricing.units.perSearch")}`,
      },
      {
        module: t("pricing.sections.materials.title"),
        item: t("pricing.sections.search.image"),
        price: `2 ${t("pricing.units.perSearch")}`,
      },
      {
        module: t("pricing.sections.ppt.title"),
        item: t("pricing.sections.ppt.item"),
        price: `1 ${t("pricing.units.perSlide")}`,
      },
    ],
    [t],
  )

  const billingGuideRows = useMemo(
    () =>
      billingGuideKeys.map((key) => ({
        key,
        title: t(`pricing.billingGuide.categories.${key}.title`),
        billing: t(`pricing.billingGuide.categories.${key}.billing`),
        items: t(`pricing.billingGuide.categories.${key}.items`) as string[],
      })),
    [t],
  )

  return (
    <main className="jw-app-shell min-h-screen overflow-x-hidden">
      <LandingHeader activeItem="pricing" featuresHref={`${homeHref}#features`} />

      <section className="relative isolate border-b border-[var(--jw-border-subtle)] pt-16">
        <div className="absolute inset-0 -z-10 bg-[var(--jw-hero-bg)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-t from-[var(--jw-surface-strong)] to-transparent" />

        <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-center gap-12 px-5 py-12 sm:px-6 md:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:py-16">
          <div className="max-w-2xl">
            <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--jw-border)] bg-[var(--jw-accent-soft)] px-4 py-1.5 text-[13px] font-medium text-[var(--jw-accent)]">
              <CoinsIcon className="size-4" />
              {t("pricing.eyebrow")}
            </div>

            <h1 className="animate-fade-up animate-delay-1 font-serif text-5xl leading-[0.95] tracking-tight text-[var(--jw-heading)] sm:text-6xl md:text-7xl lg:text-[88px]">
              {t("pricing.heading")}
            </h1>
            <p className="animate-fade-up animate-delay-2 mt-6 max-w-xl text-base leading-7 text-[var(--jw-muted)] sm:text-lg">
              {t("pricing.description")}
            </p>

            <div className="animate-fade-up animate-delay-3 mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" className="jw-primary-button rounded-full px-6" asChild>
                <Link href={rechargeHref}>
                  <CreditCardIcon className="size-4" />
                  {t("pricing.cta.recharge")}
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="jw-secondary-button rounded-full px-6 shadow-sm" asChild>
                <a href="#pricing-detail">
                  {t("pricing.cta.viewRates")}
                  <ArrowRightIcon className="size-4" />
                </a>
              </Button>
            </div>

            <p className="animate-fade-up animate-delay-4 mt-5 text-xs leading-5 text-[var(--jw-muted)] opacity-70">
              {t("pricing.exchangeRate")}
            </p>
          </div>

          <div className="animate-fade-up animate-delay-2 relative min-w-0">
            <div className="absolute left-5 top-5 h-24 w-24 rounded-full bg-emerald-300/25 blur-3xl" />
            <div className="absolute bottom-10 right-8 h-28 w-28 rounded-full bg-amber-300/25 blur-3xl" />
            <div className="relative overflow-hidden rounded-[24px] border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] p-5 shadow-[var(--jw-card-shadow)] sm:p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.28em] text-[var(--jw-muted)]">
                    {t("pricing.visual.label")}
                  </p>
                  <h2 className="mt-3 font-serif text-4xl tracking-tight text-[var(--jw-heading)] sm:text-5xl">
                    {t("pricing.visual.title")}
                  </h2>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--jw-accent)] text-[var(--jw-accent-foreground)] shadow-[var(--jw-soft-shadow)]">
                  <ReceiptTextIcon className="size-5" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {estimateRows.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.label}
                      className="flex min-h-[10.25rem] flex-col justify-between rounded-xl border border-[var(--jw-border)] bg-[var(--jw-surface-muted)] p-4 transition-colors hover:bg-[var(--jw-surface-strong)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold tracking-tight text-[var(--jw-heading)]">
                            {item.label}
                          </div>
                          <div className="mt-2 text-xs leading-5 text-[var(--jw-muted)]">
                            {item.description}
                          </div>
                        </div>
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--jw-surface-strong)] text-[var(--jw-accent)]">
                          <Icon className="size-4" />
                        </div>
                      </div>
                      <div className="mt-6 font-mono text-2xl font-semibold tracking-tight text-[var(--jw-heading)] sm:text-3xl">
                        {item.value}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing-detail" className="bg-[var(--jw-surface-strong)] px-5 py-20 sm:px-6 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-[var(--jw-muted)]">
              {t("pricing.detailLabel")}
            </p>
            <h2 className="mt-4 font-serif text-4xl leading-tight tracking-tight text-[var(--jw-heading)] sm:text-5xl">
              {t("pricing.detailHeading")}
            </h2>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--jw-border)] bg-[var(--jw-surface)] shadow-[var(--jw-soft-shadow)]">
            <table className="w-full min-w-[46rem] border-collapse text-left">
              <thead className="bg-[var(--jw-surface-muted)]">
                <tr className="border-b border-[var(--jw-border)] text-xs font-semibold uppercase tracking-[0.16em] text-[var(--jw-muted)]">
                  <th className="w-[28%] px-5 py-4">{t("pricing.table.module")}</th>
                  <th className="w-[42%] px-5 py-4">{t("pricing.table.item")}</th>
                  <th className="w-[30%] px-5 py-4 text-right">{t("pricing.table.price")}</th>
                </tr>
              </thead>
              <tbody>
                {pricingRows.map((row, index) => (
                  <tr
                    key={`${row.module}-${row.item}-${index}`}
                    className="border-b border-[var(--jw-border-subtle)] transition-colors last:border-b-0 hover:bg-[var(--jw-surface-muted)]"
                  >
                    <td className="px-5 py-4 align-top text-sm font-medium text-[var(--jw-heading)]">{row.module}</td>
                    <td className="px-5 py-4 align-top font-mono text-sm text-[var(--jw-heading)]">{row.item}</td>
                    <td className="px-5 py-4 align-top text-right font-mono text-sm font-semibold text-[var(--jw-heading)]">{row.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-12 border-t border-[var(--jw-border)] pt-10">
            <div className="mb-8 max-w-3xl">
              <p className="text-xs font-medium uppercase tracking-[0.32em] text-[var(--jw-muted)]">
                {t("pricing.billingGuide.label")}
              </p>
              <h3 className="mt-4 font-serif text-3xl leading-tight tracking-tight text-[var(--jw-heading)] sm:text-4xl">
                {t("pricing.billingGuide.title")}
              </h3>
              <p className="mt-4 text-sm leading-7 text-[var(--jw-muted)] sm:text-base">
                {t("pricing.billingGuide.description")}
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[var(--jw-border)] bg-[var(--jw-surface)] shadow-[var(--jw-soft-shadow)]">
              <table className="w-full min-w-[54rem] border-collapse text-left">
                <thead className="bg-[var(--jw-surface-muted)]">
                  <tr className="border-b border-[var(--jw-border)] text-xs font-semibold uppercase tracking-[0.16em] text-[var(--jw-muted)]">
                    <th className="w-[24%] px-5 py-4">{t("pricing.billingGuide.table.category")}</th>
                    <th className="w-[34%] px-5 py-4">{t("pricing.billingGuide.table.billing")}</th>
                    <th className="w-[42%] px-5 py-4">{t("pricing.billingGuide.table.features")}</th>
                  </tr>
                </thead>
                <tbody>
                  {billingGuideRows.map((row) => (
                    <tr
                      key={row.key}
                      className="border-b border-[var(--jw-border-subtle)] transition-colors last:border-b-0 hover:bg-[var(--jw-surface-muted)]"
                    >
                      <td className="px-5 py-4 align-top text-sm font-semibold text-[var(--jw-heading)]">
                        {row.title}
                      </td>
                      <td className="px-5 py-4 align-top text-sm leading-6 text-[var(--jw-heading)]">
                        {row.billing}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          {row.items.map((item) => (
                            <span
                              key={item}
                              className="rounded-full border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] px-3 py-1 text-xs font-medium text-[var(--jw-heading)]"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--jw-border)] bg-[var(--jw-surface-muted)] px-5 py-20 text-[var(--jw-heading)] sm:px-6 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-[var(--jw-muted)]">
              {t("pricing.finalCta.label")}
            </p>
            <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
              {t("pricing.finalCta.title")}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--jw-muted)] sm:text-base">
              {t("pricing.finalCta.description")}
            </p>
          </div>
          <Button size="lg" className="jw-primary-button w-full rounded-full md:w-auto" asChild>
            <Link href={rechargeHref}>
              {t("pricing.finalCta.button")}
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-[var(--jw-border)] bg-[var(--jw-surface-strong)] px-5 py-8 sm:px-6 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <PricingLogo href={homeHref} />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--jw-muted)]">
            <Link href={privacyPolicyHref} className="transition-colors hover:text-[var(--jw-heading)]">
              {t("landing.footer.privacyPolicy")}
            </Link>
            <Link href={termsOfUseHref} className="transition-colors hover:text-[var(--jw-heading)]">
              {t("landing.footer.termsOfUse")}
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
