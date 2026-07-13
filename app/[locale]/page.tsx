import type { Metadata } from "next"
import Script from "next/script"
import { notFound } from "next/navigation"
import { HomePageContent } from "@/components/home/home-page-content"
import { en } from "@/lib/i18n/locales/en"
import { zh } from "@/lib/i18n/locales/zh"
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
      ? "JoyfulWords 是 AI 内容创作工作台，快速找寻素材、生成文章，再一键转换成信息图、PPT 和思维导图。注册送 3000 积分。"
      : "JoyfulWords is an AI content creation workspace that turns research and one article into an infographic, presentation, and mind map.",
    path: buildLocalizedPath(locale),
    locale,
    alternatePaths: {
      zh: buildLocalizedPath("zh"),
      en: buildLocalizedPath("en"),
    },
    keywords: isZh
      ? ["AI内容创作工具", "AI写作工作台", "AI信息图", "AI生成PPT", "AI思维导图"]
      : ["AI content creation tool", "AI writing workspace", "AI infographic", "AI presentation generator", "AI mind map"],
  })
}

export default async function LocaleHomePage({ params }: LocalePageProps) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  const dictionary = locale === "zh" ? zh : en
  const faqKeys = ["free", "chatgpt", "exports", "copyright", "collaboration"] as const
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale === "zh" ? "zh-CN" : "en-US",
    mainEntity: faqKeys.map((key) => ({
      "@type": "Question",
      name: dictionary.landing.faq.items[key].question,
      acceptedAnswer: {
        "@type": "Answer",
        text: dictionary.landing.faq.items[key].answer,
      },
    })),
  }

  return (
    <>
      <Script
        id={`joyfulwords-home-faq-${locale}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <HomePageContent />
    </>
  )
}
