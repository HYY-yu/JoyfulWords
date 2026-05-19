"use client"

import { useState } from "react"
import {
  CheckIcon,
  CopyIcon,
  ServerIcon,
  TerminalIcon,
} from "lucide-react"
import { LandingHeader } from "@/components/home/landing-header"
import { Button } from "@/components/ui/base/button"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { buildLocalizedPath } from "@/lib/i18n/route-locale"

const mcpCommand =
  "claude mcp add --transport http --client-id joyfulwords-mcp-server joyfulwords https://api.joyword.link/mcp"

export function McpPageContent() {
  const { t, locale } = useTranslation()
  const [copied, setCopied] = useState(false)
  const homeHref = buildLocalizedPath(locale)

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(mcpCommand)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch (error) {
      console.warn("[McpPage] Failed to copy MCP command", { error })
    }
  }

  const steps = [
    {
      number: "01",
      title: t("mcpPage.steps.add.title"),
      description: t("mcpPage.steps.add.description"),
    },
    {
      number: "02",
      title: t("mcpPage.steps.launch.title"),
      description: t("mcpPage.steps.launch.description"),
    },
    {
      number: "03",
      title: t("mcpPage.steps.verify.title"),
      description: t("mcpPage.steps.verify.description"),
    },
  ]

  return (
    <main className="jw-app-shell min-h-screen overflow-x-hidden">
      <LandingHeader activeItem="mcp" featuresHref={`${homeHref}#features`} />

      <section className="relative isolate border-b border-[var(--jw-border-subtle)] pt-16">
        <div className="absolute inset-0 -z-10 bg-[var(--jw-hero-bg)]" />
        <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-6xl items-center gap-10 px-5 py-10 sm:px-6 sm:py-14 md:px-10 lg:grid-cols-[0.88fr_1.12fr] lg:py-16">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--jw-border)] bg-[var(--jw-accent-soft)] px-4 py-1.5 text-[13px] font-medium text-[var(--jw-accent)]">
              <ServerIcon className="size-4" />
              {t("mcpPage.eyebrow")}
            </div>

            <h1 className="font-serif text-5xl leading-[0.98] tracking-tight text-[var(--jw-heading)] sm:text-6xl md:text-7xl">
              {t("mcpPage.heading")}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[var(--jw-muted)] sm:text-lg">
              {t("mcpPage.description")}
            </p>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--jw-muted)]">
              {t("mcpPage.agentHint")}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={handleCopyCommand}>
                {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
                {copied ? t("mcpPage.command.copied") : t("mcpPage.command.copy")}
              </Button>
            </div>
          </div>

          <div className="relative min-w-0">
            <div className="min-w-0 overflow-hidden rounded-xl border border-[var(--jw-border)] bg-zinc-950 text-white shadow-[var(--jw-card-shadow)]">
              <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex items-center gap-2 text-xs font-medium text-white/58">
                  <TerminalIcon className="size-3.5" />
                  {t("mcpPage.command.label")}
                </div>
                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200">
                  {t("mcpPage.command.transport")}
                </div>
              </div>
              <pre className="whitespace-pre-wrap break-words px-4 py-6 text-left text-[13px] leading-7 text-white/88 sm:px-5 sm:text-sm">
                <code>{mcpCommand}</code>
              </pre>
            </div>

            <div className="mt-8">
              <p className="text-xs font-medium uppercase tracking-[0.32em] text-[var(--jw-muted)]">
                {t("mcpPage.stepsLabel")}
              </p>
              <h2 className="mt-3 font-serif text-3xl tracking-tight text-[var(--jw-heading)] sm:text-4xl">
                {t("mcpPage.stepsHeading")}
              </h2>

              <div className="mt-7 grid gap-5 sm:grid-cols-3">
                {steps.map((step) => (
                  <article key={step.number} className="border-t border-[var(--jw-border)] pt-4">
                    <div className="mb-4 font-mono text-3xl text-[var(--jw-accent)] opacity-30">
                      {step.number}
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight text-[var(--jw-heading)]">{step.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--jw-muted)]">
                      {step.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
