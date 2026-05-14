import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ToolsPageContent } from "@/components/tools/tools-page-content"
import { buildLocalizedPath, isLocale, SUPPORTED_LOCALES } from "@/lib/i18n/route-locale"
import { buildMetadata } from "@/lib/seo"
import { TOOL_SLUGS, isToolSlug, type ToolSlug } from "@/lib/tools/catalog"

interface ToolDetailPageProps {
  params: Promise<{
    locale: string
    slug: string
  }>
}

const toolMetadata: Record<ToolSlug, { zh: string; en: string }> = {
  "ai-writer": { zh: "AI 写作", en: "AI Writer" },
  "smart-rewrite": { zh: "智能改写", en: "Smart Rewrite" },
  "image-generator": { zh: "AI 生图", en: "AI Image Generator" },
  infographic: { zh: "信息图", en: "Infographic" },
  "mind-map": { zh: "思维导图", en: "Mind Map" },
  "ai-charts": { zh: "AI 图表", en: "AI Charts" },
  "ppt-generator": { zh: "PPT 生成", en: "PPT Generator" },
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.flatMap((locale) =>
    TOOL_SLUGS.map((slug) => ({
      locale,
      slug,
    })),
  )
}

export async function generateMetadata({ params }: ToolDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params

  if (!isLocale(locale) || !isToolSlug(slug)) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const isZh = locale === "zh"
  const toolTitle = toolMetadata[slug][locale]

  return buildMetadata({
    title: isZh ? `${toolTitle} - 免费工具` : `${toolTitle} - Free Tool`,
    description: isZh
      ? `${toolTitle} 是 JoyfulWords 免费工具箱中的独立工具页面，当前功能预留中，后续支持分享、SEO 和任务中心联动。`
      : `${toolTitle} is an independent JoyfulWords free tool page prepared for sharing, SEO, and Task Center integration.`,
    path: buildLocalizedPath(locale, `/tools/${slug}`),
    locale,
    alternatePaths: {
      zh: buildLocalizedPath("zh", `/tools/${slug}`),
      en: buildLocalizedPath("en", `/tools/${slug}`),
    },
    keywords: isZh
      ? [toolTitle, "免费 AI 工具", "JoyfulWords 工具箱"]
      : [toolTitle, "free AI tool", "JoyfulWords toolbox"],
  })
}

export default async function ToolDetailPage({ params }: ToolDetailPageProps) {
  const { locale, slug } = await params

  if (!isLocale(locale) || !isToolSlug(slug)) {
    notFound()
  }

  return <ToolsPageContent selectedToolSlug={slug} />
}
