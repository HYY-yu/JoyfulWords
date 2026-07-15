"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ArrowRightIcon,
  BarChart3Icon,
  BookOpenTextIcon,
  CalendarCheckIcon,
  Clock3Icon,
  FileInputIcon,
  FileOutputIcon,
  FileType2Icon,
  GlobeIcon,
  ImageIcon,
  Layers3Icon,
  ListChecksIcon,
  MapIcon,
  MegaphoneIcon,
  MenuIcon,
  PenLineIcon,
  PresentationIcon,
  Share2Icon,
  SmilePlusIcon,
  SparklesIcon,
} from "lucide-react"

import { BrandLogo } from "@/components/brand/brand-logo"
import { FileConverterPageContent } from "@/components/file-converter/file-converter-page-content"
import { Button } from "@/components/ui/base/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/base/sheet"
import { JoyfulThemeSwitcher } from "@/components/theme/joyful-theme-switcher"
import { ToolboxAICharts } from "@/components/tools/toolbox-ai-charts"
import { ToolboxCreateImage } from "@/components/tools/toolbox-create-image"
import { ToolboxInfographic } from "@/components/tools/toolbox-infographic"
import { persistLocalePreference, useTranslation } from "@/lib/i18n/i18n-context"
import { buildLocalizedPath, switchLocalePathname } from "@/lib/i18n/route-locale"
import type { Locale } from "@/lib/i18n/shared"
import { TOOL_SLUGS, type ToolSlug } from "@/lib/tools/catalog"
import { cn } from "@/lib/utils"
import { useState } from "react"

const toolIconMap = {
  "ai-writer": PenLineIcon,
  "image-generator": ImageIcon,
  infographic: Layers3Icon,
  "mind-map": MapIcon,
  "ai-charts": BarChart3Icon,
  "ppt-generator": PresentationIcon,
  "markdown-to-word": FileType2Icon,
  "ppt-to-word": FileInputIcon,
  "word-to-ppt": FileOutputIcon,
  "meme-inserter": SmilePlusIcon,
} satisfies Record<ToolSlug, typeof PenLineIcon>

const toolCategoryMap = {
  "image-generator": "visual",
  infographic: "visual",
  "meme-inserter": "visual",
  "ai-charts": "data",
  "mind-map": "writing",
  "ai-writer": "writing",
  "ppt-generator": "documents",
  "markdown-to-word": "documents",
  "ppt-to-word": "documents",
  "word-to-ppt": "documents",
} satisfies Record<ToolSlug, "visual" | "data" | "writing" | "documents">

const toolCategoryOrder = ["visual", "data", "documents", "writing"] as const

const activityIconMap = {
  checkIn: CalendarCheckIcon,
  share: Share2Icon,
  campaign: MegaphoneIcon,
} satisfies Record<string, typeof CalendarCheckIcon>

const workflowIconMap = {
  visual: Layers3Icon,
  data: BarChart3Icon,
  freewrite: SparklesIcon,
} satisfies Record<string, typeof SparklesIcon>

type ToolSummary = {
  slug: ToolSlug
  Icon: typeof PenLineIcon
  title: string
  description: string
  categoryId: (typeof toolCategoryOrder)[number]
  category: string
  meta: string
  href: string
}

type ActivitySummary = {
  key: string
  Icon: typeof CalendarCheckIcon
  title: string
  reward: string
  description: string
}

interface ToolsPageContentProps {
  selectedToolSlug?: ToolSlug
}

