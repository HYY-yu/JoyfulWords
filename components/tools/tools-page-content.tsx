"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ArrowRightIcon,
  BarChart3Icon,
  BookOpenTextIcon,
  CalendarCheckIcon,
  CheckSquareIcon,
  FileTextIcon,
  GlobeIcon,
  ImageIcon,
  Layers3Icon,
  LogInIcon,
  LogOutIcon,
  MapIcon,
  MegaphoneIcon,
  PenLineIcon,
  PresentationIcon,
  Share2Icon,
  UserCircleIcon,
} from "lucide-react"

import { BrandLogo } from "@/components/brand/brand-logo"
import { FeedbackErrorBoundary, TallyFeedbackButton } from "@/components/feedback"
import { ProfileDialog } from "@/components/auth/profile-dialog"
import { TaskCenterDialog } from "@/components/taskcenter/taskcenter-dialog"
import { Button } from "@/components/ui/base/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/base/dropdown-menu"
import { JoyfulThemeSwitcher } from "@/components/theme/joyful-theme-switcher"
import { useAuth } from "@/lib/auth/auth-context"
import { persistLocalePreference, useTranslation } from "@/lib/i18n/i18n-context"
import { buildLocalizedPath, switchLocalePathname } from "@/lib/i18n/route-locale"
import type { Locale } from "@/lib/i18n/shared"
import { TOOL_SLUGS, type ToolSlug } from "@/lib/tools/catalog"
import { useState } from "react"

const toolIconMap = {
  "ai-writer": PenLineIcon,
  "smart-rewrite": FileTextIcon,
  "image-generator": ImageIcon,
  infographic: Layers3Icon,
  "mind-map": MapIcon,
  "ai-charts": BarChart3Icon,
  "ppt-generator": PresentationIcon,
} satisfies Record<ToolSlug, typeof PenLineIcon>

const activityIconMap = {
  checkIn: CalendarCheckIcon,
  share: Share2Icon,
  campaign: MegaphoneIcon,
} satisfies Record<string, typeof CalendarCheckIcon>

interface ToolsPageContentProps {
  selectedToolSlug?: ToolSlug
}

