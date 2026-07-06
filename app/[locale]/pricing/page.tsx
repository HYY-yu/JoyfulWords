import type { Metadata } from "next"
import Script from "next/script"
import { notFound } from "next/navigation"
import { PricingPageContent } from "@/components/home/pricing-page-content"
import { buildLocalizedPath, isLocale, SUPPORTED_LOCALES } from "@/lib/i18n/route-locale"
import { buildCanonicalUrl, buildMetadata, SITE_NAME } from "@/lib/seo"

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
    title: isZh ? "价格 - Pay as you go" : "Pricing - Pay as you go",
    description: isZh
      ? "JoyfulWords 使用随用随充的积分价格体系，无需订阅。查看 AI 写作、生图、素材搜索和 PPT 生成价格。"
      : "JoyfulWords uses pay-as-you-go credits with no subscription. See pricing for AI writing, image generation, material search, and PPT generation.",
    path: buildLocalizedPath(locale, "/pricing"),
    locale,
    alternatePaths: {
      zh: buildLocalizedPath("zh", "/pricing"),
      en: buildLocalizedPath("en", "/pricing"),
    },
    keywords: isZh
      ? ["JoyfulWords 价格", "AI 写作价格", "AI 生图价格", "随用随充", "积分计费"]
      : ["JoyfulWords pricing", "AI writing pricing", "AI image pricing", "pay as you go", "credit billing"],
  })
}

export default async function PricingPage({ params }: LocalePageProps) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: locale === "zh" ? "JoyfulWords 积分价格" : "JoyfulWords credit pricing",
    url: buildCanonicalUrl(buildLocalizedPath(locale, "/pricing")),
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: buildCanonicalUrl("/"),
    },
    itemListElement: [
      {
        "@type": "Offer",
        name: locale === "zh" ? "普通模型" : "Standard models",
        description: locale === "zh" ? "1 积分/k token input，3 积分/k token output" : "1 credit / 1K input tokens, 3 credits / 1K output tokens",
      },
      {
        "@type": "Offer",
        name: locale === "zh" ? "高级模型" : "Premium models",
        description: locale === "zh" ? "2 积分/k token input，10 积分/k token output" : "2 credits / 1K input tokens, 10 credits / 1K output tokens",
      },
      {
        "@type": "Offer",
        name: locale === "zh" ? "AI 生图" : "AI image generation",
        description: locale === "zh" ? "1 到 8 积分/张" : "1 to 8 credits per image",
      },
      {
        "@type": "Offer",
        name: locale === "zh" ? "PPT 生成" : "PPT generation",
        description: locale === "zh" ? "1 积分/张" : "1 credit per slide",
      },
    ],
  }

  return (
    <>
      <Script
        id={`joyfulwords-pricing-offers-${locale}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PricingPageContent />
    </>
  )
}
