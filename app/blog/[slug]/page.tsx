import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { BlogLanguageToggle } from "@/components/blog/blog-language-toggle"
import { getBlogPostBySlug, getBlogSlugs } from "@/lib/blog"
import { getServerDictionary, getServerLocale } from "@/lib/i18n/server"
import { buildCanonicalUrl, DEFAULT_OG_IMAGE, SITE_NAME } from "@/lib/seo"

interface BlogPostPageProps {
  params: Promise<{
    slug: string
  }>
}

function formatDate(dateString: string, locale: "zh" | "en") {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateString))
}

export async function generateStaticParams() {
  const slugs = await getBlogSlugs()

  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug, "zh") ?? await getBlogPostBySlug(slug, "en")

  if (!post) {
    return {
      title: `Blog | ${SITE_NAME}`,
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const canonical = buildCanonicalUrl(`/blog/${slug}`)
  const title = `${post.title} | ${SITE_NAME}`

  return {
    title,
    description: post.summary,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description: post.summary,
      type: "article",
      url: canonical,
      siteName: SITE_NAME,
      publishedTime: post.date,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: post.summary,
      images: [DEFAULT_OG_IMAGE],
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const locale = await getServerLocale()
  const dict = getServerDictionary(locale)
  const post = await getBlogPostBySlug(slug, locale)

  if (!post) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.08),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,244,245,0.95))]">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-8 md:px-10 md:py-12">
        <header className="rounded-[2rem] border border-border/70 bg-background/90 p-8 shadow-[0_16px_80px_rgba(15,23,42,0.06)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {dict.blog.common.backToBlog}
            </Link>
            <BlogLanguageToggle />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{dict.blog.detail.articleLabel}</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>{post.locale.toUpperCase()}</span>
          </div>

          <h1 className="mt-5 font-serif text-5xl leading-tight tracking-tight text-foreground">
            {post.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            {post.summary}
          </p>
          {post.isFallback ? (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {dict.blog.common.fallbackNotice.replace("{locale}", post.locale.toUpperCase())}
            </p>
          ) : null}
        </header>

        <article
          className="blog-content rounded-[2rem] border border-border/70 bg-background/95 p-8 shadow-[0_16px_60px_rgba(15,23,42,0.05)] md:p-10"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
      </div>
    </main>
  )
}
