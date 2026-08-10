import type { Metadata } from "next"
import Script from "next/script"
import { notFound } from "next/navigation"
import { ToolsPageContent } from "@/components/tools/tools-page-content"
import { buildLocalizedPath, isLocale, SUPPORTED_LOCALES } from "@/lib/i18n/route-locale"
import { buildCanonicalUrl, buildMetadata, SITE_NAME } from "@/lib/seo"
import { TOOL_INDEX_SLUGS } from "@/lib/tools/catalog"

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
    title: isZh ? "免费工具箱" : "Creator Toolbox",
    description: isZh
      ? "JoyfulWords 免费工具箱提供生图、信息图、图表、PPT 和文档转换等创作者工具入口，支持独立页面分享和 SEO 收录。"
      : "JoyfulWords Creator Toolbox collects image, infographic, chart, PPT, and document conversion tools as shareable SEO-ready pages.",
    path: buildLocalizedPath(locale, "/tools"),
    locale,
    alternatePaths: {
      zh: buildLocalizedPath("zh", "/tools"),
      en: buildLocalizedPath("en", "/tools"),
    },
    keywords: isZh
      ? ["免费 AI 工具", "创作者工具箱", "AI 生图工具", "PPT 生成工具", "Markdown 转 Word"]
      : ["free AI tools", "creator toolbox", "AI image tool", "PPT generator", "Markdown to Word"],
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
    name: locale === "zh" ? "JoyfulWords 免费工具箱" : "JoyfulWords Creator Toolbox",
    description:
      locale === "zh"
        ? "面向创作者的免费工具目录，覆盖视觉生成、数据可视化和文档转换。"
        : "A creator toolbox directory covering visual generation, data visualization, and document conversion.",
    url: buildCanonicalUrl(buildLocalizedPath(locale, "/tools")),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: buildCanonicalUrl("/"),
    },
    hasPart: TOOL_INDEX_SLUGS.map((slug) => ({
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
