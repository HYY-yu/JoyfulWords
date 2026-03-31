import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Compass, Library, Sparkles } from "lucide-react"
import { BlogLanguageToggle } from "@/components/blog/blog-language-toggle"
import { getBlogList } from "@/lib/blog"
import { getServerDictionary, getServerLocale } from "@/lib/i18n/server"
import { getBlogTopics } from "@/lib/blog-topics"
import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Blog",
    description:
      "Explore JoyfulWords articles on AI writing, SEO content creation, blogging workflows, visuals, and content production systems.",
    path: "/blog",
    keywords: [
      "AI writing blog",
      "SEO content creation",
      "blog writing workflow",
      "content marketing writing",
      "JoyfulWords blog",
    ],
  }),
}

function formatDate(dateString: string, locale: "zh" | "en") {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateString))
}

export default async function BlogPage() {
  const locale = await getServerLocale()
  const dict = getServerDictionary(locale)
  const posts = await getBlogList(locale)
  const topicSections = getBlogTopics(locale, posts)
  const starterPosts = posts.slice(0, 3)
  const intro = locale === "zh"
    ? {
        eyebrow: "Content Navigation",
        title: "按主题进入 JoyfulWords 博客",
        description: "这里不只是文章列表。你可以按主题找到 AI 写作、SEO 内容优化、内容工作流、AI 配图和素材管理相关内容。",
        starterTitle: "新手先看",
        starterDescription: "如果你是第一次来到 JoyfulWords 博客，先从这些文章开始理解产品和内容方向。",
        featuredTitle: "推荐阅读",
        featuredDescription: "优先展示与产品定位最接近、最适合建立整体理解的文章。",
        topicNavTitle: "热门主题",
        topicNavDescription: "按问题进入，而不是按发布日期翻找。",
        topicLinkLabel: "进入主题",
        postsCount: (count: number) => `${count} 篇`,
        latestTitle: "最新文章",
        latestDescription: "按时间查看最新发布内容。",
        emptySectionTitle: "即将补充",
      }
    : {
        eyebrow: "Content Navigation",
        title: "Explore the JoyfulWords Blog by Topic",
        description: "This page is more than a reverse-chronological feed. Use it to jump into AI writing, SEO content, creation workflows, AI visuals, and material management.",
        starterTitle: "Start Here",
        starterDescription: "If you are new to JoyfulWords, begin with these articles to understand the product and content direction.",
        featuredTitle: "Recommended Reads",
        featuredDescription: "High-priority pieces that explain the product, workflow, and editorial direction.",
        topicNavTitle: "Hot Topics",
        topicNavDescription: "Navigate by problem space instead of publication date.",
        topicLinkLabel: "Open Topic",
        postsCount: (count: number) => `${count} posts`,
        latestTitle: "Latest Posts",
        latestDescription: "Browse the newest published content in chronological order.",
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
              href="/"
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
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
              {intro.description}
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
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              {intro.featuredDescription}
            </p>

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
                      <Link href={`/blog/${post.slug}`} className="transition-colors hover:text-primary">
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
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {locale === "zh"
                ? "每个主题都会沉淀成一个内容集群。即使现在文章数量还少，也先把结构搭好。"
                : "Each topic is designed to become a content cluster. The structure is in place before the archive gets large."}
            </p>

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
                <div className="rounded-[1.5rem] border border-dashed border-border bg-muted/10 px-6 py-8 text-sm text-muted-foreground mt-6">
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
                        <Link href={`/blog/${post.slug}`} className="transition-colors hover:text-primary">
                          {post.title}
                        </Link>
                      </h3>
                      <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
                        {post.summary}
                      </p>

                      <div className="mt-8">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
                        >
                          {dict.blog.common.readMore}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
        </section>

        {posts.length === 0 ? (
          <section className="rounded-[2rem] border border-dashed border-border bg-background/90 p-12 text-center text-muted-foreground">
            {dict.blog.common.noPosts}
          </section>
        ) : (
          <section className="rounded-[2rem] border border-border/70 bg-background/95 p-8 shadow-[0_16px_60px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Library className="h-4 w-4" />
              <span>{intro.latestTitle}</span>
            </div>
            <h2 className="mt-4 font-serif text-3xl tracking-tight text-foreground">
              {intro.latestDescription}
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {locale === "zh"
                ? "保留按时间查看的入口，但它不再是博客页唯一结构。"
                : "Chronological browsing still exists, but it is no longer the only structure on the page."}
            </p>

            <div className="mt-8 grid gap-6">
            {posts.map((post) => (
              <article
                key={`${post.slug}-${post.locale}`}
                className="rounded-[2rem] border border-border/70 bg-background/95 p-8 shadow-[0_16px_60px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-0.5"
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

                <h2 className="mt-5 font-serif text-3xl tracking-tight text-foreground">
                  <Link href={`/blog/${post.slug}`} className="transition-colors hover:text-primary">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
                  {post.summary}
                </p>

                <div className="mt-8">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {dict.blog.common.readMore}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
