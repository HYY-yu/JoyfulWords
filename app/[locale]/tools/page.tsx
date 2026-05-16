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
    title: isZh ? "免费工具箱" : "Creator Toolbox",
    description: isZh
      ? "JoyfulWords 免费工具箱提供 Create Image、Style Image、图片拆分和信息图等独立创作者工具，支持游客体验和任务中心联动。"
      : "JoyfulWords Creator Toolbox provides Create Image, Style Image, Image Split, and Infographic tools with guest access and Task Center integration.",
    path: buildLocalizedPath(locale, "/tools"),
    locale,
    alternatePaths: {
      zh: buildLocalizedPath("zh", "/tools"),
      en: buildLocalizedPath("en", "/tools"),
    },
    keywords: isZh
      ? ["免费 AI 工具", "创作者工具箱", "AI 生图工具", "Style Image", "信息图工具"]
      : ["free AI tools", "creator toolbox", "AI image tool", "Style Image", "infographic tool"],
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
        ? "面向创作者的免费工具目录，包含 Create Image、Style Image、图片拆分和信息图。"
        : "A creator toolbox directory for Create Image, Style Image, Image Split, and Infographic tools.",
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
