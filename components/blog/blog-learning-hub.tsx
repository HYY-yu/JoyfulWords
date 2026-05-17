"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowUp,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Compass,
  Globe,
  Layers3,
  MenuIcon,
  PlayCircle,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react"

import { BrandLogo } from "@/components/brand/brand-logo"
import { JoyfulThemeSwitcher } from "@/components/theme/joyful-theme-switcher"
import { Button } from "@/components/ui/base/button"
import { Input } from "@/components/ui/base/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/base/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/base/tabs"
import { persistLocalePreference, useTranslation } from "@/lib/i18n/i18n-context"
import type { Locale } from "@/lib/i18n/shared"
import { buildLocalizedPath } from "@/lib/i18n/route-locale"
import { cn } from "@/lib/utils"

const ALL_TOPICS = "all"

export interface BlogLearningHubPost {
  slug: string
  topic: string
  title: string
  date: string
  formattedDate: string
  summary: string
  locale: Locale
  availableLocales: Locale[]
  isFallback: boolean
  image?: string
}

export interface BlogLearningHubTopic {
  id: string
  anchor: string
  order: number
  label: string
  description: string
  audienceHint: string
  emptyState: string
  posts: BlogLearningHubPost[]
}

interface BlogLearningHubCopy {
  backToHome: string
  backToTop: string
  clearFilters: string
  continueLearning: string
  emptyText: string
  emptyTitle: string
  fallbackNotice: string
  featuredLabel: string
  introChips: string[]
  lessonLabel: string
  lessonsLabel: string
  modulesLabel: string
  overline: string
  pathDescription: string
  pathTitle: string
  readMore: string
  resultLabel: string
  searchLabel: string
  searchPlaceholder: string
  showAll: string
  subtitle: string
  title: string
  topicFilterLabel: string
  updatedLabel: string
}

interface BlogLearningHubProps {
  copy: BlogLearningHubCopy
  locale: Locale
  posts: BlogLearningHubPost[]
  topicSections: BlogLearningHubTopic[]
}

function formatCount(locale: Locale, count: number) {
  return locale === "zh" ? `${count} 篇教程` : `${count} tutorials`
}

function includesQuery(value: string, query: string) {
  return value.toLocaleLowerCase().includes(query)
}

function getArticleHref(locale: Locale, slug: string) {
  return buildLocalizedPath(locale, `/blog/${slug}`)
}

