import type { Metadata } from "next"
import { APP_URL } from "@/lib/config"
import { getHreflang, getOpenGraphLocale } from "@/lib/i18n/route-locale"
import type { Locale } from "@/lib/i18n/shared"

export const SITE_NAME = "JoyfulWords"
export const SITE_URL = APP_URL.startsWith("http") ? APP_URL : "https://joyword.link"
export const SITE_ORIGIN = new URL(SITE_URL)
export const DEFAULT_OG_IMAGE = "/og/default.png"

interface BuildMetadataOptions {
  title: string
  description: string
  path: string
  locale: Locale
  alternatePaths?: Partial<Record<Locale, string>>
  keywords?: string[]
  type?: "website" | "article"
  image?: string
}

export function buildMetadata({
  title,
  description,
  path,
  locale,
  alternatePaths,
  keywords,
  type = "website",
  image = DEFAULT_OG_IMAGE,
}: BuildMetadataOptions): Metadata {
  const canonical = buildCanonicalUrl(path)
  const fullTitle = `${title} | ${SITE_NAME}`
  const languageAlternates: Record<string, string> = {
    [getHreflang(locale)]: canonical,
  }

  for (const [alternateLocale, alternatePath] of Object.entries(alternatePaths ?? {})) {
    if (!alternatePath) continue
    const localeKey = alternateLocale as Locale
    languageAlternates[getHreflang(localeKey)] = buildCanonicalUrl(alternatePath)
  }

  return {
    title: fullTitle,
    description,
    keywords,
    alternates: {
      canonical,
      languages: languageAlternates,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type,
      locale: getOpenGraphLocale(locale),
      images: [
        {
          url: image,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
  }
}

export function buildCanonicalUrl(path: string): string {
  return new URL(path, SITE_ORIGIN).toString()
}
