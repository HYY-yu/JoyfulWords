"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ArrowLeftIcon,
  CheckIcon,
  CopyIcon,
  GlobeIcon,
  ServerIcon,
  TerminalIcon,
} from "lucide-react"
import { Button } from "@/components/ui/base/button"
import { persistLocalePreference, useTranslation } from "@/lib/i18n/i18n-context"
import { buildLocalizedPath, switchLocalePathname } from "@/lib/i18n/route-locale"
import type { Locale } from "@/lib/i18n/shared"

const mcpCommand =
  "claude mcp add --transport http --client-id joyfulwords-mcp-server joyfulwords https://api.joyword.link/mcp"

function McpLogo({ href }: { href: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <Image
        src="/logo.jpeg"
        alt="JoyfulWords logo"
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 rounded-sm object-cover"
      />
      <span className="text-base font-semibold tracking-tight">JoyfulWords</span>
    </Link>
  )
}

export function McpPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const { t, locale } = useTranslation()
  const [copied, setCopied] = useState(false)
  const homeHref = buildLocalizedPath(locale)

  const handleLocaleChange = (nextLocale: Locale) => {
    if (nextLocale === locale) return

    persistLocalePreference(nextLocale)
    router.replace(switchLocalePathname(pathname, nextLocale))
  }

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
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="fixed top-0 right-0 left-0 z-50 flex h-14 items-center gap-3 border-b bg-background/92 px-4 backdrop-blur-2xl sm:px-6 md:px-10">
        <McpLogo href={homeHref} />
        <div className="flex-1" />

        <Link
          href={homeHref}
          className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-all hover:bg-accent hover:text-foreground sm:flex"
        >
          <ArrowLeftIcon className="size-4" />
          {t("mcpPage.nav.backHome")}
        </Link>

        <div className="flex items-center gap-1 rounded-lg border bg-background px-1 py-1">
          <GlobeIcon className="ml-2 size-4 text-muted-foreground" />
          <button
            type="button"
            onClick={() => handleLocaleChange("zh")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              locale === "zh"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            中文
          </button>
          <button
            type="button"
            onClick={() => handleLocaleChange("en")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              locale === "en"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            EN
          </button>
        </div>
      </header>

      <section className="relative isolate border-b pt-14">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_78%_48%_at_50%_0%,rgba(37,99,235,.10)_0%,transparent_70%),linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(244,244,245,.82)_100%)]" />
        <div className="mx-auto grid min-h-[calc(100svh-3.5rem)] max-w-6xl items-center gap-10 px-5 py-10 sm:px-6 sm:py-14 md:px-10 lg:grid-cols-[0.88fr_1.12fr] lg:py-16">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[13px] font-medium text-primary">
              <ServerIcon className="size-4" />
              {t("mcpPage.eyebrow")}
            </div>

            <h1 className="font-serif text-5xl leading-[0.98] tracking-tight sm:text-6xl md:text-7xl">
              {t("mcpPage.heading")}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
              {t("mcpPage.description")}
            </p>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
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
            <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
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
              <p className="text-xs font-medium uppercase tracking-[0.32em] text-muted-foreground">
                {t("mcpPage.stepsLabel")}
              </p>
              <h2 className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl">
                {t("mcpPage.stepsHeading")}
              </h2>

              <div className="mt-7 grid gap-5 sm:grid-cols-3">
                {steps.map((step) => (
                  <article key={step.number} className="border-t pt-4">
                    <div className="mb-4 font-mono text-3xl text-foreground/10">
                      {step.number}
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
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