export function ToolsPageContent({ selectedToolSlug }: ToolsPageContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { t, locale } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isDetailPage = Boolean(selectedToolSlug)
  const homeHref = buildLocalizedPath(locale)
  const featuresHref = `${homeHref}#features`
  const blogHref = buildLocalizedPath(locale, "/blog")
  const mcpHref = buildLocalizedPath(locale, "/mcp")
  const pricingHref = buildLocalizedPath(locale, "/pricing")
  const toolsHref = buildLocalizedPath(locale, "/tools")
  const tools = TOOL_SLUGS.map((slug) => {
    const Icon = toolIconMap[slug]
    return {
      slug,
      Icon,
      title: t(`toolsPage.tools.${slug}.title`),
      description: t(`toolsPage.tools.${slug}.description`),
      categoryId: toolCategoryMap[slug],
      category: t(`toolsPage.tools.${slug}.category`),
      meta: t(`toolsPage.tools.${slug}.meta`),
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
      description: t(`toolsPage.activities.${key}.description`),
    }
  })

  const handleLocaleChange = (nextLocale: Locale) => {
    if (nextLocale === locale) return

    persistLocalePreference(nextLocale)
    router.replace(switchLocalePathname(pathname, nextLocale))
  }

  return (
    <div className="jw-app-shell tools-page-shell min-h-screen overflow-x-hidden">
      <header className="jw-app-header fixed top-0 right-0 left-0 z-50 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-2xl sm:px-6 md:px-10">
        <Link
          href={homeHref}
          className="rounded-xl transition-transform hover:-translate-y-0.5"
          aria-label="JoyfulWords"
        >
          <BrandLogo />
        </Link>
        <div className="flex-1" />

        <div className="hidden items-center gap-2 xl:flex">
          <JoyfulThemeSwitcher variant="compact" />
          <button
            onClick={() => handleLocaleChange(locale === "zh" ? "en" : "zh")}
            className="jw-themed-link flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm"
          >
            <GlobeIcon className="h-4 w-4" />
            {locale === "zh" ? "EN" : "中文"}
          </button>
          <Link href={featuresHref} className="jw-themed-link rounded-full px-3.5 py-1.5 text-sm">
            {t("landing.nav.features")}
          </Link>
          <Link href={pricingHref} className="jw-themed-link rounded-full px-3.5 py-1.5 text-sm">
            {t("landing.nav.pricing")}
          </Link>
          <Link href={mcpHref} className="jw-themed-link rounded-full px-3.5 py-1.5 text-sm">
            {t("landing.nav.mcp")}
          </Link>
          <Link
            href={toolsHref}
            aria-current="page"
            className={cn(
              "jw-themed-link rounded-full px-3.5 py-1.5 text-sm",
              "bg-[var(--jw-accent-soft)] text-[var(--jw-accent)] shadow-[var(--jw-soft-shadow)]"
            )}
          >
            {t("landing.nav.tools")}
          </Link>
          <Link href={blogHref} className="jw-themed-link rounded-full px-3.5 py-1.5 text-sm">
            {t("landing.nav.blog")}
          </Link>
          <Button variant="outline" size="sm" className="jw-secondary-button rounded-full shadow-sm" asChild>
            <Link href="/articles" prefetch={false}>
              {t("landing.nav.myArticles")}
            </Link>
          </Button>
          <Button size="sm" className="jw-primary-button rounded-full" asChild>
            <Link href="/articles" prefetch={false}>
              {t("landing.nav.startCreating")}
            </Link>
          </Button>
        </div>

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden"
              aria-label={t("landing.nav.menu")}
            >
              <MenuIcon className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="gap-0">
            <SheetHeader className="pb-2">
              <SheetTitle>{t("landing.nav.menu")}</SheetTitle>
              <SheetDescription className="sr-only">
                {t("landing.nav.menuDescription")}
              </SheetDescription>
            </SheetHeader>

            <nav className="flex flex-col gap-1 px-4 pb-6">
              <div className="mb-2">
                <JoyfulThemeSwitcher variant="compact" className="w-full justify-between" />
              </div>
              <button
                onClick={() => {
                  handleLocaleChange(locale === "zh" ? "en" : "zh")
                  setMobileMenuOpen(false)
                }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/85 hover:bg-accent hover:text-foreground"
              >
                <GlobeIcon className="h-4 w-4" />
                {locale === "zh" ? "EN" : "中文"}
              </button>

              <Link
                href={featuresHref}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-foreground/85 hover:bg-accent hover:text-foreground"
              >
                {t("landing.nav.features")}
              </Link>

              <Link
                href={pricingHref}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-foreground/85 hover:bg-accent hover:text-foreground"
              >
                {t("landing.nav.pricing")}
              </Link>

              <Link
                href={mcpHref}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-foreground/85 hover:bg-accent hover:text-foreground"
              >
                {t("landing.nav.mcp")}
              </Link>

              <Link
                href={toolsHref}
                aria-current="page"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium",
                  "bg-[var(--jw-accent-soft)] text-[var(--jw-accent)]"
                )}
              >
                {t("landing.nav.tools")}
              </Link>

              <Link
                href={blogHref}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-foreground/85 hover:bg-accent hover:text-foreground"
              >
                {t("landing.nav.blog")}
              </Link>

              <div className="my-2 h-px bg-border" />

              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/articles" prefetch={false} onClick={() => setMobileMenuOpen(false)}>
                  {t("landing.nav.myArticles")}
                </Link>
              </Button>
              <Button className="w-full justify-start" asChild>
                <Link href="/articles" prefetch={false} onClick={() => setMobileMenuOpen(false)}>
                  {t("landing.nav.startCreating")}
                </Link>
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      <main className="tools-page-main mx-auto max-w-[1500px] px-4 pt-24 pb-6 sm:px-6 lg:pt-28 lg:pb-8">
        {isDetailPage && selectedTool ? (
          <ToolDetail tool={selectedTool} />
        ) : (
          <ToolsIndex tools={tools} activityItems={activityItems} />
        )}
      </main>
    </div>
  )
}

