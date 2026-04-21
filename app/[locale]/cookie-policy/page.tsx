import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CookiePolicyPageContent } from "@/components/legal/cookie-policy-page-content"
import { getServerDictionary } from "@/lib/i18n/server"
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

  const dict = getServerDictionary(locale)

  return buildMetadata({
    title: dict.cookiePolicy.title,
    description: dict.cookiePolicy.subtitle,
    path: buildLocalizedPath(locale, "/cookie-policy"),
    locale,
    alternatePaths: {
      zh: buildLocalizedPath("zh", "/cookie-policy"),
      en: buildLocalizedPath("en", "/cookie-policy"),
    },
  })
}

export default async function CookiePolicyPage({ params }: LocalePageProps) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  return <CookiePolicyPageContent />
}