export function BlogLearningHub({
  copy,
  locale,
  posts,
  topicSections,
}: BlogLearningHubProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const [activeTopic, setActiveTopic] = useState(ALL_TOPICS)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [query, setQuery] = useState("")
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const selectedTopic = topicSections.find((topic) => topic.id === activeTopic)

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesTopic = activeTopic === ALL_TOPICS || post.topic === activeTopic
      const topic = topicSections.find((item) => item.id === post.topic)
      const haystack = [
        post.title,
        post.summary,
        post.formattedDate,
        topic?.label,
        topic?.description,
      ]
        .filter(Boolean)
        .join(" ")

      return matchesTopic && (!normalizedQuery || includesQuery(haystack, normalizedQuery))
    })
  }, [activeTopic, normalizedQuery, posts, topicSections])

  const visibleTopicSections = useMemo(() => {
    return topicSections
      .filter((topic) => activeTopic === ALL_TOPICS || topic.id === activeTopic)
      .map((topic) => ({
        ...topic,
        posts: filteredPosts.filter((post) => post.topic === topic.id),
      }))
      .filter((topic) => topic.posts.length > 0 || (!normalizedQuery && activeTopic !== ALL_TOPICS))
  }, [activeTopic, filteredPosts, normalizedQuery, topicSections])

  const featuredPost = filteredPosts[0] ?? posts[0]
  const hasFilteredPosts = filteredPosts.length > 0
  const homePath = buildLocalizedPath(locale)
  const blogHref = buildLocalizedPath(locale, "/blog")
  const featuresHref = `${homePath}#features`
  const pricingHref = buildLocalizedPath(locale, "/pricing")
  const mcpHref = buildLocalizedPath(locale, "/mcp")
  const toolsHref = buildLocalizedPath(locale, "/tools")
  const activeLabel = selectedTopic?.label ?? copy.showAll

  const switchLocale = () => {
    const nextLocale = locale === "zh" ? "en" : "zh"
    persistLocalePreference(nextLocale)
    router.replace(buildLocalizedPath(nextLocale, "/blog"))
  }

  return (
    <main id="top" className="jw-app-shell relative min-h-screen overflow-hidden">
      <div className="jw-hero-wash pointer-events-none absolute inset-x-0 top-0 h-[46rem]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[46rem] opacity-[0.22] [background-image:radial-gradient(circle_at_1px_1px,rgba(93,75,47,0.22)_1px,transparent_0)] [background-size:30px_30px]" />

      <header className="jw-app-header fixed top-0 right-0 left-0 z-50 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-2xl sm:px-6 md:px-10">
        <Link href={homePath} aria-label="JoyfulWords">
          <BrandLogo />
        </Link>
        <div className="flex-1" />

        <div className="hidden items-center gap-3 lg:flex">
          <JoyfulThemeSwitcher variant="compact" />
          <button
            type="button"
            onClick={switchLocale}
            className="jw-themed-link flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm"
          >
            <Globe className="h-4 w-4" />
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
          <Link href={toolsHref} className="jw-themed-link rounded-full px-3.5 py-1.5 text-sm">
            {t("landing.nav.tools")}
          </Link>
          <Link
            href={blogHref}
            aria-current="page"
            className="jw-themed-link jw-themed-link-active rounded-full px-3.5 py-1.5 text-sm"
          >
            {t("landing.nav.blog")}
          </Link>
          <Button variant="outline" size="sm" className="jw-secondary-button rounded-full shadow-sm" asChild>
            <Link href="/articles" prefetch={false}>{t("landing.nav.myArticles")}</Link>
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
              className="lg:hidden"
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
                type="button"
                onClick={() => {
                  switchLocale()
                  setMobileMenuOpen(false)
                }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/85 hover:bg-accent hover:text-foreground"
              >
                <Globe className="h-4 w-4" />
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
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-foreground/85 hover:bg-accent hover:text-foreground"
              >
                {t("landing.nav.tools")}
              </Link>
              <Link
                href={blogHref}
                onClick={() => setMobileMenuOpen(false)}
                aria-current="page"
                className="rounded-md bg-[var(--jw-accent-soft)] px-3 py-2 text-sm font-medium text-[var(--jw-heading)]"
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

      <div className="relative mx-auto min-h-screen max-w-7xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        <section className="grid gap-6 py-8 lg:grid-cols-[minmax(0,1.18fr)_360px] lg:py-10">
          <div className="flex flex-col justify-between gap-8 border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] p-6 shadow-[var(--jw-card-shadow)] rounded-lg sm:p-8">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-[var(--jw-accent)]">
                <BookOpenCheck className="h-4 w-4" />
                <span>{copy.overline}</span>
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-[var(--jw-heading)] sm:text-5xl">
                {copy.title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--jw-muted)] sm:text-lg">
                {copy.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {copy.introChips.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-2 border border-[var(--jw-border)] bg-[var(--jw-surface-muted)] px-3 py-2 text-sm text-[var(--jw-heading)] rounded-lg"
                >
                  <CheckCircle2 className="h-4 w-4 text-[var(--jw-accent)]" />
                  {chip}
                </span>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MetricTile icon={Layers3} label={copy.modulesLabel} value={String(topicSections.length)} />
              <MetricTile icon={PlayCircle} label={copy.lessonsLabel} value={String(posts.length)} />
              <MetricTile icon={Clock3} label={copy.updatedLabel} value={posts[0]?.formattedDate ?? "-"} />
            </div>
          </div>

          <aside className="border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] p-5 shadow-[var(--jw-soft-shadow)] rounded-lg">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center bg-[var(--jw-accent-soft)] text-[var(--jw-accent)] rounded-lg">
                <Compass className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-[var(--jw-heading)]">{copy.pathTitle}</h2>
                <p className="text-sm leading-6 text-[var(--jw-muted)]">{copy.pathDescription}</p>
              </div>
            </div>

            <div className="jw-blog-route-map mt-6">
              <svg
                className="jw-blog-route-path"
                viewBox="0 0 320 430"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M72 28 C238 42 250 116 132 140 C34 160 42 238 194 254 C304 267 290 340 146 362 C72 374 72 410 236 420" />
              </svg>
              {topicSections.map((topic, index) => {
                const isActive = activeTopic === topic.id || (activeTopic === ALL_TOPICS && index === 0)

                return (
                  <button
                    key={topic.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveTopic(topic.id)}
                    className={cn(
                      "jw-blog-route-stop",
                      index % 2 === 0 ? "self-start" : "self-end",
                      isActive ? "is-active" : "",
                    )}
                  >
                    <span className="jw-blog-route-pin">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="jw-blog-route-copy">
                      <span>{topic.label}</span>
                      <small>
                        {formatCount(locale, topic.posts.length)}
                      </small>
                    </span>
                  </button>
                )
              })}
            </div>
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] p-4 shadow-[var(--jw-soft-shadow)] rounded-lg">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--jw-heading)]">
                <SlidersHorizontal className="h-4 w-4 text-[var(--jw-accent)]" />
                {copy.topicFilterLabel}
              </div>

              <Tabs value={activeTopic} onValueChange={setActiveTopic} className="mt-4">
                <TabsList className="h-auto w-full flex-col items-stretch gap-1 bg-transparent p-0">
                  <TabsTrigger
                    value={ALL_TOPICS}
                    className="h-auto justify-start border border-transparent px-3 py-2 text-[var(--jw-heading)] hover:text-[var(--jw-accent)] data-[state=active]:border-[var(--jw-accent)] data-[state=active]:bg-[var(--jw-accent-soft)] data-[state=active]:text-[var(--jw-heading)] data-[state=active]:shadow-none rounded-lg"
                  >
                    {copy.showAll}
                  </TabsTrigger>
                  {topicSections.map((topic) => (
                    <TabsTrigger
                      key={topic.id}
                      value={topic.id}
                      className="h-auto justify-between border border-transparent px-3 py-2 text-[var(--jw-heading)] hover:text-[var(--jw-accent)] data-[state=active]:border-[var(--jw-accent)] data-[state=active]:bg-[var(--jw-accent-soft)] data-[state=active]:text-[var(--jw-heading)] data-[state=active]:shadow-none rounded-lg"
                    >
                      <span className="truncate">{topic.label}</span>
                      <span className="ml-2 text-xs text-[var(--jw-muted)]">{topic.posts.length}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </aside>

          <div className="min-w-0 space-y-6">
            <div className="border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] p-4 shadow-[var(--jw-soft-shadow)] rounded-lg sm:p-5">
              <label className="text-sm font-medium text-[var(--jw-heading)]" htmlFor="blog-search">
                {copy.searchLabel}
              </label>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--jw-muted)]" />
                  <Input
                    id="blog-search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={copy.searchPlaceholder}
                    className="h-11 border-[var(--jw-border)] bg-[var(--jw-surface)] pl-10 text-[var(--jw-heading)] rounded-lg"
                  />
                </div>
                {(query || activeTopic !== ALL_TOPICS) ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 border-[var(--jw-border)] bg-[var(--jw-surface)] text-[var(--jw-heading)] rounded-lg"
                    onClick={() => {
                      setQuery("")
                      setActiveTopic(ALL_TOPICS)
                    }}
                  >
                    <X className="h-4 w-4" />
                    {copy.clearFilters}
                  </Button>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[var(--jw-muted)]" aria-live="polite">
                <span>{copy.resultLabel}: {formatCount(locale, filteredPosts.length)}</span>
                <span className="h-1 w-1 rounded-full bg-[var(--jw-border)]" />
                <span>{activeLabel}</span>
              </div>
            </div>

            {hasFilteredPosts && featuredPost ? (
              <FeaturedLessonCard copy={copy} locale={locale} post={featuredPost} />
            ) : (
              <EmptyState copy={copy} />
            )}

            <div className="space-y-6">
              {visibleTopicSections.map((topic) => (
                <section
                  key={topic.id}
                  id={topic.anchor}
                  className="scroll-mt-24 border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] p-5 shadow-[var(--jw-soft-shadow)] rounded-lg sm:p-6"
                >
                  <div className="flex flex-col gap-4 border-b border-[var(--jw-border)] pb-5 md:flex-row md:items-end md:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--jw-accent)]">{copy.lessonLabel}</p>
                      <h2 className="mt-2 text-2xl font-semibold leading-tight text-[var(--jw-heading)]">
                        {topic.label}
                      </h2>
                      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--jw-muted)]">
                        {topic.description}
                      </p>
                      <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--jw-muted)]">
                        {topic.audienceHint}
                      </p>
                    </div>
                    <a
                      href="#top"
                      className="inline-flex items-center gap-2 text-sm font-medium text-[var(--jw-muted)] transition-colors hover:text-[var(--jw-accent)]"
                    >
                      <ArrowUp className="h-4 w-4" />
                      {copy.backToTop}
                    </a>
                  </div>

                  {topic.posts.length === 0 ? (
                    <div className="mt-5 border border-dashed border-[var(--jw-border)] bg-[var(--jw-surface-muted)] p-5 text-sm text-[var(--jw-muted)] rounded-lg">
                      {topic.emptyState}
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-4">
                      {topic.posts.map((post, index) => (
                        <LessonRow
                          copy={copy}
                          index={index}
                          key={`${topic.id}-${post.slug}-${post.locale}`}
                          locale={locale}
                          post={post}
                        />
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Layers3
  label: string
  value: string
}) {
  return (
    <div className="border border-[var(--jw-border)] bg-[var(--jw-surface)] p-4 rounded-lg">
      <div className="flex items-center gap-2 text-sm text-[var(--jw-muted)]">
        <Icon className="h-4 w-4 text-[var(--jw-accent)]" />
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold text-[var(--jw-heading)]">{value}</div>
    </div>
  )
}

function FeaturedLessonCard({
  copy,
  locale,
  post,
}: {
  copy: BlogLearningHubCopy
  locale: Locale
  post: BlogLearningHubPost
}) {
  return (
    <article className="grid overflow-hidden border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] shadow-[var(--jw-card-shadow)] rounded-lg lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col justify-between gap-6 p-5 sm:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--jw-muted)]">
            <Sparkles className="h-4 w-4 text-[var(--jw-accent)]" />
            <span className="font-medium text-[var(--jw-accent)]">{copy.featuredLabel}</span>
            <span className="h-1 w-1 rounded-full bg-[var(--jw-border)]" />
            <time dateTime={post.date}>{post.formattedDate}</time>
            <span className="h-1 w-1 rounded-full bg-[var(--jw-border)]" />
            <span>{post.locale.toUpperCase()}</span>
          </div>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-[var(--jw-heading)]">
            <Link
              href={getArticleHref(locale, post.slug)}
              className="transition-colors hover:text-[var(--jw-accent)]"
            >
              {post.title}
            </Link>
          </h2>
          <p className="mt-4 text-sm leading-7 text-[var(--jw-muted)] sm:text-base">
            {post.summary}
          </p>
          {post.isFallback ? (
            <p className="mt-4 border border-[var(--jw-border)] bg-[var(--jw-surface-muted)] px-3 py-2 text-sm text-[var(--jw-muted)] rounded-lg">
              {copy.fallbackNotice.replace("{locale}", post.locale.toUpperCase())}
            </p>
          ) : null}
        </div>

        <Button asChild className="w-fit bg-[var(--jw-accent)] text-[var(--jw-accent-foreground)] hover:bg-[var(--jw-accent-hover)] rounded-lg">
          <Link href={getArticleHref(locale, post.slug)}>
            <PlayCircle className="h-4 w-4" />
            {copy.continueLearning}
          </Link>
        </Button>
      </div>
      <Link
        href={getArticleHref(locale, post.slug)}
        className="jw-blog-lesson-media relative min-h-64 overflow-hidden bg-[var(--jw-surface-muted)]"
      >
        <Image
          src={post.image ?? "/og/default.webp"}
          alt={post.title}
          fill
          sizes="(min-width: 1024px) 320px, 100vw"
          className="jw-blog-lesson-image object-cover transition-transform duration-500 hover:scale-105"
        />
        <span className="jw-blog-lesson-image-overlay" aria-hidden="true" />
        <span className="jw-blog-lesson-theme-art" aria-hidden="true">
          <span className="jw-blog-art-window">
            <span className="jw-blog-art-toolbar">
              <span />
              <span />
              <span />
            </span>
            <span className="jw-blog-art-body">
              <span className="jw-blog-art-hero" />
              <span className="jw-blog-art-lines">
                <span />
                <span />
                <span />
              </span>
              <span className="jw-blog-art-spark" />
            </span>
          </span>
          <span className="jw-blog-art-card jw-blog-art-card-one" />
          <span className="jw-blog-art-card jw-blog-art-card-two" />
        </span>
      </Link>
    </article>
  )
}

function LessonRow({
  copy,
  index,
  locale,
  post,
}: {
  copy: BlogLearningHubCopy
  index: number
  locale: Locale
  post: BlogLearningHubPost
}) {
  return (
    <article className="group grid gap-4 border border-[var(--jw-border)] bg-[var(--jw-surface)] p-4 transition-all hover:border-[var(--jw-accent)] hover:bg-[var(--jw-surface-strong)] rounded-lg sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:items-center">
      <div className="flex h-16 w-16 items-center justify-center border border-[var(--jw-border)] bg-[var(--jw-surface-muted)] text-lg font-semibold text-[var(--jw-accent)] rounded-lg">
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--jw-muted)]">
          <time dateTime={post.date}>{post.formattedDate}</time>
          <span className="h-1 w-1 rounded-full bg-[var(--jw-border)]" />
          <span>{post.locale.toUpperCase()}</span>
        </div>
        <h3 className="mt-2 text-lg font-semibold leading-snug text-[var(--jw-heading)]">
          <Link
            href={getArticleHref(locale, post.slug)}
            className="transition-colors hover:text-[var(--jw-accent)]"
          >
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--jw-muted)]">{post.summary}</p>
        {post.isFallback ? (
          <p className="mt-2 text-xs leading-5 text-[var(--jw-muted)]">
            {copy.fallbackNotice.replace("{locale}", post.locale.toUpperCase())}
          </p>
        ) : null}
      </div>

      <Button
        asChild
        variant="outline"
        className="border-[var(--jw-border)] bg-transparent text-[var(--jw-heading)] group-hover:border-[var(--jw-accent)] group-hover:text-[var(--jw-accent)] rounded-lg"
      >
        <Link href={getArticleHref(locale, post.slug)}>
          {copy.readMore}
          <PlayCircle className="h-4 w-4" />
        </Link>
      </Button>
    </article>
  )
}

function EmptyState({ copy }: { copy: BlogLearningHubCopy }) {
  return (
    <div className="border border-dashed border-[var(--jw-border)] bg-[var(--jw-surface-strong)] p-8 text-center rounded-lg">
      <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[var(--jw-accent-soft)] text-[var(--jw-accent)] rounded-lg">
        <Search className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-[var(--jw-heading)]">{copy.emptyTitle}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[var(--jw-muted)]">{copy.emptyText}</p>
    </div>
  )
}
