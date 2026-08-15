"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ArrowRightIcon,
  BarChart3Icon,
  CheckIcon,
  FileInputIcon,
  FileOutputIcon,
  FileType2Icon,
  GlobeIcon,
  ImageIcon,
  Layers3Icon,
  MapIcon,
  MenuIcon,
  PenLineIcon,
  PresentationIcon,
  SmilePlusIcon,
  SparklesIcon,
} from "lucide-react"

import { BrandLogo } from "@/components/brand/brand-logo"
import { ToolboxFileConverterPageContent } from "@/components/file-converter/toolbox-file-converter-page-content"
import { FeatureVideo } from "@/components/home/sections/feature-video"
import {
  LANDING_POSTER_BASE,
  LANDING_VIDEO_BASE,
} from "@/components/home/sections/landing-media"
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
import { ToolboxPptGenerator } from "@/components/tools/toolbox-ppt-generator"
import { persistLocalePreference, useTranslation } from "@/lib/i18n/i18n-context"
import { buildLocalizedPath, switchLocalePathname } from "@/lib/i18n/route-locale"
import type { Locale } from "@/lib/i18n/shared"
import {
  TOOL_INDEX_SLUGS,
  TOOL_SLUGS,
  type ToolSlug,
} from "@/lib/tools/catalog"
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

type ToolCategoryId = "visual" | "data" | "writing" | "documents"

type ToolSummary = {
  slug: ToolSlug
  Icon: typeof PenLineIcon
  title: string
  description: string
  categoryId: ToolCategoryId
  category: string
  meta: string
  href: string
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
          <ToolsIndex tools={tools} />
        )}
      </main>
    </div>
  )
}

