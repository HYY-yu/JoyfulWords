import type { Metadata } from "next"
import Link from "next/link"
import Script from "next/script"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { BlogLanguageToggle } from "@/components/blog/blog-language-toggle"
import { getBlogPostBySlug, getBlogSlugs } from "@/lib/blog"
import { getServerDictionary } from "@/lib/i18n/server"
import { buildLocalizedPath, getHtmlLang, isLocale, SUPPORTED_LOCALES } from "@/lib/i18n/route-locale"
import { buildCanonicalUrl, buildMetadata, DEFAULT_OG_IMAGE, SITE_NAME } from "@/lib/seo"

interface BlogPostPageProps {
  params: Promise<{
    locale: string
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

  return SUPPORTED_LOCALES.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug })),
  )
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { locale, slug } = await params

  if (!isLocale(locale)) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const post = await getBlogPostBySlug(slug, locale)

  if (!post || post.locale !== locale) {
    return {
      title: `Blog | ${SITE_NAME}`,
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  return buildMetadata({
    title: `${post.title}`,
    description: post.summary,
    path: buildLocalizedPath(locale, `/blog/${slug}`),
    locale,
    alternatePaths: {
      zh: buildLocalizedPath("zh", `/blog/${slug}`),
      en: buildLocalizedPath("en", `/blog/${slug}`),
    },
    type: "article",
    image: DEFAULT_OG_IMAGE,
  })
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale, slug } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  const dict = getServerDictionary(locale)
  const post = await getBlogPostBySlug(slug, locale)

  if (!post || post.locale !== locale) {
    notFound()
  }

  const articlePath = buildLocalizedPath(locale, `/blog/${slug}`)
  const blogPath = buildLocalizedPath(locale, "/blog")
  const homePath = buildLocalizedPath(locale)
  const articleUrl = buildCanonicalUrl(articlePath)
  const blogUrl = buildCanonicalUrl(blogPath)
  const homeUrl = buildCanonicalUrl(homePath)
  const organizationUrl = buildCanonicalUrl("/")
  const imageUrl = buildCanonicalUrl(DEFAULT_OG_IMAGE)
  const dateIso = new Date(post.date).toISOString()
  const blogPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: dateIso,
    dateModified: dateIso,
    inLanguage: getHtmlLang(locale),
    image: [imageUrl],
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: organizationUrl,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: organizationUrl,
      logo: {
        "@type": "ImageObject",
        url: imageUrl,
      },
    },
  }
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: locale === "zh" ? "首页" : "Home",
        item: homeUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: locale === "zh" ? "博客" : "Blog",
        item: blogUrl,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: articleUrl,
      },
    ],
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.08),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,244,245,0.95))]">
      <Script
        id={`blogposting-jsonld-${locale}-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd) }}
      />
      <Script
        id={`breadcrumb-jsonld-${locale}-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-8 md:px-10 md:py-12">
        <header className="rounded-[2rem] border border-border/70 bg-background/90 p-8 shadow-[0_16px_80px_rgba(15,23,42,0.06)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href={buildLocalizedPath(locale, "/blog")}
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
