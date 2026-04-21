import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PrivacyPolicyPageContent } from "@/components/legal/privacy-policy-page-content"
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
    title: dict.privacyPolicy.title,
    description: dict.privacyPolicy.subtitle,
    path: buildLocalizedPath(locale, "/privacy-policy"),
    locale,
    alternatePaths: {
      zh: buildLocalizedPath("zh", "/privacy-policy"),
      en: buildLocalizedPath("en", "/privacy-policy"),
    },
  })
}

export default async function PrivacyPolicyPage({ params }: LocalePageProps) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  return <PrivacyPolicyPageContent />
}