function ToolsIndex({ tools }: { tools: ToolSummary[] }) {
  const { t } = useTranslation()
  const indexTools = TOOL_INDEX_SLUGS.map((slug) =>
    tools.find((tool) => tool.slug === slug)
  ).filter((tool): tool is ToolSummary => Boolean(tool))
  const directoryTools = ([
    "markdown-to-word",
    "image-generator",
    "ppt-generator",
    "infographic",
    "ppt-to-word",
    "ai-charts",
  ] as const)
    .map((slug) => indexTools.find((tool) => tool.slug === slug))
    .filter((tool): tool is ToolSummary => Boolean(tool))
  const primaryTool = directoryTools.find((tool) => tool.slug === "markdown-to-word")
  const benefitKeys = ["guest", "editable", "workflow"] as const
  const featuredTools = ([
    {
      slug: "ppt-generator",
      video: "feature-ppt",
      chromeLabel: "tools / presentation generator",
    },
    {
      slug: "infographic",
      video: "feature-infographic",
      chromeLabel: "tools / infographic generator",
    },
  ] as const)
    .map((item) => {
      const tool = indexTools.find((candidate) => candidate.slug === item.slug)
      return tool ? { ...item, tool } : null
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  const renderTaskLink = (tool: ToolSummary) => {
    const Icon = tool.Icon
    return (
      <Link
        key={tool.slug}
        href={tool.href}
        className="tools-task-link"
        aria-label={`${tool.title} - ${t("toolsPage.openPlaceholder")}`}
      >
        <span className="tools-task-link-icon"><Icon className="size-5" aria-hidden="true" /></span>
        <span className="tools-task-link-copy">
          <small>{tool.category}</small>
          <strong>{tool.title}</strong>
          <span>{tool.description}</span>
        </span>
        <span className="tools-task-link-action">
          <span>{t(`toolsPage.toolActions.${tool.slug}`)}</span>
          <span className="tools-task-link-arrow">
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </span>
        </span>
      </Link>
    )
  }

  return (
    <div className="tools-acquisition-page">
      <section className="tools-acquisition-hero" aria-labelledby="tools-page-title">
        <div className="tools-acquisition-copy">
          <p className="tools-acquisition-eyebrow">{t("toolsPage.acquisition.eyebrow")}</p>
          <h1 id="tools-page-title" className="tools-page-title">
            <span>{t("toolsPage.acquisition.headlinePrimary")}</span>
            <strong>{t("toolsPage.acquisition.headlineAccent")}</strong>
          </h1>
          <p className="tools-page-subtitle">{t("toolsPage.acquisition.description")}</p>

          <div className="tools-acquisition-actions">
            {primaryTool ? (
              <Link href={primaryTool.href} className="tools-acquisition-primary">
                <span className="tools-acquisition-primary-icon">
                  <SparklesIcon className="size-5" aria-hidden="true" />
                </span>
                <span className="tools-acquisition-primary-copy">
                  <strong>{t("toolsPage.acquisition.primaryAction")}</strong>
                  <small>{t("toolsPage.acquisition.primaryHint")}</small>
                </span>
                <span className="tools-acquisition-primary-arrow">
                  <ArrowRightIcon className="size-4" aria-hidden="true" />
                </span>
              </Link>
            ) : null}
            <a href="#tools-directory" className="tools-acquisition-secondary">
              {t("toolsPage.acquisition.secondaryAction")}
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="tools-acquisition-visual">
          <FeatureVideo
            srcBase={`${LANDING_VIDEO_BASE}/hero-overview`}
            posterBase={`${LANDING_POSTER_BASE}/hero-overview`}
            label={t("toolsPage.acquisition.demoLabel")}
            chromeLabel="joyword.link / creator workflow"
            analytics={false}
            preload="metadata"
            stageClassName="aspect-video"
          />
          <p className="tools-acquisition-video-caption">
            <span>{t("toolsPage.acquisition.demoCaption")}</span>
            <small>{t("toolsPage.acquisition.demoDuration")}</small>
          </p>
        </div>
      </section>

      <section className="tools-benefit-strip" aria-label={t("toolsPage.acquisition.benefitsLabel")}>
        {benefitKeys.map((key) => (
          <div key={key}>
            <CheckIcon className="size-4" aria-hidden="true" />
            <span>
              <strong>{t(`toolsPage.acquisition.benefits.${key}.title`)}</strong>
              <small>{t(`toolsPage.acquisition.benefits.${key}.description`)}</small>
            </span>
          </div>
        ))}
      </section>

      <section id="tools-directory" className="tools-story" aria-label={t("toolsPage.sections.gridLabel")}>
        <header className="tools-story-header">
          <span>{t("toolsPage.showcase.eyebrow")}</span>
          <h2>{t("toolsPage.showcase.title")}</h2>
          <p>{t("toolsPage.showcase.description")}</p>
        </header>

        <div className="tools-video-features">
          {featuredTools.map(({ tool, video, chromeLabel }, index) => {
            const Icon = tool.Icon
            return (
              <article key={tool.slug} className="tools-video-feature">
                <div className={cn("tools-video-feature-media", index % 2 === 1 && "tools-video-feature-media-reverse")}>
                  <FeatureVideo
                    srcBase={`${LANDING_VIDEO_BASE}/${video}`}
                    posterBase={`${LANDING_POSTER_BASE}/${video}`}
                    label={tool.title}
                    chromeLabel={chromeLabel}
                    featureKey={tool.slug}
                    analytics={false}
                    preload="none"
                    stageClassName="aspect-[16/10]"
                  />
                </div>
                <div className={cn("tools-video-feature-content", index % 2 === 1 && "tools-video-feature-content-reverse")}>
                  <span className="tools-video-feature-index">0{index + 1}</span>
                  <span className="tools-video-feature-icon"><Icon className="size-5" aria-hidden="true" /></span>
                  <h3>{tool.title}</h3>
                  <p>{tool.description}</p>
                  <Link href={tool.href} className="tools-video-feature-cta">
                    <span>
                      <strong>{t(`toolsPage.toolActions.${tool.slug}`)}</strong>
                      <small>{tool.meta}</small>
                    </span>
                    <ArrowRightIcon className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            )
          })}
        </div>

        <section className="tools-complete-directory" aria-labelledby="tools-complete-directory-title">
          <header>
            <h3 id="tools-complete-directory-title">{t("toolsPage.directory.title")}</h3>
            <p>{t("toolsPage.directory.description")}</p>
          </header>
          <div className="tools-task-index">{directoryTools.map(renderTaskLink)}</div>
        </section>
      </section>
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

  if (tool.slug === "ppt-generator") {
    return (
      <section className="tools-detail-page tools-document-converter-page tools-ppt-detail-page">
        <Link
          href={buildLocalizedPath(locale, "/tools")}
          className="jw-themed-link tools-detail-back"
        >
          ← {t("toolsPage.detail.back")}
        </Link>
        <div className="tools-document-converter-shell tools-ppt-generator-shell">
          <ToolboxPptGenerator />
        </div>
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
          <ToolboxFileConverterPageContent mode="markdown-to-word" />
        </div>
      </section>
    )
  }

  if (tool.slug === "ppt-to-word") {
    return (
      <section className="tools-detail-page tools-document-converter-page">
        <Link
          href={buildLocalizedPath(locale, "/tools")}
          className="jw-themed-link tools-detail-back"
        >
          ← {t("toolsPage.detail.back")}
        </Link>
        <div className="tools-document-converter-shell">
          <ToolboxFileConverterPageContent mode="ppt-to-word" />
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
              <h2>{t("toolsPage.detail.placeholderTitle")}</h2>
              <p>{t("toolsPage.detail.placeholderDescription")}</p>
              <Button className="jw-primary-button rounded-full" disabled>
                {t("toolsPage.detail.disabledAction")}
              </Button>
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
