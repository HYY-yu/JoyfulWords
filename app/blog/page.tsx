import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { BlogLanguageToggle } from "@/components/blog/blog-language-toggle"
import { getBlogList } from "@/lib/blog"
import { getServerDictionary, getServerLocale } from "@/lib/i18n/server"

export const metadata: Metadata = {
  title: "Blog | JoyfulWords",
  description: "Markdown-driven blog posts for JoyfulWords.",
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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.08),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,244,245,0.95))]">
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
              JoyfulWords
            </p>
            <h1 className="mt-4 font-serif text-5xl tracking-tight text-foreground">
              {dict.blog.list.title}
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {dict.blog.list.subtitle}
            </p>
          </div>
        </header>

        {posts.length === 0 ? (
          <section className="rounded-[2rem] border border-dashed border-border bg-background/90 p-12 text-center text-muted-foreground">
            {dict.blog.common.noPosts}
          </section>
        ) : (
          <section className="grid gap-6">
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
          </section>
        )}
      </div>
    </main>
  )
}