function ToolsIndex({
  tools,
  activityItems,
}: {
  tools: ToolSummary[]
  activityItems: ActivitySummary[]
}) {
  const { t } = useTranslation()
  const workspaceHref = "/articles"
  const groupedTools = toolCategoryOrder.map((categoryId) => ({
    categoryId,
    title: t(`toolsPage.categories.${categoryId}.title`),
    description: t(`toolsPage.categories.${categoryId}.description`),
    tools: tools.filter((tool) => tool.categoryId === categoryId),
  }))
  const workflowSteps = (["visual", "data", "freewrite"] as const).map((key) => {
    const Icon = workflowIconMap[key]
    const recommendedSlugs = {
      visual: ["image-generator", "infographic", "ai-charts"],
      data: ["ai-charts"],
      freewrite: ["ai-writer"],
    }[key] as ToolSlug[]

    return {
      key,
      Icon,
      title: t(`toolsPage.workflow.steps.${key}.title`),
      description: t(`toolsPage.workflow.steps.${key}.description`),
      tools: recommendedSlugs
        .map((slug) => tools.find((tool) => tool.slug === slug))
        .filter((tool): tool is ToolSummary => Boolean(tool)),
    }
  })

  return (
    <div className="tools-composition">
      <section className="tools-hero" aria-labelledby="tools-page-title">
        <div className="tools-hero-copy">
          <h1 id="tools-page-title" className="tools-page-title">
            {t("toolsPage.title")}
          </h1>
          <p className="tools-page-subtitle">
            {t("toolsPage.subtitle.intro")} {t("toolsPage.subtitle.workspacePrompt")}{" "}
            <Link href={workspaceHref} className="tools-page-subtitle-link">
              {t("toolsPage.subtitle.workspaceLink")}
            </Link>
          </p>
        </div>

        <div className="tools-hero-metrics" aria-label={t("toolsPage.metrics.label")}>
          <div className="tools-metric">
            <span className="tools-metric-value">{t("toolsPage.metrics.tools.value")}</span>
            <span className="tools-metric-label">{t("toolsPage.metrics.tools.label")}</span>
          </div>
          <div className="tools-metric">
            <span className="tools-metric-value">{t("toolsPage.metrics.workflow.value")}</span>
            <span className="tools-metric-label">{t("toolsPage.metrics.workflow.label")}</span>
          </div>
        </div>
      </section>

      <div className="tools-layout-grid">
        <section className="tools-workspace min-w-0">
          <div className="tools-category-board" aria-label={t("toolsPage.sections.gridLabel")}>
            {groupedTools.map((group) => (
              <section key={group.categoryId} className="tools-category-section">
                <div className="tools-category-header">
                  <div className="min-w-0">
                    <h2>{group.title}</h2>
                    <p>{group.description}</p>
                  </div>
                  <span>{group.tools.length}</span>
                </div>

                <div className="tools-link-grid">
                  {group.tools.map((tool) => {
                    const Icon = tool.Icon
                    const isAvailableTool =
                      tool.slug === "image-generator" ||
                      tool.slug === "infographic" ||
                      tool.slug === "ai-charts" ||
                      tool.slug === "markdown-to-word"
                    return (
                      <Link
                        key={tool.slug}
                        href={tool.href}
                        className="tools-link-row group"
                        data-category={group.categoryId}
                        data-tool={tool.slug}
                        aria-label={`${tool.title} - ${t("toolsPage.openPlaceholder")}`}
                      >
                        <span className="tools-row-topline">
                          <span className="tools-row-icon">
                            <Icon className="size-5" />
                          </span>
                          <span className="tools-row-state">
                            {isAvailableTool ? t("toolsPage.availableStatus") : t("toolsPage.status")}
                          </span>
                        </span>
                        <span className="tools-row-title">{tool.title}</span>
                        <span className="tools-row-description">{tool.description}</span>
                        <span className="tools-row-footer">
                          <span>{tool.meta}</span>
                          <ArrowRightIcon className="tools-row-arrow size-4" />
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>

        <aside className="tools-side-rail min-w-0">
          <section className="tools-workflow-rail">
            <div className="tools-rail-heading">
              <span>{t("toolsPage.workflow.title")}</span>
              <ListChecksIcon className="size-4" />
            </div>
            <div className="tools-workflow-list">
              {workflowSteps.map((step, index) => {
                const Icon = step.Icon

                return (
                  <div key={step.key} className="tools-workflow-step">
                    <span className="tools-workflow-number">{String(index + 1).padStart(2, "0")}</span>
                    <span className="tools-workflow-icon">
                      <Icon className="size-4" />
                    </span>
                    <span className="tools-workflow-copy">
                      <span>{step.title}</span>
                      <small>{step.description}</small>
                      <span className="tools-workflow-tools" aria-label={t("toolsPage.workflow.recommendedTools")}>
                        {step.tools.map((tool) => (
                          <Link key={tool.slug} href={tool.href}>
                            {tool.title}
                          </Link>
                        ))}
                      </span>
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          <div className="tools-activity-rail">
            <div className="tools-rail-heading">
              <span>{t("toolsPage.activities.title")}</span>
              <Clock3Icon className="size-4" />
            </div>
            <div className="tools-activity-list">
              {activityItems.map((item) => {
                const Icon = item.Icon
                return (
                  <div key={item.key} className="tools-activity-row">
                    <span className="tools-activity-icon">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="tools-activity-title-row">
                        <h2 className="truncate text-sm font-semibold">{item.title}</h2>
                        <span>{item.reward}</span>
                      </div>
                      <p className="text-xs leading-5 text-[var(--jw-muted)]">{item.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <Button className="tools-activity-button" disabled>
              {t("toolsPage.activities.cta")}
            </Button>
          </div>

          <section className="tools-workspace-cta">
            <div className="tools-cta-copy">
              <div>
                <p className="tools-cta-kicker">{t("toolsPage.nav.workspace")}</p>
                <h2 className="tools-cta-title">
                  {t("toolsPage.workspaceCta.title")}
                </h2>
                <p className="tools-cta-description">
                  {t("toolsPage.workspaceCta.description")}
                </p>
              </div>
              <Button asChild className="tools-cta-button">
                <Link href="/articles">
                  <BookOpenTextIcon className="size-4" />
                  {t("toolsPage.workspaceCta.action")}
                </Link>
              </Button>
            </div>
          </section>

          <div className="tools-side-ambient" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </aside>
      </div>
    </div>
  )
}

function ToolDetail({
  tool,
}: {
  tool: ToolSummary
}) {
  const { t, locale } = useTranslation()
  const Icon = tool.Icon
  const noteKeys = ["account", "tasks", "activity"] as const
  const previewKeys = ["input", "generate", "export"] as const

  if (tool.slug === "image-generator") {
    return (
      <section className="tools-detail-page tools-image-detail-page">
        <Link
          href={buildLocalizedPath(locale, "/tools")}
          className="jw-themed-link tools-detail-back"
        >
          ← {t("toolsPage.detail.back")}
        </Link>
        <ToolboxCreateImage />
      </section>
    )
  }

  if (tool.slug === "infographic") {
    return (
      <section className="tools-detail-page tools-image-detail-page">
        <Link
          href={buildLocalizedPath(locale, "/tools")}
          className="jw-themed-link tools-detail-back"
        >
          ← {t("toolsPage.detail.back")}
        </Link>
        <ToolboxInfographic />
      </section>
    )
  }

  if (tool.slug === "ai-charts") {
    return (
      <section className="tools-detail-page tools-image-detail-page">
        <Link
          href={buildLocalizedPath(locale, "/tools")}
          className="jw-themed-link tools-detail-back"
        >
          ← {t("toolsPage.detail.back")}
        </Link>
        <ToolboxAICharts />
      </section>
    )
  }

  if (tool.slug === "markdown-to-word") {
    return (
      <section className="tools-detail-page tools-document-converter-page">
        <Link
          href={buildLocalizedPath(locale, "/tools")}
          className="jw-themed-link tools-detail-back"
        >
          ← {t("toolsPage.detail.back")}
        </Link>
        <div className="tools-document-converter-shell">
          <FileConverterPageContent variant="studio" />
        </div>
      </section>
    )
  }

  return (
    <section className="tools-detail-page">
      <Link
        href={buildLocalizedPath(locale, "/tools")}
        className="jw-themed-link tools-detail-back"
      >
        ← {t("toolsPage.detail.back")}
      </Link>

      <div className="tools-detail-shell">
        <div className="tools-detail-header">
          <div className="tools-detail-icon">
            <Icon className="size-7" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="tools-tool-category">{tool.category}</p>
            <h1 className="tools-detail-title">{tool.title}</h1>
            <p className="tools-detail-description">{tool.description}</p>
          </div>
          <div className="tools-detail-status">
            <span>{tool.meta}</span>
            <strong>
              {t("toolsPage.status")}
            </strong>
          </div>
        </div>

        <div className="tools-detail-grid">
          <div className="tools-detail-preview">
            <div className="tools-preview-window">
              <div className="tools-preview-toolbar" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="tools-preview-body">
                <div className="tools-preview-command">
                  <SparklesIcon className="size-5" />
                  <span>{t("toolsPage.detail.previewPrompt")}</span>
                </div>
                <div className="tools-preview-lines" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="tools-preview-steps">
                  {previewKeys.map((key) => (
                    <span key={key}>{t(`toolsPage.detail.previewSteps.${key}`)}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="tools-detail-placeholder">
              <h2>
                {tool.slug === "ppt-generator"
                  ? t("toolsPage.detail.pptTitle")
                  : t("toolsPage.detail.placeholderTitle")}
              </h2>
              <p>
                {tool.slug === "ppt-generator"
                  ? t("toolsPage.detail.pptDescription")
                  : t("toolsPage.detail.placeholderDescription")}
              </p>
              {tool.slug === "ppt-generator" ? (
                <Button asChild className="jw-primary-button rounded-full">
                  <Link href="/articles">{t("toolsPage.detail.pptAction")}</Link>
                </Button>
              ) : (
                <Button className="jw-primary-button rounded-full" disabled>
                  {t("toolsPage.detail.disabledAction")}
                </Button>
              )}
            </div>
          </div>

          <aside className="tools-detail-notes">
            <div className="tools-rail-heading">
              <span>{t("toolsPage.detail.notesTitle")}</span>
            </div>
            <div className="tools-detail-note-list">
              {noteKeys.map((key) => (
                <div key={key} className="tools-detail-note">
                  <div className="jw-heading-text text-sm font-semibold">{t(`toolsPage.detail.notes.${key}.title`)}</div>
                  <p>{t(`toolsPage.detail.notes.${key}.description`)}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
