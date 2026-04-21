import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Compass, Sparkles } from "lucide-react"
import { BlogLanguageToggle } from "@/components/blog/blog-language-toggle"
import { getBlogList } from "@/lib/blog"
import { getBlogTopics } from "@/lib/blog-topics"
import { getServerDictionary } from "@/lib/i18n/server"
import { buildLocalizedPath, isLocale, SUPPORTED_LOCALES } from "@/lib/i18n/route-locale"
import { buildMetadata } from "@/lib/seo"

interface LocalePageProps {
  params: Promise<{
    locale: string
  }>
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

function formatDate(dateString: string, locale: "zh" | "en") {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateString))
}

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params

  if (!isLocale(locale)) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const isZh = locale === "zh"

  return buildMetadata({
    title: isZh ? "博客" : "Blog",
    description: isZh
      ? "浏览 JoyfulWords 的 AI 写作、SEO 内容、博客工作流、视觉内容和内容生产系统相关文章。"
      : "Explore JoyfulWords articles on AI writing, SEO content creation, blogging workflows, visuals, and content production systems.",
    path: buildLocalizedPath(locale, "/blog"),
    locale,
    alternatePaths: {
      zh: buildLocalizedPath("zh", "/blog"),
      en: buildLocalizedPath("en", "/blog"),
    },
    keywords: isZh
      ? ["AI写作博客", "SEO内容创作", "博客写作流程", "内容营销写作", "JoyfulWords博客"]
      : ["AI writing blog", "SEO content creation", "blog writing workflow", "content marketing writing", "JoyfulWords blog"],
  })
}

export default async function BlogPage({ params }: LocalePageProps) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  const dict = getServerDictionary(locale)
  const posts = await getBlogList(locale)
  const topicSections = await getBlogTopics(locale, posts)
  const starterPosts = posts.slice(0, 3)
  const intro =
    locale === "zh"
      ? {
          eyebrow: "内容导航",
          starterTitle: "新手先看",
          featuredTitle: "推荐阅读",
          topicNavTitle: "热门主题",
          topicNavDescription: "按主题浏览",
          postsCount: (count: number) => `${count} 篇`,
          emptySectionTitle: "即将补充",
        }
      : {
          eyebrow: "Content Navigation",
          starterTitle: "Start Here",
          featuredTitle: "Recommended Reads",
          topicNavTitle: "Hot Topics",
          topicNavDescription: "Browse by topic",
          postsCount: (count: number) => `${count} posts`,
          emptySectionTitle: "Coming Soon",
        }

  return (
    <main
      id="top"
      className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.08),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,244,245,0.95))]"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-8 md:px-10 md:py-12">
        <header className="flex flex-col gap-6 rounded-[2rem] border border-border/70 bg-background/90 p-8 shadow-[0_16px_80px_rgba(15,23,42,0.06)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href={buildLocalizedPath(locale)}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {dict.blog.common.backToHome}
            </Link>
            <BlogLanguageToggle />
          </div>

          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-muted-foreground">
              {intro.eyebrow}
            </p>
            <h1 className="mt-4 font-serif text-5xl tracking-tight text-foreground">
              {dict.blog.list.title}
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {dict.blog.list.subtitle}
            </p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
          <div className="rounded-[2rem] border border-border/70 bg-background/95 p-8 shadow-[0_16px_60px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              <span>{intro.starterTitle}</span>
            </div>
            <h2 className="mt-4 font-serif text-3xl tracking-tight text-foreground">
              {intro.featuredTitle}
            </h2>
            <div className="mt-8 grid gap-4">
              {starterPosts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  {dict.blog.common.noPosts}
                </div>
              ) : (
                starterPosts.map((post, index) => (
                  <article
                    key={`starter-${post.slug}-${post.locale}`}
                    className="rounded-[1.5rem] border border-border/60 bg-muted/20 p-6 transition-colors hover:border-primary/30 hover:bg-background"
                  >
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span>{post.locale.toUpperCase()}</span>
                    </div>
                    <h3 className="mt-4 font-serif text-2xl tracking-tight text-foreground">
                      <Link
                        href={buildLocalizedPath(locale, `/blog/${post.slug}`)}
                        className="transition-colors hover:text-primary"
                      >
                        {post.title}
                      </Link>
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {post.summary}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-border/70 bg-background/95 p-8 shadow-[0_16px_60px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Compass className="h-4 w-4" />
              <span>{intro.topicNavTitle}</span>
            </div>
            <h2 className="mt-4 font-serif text-3xl tracking-tight text-foreground">
              {intro.topicNavDescription}
            </h2>
            <div className="mt-8 grid gap-3">
              {topicSections.map((topic) => (
                <a
                  key={topic.id}
                  href={`#${topic.anchor}`}
                  className="rounded-[1.25rem] border border-border/60 bg-muted/20 px-4 py-4 transition-colors hover:border-primary/30 hover:bg-background"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-foreground">{topic.label}</span>
                    <span className="text-xs text-muted-foreground">{intro.postsCount(topic.posts.length)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {topic.description}
                  </p>
                </a>
              ))}
            </div>
          </aside>
        </section>

        <section className="grid gap-6">
          {topicSections.map((topic) => (
            <section
              key={topic.id}
              id={topic.anchor}
              className="rounded-[2rem] border border-border/70 bg-background/95 p-8 shadow-[0_16px_60px_rgba(15,23,42,0.05)]"
            >
              <div className="flex flex-col gap-4 border-b border-border/70 pb-6 md:flex-row md:items-end md:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
                    {intro.topicNavTitle}
                  </p>
                  <h2 className="mt-3 font-serif text-3xl tracking-tight text-foreground">
                    {topic.label}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {topic.description}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {topic.audienceHint}
                  </p>
                </div>
                <a
                  href="#top"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {locale === "zh" ? "返回顶部" : "Back to top"}
                </a>
              </div>

              {topic.posts.length === 0 ? (
                <div className="mt-6 rounded-[1.5rem] border border-dashed border-border bg-muted/10 px-6 py-8 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{intro.emptySectionTitle}</p>
                  <p className="mt-2 leading-7">{topic.emptyState}</p>
                </div>
              ) : (
                <div className="mt-6 grid gap-5">
                  {topic.posts.map((post) => (
                    <article
                      key={`${topic.id}-${post.slug}-${post.locale}`}
                      className="rounded-[1.5rem] border border-border/60 bg-muted/20 p-6 transition-colors hover:border-primary/30 hover:bg-background"
                    >
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <span>{post.locale.toUpperCase()}</span>
                        {post.isFallback ? (
                          <>
                            <span className="h-1 w-1 rounded-full bg-border" />
                            <span>{dict.blog.common.fallbackNotice.replace("{locale}", post.locale.toUpperCase())}</span>
                          </>
                        ) : null}
                      </div>

                      <h3 className="mt-5 font-serif text-3xl tracking-tight text-foreground">
                        <Link
                          href={buildLocalizedPath(locale, `/blog/${post.slug}`)}
                          className="transition-colors hover:text-primary"
                        >
                          {post.title}
                        </Link>
                      </h3>
                      <p className="mt-4 text-sm leading-7 text-muted-foreground">
                        {post.summary}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
        </section>
      </div>
    </main>
  )
}