export function ToolsPageContent({ selectedToolSlug }: ToolsPageContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { t, locale } = useTranslation()
  const { user, signOut } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const [taskCenterOpen, setTaskCenterOpen] = useState(false)
  const isDetailPage = Boolean(selectedToolSlug)
  const tools = TOOL_SLUGS.map((slug) => {
    const Icon = toolIconMap[slug]
    return {
      slug,
      Icon,
      title: t(`toolsPage.tools.${slug}.title`),
      href: buildLocalizedPath(locale, `/tools/${slug}`),
    }
  })
  const selectedTool = selectedToolSlug
    ? tools.find((tool) => tool.slug === selectedToolSlug)
    : null
  const activityItems = (["checkIn", "share", "campaign"] as const).map((key) => {
    const Icon = activityIconMap[key]
    return {
      key,
      Icon,
      title: t(`toolsPage.activities.${key}.title`),
      reward: t(`toolsPage.activities.${key}.reward`),
    }
  })

  const handleLocaleChange = (nextLocale: Locale) => {
    if (nextLocale === locale) return

    persistLocalePreference(nextLocale)
    router.replace(switchLocalePathname(pathname, nextLocale))
  }

  return (
    <div className="jw-app-shell min-h-screen">
      <header className="jw-app-header sticky top-0 z-40 border-b backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6">
          <Link
            href={buildLocalizedPath(locale, "/tools")}
            className="rounded-xl transition-transform hover:-translate-y-0.5"
            aria-label="JoyfulWords"
          >
            <BrandLogo />
          </Link>

          <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
            <Button asChild variant="ghost" size="sm" className="jw-themed-link hidden h-8 rounded-full text-sm md:inline-flex">
              <Link href="/articles">
                <BookOpenTextIcon className="size-4 text-[var(--jw-accent)]" />
                {t("toolsPage.nav.workspace")}
              </Link>
            </Button>

            {user ? (
              <Button
                variant="ghost"
                size="sm"
                className="jw-themed-link h-8 gap-2 rounded-full text-sm"
                onClick={() => setTaskCenterOpen(true)}
              >
                <CheckSquareIcon className="size-4 text-[var(--jw-accent)]" />
                <span className="hidden sm:inline">{t("contentWriting.taskCenter.title")}</span>
              </Button>
            ) : null}

            <FeedbackErrorBoundary>
              <TallyFeedbackButton className="jw-themed-link hidden h-8 w-auto rounded-full py-0 text-sm sm:inline-flex" />
            </FeedbackErrorBoundary>

            <Button
              variant="ghost"
              size="sm"
              className="jw-themed-link h-8 gap-2 rounded-full text-sm"
              onClick={() => handleLocaleChange(locale === "zh" ? "en" : "zh")}
            >
              <GlobeIcon className="size-4 text-[var(--jw-accent)]" />
              <span className="hidden sm:inline">{locale === "zh" ? "English" : "中文"}</span>
            </Button>

            <JoyfulThemeSwitcher variant="compact" />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" className="jw-themed-link rounded-full">
                    <UserCircleIcon className="!size-5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{t("common.account")}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setProfileOpen(true)}>
                    <UserCircleIcon className="mr-2 size-4" />
                    {t("auth.profile")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onSelect={() => signOut()}
                  >
                    <LogOutIcon className="mr-2 size-4" />
                    {t("auth.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" className="jw-primary-button h-8 rounded-full px-3">
                <Link href={`/auth/login?redirect=${encodeURIComponent(buildLocalizedPath(locale, "/tools"))}`}>
                  <LogInIcon className="size-4" />
                  {t("toolsPage.nav.login")}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:py-8">
        {isDetailPage && selectedTool ? (
          <ToolDetail tool={selectedTool} />
        ) : (
          <ToolsIndex tools={tools} activityItems={activityItems} />
        )}
      </main>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <TaskCenterDialog open={taskCenterOpen} onOpenChange={setTaskCenterOpen} />
    </div>
  )
}

function ToolsIndex({
  tools,
  activityItems,
}: {
  tools: Array<{
    slug: ToolSlug
    Icon: typeof PenLineIcon
    title: string
    href: string
  }>
  activityItems: Array<{
    key: string
    Icon: typeof CalendarCheckIcon
    title: string
    reward: string
  }>
}) {
  const { t } = useTranslation()

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="min-w-0">
        <div className="relative overflow-hidden rounded-lg border border-[var(--jw-border-subtle)] bg-[var(--jw-surface-muted)] px-5 py-7 shadow-[var(--jw-soft-shadow)] sm:px-6">
          <div className="tools-hero-wash pointer-events-none absolute inset-0 opacity-80" />
          <div className="relative">
            <h1 className="jw-heading-text text-4xl font-bold tracking-tight sm:text-5xl">
              {t("toolsPage.title")}
            </h1>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool, index) => {
            const Icon = tool.Icon
            return (
              <Link
                key={tool.slug}
                href={tool.href}
                className="group flex min-h-[104px] items-center gap-4 rounded-lg border border-[var(--jw-border)] bg-[var(--jw-surface)] px-4 py-4 shadow-[var(--jw-soft-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--jw-accent)] hover:bg-[var(--jw-surface-strong)]"
                aria-label={`${tool.title} - ${t("toolsPage.openPlaceholder")}`}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[var(--jw-accent-soft)] text-[var(--jw-accent)]">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="jw-heading-text block truncate text-base font-semibold tracking-tight">
                    {tool.title}
                  </span>
                  <span className="mt-1 inline-flex rounded-full border border-[var(--jw-border-subtle)] px-2 py-0.5 text-[11px] font-medium text-[var(--jw-muted)]">
                    {t("toolsPage.status")}
                  </span>
                </span>
                <ArrowRightIcon className="size-4 shrink-0 text-[var(--jw-accent)] transition-transform group-hover:translate-x-0.5" />
              </Link>
            )
          })}
        </div>
      </section>

      <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start">
        <div className="rounded-lg border border-[var(--jw-border-subtle)] bg-[var(--jw-surface)] p-4 shadow-[var(--jw-soft-shadow)]">
          <div className="space-y-2.5">
            {activityItems.map((item) => {
              const Icon = item.Icon
              return (
                <div
                  key={item.key}
                  className="group rounded-lg border border-[var(--jw-border-subtle)] bg-[var(--jw-surface-muted)] px-3 py-3 transition-colors hover:border-[var(--jw-border)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[var(--jw-surface-strong)] text-[var(--jw-accent)] shadow-[var(--jw-soft-shadow)]">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="jw-heading-text truncate text-sm font-semibold">{item.title}</h2>
                        <span className="shrink-0 rounded-full bg-[var(--jw-accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--jw-accent)]">
                          {item.reward}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <Button className="jw-secondary-button mt-4 w-full rounded-full" disabled>
            {t("toolsPage.activities.cta")}
          </Button>
        </div>
      </aside>
    </div>
  )
}

function ToolDetail({
  tool,
}: {
  tool: {
    slug: ToolSlug
    Icon: typeof PenLineIcon
    title: string
    href: string
  }
}) {
  const { t, locale } = useTranslation()
  const Icon = tool.Icon

  return (
    <section className="mx-auto max-w-5xl">
      <Link
        href={buildLocalizedPath(locale, "/tools")}
        className="jw-themed-link inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium"
      >
        ← {t("toolsPage.detail.back")}
      </Link>

      <div className="mt-5 overflow-hidden rounded-lg border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] shadow-[var(--jw-card-shadow)]">
        <div className="border-b border-[var(--jw-border-subtle)] p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="jw-heading-text text-4xl font-bold tracking-tight sm:text-5xl">{tool.title}</h1>
            </div>
            <span className="w-fit rounded-full border border-[var(--jw-border)] px-3 py-1.5 text-xs font-medium text-[var(--jw-muted)]">
              {t("toolsPage.status")}
            </span>
          </div>
        </div>

        <div className="grid min-h-[420px] gap-0 lg:grid-cols-[1fr_320px]">
          <div className="flex items-center justify-center p-6 sm:p-8">
            <div className="w-full max-w-xl rounded-lg border border-dashed border-[var(--jw-border)] bg-[var(--jw-surface-muted)] p-8 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-[var(--jw-accent-soft)] text-[var(--jw-accent)]">
                <Icon className="size-7" />
              </div>
              <h2 className="jw-heading-text mt-5 text-2xl font-semibold tracking-tight">
                {t("toolsPage.detail.placeholderTitle")}
              </h2>
              <Button className="jw-primary-button mt-6 rounded-full" disabled>
                {t("toolsPage.detail.disabledAction")}
              </Button>
            </div>
          </div>

          <div className="border-t border-[var(--jw-border-subtle)] bg-[var(--jw-surface)] p-6 lg:border-l lg:border-t-0">
            <div className="space-y-3">
              {["account", "tasks", "activity"].map((key) => (
                <div key={key} className="rounded-lg border border-[var(--jw-border-subtle)] p-4">
                  <div className="jw-heading-text text-sm font-medium">{t(`toolsPage.detail.notes.${key}.title`)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
