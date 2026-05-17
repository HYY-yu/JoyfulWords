import type { Metadata } from "next"
import Script from "next/script"
import { notFound } from "next/navigation"
import { BlogLearningHub, type BlogLearningHubPost } from "@/components/blog/blog-learning-hub"
import { getBlogList, type BlogListItem } from "@/lib/blog"
import { getBlogTopics } from "@/lib/blog-topics"
import { getServerDictionary } from "@/lib/i18n/server"
import { buildLocalizedPath, getHtmlLang, isLocale, SUPPORTED_LOCALES } from "@/lib/i18n/route-locale"
import { buildCanonicalUrl, buildMetadata, SITE_NAME } from "@/lib/seo"

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
    title: isZh ? "教程中心" : "Tutorial Hub",
    description: isZh
      ? "按学习路线浏览 JoyfulWords 的 AI 写作、SEO 内容、素材管理、视觉内容和内容复用教程。"
      : "Browse JoyfulWords tutorials for AI writing, SEO content, material management, visual creation, and content reuse workflows.",
    path: buildLocalizedPath(locale, "/blog"),
    locale,
    alternatePaths: {
      zh: buildLocalizedPath("zh", "/blog"),
      en: buildLocalizedPath("en", "/blog"),
    },
    keywords: isZh
      ? ["AI写作教程", "SEO内容创作教程", "博客写作流程", "内容营销写作", "JoyfulWords教程"]
      : ["AI writing tutorial", "SEO content creation tutorial", "blog writing workflow", "content marketing writing", "JoyfulWords tutorial"],
  })
}

function decoratePost(post: BlogListItem, locale: "zh" | "en"): BlogLearningHubPost {
  return {
    ...post,
    formattedDate: formatDate(post.date, locale),
  }
}

export default async function BlogPage({ params }: LocalePageProps) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  const dict = getServerDictionary(locale)
  const posts = await getBlogList(locale)
  const topicSections = await getBlogTopics(locale, posts)
  const decoratedPosts = posts.map((post) => decoratePost(post, locale))
  const decoratedTopicSections = topicSections.map((topic) => ({
    ...topic,
    posts: topic.posts.map((post) => decoratePost(post, locale)),
  }))
  const copy =
    locale === "zh"
      ? {
          backToHome: dict.blog.common.backToHome,
          backToTop: "返回顶部",
          clearFilters: "清除筛选",
          continueLearning: "继续学习",
          emptyText: "换个关键词试试，或者清除筛选回到完整教程路线。",
          emptyTitle: "没有匹配的教程",
          fallbackNotice: dict.blog.common.fallbackNotice,
          featuredLabel: "建议先看",
          introChips: ["从起稿到发布", "素材库工作流", "AI 配图实战", "文章复用成 PPT"],
          lessonLabel: "教程模块",
          lessonsLabel: "教程",
          modulesLabel: "模块",
          overline: "JoyfulWords 教程路线",
          pathDescription: "按顺序学习，也可以从当前卡点切入。",
          pathTitle: "学习路线",
          readMore: dict.blog.common.readMore,
          resultLabel: "当前结果",
          searchLabel: "搜索教程",
          searchPlaceholder: "搜索标题、主题、关键词",
          showAll: "全部教程",
          subtitle: "把 AI 写作、素材整理、配图、SEO 和 PPT 复用拆成可跟练的步骤。选一个主题，边看边在 JoyfulWords 里完成一次内容生产。",
          title: "从第一篇文章到可发布内容",
          topicFilterLabel: "主题筛选",
          updatedLabel: "最近更新",
        }
      : {
          backToHome: dict.blog.common.backToHome,
          backToTop: "Back to top",
          clearFilters: "Clear filters",
          continueLearning: "Continue learning",
          emptyText: "Try another keyword or clear filters to return to the full tutorial path.",
          emptyTitle: "No matching tutorials",
          fallbackNotice: dict.blog.common.fallbackNotice,
          featuredLabel: "Start here",
          introChips: ["Draft to publish", "Material library workflow", "AI visual practice", "Reuse posts as decks"],
          lessonLabel: "Tutorial module",
          lessonsLabel: "Tutorials",
          modulesLabel: "Modules",
          overline: "JoyfulWords Tutorial Path",
          pathDescription: "Follow the route in order, or jump into the blocker you have today.",
          pathTitle: "Learning path",
          readMore: dict.blog.common.readMore,
          resultLabel: "Current results",
          searchLabel: "Search tutorials",
          searchPlaceholder: "Search titles, topics, or keywords",
          showAll: "All tutorials",
          subtitle: "Learn AI writing, materials, visuals, SEO, and presentation reuse as practical steps you can follow inside JoyfulWords.",
          title: "From first draft to publishable content",
          topicFilterLabel: "Topic filters",
          updatedLabel: "Latest update",
        }
  const blogUrl = buildCanonicalUrl(buildLocalizedPath(locale, "/blog"))
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: locale === "zh" ? "JoyfulWords 教程中心" : "JoyfulWords Tutorial Hub",
    description: copy.subtitle,
    url: blogUrl,
    inLanguage: getHtmlLang(locale),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: buildCanonicalUrl("/"),
    },
    itemListElement: posts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.summary,
        url: buildCanonicalUrl(buildLocalizedPath(locale, `/blog/${post.slug}`)),
        datePublished: new Date(post.date).toISOString(),
        inLanguage: getHtmlLang(post.locale),
        image: post.image ? buildCanonicalUrl(post.image) : undefined,
      },
    })),
  }
  return (
    <>
      <Script
        id={`blog-itemlist-jsonld-${locale}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <BlogLearningHub
        copy={copy}
        locale={locale}
        posts={decoratedPosts}
        topicSections={decoratedTopicSections}
      />
    </>
  )
}
