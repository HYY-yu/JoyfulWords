import type { Metadata } from "next"
import Script from "next/script"
import { notFound } from "next/navigation"
import { ToolsPageContent } from "@/components/tools/tools-page-content"
import { buildLocalizedPath, isLocale, SUPPORTED_LOCALES } from "@/lib/i18n/route-locale"
import { buildCanonicalUrl, buildMetadata, SITE_NAME } from "@/lib/seo"
import { TOOL_SLUGS } from "@/lib/tools/catalog"

interface LocalePageProps {
  params: Promise<{
    locale: string
  }>
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
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
    title: isZh ? "免费工具箱" : "Free Creator Tools",
    description: isZh
      ? "JoyfulWords 免费工具箱提供 AI 写作、改写、生图、图表、思维导图、PPT 等创作者工具入口，支持独立页面分享和 SEO 收录。"
      : "JoyfulWords free creator tools collect AI writing, rewriting, image, chart, mind map, and PPT tools as shareable SEO-ready pages.",
    path: buildLocalizedPath(locale, "/tools"),
    locale,
    alternatePaths: {
      zh: buildLocalizedPath("zh", "/tools"),
      en: buildLocalizedPath("en", "/tools"),
    },
    keywords: isZh
      ? ["免费 AI 工具", "创作者工具箱", "AI 写作工具", "AI 生图工具", "PPT 生成工具"]
      : ["free AI tools", "creator toolbox", "AI writing tool", "AI image tool", "PPT generator"],
  })
}

export default async function ToolsPage({ params }: LocalePageProps) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: locale === "zh" ? "JoyfulWords 免费工具箱" : "JoyfulWords Free Creator Tools",
    description:
      locale === "zh"
        ? "面向创作者的免费工具目录，每个工具都预留独立页面，便于分享和 SEO 收录。"
        : "A free creator tool directory with independent pages prepared for sharing and SEO.",
    url: buildCanonicalUrl(buildLocalizedPath(locale, "/tools")),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: buildCanonicalUrl("/"),
    },
    hasPart: TOOL_SLUGS.map((slug) => ({
      "@type": "WebPage",
      name: slug,
      url: buildCanonicalUrl(buildLocalizedPath(locale, `/tools/${slug}`)),
    })),
  }

  return (
    <>
      <Script
        id={`joyfulwords-tools-collection-${locale}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ToolsPageContent />
    </>
  )
}
