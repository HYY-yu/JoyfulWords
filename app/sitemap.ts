import type { MetadataRoute } from "next"
import { getBlogSitemapEntries } from "@/lib/blog"
import { buildLocalizedPath, getHreflang, SUPPORTED_LOCALES } from "@/lib/i18n/route-locale"
import { buildCanonicalUrl } from "@/lib/seo"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const blogEntries = await getBlogSitemapEntries()

  const staticPages = [
    { path: "/", changeFrequency: "weekly" as const, priority: 1 },
    { path: "/mcp", changeFrequency: "monthly" as const, priority: 0.75 },
    { path: "/blog", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/privacy-policy", changeFrequency: "yearly" as const, priority: 0.2 },
    { path: "/cookie-policy", changeFrequency: "yearly" as const, priority: 0.2 },
    { path: "/terms-of-use", changeFrequency: "yearly" as const, priority: 0.2 },
  ]

  const localizedStaticPages: MetadataRoute.Sitemap = staticPages.flatMap((page) => {
    const alternates = Object.fromEntries(
      SUPPORTED_LOCALES.map((locale) => [
        getHreflang(locale),
        buildCanonicalUrl(buildLocalizedSitemapPath(locale, page.path)),
      ]),
    )

    alternates["x-default"] = buildCanonicalUrl(page.path)

    return SUPPORTED_LOCALES.map((locale) => ({
      url: buildCanonicalUrl(buildLocalizedSitemapPath(locale, page.path)),
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: alternates,
      },
    }))
  })

  const blogPages: MetadataRoute.Sitemap = blogEntries.map((entry) => {
    const alternates = Object.fromEntries(
      entry.availableLocales.map((locale) => [
        getHreflang(locale),
        buildCanonicalUrl(buildLocalizedPath(locale, `/blog/${entry.slug}`)),
      ]),
    )

    alternates["x-default"] = buildCanonicalUrl(`/blog/${entry.slug}`)

    return {
      url: buildCanonicalUrl(buildLocalizedPath(entry.locale, `/blog/${entry.slug}`)),
      lastModified: new Date(entry.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: {
        languages: alternates,
      },
    }
  })

  return [...localizedStaticPages, ...blogPages]
}

function buildLocalizedSitemapPath(
  locale: (typeof SUPPORTED_LOCALES)[number],
  path: string,
): string {
  if (path === "/") {
    return buildLocalizedPath(locale)
  }

  return buildLocalizedPath(locale, path)
}
