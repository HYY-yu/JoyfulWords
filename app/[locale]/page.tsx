import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { HomePageContent } from "@/components/home/home-page-content"
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
    title: isZh ? "AI 内容创作工作台" : "AI Content Creation Workspace",
    description: isZh
      ? "JoyfulWords 是面向正式内容生产的 AI 内容创作工作台，把 AI 写作、AI 配图、素材管理和 SEO 优化整合进同一工作流。"
      : "JoyfulWords is an AI content creation workspace for writing, visuals, material management, and SEO optimization.",
    path: buildLocalizedPath(locale),
    locale,
    alternatePaths: {
      zh: buildLocalizedPath("zh"),
      en: buildLocalizedPath("en"),
    },
    keywords: isZh
      ? ["AI内容创作工具", "AI写作工作台", "博客写作工具", "SEO内容创作", "内容创作工作流"]
      : ["AI content creation tool", "AI writing workspace", "blog writing tool", "SEO content creation", "content workflow"],
  })
}

export default async function LocaleHomePage({ params }: LocalePageProps) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  return <HomePageContent />
}
