import type { Metadata } from "next"
import { APP_URL } from "@/lib/config"
import { getHreflang, getOpenGraphLocale, stripLocalePrefix } from "@/lib/i18n/route-locale"
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
  xDefaultPath?: string | null
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
  xDefaultPath,
  keywords,
  type = "website",
  image = DEFAULT_OG_IMAGE,
}: BuildMetadataOptions): Metadata {
  const canonical = buildCanonicalUrl(path)
  const imageUrl = resolveAssetUrl(image)
  const fullTitle = `${title} | ${SITE_NAME}`
  const languageAlternates: Record<string, string> = {
    [getHreflang(locale)]: canonical,
  }

  for (const [alternateLocale, alternatePath] of Object.entries(alternatePaths ?? {})) {
    if (!alternatePath) continue
    const localeKey = alternateLocale as Locale
    languageAlternates[getHreflang(localeKey)] = buildCanonicalUrl(alternatePath)
  }

  const resolvedXDefaultPath = xDefaultPath === undefined ? stripLocalePrefix(path) : xDefaultPath
  if (resolvedXDefaultPath) {
    languageAlternates["x-default"] = buildCanonicalUrl(resolvedXDefaultPath)
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
          url: imageUrl,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageUrl],
    },
  }
}

export function buildCanonicalUrl(path: string): string {
  return new URL(path, SITE_ORIGIN).toString()
}

function resolveAssetUrl(input: string): string {
  if (input.startsWith("http://") || input.startsWith("https://")) {
    return input
  }

  if (input.startsWith("/")) {
    return buildCanonicalUrl(input)
  }

  return buildCanonicalUrl(`/${input}`)
}
