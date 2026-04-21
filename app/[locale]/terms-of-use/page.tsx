import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { TermsOfUsePageContent } from "@/components/legal/terms-of-use-page-content"
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
    title: dict.termsOfUse.title,
    description: dict.termsOfUse.subtitle,
    path: buildLocalizedPath(locale, "/terms-of-use"),
    locale,
    alternatePaths: {
      zh: buildLocalizedPath("zh", "/terms-of-use"),
      en: buildLocalizedPath("en", "/terms-of-use"),
    },
  })
}

export default async function TermsOfUsePage({ params }: LocalePageProps) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  return <TermsOfUsePageContent />
}
